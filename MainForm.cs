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
    public class MainForm : Form
    {
        private readonly WebView2 webView;
        private readonly string appFolder;
        private readonly string indexPath;

        private const string DefaultRoot = @"\\pig-fs\Security\MacBain\Security Operations Suite";
        private const string SettingsFileName = "suite-settings.json";
        private SuiteSettings settings = new SuiteSettings();
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, WriteIndented = true };

        public MainForm()
        {
            Text = "PWADC Security Operations Suite";
            AutoScaleMode = AutoScaleMode.Dpi;
            MinimumSize = new System.Drawing.Size(1100, 700);
            Width = 1500;
            Height = 950;
            StartPosition = FormStartPosition.CenterScreen;
            WindowState = FormWindowState.Maximized;
            appFolder = Path.Combine(AppContext.BaseDirectory, "app");
            indexPath = Path.Combine(appFolder, "index.html");
            webView = new WebView2 { Dock = DockStyle.Fill };
            Controls.Add(webView);
            Load += MainForm_Load;
            FormClosing += MainForm_FormClosing;
        }

        private async void MainForm_Load(object? sender, EventArgs e)
        {
            try
            {
                settings = LoadSettingsFromDisk();
                EnsureFolders();
                CreateSuiteLockFile();
                await webView.EnsureCoreWebView2Async();
                webView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;
                if (!File.Exists(indexPath))
                {
                    MessageBox.Show("Missing app\\index.html. The suite interface was not found.", "PWADC Security Operations Suite", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
                webView.Source = new Uri(indexPath);
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "PWADC Security Operations Suite", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void MainForm_FormClosing(object? sender, FormClosingEventArgs e) => TryDeleteSuiteLockFile();

        private async void CoreWebView2_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string requestId = "";
            try
            {
                using JsonDocument doc = JsonDocument.Parse(e.WebMessageAsJson);
                JsonElement root = doc.RootElement;
                requestId = root.TryGetProperty("id", out JsonElement idElement) ? idElement.GetString() ?? "" : "";
                string type = root.TryGetProperty("type", out JsonElement typeElement) ? typeElement.GetString() ?? "" : "";
                switch (type)
                {
                    case "suite:getSettings":
                        await Respond(requestId, true, new { settings, environment = GetEnvironmentInfo() });
                        break;
                    case "suite:saveSettings":
                        if (root.TryGetProperty("payload", out JsonElement settingsPayload))
                        {
                            settings = JsonSerializer.Deserialize<SuiteSettings>(settingsPayload.GetRawText(), JsonOptions) ?? new SuiteSettings();
                            if (string.IsNullOrWhiteSpace(settings.DataRoot)) settings.DataRoot = DefaultRoot;
                            EnsureFolders();
                            SaveSettingsToDisk();
                            await Respond(requestId, true, new { settings });
                        }
                        else await Respond(requestId, false, new { error = "Missing settings payload." });
                        break;
                    case "suite:healthCheck":
                        await Respond(requestId, true, RunHealthCheck());
                        break;
                    case "suite:loadModuleData":
                        string loadModule = root.TryGetProperty("module", out JsonElement lm) ? lm.GetString() ?? "" : "";
                        await Respond(requestId, true, LoadModuleDataEnvelope(loadModule));
                        break;
                    case "suite:resetModuleFromSeed":
                        string resetModule = root.TryGetProperty("module", out JsonElement rm) ? rm.GetString() ?? "" : "";
                        string resetJson = ResetModuleFromSeed(resetModule);
                        await Respond(requestId, true, new { module = resetModule, data = resetJson });
                        break;
                    case "suite:saveModuleData":
                        string saveModule = root.TryGetProperty("module", out JsonElement sm) ? sm.GetString() ?? "" : "";
                        string json = root.TryGetProperty("payload", out JsonElement dataPayload) ? dataPayload.GetRawText() : "{}";
                        var saveInfo = SaveModuleData(saveModule, json);
                        await Respond(requestId, true, saveInfo);
                        break;
                    case "suite:saveModuleData2":
                        if (!root.TryGetProperty("payload", out JsonElement savePayload)) throw new InvalidOperationException("Missing save payload.");
                        string saveModule2 = savePayload.TryGetProperty("module", out JsonElement sm2) ? sm2.GetString() ?? "" : "";
                        string json2 = savePayload.TryGetProperty("json", out JsonElement js2) ? js2.GetString() ?? "" : "";
                        if (string.IsNullOrWhiteSpace(saveModule2)) throw new InvalidOperationException("Save module was not defined by the interface.");
                        if (string.IsNullOrWhiteSpace(json2) || json2 == "undefined") throw new InvalidOperationException("Save JSON payload was undefined before write.");
                        var saveInfo2 = SaveModuleData(saveModule2, json2);
                        await Respond(requestId, true, saveInfo2);
                        break;
                    case "suite:createBackup":
                        string backupModule = root.TryGetProperty("module", out JsonElement bm) ? bm.GetString() ?? "" : "";
                        string backupJson = root.TryGetProperty("payload", out JsonElement bp) ? bp.GetRawText() : "{}";
                        string backupPath = CreateBackup(backupModule, backupJson);
                        await Respond(requestId, true, new { module = backupModule, path = backupPath });
                        break;
                    case "suite:writeExport":
                        string exportModule = root.TryGetProperty("module", out JsonElement em) ? em.GetString() ?? "" : "";
                        string fileName = root.TryGetProperty("fileName", out JsonElement fn) ? fn.GetString() ?? "export.txt" : "export.txt";
                        string content = root.TryGetProperty("payload", out JsonElement cp) ? cp.GetString() ?? "" : "";
                        string exportPath = WriteExport(exportModule, fileName, content);
                        await Respond(requestId, true, new { module = exportModule, path = exportPath });
                        break;
                    case "suite:openPath":
                        if (!root.TryGetProperty("payload", out JsonElement openPayload)) throw new InvalidOperationException("Missing open path payload.");
                        string openPath = openPayload.TryGetProperty("path", out JsonElement op) ? op.GetString() ?? "" : "";
                        OpenPath(openPath);
                        await Respond(requestId, true, new { path = openPath });
                        break;
                    case "suite:refreshPrograms":
                        CopyPackagedProgramsToShared(true);
                        await Respond(requestId, true, new { path = Path.Combine(settings.DataRoot, "Programs") });
                        break;
                    case "suite:backupPrograms":
                        string programsBackupPath = BackupProgramsFolder();
                        await Respond(requestId, true, new { path = programsBackupPath });
                        break;

                    case "suite:backupInventory":
                        await Respond(requestId, true, BackupInventory());
                        break;
                    case "suite:previewBackupCleanup":
                        if (!root.TryGetProperty("payload", out JsonElement cleanupPreviewPayload)) throw new InvalidOperationException("Missing cleanup preview payload.");
                        string cleanupPreviewModule = cleanupPreviewPayload.TryGetProperty("module", out JsonElement cpm) ? cpm.GetString() ?? "all" : "all";
                        await Respond(requestId, true, PreviewBackupCleanup(cleanupPreviewModule));
                        break;
                    case "suite:cleanupBackups":
                        if (!root.TryGetProperty("payload", out JsonElement cleanupPayload)) throw new InvalidOperationException("Missing cleanup payload.");
                        string cleanupModule = cleanupPayload.TryGetProperty("module", out JsonElement cm) ? cm.GetString() ?? "all" : "all";
                        await Respond(requestId, true, CleanupBackups(cleanupModule));
                        break;
                    case "suite:listBackups":
                        string listModule = root.TryGetProperty("module", out JsonElement lbm) ? lbm.GetString() ?? "" : "";
                        await Respond(requestId, true, ListBackups(listModule));
                        break;
                    case "suite:readBackupSummary":
                        if (!root.TryGetProperty("payload", out JsonElement summaryPayload)) throw new InvalidOperationException("Missing backup summary payload.");
                        string summaryModule = summaryPayload.TryGetProperty("module", out JsonElement sumMod) ? sumMod.GetString() ?? "" : "";
                        string summaryPath = summaryPayload.TryGetProperty("path", out JsonElement sumPath) ? sumPath.GetString() ?? "" : "";
                        await Respond(requestId, true, ReadBackupSummary(summaryModule, summaryPath));
                        break;
                    case "suite:restoreBackup":
                        if (!root.TryGetProperty("payload", out JsonElement restorePayload)) throw new InvalidOperationException("Missing restore payload.");
                        string restoreModule = restorePayload.TryGetProperty("module", out JsonElement rsm) ? rsm.GetString() ?? "" : "";
                        string restorePath = restorePayload.TryGetProperty("path", out JsonElement rsp) ? rsp.GetString() ?? "" : "";
                        string restoredJson = RestoreBackup(restoreModule, restorePath);
                        await Respond(requestId, true, new { module = restoreModule, data = restoredJson, restoredFrom = restorePath });
                        break;
                    default:
                        await Respond(requestId, false, new { error = "Unknown message type: " + type });
                        break;
                }
            }
            catch (Exception ex) { await Respond(requestId, false, new { error = ex.Message }); }
        }

        private async Task Respond(string requestId, bool ok, object payload)
        {
            if (webView.CoreWebView2 == null) return;
            string json = JsonSerializer.Serialize(new { id = requestId, ok, payload });
            await webView.CoreWebView2.ExecuteScriptAsync("window.SuiteBridge && window.SuiteBridge.receive(" + json + ");");
        }

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
            File.WriteAllText(path, json);
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
            if (File.Exists(livePath))
            {
                string preRestoreDir = ModuleBackupDir(module);
                Directory.CreateDirectory(preRestoreDir);
                string preRestoreName = Path.GetFileNameWithoutExtension(livePath) + "__pre-restore__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + ".json";
                string preRestorePath = Path.GetFullPath(Path.Combine(preRestoreDir, preRestoreName));
                if (!IsPathUnder(preRestorePath, preRestoreDir)) throw new InvalidOperationException("Pre-restore backup path resolved outside the module backup folder.");
                File.Copy(livePath, preRestorePath, true);
            }
            string tempPath = livePath + "." + Guid.NewGuid().ToString("N") + ".restore.tmp";
            File.WriteAllText(tempPath, json);
            try
            {
                if (File.Exists(livePath)) File.Copy(tempPath, livePath, true);
                else File.Move(tempPath, livePath);
            }
            finally
            {
                try { if (File.Exists(tempPath)) File.Delete(tempPath); } catch { }
            }
            return json;
        }

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
                var lockInfo = new { user = Environment.UserName, machine = Environment.MachineName, openedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), version = "3.2.3.2" };
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

        private object GetEnvironmentInfo() => new { user = Environment.UserName, machine = Environment.MachineName, version = "3.2.3.2", baseDirectory = AppContext.BaseDirectory };

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

    internal class BackupFileInfo
    {
        public string Module { get; }
        public string Name { get; }
        public string Path { get; }
        public DateTime Modified { get; }
        public string ModifiedText => Modified.ToString("yyyy-MM-dd HH:mm:ss");
        public long SizeBytes { get; }
        public string Kind { get; }
        public BackupFileInfo(string module, FileInfo info, string kind)
        {
            Module = module;
            Name = info.Name;
            Path = info.FullName;
            Modified = info.LastWriteTime;
            SizeBytes = info.Length;
            Kind = kind;
        }
    }

    internal class BackupPlanFile
    {
        public string Module { get; }
        public string Label { get; }
        public string Name { get; }
        public string Path { get; }
        public string Modified { get; }
        public long SizeBytes { get; }
        public string Kind { get; }
        public string Reason { get; set; } = "";
        public BackupPlanFile(BackupFileInfo file)
        {
            Module = file.Module;
            Label = MainForm.ModuleFolder(file.Module);
            Name = file.Name;
            Path = file.Path;
            Modified = file.ModifiedText;
            SizeBytes = file.SizeBytes;
            Kind = file.Kind;
        }
        public object ToResponse() => new { module = Module, label = Label, name = Name, path = Path, modified = Modified, sizeBytes = SizeBytes, kind = Kind, reason = Reason };
    }

    public class SuiteSettings
    {
        public string Theme { get; set; } = "dark";
        public string DefaultModule { get; set; } = "home";
        public string Pin { get; set; } = "1234";
        public string DataRoot { get; set; } = @"\\pig-fs\Security\MacBain\Security Operations Suite";
        public int BackupRetentionDays { get; set; } = 180;
        public double FtLoadedRate { get; set; } = 0.33;
        public double PtLoadedRate { get; set; } = 0.20;
        public double TempLoadedRate { get; set; } = 0.35;
        public double MonthlyMultiplier { get; set; } = 4.333;
        public double AnnualMultiplier { get; set; } = 52;
        public double FteBaselineHours { get; set; } = 40;
        public List<CoverageRequirement> CoverageRequirements { get; set; } = new List<CoverageRequirement>
        {
            new CoverageRequirement { Id = "cov1", Area = "1st Shift Core Supervisor", Section = "1st Shift", Post = "Supervisor", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "0800-1600 core supervisor coverage" },
            new CoverageRequirement { Id = "cov2", Area = "1st Shift Extra Supervisor", Section = "1st Shift", Post = "Supervisor", Days = new List<string> { "Mon", "Tue", "Wed" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Second supervisor row on Mon-Wed" },
            new CoverageRequirement { Id = "cov3", Area = "1st Shift Base", Section = "1st Shift", Post = "Base", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Base post coverage" },
            new CoverageRequirement { Id = "cov4", Area = "1st Shift Response", Section = "1st Shift", Post = "Response", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 2, HoursPerPost = 8, Notes = "Two response posts; current schedule has open response slots on Sun/Sat" },
            new CoverageRequirement { Id = "cov5", Area = "1st Shift Floater", Section = "1st Shift", Post = "Floater", Days = new List<string> { "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Floater coverage shown Thu-Fri" },
            new CoverageRequirement { Id = "cov6", Area = "2nd Shift Core Supervisor", Section = "2nd Shift", Post = "Supervisor", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "1600-2400 core supervisor coverage" },
            new CoverageRequirement { Id = "cov7", Area = "2nd Shift Extra Supervisor", Section = "2nd Shift", Post = "Supervisor", Days = new List<string> { "Mon", "Tue", "Wed" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Second supervisor row on Mon-Wed" },
            new CoverageRequirement { Id = "cov8", Area = "2nd Shift Base", Section = "2nd Shift", Post = "Base", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Base post coverage" },
            new CoverageRequirement { Id = "cov9", Area = "2nd Shift Response", Section = "2nd Shift", Post = "Response", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 2, HoursPerPost = 8, Notes = "Two response posts" },
            new CoverageRequirement { Id = "cov10", Area = "2nd Shift Floater", Section = "2nd Shift", Post = "Floater", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday floater coverage" },
            new CoverageRequirement { Id = "cov11", Area = "3rd Shift Core Supervisor", Section = "3rd Shift", Post = "Supervisor", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "0000-0800 core supervisor coverage" },
            new CoverageRequirement { Id = "cov12", Area = "3rd Shift Extra Supervisor", Section = "3rd Shift", Post = "Supervisor", Days = new List<string> { "Mon", "Tue", "Wed" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Second supervisor row on Mon-Wed" },
            new CoverageRequirement { Id = "cov13", Area = "3rd Shift Base", Section = "3rd Shift", Post = "Base", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Base post coverage" },
            new CoverageRequirement { Id = "cov14", Area = "3rd Shift Response", Section = "3rd Shift", Post = "Response", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 2, HoursPerPost = 8, Notes = "Two response posts" },
            new CoverageRequirement { Id = "cov15", Area = "3rd Shift Floater", Section = "3rd Shift", Post = "Floater", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Primary floater row" },
            new CoverageRequirement { Id = "cov16", Area = "3rd Shift Extra Floater", Section = "3rd Shift", Post = "Floater", Days = new List<string> { "Mon", "Thu" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Second floater row on Mon/Thu" },
            new CoverageRequirement { Id = "cov17", Area = "Gate 0400-1200", Section = "Gate", Post = "Gate 0400-1200", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday gate coverage" },
            new CoverageRequirement { Id = "cov18", Area = "Gate 1200-2000", Section = "Gate", Post = "Gate 1200-2000", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 2, HoursPerPost = 8, Notes = "Two weekday gate guards" },
            new CoverageRequirement { Id = "cov19", Area = "Gate 2000-0400", Section = "Gate", Post = "Gate 2000-0400", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday overnight gate coverage" },
            new CoverageRequirement { Id = "cov20", Area = "Gate 0400-1600 Weekend", Section = "Gate", Post = "Gate 0400-1600", Days = new List<string> { "Sun", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 12, Notes = "Weekend day gate coverage" },
            new CoverageRequirement { Id = "cov21", Area = "Gate 1600-0400 Weekend", Section = "Gate", Post = "Gate 1600-0400", Days = new List<string> { "Sun", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 12, Notes = "Weekend night gate coverage" },
            new CoverageRequirement { Id = "cov22", Area = "Grocery Dock 0600-1400", Section = "Dock & Support", Post = "Grocery 0600-1400", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday grocery dock coverage" },
            new CoverageRequirement { Id = "cov23", Area = "Crosswalk 0500-1300", Section = "Dock & Support", Post = "Crosswalk 0500-1300", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday crosswalk/dock surge coverage" },
            new CoverageRequirement { Id = "cov24", Area = "Reception 0800-1700", Section = "Dock & Support", Post = "Reception 0800-1700", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "9-hour window with 1-hour lunch relief covered by another guard; 8 hours for cost/HPW" }
        };
        public List<SuiteUser> Users { get; set; } = new List<SuiteUser>
        {
            new SuiteUser { Id = "admin", Username = "David", DisplayName = "David MacBain", Role = "Admin", Pin = "6268", Active = true },
            new SuiteUser { Id = "supervisor", Username = "Supervisor", DisplayName = "Supervisor", Role = "Supervisor", Pin = "1234", Active = false },
            new SuiteUser { Id = "lead", Username = "Lead", DisplayName = "Lead", Role = "Lead", Pin = "1111", Active = false },
            new SuiteUser { Id = "viewer", Username = "Viewer", DisplayName = "Viewer", Role = "Viewer", Pin = "0000", Active = false }
        };
    }

    public class CoverageRequirement
    {
        public string Id { get; set; } = "";
        public string Area { get; set; } = "Coverage Area";
        public string Section { get; set; } = "Coverage Area";
        public string DayType { get; set; } = "All";
        public string Post { get; set; } = "";
        public List<string> Days { get; set; } = new List<string>();
        public double RequiredHeadcount { get; set; } = 1;
        public double HoursPerPost { get; set; } = 8;
        public string Notes { get; set; } = "";
    }

    public class SuiteUser
    {
        public string Id { get; set; } = "";
        public string Username { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string Role { get; set; } = "Viewer";
        public string Pin { get; set; } = "1234";
        public bool Active { get; set; } = true;
    }
}
