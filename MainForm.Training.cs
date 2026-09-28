using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        // One-time release enrollment. This is a governed, revision-checked write;
        // it never creates observations, signoffs, or qualifications.
        private void AssignCurrentTrainingToCurrentEmployees()
        {
            ModuleLoadResult loaded = LoadModuleDataWithSource("training");
            if (loaded.Source != "live-shared" && loaded.Source != "packaged-recovery-created")
                throw new InvalidOperationException("Live Training data is unavailable for current-roster assignment.");
            if (!EvaluateSchemaCompatibility("training", loaded.Data).WriteAllowed)
                throw new InvalidOperationException("Training schema is not writable for current-roster assignment.");
            JsonObject data = JsonNode.Parse(loaded.Data) as JsonObject ?? throw new InvalidDataException("Training data is invalid.");
            if (data["currentRosterTrainingAssignedAt"] != null) return;

            ModuleLoadResult rosterLoad = LoadModuleDataWithSource("roster");
            if (rosterLoad.Source != "live-shared" && rosterLoad.Source != "packaged-recovery-created")
                throw new InvalidOperationException("Live Roster data is unavailable for Training assignment.");
            JsonObject roster = JsonNode.Parse(rosterLoad.Data) as JsonObject ?? throw new InvalidDataException("Roster data is invalid.");
            JsonArray employees = roster["employees"] as JsonArray ?? throw new InvalidDataException("Roster employees are missing.");
            JsonArray requirements = data["requirements"] as JsonArray ?? throw new InvalidDataException("Training requirements are missing.");
            JsonArray assignments = data["assignments"] as JsonArray ?? throw new InvalidDataException("Training assignments are missing.");
            JsonArray audit = data["audit"] as JsonArray ?? throw new InvalidDataException("Training audit is missing.");
            string[] currentEmployees = employees.OfType<JsonObject>()
                .Where(x => !string.Equals(x["archived"]?.ToString(), "true", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(x["status"]?.ToString(), "archived", StringComparison.OrdinalIgnoreCase))
                .Select(x => x["id"]?.ToString() ?? "").Where(x => x.Length > 0).Distinct().ToArray();
            string[] activeRequirements = requirements.OfType<JsonObject>()
                .Where(x => !string.Equals(x["active"]?.ToString(), "false", StringComparison.OrdinalIgnoreCase))
                .Select(x => x["id"]?.ToString() ?? "").Where(x => x.Length > 0).Distinct().ToArray();
            if (currentEmployees.Length == 0 || activeRequirements.Length == 0) return;

            var existing = assignments.OfType<JsonObject>().Select(x =>
                (Employee: x["employeeId"]?.ToString() ?? "", Requirement: x["requirementId"]?.ToString() ?? "")).ToHashSet();
            string now = DateTime.UtcNow.ToString("o");
            int added = 0;
            foreach (string employeeId in currentEmployees)
            foreach (string requirementId in activeRequirements)
            {
                if (!existing.Add((employeeId, requirementId))) continue;
                assignments.Add(new JsonObject { ["id"] = Guid.NewGuid().ToString("N"), ["employeeId"] = employeeId,
                    ["requirementId"] = requirementId, ["assignedAt"] = now, ["dueDate"] = "", ["status"] = "active",
                    ["assignedBy"] = "system-upgrade-v4.8.3", ["events"] = new JsonArray() });
                added++;
            }
            audit.Add(new JsonObject { ["at"] = now, ["actorId"] = "system-upgrade-v4.8.3",
                ["action"] = "assign-current-roster", ["employeeCount"] = currentEmployees.Length,
                ["requirementCount"] = activeRequirements.Length, ["assignmentsAdded"] = added });
            data["currentRosterTrainingAssignedAt"] = now;
            data["lastWrittenByAppVersion"] = AppVersion;
            data["lastSaved"] = now;
            SaveModuleData("training", data.ToJsonString(JsonOptions), loaded.Revision);
        }

        private static string TrainingText(JsonElement value, string name) => value.TryGetProperty(name, out JsonElement item) && item.ValueKind == JsonValueKind.String ? item.GetString()?.Trim() ?? "" : "";
        private static string TrainingRequired(JsonElement value, string name, int max = 500)
        {
            string text = TrainingText(value, name);
            if (text.Length == 0 || text.Length > max) throw new InvalidDataException(name + " is required (maximum " + max + " characters).");
            return text;
        }
        private static string TrainingDate(JsonElement value, string name, bool required = false)
        {
            string text = TrainingText(value, name);
            if (text.Length == 0 && !required) return "";
            if (text.Length != 10 || !DateTime.TryParseExact(text, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out DateTime parsed) || parsed.ToString("yyyy-MM-dd") != text)
                throw new InvalidDataException(name + " must be an ISO date.");
            return text;
        }
        private static JsonObject TrainingFind(JsonArray array, string id) => array.OfType<JsonObject>()
            .FirstOrDefault(x => string.Equals(x["id"]?.ToString(), id, StringComparison.Ordinal))
            ?? throw new InvalidDataException("Training item was not found: " + id);

        private object RunTrainingCommand(JsonElement root)
        {
            if (!root.TryGetProperty("payload", out JsonElement command) || command.ValueKind != JsonValueKind.Object)
                throw new InvalidDataException("Training command is missing.");
            string action = TrainingRequired(command, "action", 30);
            string capability = action switch
            {
                "requirement" or "assign" or "archive" or "closeAssignment" or "updateDueDate" => "training.manage",
                "record" or "acknowledge" or "retrain" => "training.record",
                "signoff" or "void" or "bulkSignoff" => "training.signoff",
                _ => throw new InvalidDataException("Unknown training command.")
            };
            SuiteUser actor = RequireBridgeCapability(root, capability);
            string expectedRevision = TrainingRequired(command, "expectedRevision", 200);
            ModuleLoadResult loaded = LoadModuleDataWithSource("training");
            SchemaCompatibilityInfo compatibility = EvaluateSchemaCompatibility("training", loaded.Data);
            if (!compatibility.WriteAllowed || loaded.Source == "fallback-storage-unavailable" || loaded.Source == "live-invalid")
                throw new InvalidOperationException("Training data is read-only: " + compatibility.Message);
            JsonObject data = JsonNode.Parse(loaded.Data) as JsonObject ?? throw new InvalidDataException("Training data root must be an object.");
            JsonArray requirements = data["requirements"] as JsonArray ?? throw new InvalidDataException("Training requirements are missing.");
            JsonArray assignments = data["assignments"] as JsonArray ?? throw new InvalidDataException("Training assignments are missing.");
            JsonArray audit = data["audit"] as JsonArray ?? throw new InvalidDataException("Training audit is missing.");
            string now = DateTime.UtcNow.ToString("o"), id = Guid.NewGuid().ToString("N");
            string subject = "";
            if (action == "requirement")
            {
                string title = TrainingRequired(command, "title", 120);
                string category = TrainingRequired(command, "category", 40);
                if (!new[] { "NEO", "Core", "Gate", "Patrol", "Base/EOC", "Other" }.Contains(category)) throw new InvalidDataException("Unknown training category.");
                string existing = TrainingText(command, "id");
                JsonObject item = existing.Length > 0 ? TrainingFind(requirements, existing) : new JsonObject { ["id"] = id, ["createdAt"] = now };
                if (existing.Length == 0) requirements.Add(item);
                if (requirements.OfType<JsonObject>().Any(x => !ReferenceEquals(x, item) && string.Equals(x["title"]?.ToString(), title, StringComparison.OrdinalIgnoreCase)))
                    throw new InvalidDataException("A requirement with that title already exists.");
                int renewalDays = command.TryGetProperty("renewalDays", out JsonElement days) && days.TryGetInt32(out int n) ? n : 0;
                if (renewalDays < 0 || renewalDays > 3650) throw new InvalidDataException("Renewal days must be between 0 and 3650.");
                if (existing.Length > 0)
                {
                    JsonArray versions = item["versions"] as JsonArray ?? new JsonArray();
                    if (item["versions"] == null) item["versions"] = versions;
                    versions.Add(new JsonObject { ["title"] = item["title"]?.ToString(), ["category"] = item["category"]?.ToString(),
                        ["renewalDays"] = item["renewalDays"]?.DeepClone(), ["reference"] = item["reference"]?.ToString(),
                        ["replacedAt"] = now, ["replacedBy"] = actor.Id });
                }
                item["title"] = title; item["category"] = category; item["renewalDays"] = renewalDays;
                item["reference"] = TrainingText(command, "reference")[..Math.Min(TrainingText(command, "reference").Length, 300)];
                item["active"] = true; item["updatedAt"] = now; item["updatedBy"] = actor.Id;
                subject = item["id"]!.ToString();
            }
            else if (action == "archive")
            {
                JsonObject item = TrainingFind(requirements, TrainingRequired(command, "requirementId", 80));
                item["active"] = false; item["updatedAt"] = now; item["updatedBy"] = actor.Id;
                subject = item["id"]!.ToString();
            }
            else if (action == "assign")
            {
                string employeeId = TrainingRequired(command, "employeeId", 80), requirementId = TrainingRequired(command, "requirementId", 80);
                JsonObject requirement = TrainingFind(requirements, requirementId);
                if (requirement["active"]?.GetValue<bool>() != true) throw new InvalidDataException("This requirement is archived.");
                JsonObject rosterData = JsonNode.Parse(LoadModuleDataWithSource("roster").Data) as JsonObject ?? throw new InvalidDataException("Roster is unavailable.");
                JsonObject employee = (rosterData["employees"] as JsonArray)?.OfType<JsonObject>().FirstOrDefault(x => x["id"]?.ToString() == employeeId)
                    ?? throw new InvalidDataException("Employee was not found in the roster.");
                if (employee["archived"]?.ToString() == "true") throw new InvalidDataException("Employee is archived.");
                if (assignments.OfType<JsonObject>().Any(x => x["employeeId"]?.ToString() == employeeId && x["requirementId"]?.ToString() == requirementId && x["status"]?.ToString() == "active"))
                    throw new InvalidDataException("This employee already has an active assignment for that requirement.");
                string due = TrainingDate(command, "dueDate");
                assignments.Add(new JsonObject { ["id"] = id, ["employeeId"] = employeeId, ["requirementId"] = requirementId,
                    ["assignedAt"] = now, ["dueDate"] = due, ["status"] = "active", ["assignedBy"] = actor.Id, ["events"] = new JsonArray() });
                subject = id;
            }
            else if (action == "closeAssignment")
            {
                JsonObject assignment = TrainingFind(assignments, TrainingRequired(command, "assignmentId", 80));
                string reason = TrainingRequired(command, "notes", 2000);
                if (reason.Length < 10) throw new InvalidDataException("A reason of at least 10 characters is required.");
                if (assignment["status"]?.ToString() != "active") throw new InvalidDataException("Assignment is already closed.");
                assignment["status"] = "archived";
                assignment["closedAt"] = now; assignment["closedBy"] = actor.Id; assignment["closeReason"] = reason;
                subject = assignment["id"]!.ToString();
            }
            else if (action == "updateDueDate")
            {
                JsonObject assignment = TrainingFind(assignments, TrainingRequired(command, "assignmentId", 80));
                if (assignment["status"]?.ToString() != "active") throw new InvalidDataException("Assignment is not active.");
                string oldDate = assignment["dueDate"]?.ToString() ?? "";
                string dueDate = TrainingDate(command, "dueDate");
                string reason = TrainingRequired(command, "notes", 2000);
                if (reason.Length < 10) throw new InvalidDataException("A reason of at least 10 characters is required.");
                assignment["dueDate"] = dueDate;
                (assignment["events"] as JsonArray ?? throw new InvalidDataException("Assignment event history is invalid."))
                    .Add(new JsonObject { ["id"] = id, ["type"] = "due-date-change", ["date"] = dueDate,
                        ["at"] = now, ["actorId"] = actor.Id, ["actorName"] = actor.DisplayName,
                        ["oldDueDate"] = oldDate, ["newDueDate"] = dueDate, ["notes"] = reason });
                subject = assignment["id"]!.ToString();
            }
            else if (action == "bulkSignoff")
            {
                if (!string.Equals(actor.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                    throw new UnauthorizedAccessException("Only the Security Manager/Admin may sign off multiple trainings.");
                string employeeId = TrainingRequired(command, "employeeId", 80);
                string effectiveDate = TrainingDate(command, "date", true);
                bool managerOverride = command.TryGetProperty("managerOverride", out JsonElement bulkOverride) && bulkOverride.ValueKind == JsonValueKind.True;
                if (!command.TryGetProperty("items", out JsonElement items) || items.ValueKind != JsonValueKind.Array ||
                    items.GetArrayLength() < 2 || items.GetArrayLength() > 50)
                    throw new InvalidDataException("Select 2 to 50 training assignments for bulk signoff.");
                JsonObject rosterData = JsonNode.Parse(LoadModuleDataWithSource("roster").Data) as JsonObject ?? throw new InvalidDataException("Roster is unavailable.");
                JsonObject employee = (rosterData["employees"] as JsonArray)?.OfType<JsonObject>().FirstOrDefault(x => x["id"]?.ToString() == employeeId)
                    ?? throw new InvalidDataException("Employee was not found in the roster.");
                string employeeName = ((employee["first"]?.ToString() ?? "") + " " + (employee["last"]?.ToString() ?? "")).Trim();
                if (string.Equals(actor.Id, employeeId, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(actor.Id, employee["eid"]?.ToString(), StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(actor.Username, employeeName, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(actor.DisplayName, employeeName, StringComparison.OrdinalIgnoreCase))
                    throw new UnauthorizedAccessException("A candidate cannot sign off their own training.");
                string batchId = id;
                var selected = new System.Collections.Generic.HashSet<string>(StringComparer.Ordinal);
                foreach (JsonElement entry in items.EnumerateArray())
                {
                    if (entry.ValueKind != JsonValueKind.Object) throw new InvalidDataException("A bulk signoff item is invalid.");
                    string assignmentId = TrainingRequired(entry, "assignmentId", 80);
                    if (!selected.Add(assignmentId)) throw new InvalidDataException("A training assignment was selected more than once.");
                    JsonObject assignment = TrainingFind(assignments, assignmentId);
                    if (assignment["employeeId"]?.ToString() != employeeId || assignment["status"]?.ToString() != "active")
                        throw new InvalidDataException("Every selected assignment must be active for the selected employee.");
                    JsonObject requirement = TrainingFind(requirements, assignment["requirementId"]?.ToString() ?? "");
                    if (requirement["active"]?.ToString() == "false")
                        throw new InvalidDataException("An archived requirement cannot be signed off.");
                    JsonArray events = assignment["events"] as JsonArray ?? throw new InvalidDataException("Assignment event history is invalid.");
                    JsonObject? latestPass = events.OfType<JsonObject>().LastOrDefault(x => x["type"]?.ToString() == "record" && x["outcome"]?.ToString() == "Pass" &&
                        !events.OfType<JsonObject>().Any(c => c["type"]?.ToString() == "void" && c["reference"]?.ToString() == x["id"]?.ToString()));
                    JsonObject? latestRetrain = events.OfType<JsonObject>().LastOrDefault(x => x["type"]?.ToString() == "retrain");
                    JsonObject? latestSignoff = events.OfType<JsonObject>().LastOrDefault(x => x["type"]?.ToString() == "signoff" &&
                        !events.OfType<JsonObject>().Any(c => c["type"]?.ToString() == "void" && c["reference"]?.ToString() == x["id"]?.ToString()));
                    if (!managerOverride && (latestPass == null ||
                        (latestRetrain != null && string.CompareOrdinal(latestRetrain["at"]?.ToString(), latestPass["at"]?.ToString()) > 0) ||
                        (latestSignoff != null && string.CompareOrdinal(latestSignoff["at"]?.ToString(), latestPass["at"]?.ToString()) > 0) ||
                        string.CompareOrdinal(effectiveDate, latestPass["date"]?.ToString()) < 0))
                        throw new InvalidDataException("A new passing observation is required for " + requirement["title"]?.ToString() + ".");
                    if (latestSignoff != null && string.CompareOrdinal(latestSignoff["date"]?.ToString(), effectiveDate) >= 0)
                        throw new InvalidDataException("This training already has a signoff on or after that date: " + requirement["title"]?.ToString());
                    string notes = TrainingText(entry, "notes");
                    string reference = TrainingText(entry, "reference");
                    if (notes.Length > 2000 || reference.Length > 300)
                        throw new InvalidDataException("A signoff note or reference is too long.");
                    if (managerOverride && notes.Length < 10)
                        throw new InvalidDataException("Enter a specific manager basis for " + requirement["title"]?.ToString() + ".");
                    events.Add(new JsonObject { ["id"] = Guid.NewGuid().ToString("N"), ["type"] = "signoff", ["date"] = effectiveDate,
                        ["at"] = now, ["actorId"] = actor.Id, ["actorName"] = actor.DisplayName,
                        ["method"] = "", ["outcome"] = "", ["notes"] = notes, ["reference"] = reference,
                        ["managerOverride"] = managerOverride, ["batchId"] = batchId });
                }
                subject = employeeId;
                audit.Add(new JsonObject { ["at"] = now, ["actorId"] = actor.Id, ["action"] = "bulkSignoff",
                    ["subjectId"] = employeeId, ["batchId"] = batchId, ["count"] = selected.Count });
            }
            else
            {
                JsonObject assignment = TrainingFind(assignments, TrainingRequired(command, "assignmentId", 80));
                if (assignment["status"]?.ToString() != "active") throw new InvalidDataException("Assignment is not active.");
                subject = assignment["id"]!.ToString();
                string employeeId = assignment["employeeId"]?.ToString() ?? "";
                if (action == "signoff" || action == "record" || action == "void")
                {
                    JsonObject rosterData = JsonNode.Parse(LoadModuleDataWithSource("roster").Data) as JsonObject ?? throw new InvalidDataException("Roster is unavailable.");
                    JsonObject? employee = (rosterData["employees"] as JsonArray)?.OfType<JsonObject>().FirstOrDefault(x => x["id"]?.ToString() == employeeId);
                    string name = ((employee?["first"]?.ToString() ?? "") + " " + (employee?["last"]?.ToString() ?? "")).Trim();
                    if (string.Equals(actor.Id, employeeId, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(actor.Id, employee?["eid"]?.ToString(), StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(actor.Username, name, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(actor.DisplayName, name, StringComparison.OrdinalIgnoreCase))
                        throw new UnauthorizedAccessException("A candidate cannot record or sign off their own training.");
                }
                JsonArray events = assignment["events"] as JsonArray ?? throw new InvalidDataException("Assignment event history is invalid.");
                bool managerOverride = action == "signoff" && command.TryGetProperty("managerOverride", out JsonElement overrideValue) && overrideValue.ValueKind == JsonValueKind.True;
                if (action == "signoff")
                {
                    if (managerOverride && !string.Equals(actor.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                        throw new UnauthorizedAccessException("Only the Security Manager/Admin may sign off without a passing observation.");
                    JsonObject? latestPass = events.OfType<JsonObject>().LastOrDefault(x => x["type"]?.ToString() == "record" && x["outcome"]?.ToString() == "Pass" &&
                        !events.OfType<JsonObject>().Any(c => c["type"]?.ToString() == "void" && c["reference"]?.ToString() == x["id"]?.ToString()));
                    JsonObject? latestRetrain = events.OfType<JsonObject>().LastOrDefault(x => x["type"]?.ToString() == "retrain");
                    if (!managerOverride && (latestPass == null || (latestRetrain != null && string.CompareOrdinal(latestRetrain["at"]?.ToString(), latestPass["at"]?.ToString()) > 0)))
                        throw new InvalidDataException("A passing observation after any retraining is required before signoff.");
                    JsonObject? latestSignoff = events.OfType<JsonObject>().LastOrDefault(x => x["type"]?.ToString() == "signoff" &&
                        !events.OfType<JsonObject>().Any(c => c["type"]?.ToString() == "void" && c["reference"]?.ToString() == x["id"]?.ToString()));
                    if (!managerOverride && latestSignoff != null && string.CompareOrdinal(latestSignoff["at"]?.ToString(), latestPass!["at"]?.ToString()) > 0)
                        throw new InvalidDataException("A new passing observation is required before renewal signoff.");
                    if (!managerOverride && string.CompareOrdinal(TrainingDate(command, "date", true), latestPass!["date"]?.ToString()) < 0)
                        throw new InvalidDataException("Signoff date cannot precede the passing observation.");
                }
                if (action == "void" && events.Count == 0) throw new InvalidDataException("There is no event to correct.");
                string effectiveDate = TrainingDate(command, "date", action != "void");
                string notes = TrainingText(command, "notes");
                if (notes.Length > 2000) throw new InvalidDataException("Notes exceed 2000 characters.");
                if (managerOverride && notes.Length < 10)
                    throw new InvalidDataException("Manager signoff without a passing observation requires a documented reason of at least 10 characters.");
                string method = TrainingText(command, "method"), outcome = TrainingText(command, "outcome");
                if (action == "record" && (!new[] { "Observed", "Practical", "Discussion", "Document review" }.Contains(method) || !new[] { "Pass", "Needs practice" }.Contains(outcome)))
                    throw new InvalidDataException("Select a valid method and outcome.");
                if (action == "void" && notes.Length < 10) throw new InvalidDataException("A correction reason of at least 10 characters is required.");
                string reference = TrainingText(command, "reference");
                if (reference.Length > 300) throw new InvalidDataException("Reference exceeds 300 characters.");
                if (action == "void" && !events.OfType<JsonObject>().Any(x => x["id"]?.ToString() == reference && x["type"]?.ToString() != "void"))
                    throw new InvalidDataException("Select an existing evidence event to correct.");
                events.Add(new JsonObject { ["id"] = id, ["type"] = action, ["date"] = effectiveDate,
                    ["at"] = now, ["actorId"] = actor.Id, ["actorName"] = actor.DisplayName,
                    ["method"] = method, ["outcome"] = outcome, ["notes"] = notes,
                    ["reference"] = reference, ["managerOverride"] = managerOverride });
            }
            audit.Add(new JsonObject { ["at"] = now, ["actorId"] = actor.Id, ["action"] = action, ["subjectId"] = subject });
            data["schemaVersion"] = "training-1"; data["lastWrittenByAppVersion"] = AppVersion; data["lastSaved"] = now;
            object saved = SaveModuleData("training", data.ToJsonString(JsonOptions), expectedRevision);
            return new { save = saved, data = data.ToJsonString(JsonOptions) };
        }
    }
}
