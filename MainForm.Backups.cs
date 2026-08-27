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
        private string CreateBackup(string module, string json)
        {
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Backup module is not approved for JSON backup: " + module);
            JsonDocument.Parse(json).Dispose();
            EnsureFolders();
            string backupDir = ModuleBackupDir(module);
            Directory.CreateDirectory(backupDir);
            string backupName = Path.GetFileNameWithoutExtension(ModuleFileName(module)) + "__manual__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + ".json";
            string path = Path.GetFullPath(Path.Combine(backupDir, backupName));
            if (!IsPathUnder(path, backupDir)) throw new InvalidOperationException("Backup path is outside the suite backup folder.");
            WriteUtf8Durable(path, json);
            string verifyJson = File.ReadAllText(path);
            ValidateJsonPayload(verifyJson, "Manual backup");
            if (!string.Equals(Sha256Text(json), Sha256File(path), StringComparison.OrdinalIgnoreCase))
                throw new IOException("Manual backup verification failed.");
            return path;
        }

        private string WriteExport(string module, string fileName, string content)
        {
            if (!IsKnownModule(module)) throw new InvalidOperationException("Export module is not approved: " + module);
            EnsureFolders();
            string safeName = string.Join("_", Path.GetFileName(fileName).Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
            if (string.IsNullOrWhiteSpace(safeName)) safeName = "export.txt";
            string exportDir = Path.Combine(settings.DataRoot, "Exports", ModuleFolder(module));
            Directory.CreateDirectory(exportDir);
            string path = Path.GetFullPath(Path.Combine(exportDir, safeName));
            if (!IsPathUnder(path, exportDir)) throw new InvalidOperationException("Export path is outside the suite export folder.");
            File.WriteAllText(path, content ?? "");
            return path;
        }



        private object BackupInventory()
        {
            EnsureFolders();
            var rows = new List<object>();
            long totalBytes = 0;
            int totalFiles = 0;
            int totalCleanable = 0;
            foreach (string module in ModuleNames())
            {
                if (!IsKnownJsonModule(module)) continue;
                var files = GetBackupFiles(module);
                var plan = ComputeBackupCleanupPlan(module);
                totalFiles += files.Count;
                totalBytes += SumBytes(files);
                totalCleanable += plan.remove.Count;
                rows.Add(new
                {
                    module,
                    label = ModuleFolder(module),
                    count = files.Count,
                    sizeBytes = SumBytes(files),
                    newest = files.Count > 0 ? files[0].ModifiedText : "",
                    oldest = files.Count > 0 ? files[files.Count - 1].ModifiedText : "",
                    manual = CountKind(files, "Manual"),
                    auto = CountKind(files, "Auto"),
                    preRestore = CountKind(files, "Pre-Restore"),
                    archive = CountKind(files, "Archive"),
                    legacy = CountKind(files, "Legacy"),
                    cleanable = plan.remove.Count
                });
            }
            return new { generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), totalFiles, totalBytes, totalCleanable, rows, policy = BackupRetentionPolicyText() };
        }

        private object PreviewBackupCleanup(string module)
        {
            EnsureFolders();
            var allDelete = new List<BackupPlanFile>();
            var allKeep = new List<BackupPlanFile>();
            foreach (string m in ResolveBackupModules(module))
            {
                var plan = ComputeBackupCleanupPlan(m);
                allDelete.AddRange(plan.remove);
                allKeep.AddRange(plan.keep);
            }
            return new
            {
                module = string.IsNullOrWhiteSpace(module) ? "all" : module,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                policy = BackupRetentionPolicyText(),
                deleteCount = allDelete.Count,
                keepCount = allKeep.Count,
                deleteBytes = SumPlanBytes(allDelete),
                keepBytes = SumPlanBytes(allKeep),
                @delete = allDelete.ConvertAll(f => f.ToResponse()),
                keep = allKeep.ConvertAll(f => f.ToResponse())
            };
        }

        private object CleanupBackups(string module)
        {
            EnsureFolders();
            var preview = new List<BackupPlanFile>();
            foreach (string m in ResolveBackupModules(module)) preview.AddRange(ComputeBackupCleanupPlan(m).remove);
            var deleted = new List<object>();
            var failed = new List<object>();
            long bytes = 0;
            foreach (BackupPlanFile f in preview)
            {
                try
                {
                    string backupDir = ModuleBackupDir(f.Module);
                    if (!IsPathUnder(f.Path, backupDir)) throw new InvalidOperationException("Candidate path is outside the module backup folder.");
                    if (File.Exists(f.Path))
                    {
                        long len = new FileInfo(f.Path).Length;
                        File.Delete(f.Path);
                        bytes += len;
                        deleted.Add(f.ToResponse());
                    }
                }
                catch (Exception ex)
                {
                    failed.Add(new { module = f.Module, name = f.Name, path = f.Path, error = ex.Message });
                }
            }
            string logPath = WriteBackupCleanupLog(module, deleted, failed, bytes);
            return new { module = string.IsNullOrWhiteSpace(module) ? "all" : module, deletedCount = deleted.Count, failedCount = failed.Count, bytesRecovered = bytes, logPath, deleted, failed };
        }

        private string WriteBackupCleanupLog(string module, List<object> deleted, List<object> failed, long bytes)
        {
            string root = Path.GetFullPath(Path.Combine(settings.DataRoot, "Backups"));
            Directory.CreateDirectory(root);
            string logPath = Path.GetFullPath(Path.Combine(root, "backup-cleanup-log__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + ".json"));
            if (!IsPathUnder(logPath, root)) throw new InvalidOperationException("Cleanup log path resolved outside backup root.");
            var log = new { module = string.IsNullOrWhiteSpace(module) ? "all" : module, createdAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), policy = BackupRetentionPolicyText(), deletedCount = deleted.Count, failedCount = failed.Count, bytesRecovered = bytes, deleted, failed };
            File.WriteAllText(logPath, JsonSerializer.Serialize(log, JsonOptions));
            return logPath;
        }

        private List<string> ResolveBackupModules(string module)
        {
            var modules = new List<string>();
            if (string.IsNullOrWhiteSpace(module) || string.Equals(module, "all", StringComparison.OrdinalIgnoreCase))
            {
                foreach (string m in ModuleNames()) if (IsKnownJsonModule(m)) modules.Add(m);
                return modules;
            }
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Backup cleanup module is not approved: " + module);
            modules.Add(module);
            return modules;
        }

        private (List<BackupPlanFile> keep, List<BackupPlanFile> remove) ComputeBackupCleanupPlan(string module)
        {
            var files = GetBackupFiles(module);
            var keep = new List<BackupPlanFile>();
            var remove = new List<BackupPlanFile>();
            var usedBuckets = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            string newestPath = files.Count > 0 ? files[0].Path : "";
            DateTime now = DateTime.Now;
            foreach (BackupFileInfo f in files)
            {
                var plan = new BackupPlanFile(f);
                double ageDays = Math.Max(0, (now - f.Modified).TotalDays);
                bool protectedKind = f.Kind == "Manual" || f.Kind == "Archive" || f.Kind == "Legacy";
                if (string.Equals(f.Path, newestPath, StringComparison.OrdinalIgnoreCase)) { plan.Reason = "Newest backup for module"; keep.Add(plan); continue; }
                if (protectedKind) { plan.Reason = f.Kind + " backup is protected"; keep.Add(plan); continue; }
                if (f.Kind == "Pre-Restore" && ageDays <= 90) { plan.Reason = "Pre-restore backup kept at least 90 days"; keep.Add(plan); continue; }
                if (ageDays <= 7) { plan.Reason = "All backups kept for 7 days"; keep.Add(plan); continue; }
                string bucket;
                if (ageDays <= 30) bucket = "daily:" + f.Modified.ToString("yyyy-MM-dd");
                else if (ageDays <= 84) bucket = "weekly:" + f.Modified.Year + ":" + (f.Modified.DayOfYear / 7).ToString("00");
                else if (ageDays <= 365) bucket = "monthly:" + f.Modified.ToString("yyyy-MM");
                else bucket = "expired:" + f.Modified.ToString("yyyy-MM-dd");
                if (!bucket.StartsWith("expired:") && !usedBuckets.Contains(bucket))
                {
                    usedBuckets.Add(bucket);
                    plan.Reason = "Retention keeper for " + bucket.Replace(':', ' ');
                    keep.Add(plan);
                }
                else
                {
                    plan.Reason = bucket.StartsWith("expired:") ? "Older than 12-month monthly retention" : "Extra backup inside retained period bucket";
                    remove.Add(plan);
                }
            }
            return (keep, remove);
        }

        private List<BackupFileInfo> GetBackupFiles(string module)
        {
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Backup module is not approved: " + module);
            string folder = ModuleBackupDir(module);
            Directory.CreateDirectory(folder);
            var files = new List<BackupFileInfo>();
            foreach (string file in Directory.GetFiles(folder, "*.json", SearchOption.TopDirectoryOnly))
            {
                FileInfo info = new FileInfo(file);
                files.Add(new BackupFileInfo(module, info, ClassifyBackup(info.Name)));
            }
            files.Sort((a, b) => b.Modified.CompareTo(a.Modified));
            return files;
        }

        private static string ClassifyBackup(string name)
        {
            string n = name.ToLowerInvariant();
            if (n.Contains("monthly-archive") || n.Contains("__archive__")) return "Archive";
            if (n.Contains("pre-restore") || n.Contains("before-restore") || n.Contains("pre-recovery") || n.Contains("before-seed-restore")) return "Pre-Restore";
            if (n.Contains("auto") || n.Contains("before-save") || n.Contains("replaced-empty")) return "Auto";
            if (n.Contains("manual") || n.Contains("-backup-")) return "Manual";
            return "Legacy";
        }

        private static string BackupRetentionPolicyText() => "Keep all backups for 7 days, one daily for 30 days, one weekly for 12 weeks, one monthly for 12 months. Manual, archive, and legacy backups are protected. Pre-restore backups are protected for at least 90 days. Cleanup is preview-and-confirm only.";
        private static int CountKind(List<BackupFileInfo> files, string kind) { int count = 0; foreach (BackupFileInfo f in files) if (f.Kind == kind) count++; return count; }
        private static long SumBytes(List<BackupFileInfo> files) { long total = 0; foreach (BackupFileInfo f in files) total += f.SizeBytes; return total; }
        private static long SumPlanBytes(List<BackupPlanFile> files) { long total = 0; foreach (BackupPlanFile f in files) total += f.SizeBytes; return total; }

        private object ListBackups(string module)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Backup module was not defined.");
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Backup module is not approved for JSON restore: " + module);
            EnsureFolders();
            var files = GetBackupFiles(module);
            var backups = new List<object>();
            foreach (BackupFileInfo f in files)
            {
                backups.Add(new { name = f.Name, path = f.Path, modified = f.ModifiedText, sizeBytes = f.SizeBytes, kind = f.Kind });
            }
            return new { module, backups };
        }

        private object ReadBackupSummary(string module, string backupPath)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Backup module was not defined.");
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Backup module is not approved for JSON restore: " + module);
            if (string.IsNullOrWhiteSpace(backupPath)) throw new InvalidOperationException("Backup path was not provided.");
            EnsureFolders();
            string fullBackupPath = Path.GetFullPath(Environment.ExpandEnvironmentVariables(backupPath));
            string allowedRoot = ModuleBackupDir(module);
            if (!IsPathUnder(fullBackupPath, allowedRoot)) throw new InvalidOperationException("Backup path is outside the selected module backup folder.");
            if (!File.Exists(fullBackupPath)) throw new FileNotFoundException("Backup file was not found: " + fullBackupPath);
            FileInfo info = new FileInfo(fullBackupPath);
            string json = File.ReadAllText(fullBackupPath);
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            int employees = CountArray(root, "employees");
            int schedule = CountArray(root, "schedule");
            int tasks = CountArray(root, "tasks");
            int audit = CountArray(root, "audit");
            int attendanceRecords = 0;
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("attendance", out JsonElement att) && att.ValueKind == JsonValueKind.Object)
            {
                foreach (JsonProperty person in att.EnumerateObject())
                {
                    if (person.Value.ValueKind == JsonValueKind.Object)
                    {
                        foreach (JsonProperty _ in person.Value.EnumerateObject()) attendanceRecords++;
                    }
                }
            }
            string lastSaved = root.ValueKind == JsonValueKind.Object && root.TryGetProperty("lastSaved", out JsonElement ls) ? ls.GetString() ?? "" : "";
            return new { module, name = info.Name, path = info.FullName, modified = info.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss"), sizeBytes = info.Length, employees, schedule, tasks, audit, attendanceRecords, lastSaved };
        }

        private static int CountArray(JsonElement root, string property)
        {
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty(property, out JsonElement arr) && arr.ValueKind == JsonValueKind.Array) return arr.GetArrayLength();
            return 0;
        }

        private string RestoreBackup(string module, string backupPath)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Restore module was not defined.");
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Restore module is not approved for JSON restore: " + module);
            if (string.IsNullOrWhiteSpace(backupPath)) throw new InvalidOperationException("Restore backup path was not provided.");
            EnsureFolders();
            string fullBackupPath = Path.GetFullPath(Environment.ExpandEnvironmentVariables(backupPath));
            string allowedRoot = ModuleBackupDir(module);
            if (!IsPathUnder(fullBackupPath, allowedRoot)) throw new InvalidOperationException("Restore path is outside the selected module backup folder.");
            if (!File.Exists(fullBackupPath)) throw new FileNotFoundException("Backup file was not found: " + fullBackupPath);
            string json = File.ReadAllText(fullBackupPath);
            JsonDocument.Parse(json).Dispose();
            string dataDir = Path.Combine(settings.DataRoot, "Data");
            Directory.CreateDirectory(dataDir);
            string livePath = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(module)));
            if (!IsPathUnder(livePath, dataDir)) throw new InvalidOperationException("Resolved restore target is outside the suite Data folder.");
            WriteJsonAtomically(module, livePath, json, "restore-backup", "pre-restore");
            return json;
        }
    }
}
