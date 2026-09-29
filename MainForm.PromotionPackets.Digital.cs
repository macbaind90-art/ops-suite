using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private static void AssertPromotionEvaluatorIsNotCandidate(SuiteUser actor, JsonObject packet)
        {
            JsonObject? person = packet["employee"] as JsonObject;
            string name = person?["name"]?.ToString() ?? "";
            if (string.Equals(actor.Id, packet["employeeId"]?.ToString(), StringComparison.OrdinalIgnoreCase) ||
                string.Equals(actor.Id, person?["eid"]?.ToString(), StringComparison.OrdinalIgnoreCase) ||
                string.Equals(actor.Username, name, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(actor.DisplayName, name, StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException("The candidate cannot assess their own promotion packet.");
        }

        private static JsonObject NormalizePromotionDigitalAssessment(JsonElement command, JsonObject packet, SuiteUser actor, string now)
        {
            if (!command.TryGetProperty("assessment", out JsonElement input) || input.ValueKind != JsonValueKind.Object ||
                input.GetRawText().Length > 160000)
                throw new InvalidDataException("A valid digital assessment is required.");
            string tier = packet["tier"]?.ToString() ?? "";
            int gateCount = tier == "T3-T4" ? 8 : tier == "T2-T3" ? 6 : tier == "T1-T2" ? 5 : 0;
            if (gateCount == 0) throw new InvalidDataException("Unknown promotion level.");
            var checklistIds = (packet["checklist"] as JsonArray)?.OfType<JsonObject>()
                .Select(x => x["id"]?.ToString() ?? "").Where(x => x.Length > 0).ToHashSet(StringComparer.Ordinal)
                ?? throw new InvalidDataException("The issued checklist is missing.");
            var scenarioIds = (packet["scenarios"] as JsonArray)?.OfType<JsonObject>()
                .Select(x => x["id"]?.ToString() ?? "").Where(x => x.Length > 0).ToHashSet(StringComparer.Ordinal)
                ?? throw new InvalidDataException("The issued scenarios are missing.");
            if (scenarioIds.Count != 6) throw new InvalidDataException("Six distinct issued scenarios are required.");
            var missingIds = (packet["trainingEvidence"] as JsonArray)?.OfType<JsonObject>()
                .Where(x => string.IsNullOrEmpty(x["signoffId"]?.ToString()))
                .Select(x => x["assignmentId"]?.ToString() ?? "").Where(x => x.Length > 0).ToHashSet(StringComparer.Ordinal)
                ?? new HashSet<string>(StringComparer.Ordinal);
            JsonObject output = new JsonObject { ["checklist"] = new JsonObject(), ["gates"] = new JsonObject(),
                ["scenarios"] = new JsonObject(), ["practicals"] = new JsonObject(), ["training"] = new JsonObject(),
                ["updatedAt"] = now, ["updatedBy"] = actor.Id };

            JsonElement Section(string key)
            {
                if (!input.TryGetProperty(key, out JsonElement section) || section.ValueKind != JsonValueKind.Object)
                    throw new InvalidDataException("Digital assessment section missing: " + key);
                return section;
            }
            foreach (JsonProperty row in Section("checklist").EnumerateObject())
            {
                if (!checklistIds.Contains(row.Name) || row.Value.ValueKind != JsonValueKind.Object)
                    throw new InvalidDataException("Unknown checklist entry.");
                string status = PacketText(row.Value, "status", 20);
                if (status != "" && status != "Verified" && status != "Gap" && status != "Not observed")
                    throw new InvalidDataException("Unknown checklist result.");
                ((JsonObject)output["checklist"]!)[row.Name] = new JsonObject {
                    ["status"] = status, ["evidence"] = PacketText(row.Value, "evidence", 1200) };
            }
            foreach (JsonProperty row in Section("gates").EnumerateObject())
            {
                if (!int.TryParse(row.Name, out int number) || number < 1 || number > gateCount ||
                    row.Name != number.ToString() || row.Value.ValueKind != JsonValueKind.Object)
                    throw new InvalidDataException("Unknown evidence gate.");
                string status = PacketText(row.Value, "status", 25);
                string method = PacketText(row.Value, "method", 20);
                string date = PacketText(row.Value, "date", 10);
                if (status != "" && status != "PASS" && status != "REMEDIATE" && status != "HOLD" && status != "NOT ELIGIBLE")
                    throw new InvalidDataException("Unknown gate result.");
                if (method != "" && method != "Records" && method != "Live" && method != "Simulated")
                    throw new InvalidDataException("Unknown evaluation method.");
                if (method == "Simulated" && !PromotionGateAllowsSimulation(tier, number))
                    throw new InvalidDataException("Signed eligibility, post and conduct records cannot be replaced by a simulation.");
                if (date.Length > 0 && (!DateTime.TryParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out DateTime parsed) || parsed.ToString("yyyy-MM-dd") != date))
                    throw new InvalidDataException("Gate date must be an ISO date.");
                ((JsonObject)output["gates"]!)[row.Name] = new JsonObject { ["status"] = status, ["method"] = method,
                    ["date"] = date, ["caseRef"] = PacketText(row.Value, "caseRef", 300),
                    ["evidence"] = PacketText(row.Value, "evidence", 2500) };
            }
            foreach (JsonProperty row in Section("scenarios").EnumerateObject())
            {
                if (!scenarioIds.Contains(row.Name) || row.Value.ValueKind != JsonValueKind.Object)
                    throw new InvalidDataException("Unknown or unissued scenario.");
                string grade = PacketText(row.Value, "grade", 20);
                if (grade != "" && grade != "MEETS" && grade != "COACHING" && grade != "REMEDIATE")
                    throw new InvalidDataException("Unknown oral scenario grade.");
                bool critical = row.Value.TryGetProperty("critical", out JsonElement flag) && flag.ValueKind == JsonValueKind.True;
                if (row.Value.TryGetProperty("critical", out flag) && flag.ValueKind != JsonValueKind.True && flag.ValueKind != JsonValueKind.False)
                    throw new InvalidDataException("Critical failure must be a checkbox value.");
                ((JsonObject)output["scenarios"]!)[row.Name] = new JsonObject { ["grade"] = grade,
                    ["response"] = PacketText(row.Value, "response", 2500),
                    ["followUp"] = PacketText(row.Value, "followUp", 1500), ["critical"] = critical };
            }
            var practicalIds = PromotionPracticalIds(tier);
            foreach (JsonProperty row in Section("practicals").EnumerateObject())
            {
                if (!practicalIds.Contains(row.Name) || row.Value.ValueKind != JsonValueKind.Object)
                    throw new InvalidDataException("Unknown promotion practical.");
                string method = PacketText(row.Value, "method", 20);
                string result = PacketText(row.Value, "result", 20);
                string date = PacketText(row.Value, "date", 10);
                if (method != "" && method != "Live" && method != "Simulated")
                    throw new InvalidDataException("Practical method must be Live or Simulated.");
                if (result != "" && result != "MEETS" && result != "COACHING" && result != "REMEDIATE")
                    throw new InvalidDataException("Unknown practical result.");
                if (date.Length > 0 && (!DateTime.TryParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out DateTime parsed) || parsed.ToString("yyyy-MM-dd") != date))
                    throw new InvalidDataException("Practical date must be an ISO date.");
                bool managerReviewed = row.Value.TryGetProperty("managerReviewed", out JsonElement reviewFlag) && reviewFlag.ValueKind == JsonValueKind.True;
                if (row.Value.TryGetProperty("managerReviewed", out reviewFlag) && reviewFlag.ValueKind != JsonValueKind.True && reviewFlag.ValueKind != JsonValueKind.False)
                    throw new InvalidDataException("Manager review must be a checkbox value.");
                ((JsonObject)output["practicals"]!)[row.Name] = new JsonObject { ["method"] = method,
                    ["result"] = result, ["date"] = date, ["shift"] = PacketText(row.Value, "shift", 80),
                    ["managerReviewed"] = managerReviewed, ["caseRef"] = PacketText(row.Value, "caseRef", 300),
                    ["evidence"] = PacketText(row.Value, "evidence", 1800) };
            }
            foreach (JsonProperty row in Section("training").EnumerateObject())
            {
                if (!missingIds.Contains(row.Name) || row.Value.ValueKind != JsonValueKind.Object)
                    throw new InvalidDataException("Unknown training gap.");
                bool resolved = row.Value.TryGetProperty("resolved", out JsonElement flag) && flag.ValueKind == JsonValueKind.True;
                if (row.Value.TryGetProperty("resolved", out flag) && flag.ValueKind != JsonValueKind.True && flag.ValueKind != JsonValueKind.False)
                    throw new InvalidDataException("Training resolution must be a checkbox value.");
                ((JsonObject)output["training"]!)[row.Name] = new JsonObject { ["resolved"] = resolved,
                    ["reference"] = PacketText(row.Value, "reference", 500) };
            }
            return output;
        }

        private static void ValidatePromotionDigitalCompletion(JsonObject packet, string recommendation)
        {
            JsonObject assessment = packet["digitalAssessment"] as JsonObject
                ?? throw new InvalidDataException("Save the digital assessment before submitting it.");
            JsonObject checklist = assessment["checklist"] as JsonObject ?? throw new InvalidDataException("Checklist evidence is missing.");
            foreach (JsonObject item in ((JsonArray)packet["checklist"]!).OfType<JsonObject>())
            {
                JsonObject? record = checklist[item["id"]?.ToString() ?? ""] as JsonObject;
                string status = record?["status"]?.ToString() ?? "";
                if (status == "" || (status == "Verified" && (record?["evidence"]?.ToString() ?? "").Length < 10))
                    throw new InvalidDataException("Complete each checklist result and cite verified evidence.");
                if (recommendation == "Recommend" && status != "Verified")
                    throw new InvalidDataException("Resolve all checklist gaps before recommending promotion.");
            }
            int gateCount = packet["tier"]?.ToString() == "T3-T4" ? 8 : packet["tier"]?.ToString() == "T2-T3" ? 6 : 5;
            JsonObject gates = assessment["gates"] as JsonObject ?? throw new InvalidDataException("Gate evidence is missing.");
            for (int i = 1; i <= gateCount; i++)
            {
                JsonObject? gate = gates[i.ToString()] as JsonObject;
                string status = gate?["status"]?.ToString() ?? "";
                string method = gate?["method"]?.ToString() ?? "";
                if (status == "" || method == "" || (gate?["date"]?.ToString() ?? "") == "" ||
                    (gate?["evidence"]?.ToString() ?? "").Length < 20 ||
                    (method != "Records" && (gate?["caseRef"]?.ToString() ?? "").Length < 3))
                    throw new InvalidDataException("Complete each gate's result, method, date and specific evidence.");
                if (recommendation == "Recommend" && status != "PASS")
                    throw new InvalidDataException("All gates must PASS before recommending promotion.");
            }
            JsonObject scenarios = assessment["scenarios"] as JsonObject ?? throw new InvalidDataException("Oral scenario records are missing.");
            foreach (JsonObject item in ((JsonArray)packet["scenarios"]!).OfType<JsonObject>())
            {
                JsonObject? response = scenarios[item["id"]?.ToString() ?? ""] as JsonObject;
                string grade = response?["grade"]?.ToString() ?? "";
                if (grade == "" || (response?["response"]?.ToString() ?? "").Length < 20 ||
                    (response?["followUp"]?.ToString() ?? "").Length < 10)
                    throw new InvalidDataException("Grade all six oral scenarios and document each response and follow-up.");
                if (recommendation == "Recommend" && (grade == "REMEDIATE" || response?["critical"]?.ToString() == "true"))
                    throw new InvalidDataException("Resolve scenario remediation and critical failures before recommending promotion.");
            }
            JsonObject practicals = assessment["practicals"] as JsonObject ?? throw new InvalidDataException("Practical evaluations are missing.");
            foreach (string id in PromotionPracticalIds(packet["tier"]?.ToString() ?? ""))
            {
                JsonObject? result = practicals[id] as JsonObject;
                if ((result?["method"]?.ToString() ?? "") == "" || (result?["date"]?.ToString() ?? "") == "" ||
                    (result?["caseRef"]?.ToString() ?? "").Length < 3 ||
                    (result?["evidence"]?.ToString() ?? "").Length < 20 || (result?["result"]?.ToString() ?? "") == "")
                    throw new InvalidDataException("Complete each live or simulated practical with a result, date, case and specific evidence.");
                if (recommendation == "Recommend" && result?["result"]?.ToString() == "REMEDIATE")
                    throw new InvalidDataException("Resolve practical remediation before recommending promotion.");
            }
            if (packet["tier"]?.ToString() == "T3-T4")
            {
                JsonObject first = (JsonObject)practicals["T4-BASE1"]!;
                JsonObject second = (JsonObject)practicals["T4-BASE2"]!;
                if (first["date"]?.ToString() == second["date"]?.ToString() &&
                    (string.IsNullOrWhiteSpace(first["shift"]?.ToString()) ||
                     string.Equals(first["shift"]?.ToString(), second["shift"]?.ToString(), StringComparison.OrdinalIgnoreCase)))
                    throw new InvalidDataException("T4 BASE practicals must occur on different dates or shifts.");
                if (recommendation == "Recommend" && first["managerReviewed"]?.ToString() != "true" &&
                    second["managerReviewed"]?.ToString() != "true")
                    throw new InvalidDataException("The Security Manager must conduct or directly review one T4 BASE practical.");
            }
            if (recommendation == "Recommend")
            {
                JsonObject training = assessment["training"] as JsonObject ?? new JsonObject();
                foreach (JsonObject item in ((packet["trainingEvidence"] as JsonArray) ?? new JsonArray()).OfType<JsonObject>()
                    .Where(x => string.IsNullOrEmpty(x["signoffId"]?.ToString())))
                {
                    JsonObject? resolution = training[item["assignmentId"]?.ToString() ?? ""] as JsonObject;
                    if (resolution?["resolved"]?.ToString() != "true" || (resolution?["reference"]?.ToString() ?? "").Length < 10)
                        throw new InvalidDataException("Resolve and cite each missing training record before recommending promotion.");
                }
            }
        }

        private static HashSet<string> PromotionPracticalIds(string tier)
        {
            string[] ids = tier switch
            {
                "T1-T2" => new[] { "T1-BASE", "T1-COACH" },
                "T2-T3" => new[] { "T2-REPORT1", "T2-REPORT2", "T2-REPORT3", "T2-INCIDENT", "T2-COACH" },
                "T3-T4" => new[] { "T4-BASE1", "T4-BASE2", "T4-COACH", "T4-LEAD1", "T4-LEAD2", "T4-LEAD3",
                    "T4-REPORT1", "T4-REPORT2", "T4-REPORT3", "T4-SHADOW1", "T4-SHADOW2", "T4-SHADOW3", "T4-FLAWED" },
                _ => throw new InvalidDataException("Unknown promotion level.")
            };
            return ids.ToHashSet(StringComparer.Ordinal);
        }

        private static bool PromotionGateAllowsSimulation(string tier, int gate) => tier switch
        {
            "T1-T2" => gate == 4 || gate == 5,
            "T2-T3" => gate == 5 || gate == 6,
            "T3-T4" => gate == 1 || gate == 4 || gate == 5 || gate == 6 || gate == 7,
            _ => false
        };
    }
}
