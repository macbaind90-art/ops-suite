using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private void OpenPath(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) throw new InvalidOperationException("No path was provided.");
            string expanded = Path.GetFullPath(Environment.ExpandEnvironmentVariables(path));
            if (!IsSafeOpenPath(expanded)) throw new InvalidOperationException("Blocked open-path request outside approved suite folders: " + expanded);
            if (!File.Exists(expanded) && !Directory.Exists(expanded))
            {
                CopyPackagedProgramsToShared(false);
            }
            if (!File.Exists(expanded) && !Directory.Exists(expanded)) throw new FileNotFoundException("Path was not found: " + expanded);
            Process.Start(new ProcessStartInfo(expanded) { UseShellExecute = true });
        }

        private void CopyPackagedProgramsToShared(bool overwrite)
        {
            try
            {
                string source = Path.Combine(appFolder, "programs");
                string dest = Path.Combine(settings.DataRoot, "Programs");
                if (!Directory.Exists(source)) return;
                CopyDirectory(source, dest, overwrite);
            }
            catch { }
        }

        private static void CopyDirectory(string sourceDir, string destDir, bool overwrite)
        {
            Directory.CreateDirectory(destDir);
            foreach (string dir in Directory.GetDirectories(sourceDir, "*", SearchOption.AllDirectories))
            {
                string relative = Path.GetRelativePath(sourceDir, dir);
                Directory.CreateDirectory(Path.Combine(destDir, relative));
            }
            foreach (string file in Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories))
            {
                string relative = Path.GetRelativePath(sourceDir, file);
                string target = Path.Combine(destDir, relative);
                Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                if (overwrite || !File.Exists(target)) File.Copy(file, target, true);
            }
        }

        private string BackupProgramsFolder()
        {
            string source = Path.Combine(settings.DataRoot, "Programs");
            if (!Directory.Exists(source))
            {
                CopyPackagedProgramsToShared(false);
            }
            if (!Directory.Exists(source)) throw new DirectoryNotFoundException("Programs folder was not found.");
            string stamp = DateTime.Now.ToString("yyyyMMdd_HHmmss_fff");
            string dest = Path.Combine(settings.DataRoot, "Backups", "Programs", "Programs__manual__" + stamp);
            CopyDirectory(source, dest, true);
            return dest;
        }

        private void CreateSuiteLockFile()
        {
            try
            {
                EnsureFolders();
                var lockInfo = new { user = Environment.UserName, machine = Environment.MachineName, openedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), version = "3.3.0.2" };
                File.WriteAllText(Path.Combine(settings.DataRoot, "Locks", "suite.lock"), JsonSerializer.Serialize(lockInfo, JsonOptions));
            }
            catch { }
        }

        private void TryDeleteSuiteLockFile()
        {
            try
            {
                string path = Path.Combine(settings.DataRoot, "Locks", "suite.lock");
                if (File.Exists(path)) File.Delete(path);
            }
            catch { }
        }

        private object GetEnvironmentInfo() => new { user = Environment.UserName, machine = Environment.MachineName, version = "3.3.0.2", baseDirectory = AppContext.BaseDirectory };

        private string LatestAttendanceDateFromFile(string path)
        {
            try
            {
                using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(path));
                if (!doc.RootElement.TryGetProperty("attendance", out JsonElement att) || att.ValueKind != JsonValueKind.Object) return "";
                string latest = "";
                foreach (JsonProperty person in att.EnumerateObject())
                {
                    if (person.Value.ValueKind != JsonValueKind.Object) continue;
                    foreach (JsonProperty day in person.Value.EnumerateObject())
                    {
                        string d = day.Name;
                        string code = day.Value.ValueKind == JsonValueKind.String ? day.Value.GetString() ?? "" : day.Value.ToString();
                        if (d.Length == 10 && !string.IsNullOrWhiteSpace(code) && code != "NE" && string.CompareOrdinal(d, latest) > 0) latest = d;
                    }
                }
                return latest;
            }
            catch { return ""; }
        }

        private string NewestDatePropertyFromFile(string path, params string[] propertyNames)
        {
            try
            {
                using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(path));
                string latest = "";
                foreach (string prop in propertyNames)
                {
                    if (!doc.RootElement.TryGetProperty(prop, out JsonElement arr) || arr.ValueKind != JsonValueKind.Array) continue;
                    foreach (JsonElement item in arr.EnumerateArray())
                    {
                        if (item.ValueKind != JsonValueKind.Object) continue;
                        foreach (string key in new[] { "date", "reportDate", "lastSeen", "updatedAt", "createdAt", "at", "dueDate" })
                        {
                            if (item.TryGetProperty(key, out JsonElement v))
                            {
                                string raw = v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : v.ToString();
                                string d = raw.Length >= 10 ? raw.Substring(0, 10) : raw;
                                if (d.Length == 10 && d[4] == '-' && d[7] == '-' && string.CompareOrdinal(d, latest) > 0) latest = d;
                            }
                        }
                    }
                }
                return latest;
            }
            catch { return ""; }
        }

        private object ModuleFileStatuses()
        {
            var rows = new List<object>();
            foreach (string module in ModuleNames())
            {
                if (module == "programs") continue;
                rows.Add(ModuleFileStatus(module));
            }
            return rows;
        }

        private object ModuleFileStatus(string module)
        {
            string fileName = ModuleFileName(module);
            string path = Path.Combine(settings.DataRoot, "Data", fileName);
            FileInfo? info = File.Exists(path) ? new FileInfo(path) : null;
            string newestBackup = "";
            string newestBackupModified = "";
            long newestBackupSize = 0;
            string backupDir = Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module));
            if (Directory.Exists(backupDir))
            {
                FileInfo? newest = null;
                foreach (string f in Directory.GetFiles(backupDir, "*.json", SearchOption.TopDirectoryOnly))
                {
                    FileInfo bi = new FileInfo(f);
                    if (newest == null || bi.LastWriteTime > newest.LastWriteTime) newest = bi;
                }
                if (newest != null)
                {
                    newestBackup = newest.Name;
                    newestBackupModified = newest.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                    newestBackupSize = newest.Length;
                }
            }
            string lastSaved = "";
            if (info != null)
            {
                try
                {
                    using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(info.FullName));
                    if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("lastSaved", out JsonElement ls)) lastSaved = ls.GetString() ?? "";
                }
                catch { }
            }
            string newestDataDate = "";
            if (info != null)
            {
                if (module == "attendance") newestDataDate = LatestAttendanceDateFromFile(info.FullName);
                else if (module == "shift-reports") newestDataDate = NewestDatePropertyFromFile(info.FullName, "reports", "issues");
                else if (module == "shift-intelligence") newestDataDate = NewestDatePropertyFromFile(info.FullName, "issues", "intake", "reference");
                else if (module == "tasks") newestDataDate = NewestDatePropertyFromFile(info.FullName, "tasks", "audit");
                else if (module == "roster") newestDataDate = NewestDatePropertyFromFile(info.FullName, "employees", "schedule", "audit");
            }
            string sourceStatus = info == null ? "missing" : "live-shared";
            return new { module, label = ModuleFolder(module), fileName, path, exists = info != null, sizeBytes = info?.Length ?? 0, modified = info?.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss") ?? "", lastSaved, newestBackup, newestBackupModified, newestBackupSize, newestDataDate, sourceStatus };
        }

        private string ModuleBackupDir(string module)
        {
            string backupRoot = Path.GetFullPath(Path.Combine(settings.DataRoot, "Backups"));
            string dir = Path.GetFullPath(Path.Combine(backupRoot, ModuleFolder(module)));
            if (!IsPathUnder(dir, backupRoot)) throw new InvalidOperationException("Module backup folder resolved outside the suite backup folder.");
            return dir;
        }

        private static bool IsKnownModule(string module)
        {
            foreach (string m in ModuleNames()) if (string.Equals(m, module, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        private static bool IsKnownJsonModule(string module)
        {
            return IsKnownModule(module) && !string.Equals(module, "programs", StringComparison.OrdinalIgnoreCase);
        }

        private bool IsSafeOpenPath(string path)
        {
            string full = Path.GetFullPath(Environment.ExpandEnvironmentVariables(path));
            string dataRoot = Path.GetFullPath(settings.DataRoot);
            string appRoot = Path.GetFullPath(appFolder);
            string exeRoot = Path.GetFullPath(AppContext.BaseDirectory);
            return IsPathUnder(full, dataRoot) || IsPathUnder(full, appRoot) || IsPathUnder(full, exeRoot);
        }

        private static bool IsPathUnder(string path, string root)
        {
            string fullPath = Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
            string fullRoot = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
            return fullPath.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase);
        }
        private static string[] ModuleNames() => new[] { "attendance", "roster", "tasks", "shift-reports", "shift-intelligence", "suite-settings", "programs" };
        private static string ModuleFileName(string module) => module switch
        {
            "attendance" => "attendance-data.json", "roster" => "roster-data.json", "tasks" => "tasks-data.json", "shift-reports" => "shift-reports-data.json", "shift-intelligence" => "shift-intelligence-data.json", _ => module + ".json"
        };
        internal static string ModuleFolder(string module) => module switch
        {
            "attendance" => "Attendance", "roster" => "Roster", "tasks" => "Task Tracker", "shift-reports" => "Shift Reports", "shift-intelligence" => "Shift Intelligence", "suite-settings" => "Suite Settings", "programs" => "Programs", _ => module
        };
    }
}
