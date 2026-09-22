using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private sealed class SchemaMigrationDefinition
        {
            public string Module { get; init; } = "";
            public int FromRevision { get; init; }
            public int ToRevision { get; init; }
            public string Risk { get; init; } = "minor";
            public string Summary { get; init; } = "";
            public bool BusinessMeaningChanged { get; init; }
            public bool PreserveRecordIdentity { get; init; } = true;
            public List<string> Changes { get; init; } = new List<string>();
            public Func<JsonObject, JsonObject> Transform { get; init; } = root => root;
        }

        private sealed class MigrationFingerprint
        {
            public Dictionary<string, int> Counts { get; } = new(StringComparer.OrdinalIgnoreCase);
            public Dictionary<string, string> IdentityDigests { get; } = new(StringComparer.OrdinalIgnoreCase);
        }

        private sealed class SchemaMigrationPreview
        {
            public string Module { get; set; } = "";
            public string ModuleLabel { get; set; } = "";
            public string SourceSchema { get; set; } = "";
            public string TargetSchema { get; set; } = "";
            public string Risk { get; set; } = "";
            public bool RequiresAdmin { get; set; }
            public bool BusinessMeaningChanged { get; set; }
            public string Summary { get; set; } = "";
            public List<string> Changes { get; set; } = new List<string>();
            public Dictionary<string, int> RecordCounts { get; set; } = new(StringComparer.OrdinalIgnoreCase);
            public string BackupPath { get; set; } = "";
            public string BackupCreatedAt { get; set; } = "";
            public string SourceRevision { get; set; } = "";
            public string SourceSha256 { get; set; } = "";
            public string Status { get; set; } = "pending";
            public string Message { get; set; } = "";
        }

        private sealed class StartupMigrationSummary
        {
            public string CheckedAt { get; set; } = "";
            public List<SchemaMigrationPreview> Pending { get; set; } = new List<SchemaMigrationPreview>();
            public List<SchemaMigrationPreview> Blocked { get; set; } = new List<SchemaMigrationPreview>();
            public List<SchemaMigrationPreview> CompletedAutomatically { get; set; } = new List<SchemaMigrationPreview>();
            public List<string> Warnings { get; set; } = new List<string>();
        }

        private StartupMigrationSummary startupMigrationSummary = new StartupMigrationSummary();

        // Exact current->next migrations are registered here. v4.1.1 uses the framework for the
        // first real low-risk Attendance schema upgrade: configurable doctor-note point reduction
        // and controlled doctor-note edit history. Existing 50% business treatment is preserved.
        private static List<SchemaMigrationDefinition> BuildSchemaMigrationDefinitions()
        {
            return new List<SchemaMigrationDefinition>
            {
                new SchemaMigrationDefinition
                {
                    Module = "attendance",
                    FromRevision = 1,
                    ToRevision = 2,
                    Risk = "minor",
                    Summary = "Adds configurable doctor-note point-reduction policy and edit-history containers without changing existing 50% treatment.",
                    BusinessMeaningChanged = false,
                    PreserveRecordIdentity = true,
                    Changes = new List<string>
                    {
                        "Adds pointSystem.policy.doctorNoteReductionPercent with the existing 50% default.",
                        "Adds an editHistory array to existing doctor-note coverage records.",
                        "Preserves all employees, attendance records, doctor-note records, points, and identifiers."
                    },
                    Transform = root =>
                    {
                        JsonObject pointSystem;
                        if (root["pointSystem"] is JsonObject existingPointSystem) pointSystem = existingPointSystem;
                        else { pointSystem = new JsonObject(); root["pointSystem"] = pointSystem; }

                        JsonObject policy;
                        if (pointSystem["policy"] is JsonObject existingPolicy) policy = existingPolicy;
                        else { policy = new JsonObject(); pointSystem["policy"] = policy; }
                        if (policy["doctorNoteReductionPercent"] == null) policy["doctorNoteReductionPercent"] = 50;

                        if (root["medicalNotes"] is JsonArray medicalNotes)
                        {
                            foreach (JsonNode? item in medicalNotes)
                            {
                                if (item is JsonObject note && note["editHistory"] is not JsonArray)
                                    note["editHistory"] = new JsonArray();
                            }
                        }
                        return root;
                    }
                }
            };
        }

        private static SchemaMigrationDefinition? FindMigrationDefinition(string module, int fromRevision, int toRevision)
        {
            foreach (SchemaMigrationDefinition definition in BuildSchemaMigrationDefinitions())
            {
                if (string.Equals(definition.Module, module, StringComparison.OrdinalIgnoreCase)
                    && definition.FromRevision == fromRevision
                    && definition.ToRevision == toRevision)
                    return definition;
            }
            return null;
        }

        private static bool IsMajorMigration(SchemaMigrationDefinition definition) =>
            string.Equals(definition.Risk, "major", StringComparison.OrdinalIgnoreCase);

        private StartupMigrationSummary ProcessStartupSchemaMigrations()
        {
            EnsureFolders();
            var summary = new StartupMigrationSummary { CheckedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") };
            string dataDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data"));

            foreach (string module in ModuleNames())
            {
                if (!IsKnownJsonModule(module)) continue;
                string path = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(module)));
                if (!File.Exists(path)) continue;

                try
                {
                    string raw = File.ReadAllText(path);
                    SchemaCompatibilityInfo compatibility = EvaluateSchemaCompatibility(module, raw);
                    if (compatibility.Status == "current" || compatibility.Status == "legacy-missing") continue;

                    if (compatibility.Status != "previous")
                    {
                        summary.Blocked.Add(MigrationBlockedPreview(module, compatibility));
                        continue;
                    }

                    if (!TryParseSchemaRevision(compatibility.SchemaVersion, module, out int fromRevision))
                    {
                        summary.Blocked.Add(MigrationBlockedPreview(module, compatibility));
                        continue;
                    }

                    int toRevision = CurrentSchemaRevision(module);
                    SchemaMigrationDefinition? definition = FindMigrationDefinition(module, fromRevision, toRevision);
                    if (definition == null)
                    {
                        summary.Blocked.Add(new SchemaMigrationPreview
                        {
                            Module = module,
                            ModuleLabel = ModuleFolder(module),
                            SourceSchema = compatibility.SchemaVersion,
                            TargetSchema = compatibility.ExpectedSchemaVersion,
                            Risk = "blocked",
                            RequiresAdmin = true,
                            Summary = "No approved migration path is registered for this immediately previous schema.",
                            Status = "blocked",
                            Message = "The module remains read-only until an approved migration definition is included in the application."
                        });
                        continue;
                    }

                    SchemaMigrationPreview preview = BuildMigrationPreview(definition, path, raw);
                    if (IsMajorMigration(definition))
                    {
                        summary.Pending.Add(preview);
                        continue;
                    }

                    try
                    {
                        SchemaMigrationPreview completed = ExecuteSchemaMigration(definition, preview, "SYSTEM", "automatic-minor");
                        summary.CompletedAutomatically.Add(completed);
                        if (string.Equals(module, "suite-settings", StringComparison.OrdinalIgnoreCase))
                        {
                            settings = LoadSettingsFromDisk();
                            EnsureFolders();
                        }
                    }
                    catch (Exception ex)
                    {
                        preview.Status = "failed";
                        preview.Message = ex.Message;
                        summary.Blocked.Add(preview);
                        summary.Warnings.Add(ModuleFolder(module) + " automatic migration failed: " + ex.Message);
                    }
                }
                catch (Exception ex)
                {
                    summary.Warnings.Add(ModuleFolder(module) + " migration scan failed: " + ex.Message);
                }
            }

            startupMigrationSummary = summary;
            return summary;
        }

        private SchemaMigrationPreview MigrationBlockedPreview(string module, SchemaCompatibilityInfo compatibility)
        {
            return new SchemaMigrationPreview
            {
                Module = module,
                ModuleLabel = ModuleFolder(module),
                SourceSchema = compatibility.SchemaVersion,
                TargetSchema = compatibility.ExpectedSchemaVersion,
                Risk = "blocked",
                RequiresAdmin = true,
                Summary = compatibility.Message,
                Status = "blocked",
                Message = compatibility.Message
            };
        }

        private SchemaMigrationPreview BuildMigrationPreview(SchemaMigrationDefinition definition, string livePath, string raw)
        {
            string sourceSchema = definition.Module + "-" + definition.FromRevision;
            string targetSchema = definition.Module + "-" + definition.ToRevision;
            string sourceHash = Sha256File(livePath);
            string backupPath = EnsurePreMigrationBackup(definition.Module, livePath, sourceSchema, targetSchema, sourceHash);
            MigrationFingerprint fingerprint = BuildMigrationFingerprint(definition.Module, raw);

            return new SchemaMigrationPreview
            {
                Module = definition.Module,
                ModuleLabel = ModuleFolder(definition.Module),
                SourceSchema = sourceSchema,
                TargetSchema = targetSchema,
                Risk = IsMajorMigration(definition) ? "major" : "minor",
                RequiresAdmin = IsMajorMigration(definition),
                BusinessMeaningChanged = definition.BusinessMeaningChanged,
                Summary = definition.Summary,
                Changes = new List<string>(definition.Changes),
                RecordCounts = new Dictionary<string, int>(fingerprint.Counts, StringComparer.OrdinalIgnoreCase),
                BackupPath = backupPath,
                BackupCreatedAt = File.Exists(backupPath) ? File.GetCreationTime(backupPath).ToString("yyyy-MM-dd HH:mm:ss") : "",
                SourceRevision = GetDataRevision(livePath).Token,
                SourceSha256 = sourceHash,
                Status = "pending",
                Message = IsMajorMigration(definition)
                    ? "Admin approval is required before this migration can write live data."
                    : "Approved low-risk migration can run automatically after backup and validation."
            };
        }

        private string EnsurePreMigrationBackup(string module, string livePath, string sourceSchema, string targetSchema, string sourceHash)
        {
            string backupDir = ModuleBackupDir(module);
            Directory.CreateDirectory(backupDir);
            string shortHash = sourceHash.Length > 12 ? sourceHash[..12] : sourceHash;
            string baseName = Path.GetFileNameWithoutExtension(livePath);
            string safeFrom = sourceSchema.Replace(Path.DirectorySeparatorChar, '-').Replace(Path.AltDirectorySeparatorChar, '-');
            string safeTo = targetSchema.Replace(Path.DirectorySeparatorChar, '-').Replace(Path.AltDirectorySeparatorChar, '-');
            string backupPath = Path.GetFullPath(Path.Combine(backupDir, baseName + "__pre-migration__" + safeFrom + "_to_" + safeTo + "__" + shortHash + ".json"));
            if (!IsPathUnder(backupPath, backupDir)) throw new InvalidOperationException("Pre-migration backup path resolved outside the module backup folder.");

            if (!File.Exists(backupPath)) File.Copy(livePath, backupPath, false);
            ValidateJsonPayload(File.ReadAllText(backupPath), ModuleFolder(module) + " pre-migration backup");
            string backupHash = Sha256File(backupPath);
            if (!string.Equals(sourceHash, backupHash, StringComparison.OrdinalIgnoreCase))
                throw new IOException("Pre-migration backup hash did not match the live source file.");
            return backupPath;
        }

        private SchemaMigrationPreview ExecuteSchemaMigration(SchemaMigrationDefinition definition, SchemaMigrationPreview preview, string actor, string approvalMode)
        {
            string locksDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Locks"));
            Directory.CreateDirectory(locksDir);
            string lockPath = Path.GetFullPath(Path.Combine(locksDir, "schema-migration.lock"));
            FileStream? coordination = null;

            try
            {
                for (int attempt = 0; attempt < 75 && coordination == null; attempt++)
                {
                    try { coordination = new FileStream(lockPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None); }
                    catch (IOException) { Thread.Sleep(200); }
                }
                if (coordination == null) throw new IOException("The schema migration coordinator remained busy for " + ModuleFolder(definition.Module) + ".");

                string dataDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data"));
                string livePath = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(definition.Module)));
                if (!IsPathUnder(livePath, dataDir)) throw new InvalidOperationException("Migration target resolved outside the suite Data folder.");
                if (!File.Exists(livePath)) throw new FileNotFoundException("Migration source file was not found: " + livePath);

                string sourceRaw = File.ReadAllText(livePath);
                SchemaCompatibilityInfo sourceCompatibility = EvaluateSchemaCompatibility(definition.Module, sourceRaw);
                if (sourceCompatibility.Status == "current")
                {
                    preview.Status = "already-current";
                    preview.Message = "Another workstation or earlier operation already migrated this module.";
                    return preview;
                }
                if (sourceCompatibility.Status != "previous")
                    throw new SchemaCompatibilityException("Migration source is no longer the immediately previous supported schema. " + sourceCompatibility.Message);
                if (!string.Equals(sourceCompatibility.SchemaVersion, preview.SourceSchema, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Migration source schema changed after preview. No migration was written.");

                string liveHash = Sha256File(livePath);
                if (!string.Equals(liveHash, preview.SourceSha256, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Migration source changed after preview. No migration was written. Reopen the migration review to use the latest file.");

                string backupPath = EnsurePreMigrationBackup(definition.Module, livePath, preview.SourceSchema, preview.TargetSchema, liveHash);
                MigrationFingerprint before = BuildMigrationFingerprint(definition.Module, sourceRaw);
                JsonNode? parsed = JsonNode.Parse(sourceRaw);
                if (parsed is not JsonObject sourceObject) throw new InvalidDataException("Migration source JSON root must be an object.");
                JsonObject working = sourceObject.DeepClone().AsObject();
                JsonObject migrated = definition.Transform(working) ?? throw new InvalidDataException("Migration transform returned no JSON object.");
                migrated.Remove("SchemaVersion");
                migrated.Remove("LastWrittenByAppVersion");
                migrated["schemaVersion"] = preview.TargetSchema;
                migrated["lastWrittenByAppVersion"] = AppVersion;
                string migratedJson = migrated.ToJsonString(JsonOptions);
                ValidateJsonPayload(migratedJson, ModuleFolder(definition.Module) + " migrated staging data");

                SchemaCompatibilityInfo stagedCompatibility = EvaluateSchemaCompatibility(definition.Module, migratedJson);
                if (stagedCompatibility.Status != "current" || !stagedCompatibility.WriteAllowed)
                    throw new InvalidDataException("Migrated staging data did not match the target schema. " + stagedCompatibility.Message);

                MigrationFingerprint after = BuildMigrationFingerprint(definition.Module, migratedJson);
                if (definition.PreserveRecordIdentity) VerifyMigrationFingerprintPreserved(definition.Module, before, after);

                bool liveWasWritten = false;
                try
                {
                    DataWriteOutcome outcome = WriteJsonAtomically(
                        definition.Module,
                        livePath,
                        migratedJson,
                        "schema-migration:" + preview.SourceSchema + "->" + preview.TargetSchema,
                        "pre-migration-atomic",
                        preview.SourceRevision);
                    liveWasWritten = outcome.Verified;

                    string diskJson = File.ReadAllText(livePath);
                    SchemaCompatibilityInfo diskCompatibility = EvaluateSchemaCompatibility(definition.Module, diskJson);
                    if (diskCompatibility.Status != "current" || !diskCompatibility.WriteAllowed)
                        throw new InvalidDataException("Post-migration disk verification found an incompatible target schema. " + diskCompatibility.Message);
                    MigrationFingerprint diskFingerprint = BuildMigrationFingerprint(definition.Module, diskJson);
                    VerifyMigrationFingerprintEquals(definition.Module, after, diskFingerprint, "post-migration disk verification");

                    preview.Status = "completed";
                    preview.Message = "Migration completed, reopened from disk, and verified.";
                    preview.SourceRevision = GetDataRevision(livePath).Token;
                    preview.SourceSha256 = Sha256File(livePath);
                    WriteSchemaMigrationHistory(definition, preview, actor, approvalMode, true, "");
                    return preview;
                }
                catch (Exception ex)
                {
                    string rollbackError = "";
                    if (liveWasWritten)
                    {
                        try { RestorePreMigrationBackupDirect(definition.Module, livePath, backupPath, preview.SourceSchema); }
                        catch (Exception rollbackEx) { rollbackError = " Rollback also failed: " + rollbackEx.Message; }
                    }
                    WriteSchemaMigrationHistory(definition, preview, actor, approvalMode, false, ex.Message + rollbackError);
                    throw new InvalidOperationException("Schema migration failed. " + (liveWasWritten && string.IsNullOrEmpty(rollbackError) ? "The pre-migration state was restored. " : "") + ex.Message + rollbackError, ex);
                }
            }
            finally
            {
                coordination?.Dispose();
            }
        }

        private void RestorePreMigrationBackupDirect(string module, string livePath, string backupPath, string expectedBackupSchema)
        {
            string backupDir = ModuleBackupDir(module);
            string fullBackup = Path.GetFullPath(backupPath);
            if (!IsPathUnder(fullBackup, backupDir)) throw new InvalidOperationException("Migration rollback backup is outside the approved module backup folder.");
            if (!File.Exists(fullBackup)) throw new FileNotFoundException("Migration rollback backup was not found: " + fullBackup);
            string backupJson = File.ReadAllText(fullBackup);
            ValidateJsonPayload(backupJson, ModuleFolder(module) + " migration rollback backup");
            SchemaCompatibilityInfo backupCompatibility = EvaluateSchemaCompatibility(module, backupJson);
            if (!string.Equals(backupCompatibility.SchemaVersion, expectedBackupSchema, StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("Migration rollback backup schema no longer matches the expected pre-migration schema.");

            string expectedHash = Sha256File(fullBackup);
            string tempPath = livePath + ".migration-rollback-" + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                File.Copy(fullBackup, tempPath, false);
                if (File.Exists(livePath))
                {
                    try { File.Replace(tempPath, livePath, null, true); }
                    catch (PlatformNotSupportedException) { File.Move(tempPath, livePath, true); }
                    catch (IOException) when (File.Exists(tempPath)) { File.Move(tempPath, livePath, true); }
                }
                else File.Move(tempPath, livePath);

                string finalHash = Sha256File(livePath);
                if (!string.Equals(expectedHash, finalHash, StringComparison.OrdinalIgnoreCase))
                    throw new IOException("Migration rollback verification hash did not match the pre-migration backup.");
            }
            finally
            {
                try { if (File.Exists(tempPath)) File.Delete(tempPath); } catch { }
            }
        }

        private object GetSchemaMigrationStatus()
        {
            startupMigrationSummary = RefreshPendingMigrationState(startupMigrationSummary);
            return new
            {
                checkedAt = startupMigrationSummary.CheckedAt,
                pending = startupMigrationSummary.Pending,
                blocked = startupMigrationSummary.Blocked,
                completedAutomatically = startupMigrationSummary.CompletedAutomatically,
                warnings = startupMigrationSummary.Warnings,
                historyPath = SchemaMigrationHistoryPath()
            };
        }

        private StartupMigrationSummary RefreshPendingMigrationState(StartupMigrationSummary prior)
        {
            var refreshed = new StartupMigrationSummary
            {
                CheckedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                CompletedAutomatically = prior.CompletedAutomatically,
                Warnings = prior.Warnings
            };
            string dataDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data"));
            foreach (string module in ModuleNames())
            {
                if (!IsKnownJsonModule(module)) continue;
                string path = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(module)));
                if (!File.Exists(path)) continue;
                try
                {
                    string raw = File.ReadAllText(path);
                    SchemaCompatibilityInfo compatibility = EvaluateSchemaCompatibility(module, raw);
                    if (compatibility.Status == "current" || compatibility.Status == "legacy-missing") continue;
                    if (compatibility.Status != "previous")
                    {
                        refreshed.Blocked.Add(MigrationBlockedPreview(module, compatibility));
                        continue;
                    }
                    if (!TryParseSchemaRevision(compatibility.SchemaVersion, module, out int fromRevision))
                    {
                        refreshed.Blocked.Add(MigrationBlockedPreview(module, compatibility));
                        continue;
                    }
                    SchemaMigrationDefinition? definition = FindMigrationDefinition(module, fromRevision, CurrentSchemaRevision(module));
                    if (definition == null)
                    {
                        refreshed.Blocked.Add(new SchemaMigrationPreview { Module = module, ModuleLabel = ModuleFolder(module), SourceSchema = compatibility.SchemaVersion, TargetSchema = compatibility.ExpectedSchemaVersion, Risk = "blocked", RequiresAdmin = true, Summary = "No approved migration path is registered.", Status = "blocked", Message = "The module remains read-only." });
                        continue;
                    }
                    SchemaMigrationPreview preview = BuildMigrationPreview(definition, path, raw);
                    if (IsMajorMigration(definition)) refreshed.Pending.Add(preview);
                    else refreshed.Blocked.Add(new SchemaMigrationPreview { Module = module, ModuleLabel = ModuleFolder(module), SourceSchema = preview.SourceSchema, TargetSchema = preview.TargetSchema, Risk = "blocked", RequiresAdmin = false, Summary = "A low-risk automatic migration remains pending after startup.", Status = "blocked", Message = "Restart the suite or review migration history because the automatic startup migration did not complete." });
                }
                catch (Exception ex)
                {
                    refreshed.Warnings.Add(ModuleFolder(module) + " migration refresh failed: " + ex.Message);
                }
            }
            return refreshed;
        }

        private object ApproveSchemaMigration(string module, string adminUserId, string adminPin)
        {
            SuiteUser admin = RequireMigrationAdmin(adminUserId, adminPin);
            startupMigrationSummary = RefreshPendingMigrationState(startupMigrationSummary);
            SchemaMigrationPreview? pending = null;
            foreach (SchemaMigrationPreview item in startupMigrationSummary.Pending)
            {
                if (string.Equals(item.Module, module, StringComparison.OrdinalIgnoreCase)) { pending = item; break; }
            }
            if (pending == null) throw new InvalidOperationException("No Admin-approved schema migration is currently pending for " + ModuleFolder(module) + ".");
            if (!TryParseSchemaRevision(pending.SourceSchema, module, out int fromRevision)) throw new InvalidDataException("Pending migration source schema is invalid.");
            SchemaMigrationDefinition? definition = FindMigrationDefinition(module, fromRevision, CurrentSchemaRevision(module));
            if (definition == null) throw new InvalidOperationException("The approved migration definition is no longer available.");
            if (!IsMajorMigration(definition)) throw new InvalidOperationException("This migration is not an Admin-confirmation migration.");

            SchemaMigrationPreview completed = ExecuteSchemaMigration(definition, pending, admin.DisplayName, "admin-approved");
            if (string.Equals(module, "suite-settings", StringComparison.OrdinalIgnoreCase))
            {
                settings = LoadSettingsFromDisk();
                EnsureFolders();
            }
            startupMigrationSummary = RefreshPendingMigrationState(startupMigrationSummary);
            return new { migration = completed, status = GetSchemaMigrationStatus() };
        }

        private SuiteUser RequireMigrationAdmin(string userId, string pin)
        {
            foreach (SuiteUser user in settings.Users ?? new List<SuiteUser>())
            {
                if (!user.Active) continue;
                if (!string.Equals(user.Id, userId, StringComparison.OrdinalIgnoreCase)) continue;
                if (!string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase)) break;
                if (!string.Equals(user.Pin ?? "", pin ?? "", StringComparison.Ordinal)) throw new UnauthorizedAccessException("Administrator PIN verification failed for schema migration approval.");
                return user;
            }
            throw new UnauthorizedAccessException("An active Administrator account is required to approve this schema migration.");
        }

        private static bool TryParseSchemaRevision(string schemaVersion, string module, out int revision)
        {
            revision = -1;
            if (string.IsNullOrWhiteSpace(schemaVersion)) return false;
            string prefix = module + "-";
            if (!schemaVersion.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return false;
            return int.TryParse(schemaVersion[prefix.Length..], out revision);
        }

        private MigrationFingerprint BuildMigrationFingerprint(string module, string json)
        {
            var fp = new MigrationFingerprint();
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object) throw new InvalidDataException("Migration fingerprint requires an object root.");

            void ArrayIds(string property, string label)
            {
                var ids = new List<string>();
                int count = 0;
                if (root.TryGetProperty(property, out JsonElement arr) && arr.ValueKind == JsonValueKind.Array)
                {
                    foreach (JsonElement item in arr.EnumerateArray())
                    {
                        count++;
                        if (item.ValueKind != JsonValueKind.Object) continue;
                        if (TryElementId(item, out string id)) ids.Add(id);
                    }
                }
                fp.Counts[label] = count;
                ids.Sort(StringComparer.Ordinal);
                fp.IdentityDigests[label] = Sha256Text(string.Join("\n", ids));
            }

            if (module == "attendance")
            {
                ArrayIds("employees", "employees");
                ArrayIds("recordEdits", "recordEdits");
                ArrayIds("pointAdjustments", "pointAdjustments");
                ArrayIds("medicalNotes", "medicalNotes");
                ArrayIds("correctiveActions", "correctiveActions");
                var recordKeys = new List<string>();
                int employeeMaps = 0;
                if (root.TryGetProperty("attendance", out JsonElement attendanceMap) && attendanceMap.ValueKind == JsonValueKind.Object)
                {
                    foreach (JsonProperty employee in attendanceMap.EnumerateObject())
                    {
                        employeeMaps++;
                        if (employee.Value.ValueKind != JsonValueKind.Object) continue;
                        foreach (JsonProperty day in employee.Value.EnumerateObject()) recordKeys.Add(employee.Name + "|" + day.Name);
                    }
                }
                recordKeys.Sort(StringComparer.Ordinal);
                fp.Counts["attendanceEmployees"] = employeeMaps;
                fp.Counts["attendanceRecords"] = recordKeys.Count;
                fp.IdentityDigests["attendanceRecords"] = Sha256Text(string.Join("\n", recordKeys));
            }
            else if (module == "roster")
            {
                ArrayIds("employees", "employees");
                ArrayIds("schedule", "schedule");
                ArrayIds("trainingTopics", "trainingTopics");
                ArrayIds("trainingRecords", "trainingRecords");
                ArrayIds("officeSupplies", "officeSupplies");
            }
            else if (module == "tasks") ArrayIds("tasks", "tasks");
            else if (module == "shift-reports") { ArrayIds("reports", "reports"); ArrayIds("issues", "issues"); }
            else if (module == "shift-intelligence") { ArrayIds("issues", "issues"); ArrayIds("intake", "intake"); ArrayIds("reference", "reference"); }
            else if (module == "suite-settings") { ArrayIds("users", "users"); ArrayIds("coverageRequirements", "coverageRequirements"); }
            return fp;
        }

        private static bool TryElementId(JsonElement item, out string id)
        {
            id = "";
            string[] names = new[] { "id", "Id", "eid", "Eid", "employeeId", "EmployeeId" };
            foreach (string name in names)
            {
                if (!item.TryGetProperty(name, out JsonElement value)) continue;
                id = value.ValueKind == JsonValueKind.String ? value.GetString() ?? "" : value.ToString();
                if (!string.IsNullOrWhiteSpace(id)) return true;
            }
            return false;
        }

        private static void VerifyMigrationFingerprintPreserved(string module, MigrationFingerprint before, MigrationFingerprint after)
        {
            VerifyMigrationFingerprintEquals(module, before, after, "in-memory migration validation");
        }

        private static void VerifyMigrationFingerprintEquals(string module, MigrationFingerprint expected, MigrationFingerprint actual, string context)
        {
            foreach (KeyValuePair<string, int> pair in expected.Counts)
            {
                if (!actual.Counts.TryGetValue(pair.Key, out int actualCount) || actualCount != pair.Value)
                    throw new InvalidDataException(ModuleFolder(module) + " " + context + " failed record-count verification for " + pair.Key + ". Expected " + pair.Value + ", found " + actualCount + ".");
            }
            foreach (KeyValuePair<string, string> pair in expected.IdentityDigests)
            {
                if (!actual.IdentityDigests.TryGetValue(pair.Key, out string? actualDigest) || !string.Equals(actualDigest, pair.Value, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException(ModuleFolder(module) + " " + context + " failed key-identity verification for " + pair.Key + ".");
            }
        }

        private string SchemaMigrationHistoryPath()
        {
            string dir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data Integrity", "Schema Migrations"));
            Directory.CreateDirectory(dir);
            return Path.GetFullPath(Path.Combine(dir, "migration-history.jsonl"));
        }

        private void WriteSchemaMigrationHistory(SchemaMigrationDefinition definition, SchemaMigrationPreview preview, string actor, string approvalMode, bool success, string error)
        {
            try
            {
                string path = SchemaMigrationHistoryPath();
                string line = JsonSerializer.Serialize(new
                {
                    id = Guid.NewGuid().ToString("N"),
                    at = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                    appVersion = AppVersion,
                    user = actor,
                    machine = Environment.MachineName,
                    module = definition.Module,
                    sourceSchema = preview.SourceSchema,
                    targetSchema = preview.TargetSchema,
                    risk = preview.Risk,
                    approvalMode,
                    businessMeaningChanged = definition.BusinessMeaningChanged,
                    backupPath = preview.BackupPath,
                    recordCounts = preview.RecordCounts,
                    success,
                    error
                }, JsonOptions);

                for (int attempt = 0; attempt < 40; attempt++)
                {
                    try
                    {
                        using FileStream stream = new FileStream(path, FileMode.Append, FileAccess.Write, FileShare.Read, 16 * 1024, FileOptions.WriteThrough);
                        using var writer = new StreamWriter(stream, new UTF8Encoding(false));
                        writer.WriteLine(line);
                        writer.Flush();
                        stream.Flush(true);
                        return;
                    }
                    catch (IOException) when (attempt < 39) { Thread.Sleep(100); }
                }
            }
            catch { }
        }

        private object GetSchemaMigrationHistory()
        {
            string path = SchemaMigrationHistoryPath();
            var rows = new List<Dictionary<string, object?>>();
            if (File.Exists(path))
            {
                string[] lines = File.ReadAllLines(path);
                int start = Math.Max(0, lines.Length - 100);
                for (int i = lines.Length - 1; i >= start; i--)
                {
                    if (string.IsNullOrWhiteSpace(lines[i])) continue;
                    try
                    {
                        Dictionary<string, object?>? row = JsonSerializer.Deserialize<Dictionary<string, object?>>(lines[i], JsonOptions);
                        if (row != null) rows.Add(row);
                    }
                    catch { }
                }
            }
            return new { path, appendOnly = true, rows };
        }
    }
}
