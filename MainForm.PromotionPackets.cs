using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private static string PacketText(JsonElement obj, string name, int max = 2000, bool required = false)
        {
            string value = obj.TryGetProperty(name, out JsonElement el) && el.ValueKind == JsonValueKind.String ? el.GetString()?.Trim() ?? "" : "";
            if (required && value.Length == 0) throw new InvalidDataException(name + " is required.");
            if (value.Length > max) throw new InvalidDataException(name + " exceeds the allowed length.");
            return value;
        }

        private static JsonObject PacketFind(JsonArray items, string id) =>
            items.OfType<JsonObject>().FirstOrDefault(x => x["id"]?.ToString() == id)
            ?? throw new InvalidDataException("Promotion packet was not found.");

        private object RunPromotionPacketCommand(JsonElement root)
        {
            if (!root.TryGetProperty("payload", out JsonElement command) || command.ValueKind != JsonValueKind.Object)
                throw new InvalidDataException("Promotion packet command is missing.");
            string action = PacketText(command, "action", 30, true);
            string capability = action switch
            {
                "issue" => "promotion.manage",
                "review" => "promotion.review",
                "decide" => "promotion.decide",
                _ => throw new InvalidDataException("Unknown promotion packet action.")
            };
            SuiteUser actor = RequireBridgeCapability(root, capability);
            string expectedRevision = PacketText(command, "expectedRevision", 200, true);
            ModuleLoadResult loaded = LoadModuleDataWithSource("promotion-packets");
            SchemaCompatibilityInfo schema = EvaluateSchemaCompatibility("promotion-packets", loaded.Data);
            if (!schema.WriteAllowed || loaded.Source == "fallback-storage-unavailable" || loaded.Source == "live-invalid")
                throw new InvalidOperationException("Promotion Packets is read-only: " + schema.Message);
            JsonObject data = JsonNode.Parse(loaded.Data) as JsonObject ?? throw new InvalidDataException("Promotion packet data is invalid.");
            JsonArray templates = data["templates"] as JsonArray ?? throw new InvalidDataException("Packet templates are missing.");
            JsonArray packets = data["packets"] as JsonArray ?? throw new InvalidDataException("Packets are missing.");
            JsonArray audit = data["audit"] as JsonArray ?? throw new InvalidDataException("Packet audit is missing.");
            string now = DateTime.UtcNow.ToString("o");
            string subject = "";
            if (action == "issue")
            {
                string employeeId = PacketText(command, "employeeId", 80, true);
                string tier = PacketText(command, "tier", 20, true);
                if (tier != "T1-T2" && tier != "T2-T3" && tier != "T3-T4")
                    throw new InvalidDataException("Unknown promotion level.");
                if (packets.OfType<JsonObject>().Any(x => x["employeeId"]?.ToString() == employeeId &&
                    x["tier"]?.ToString() == tier && (x["status"]?.ToString() == "Issued" || x["status"]?.ToString() == "Reviewed")))
                    throw new InvalidDataException("An open packet for this employee and level already exists. Reprint that packet.");
                JsonObject template = templates.OfType<JsonObject>().FirstOrDefault(x => x["tier"]?.ToString() == tier && x["active"]?.ToString() == "true")
                    ?? throw new InvalidDataException("Active packet template is unavailable.");
                JsonArray bank = template["scenarios"] as JsonArray ?? throw new InvalidDataException("Scenario bank is missing.");
                if (bank.Count < 6 || bank.OfType<JsonObject>().Select(x => x["id"]?.ToString()).Distinct().Count() != bank.Count)
                    throw new InvalidDataException("The scenario bank needs six distinct entries.");
                JsonArray checklist = template["checklist"] as JsonArray ?? throw new InvalidDataException("Checklist is missing.");
                JsonObject roster = JsonNode.Parse(LoadModuleDataWithSource("roster").Data) as JsonObject ?? throw new InvalidDataException("Roster is unavailable.");
                JsonObject employee = (roster["employees"] as JsonArray)?.OfType<JsonObject>().FirstOrDefault(x => x["id"]?.ToString() == employeeId)
                    ?? throw new InvalidDataException("Employee was not found in the roster.");
                if (employee["archived"]?.ToString() == "true") throw new InvalidDataException("An archived employee cannot receive a packet.");
                JsonArray chosen = new JsonArray();
                JsonNode?[] available = bank.Select(x => x?.DeepClone()).ToArray();
                for (int i = 0; i < 6; i++)
                {
                    int pick = RandomNumberGenerator.GetInt32(i, available.Length);
                    (available[i], available[pick]) = (available[pick], available[i]);
                    chosen.Add(available[i]);
                }
                JsonArray evidence = new JsonArray();
                ModuleLoadResult trainingLoaded = LoadModuleDataWithSource("training");
                JsonObject trainingData = JsonNode.Parse(trainingLoaded.Data) as JsonObject ?? throw new InvalidDataException("Training data is unavailable.");
                JsonArray trainingAssignments = trainingData["assignments"] as JsonArray ?? throw new InvalidDataException("Training assignments are missing.");
                JsonArray requirements = trainingData["requirements"] as JsonArray ?? throw new InvalidDataException("Training requirements are missing.");
                foreach (JsonObject assignment in trainingAssignments.OfType<JsonObject>().Where(x => x["employeeId"]?.ToString() == employeeId && x["status"]?.ToString() == "active"))
                {
                    string requirementId = assignment["requirementId"]?.ToString() ?? "";
                    string title = requirements.OfType<JsonObject>().FirstOrDefault(x => x["id"]?.ToString() == requirementId)?["title"]?.ToString() ?? requirementId;
                    JsonObject[] events = (assignment["events"] as JsonArray)?.OfType<JsonObject>().ToArray() ?? Array.Empty<JsonObject>();
                    JsonObject? sign = events.LastOrDefault(x => x["type"]?.ToString() == "signoff" &&
                        !events.Any(v => v["type"]?.ToString() == "void" && v["reference"]?.ToString() == x["id"]?.ToString()));
                    int signedIndex = sign == null ? -1 : Array.IndexOf(events, sign);
                    if (signedIndex >= 0 && events.Skip(signedIndex + 1).Any(x => x["type"]?.ToString() == "retrain" ||
                        x["type"]?.ToString() == "record")) sign = null;
                    evidence.Add(new JsonObject { ["assignmentId"] = assignment["id"]?.ToString(), ["requirement"] = title,
                        ["signoffId"] = sign?["id"]?.ToString() ?? "", ["signoffDate"] = sign?["date"]?.ToString() ?? "" });
                }
                subject = Guid.NewGuid().ToString("N");
                packets.Add(new JsonObject
                {
                    ["id"] = subject, ["employeeId"] = employeeId,
                    ["employee"] = new JsonObject { ["name"] = ((employee["first"]?.ToString() ?? "") + " " + (employee["last"]?.ToString() ?? "")).Trim(),
                        ["eid"] = employee["eid"]?.ToString() ?? "", ["rank"] = employee["rank"]?.ToString() ?? "", ["shift"] = employee["shift"]?.ToString() ?? "" },
                    ["tier"] = tier, ["templateRevision"] = template["revision"]?.DeepClone(),
                    ["checklist"] = checklist.DeepClone(), ["scenarios"] = chosen,
                    ["trainingEvidence"] = evidence, ["trainingRevision"] = trainingLoaded.Revision,
                    ["status"] = "Issued", ["issuedAt"] = now, ["issuedBy"] = actor.Id, ["history"] = new JsonArray()
                });
            }
            else
            {
                JsonObject packet = PacketFind(packets, PacketText(command, "packetId", 80, true));
                subject = packet["id"]?.ToString() ?? "";
                JsonObject? person = packet["employee"] as JsonObject;
                string name = person?["name"]?.ToString() ?? "";
                if (string.Equals(actor.Id, packet["employeeId"]?.ToString(), StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(actor.Id, person?["eid"]?.ToString(), StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(actor.Username, name, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(actor.DisplayName, name, StringComparison.OrdinalIgnoreCase))
                    throw new UnauthorizedAccessException("The candidate cannot review or decide their own packet.");
                JsonArray history = packet["history"] as JsonArray ?? throw new InvalidDataException("Packet history is invalid.");
                string reference = PacketText(command, "reference", 300, true);
                string notes = PacketText(command, "notes", 2000, true);
                if (action == "review")
                {
                    if (packet["status"]?.ToString() != "Issued") throw new InvalidOperationException("Only an issued packet can be reviewed.");
                    string recommendation = PacketText(command, "recommendation", 25, true);
                    if (recommendation != "Recommend" && recommendation != "Return for development")
                        throw new InvalidDataException("Unknown supervisor recommendation.");
                    packet["status"] = "Reviewed";
                    packet["review"] = new JsonObject { ["recommendation"] = recommendation, ["notes"] = notes,
                        ["paperReference"] = reference, ["reviewedAt"] = now, ["reviewedBy"] = actor.Id, ["reviewerName"] = actor.DisplayName };
                    history.Add(new JsonObject { ["action"] = "review", ["at"] = now, ["actorId"] = actor.Id,
                        ["recommendation"] = recommendation, ["notes"] = notes, ["paperReference"] = reference });
                }
                else
                {
                    if (packet["status"]?.ToString() != "Reviewed") throw new InvalidOperationException("A supervisor review is required before decision.");
                    if (!string.Equals(actor.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                        throw new UnauthorizedAccessException("Only the Security Manager/Admin can decide a promotion packet.");
                    string decision = PacketText(command, "decision", 25, true);
                    if (decision != "Recommend promotion" && decision != "Defer" && decision != "Decline")
                        throw new InvalidDataException("Unknown manager decision.");
                    packet["status"] = "Decided";
                    packet["decision"] = new JsonObject { ["result"] = decision, ["notes"] = notes,
                        ["paperReference"] = reference, ["decidedAt"] = now, ["decidedBy"] = actor.Id, ["managerName"] = actor.DisplayName };
                    history.Add(new JsonObject { ["action"] = "decide", ["at"] = now, ["actorId"] = actor.Id,
                        ["result"] = decision, ["notes"] = notes, ["paperReference"] = reference });
                }
            }
            audit.Add(new JsonObject { ["at"] = now, ["action"] = action, ["actorId"] = actor.Id, ["packetId"] = subject });
            data["schemaVersion"] = "promotion-packets-1";
            data["lastWrittenByAppVersion"] = AppVersion;
            data["lastSaved"] = now;
            object saved = SaveModuleData("promotion-packets", data.ToJsonString(JsonOptions), expectedRevision);
            return new { save = saved, data = data.ToJsonString(JsonOptions), packetId = subject };
        }
    }
}
