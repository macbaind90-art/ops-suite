using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.Collections.Generic;
using System.IO;
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
            foreach (string module in ModuleNames())
            {
                Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Backups", ModuleFolder(module)));
                Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Exports", ModuleFolder(module)));
            }
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

        private void CreateSuiteLockFile()
        {
            try
            {
                EnsureFolders();
                var lockInfo = new { user = Environment.UserName, machine = Environment.MachineName, openedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), version = "2.4.12" };
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

        private object GetEnvironmentInfo() => new { user = Environment.UserName, machine = Environment.MachineName, version = "2.4.12", baseDirectory = AppContext.BaseDirectory };
        private static string[] ModuleNames() => new[] { "attendance", "roster", "tasks", "badge-audit", "amag-audit", "access-audit", "suite-settings" };
        private static string ModuleFileName(string module) => module switch
        {
            "attendance" => "attendance-data.json", "roster" => "roster-data.json", "tasks" => "tasks-data.json", "badge-audit" => "badge-audit-data.json", "amag-audit" => "amag-audit-data.json", "access-audit" => "access-audit-data.json", _ => module + ".json"
        };
        private static string ModuleFolder(string module) => module switch
        {
            "attendance" => "Attendance", "roster" => "Roster", "tasks" => "Task Tracker", "badge-audit" => "Badge Audit", "amag-audit" => "AMAG Audit", "access-audit" => "Access Audit", "suite-settings" => "Suite Settings", _ => module
        };
    }

    public class SuiteSettings
    {
        public string Theme { get; set; } = "dark";
        public string DefaultModule { get; set; } = "home";
        public string Pin { get; set; } = "1234";
        public string DataRoot { get; set; } = @"\\pig-fs\Security\MacBain\Security Operations Suite";
        public int BackupRetentionDays { get; set; } = 60;
    }
}
