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
                        await Respond(requestId, true, new { module = loadModule, data = LoadModuleData(loadModule) });
                        break;
                    case "suite:resetModuleFromSeed":
                        string resetModule = root.TryGetProperty("module", out JsonElement rm) ? rm.GetString() ?? "" : "";
                        string resetJson = ResetModuleFromSeed(resetModule);
                        await Respond(requestId, true, new { module = resetModule, data = resetJson });
                        break;
                    case "suite:saveModuleData":
                        string saveModule = root.TryGetProperty("module", out JsonElement sm) ? sm.GetString() ?? "" : "";
                        string json = root.TryGetProperty("payload", out JsonElement dataPayload) ? dataPayload.GetRawText() : "{}";
                        SaveModuleData(saveModule, json);
                        await Respond(requestId, true, new { module = saveModule, savedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") });
                        break;
                    case "suite:saveModuleData2":
                        if (!root.TryGetProperty("payload", out JsonElement savePayload)) throw new InvalidOperationException("Missing save payload.");
                        string saveModule2 = savePayload.TryGetProperty("module", out JsonElement sm2) ? sm2.GetString() ?? "" : "";
                        string json2 = savePayload.TryGetProperty("json", out JsonElement js2) ? js2.GetString() ?? "" : "";
                        if (string.IsNullOrWhiteSpace(saveModule2)) throw new InvalidOperationException("Save module was not defined by the interface.");
                        if (string.IsNullOrWhiteSpace(json2) || json2 == "undefined") throw new InvalidOperationException("Save JSON payload was undefined before write.");
                        SaveModuleData(saveModule2, json2);
                        await Respond(requestId, true, new { module = saveModule2, savedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") });
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
            return new { dataRoot = settings.DataRoot, checks };
        }

        private object Check(string name, Func<bool> fn)
        {
            try { return new { name, ok = fn(), error = "" }; }
            catch (Exception ex) { return new { name, ok = false, error = ex.Message }; }
        }

        private string LoadModuleData(string module)
        {
            EnsureFolders();
            string path = Path.Combine(settings.DataRoot, "Data", ModuleFileName(module));
            string seedPath = Path.Combine(appFolder, "seed", ModuleFileName(module));

            if (File.Exists(path))
            {
                string existingJson = File.ReadAllText(path);
                string seedJsonForCompare = File.Exists(seedPath) ? File.ReadAllText(seedPath) : "";
                if (!ShouldReplaceWithSeed(module, existingJson, seedJsonForCompare))
                {
                    return existingJson;
                }

                if (File.Exists(seedPath))
                {
                    string backupDir = Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module));
                    Directory.CreateDirectory(backupDir);
                    string backupName = ModuleFileName(module).Replace(".json", "-replaced-empty-" + DateTime.Now.ToString("yyyyMMdd-HHmmssfff") + ".json");
                    File.WriteAllText(Path.Combine(backupDir, backupName), existingJson);
                    string seedJson = File.ReadAllText(seedPath);
                    File.WriteAllText(path, seedJson);
                    return seedJson;
                }

                return existingJson;
            }

            if (File.Exists(seedPath))
            {
                string seedJson = File.ReadAllText(seedPath);
                File.WriteAllText(path, seedJson);
                return seedJson;
            }
            return "{}";
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
            EnsureFolders();
            string seedPath = Path.Combine(appFolder, "seed", ModuleFileName(module));
            if (!File.Exists(seedPath)) throw new FileNotFoundException("Packaged seed file not found for module: " + module);
            string seedJson = File.ReadAllText(seedPath);
            JsonDocument.Parse(seedJson).Dispose();
            string path = Path.Combine(settings.DataRoot, "Data", ModuleFileName(module));
            if (File.Exists(path))
            {
                string backupName = Path.GetFileNameWithoutExtension(path) + "-before-seed-restore-" + DateTime.Now.ToString("yyyyMMdd-HHmmssfff") + ".json";
                File.Copy(path, Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module), backupName), true);
            }
            File.WriteAllText(path, seedJson);
            return seedJson;
        }

        private void SaveModuleData(string module, string json)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Save failed because module was not defined.");
            if (string.IsNullOrWhiteSpace(json) || json == "undefined") throw new InvalidOperationException("Save failed because JSON payload was undefined.");
            // Validate JSON before touching the current live file.
            JsonDocument.Parse(json).Dispose();
            EnsureFolders();
            string dataDir = Path.Combine(settings.DataRoot, "Data");
            Directory.CreateDirectory(dataDir);
            string path = Path.Combine(dataDir, ModuleFileName(module));

            // Backups should protect the save, not block it. If backup fails because of a
            // transient share/lock issue, still attempt the live save and report only if that fails.
            try
            {
                if (File.Exists(path))
                {
                    string backupDir = Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module));
                    Directory.CreateDirectory(backupDir);
                    string backupName = Path.GetFileNameWithoutExtension(path) + "-before-save-" + DateTime.Now.ToString("yyyyMMdd-HHmmssfff") + ".json";
                    File.Copy(path, Path.Combine(backupDir, backupName), true);
                }
            }
            catch { }

            string tempPath = path + ".tmp";
            File.WriteAllText(tempPath, json);
            if (File.Exists(path))
            {
                File.Copy(tempPath, path, true);
                File.Delete(tempPath);
            }
            else
            {
                File.Move(tempPath, path);
            }
        }

        private string CreateBackup(string module, string json)
        {
            JsonDocument.Parse(json).Dispose();
            EnsureFolders();
            string backupName = ModuleFolder(module).ToLowerInvariant().Replace(" ", "-") + "-backup-" + DateTime.Now.ToString("yyyyMMdd-HHmmssfff") + ".json";
            string path = Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module), backupName);
            File.WriteAllText(path, json);
            return path;
        }

        private string WriteExport(string module, string fileName, string content)
        {
            EnsureFolders();
            string safeName = string.Join("_", fileName.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
            string path = Path.Combine(settings.DataRoot, "Exports", ModuleFolder(module), safeName);
            File.WriteAllText(path, content);
            return path;
        }



        private object ListBackups(string module)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Backup module was not defined.");
            EnsureFolders();
            string folder = Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module));
            Directory.CreateDirectory(folder);
            var backups = new List<object>();
            foreach (string file in Directory.GetFiles(folder, "*", SearchOption.TopDirectoryOnly))
            {
                FileInfo info = new FileInfo(file);
                backups.Add(new { name = info.Name, path = info.FullName, modified = info.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss"), sizeBytes = info.Length });
            }
            backups.Sort((a, b) => StringComparer.OrdinalIgnoreCase.Compare((string)b.GetType().GetProperty("modified")!.GetValue(b)!, (string)a.GetType().GetProperty("modified")!.GetValue(a)!));
            return new { module, backups };
        }

        private object ReadBackupSummary(string module, string backupPath)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Backup module was not defined.");
            if (string.IsNullOrWhiteSpace(backupPath)) throw new InvalidOperationException("Backup path was not provided.");
            EnsureFolders();
            string fullBackupPath = Path.GetFullPath(Environment.ExpandEnvironmentVariables(backupPath));
            string allowedRoot = Path.GetFullPath(Path.Combine(settings.DataRoot, "Backups"));
            if (!fullBackupPath.StartsWith(allowedRoot, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Backup path is outside the suite backup folder.");
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
            if (string.IsNullOrWhiteSpace(backupPath)) throw new InvalidOperationException("Restore backup path was not provided.");
            EnsureFolders();
            string fullBackupPath = Path.GetFullPath(Environment.ExpandEnvironmentVariables(backupPath));
            string allowedRoot = Path.GetFullPath(Path.Combine(settings.DataRoot, "Backups"));
            if (!fullBackupPath.StartsWith(allowedRoot, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Restore path is outside the suite backup folder.");
            if (!File.Exists(fullBackupPath)) throw new FileNotFoundException("Backup file was not found: " + fullBackupPath);
            string json = File.ReadAllText(fullBackupPath);
            JsonDocument.Parse(json).Dispose();
            string livePath = Path.Combine(settings.DataRoot, "Data", ModuleFileName(module));
            if (File.Exists(livePath))
            {
                string preRestoreDir = Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module));
                Directory.CreateDirectory(preRestoreDir);
                string preRestoreName = Path.GetFileNameWithoutExtension(livePath) + "-before-restore-" + DateTime.Now.ToString("yyyyMMdd-HHmmssfff") + ".json";
                File.Copy(livePath, Path.Combine(preRestoreDir, preRestoreName), true);
            }
            File.WriteAllText(livePath, json);
            return json;
        }

        private void OpenPath(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) throw new InvalidOperationException("No path was provided.");
            string expanded = Environment.ExpandEnvironmentVariables(path);
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
            string dest = Path.Combine(settings.DataRoot, "Backups", "Programs", "Programs_" + stamp);
            CopyDirectory(source, dest, true);
            return dest;
        }

        private void CreateSuiteLockFile()
        {
            try
            {
                EnsureFolders();
                var lockInfo = new { user = Environment.UserName, machine = Environment.MachineName, openedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), version = "3.1.10" };
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

        private object GetEnvironmentInfo() => new { user = Environment.UserName, machine = Environment.MachineName, version = "3.1.10", baseDirectory = AppContext.BaseDirectory };
        private static string[] ModuleNames() => new[] { "attendance", "roster", "tasks", "suite-settings", "programs" };
        private static string ModuleFileName(string module) => module switch
        {
            "attendance" => "attendance-data.json", "roster" => "roster-data.json", "tasks" => "tasks-data.json", _ => module + ".json"
        };
        private static string ModuleFolder(string module) => module switch
        {
            "attendance" => "Attendance", "roster" => "Roster", "tasks" => "Task Tracker", "suite-settings" => "Suite Settings", "programs" => "Programs", _ => module
        };
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
