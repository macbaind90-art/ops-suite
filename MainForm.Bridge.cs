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
                        RequireBridgeCapability(root, "users.manage");
                        if (root.TryGetProperty("payload", out JsonElement settingsPayload))
                        {
                            SuiteSettings candidateSettings = JsonSerializer.Deserialize<SuiteSettings>(settingsPayload.GetRawText(), JsonOptions) ?? new SuiteSettings();
                            ValidateAndNormalizeSettingsForSave(candidateSettings);
                            if (string.IsNullOrWhiteSpace(candidateSettings.DataRoot)) candidateSettings.DataRoot = DefaultRoot;
                            settings = candidateSettings;
                            EnsureFolders();
                            SaveSettingsToDisk();
                            await Respond(requestId, true, new { settings });
                        }
                        else await Respond(requestId, false, new { error = "Missing settings payload." });
                        break;
                    case "suite:getMigrationStatus":
                        await Respond(requestId, true, GetSchemaMigrationStatus());
                        break;
                    case "suite:getMigrationHistory":
                        await Respond(requestId, true, GetSchemaMigrationHistory());
                        break;
                    case "suite:approveSchemaMigration":
                        if (!root.TryGetProperty("payload", out JsonElement migrationPayload)) throw new InvalidOperationException("Missing schema migration approval payload.");
                        string migrationModule = migrationPayload.TryGetProperty("module", out JsonElement mm) ? mm.GetString() ?? "" : "";
                        string migrationAdminId = migrationPayload.TryGetProperty("adminUserId", out JsonElement mai) ? mai.GetString() ?? "" : "";
                        string migrationAdminPin = migrationPayload.TryGetProperty("adminPin", out JsonElement map) ? map.GetString() ?? "" : "";
                        object migrationResult = ApproveSchemaMigration(migrationModule, migrationAdminId, migrationAdminPin);
                        TryRefreshDataHealth("migration");
                        await Respond(requestId, true, migrationResult);
                        break;
                    case "suite:getDataHealthSummary":
                        await Respond(requestId, true, GetDataHealthSummary());
                        break;
                    case "suite:getDataHealth":
                        if (!root.TryGetProperty("payload", out JsonElement healthPayload)) throw new InvalidOperationException("Missing Data Health credentials.");
                        string healthAdminId = healthPayload.TryGetProperty("adminUserId", out JsonElement hai) ? hai.GetString() ?? "" : "";
                        string healthAdminPin = healthPayload.TryGetProperty("adminPin", out JsonElement hap) ? hap.GetString() ?? "" : "";
                        string healthTrigger = healthPayload.TryGetProperty("trigger", out JsonElement ht) ? ht.GetString() ?? "manual-refresh" : "manual-refresh";
                        await Respond(requestId, true, GetDataHealthDashboard(healthAdminId, healthAdminPin, healthTrigger));
                        break;
                    case "suite:reviewHealthEvents":
                        if (!root.TryGetProperty("payload", out JsonElement reviewPayload)) throw new InvalidOperationException("Missing review credentials.");
                        string reviewAdminId = reviewPayload.TryGetProperty("adminUserId", out JsonElement rai) ? rai.GetString() ?? "" : "";
                        string reviewAdminPin = reviewPayload.TryGetProperty("adminPin", out JsonElement rap) ? rap.GetString() ?? "" : "";
                        await Respond(requestId, true, ReviewHealthEvents(reviewAdminId, reviewAdminPin));
                        break;
                    case "suite:previewLastKnownGood":
                        if (!root.TryGetProperty("payload", out JsonElement lkgPreviewPayload)) throw new InvalidOperationException("Missing LKG preview payload.");
                        string lkgPreviewModule = lkgPreviewPayload.TryGetProperty("module", out JsonElement lpm) ? lpm.GetString() ?? "" : "";
                        string lkgPreviewAdminId = lkgPreviewPayload.TryGetProperty("adminUserId", out JsonElement lpai) ? lpai.GetString() ?? "" : "";
                        string lkgPreviewAdminPin = lkgPreviewPayload.TryGetProperty("adminPin", out JsonElement lpap) ? lpap.GetString() ?? "" : "";
                        await Respond(requestId, true, PreviewLastKnownGood(lkgPreviewModule, lkgPreviewAdminId, lkgPreviewAdminPin));
                        break;
                    case "suite:restoreLastKnownGood":
                        if (!root.TryGetProperty("payload", out JsonElement lkgRestorePayload)) throw new InvalidOperationException("Missing LKG restore payload.");
                        string lkgRestoreModule = lkgRestorePayload.TryGetProperty("module", out JsonElement lrm) ? lrm.GetString() ?? "" : "";
                        string lkgRestoreReason = lkgRestorePayload.TryGetProperty("reason", out JsonElement lrr) ? lrr.GetString() ?? "" : "";
                        string lkgRestoreRevision = lkgRestorePayload.TryGetProperty("expectedRevision", out JsonElement lrev) ? lrev.GetString() ?? "" : "";
                        string lkgRestoreAdminId = lkgRestorePayload.TryGetProperty("adminUserId", out JsonElement lrai) ? lrai.GetString() ?? "" : "";
                        string lkgRestoreAdminPin = lkgRestorePayload.TryGetProperty("adminPin", out JsonElement lrap) ? lrap.GetString() ?? "" : "";
                        await Respond(requestId, true, RestoreLastKnownGood(lkgRestoreModule, lkgRestoreReason, lkgRestoreRevision, lkgRestoreAdminId, lkgRestoreAdminPin));
                        break;
                    case "suite:exportDataHealthDiagnostics":
                        if (!root.TryGetProperty("payload", out JsonElement diagnosticsPayload)) throw new InvalidOperationException("Missing diagnostics credentials.");
                        string diagnosticsAdminId = diagnosticsPayload.TryGetProperty("adminUserId", out JsonElement dai) ? dai.GetString() ?? "" : "";
                        string diagnosticsAdminPin = diagnosticsPayload.TryGetProperty("adminPin", out JsonElement dap) ? dap.GetString() ?? "" : "";
                        await Respond(requestId, true, ExportDataHealthDiagnostics(diagnosticsAdminId, diagnosticsAdminPin));
                        break;
                    case "suite:recordConflictResolution":
                        if (!root.TryGetProperty("payload", out JsonElement conflictResolutionPayload)) throw new InvalidOperationException("Missing conflict resolution payload.");
                        string conflictResolutionModule = conflictResolutionPayload.TryGetProperty("module", out JsonElement crm) ? crm.GetString() ?? "" : "";
                        string conflictResolution = conflictResolutionPayload.TryGetProperty("resolution", out JsonElement cr) ? cr.GetString() ?? "" : "";
                        await Respond(requestId, true, RecordConflictResolution(conflictResolutionModule, conflictResolution));
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
                        if (!root.TryGetProperty("payload", out JsonElement resetPayload)) throw new InvalidOperationException("Missing packaged recovery approval payload.");
                        string resetReason = resetPayload.TryGetProperty("reason", out JsonElement rr) ? rr.GetString() ?? "" : "";
                        string resetAdminId = resetPayload.TryGetProperty("adminUserId", out JsonElement rai2) ? rai2.GetString() ?? "" : "";
                        string resetAdminPin = resetPayload.TryGetProperty("adminPin", out JsonElement rap2) ? rap2.GetString() ?? "" : "";
                        string resetJson = ResetModuleFromSeed(resetModule, resetReason, resetAdminId, resetAdminPin);
                        string resetPath = Path.Combine(settings.DataRoot, "Data", ModuleFileName(resetModule));
                        await Respond(requestId, true, new { module = resetModule, data = resetJson, revision = GetDataRevision(resetPath).Token, schemaVersion = CurrentSchemaVersion(resetModule), expectedSchemaVersion = CurrentSchemaVersion(resetModule), lastWrittenByAppVersion = AppVersion, schemaStatus = "current", schemaMessage = "Schema is current.", writeAllowed = true });
                        break;
                    case "suite:saveModuleData":
                        string saveModule = root.TryGetProperty("module", out JsonElement sm) ? sm.GetString() ?? "" : "";
                        RequireModuleWriteCapability(root, saveModule);
                        string json = root.TryGetProperty("payload", out JsonElement dataPayload) ? dataPayload.GetRawText() : "{}";
                        string expectedRevision = root.TryGetProperty("expectedRevision", out JsonElement er) ? er.GetString() ?? "" : "";
                        var saveInfo = SaveModuleData(saveModule, json, expectedRevision);
                        await Respond(requestId, true, saveInfo);
                        break;
                    case "suite:saveModuleData2":
                        if (!root.TryGetProperty("payload", out JsonElement savePayload)) throw new InvalidOperationException("Missing save payload.");
                        string saveModule2 = savePayload.TryGetProperty("module", out JsonElement sm2) ? sm2.GetString() ?? "" : "";
                        string json2 = savePayload.TryGetProperty("json", out JsonElement js2) ? js2.GetString() ?? "" : "";
                        string expectedRevision2 = savePayload.TryGetProperty("expectedRevision", out JsonElement er2) ? er2.GetString() ?? "" : "";
                        if (string.IsNullOrWhiteSpace(saveModule2)) throw new InvalidOperationException("Save module was not defined by the interface.");
                        if (string.IsNullOrWhiteSpace(json2) || json2 == "undefined") throw new InvalidOperationException("Save JSON payload was undefined before write.");
                        RequireModuleWriteCapability(root, saveModule2);
                        var saveInfo2 = SaveModuleData(saveModule2, json2, expectedRevision2);
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
                        RequireBridgeCapability(root, "data.restore");
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
                        string restoreReason = restorePayload.TryGetProperty("reason", out JsonElement rsr) ? rsr.GetString() ?? "" : "";
                        string restoreAdminId = restorePayload.TryGetProperty("adminUserId", out JsonElement rsai) ? rsai.GetString() ?? "" : "";
                        string restoreAdminPin = restorePayload.TryGetProperty("adminPin", out JsonElement rsap) ? rsap.GetString() ?? "" : "";
                        string restoredJson = RestoreBackup(restoreModule, restorePath, restoreReason, restoreAdminId, restoreAdminPin);
                        string restoredLivePath = Path.Combine(settings.DataRoot, "Data", ModuleFileName(restoreModule));
                        await Respond(requestId, true, new { module = restoreModule, data = restoredJson, restoredFrom = restorePath, revision = GetDataRevision(restoredLivePath).Token, schemaVersion = CurrentSchemaVersion(restoreModule), expectedSchemaVersion = CurrentSchemaVersion(restoreModule), lastWrittenByAppVersion = AppVersion, schemaStatus = "current", schemaMessage = "Schema is current.", writeAllowed = true });
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
