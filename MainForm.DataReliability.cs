using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private static void ValidateJsonPayload(string json, string context)
        {
            if (string.IsNullOrWhiteSpace(json) || json == "undefined")
                throw new InvalidDataException(context + " JSON payload is empty or undefined.");
            using JsonDocument _ = JsonDocument.Parse(json);
        }

        private static string Sha256Text(string text)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(text ?? "");
            return Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        }

        private static string Sha256File(string path)
        {
            using FileStream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        }

        private static void WriteUtf8Durable(string path, string content)
        {
            byte[] bytes = new UTF8Encoding(false).GetBytes(content ?? "");
            using FileStream stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 64 * 1024, FileOptions.WriteThrough);
            stream.Write(bytes, 0, bytes.Length);
            stream.Flush(true);
        }

        private string CreateSafetyBackup(string module, string livePath, string kind)
        {
            if (!File.Exists(livePath)) return "";
            string backupDir = ModuleBackupDir(module);
            Directory.CreateDirectory(backupDir);
            string safeKind = string.Join("-", (kind ?? "pre-write").Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
            if (string.IsNullOrWhiteSpace(safeKind)) safeKind = "pre-write";
            string backupName = Path.GetFileNameWithoutExtension(livePath) + "__" + safeKind + "__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + ".json";
            string backupPath = Path.GetFullPath(Path.Combine(backupDir, backupName));
            if (!IsPathUnder(backupPath, backupDir)) throw new InvalidOperationException("Safety backup path resolved outside the module backup folder.");
            File.Copy(livePath, backupPath, false);
            if (!File.Exists(backupPath) || new FileInfo(backupPath).Length != new FileInfo(livePath).Length)
                throw new IOException("Safety backup verification failed before live data write.");
            return backupPath;
        }

        private DataWriteOutcome WriteJsonAtomically(string module, string targetPath, string json, string operation, string backupKind, string expectedRevision = "")
        {
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Atomic JSON write module is not approved: " + module);
            ValidateJsonPayload(json, ModuleFolder(module));
            string fullTarget = Path.GetFullPath(targetPath);
            string? parent = Path.GetDirectoryName(fullTarget);
            if (string.IsNullOrWhiteSpace(parent)) throw new InvalidOperationException("JSON target folder could not be resolved.");
            Directory.CreateDirectory(parent);

            string expectedHash = Sha256Text(json);
            bool existed = File.Exists(fullTarget);
            string backupPath = "";
            string tempPath = fullTarget + ".txn-" + Guid.NewGuid().ToString("N") + ".tmp";
            string method = "";

            try
            {
                if (existed && (operation == "module-save" || operation == "settings-save"))
                {
                    JsonIntegrityInfo liveIntegrity = JsonIntegrityStatus(fullTarget);
                    if (!string.Equals(liveIntegrity.Status, "valid", StringComparison.OrdinalIgnoreCase))
                        throw new InvalidDataException("The current live JSON failed integrity validation. Normal save is blocked so damaged data is not silently overwritten. Use Backup & Restore or packaged recovery after review. Details: " + liveIntegrity.Error);
                }

                WriteUtf8Durable(tempPath, json);
                string tempJson = File.ReadAllText(tempPath);
                ValidateJsonPayload(tempJson, ModuleFolder(module) + " temporary write");
                string tempHash = Sha256File(tempPath);
                if (!string.Equals(expectedHash, tempHash, StringComparison.OrdinalIgnoreCase))
                    throw new IOException("Temporary write hash did not match the requested JSON payload.");

                // v3.4.1.0 stale-write gate. This runs after staging/validation but before
                // the safety backup or live replacement so a conflict does not touch live data.
                if (operation == "module-save")
                    VerifyExpectedRevision(module, fullTarget, expectedRevision, operation);

                existed = File.Exists(fullTarget);
                if (existed) backupPath = CreateSafetyBackup(module, fullTarget, backupKind);

                if (existed)
                {
                    try
                    {
                        File.Replace(tempPath, fullTarget, null, true);
                        method = "File.Replace";
                    }
                    catch (PlatformNotSupportedException)
                    {
                        File.Move(tempPath, fullTarget, true);
                        method = "File.Move(overwrite-fallback)";
                    }
                    catch (IOException) when (File.Exists(tempPath))
                    {
                        File.Move(tempPath, fullTarget, true);
                        method = "File.Move(overwrite-fallback)";
                    }
                }
                else
                {
                    File.Move(tempPath, fullTarget);
                    method = "File.Move(create)";
                }

                if (!File.Exists(fullTarget)) throw new IOException("Atomic write completed without a live file present.");
                string finalJson = File.ReadAllText(fullTarget);
                ValidateJsonPayload(finalJson, ModuleFolder(module) + " final verification");
                string finalHash = Sha256File(fullTarget);
                if (!string.Equals(expectedHash, finalHash, StringComparison.OrdinalIgnoreCase))
                    throw new IOException("Final live-file hash did not match the validated temporary write.");

                FileInfo info = new FileInfo(fullTarget);
                var outcome = new DataWriteOutcome
                {
                    Module = module,
                    Operation = operation,
                    Path = info.FullName,
                    SavedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    SizeBytes = info.Length,
                    BackupPath = backupPath,
                    Sha256 = finalHash,
                    Method = method,
                    Verified = true
                };
                WriteDataReliabilityAudit(outcome, true, "");
                return outcome;
            }
            catch (Exception ex)
            {
                var failed = new DataWriteOutcome
                {
                    Module = module,
                    Operation = operation,
                    Path = fullTarget,
                    SavedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    BackupPath = backupPath,
                    Sha256 = expectedHash,
                    Method = method,
                    Verified = false
                };
                WriteDataReliabilityAudit(failed, false, ex.Message);
                throw;
            }
            finally
            {
                try { if (File.Exists(tempPath)) File.Delete(tempPath); } catch { }
            }
        }

        private void WriteDataReliabilityAudit(DataWriteOutcome outcome, bool success, string error)
        {
            try
            {
                string auditDir = Path.Combine(settings.DataRoot, "Data Integrity", "Write Audit");
                Directory.CreateDirectory(auditDir);
                string machine = string.Join("_", Environment.MachineName.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
                string name = "write__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + "__" + machine + "__" + Guid.NewGuid().ToString("N").Substring(0, 8) + ".json";
                string path = Path.Combine(auditDir, name);
                var record = new
                {
                    at = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                    version = "3.4.1.0",
                    user = Environment.UserName,
                    machine = Environment.MachineName,
                    module = outcome.Module,
                    operation = outcome.Operation,
                    target = outcome.Path,
                    success,
                    verified = outcome.Verified,
                    method = outcome.Method,
                    sha256 = outcome.Sha256,
                    sizeBytes = outcome.SizeBytes,
                    backupPath = outcome.BackupPath,
                    error
                };
                File.WriteAllText(path, JsonSerializer.Serialize(record, JsonOptions));
            }
            catch { }
        }

        private JsonIntegrityInfo JsonIntegrityStatus(string path)
        {
            if (!File.Exists(path)) return new JsonIntegrityInfo { Status = "missing" };
            try
            {
                string json = File.ReadAllText(path);
                ValidateJsonPayload(json, Path.GetFileName(path));
                return new JsonIntegrityInfo { Status = "valid", Sha256 = Sha256File(path) };
            }
            catch (Exception ex)
            {
                return new JsonIntegrityInfo { Status = "invalid", Error = ex.Message };
            }
        }
    }
}
