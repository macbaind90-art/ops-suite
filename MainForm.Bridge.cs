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
    }
}
