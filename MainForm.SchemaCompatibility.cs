using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private sealed class SchemaCompatibilityException : InvalidDataException
        {
            public SchemaCompatibilityException(string message) : base(message) { }
        }

        private sealed class SchemaCompatibilityInfo
        {
            public string Module { get; set; } = "";
            public string SchemaVersion { get; set; } = "";
            public string ExpectedSchemaVersion { get; set; } = "";
            public string LastWrittenByAppVersion { get; set; } = "";
            public string Status { get; set; } = "unknown";
            public string Message { get; set; } = "";
            public bool ReadAllowed { get; set; } = true;
            public bool WriteAllowed { get; set; } = false;
        }

        private sealed class SchemaInitializationResult
        {
            public int Updated { get; set; }
            public List<string> Issues { get; } = new List<string>();
        }

        private static readonly Dictionary<string, int> CurrentSchemaRevisions = new(StringComparer.OrdinalIgnoreCase)
        {
            ["attendance"] = 1,
            ["roster"] = 1,
            ["tasks"] = 1,
            ["shift-reports"] = 1,
            ["shift-intelligence"] = 1,
            ["suite-settings"] = 1
        };

        private static string CurrentSchemaVersion(string module)
        {
            if (!CurrentSchemaRevisions.TryGetValue(module, out int revision))
                throw new InvalidOperationException("No schema version is registered for module: " + module);
            return module + "-" + revision;
        }

        private static bool TryReadStringProperty(JsonElement root, string camelName, string pascalName, out string value)
        {
            value = "";
            if (root.ValueKind != JsonValueKind.Object) return false;
            if (root.TryGetProperty(camelName, out JsonElement camel))
            {
                value = camel.ValueKind == JsonValueKind.String ? camel.GetString() ?? "" : camel.ToString();
                return true;
            }
            if (root.TryGetProperty(pascalName, out JsonElement pascal))
            {
                value = pascal.ValueKind == JsonValueKind.String ? pascal.GetString() ?? "" : pascal.ToString();
                return true;
            }
            return false;
        }

        private SchemaCompatibilityInfo EvaluateSchemaCompatibility(string module, string json)
        {
            string expected = CurrentSchemaVersion(module);
            var result = new SchemaCompatibilityInfo
            {
                Module = module,
                ExpectedSchemaVersion = expected,
                ReadAllowed = true,
                WriteAllowed = false
            };

            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);
                JsonElement root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Object)
                {
                    result.Status = "unsupported";
                    result.ReadAllowed = false;
                    result.Message = "The JSON root must be an object before schema compatibility can be established.";
                    return result;
                }

                TryReadStringProperty(root, "lastWrittenByAppVersion", "LastWrittenByAppVersion", out string lastWriter);
                result.LastWrittenByAppVersion = lastWriter;

                if (!TryReadStringProperty(root, "schemaVersion", "SchemaVersion", out string actual) || string.IsNullOrWhiteSpace(actual))
                {
                    result.Status = "legacy-missing";
                    result.SchemaVersion = "";
                    result.WriteAllowed = true;
                    result.Message = "Legacy JSON has no schema marker. This release can add the initial schema metadata without changing business data.";
                    return result;
                }

                actual = actual.Trim();
                result.SchemaVersion = actual;
                if (string.Equals(actual, expected, StringComparison.OrdinalIgnoreCase))
                {
                    result.Status = "current";
                    result.WriteAllowed = true;
                    result.Message = "Schema is current.";
                    return result;
                }

                int dash = actual.LastIndexOf('-');
                if (dash <= 0 || dash >= actual.Length - 1 || !int.TryParse(actual[(dash + 1)..], out int actualRevision))
                {
                    result.Status = "unsupported";
                    result.Message = "Schema marker is malformed or unsupported: " + actual;
                    return result;
                }

                string actualModule = actual[..dash];
                if (!string.Equals(actualModule, module, StringComparison.OrdinalIgnoreCase))
                {
                    result.Status = "wrong-module";
                    result.Message = "Schema marker " + actual + " does not belong to module " + module + ".";
                    return result;
                }

                int expectedRevision = CurrentSchemaRevisions[module];
                if (actualRevision > expectedRevision)
                {
                    result.Status = "newer";
                    result.Message = "This file uses newer schema " + actual + "; this app supports " + expected + ". Writes are blocked to protect newer data.";
                    return result;
                }

                result.Status = "older";
                result.Message = "This file uses older schema " + actual + "; controlled migration to " + expected + " is required before writes are allowed.";
                return result;
            }
            catch (JsonException ex)
            {
                result.Status = "invalid-json";
                result.ReadAllowed = false;
                result.Message = ex.Message;
                return result;
            }
        }

        private static bool IsExplicitInvalidJsonRecoveryOperation(string operation)
        {
            return string.Equals(operation, "restore-backup", StringComparison.OrdinalIgnoreCase)
                || string.Equals(operation, "reset-from-packaged-seed", StringComparison.OrdinalIgnoreCase);
        }

        private void EnsureExistingTargetSchemaCompatibleForWrite(string module, string targetPath, string operation)
        {
            if (!File.Exists(targetPath)) return;

            string liveJson = File.ReadAllText(targetPath);
            SchemaCompatibilityInfo compatibility = EvaluateSchemaCompatibility(module, liveJson);
            if (compatibility.Status == "current" || compatibility.Status == "legacy-missing") return;

            // Explicit recovery is allowed to replace malformed JSON because schema metadata cannot
            // be trusted or inspected until the damaged file has been replaced. A formally older,
            // newer, wrong-module, or unsupported schema is still protected from overwrite.
            if (compatibility.Status == "invalid-json" && IsExplicitInvalidJsonRecoveryOperation(operation)) return;

            throw new SchemaCompatibilityException(
                "SCHEMA_TARGET_BLOCK: Existing " + ModuleFolder(module) + " data cannot be replaced by this operation. " + compatibility.Message);
        }

        private string PrepareJsonForWrite(string module, string json)
        {
            SchemaCompatibilityInfo compatibility = EvaluateSchemaCompatibility(module, json);
            if (!compatibility.ReadAllowed || !compatibility.WriteAllowed)
            {
                throw new SchemaCompatibilityException(
                    "SCHEMA_COMPATIBILITY_BLOCK: " + ModuleFolder(module) + " cannot be written. " + compatibility.Message);
            }

            JsonNode? parsed = JsonNode.Parse(json);
            if (parsed is not JsonObject root)
                throw new SchemaCompatibilityException("SCHEMA_COMPATIBILITY_BLOCK: " + ModuleFolder(module) + " JSON root must be an object.");

            root.Remove("SchemaVersion");
            root.Remove("LastWrittenByAppVersion");
            root["schemaVersion"] = CurrentSchemaVersion(module);
            root["lastWrittenByAppVersion"] = AppVersion;
            return root.ToJsonString(JsonOptions);
        }

        private SchemaInitializationResult EnsureLiveSchemaMetadata()
        {
            EnsureFolders();
            var result = new SchemaInitializationResult();
            string dataDir = Path.GetFullPath(Path.Combine(settings.DataRoot, "Data"));

            var registeredPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (string module in ModuleNames())
            {
                if (!IsKnownJsonModule(module)) continue;
                string path = Path.GetFullPath(Path.Combine(dataDir, ModuleFileName(module)));
                registeredPaths.Add(path);
                if (!File.Exists(path)) continue;

                try
                {
                    string json = File.ReadAllText(path);
                    SchemaCompatibilityInfo compatibility = EvaluateSchemaCompatibility(module, json);
                    if (compatibility.Status == "current") continue;
                    if (compatibility.Status == "legacy-missing")
                    {
                        string expectedRevision = GetDataRevision(path).Token;
                        WriteJsonAtomically(module, path, json, "schema-metadata-initialize", "pre-schema-metadata", expectedRevision);
                        result.Updated++;
                        continue;
                    }
                    result.Issues.Add(ModuleFolder(module) + ": " + compatibility.Message);
                }
                catch (Exception ex)
                {
                    result.Issues.Add(ModuleFolder(module) + ": " + ex.Message);
                }
            }

            // Every suite-managed live JSON file must be registered before it can participate in
            // schema guarding. Unknown JSON is never modified automatically; it is surfaced for review.
            foreach (string jsonPath in Directory.GetFiles(dataDir, "*.json", SearchOption.AllDirectories))
            {
                string full = Path.GetFullPath(jsonPath);
                if (!registeredPaths.Contains(full))
                    result.Issues.Add("Unregistered live JSON file requires a schema registration before use: " + Path.GetRelativePath(dataDir, full));
            }
            return result;
        }
    }
}
