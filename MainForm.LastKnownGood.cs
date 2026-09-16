using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private const string SuiteVersion = "3.5.1.0";

        private sealed class DailyLkgResult
        {
            public bool Success { get; set; }
            public bool Created { get; set; }
            public bool AlreadyCurrent { get; set; }
            public string SnapshotPath { get; set; } = "";
            public string Message { get; set; } = "";
        }

        private DailyLkgResult EnsureDailyLastKnownGoodSnapshot()
        {
            EnsureFolders();
            string backupRoot = Path.GetFullPath(Path.Combine(settings.DataRoot, "Backups", "Last Known Good"));
            string currentDir = Path.GetFullPath(Path.Combine(backupRoot, "Current"));
            string locksDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Locks"));
            string coordinationPath = Path.GetFullPath(Path.Combine(locksDir, "daily-last-known-good.lock"));
            Directory.CreateDirectory(backupRoot);
            Directory.CreateDirectory(locksDir);

            FileStream? coordination = null;
            try
            {
                // FileShare.None provides short-duration cross-workstation coordination without
                // introducing live-data write locking. A crashed process releases the handle.
                for (int attempt = 0; attempt < 75 && coordination == null; attempt++)
                {
                    try
                    {
                        coordination = new FileStream(coordinationPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
                    }
                    catch (IOException)
                    {
                        Thread.Sleep(200);
                    }
                }

                if (coordination == null)
                {
                    return new DailyLkgResult
                    {
                        Success = false,
                        Message = "The daily Last-Known-Good snapshot coordinator remained busy. The suite will continue, but this workstation could not confirm today's snapshot."
                    };
                }

                string today = DateTime.Now.ToString("yyyy-MM-dd");
                if (DailyLkgSnapshotMatchesDate(currentDir, today))
                {
                    return new DailyLkgResult
                    {
                        Success = true,
                        AlreadyCurrent = true,
                        SnapshotPath = currentDir,
                        Message = "Today's Last-Known-Good suite snapshot already exists."
                    };
                }

                return CreateDailyLastKnownGoodSnapshot(backupRoot, currentDir, today);
            }
            catch (Exception ex)
            {
                WriteDailyLkgFailureLog(backupRoot, ex.Message);
                return new DailyLkgResult
                {
                    Success = false,
                    Message = "Daily Last-Known-Good snapshot was not created. The previous verified snapshot was preserved. Details: " + ex.Message
                };
            }
            finally
            {
                coordination?.Dispose();
            }
        }

        private bool DailyLkgSnapshotMatchesDate(string currentDir, string date)
        {
            try
            {
                string manifestPath = Path.Combine(currentDir, "manifest.json");
                if (!File.Exists(manifestPath)) return false;
                using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(manifestPath));
                JsonElement root = doc.RootElement;
                string snapshotDate = root.TryGetProperty("snapshotDate", out JsonElement sd) ? sd.GetString() ?? "" : "";
                string status = root.TryGetProperty("status", out JsonElement st) ? st.GetString() ?? "" : "";
                return string.Equals(snapshotDate, date, StringComparison.Ordinal) && string.Equals(status, "verified", StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        private DailyLkgResult CreateDailyLastKnownGoodSnapshot(string backupRoot, string currentDir, string today)
        {
            string dataDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data"));
            if (!Directory.Exists(dataDir)) throw new DirectoryNotFoundException("The live Data folder was not found: " + dataDir);

            List<string> sourceFiles = DailyLkgSourceFiles(dataDir);
            if (sourceFiles.Count == 0) throw new InvalidDataException("The live Data folder contains no production files to snapshot.");

            // Validate every live JSON file before any snapshot can replace yesterday's LKG,
            // and capture source hashes so a file changing during the snapshot is detected.
            var sourceHashes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (string source in sourceFiles)
            {
                if (source.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                {
                    string json = File.ReadAllText(source);
                    ValidateJsonPayload(json, "Daily LKG source " + Path.GetRelativePath(dataDir, source));
                }
                sourceHashes[source] = Sha256File(source);
            }

            string stagingDir = Path.GetFullPath(Path.Combine(backupRoot, ".staging-" + Guid.NewGuid().ToString("N")));
            string stagingData = Path.Combine(stagingDir, "Data");
            Directory.CreateDirectory(stagingData);

            var manifestFiles = new List<object>();
            long totalBytes = 0;
            try
            {
                foreach (string source in sourceFiles)
                {
                    string relative = Path.GetRelativePath(dataDir, source);
                    if (relative.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal) || Path.IsPathRooted(relative))
                        throw new InvalidOperationException("A live Data file resolved outside the approved Data folder.");

                    string target = Path.GetFullPath(Path.Combine(stagingData, relative));
                    if (!IsPathUnder(target, stagingData)) throw new InvalidOperationException("Snapshot target resolved outside the LKG staging folder.");
                    Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                    File.Copy(source, target, true);

                    FileInfo sourceInfo = new FileInfo(source);
                    FileInfo targetInfo = new FileInfo(target);
                    if (sourceInfo.Length != targetInfo.Length) throw new IOException("LKG copy size verification failed for " + relative);

                    string sourceHash = sourceHashes[source];
                    string targetHash = Sha256File(target);
                    if (!string.Equals(sourceHash, targetHash, StringComparison.OrdinalIgnoreCase))
                        throw new IOException("LKG copy hash verification failed for " + relative);

                    if (target.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                        ValidateJsonPayload(File.ReadAllText(target), "Daily LKG copied file " + relative);

                    File.SetLastWriteTimeUtc(target, sourceInfo.LastWriteTimeUtc);
                    totalBytes += targetInfo.Length;
                    manifestFiles.Add(new
                    {
                        relativePath = relative.Replace('\\', '/'),
                        sizeBytes = targetInfo.Length,
                        sha256 = targetHash,
                        modifiedUtc = sourceInfo.LastWriteTimeUtc.ToString("O")
                    });
                }

                // Re-check every live source after copying. If anything changed, appeared, or disappeared
                // during capture, do not promote a mixed/uncertain snapshot over yesterday's verified LKG.
                List<string> finalFiles = DailyLkgSourceFiles(dataDir);
                if (finalFiles.Count != sourceFiles.Count)
                    throw new IOException("The live Data file set changed while the daily LKG snapshot was being captured. No LKG replacement was made; retry on the next startup.");
                for (int i = 0; i < sourceFiles.Count; i++)
                {
                    if (!string.Equals(sourceFiles[i], finalFiles[i], StringComparison.OrdinalIgnoreCase))
                        throw new IOException("The live Data file set changed while the daily LKG snapshot was being captured. No LKG replacement was made; retry on the next startup.");
                    string source = sourceFiles[i];
                    if (!File.Exists(source) || !string.Equals(sourceHashes[source], Sha256File(source), StringComparison.OrdinalIgnoreCase))
                        throw new IOException("Live Data changed while the daily LKG snapshot was being captured. No LKG replacement was made; retry on the next startup.");
                }

                var manifest = new
                {
                    snapshotDate = today,
                    createdAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                    createdAtUtc = DateTime.UtcNow.ToString("O"),
                    createdBy = Environment.UserName,
                    machine = Environment.MachineName,
                    appVersion = SuiteVersion,
                    sourceDataRoot = settings.DataRoot,
                    scope = "All live files in the suite Data folder",
                    status = "verified",
                    fileCount = manifestFiles.Count,
                    totalBytes,
                    files = manifestFiles
                };
                string manifestPath = Path.Combine(stagingDir, "manifest.json");
                File.WriteAllText(manifestPath, JsonSerializer.Serialize(manifest, JsonOptions));
                ValidateJsonPayload(File.ReadAllText(manifestPath), "Daily LKG manifest");

                PromoteDailyLkgSnapshot(stagingDir, currentDir, backupRoot, today);
                WriteDailyLkgAudit(currentDir, manifestFiles.Count, totalBytes);

                return new DailyLkgResult
                {
                    Success = true,
                    Created = true,
                    SnapshotPath = currentDir,
                    Message = "Created today's verified Last-Known-Good suite snapshot."
                };
            }
            catch
            {
                try { if (Directory.Exists(stagingDir)) Directory.Delete(stagingDir, true); } catch { }
                throw;
            }
        }


        private List<string> DailyLkgSourceFiles(string dataDir)
        {
            var files = new List<string>();
            foreach (string path in Directory.GetFiles(dataDir, "*", SearchOption.AllDirectories))
            {
                string name = Path.GetFileName(path);
                if (name.Equals(".write-test.tmp", StringComparison.OrdinalIgnoreCase)) continue;
                if (name.Contains(".txn-", StringComparison.OrdinalIgnoreCase) && name.EndsWith(".tmp", StringComparison.OrdinalIgnoreCase)) continue;
                files.Add(Path.GetFullPath(path));
            }
            files.Sort(StringComparer.OrdinalIgnoreCase);
            return files;
        }

        private void PromoteDailyLkgSnapshot(string stagingDir, string currentDir, string backupRoot, string snapshotDate)
        {
            string previousDir = Path.GetFullPath(Path.Combine(backupRoot, ".previous-" + Guid.NewGuid().ToString("N")));
            bool movedCurrent = false;
            try
            {
                if (Directory.Exists(currentDir))
                {
                    Directory.Move(currentDir, previousDir);
                    movedCurrent = true;
                }

                Directory.Move(stagingDir, currentDir);
                if (!DailyLkgSnapshotMatchesDate(currentDir, snapshotDate))
                    throw new InvalidDataException("The promoted Last-Known-Good manifest did not verify after promotion.");

                if (movedCurrent && Directory.Exists(previousDir))
                {
                    try { Directory.Delete(previousDir, true); } catch { }
                }
            }
            catch
            {
                try
                {
                    if (Directory.Exists(currentDir)) Directory.Delete(currentDir, true);
                    if (movedCurrent && Directory.Exists(previousDir)) Directory.Move(previousDir, currentDir);
                }
                catch { }
                throw;
            }
        }

        private void WriteDailyLkgAudit(string snapshotPath, int fileCount, long totalBytes)
        {
            try
            {
                string auditDir = Path.Combine(settings.DataRoot, "Data Integrity", "Write Audit");
                Directory.CreateDirectory(auditDir);
                string machine = string.Join("_", Environment.MachineName.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
                string path = Path.Combine(auditDir, "lkg__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + "__" + machine + "__" + Guid.NewGuid().ToString("N").Substring(0, 8) + ".json");
                var record = new
                {
                    at = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                    version = SuiteVersion,
                    user = Environment.UserName,
                    machine = Environment.MachineName,
                    operation = "daily-last-known-good-snapshot",
                    result = "verified",
                    snapshotPath,
                    fileCount,
                    totalBytes
                };
                File.WriteAllText(path, JsonSerializer.Serialize(record, JsonOptions));
            }
            catch { }
        }

        private void WriteDailyLkgFailureLog(string backupRoot, string error)
        {
            try
            {
                Directory.CreateDirectory(backupRoot);
                string path = Path.Combine(backupRoot, "lkg-failure__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + "__" + Guid.NewGuid().ToString("N").Substring(0, 8) + ".json");
                var record = new
                {
                    at = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                    version = SuiteVersion,
                    user = Environment.UserName,
                    machine = Environment.MachineName,
                    result = "not-created",
                    previousSnapshotPreserved = true,
                    error
                };
                File.WriteAllText(path, JsonSerializer.Serialize(record, JsonOptions));
            }
            catch { }
        }
    }
}
