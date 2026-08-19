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
        private SuiteSettings LoadSettingsFromDisk()
        {
            string path = Path.Combine(DefaultRoot, "Data", SettingsFileName);
            try
            {
                if (File.Exists(path))
                {
                    SuiteSettings? loaded = JsonSerializer.Deserialize<SuiteSettings>(File.ReadAllText(path), JsonOptions);
                    if (loaded != null)
                    {
                        if (string.IsNullOrWhiteSpace(loaded.DataRoot)) loaded.DataRoot = DefaultRoot;
                        return loaded;
                    }
                }
            }
            catch { }
            return new SuiteSettings();
        }

        private void SaveSettingsToDisk()
        {
            string dataFolder = Path.Combine(settings.DataRoot, "Data");
            Directory.CreateDirectory(dataFolder);
            File.WriteAllText(Path.Combine(dataFolder, SettingsFileName), JsonSerializer.Serialize(settings, JsonOptions));
        }

        private void EnsureFolders()
        {
            Directory.CreateDirectory(settings.DataRoot);
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Locks"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Backups"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Exports"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Programs"));
            foreach (string module in ModuleNames())
            {
                Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module)));
                Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Exports", ModuleFolder(module)));
            }
            CopyPackagedProgramsToShared(false);
        }

        private class ModuleLoadResult
        {
            public string Module { get; set; } = "";
            public string Data { get; set; } = "{}";
            public string Source { get; set; } = "unknown";
            public string SourceDetail { get; set; } = "";
            public string Path { get; set; } = "";
            public string FileModified { get; set; } = "";
            public bool LiveFileExisted { get; set; } = false;
        }

        private object RunHealthCheck()
        {
            var checks = new List<object>();
            checks.Add(Check("Data root exists", () => Directory.Exists(settings.DataRoot)));
            checks.Add(Check("Can create data folder", () => { Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data")); return true; }));
            checks.Add(Check("Can write settings test", () => { string p = Path.Combine(settings.DataRoot, "Data", ".write-test.tmp"); File.WriteAllText(p, "ok"); File.Delete(p); return true; }));
            checks.Add(Check("Can create backups folder", () => { Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Backups")); return true; }));
            checks.Add(Check("Can create exports folder", () => { Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Exports")); return true; }));
            checks.Add(Check("Can create locks folder", () => { Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Locks")); return true; }));
            checks.Add(Check("Can create programs folder", () => { Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Programs")); return true; }));
            checks.Add(Check("Open path guard active", () => IsSafeOpenPath(settings.DataRoot)));
            return new { dataRoot = settings.DataRoot, checks, moduleFiles = ModuleFileStatuses() };
        }

        private object Check(string name, Func<bool> fn)
        {
            try { return new { name, ok = fn(), error = "" }; }
            catch (Exception ex) { return new { name, ok = false, error = ex.Message }; }
        }

        private object LoadModuleDataEnvelope(string module)
        {
            ModuleLoadResult info = LoadModuleDataWithSource(module);
            return new
            {
                module = info.Module,
                data = info.Data,
                source = info.Source,
                sourceDetail = info.SourceDetail,
                path = info.Path,
                fileModified = info.FileModified,
                liveFileExisted = info.LiveFileExisted,
                dataRoot = settings.DataRoot,
                loadedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
        }

        private ModuleLoadResult LoadModuleDataWithSource(string module)
        {
            EnsureFolders();
            string path = Path.Combine(settings.DataRoot, "Data", ModuleFileName(module));
            string seedPath = Path.Combine(appFolder, "seed", ModuleFileName(module));
            string fullPath = Path.GetFullPath(path);
            ModuleLoadResult result = new ModuleLoadResult { Module = module, Path = fullPath, LiveFileExisted = File.Exists(fullPath) };

            if (File.Exists(fullPath))
            {
                string existingJson = File.ReadAllText(fullPath);
                string seedJsonForCompare = File.Exists(seedPath) ? File.ReadAllText(seedPath) : "";
                if (!ShouldReplaceWithSeed(module, existingJson, seedJsonForCompare))
                {
                    FileInfo info = new FileInfo(fullPath);
                    result.Data = existingJson;
                    result.Source = "live-shared";
                    result.SourceDetail = "Loaded existing JSON from the configured shared Data folder.";
                    result.FileModified = info.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                    return result;
                }

                if (File.Exists(seedPath))
                {
                    string backupDir = Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module));
                    Directory.CreateDirectory(backupDir);
                    string backupName = Path.GetFileNameWithoutExtension(ModuleFileName(module)) + "__pre-recovery-replace__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + ".json";
                    File.WriteAllText(Path.Combine(backupDir, backupName), existingJson);
                    string seedJson = File.ReadAllText(seedPath);
                    File.WriteAllText(fullPath, seedJson);
                    FileInfo info = new FileInfo(fullPath);
                    result.Data = seedJson;
                    result.Source = "packaged-recovery-replaced-empty";
                    result.SourceDetail = "Live file was missing required data or appeared empty, so packaged recovery JSON was copied after creating a backup.";
                    result.FileModified = info.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                    return result;
                }

                result.Data = existingJson;
                result.Source = "live-shared";
                result.SourceDetail = "Loaded existing JSON from the configured shared Data folder.";
                result.FileModified = new FileInfo(fullPath).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                return result;
            }

            if (File.Exists(seedPath))
            {
                string seedJson = File.ReadAllText(seedPath);
                Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
                File.WriteAllText(fullPath, seedJson);
                FileInfo info = new FileInfo(fullPath);
                result.Data = seedJson;
                result.Source = "packaged-recovery-created";
                result.SourceDetail = "No live JSON file existed, so packaged recovery JSON was copied into the shared Data folder.";
                result.FileModified = info.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                return result;
            }

            result.Data = "{}";
            result.Source = "missing";
            result.SourceDetail = "No live JSON file or packaged recovery JSON was found.";
            return result;
        }

        private bool ShouldReplaceWithSeed(string module, string json, string seedJson = "")
        {
            if (module != "attendance" && module != "roster" && module != "tasks") return false;
            if (string.IsNullOrWhiteSpace(json) || json.Trim() == "{}") return true;
            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);
                JsonElement root = doc.RootElement;

                if (module == "tasks")
                {
                    if (!root.TryGetProperty("tasks", out JsonElement taskArray) || taskArray.ValueKind != JsonValueKind.Array || taskArray.GetArrayLength() == 0) return true;
                }
                else
                {
                    if (!root.TryGetProperty("employees", out JsonElement employees) || employees.ValueKind != JsonValueKind.Array || employees.GetArrayLength() == 0) return true;
                }

                if (module == "attendance")
                {
                    if (!root.TryGetProperty("attendance", out JsonElement att) || att.ValueKind != JsonValueKind.Object) return true;
                    int employeeRecords = 0;
                    foreach (JsonProperty _ in att.EnumerateObject()) employeeRecords++;
                    if (employeeRecords == 0) return true;
                }

                if (module == "roster")
                {
                    if (!root.TryGetProperty("schedule", out JsonElement schedule) || schedule.ValueKind != JsonValueKind.Array) return true;
                }

                if (!string.IsNullOrWhiteSpace(seedJson))
                {
                    using JsonDocument seedDoc = JsonDocument.Parse(seedJson);
                    JsonElement seedRoot = seedDoc.RootElement;
                    string existingSaved = root.TryGetProperty("lastSaved", out JsonElement exLast) ? exLast.GetString() ?? "" : "";
                    string seedSaved = seedRoot.TryGetProperty("lastSaved", out JsonElement seedLast) ? seedLast.GetString() ?? "" : "";
                    if (DateTime.TryParse(seedSaved, out DateTime seedDt) && DateTime.TryParse(existingSaved, out DateTime existingDt))
                    {
                        if (seedDt > existingDt) return true;
                    }
                }
                return false;
            }
            catch
            {
                return true;
            }
        }

        private string ResetModuleFromSeed(string module)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Recovery module was not defined.");
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Recovery module is not approved for JSON restore: " + module);
            EnsureFolders();
            string seedPath = Path.Combine(appFolder, "seed", ModuleFileName(module));
            if (!File.Exists(seedPath)) throw new FileNotFoundException("Packaged recovery seed file was not found for module: " + module);
            string seedJson = File.ReadAllText(seedPath);
            JsonDocument.Parse(seedJson).Dispose();
            string dataDir = Path.Combine(settings.DataRoot, "Data");
            Directory.CreateDirectory(dataDir);
            string path = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(module)));
            if (!IsPathUnder(path, dataDir)) throw new InvalidOperationException("Resolved recovery path is outside the suite Data folder.");
            if (File.Exists(path))
            {
                string backupDir = ModuleBackupDir(module);
                Directory.CreateDirectory(backupDir);
                string backupName = Path.GetFileNameWithoutExtension(path) + "__pre-recovery__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + ".json";
                string backupPath = Path.GetFullPath(Path.Combine(backupDir, backupName));
                if (!IsPathUnder(backupPath, backupDir)) throw new InvalidOperationException("Recovery backup path resolved outside the module backup folder.");
                File.Copy(path, backupPath, true);
            }
            File.WriteAllText(path, seedJson);
            return seedJson;
        }

        private object SaveModuleData(string module, string json)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Save failed because module was not defined.");
            if (!IsKnownModule(module)) throw new InvalidOperationException("Save failed because module is not approved: " + module);
            if (string.IsNullOrWhiteSpace(json) || json == "undefined") throw new InvalidOperationException("Save failed because JSON payload was undefined for module: " + ModuleFolder(module));

            try
            {
                JsonDocument.Parse(json).Dispose(); // validate before touching live file
                EnsureFolders();
                string dataDir = Path.Combine(settings.DataRoot, "Data");
                Directory.CreateDirectory(dataDir);
                string path = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(module)));
                if (!IsPathUnder(path, dataDir)) throw new InvalidOperationException("Resolved save path is outside the suite Data folder.");

                string backupPath = "";
                if (File.Exists(path))
                {
                    string backupDir = ModuleBackupDir(module);
                    Directory.CreateDirectory(backupDir);
                    string backupName = Path.GetFileNameWithoutExtension(path) + "__auto-before-save__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + ".json";
                    backupPath = Path.GetFullPath(Path.Combine(backupDir, backupName));
                    if (!IsPathUnder(backupPath, backupDir)) throw new InvalidOperationException("Pre-save backup path resolved outside the module backup folder.");
                    File.Copy(path, backupPath, true);
                }

                string tempPath = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
                File.WriteAllText(tempPath, json);
                try
                {
                    if (File.Exists(path)) File.Copy(tempPath, path, true);
                    else File.Move(tempPath, path);
                }
                finally
                {
                    try { if (File.Exists(tempPath)) File.Delete(tempPath); } catch { }
                }

                FileInfo info = new FileInfo(path);
                return new { module, path = info.FullName, savedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), sizeBytes = info.Length, backupPath };
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Save failed for " + ModuleFolder(module) + ". Check shared-drive access and retry. Details: " + ex.Message, ex);
            }
        }
    }
}
