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
        // Upgrade the packaged checklist while preserving manager-edited scenario banks
        // and every previously issued packet's frozen assessment.
        private void UpgradePromotionPacketChecklists()
        {
            ModuleLoadResult loaded = LoadModuleDataWithSource("promotion-packets");
            if (loaded.Source != "live-shared" && loaded.Source != "packaged-recovery-created")
                throw new InvalidOperationException("Live Promotion Packets data is unavailable.");
            if (!EvaluateSchemaCompatibility("promotion-packets", loaded.Data).WriteAllowed)
                throw new InvalidOperationException("Promotion Packets schema is not writable.");
            JsonObject data = JsonNode.Parse(loaded.Data) as JsonObject ?? throw new InvalidDataException("Promotion Packets data is invalid.");
            JsonObject seed = JsonNode.Parse(File.ReadAllText(Path.Combine(appFolder, "seed", "promotion-packets-data.json"))) as JsonObject
                ?? throw new InvalidDataException("Packaged Promotion Packets checklists are invalid.");
            JsonArray templates = data["templates"] as JsonArray ?? throw new InvalidDataException("Promotion templates are missing.");
            JsonArray seedTemplates = seed["templates"] as JsonArray ?? throw new InvalidDataException("Packaged promotion templates are missing.");
            JsonArray audit = data["audit"] as JsonArray ?? throw new InvalidDataException("Promotion audit is missing.");
            int changed = 0;
            string now = DateTime.UtcNow.ToString("o");
            foreach (JsonObject template in templates.OfType<JsonObject>())
            {
                string tier = template["tier"]?.ToString() ?? "";
                JsonObject packaged = seedTemplates.OfType<JsonObject>().FirstOrDefault(x => x["tier"]?.ToString() == tier)
                    ?? throw new InvalidDataException("Packaged checklist missing for " + tier);
                JsonArray current = template["checklist"] as JsonArray ?? throw new InvalidDataException("Live checklist missing for " + tier);
                JsonArray replacement = packaged["checklist"] as JsonArray ?? throw new InvalidDataException("Packaged checklist invalid for " + tier);
                if (current.Count == replacement.Count && current.ToJsonString() == replacement.ToJsonString()) continue;
                int oldCount = tier == "T1-T2" ? 8 : tier == "T2-T3" ? 10 : tier == "T3-T4" ? 12 : -1;
                if (current.Count != oldCount || !current.OfType<JsonObject>().Select((x, i) =>
                    x["id"]?.ToString() == tier + "-C" + (i + 1).ToString("D2")).All(x => x))
                    throw new InvalidDataException("Checklist was customized for " + tier + "; Manager review is required before replacing it.");
                int previousRevision = int.TryParse(template["revision"]?.ToString(), out int n) ? n : 1;
                JsonArray versions = template["previousVersions"] as JsonArray ?? new JsonArray();
                if (template["previousVersions"] == null) template["previousVersions"] = versions;
                versions.Add(new JsonObject { ["revision"] = previousRevision, ["checklist"] = current.DeepClone(),
                    ["scenarios"] = template["scenarios"]?.DeepClone(), ["replacedAt"] = now,
                    ["replacedBy"] = "system-upgrade-v5.0.1" });
                template["checklist"] = replacement.DeepClone();
                template["revision"] = previousRevision + 1;
                changed++;
            }
            // Import the controlled draft T3→T4 question prompts only into an unmodified legacy bank.
            // Preserve older questions for issued packets and manager-customized banks.
            JsonObject? leadTemplate = templates.OfType<JsonObject>().FirstOrDefault(x => x["tier"]?.ToString() == "T3-T4");
            JsonObject? leadSeed = seedTemplates.OfType<JsonObject>().FirstOrDefault(x => x["tier"]?.ToString() == "T3-T4");
            if (leadTemplate != null && leadSeed != null)
            {
                JsonArray? priorBank = leadTemplate["scenarios"] as JsonArray;
                int revision = int.TryParse(leadTemplate["revision"]?.ToString(), out int parsed) ? parsed : 1;
                bool stockBank = priorBank?.Count == 24 && revision <= 3
                    && priorBank.OfType<JsonObject>().Select((x, i) =>
                        x["id"]?.ToString() == "T3-T4-S" + (i + 1).ToString("D2")).All(x => x);
                if (stockBank)
                {
                    JsonArray versions = leadTemplate["previousVersions"] as JsonArray ?? new JsonArray();
                    if (leadTemplate["previousVersions"] == null) leadTemplate["previousVersions"] = versions;
                    versions.Add(new JsonObject { ["revision"] = revision,
                        ["scenarios"] = priorBank!.DeepClone(), ["checklist"] = leadTemplate["checklist"]?.DeepClone(),
                        ["replacedAt"] = now, ["replacedBy"] = "system-upgrade-v5.0.2" });
                    leadTemplate["scenarios"] = leadSeed["scenarios"]?.DeepClone();
                    leadTemplate["revision"] = Math.Max(revision + 1, 5);
                    changed++;
                }
            }
            // Enrich an unmodified v5.0.2 T4 bank with the eight original conduct prompts.
            // Previously issued six-question packets remain frozen.
            if (leadTemplate != null && leadSeed != null)
            {
                JsonArray? bank = leadTemplate["scenarios"] as JsonArray;
                int revision = int.TryParse(leadTemplate["revision"]?.ToString(), out int parsedT4) ? parsedT4 : 1;
                bool stockSeventeen = bank?.Count == 17 && revision == 4 &&
                    bank.OfType<JsonObject>().Select((x, i) => x["id"]?.ToString() ==
                        (i < 10 ? "L-" + (i + 1).ToString("D2") : "E-" + (i - 9).ToString("D2"))).All(x => x);
                if (stockSeventeen)
                {
                    JsonArray versions = leadTemplate["previousVersions"] as JsonArray ?? new JsonArray();
                    if (leadTemplate["previousVersions"] == null) leadTemplate["previousVersions"] = versions;
                    versions.Add(new JsonObject { ["revision"] = revision, ["scenarios"] = bank!.DeepClone(),
                        ["checklist"] = leadTemplate["checklist"]?.DeepClone(), ["replacedAt"] = now,
                        ["replacedBy"] = "system-upgrade-v5.0.3" });
                    leadTemplate["scenarios"] = leadSeed["scenarios"]?.DeepClone();
                    leadTemplate["revision"] = revision + 1;
                    changed++;
                }
            }
            // Upgrade only stock lower-tier scenario banks. Manager-edited banks remain untouched.
            foreach (string tier in new[] { "T1-T2", "T2-T3" })
            {
                JsonObject? template = templates.OfType<JsonObject>().FirstOrDefault(x => x["tier"]?.ToString() == tier);
                JsonObject? packaged = seedTemplates.OfType<JsonObject>().FirstOrDefault(x => x["tier"]?.ToString() == tier);
                if (template == null || packaged == null) continue;
                JsonArray? bank = template["scenarios"] as JsonArray;
                int revision = int.TryParse(template["revision"]?.ToString(), out int parsedRevision) ? parsedRevision : 1;
                int stockCount = tier == "T1-T2" ? 10 : 18;
                if (bank?.Count != stockCount || revision > 3 ||
                    !bank.OfType<JsonObject>().Select((x, i) =>
                        x["id"]?.ToString() == tier + "-S" + (i + 1).ToString("D2")).All(x => x)) continue;
                JsonArray versions = template["previousVersions"] as JsonArray ?? new JsonArray();
                if (template["previousVersions"] == null) template["previousVersions"] = versions;
                versions.Add(new JsonObject { ["revision"] = revision, ["scenarios"] = bank.DeepClone(),
                    ["checklist"] = template["checklist"]?.DeepClone(), ["replacedAt"] = now,
                    ["replacedBy"] = "system-upgrade-v5.0.3" });
                template["scenarios"] = packaged["scenarios"]?.DeepClone();
                template["revision"] = Math.Max(revision + 1, 4);
                changed++;
            }
            if (changed == 0) return;
            audit.Add(new JsonObject { ["at"] = now, ["action"] = "upgrade-checklists",
                ["actorId"] = "system-upgrade-v5.0.1", ["templateCount"] = changed });
            data["lastWrittenByAppVersion"] = AppVersion;
            data["lastSaved"] = now;
            SaveModuleData("promotion-packets", data.ToJsonString(JsonOptions), loaded.Revision);
        }

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
                "issue" or "scenario" or "delete" or "restore" or "import" => "promotion.manage",
                "review" or "assessment" => "promotion.review",
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
            if (action == "scenario")
            {
                string tier = PacketText(command, "tier", 20, true);
                JsonObject template = templates.OfType<JsonObject>().FirstOrDefault(x => x["tier"]?.ToString() == tier && x["active"]?.ToString() == "true")
                    ?? throw new InvalidDataException("Active packet template is unavailable.");
                JsonArray bank = template["scenarios"] as JsonArray ?? throw new InvalidDataException("Scenario bank is missing.");
                string scenarioId = PacketText(command, "scenarioId", 80);
                string prompt = PacketText(command, "prompt", 1200, true);
                string title = PacketText(command, "title", 120);
                string category = PacketText(command, "category", 30, true);
                string focus = tier == "T3-T4" ? PacketText(command, "focus", 30, true) : "";
                string inject = tier != "T3-T4" ? PacketText(command, "inject", 900) : "";
                if (tier == "T3-T4" && (category != "leadership" && category != "emergency" ||
                    (category == "leadership" && focus != "access" && focus != "personnel" && focus != "safety" && focus != "priorities" && focus != "hazard" && focus != "fire" && focus != "evacuation" && focus != "injury") ||
                    (category == "emergency" && focus != "medicalFire" && focus != "hazardEvac" && focus != "compound")))
                    throw new InvalidDataException("Select a valid leadership or emergency scenario focus.");
                if ((tier == "T1-T2" && category != "gate" && category != "patrol" && category != "base" && category != "professional") ||
                    (tier == "T2-T3" && category != "gate" && category != "patrol" && category != "base" && category != "incident"))
                    throw new InvalidDataException("Select an eligible scenario category for this promotion level.");
                bool active = !command.TryGetProperty("active", out JsonElement activeValue) || activeValue.ValueKind != JsonValueKind.False;
                JsonObject? scenario = scenarioId.Length > 0
                    ? bank.OfType<JsonObject>().FirstOrDefault(x => x["id"]?.ToString() == scenarioId)
                    : null;
                if (scenarioId.Length > 0 && scenario == null) throw new InvalidDataException("Scenario was not found.");
                int currentRevision = int.TryParse(template["revision"]?.ToString(), out int parsedRevision) ? parsedRevision : 1;
                JsonArray history = template["previousVersions"] as JsonArray ?? new JsonArray();
                if (template["previousVersions"] == null) template["previousVersions"] = history;
                history.Add(new JsonObject { ["revision"] = currentRevision, ["scenarios"] = bank.DeepClone(),
                    ["checklist"] = template["checklist"]?.DeepClone(), ["replacedAt"] = now, ["replacedBy"] = actor.Id });
                if (scenario == null)
                {
                    if (!active) throw new InvalidDataException("A new scenario must start active.");
                    scenarioId = Guid.NewGuid().ToString("N");
                    bank.Add(new JsonObject { ["id"] = scenarioId, ["prompt"] = prompt, ["title"] = title, ["category"] = category, ["focus"] = focus, ["inject"] = inject, ["active"] = true });
                }
                else
                {
                    scenario["prompt"] = prompt;
                    scenario["title"] = title;
                    scenario["category"] = category;
                    if (tier == "T3-T4") scenario["focus"] = focus;
                    else scenario["inject"] = inject;
                    scenario["active"] = active;
                }
                if (bank.OfType<JsonObject>().Count(x => x["active"]?.ToString() != "false") < 6)
                    throw new InvalidDataException("A bank must retain at least six active scenarios.");
                JsonObject[] activeScenarios = bank.OfType<JsonObject>()
                    .Where(x => x["active"]?.ToString() != "false").ToArray();
                if (tier != "T3-T4" && activeScenarios.All(x => !string.IsNullOrEmpty(x["category"]?.ToString())))
                {
                    string fourth = tier == "T1-T2" ? "professional" : "incident";
                    if (activeScenarios.Count(x => x["category"]?.ToString() == "gate") < 2 ||
                        activeScenarios.Count(x => x["category"]?.ToString() == "patrol") < 2 ||
                        activeScenarios.Count(x => x["category"]?.ToString() == "base") < 1 ||
                        activeScenarios.Count(x => x["category"]?.ToString() == fourth) < 1)
                        throw new InvalidDataException("Keep two Gate, two Patrol, one Base, and one " + fourth + " active scenario.");
                }
                template["revision"] = currentRevision + 1;
                subject = scenarioId;
            }
            else if (action == "issue")
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
                JsonNode?[] activeBank = bank.OfType<JsonObject>().Where(x => x["active"]?.ToString() != "false")
                    .Select(x => (JsonNode?)x).ToArray();
                if (activeBank.Length < 6 || bank.OfType<JsonObject>().Select(x => x["id"]?.ToString()).Distinct().Count() != bank.Count)
                    throw new InvalidDataException("The scenario bank needs six active, distinct entries.");
                JsonArray checklist = template["checklist"] as JsonArray ?? throw new InvalidDataException("Checklist is missing.");
                JsonObject roster = JsonNode.Parse(LoadModuleDataWithSource("roster").Data) as JsonObject ?? throw new InvalidDataException("Roster is unavailable.");
                JsonObject employee = (roster["employees"] as JsonArray)?.OfType<JsonObject>().FirstOrDefault(x => x["id"]?.ToString() == employeeId)
                    ?? throw new InvalidDataException("Employee was not found in the roster.");
                if (employee["archived"]?.ToString() == "true") throw new InvalidDataException("An archived employee cannot receive a packet.");
                JsonArray chosen = new JsonArray();
                if (tier == "T3-T4" && activeBank.All(x => x?["category"] != null && x?["category"]?.ToString() != ""))
                {
                    var selectedIds = new System.Collections.Generic.HashSet<string>(StringComparer.Ordinal);
                    void Draw(string category, string focus)
                    {
                        JsonNode?[] eligible = activeBank.Where(x => x?["category"]?.ToString() == category &&
                            (focus.Length == 0 || x?["focus"]?.ToString() == focus) &&
                            !selectedIds.Contains(x?["id"]?.ToString() ?? "")).ToArray();
                        if (eligible.Length == 0) throw new InvalidDataException("T4 bank needs access and personnel leadership plus medical/fire, hazard/evacuation, and compound emergency scenarios.");
                        JsonNode selected = eligible[RandomNumberGenerator.GetInt32(eligible.Length)]!;
                        selectedIds.Add(selected["id"]?.ToString() ?? "");
                        chosen.Add(selected.DeepClone());
                    }
                    Draw("leadership", "access"); Draw("leadership", "personnel"); Draw("leadership", "");
                    Draw("emergency", "medicalFire"); Draw("emergency", "hazardEvac"); Draw("emergency", "compound");
                }
                else if (tier != "T3-T4" && activeBank.All(x => x?["category"] != null && x?["category"]?.ToString() != ""))
                {
                    var chosenIds = new System.Collections.Generic.HashSet<string>(StringComparer.Ordinal);
                    void DrawTier(string category, int count)
                    {
                        for (int n = 0; n < count; n++)
                        {
                            JsonNode?[] candidates = activeBank.Where(x => x?["category"]?.ToString() == category &&
                                !chosenIds.Contains(x?["id"]?.ToString() ?? "")).ToArray();
                            if (candidates.Length == 0)
                                throw new InvalidDataException("Scenario bank lacks the required " + category + " coverage for " + tier + ".");
                            JsonNode selected = candidates[RandomNumberGenerator.GetInt32(candidates.Length)]!;
                            chosenIds.Add(selected["id"]?.ToString() ?? "");
                            chosen.Add(selected.DeepClone());
                        }
                    }
                    DrawTier("gate", 2); DrawTier("patrol", 2); DrawTier("base", 1);
                    DrawTier(tier == "T1-T2" ? "professional" : "incident", 1);
                }
                else
                {
                    JsonNode?[] available = activeBank.Select(x => x?.DeepClone()).ToArray();
                    for (int i = 0; i < 6; i++)
                    {
                        int pick = RandomNumberGenerator.GetInt32(i, available.Length);
                        (available[i], available[pick]) = (available[pick], available[i]);
                        chosen.Add(available[i]);
                    }
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
            else if (action == "assessment")
            {
                JsonObject packet = PacketFind(packets, PacketText(command, "packetId", 80, true));
                subject = packet["id"]?.ToString() ?? "";
                AssertPromotionEvaluatorIsNotCandidate(actor, packet);
                if (packet["status"]?.ToString() != "Issued")
                    throw new InvalidOperationException("Only an issued packet can be edited.");
                packet["digitalAssessment"] = NormalizePromotionDigitalAssessment(command, packet, actor, now);
                JsonArray history = packet["history"] as JsonArray ?? throw new InvalidDataException("Packet history is invalid.");
                history.Add(new JsonObject { ["action"] = "assessment", ["at"] = now, ["actorId"] = actor.Id });
            }
            else if (action == "import")
            {
                JsonObject packet = PacketFind(packets, PacketText(command, "packetId", 80, true));
                subject = packet["id"]?.ToString() ?? "";
                AssertPromotionEvaluatorIsNotCandidate(actor, packet);
                if (!string.Equals(actor.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                    throw new UnauthorizedAccessException("Only the Security Manager/Admin can import a supervisor evaluation.");
                if (packet["status"]?.ToString() != "Issued")
                    throw new InvalidOperationException("Only an issued packet can receive a supervisor evaluation.");
                if (!command.TryGetProperty("evaluation", out JsonElement evaluation) || evaluation.ValueKind != JsonValueKind.Object ||
                    evaluation.GetRawText().Length > 180000 || PacketText(evaluation, "format", 50, true) != "PWADC-promotion-evaluation-1" ||
                    !evaluation.TryGetProperty("completed", out JsonElement completed) || completed.ValueKind != JsonValueKind.True ||
                    PacketText(evaluation, "packetId", 80, true) != subject ||
                    PacketText(evaluation, "tier", 20, true) != packet["tier"]?.ToString() ||
                    PacketText(evaluation, "issuedAt", 50, true) != packet["issuedAt"]?.ToString())
                    throw new InvalidDataException("Returned evaluation does not match this issued packet.");
                void RequireIssuedIds(string field, string packetField)
                {
                    if (!evaluation.TryGetProperty(field, out JsonElement ids) || ids.ValueKind != JsonValueKind.Array ||
                        !ids.EnumerateArray().Select(x => x.ValueKind == JsonValueKind.String ? x.GetString() : null)
                            .SequenceEqual(((JsonArray)packet[packetField]!).OfType<JsonObject>().Select(x => x["id"]?.ToString())))
                        throw new InvalidDataException("Returned evaluation has different issued " + packetField + ".");
                }
                RequireIssuedIds("checklistIds", "checklist");
                RequireIssuedIds("scenarioIds", "scenarios");
                string evaluatorName = PacketText(evaluation, "evaluatorName", 120, true);
                if (evaluatorName.Length < 3) throw new InvalidDataException("Supervisor name is required.");
                if (string.Equals(evaluatorName, packet["employee"]?["name"]?.ToString(), StringComparison.OrdinalIgnoreCase))
                    throw new UnauthorizedAccessException("The candidate cannot assess their own promotion packet.");
                string recommendation = PacketText(evaluation, "recommendation", 25, true);
                if (recommendation != "Recommend" && recommendation != "Return for development")
                    throw new InvalidDataException("Unknown supervisor recommendation.");
                string notes = PacketText(evaluation, "notes", 2000, true);
                if (notes.Length < 20) throw new InvalidDataException("Supervisor assessment requires specific notes.");
                string submittedAt = PacketText(evaluation, "submittedAt", 50, true);
                if (!DateTimeOffset.TryParse(submittedAt, out _))
                    throw new InvalidDataException("Supervisor submission timestamp is invalid.");
                packet["digitalAssessment"] = NormalizePromotionDigitalAssessment(evaluation, packet, actor, now);
                ValidatePromotionDigitalCompletion(packet, recommendation);
                packet["status"] = "Reviewed";
                packet["review"] = new JsonObject { ["recommendation"] = recommendation, ["notes"] = notes,
                    ["paperReference"] = "Offline evaluation " + subject, ["mode"] = "digital",
                    ["reviewedAt"] = now, ["reviewedBy"] = actor.Id, ["reviewerName"] = evaluatorName,
                    ["offlineSubmittedAt"] = submittedAt, ["importedBy"] = actor.Id, ["source"] = "offline-html" };
                JsonArray history = packet["history"] as JsonArray ?? throw new InvalidDataException("Packet history is invalid.");
                history.Add(new JsonObject { ["action"] = "import", ["at"] = now, ["actorId"] = actor.Id,
                    ["evaluatorName"] = evaluatorName, ["recommendation"] = recommendation });
            }
            else
            {
                JsonObject packet = PacketFind(packets, PacketText(command, "packetId", 80, true));
                subject = packet["id"]?.ToString() ?? "";
                AssertPromotionEvaluatorIsNotCandidate(actor, packet);
                JsonArray history = packet["history"] as JsonArray ?? throw new InvalidDataException("Packet history is invalid.");
                if (action == "delete" || action == "restore")
                {
                    if (!string.Equals(actor.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                        throw new UnauthorizedAccessException("Only the Security Manager/Admin may delete or restore a promotion packet.");
                    string reason = PacketText(command, "notes", 2000, true);
                    if (reason.Length < 10) throw new InvalidDataException("Enter a reason of at least 10 characters.");
                    if (action == "delete")
                    {
                        if (packet["status"]?.ToString() == "Deleted") throw new InvalidOperationException("This packet is already deleted.");
                        packet["deletedPreviousStatus"] = packet["status"]?.ToString() ?? "Issued";
                        packet["status"] = "Deleted"; packet["deletedAt"] = now; packet["deletedBy"] = actor.Id;
                    }
                    else
                    {
                        if (packet["status"]?.ToString() != "Deleted") throw new InvalidOperationException("Only a deleted packet can be restored.");
                        string previous = packet["deletedPreviousStatus"]?.ToString() ?? "Issued";
                        if ((previous == "Issued" || previous == "Reviewed") && packets.OfType<JsonObject>().Any(x =>
                            !ReferenceEquals(x, packet) && x["employeeId"]?.ToString() == packet["employeeId"]?.ToString() &&
                            x["tier"]?.ToString() == packet["tier"]?.ToString() &&
                            (x["status"]?.ToString() == "Issued" || x["status"]?.ToString() == "Reviewed")))
                            throw new InvalidOperationException("A replacement open packet exists for this employee and level.");
                        packet["status"] = previous;
                        packet.Remove("deletedPreviousStatus"); packet.Remove("deletedAt"); packet.Remove("deletedBy");
                    }
                    history.Add(new JsonObject { ["action"] = action, ["at"] = now, ["actorId"] = actor.Id, ["notes"] = reason });
                }
                else
                {
                string mode = action == "review" ? PacketText(command, "mode", 20) : "";
                if (mode != "" && mode != "digital") throw new InvalidDataException("Unknown packet review mode.");
                string reference = mode == "digital" ? "Digital packet " + subject : PacketText(command, "reference", 300, true);
                string notes = PacketText(command, "notes", 2000, true);
                if (action == "review")
                {
                    if (packet["status"]?.ToString() != "Issued") throw new InvalidOperationException("Only an issued packet can be reviewed.");
                    string recommendation = PacketText(command, "recommendation", 25, true);
                    if (recommendation != "Recommend" && recommendation != "Return for development")
                        throw new InvalidDataException("Unknown supervisor recommendation.");
                    if (mode == "digital") ValidatePromotionDigitalCompletion(packet, recommendation);
                    packet["status"] = "Reviewed";
                    packet["review"] = new JsonObject { ["recommendation"] = recommendation, ["notes"] = notes,
                        ["paperReference"] = reference, ["mode"] = mode == "digital" ? "digital" : "paper",
                        ["reviewedAt"] = now, ["reviewedBy"] = actor.Id, ["reviewerName"] = actor.DisplayName };
                    history.Add(new JsonObject { ["action"] = "review", ["at"] = now, ["actorId"] = actor.Id,
                        ["recommendation"] = recommendation, ["notes"] = notes, ["paperReference"] = reference });
                }
                else
                {
                    if (packet["status"]?.ToString() != "Reviewed") throw new InvalidOperationException("A supervisor review is required before decision.");
                    if (!string.Equals(actor.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                        throw new UnauthorizedAccessException("Only the Security Manager/Admin can decide a promotion packet.");
                    string decision = PacketText(command, "decision", 25, true);
                    if (decision != "Approve promotion" && decision != "Defer" && decision != "Decline")
                        throw new InvalidDataException("Unknown manager decision.");
                    string interviewDate = PacketText(command, "interviewDate", 10);
                    string interviewOutcome = PacketText(command, "interviewOutcome", 30);
                    string interviewNotes = PacketText(command, "interviewNotes", 2000);
                    if (interviewDate.Length > 0 && (interviewDate.Length != 10 ||
                        !DateTime.TryParseExact(interviewDate, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
                            System.Globalization.DateTimeStyles.None, out DateTime parsedInterviewDate) ||
                        parsedInterviewDate.ToString("yyyy-MM-dd") != interviewDate))
                        throw new InvalidDataException("Interview date must be an ISO date.");
                    if (interviewOutcome.Length > 0 && interviewOutcome != "Meets standard" && interviewOutcome != "Needs development")
                        throw new InvalidDataException("Unknown interview outcome.");
                    bool recordsVerified = command.TryGetProperty("recordsVerified", out JsonElement recordsValue) && recordsValue.ValueKind == JsonValueKind.True;
                    bool checklistReviewed = command.TryGetProperty("checklistReviewed", out JsonElement checklistValue) && checklistValue.ValueKind == JsonValueKind.True;
                    bool scenariosReviewed = command.TryGetProperty("scenariosReviewed", out JsonElement scenariosValue) && scenariosValue.ValueKind == JsonValueKind.True;
                    JsonObject gateStatuses = new JsonObject();
                    string level = packet["tier"]?.ToString() ?? "";
                    int gateCount = level == "T3-T4" ? 8 : level == "T2-T3" ? 6 : level == "T1-T2" ? 5 : 0;
                    if (gateCount == 0) throw new InvalidDataException("Unknown packet level.");
                    if (command.TryGetProperty("gateStatuses", out JsonElement gates) && gates.ValueKind == JsonValueKind.Object)
                        for (int gate = 1; gate <= gateCount; gate++)
                        {
                            string key = "Gate " + gate;
                            string status = gates.TryGetProperty(key, out JsonElement value) && value.ValueKind == JsonValueKind.String
                                ? value.GetString() ?? "" : "";
                            if (status != "" && status != "PASS" && status != "REMEDIATE" && status != "HOLD" && status != "NOT ELIGIBLE")
                                throw new InvalidDataException("Unknown status for " + key + ".");
                            gateStatuses[key] = status;
                        }
                    if (decision == "Approve promotion" && Enumerable.Range(1, gateCount).Any(g =>
                        gateStatuses["Gate " + g]?.ToString() != "PASS"))
                        throw new InvalidDataException(level == "T3-T4"
                            ? "All eight T4 evidence gates must be recorded PASS before approval."
                            : "All evidence gates must be recorded PASS before promotion approval.");
                    if (decision == "Approve promotion" && (!recordsVerified || !checklistReviewed || !scenariosReviewed))
                        throw new InvalidDataException("Confirm signed qualifications, the completed checklist, and all six verbal scenario evaluations before approval.");
                    if (decision == "Approve promotion" && packet["review"]?["mode"]?.ToString() == "digital")
                    {
                        ValidatePromotionDigitalCompletion(packet, "Recommend");
                        if (packet["review"]?["recommendation"]?.ToString() != "Recommend")
                            throw new InvalidDataException("A digital promotion approval requires a supervisor recommendation to promote.");
                    }
                    if (packet["tier"]?.ToString() == "T3-T4" && decision == "Approve promotion" &&
                        (interviewDate.Length == 0 || interviewOutcome != "Meets standard" || interviewNotes.Length < 20))
                        throw new InvalidDataException("T4 approval requires a dated Security Manager interview rated Meets standard with a documented assessment.");
                    packet["status"] = "Decided";
                    packet["decision"] = new JsonObject { ["result"] = decision, ["notes"] = notes,
                        ["paperReference"] = reference, ["decidedAt"] = now, ["decidedBy"] = actor.Id, ["managerName"] = actor.DisplayName,
                        ["interviewDate"] = interviewDate, ["interviewOutcome"] = interviewOutcome, ["interviewNotes"] = interviewNotes,
                        ["recordsVerified"] = recordsVerified, ["checklistReviewed"] = checklistReviewed, ["scenariosReviewed"] = scenariosReviewed,
                         ["gateStatuses"] = gateStatuses };
                    history.Add(new JsonObject { ["action"] = "decide", ["at"] = now, ["actorId"] = actor.Id,
                        ["result"] = decision, ["notes"] = notes, ["paperReference"] = reference,
                        ["interviewDate"] = interviewDate, ["interviewOutcome"] = interviewOutcome, ["interviewNotes"] = interviewNotes });
                }
                }
            }
            audit.Add(new JsonObject { ["at"] = now, ["action"] = action, ["actorId"] = actor.Id, ["packetId"] = action == "scenario" ? "" : subject,
                ["scenarioId"] = action == "scenario" ? subject : "" });
            data["schemaVersion"] = "promotion-packets-1";
            data["lastWrittenByAppVersion"] = AppVersion;
            data["lastSaved"] = now;
            object saved = SaveModuleData("promotion-packets", data.ToJsonString(JsonOptions), expectedRevision);
            return new { save = saved, data = data.ToJsonString(JsonOptions), packetId = subject };
        }
    }
}
