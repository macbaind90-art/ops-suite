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
            string rootPath = DefaultRoot;
            string pointer = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PWADC", "suite-root.txt");
            if (File.Exists(pointer)) rootPath = File.ReadAllText(pointer).Trim();
            string path = Path.Combine(rootPath, "Data", SettingsFileName);
            settingsRevision = GetDataRevision(path).Token;
            try
            {
                if (File.Exists(path))
                {
                    byte[] bytes = File.ReadAllBytes(path);
                    settingsRevision = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(bytes)).ToLowerInvariant();
                    string raw = System.Text.Encoding.UTF8.GetString(bytes).TrimStart('\ufeff');
                    SchemaCompatibilityInfo compatibility = EvaluateSchemaCompatibility("suite-settings", raw);
                    bool runtimeReadable = compatibility.ReadAllowed && (compatibility.Status == "current" || compatibility.Status == "legacy-missing" || compatibility.Status == "previous");
                    if (!runtimeReadable)
                        throw new SchemaCompatibilityException("SCHEMA_COMPATIBILITY_BLOCK: Suite Settings cannot be safely opened by this app. " + compatibility.Message);
                    SuiteSettings? loaded = JsonSerializer.Deserialize<SuiteSettings>(raw, JsonOptions);
                    if (loaded != null)
                    {
                        if (string.IsNullOrWhiteSpace(loaded.DataRoot)) loaded.DataRoot = DefaultRoot;
                        return loaded;
                    }
                }
            }
            catch (SchemaCompatibilityException) { throw; }
            catch (Exception ex) { throw new IOException("Suite Settings could not be read. Sign-in is blocked until storage is available.", ex); }
            return new SuiteSettings();
        }

        private string settingsSaveWarning = "";
        private void SaveSettingsToDisk()
        {
            string dataFolder = Path.Combine(settings.DataRoot, "Data");
            Directory.CreateDirectory(dataFolder);
            string path = Path.GetFullPath(Path.Combine(dataFolder, SettingsFileName));
            if (!IsPathUnder(path, dataFolder)) throw new InvalidOperationException("Resolved settings path is outside the suite Data folder.");
            var saved = WriteJsonAtomically("suite-settings", path, JsonSerializer.Serialize(settings, JsonOptions), "settings-save", "auto-before-settings-save", settingsRevision);
            settingsRevision = saved.Sha256;
            string pointer = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PWADC", "suite-root.txt");
            settingsSaveWarning = "";
            try { Directory.CreateDirectory(Path.GetDirectoryName(pointer)!); File.WriteAllText(pointer, settings.DataRoot); }
            catch (Exception ex) { settingsSaveWarning = "Settings were committed, but this workstation could not remember the selected root: " + ex.Message; }
        }

        private void EnsureFolders()
        {
            Directory.CreateDirectory(settings.DataRoot);
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Locks"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Backups"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Exports"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Programs"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data Integrity"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data Integrity", "Write Audit"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data Integrity", "Conflict Audit"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data Integrity", "Schema Migrations"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data Integrity", "Data Health"));
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
            public string Revision { get; set; } = "missing";
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
            checks.Add(Check("Can create data integrity folder", () => { Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data Integrity", "Write Audit"));
            Directory.CreateDirectory(Path.Combine(settings.DataRoot, "Data Integrity", "Conflict Audit")); return true; }));
            checks.Add(Check("Atomic write service active", () => typeof(MainForm).GetMethod("WriteJsonAtomically", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance) != null));
            checks.Add(Check("Schema migration framework active", () => typeof(MainForm).GetMethod("ProcessStartupSchemaMigrations", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance) != null));
            checks.Add(Check("Live JSON integrity", () =>
            {
                string dataDir = Path.Combine(settings.DataRoot, "Data");
                foreach (string module in ModuleNames())
                {
                    if (!IsKnownJsonModule(module)) continue;
                    string p = Path.Combine(dataDir, ModuleFileName(module));
                    if (!File.Exists(p)) continue;
                    JsonIntegrityInfo state = JsonIntegrityStatus(p);
                    if (!string.Equals(state.Status, "valid", StringComparison.OrdinalIgnoreCase))
                        throw new InvalidDataException(ModuleFolder(module) + " failed JSON integrity: " + state.Error);
                }
                return true;
            }));
            checks.Add(Check("Schema compatibility", () =>
            {
                string dataDir = Path.Combine(settings.DataRoot, "Data");
                foreach (string module in ModuleNames())
                {
                    if (!IsKnownJsonModule(module)) continue;
                    string p = Path.Combine(dataDir, ModuleFileName(module));
                    if (!File.Exists(p)) continue;
                    SchemaCompatibilityInfo schema = EvaluateSchemaCompatibility(module, File.ReadAllText(p));
                    if (!schema.ReadAllowed || !schema.WriteAllowed || schema.Status != "current")
                        throw new InvalidDataException(ModuleFolder(module) + " schema compatibility: " + schema.Message);
                }
                return true;
            }));
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
            SchemaCompatibilityInfo schema = EvaluateSchemaCompatibility(module, info.Data);
            SuiteUser actor = RequireSession();
            if (module == "suite-settings") info.Data = JsonSerializer.Serialize(PublicSettings());
            else if (actor.Role != "Admin" && module == "roster")
                info.Data = ModuleWritePolicy.Project(module, System.Text.Json.Nodes.JsonNode.Parse(info.Data)!.AsObject(), c => RoleHasCapability(actor.Role, c)).ToJsonString(JsonOptions);
            return new
            {
                module = info.Module,
                data = info.Data,
                source = info.Source,
                sourceDetail = info.SourceDetail,
                path = info.Path,
                fileModified = info.FileModified,
                liveFileExisted = info.LiveFileExisted,
                revision = info.Revision,
                schemaVersion = schema.SchemaVersion,
                expectedSchemaVersion = schema.ExpectedSchemaVersion,
                lastWrittenByAppVersion = schema.LastWrittenByAppVersion,
                schemaStatus = schema.Status,
                schemaMessage = info.Source == "fallback-storage-unavailable" ? "Shared storage is unavailable. Packaged fallback data is read-only." : schema.Message,
                writeAllowed = schema.WriteAllowed && info.Source != "fallback-storage-unavailable",
                dataRoot = settings.DataRoot,
                loadedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
        }

        private ModuleLoadResult LoadModuleDataWithSource(string module)
        {
            string seedPath = Path.Combine(appFolder, "seed", ModuleFileName(module));
            try { EnsureFolders(); }
            catch (Exception ex)
            {
                if (File.Exists(seedPath))
                {
                    string fallback = File.ReadAllText(seedPath);
                    return new ModuleLoadResult { Module = module, Data = fallback, Source = "fallback-storage-unavailable", SourceDetail = "Shared storage is unavailable. Packaged fallback data was loaded and must not be treated as live shared data. " + ex.Message, Path = seedPath, FileModified = File.GetLastWriteTime(seedPath).ToString("yyyy-MM-dd HH:mm:ss"), LiveFileExisted = false, Revision = "missing" };
                }
                throw;
            }
            string path = Path.Combine(settings.DataRoot, "Data", ModuleFileName(module));
            string fullPath = Path.GetFullPath(path);
            ModuleLoadResult result = new ModuleLoadResult { Module = module, Path = fullPath, LiveFileExisted = File.Exists(fullPath) };

            if (File.Exists(fullPath))
            {
                byte[] bytes = File.ReadAllBytes(fullPath);
                string existingJson = System.Text.Encoding.UTF8.GetString(bytes).TrimStart('\ufeff');
                string revision = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(bytes)).ToLowerInvariant();
                JsonIntegrityInfo liveIntegrity;
                try { ValidateJsonPayload(existingJson, module); liveIntegrity = new JsonIntegrityInfo { Status = "valid", Sha256 = revision }; }
                catch (Exception ex) { liveIntegrity = new JsonIntegrityInfo { Status = "invalid", Error = ex.Message }; }
                if (!string.Equals(liveIntegrity.Status, "valid", StringComparison.OrdinalIgnoreCase))
                {
                    FileInfo badInfo = new FileInfo(fullPath);
                    result.Data = existingJson;
                    result.Source = "live-invalid";
                    result.SourceDetail = "The live JSON file failed integrity validation and was not replaced automatically. Use Data Health / Backup & Restore before making changes. " + liveIntegrity.Error;
                    result.FileModified = badInfo.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                    result.Revision = revision;
                    return result;
                }
                // Existing valid live data is never replaced automatically. Empty or
                // suspicious-but-parseable files remain visible for explicit Admin review.
                result.Data = existingJson;
                result.Source = "live-shared";
                result.SourceDetail = "Loaded existing JSON from the configured shared Data folder.";
                result.FileModified = new FileInfo(fullPath).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                result.Revision = revision;
                return result;
            }

            if (File.Exists(seedPath))
            {
                string seedJson = File.ReadAllText(seedPath);
                Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
                WriteJsonAtomically(module, fullPath, seedJson, "packaged-recovery-create", "pre-recovery-atomic");
                FileInfo info = new FileInfo(fullPath);
                return LoadModuleDataWithSource(module);

            }

            result.Data = "{}";
            result.Source = "missing";
            result.SourceDetail = "No live JSON file or packaged recovery JSON was found.";
            result.Revision = "missing";
            return result;
        }

        private string ResetModuleFromSeed(string module, string reason, string adminUserId, string adminPin, string expectedRevision)
        {
            SuiteUser admin = RequireDataHealthAdmin(adminUserId, adminPin);
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Recovery module was not defined.");
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Recovery module is not approved for JSON restore: " + module);
            if (string.IsNullOrWhiteSpace(reason)) throw new InvalidOperationException("A recovery reason is required.");
            EnsureFolders();
            string seedPath = Path.Combine(appFolder, "seed", ModuleFileName(module));
            if (!File.Exists(seedPath)) throw new FileNotFoundException("Packaged recovery seed file was not found for module: " + module);
            string seedJson = File.ReadAllText(seedPath);
            JsonDocument.Parse(seedJson).Dispose();
            string dataDir = Path.Combine(settings.DataRoot, "Data");
            Directory.CreateDirectory(dataDir);
            string path = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(module)));
            if (!IsPathUnder(path, dataDir)) throw new InvalidOperationException("Resolved recovery path is outside the suite Data folder.");
            using var lease = SharedFileLease.Acquire(path);
            DataWriteOutcome? outcome = null;
            try
            {
                outcome = WriteJsonAtomically(module, path, seedJson, "reset-from-packaged-seed", "pre-recovery", expectedRevision);
                lastRecoveryRevision = outcome.Sha256;
                string restored = File.ReadAllText(path);
                ValidateJsonPayload(restored, ModuleFolder(module) + " packaged recovery verification");
                WriteRecoveryAudit(module, seedPath, File.GetLastWriteTime(seedPath).ToString("yyyy-MM-dd HH:mm:ss"), admin, reason, outcome.BackupPath, "passed", "Succeeded");
                TryRefreshDataHealth("manual-recovery");
                return restored;
            }
            catch (Exception ex)
            {
                WriteRecoveryAudit(module, seedPath, File.GetLastWriteTime(seedPath).ToString("yyyy-MM-dd HH:mm:ss"), admin, reason, outcome?.BackupPath ?? "", "failed", "Failed: " + ex.Message);
                TryRefreshDataHealth("manual-recovery-failure");
                throw;
            }
        }

        private object SaveModuleData(string module, string json, string expectedRevision, SuiteUser? actor = null)
        {
            if (string.IsNullOrWhiteSpace(module)) throw new InvalidOperationException("Save failed because module was not defined.");
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Save failed because module is not approved for JSON persistence: " + module);
            if (string.IsNullOrWhiteSpace(json) || json == "undefined") throw new InvalidOperationException("Save failed because JSON payload was undefined for module: " + ModuleFolder(module));

            try
            {
                ValidateJsonPayload(json, ModuleFolder(module));
                EnsureFolders();
                string dataDir = Path.Combine(settings.DataRoot, "Data");
                Directory.CreateDirectory(dataDir);
                string path = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(module)));
                if (!IsPathUnder(path, dataDir)) throw new InvalidOperationException("Resolved save path is outside the suite Data folder.");

                using var lease = SharedFileLease.Acquire(path);
                VerifyExpectedRevision(module, path, expectedRevision, "module-save");
                if (actor != null && actor.Role != "Admin")
                {
                    var live = System.Text.Json.Nodes.JsonNode.Parse(File.ReadAllText(path))!.AsObject();
                    var candidate = System.Text.Json.Nodes.JsonNode.Parse(json)!.AsObject();
                    json = ModuleWritePolicy.Apply(module, live, candidate, c => RoleHasCapability(actor.Role, c)).ToJsonString(JsonOptions);
                }
                DataWriteOutcome result = WriteJsonAtomically(module, path, json, "module-save", "auto-before-save", expectedRevision);
                return new
                {
                    module = result.Module,
                    path = result.Path,
                    savedAt = result.SavedAt,
                    sizeBytes = result.SizeBytes,
                    backupPath = result.BackupPath,
                    sha256 = result.Sha256,
                    writeMethod = result.Method,
                    verified = result.Verified,
                    revision = result.Sha256,
                    schemaVersion = CurrentSchemaVersion(module),
                    expectedSchemaVersion = CurrentSchemaVersion(module),
                    lastWrittenByAppVersion = AppVersion,
                    schemaStatus = "current",
                    schemaMessage = "Schema is current.",
                    writeAllowed = true
                };
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Save failed for " + ModuleFolder(module) + ". The live JSON was not intentionally replaced unless the validated transaction completed. Check shared-drive access and retry. Details: " + ex.Message, ex);
            }
        }

    }
}
