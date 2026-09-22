using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private sealed class SharedStorageHealthInfo
        {
            public string Severity { get; set; } = "red";
            public bool Reachable { get; set; }
            public bool ReadAllowed { get; set; }
            public bool WriteAllowed { get; set; }
            public string LastChecked { get; set; } = "";
            public string LastSuccessfulConnection { get; set; } = "";
            public long? FreeSpaceBytes { get; set; }
            public string DataMode { get; set; } = "Fallback / recovery-loaded data";
            public string Error { get; set; } = "";
        }

        private sealed class LkgModuleState
        {
            public bool Available { get; set; }
            public bool Valid { get; set; }
            public bool CurrentToday { get; set; }
            public string SnapshotDate { get; set; } = "";
            public string CreatedAt { get; set; } = "";
            public string Path { get; set; } = "";
            public string Sha256 { get; set; } = "";
            public long SizeBytes { get; set; }
            public string SchemaVersion { get; set; } = "";
            public string Error { get; set; } = "";
        }

        private sealed class ConflictHealthInfo
        {
            public int Count30Days { get; set; }
            public string MostRecentAt { get; set; } = "";
            public string User { get; set; } = "";
            public string Machine { get; set; } = "";
            public string Resolution { get; set; } = "Unresolved / no resolution recorded";
            public string Trend { get; set; } = "None";
        }

        private sealed class ModuleHealthInfo
        {
            public string Module { get; set; } = "";
            public string Label { get; set; } = "";
            public string Severity { get; set; } = "gray";
            public string StatusLabel { get; set; } = "Not in Use / No Data Yet";
            public string AccessState { get; set; } = "Not checked";
            public bool Exists { get; set; }
            public string LivePath { get; set; } = "";
            public string LiveModified { get; set; } = "";
            public string LiveSha256 { get; set; } = "";
            public long LiveSizeBytes { get; set; }
            public string IntegrityStatus { get; set; } = "unknown";
            public string IntegrityError { get; set; } = "";
            public string SchemaVersion { get; set; } = "";
            public string ExpectedSchemaVersion { get; set; } = "";
            public string SchemaStatus { get; set; } = "unknown";
            public string SchemaMessage { get; set; } = "";
            public string LastSuccessfulSave { get; set; } = "";
            public LkgModuleState Lkg { get; set; } = new LkgModuleState();
            public string LastMigrationStatus { get; set; } = "No migration recorded";
            public string LastMigrationAt { get; set; } = "";
            public bool RecoveryAvailable { get; set; }
            public ConflictHealthInfo Conflicts { get; set; } = new ConflictHealthInfo();
            public string LastRecoveryStatus { get; set; } = "";
            public string LastRecoveryAt { get; set; } = "";
            public string Summary { get; set; } = "";
        }

        private sealed class SpecialistHealthInfo
        {
            public string Name { get; set; } = "";
            public string RelativePath { get; set; } = "";
            public bool Exists { get; set; }
            public bool ValidJson { get; set; }
            public string Modified { get; set; } = "";
            public bool CapturedInLkg { get; set; }
            public string Error { get; set; } = "";
        }

        private sealed class DataHealthSnapshot
        {
            public string CheckedAt { get; set; } = "";
            public string Trigger { get; set; } = "";
            public string OverallSeverity { get; set; } = "gray";
            public string OverallLabel { get; set; } = "Not Checked";
            public SharedStorageHealthInfo SharedStorage { get; set; } = new SharedStorageHealthInfo();
            public List<ModuleHealthInfo> Modules { get; set; } = new List<ModuleHealthInfo>();
            public List<SpecialistHealthInfo> SpecialistData { get; set; } = new List<SpecialistHealthInfo>();
            public int UnreviewedEvents { get; set; }
        }

        private string DataHealthDirectory()
        {
            string path = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data Integrity", "Data Health"));
            Directory.CreateDirectory(path);
            return path;
        }

        private SuiteUser RequireDataHealthAdmin(string userId, string pin)
        {
            foreach (SuiteUser user in settings.Users ?? new List<SuiteUser>())
            {
                if (!user.Active || !string.Equals(user.Id, userId, StringComparison.OrdinalIgnoreCase)) continue;
                if (!string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase)) break;
                if (!string.Equals(user.Pin ?? "", pin ?? "", StringComparison.Ordinal))
                    throw new UnauthorizedAccessException("Administrator PIN verification failed.");
                return user;
            }
            throw new UnauthorizedAccessException("This operation requires an active Administrator account.");
        }

        private SharedStorageHealthInfo CheckSharedStorageHealth()
        {
            var result = new SharedStorageHealthInfo { LastChecked = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") };
            string localStateDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PWADC", "Security Operations Suite");
            string localStatePath = Path.Combine(localStateDir, "shared-storage-health.json");
            try
            {
                string root = Path.GetFullPath(settings.DataRoot);
                string data = Path.Combine(root, "Data");
                result.Reachable = Directory.Exists(root);
                if (!result.Reachable) throw new DirectoryNotFoundException("The configured shared data root is unavailable.");
                Directory.GetFileSystemEntries(root).Take(1).ToArray();
                result.ReadAllowed = true;
                Directory.CreateDirectory(data);
                string probe = Path.Combine(data, ".health-write-" + Guid.NewGuid().ToString("N") + ".tmp");
                File.WriteAllText(probe, "PWADC data health write probe");
                File.Delete(probe);
                result.WriteAllowed = true;
                result.Severity = "green";
                result.DataMode = "Live shared data";
                result.LastSuccessfulConnection = result.LastChecked;
                Directory.CreateDirectory(localStateDir);
                File.WriteAllText(localStatePath, JsonSerializer.Serialize(new { lastSuccessfulConnection = result.LastSuccessfulConnection, dataRoot = settings.DataRoot }, JsonOptions));
                try
                {
                    string? driveRoot = Path.GetPathRoot(root);
                    if (!string.IsNullOrWhiteSpace(driveRoot)) result.FreeSpaceBytes = new DriveInfo(driveRoot).AvailableFreeSpace;
                }
                catch { }
            }
            catch (Exception ex)
            {
                result.Severity = "red";
                result.Error = ex.Message;
                try
                {
                    if (File.Exists(localStatePath))
                    {
                        using JsonDocument prior = JsonDocument.Parse(File.ReadAllText(localStatePath));
                        result.LastSuccessfulConnection = JsonString(prior.RootElement, "lastSuccessfulConnection");
                    }
                }
                catch { }
            }
            return result;
        }

        private DataHealthSnapshot EvaluateDataHealth(string trigger, bool recordEvents)
        {
            var snapshot = new DataHealthSnapshot
            {
                CheckedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                Trigger = trigger,
                SharedStorage = CheckSharedStorageHealth()
            };

            if (!snapshot.SharedStorage.Reachable || !snapshot.SharedStorage.ReadAllowed)
            {
                foreach (GovernedModuleDefinition definition in GovernedModuleRegistry())
                {
                    snapshot.Modules.Add(new ModuleHealthInfo
                    {
                        Module = definition.Id,
                        Label = definition.Label,
                        Severity = "gray",
                        StatusLabel = "Unknown / Not Checked",
                        AccessState = "Shared storage unavailable",
                        ExpectedSchemaVersion = definition.Id + "-" + definition.SchemaRevision,
                        Summary = "Module health was not inferred because shared storage is unavailable."
                    });
                }
                snapshot.OverallSeverity = "red";
                snapshot.OverallLabel = "Blocked - Shared Storage Unavailable";
            }
            else
            {
                foreach (GovernedModuleDefinition definition in GovernedModuleRegistry())
                {
                    try
                    {
                        ModuleHealthInfo module = EvaluateModuleHealth(definition);
                        if (!snapshot.SharedStorage.WriteAllowed && module.Exists)
                        {
                            module.AccessState = "Read-only - shared storage write unavailable";
                            module.Severity = "red";
                            module.StatusLabel = "Blocked";
                            module.Summary = "The module can be inspected, but shared storage is not currently writable.";
                        }
                        snapshot.Modules.Add(module);
                    }
                    catch (Exception ex)
                    {
                        snapshot.Modules.Add(new ModuleHealthInfo
                        {
                            Module = definition.Id,
                            Label = definition.Label,
                            Severity = "red",
                            StatusLabel = "Blocked",
                            AccessState = "Health check failed",
                            ExpectedSchemaVersion = definition.Id + "-" + definition.SchemaRevision,
                            Summary = "This module could not be evaluated. Other modules remain available.",
                            IntegrityError = ex.Message
                        });
                    }
                }
                try { snapshot.SpecialistData = EvaluateSpecialistData(); }
                catch (Exception ex) { snapshot.SpecialistData.Add(new SpecialistHealthInfo { Name = "Specialist data inventory", Error = ex.Message }); }
                snapshot.OverallSeverity = HighestSeverity(snapshot.Modules.Select(x => x.Severity));
                snapshot.OverallLabel = SeverityLabel(snapshot.OverallSeverity);
            }

            if (snapshot.SharedStorage.Severity == "red")
            {
                snapshot.OverallSeverity = "red";
                snapshot.OverallLabel = "Blocked - Shared Storage Unavailable";
            }
            if (recordEvents && snapshot.SharedStorage.Reachable) RecordMeaningfulHealthEvents(snapshot);
            snapshot.UnreviewedEvents = CountUnreviewedHealthEvents();
            return snapshot;
        }

        private ModuleHealthInfo EvaluateModuleHealth(GovernedModuleDefinition definition)
        {
            string dataDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data"));
            string livePath = Path.GetFullPath(Path.Combine(dataDir, definition.FileName));
            var result = new ModuleHealthInfo
            {
                Module = definition.Id,
                Label = definition.Label,
                LivePath = livePath,
                ExpectedSchemaVersion = definition.Id + "-" + definition.SchemaRevision,
                Lkg = ReadLkgModuleState(definition),
                Conflicts = ReadConflictHealth(definition.Id)
            };

            result.Exists = File.Exists(livePath);
            if (!result.Exists)
            {
                result.Severity = "gray";
                result.StatusLabel = "Not in Use / No Data Yet";
                result.AccessState = "No live data";
                result.Summary = "The governed module is registered but no live file exists yet.";
                return result;
            }

            FileInfo liveInfo = new FileInfo(livePath);
            result.LiveModified = liveInfo.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
            result.LiveSizeBytes = liveInfo.Length;
            JsonIntegrityInfo integrity = JsonIntegrityStatus(livePath);
            result.IntegrityStatus = integrity.Status;
            result.IntegrityError = integrity.Error;
            result.LiveSha256 = integrity.Sha256;
            result.LastSuccessfulSave = LastSuccessfulSave(definition.Id, livePath);
            ReadLastMigration(definition.Id, out string migrationStatus, out string migrationAt);
            result.LastMigrationStatus = migrationStatus;
            result.LastMigrationAt = migrationAt;
            ReadLastRecovery(definition.Id, out string recoveryStatus, out string recoveryAt);
            result.LastRecoveryStatus = recoveryStatus;
            result.LastRecoveryAt = recoveryAt;

            if (!string.Equals(integrity.Status, "valid", StringComparison.OrdinalIgnoreCase))
            {
                result.Severity = "red";
                result.StatusLabel = "Blocked";
                result.AccessState = "Blocked";
                result.Summary = "The live JSON failed validation and normal writes are blocked.";
                result.RecoveryAvailable = result.Lkg.Valid;
                return result;
            }

            SchemaCompatibilityInfo schema = EvaluateSchemaCompatibility(definition.Id, File.ReadAllText(livePath));
            result.SchemaVersion = schema.SchemaVersion;
            result.SchemaStatus = schema.Status;
            result.SchemaMessage = schema.Message;
            bool fileReadOnly = (File.GetAttributes(livePath) & FileAttributes.ReadOnly) == FileAttributes.ReadOnly;
            result.AccessState = schema.WriteAllowed && schema.Status == "current" && !fileReadOnly ? "Writable" : schema.ReadAllowed ? "Read-only" : "Blocked";
            result.RecoveryAvailable = definition.RecoveryEligible && result.Lkg.Valid && string.Equals(result.Lkg.SchemaVersion, result.ExpectedSchemaVersion, StringComparison.OrdinalIgnoreCase);

            bool failedMigration = result.LastMigrationStatus.StartsWith("Failed", StringComparison.OrdinalIgnoreCase);
            bool failedRecovery = result.LastRecoveryStatus.StartsWith("Failed", StringComparison.OrdinalIgnoreCase);
            if (!schema.ReadAllowed || (!schema.WriteAllowed && schema.Status != "previous") || fileReadOnly || failedMigration || failedRecovery || !result.Lkg.Available || !result.Lkg.Valid)
            {
                result.Severity = "red";
                result.StatusLabel = "Blocked";
                result.Summary = !result.Lkg.Available ? "No valid Last-Known-Good recovery source is available." :
                    !result.Lkg.Valid ? "The Last-Known-Good source failed integrity validation." :
                    failedMigration ? "The most recent migration failed." :
                    failedRecovery ? "The most recent recovery failed verification." :
                    fileReadOnly ? "The live file is marked read-only and cannot accept protected writes." : schema.Message;
            }
            else if (schema.Status == "previous" || !result.Lkg.CurrentToday || result.Conflicts.Count30Days >= 3 || RecentSuccessfulRecovery(result.LastRecoveryStatus, result.LastRecoveryAt))
            {
                result.Severity = "yellow";
                result.StatusLabel = "Attention";
                result.Summary = schema.Status == "previous" ? "A controlled schema migration is pending." :
                    !result.Lkg.CurrentToday ? "A valid LKG exists, but it is older than today." :
                    result.Conflicts.Count30Days >= 3 ? "The 30-day stale-write threshold has been reached." :
                    "A recent recovery event requires review.";
            }
            else
            {
                result.Severity = "green";
                result.StatusLabel = "Healthy";
                result.Summary = "Live data is valid, current, writable, and recoverable from today's verified LKG.";
            }
            return result;
        }

        private static bool RecentSuccessfulRecovery(string status, string at)
        {
            if (!status.StartsWith("Succeeded", StringComparison.OrdinalIgnoreCase)) return false;
            return DateTime.TryParse(at, out DateTime parsed) && parsed >= DateTime.Now.AddDays(-7);
        }

        private LkgModuleState ReadLkgModuleState(GovernedModuleDefinition definition)
        {
            var result = new LkgModuleState();
            try
            {
                string currentDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Backups", "Last Known Good", "Current"));
                string manifestPath = Path.Combine(currentDir, "manifest.json");
                if (!File.Exists(manifestPath)) { result.Error = "No LKG manifest exists."; return result; }
                using JsonDocument manifest = JsonDocument.Parse(File.ReadAllText(manifestPath));
                JsonElement root = manifest.RootElement;
                result.SnapshotDate = JsonString(root, "snapshotDate");
                result.CreatedAt = JsonString(root, "createdAt");
                result.CurrentToday = string.Equals(result.SnapshotDate, DateTime.Now.ToString("yyyy-MM-dd"), StringComparison.Ordinal);
                string relative = definition.FileName.Replace('\\', '/');
                string expectedHash = "";
                long expectedSize = 0;
                bool listed = false;
                if (root.TryGetProperty("files", out JsonElement files) && files.ValueKind == JsonValueKind.Array)
                {
                    foreach (JsonElement item in files.EnumerateArray())
                    {
                        string itemRelative = JsonString(item, "relativePath").Replace('\\', '/');
                        if (!string.Equals(itemRelative, relative, StringComparison.OrdinalIgnoreCase)) continue;
                        listed = true;
                        expectedHash = JsonString(item, "sha256");
                        if (item.TryGetProperty("sizeBytes", out JsonElement size) && size.TryGetInt64(out long parsedSize)) expectedSize = parsedSize;
                        break;
                    }
                }
                result.Path = Path.GetFullPath(Path.Combine(currentDir, "Data", definition.FileName));
                result.Available = listed && File.Exists(result.Path);
                if (!result.Available) { result.Error = "The module is not present in the current LKG."; return result; }
                FileInfo info = new FileInfo(result.Path);
                result.SizeBytes = info.Length;
                result.Sha256 = Sha256File(result.Path);
                string json = File.ReadAllText(result.Path);
                ValidateJsonPayload(json, definition.Label + " LKG");
                SchemaCompatibilityInfo schema = EvaluateSchemaCompatibility(definition.Id, json);
                result.SchemaVersion = schema.SchemaVersion;
                result.Valid = string.Equals(expectedHash, result.Sha256, StringComparison.OrdinalIgnoreCase) && (expectedSize == 0 || expectedSize == info.Length) && schema.ReadAllowed;
                if (!result.Valid) result.Error = "LKG hash, size, JSON, or schema validation failed.";
            }
            catch (Exception ex) { result.Error = ex.Message; result.Valid = false; }
            return result;
        }

        private ConflictHealthInfo ReadConflictHealth(string module)
        {
            var result = new ConflictHealthInfo();
            string dir = Path.Combine(settings.DataRoot, "Data Integrity", "Conflict Audit");
            if (!Directory.Exists(dir)) return result;
            DateTime cutoff = DateTime.Now.AddDays(-30);
            DateTime split = DateTime.Now.AddDays(-15);
            int recent = 0, prior = 0;
            DateTime newest = DateTime.MinValue;
            foreach (string path in Directory.GetFiles(dir, "conflict__*.json", SearchOption.TopDirectoryOnly))
            {
                try
                {
                    using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(path));
                    JsonElement root = doc.RootElement;
                    if (!string.Equals(JsonString(root, "module"), module, StringComparison.OrdinalIgnoreCase)) continue;
                    DateTime at = DateTime.TryParse(JsonString(root, "at"), out DateTime parsed) ? parsed : File.GetLastWriteTime(path);
                    if (at < cutoff) continue;
                    result.Count30Days++;
                    if (at >= split) recent++; else prior++;
                    if (at > newest)
                    {
                        newest = at;
                        result.MostRecentAt = at.ToString("yyyy-MM-dd HH:mm:ss");
                        result.User = JsonString(root, "user");
                        result.Machine = JsonString(root, "machine");
                    }
                }
                catch { }
            }
            result.Trend = result.Count30Days == 0 ? "None" : recent > prior ? "Increasing" : recent < prior ? "Decreasing" : "Stable";
            foreach (string path in Directory.GetFiles(dir, "resolution__*.json", SearchOption.TopDirectoryOnly).OrderByDescending(File.GetLastWriteTime))
            {
                try
                {
                    using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(path));
                    JsonElement root = doc.RootElement;
                    if (!string.Equals(JsonString(root, "module"), module, StringComparison.OrdinalIgnoreCase)) continue;
                    DateTime resolutionAt = DateTime.TryParse(JsonString(root, "at"), out DateTime parsedResolution) ? parsedResolution : File.GetLastWriteTime(path);
                    if (newest == DateTime.MinValue || resolutionAt >= newest) result.Resolution = JsonString(root, "resolution");
                    break;
                }
                catch { }
            }
            return result;
        }

        private object RecordConflictResolution(string module, string resolution)
        {
            if (!IsKnownJsonModule(module)) throw new InvalidOperationException("Unknown governed module.");
            string[] allowed = { "reload", "unsaved-copy-export", "abandoned-save" };
            if (!allowed.Contains(resolution, StringComparer.OrdinalIgnoreCase)) throw new InvalidOperationException("Unknown conflict resolution outcome.");
            string dir = Path.Combine(settings.DataRoot, "Data Integrity", "Conflict Audit");
            Directory.CreateDirectory(dir);
            string path = Path.Combine(dir, "resolution__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + "__" + Guid.NewGuid().ToString("N")[..8] + ".json");
            var record = new { at = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), version = AppVersion, user = Environment.UserName, machine = Environment.MachineName, module, resolution };
            File.WriteAllText(path, JsonSerializer.Serialize(record, JsonOptions));
            TryRefreshDataHealth("conflict-resolution");
            return record;
        }

        private List<SpecialistHealthInfo> EvaluateSpecialistData()
        {
            // Specialist files are checked for presence and JSON validity only.
            // They are never schema-governed, migrated, changed, or restored here.
            var rows = new List<SpecialistHealthInfo>();
            string dataDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data"));
            if (!Directory.Exists(dataDir)) return rows;
            var governed = new HashSet<string>(GovernedModuleRegistry().Select(x => Path.GetFullPath(Path.Combine(dataDir, x.FileName))), StringComparer.OrdinalIgnoreCase);
            HashSet<string> lkgPaths = ReadLkgRelativePaths();
            foreach (string path in Directory.GetFiles(dataDir, "*.json", SearchOption.AllDirectories).OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
            {
                string full = Path.GetFullPath(path);
                if (governed.Contains(full) || IsBackupArtifactUnderData(dataDir, full)) continue;
                string relative = Path.GetRelativePath(dataDir, full).Replace('\\', '/');
                var row = new SpecialistHealthInfo { Name = Path.GetFileName(full), RelativePath = relative, Exists = true, Modified = File.GetLastWriteTime(full).ToString("yyyy-MM-dd HH:mm:ss"), CapturedInLkg = lkgPaths.Contains(relative) };
                try { ValidateJsonPayload(File.ReadAllText(full), relative); row.ValidJson = true; }
                catch (Exception ex) { row.Error = ex.Message; }
                rows.Add(row);
            }
            return rows;
        }

        private HashSet<string> ReadLkgRelativePaths()
        {
            var paths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            try
            {
                string manifestPath = Path.Combine(settings.DataRoot, "Backups", "Last Known Good", "Current", "manifest.json");
                using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(manifestPath));
                if (doc.RootElement.TryGetProperty("files", out JsonElement files) && files.ValueKind == JsonValueKind.Array)
                    foreach (JsonElement item in files.EnumerateArray()) paths.Add(JsonString(item, "relativePath").Replace('\\', '/'));
            }
            catch { }
            return paths;
        }

        private string LastSuccessfulSave(string module, string livePath)
        {
            string dir = Path.Combine(settings.DataRoot, "Data Integrity", "Write Audit");
            if (Directory.Exists(dir))
            {
                foreach (string path in Directory.GetFiles(dir, "write__*.json", SearchOption.TopDirectoryOnly).OrderByDescending(File.GetLastWriteTime).Take(600))
                {
                    try
                    {
                        using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(path));
                        JsonElement root = doc.RootElement;
                        if (!string.Equals(JsonString(root, "module"), module, StringComparison.OrdinalIgnoreCase)) continue;
                        if (root.TryGetProperty("success", out JsonElement success) && success.ValueKind == JsonValueKind.True) return JsonString(root, "at");
                    }
                    catch { }
                }
            }
            return File.Exists(livePath) ? File.GetLastWriteTime(livePath).ToString("yyyy-MM-dd HH:mm:ss") : "";
        }

        private void ReadLastMigration(string module, out string status, out string at)
        {
            status = "No migration recorded"; at = "";
            try
            {
                string path = SchemaMigrationHistoryPath();
                if (!File.Exists(path)) return;
                foreach (string line in File.ReadLines(path).Reverse())
                {
                    using JsonDocument doc = JsonDocument.Parse(line);
                    JsonElement root = doc.RootElement;
                    if (!string.Equals(JsonString(root, "module"), module, StringComparison.OrdinalIgnoreCase)) continue;
                    bool success = root.TryGetProperty("success", out JsonElement ok) && ok.ValueKind == JsonValueKind.True;
                    status = success ? "Succeeded" : "Failed: " + JsonString(root, "error");
                    at = JsonString(root, "at");
                    return;
                }
            }
            catch (Exception ex) { status = "History unavailable: " + ex.Message; }
        }

        private void ReadLastRecovery(string module, out string status, out string at)
        {
            status = ""; at = "";
            try
            {
                string path = Path.Combine(DataHealthDirectory(), "recovery-history.jsonl");
                if (!File.Exists(path)) return;
                foreach (string line in File.ReadLines(path).Reverse())
                {
                    using JsonDocument doc = JsonDocument.Parse(line);
                    JsonElement root = doc.RootElement;
                    if (!string.Equals(JsonString(root, "module"), module, StringComparison.OrdinalIgnoreCase)) continue;
                    status = JsonString(root, "outcome");
                    at = JsonString(root, "at");
                    return;
                }
            }
            catch { }
        }

        private static string JsonString(JsonElement root, string property)
        {
            if (!root.TryGetProperty(property, out JsonElement value)) return "";
            return value.ValueKind == JsonValueKind.String ? value.GetString() ?? "" : value.ToString();
        }

        private static int SeverityRank(string severity) => severity switch { "red" => 3, "yellow" => 2, "green" => 1, _ => 0 };
        private static string HighestSeverity(IEnumerable<string> values)
        {
            string highest = "gray";
            foreach (string value in values) if (SeverityRank(value) > SeverityRank(highest)) highest = value;
            return highest;
        }
        private static string SeverityLabel(string severity) => severity switch { "green" => "Healthy", "yellow" => "Attention", "red" => "Blocked", _ => "Not in Use / No Data Yet" };

        private void RecordMeaningfulHealthEvents(DataHealthSnapshot snapshot)
        {
            try
            {
                string dir = DataHealthDirectory();
                string statePath = Path.Combine(dir, "health-state.json");
                var prior = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                if (File.Exists(statePath))
                {
                    prior = JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(statePath), JsonOptions) ?? prior;
                }
                var current = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["shared-storage"] = snapshot.SharedStorage.Severity };
                foreach (ModuleHealthInfo module in snapshot.Modules) current[module.Module] = module.Severity;
                foreach (KeyValuePair<string, string> pair in current)
                {
                    prior.TryGetValue(pair.Key, out string? before);
                    if (string.Equals(before, pair.Value, StringComparison.OrdinalIgnoreCase)) continue;
                    if (string.IsNullOrWhiteSpace(before) && pair.Value is "green" or "gray") continue;
                    string detail = pair.Key == "shared-storage" ? snapshot.SharedStorage.Error : snapshot.Modules.FirstOrDefault(x => x.Module == pair.Key)?.Summary ?? "";
                    AppendHealthEvent(pair.Key, before ?? "not-recorded", pair.Value, detail, snapshot.Trigger);
                }
                string temp = statePath + ".tmp-" + Guid.NewGuid().ToString("N");
                File.WriteAllText(temp, JsonSerializer.Serialize(current, JsonOptions));
                File.Move(temp, statePath, true);
            }
            catch { }
        }

        private void AppendHealthEvent(string module, string previous, string severity, string detail, string trigger)
        {
            string path = Path.Combine(DataHealthDirectory(), "health-events.jsonl");
            var row = new { id = Guid.NewGuid().ToString("N"), at = DateTime.Now.ToString("O"), appVersion = AppVersion, module, previousSeverity = previous, severity, detail, trigger, user = Environment.UserName, machine = Environment.MachineName };
            AppendJsonLine(path, row);
        }

        private static void AppendJsonLine(string path, object row)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            string line = JsonSerializer.Serialize(row, JsonOptions) + Environment.NewLine;
            using FileStream stream = new FileStream(path, FileMode.Append, FileAccess.Write, FileShare.Read, 16 * 1024, FileOptions.WriteThrough);
            byte[] bytes = new UTF8Encoding(false).GetBytes(line);
            stream.Write(bytes, 0, bytes.Length);
            stream.Flush(true);
        }

        private int CountUnreviewedHealthEvents()
        {
            try
            {
                string dir = DataHealthDirectory();
                DateTime reviewed = DateTime.MinValue;
                string reviewPath = Path.Combine(dir, "review-state.json");
                if (File.Exists(reviewPath))
                {
                    using JsonDocument review = JsonDocument.Parse(File.ReadAllText(reviewPath));
                    DateTime.TryParse(JsonString(review.RootElement, "lastReviewedAt"), out reviewed);
                }
                string eventsPath = Path.Combine(dir, "health-events.jsonl");
                if (!File.Exists(eventsPath)) return 0;
                int count = 0;
                foreach (string line in File.ReadLines(eventsPath))
                {
                    try
                    {
                        using JsonDocument doc = JsonDocument.Parse(line);
                        if (DateTime.TryParse(JsonString(doc.RootElement, "at"), out DateTime at) && at > reviewed) count++;
                    }
                    catch { }
                }
                return count;
            }
            catch { return 0; }
        }

        private object ReviewHealthEvents(string userId, string pin)
        {
            SuiteUser admin = RequireDataHealthAdmin(userId, pin);
            string path = Path.Combine(DataHealthDirectory(), "review-state.json");
            var row = new { lastReviewedAt = DateTime.Now.ToString("O"), reviewedBy = admin.DisplayName, machine = Environment.MachineName };
            File.WriteAllText(path, JsonSerializer.Serialize(row, JsonOptions));
            return new { unreviewedEvents = 0, reviewedAt = row.lastReviewedAt };
        }

        private object GetDataHealthSummary()
        {
            DataHealthSnapshot snapshot = EvaluateDataHealth("indicator", false);
            return new { severity = snapshot.OverallSeverity, label = snapshot.OverallLabel, unreviewedEvents = snapshot.UnreviewedEvents, checkedAt = snapshot.CheckedAt };
        }

        private object GetDataHealthDashboard(string userId, string pin, string trigger)
        {
            RequireDataHealthAdmin(userId, pin);
            DataHealthSnapshot snapshot = EvaluateDataHealth(trigger, true);
            return new
            {
                checkedAt = snapshot.CheckedAt,
                trigger = snapshot.Trigger,
                overallSeverity = snapshot.OverallSeverity,
                overallLabel = snapshot.OverallLabel,
                unreviewedEvents = snapshot.UnreviewedEvents,
                sharedStorage = new { severity = snapshot.SharedStorage.Severity, reachable = snapshot.SharedStorage.Reachable, readAllowed = snapshot.SharedStorage.ReadAllowed, writeAllowed = snapshot.SharedStorage.WriteAllowed, lastChecked = snapshot.SharedStorage.LastChecked, lastSuccessfulConnection = snapshot.SharedStorage.LastSuccessfulConnection, freeSpaceBytes = snapshot.SharedStorage.FreeSpaceBytes, dataMode = snapshot.SharedStorage.DataMode, error = snapshot.SharedStorage.Error, path = settings.DataRoot },
                modules = snapshot.Modules.Select(x => new { module = x.Module, label = x.Label, severity = x.Severity, statusLabel = x.StatusLabel, accessState = x.AccessState, exists = x.Exists, schemaVersion = x.SchemaVersion, expectedSchemaVersion = x.ExpectedSchemaVersion, lastSuccessfulSave = x.LastSuccessfulSave, lkg = new { available = x.Lkg.Available, valid = x.Lkg.Valid, currentToday = x.Lkg.CurrentToday, snapshotDate = x.Lkg.SnapshotDate, createdAt = x.Lkg.CreatedAt, error = x.Lkg.Error }, lastMigrationStatus = x.LastMigrationStatus, lastMigrationAt = x.LastMigrationAt, recoveryAvailable = x.RecoveryAvailable, summary = x.Summary, conflicts = new { count30Days = x.Conflicts.Count30Days, mostRecentAt = x.Conflicts.MostRecentAt, user = x.Conflicts.User, machine = x.Conflicts.Machine, resolution = x.Conflicts.Resolution, trend = x.Conflicts.Trend }, lastRecoveryStatus = x.LastRecoveryStatus, lastRecoveryAt = x.LastRecoveryAt, technical = new { livePath = x.LivePath, liveModified = x.LiveModified, liveSha256 = x.LiveSha256, liveSizeBytes = x.LiveSizeBytes, integrityStatus = x.IntegrityStatus, integrityError = x.IntegrityError, schemaStatus = x.SchemaStatus, schemaMessage = x.SchemaMessage, lkgPath = x.Lkg.Path, lkgSha256 = x.Lkg.Sha256, lkgSizeBytes = x.Lkg.SizeBytes, lkgSchemaVersion = x.Lkg.SchemaVersion } }).ToList(),
                specialistData = snapshot.SpecialistData.Select(x => new { name = x.Name, relativePath = x.RelativePath, exists = x.Exists, validJson = x.ValidJson, modified = x.Modified, capturedInLkg = x.CapturedInLkg, error = x.Error }).ToList(),
                healthEvents = ReadJsonLines(Path.Combine(DataHealthDirectory(), "health-events.jsonl"), 100),
                migrationHistory = ReadJsonLines(SchemaMigrationHistoryPath(), 100),
                recoveryHistory = ReadJsonLines(Path.Combine(DataHealthDirectory(), "recovery-history.jsonl"), 100)
            };
        }

        private static List<Dictionary<string, object?>> ReadJsonLines(string path, int limit)
        {
            var rows = new List<Dictionary<string, object?>>();
            if (!File.Exists(path)) return rows;
            foreach (string line in File.ReadLines(path).Reverse().Take(limit))
            {
                try
                {
                    Dictionary<string, object?>? row = JsonSerializer.Deserialize<Dictionary<string, object?>>(line, JsonOptions);
                    if (row != null) rows.Add(row);
                }
                catch { }
            }
            return rows;
        }

        private Dictionary<string, int> CountModuleRecords(string module, string json)
        {
            MigrationFingerprint fp = BuildMigrationFingerprint(module, json);
            return new Dictionary<string, int>(fp.Counts, StringComparer.OrdinalIgnoreCase);
        }

        private object PreviewLastKnownGood(string module, string userId, string pin)
        {
            RequireDataHealthAdmin(userId, pin);
            GovernedModuleDefinition definition = GovernedModule(module) ?? throw new InvalidOperationException("Unknown governed module.");
            LkgModuleState lkg = ReadLkgModuleState(definition);
            string livePath = Path.Combine(settings.DataRoot, "Data", definition.FileName);
            if (!File.Exists(livePath)) throw new FileNotFoundException("The live module file does not exist.");
            string liveJson = File.ReadAllText(livePath);
            string lkgJson = lkg.Available ? File.ReadAllText(lkg.Path) : "{}";
            SchemaCompatibilityInfo liveSchema = EvaluateSchemaCompatibility(module, liveJson);
            SchemaCompatibilityInfo lkgSchema = EvaluateSchemaCompatibility(module, lkgJson);
            Dictionary<string, int> liveCounts = CountModuleRecords(module, liveJson);
            Dictionary<string, int> lkgCounts = CountModuleRecords(module, lkgJson);
            int liveTotal = liveCounts.Values.Sum(), lkgTotal = lkgCounts.Values.Sum();
            string difference = liveTotal == lkgTotal ? "Record-count totals match. No record-by-record comparison was performed." :
                "Current live data has " + Math.Abs(liveTotal - lkgTotal) + (liveTotal > lkgTotal ? " more" : " fewer") + " counted record(s) than the LKG summary.";
            return new
            {
                module,
                label = definition.Label,
                currentTimestamp = File.GetLastWriteTime(livePath).ToString("yyyy-MM-dd HH:mm:ss"),
                lkgTimestamp = lkg.CreatedAt,
                currentSchema = liveSchema.SchemaVersion,
                lkgSchema = lkgSchema.SchemaVersion,
                currentRecordCount = liveTotal,
                lkgRecordCount = lkgTotal,
                currentCounts = liveCounts,
                lkgCounts,
                lkgValid = lkg.Valid,
                recoveryAvailable = lkg.Valid && string.Equals(lkgSchema.SchemaVersion, CurrentSchemaVersion(module), StringComparison.OrdinalIgnoreCase),
                differenceSummary = difference,
                currentRevision = GetDataRevision(livePath).Token,
                technical = new { currentPath = livePath, currentHash = Sha256File(livePath), lkgPath = lkg.Path, lkgHash = lkg.Sha256, lkgSizeBytes = lkg.SizeBytes, validationError = lkg.Error }
            };
        }

        private object RestoreLastKnownGood(string module, string reason, string expectedRevision, string userId, string pin)
        {
            SuiteUser admin = RequireDataHealthAdmin(userId, pin);
            if (string.IsNullOrWhiteSpace(reason)) throw new InvalidOperationException("A recovery reason is required.");
            GovernedModuleDefinition definition = GovernedModule(module) ?? throw new InvalidOperationException("Unknown governed module.");
            if (!definition.RecoveryEligible) throw new InvalidOperationException("This module is not eligible for direct LKG recovery.");
            LkgModuleState lkg = ReadLkgModuleState(definition);
            if (!lkg.Valid) throw new InvalidDataException("The selected LKG is not valid. " + lkg.Error);
            string sourceJson = File.ReadAllText(lkg.Path);
            SchemaCompatibilityInfo sourceSchema = EvaluateSchemaCompatibility(module, sourceJson);
            if (!string.Equals(sourceSchema.SchemaVersion, CurrentSchemaVersion(module), StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("Direct LKG restore requires the current supported schema. Preview the LKG and use Backup Manager for manual review.");
            string livePath = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data", definition.FileName));
            DataWriteOutcome? outcome = null;
            string validation = "not-run";
            try
            {
                outcome = WriteJsonAtomically(module, livePath, sourceJson, "restore-last-known-good", "pre-lkg-restore", expectedRevision);
                string restored = File.ReadAllText(livePath);
                ValidateJsonPayload(restored, definition.Label + " post-restore verification");
                SchemaCompatibilityInfo restoredSchema = EvaluateSchemaCompatibility(module, restored);
                if (!restoredSchema.WriteAllowed || restoredSchema.Status != "current") throw new InvalidDataException("Post-restore schema verification failed. " + restoredSchema.Message);
                validation = "passed";
                WriteRecoveryAudit(module, "Last Known Good", lkg.CreatedAt, admin, reason, outcome.BackupPath, validation, "Succeeded");
                AppendHealthEvent(module, "recovery-in-progress", "yellow", "LKG restore succeeded and requires administrative review.", "restore");
                TryRefreshDataHealth("restore");
                return new { module, data = restored, restoredFrom = lkg.Path, sourceTimestamp = lkg.CreatedAt, preRestoreBackupPath = outcome.BackupPath, validationResult = validation, outcome = "Succeeded", revision = GetDataRevision(livePath).Token, schemaVersion = CurrentSchemaVersion(module), expectedSchemaVersion = CurrentSchemaVersion(module), lastWrittenByAppVersion = AppVersion, schemaStatus = "current", schemaMessage = "Schema is current.", writeAllowed = true };
            }
            catch (Exception ex)
            {
                WriteRecoveryAudit(module, "Last Known Good", lkg.CreatedAt, admin, reason, outcome?.BackupPath ?? "", validation, "Failed: " + ex.Message);
                AppendHealthEvent(module, "recovery-in-progress", "red", "LKG restore failed: " + ex.Message, "restore");
                TryRefreshDataHealth("restore-failure");
                throw;
            }
        }

        private void WriteRecoveryAudit(string module, string source, string sourceTimestamp, SuiteUser admin, string reason, string preRestoreBackupPath, string validationResult, string outcome)
        {
            string path = Path.Combine(DataHealthDirectory(), "recovery-history.jsonl");
            var row = new { id = Guid.NewGuid().ToString("N"), at = DateTime.Now.ToString("O"), appVersion = AppVersion, module, recoverySource = source, sourceTimestamp, admin = admin.DisplayName, adminUserId = admin.Id, workstation = Environment.MachineName, reason, preRestoreBackupPath, preRestoreBackupResult = string.IsNullOrWhiteSpace(preRestoreBackupPath) ? "not-created" : "created", validationResult, outcome };
            AppendJsonLine(path, row);
        }

        private object ExportDataHealthDiagnostics(string userId, string pin)
        {
            SuiteUser admin = RequireDataHealthAdmin(userId, pin);
            DataHealthSnapshot snapshot = EvaluateDataHealth("diagnostics-export", true);
            string exportDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Exports", "Data Health"));
            Directory.CreateDirectory(exportDir);
            string stamp = DateTime.Now.ToString("yyyy-MM-dd_HHmmss");
            string staging = Path.Combine(exportDir, ".diagnostics-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(staging);
            string zipPath = Path.Combine(exportDir, "PWADC-Data-Health-Diagnostics-" + stamp + ".zip");
            try
            {
                object dashboard = GetDataHealthDashboard(admin.Id, admin.Pin, "diagnostics-export");
                var package = new
                {
                    generatedAt = DateTime.Now.ToString("O"),
                    generatedBy = admin.DisplayName,
                    appVersion = AppVersion,
                    runtimeVersion = RuntimeInformation.FrameworkDescription,
                    workstation = Environment.MachineName,
                    user = Environment.UserName,
                    sharedDataRoot = settings.DataRoot,
                    contents = "Metadata only. Operational record contents are intentionally excluded.",
                    dashboard
                };
                File.WriteAllText(Path.Combine(staging, "diagnostics.json"), JsonSerializer.Serialize(package, JsonOptions));
                ZipFile.CreateFromDirectory(staging, zipPath, CompressionLevel.Optimal, false);
            }
            finally { try { if (Directory.Exists(staging)) Directory.Delete(staging, true); } catch { } }
            return new { path = zipPath, fileName = Path.GetFileName(zipPath), metadataOnly = true };
        }

        private void TryRefreshDataHealth(string trigger)
        {
            try { EvaluateDataHealth(trigger, true); } catch { }
        }
    }
}
