using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json.Nodes;

namespace PWADC.SecurityOperationsSuite;

internal static class ModuleWritePolicy
{
    private static readonly HashSet<string> RosterFields = new("id first last eid doh dop rank shift gateShift type rdo rdos employmentClass notes active archived status archivedAt archivedBy separationDate separationReason".Split(' '));
    private static readonly HashSet<string> UniformFields = new("shirt pants jacket equipmentItems separationChecklist".Split(' '));
    private static readonly HashSet<string> PayFields = new("rate salary annualSalary hourlyRate payRate".Split(' '));
    private static bool IsUniform(string key) => UniformFields.Contains(key) || new[] { "shirt", "pants", "jacket" }.Any(p => key.StartsWith(p, StringComparison.Ordinal));
    public static JsonObject Project(string module, JsonObject live, Func<string, bool> can)
    {
        var result = (JsonObject)live.DeepClone();
        if (module != "roster") return result;
        foreach (var key in result.Select(p => p.Key).ToArray())
        {
            bool visible = key switch
            {
                "employees" => can("roster.view") || can("schedule.view") || can("training.view") || can("uniforms.view") || can("promotion.view"),
                "schedule" or "scheduleDrafts" => can("schedule.view"),
                "officeSupplies" => can("supplies.view"),
                "trainingTopics" or "trainingRecords" => can("training.view"),
                "audit" => can("audit.view"),
                _ => true
            };
            if (!visible) result.Remove(key);
        }
        if (result["employees"] is JsonArray employees)
            foreach (JsonObject employee in employees.OfType<JsonObject>())
                foreach (string key in employee.Select(p => p.Key).ToArray())
                    if ((PayFields.Contains(key) && !can("reports.viewPay")) ||
                        (IsUniform(key) && !can("uniforms.view")) ||
                        (!RosterFields.Contains(key) && !PayFields.Contains(key) && !IsUniform(key))) employee.Remove(key);
        // Match browser normalization without turning absent counters into writes.
        foreach (var (counter, collection) in new[] { ("nextId", "employees"), ("nextTrainingTopicId", "trainingTopics"), ("nextTrainingRecordId", "trainingRecords"), ("nextOfficeSupplyId", "officeSupplies") })
            if (result[counter] == null)
            {
                var rows = result[collection] as JsonArray ?? new();
                result[counter] = rows.OfType<JsonObject>().Select(x => int.TryParse(x["id"]?.ToString(), out int id) ? id : 0).DefaultIfEmpty(0).Max() + 1;
            }
        return result;
    }
    public static JsonObject Apply(string module, JsonObject live, JsonObject incoming, Func<string, bool> can)
    {
        JsonObject visible = Project(module, live, can);
        JsonObject output = (JsonObject)live.DeepClone();
        foreach (var pair in incoming)
        {
            string key = pair.Key;
            if (key is "schemaVersion" or "lastWrittenByAppVersion") continue;
            if (key == "audit")
            {
                if (pair.Value is not JsonArray incomingAudit) throw new InvalidDataException("Audit must be an array.");
                var existing = live[key] as JsonArray ?? new();
                var signatures = existing.Select(x => x?.ToJsonString() ?? "null").ToHashSet(StringComparer.Ordinal);
                var merged = (JsonArray)existing.DeepClone();
                foreach (var row in incomingAudit) if (signatures.Add(row?.ToJsonString() ?? "null")) merged.Add(row?.DeepClone());
                output[key] = merged;
                continue;
            }
            if (JsonNode.DeepEquals(pair.Value, visible[key])) continue;
            if (key == "employees" && module == "roster")
            {
                output[key] = ApplyEmployees(live[key] as JsonArray ?? new(), pair.Value as JsonArray ?? throw new InvalidDataException("Employees must be an array."), can);
                continue;
            }
            bool allowed = key is "lastSaved" or "audit" || (module switch
            {
                "roster" => key switch
                {
                    "schedule" or "scheduleDrafts" or "scheduleWorkspace" => can("schedule.edit"),
                    "officeSupplies" or "nextSupplyId" or "nextOfficeSupplyId" => can("supplies.manage"),
                    "trainingTopics" or "trainingRecords" or "nextTrainingTopicId" or "nextTrainingRecordId" => can("training.manage"),
                    "nextId" or "customRanks" => can("roster.edit"),
                    _ => false
                },
                "attendance" => key switch
                {
                    "pointSystem" or "settings" => can("attendance.managePolicy"),
                    "pointAdjustments" => can("attendance.adjustPoints"),
                    "correctiveActions" or "flagActions" or "patternActions" => can("attendance.correctiveAction"),
                    "employees" or "attendance" or "notes" or "recordEdits" or "medicalNotes" or "tardyReclassifications" or "autoOff" or "workdayBasis" => can("attendance.edit"),
                    _ => false
                },
                "tasks" => can("tasks.manage"),
                "shift-reports" => can("shiftReports.manage"),
                "shift-intelligence" => can("shiftIntelligence.manage"),
                _ => false
            });
            // Front-end normalization may add empty containers on projected data.
            bool empty = pair.Value == null || pair.Value is JsonArray a && a.Count == 0 || pair.Value is JsonObject o && o.Count == 0;
            if (!allowed && visible[key] == null && empty) continue;
            if (!allowed) throw new UnauthorizedAccessException("Permission required to change " + module + "." + key + ".");
            output[key] = pair.Value?.DeepClone();
        }
        return output;
    }
    private static JsonArray ApplyEmployees(JsonArray live, JsonArray incoming, Func<string, bool> can)
    {
        var byId = live.OfType<JsonObject>().ToDictionary(x => x["id"]?.ToString() ?? "");
        var output = new JsonArray();
        var seen = new HashSet<string>();
        foreach (JsonObject candidate in incoming.OfType<JsonObject>())
        {
            string id = candidate["id"]?.ToString() ?? "";
            if (id.Length == 0 || !seen.Add(id)) throw new InvalidDataException("Employee IDs must be unique and nonblank.");
            bool exists = byId.TryGetValue(id, out var old);
            if (!exists && !can("roster.edit")) throw new UnauthorizedAccessException("Adding employees requires roster.edit.");
            var merged = exists ? (JsonObject)old!.DeepClone() : new JsonObject();
            foreach (var pair in candidate)
            {
                if (JsonNode.DeepEquals(pair.Value, old?[pair.Key])) continue;
                bool allowed = PayFields.Contains(pair.Key) ? can("roster.edit") && can("reports.viewPay") :
                    IsUniform(pair.Key) ? can("uniforms.manage") : RosterFields.Contains(pair.Key) && can("roster.edit");
                if (!allowed) throw new UnauthorizedAccessException("Permission required to change employee field " + pair.Key + ".");
                merged[pair.Key] = pair.Value?.DeepClone();
            }
            output.Add(merged);
        }
        if (incoming.Count != output.Count) throw new InvalidDataException("Every employee must be an object.");
        if (!can("roster.edit"))
        {
            if (seen.Count == 0) return (JsonArray)live.DeepClone(); // no employee read permission
            if (seen.Count != byId.Count) throw new UnauthorizedAccessException("Removing employees requires roster.edit.");
        }
        return output;
    }
}
