using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text.Json.Nodes;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private string sessionToken = "", sessionUserId = "", sessionSettingsRevision = "";
        private readonly Dictionary<string, (int Count, DateTime RetryAfter)> loginAttempts = new(StringComparer.OrdinalIgnoreCase);
        private string settingsRevision = "missing";
        private string SettingsPath => Path.Combine(settings.DataRoot, "Data", SettingsFileName);
        private SuiteUser RequireSession()
        {
            if (sessionToken.Length == 0) throw new UnauthorizedAccessException("Sign in before using Suite data.");
            if (GetDataRevision(SettingsPath).Token != sessionSettingsRevision)
            {
                sessionToken = "";
                throw new UnauthorizedAccessException("SESSION_EXPIRED: Account settings changed. Sign in again.");
            }
            return settings.Users.FirstOrDefault(u => u.Active && u.Id == sessionUserId)
                ?? throw new UnauthorizedAccessException("SESSION_EXPIRED: Account is no longer active.");
        }
        private void RequireRequestSession(JsonElement root)
        {
            RequireSession();
            string token = root.TryGetProperty("authorization", out var auth) && auth.TryGetProperty("token", out var t) ? t.GetString() ?? "" : "";
            if (token.Length == 0 || !CryptographicOperations.FixedTimeEquals(System.Text.Encoding.UTF8.GetBytes(token), System.Text.Encoding.UTF8.GetBytes(sessionToken)))
                throw new UnauthorizedAccessException("SESSION_EXPIRED: Host sign-in is required.");
        }
        private object Authenticate(JsonElement payload)
        {
            sessionToken = ""; sessionUserId = "";
            settings = LoadSettingsFromDisk();
            string userId = payload.TryGetProperty("userId", out var uid) ? uid.GetString() ?? "" : "";
            string pin = payload.TryGetProperty("pin", out var p) ? p.GetString() ?? "" : "";
            if (loginAttempts.TryGetValue(userId, out var attempt) && attempt.RetryAfter > DateTime.UtcNow)
                throw new UnauthorizedAccessException("Too many failed attempts. Wait one minute and retry.");
            SuiteUser? user = settings.Users.FirstOrDefault(u => u.Active && string.Equals(u.Id, userId, StringComparison.OrdinalIgnoreCase));
            bool valid = user != null && (user.PinHash.Length > 0 ? PinCredential.Verify(pin, user.PinHash) : pin.Length > 0 && pin == user.Pin);
            if (!valid)
            {
                int count = attempt.Count + 1;
                loginAttempts[userId] = (count, count >= 5 ? DateTime.UtcNow.AddMinutes(1) : DateTime.MinValue);
                throw new UnauthorizedAccessException("Invalid PIN.");
            }
            loginAttempts.Remove(userId);
            if (settings.Users.Any(u => u.Pin.Length > 0) || settings.Pin.Length > 0 || settingsRevision == "missing")
            {
                foreach (SuiteUser account in settings.Users)
                {
                    if (account.Pin.Length > 0) { account.PinLength = account.Pin.Length; account.PinHash = PinCredential.Hash(account.Pin); account.Pin = ""; }
                }
                settings.Pin = "";
                SaveSettingsToDisk();
            }
            sessionUserId = user!.Id;
            sessionSettingsRevision = settingsRevision;
            sessionToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            return new { user = PublicUser(user), token = sessionToken, settings = PublicSettings(), settingsRevision, environment = GetEnvironmentInfo() };
        }
        private static object PublicUser(SuiteUser u) => new { id = u.Id, username = u.Username, displayName = u.DisplayName, role = u.Role, active = u.Active, pinLength = u.Pin.Length > 0 ? u.Pin.Length : u.PinLength, hasPin = u.PinHash.Length > 0 || u.Pin.Length > 0 };
        private object PublicSettings()
        {
            JsonObject safe = JsonSerializer.SerializeToNode(settings, JsonOptions)!.AsObject();
            safe.Remove("Pin"); safe.Remove("Users");
            safe["users"] = JsonSerializer.SerializeToNode(settings.Users.Select(PublicUser));
            return safe;
        }
        private void SaveSettingsCandidate(JsonElement payload, string expectedRevision)
        {
            string oldPath = SettingsPath;
            using var lease = SharedFileLease.Acquire(oldPath);
            VerifyExpectedRevision("suite-settings", oldPath, expectedRevision, "settings-save");
            SuiteSettings candidate = JsonSerializer.Deserialize<SuiteSettings>(payload.GetRawText(), JsonOptions) ?? throw new InvalidDataException("Settings payload is missing.");
            foreach (SuiteUser user in candidate.Users)
            {
                SuiteUser? previous = settings.Users.FirstOrDefault(u => u.Id == user.Id);
                // Hashes are host-owned; never accept one from a browser payload.
                user.PinHash = previous?.PinHash ?? "";
                user.PinLength = previous?.PinLength ?? 4;
                if (user.Pin.Length > 0) { user.PinLength = user.Pin.Length; user.PinHash = PinCredential.Hash(user.Pin); user.Pin = ""; }
            }
            candidate.Pin = "";
            ValidateAndNormalizeSettingsForSave(candidate);
            SuiteSettings previousSettings = settings;
            string previousRevision = settingsRevision;
            string targetPath = Path.Combine(candidate.DataRoot, "Data", SettingsFileName);
            if (!string.Equals(Path.GetFullPath(targetPath), Path.GetFullPath(oldPath), StringComparison.OrdinalIgnoreCase))
            {
                if (File.Exists(targetPath)) throw new InvalidOperationException("The selected root already has settings. Open that root through the workstation root configuration instead of overwriting its accounts.");
                settingsRevision = "missing";
            }
            settings = candidate;
            try { SaveSettingsToDisk(); }
            catch { settings = previousSettings; settingsRevision = previousRevision; throw; }
        }

        private void RequireModuleReadCapability(string module)
        {
            SuiteUser actor = RequireSession();
            string[] caps = module switch
            {
                "roster" => new[] { "roster.view", "schedule.view", "uniforms.view", "supplies.view", "training.view", "promotion.view" },
                "attendance" => new[] { "attendance.view" },
                "training" => new[] { "training.view", "promotion.view" },
                "promotion-packets" => new[] { "promotion.view" },
                "shift-reports" => new[] { "shiftReports.view" },
                "shift-intelligence" => new[] { "shiftIntelligence.view" },
                "suite-settings" => new[] { "users.manage" },
                _ => throw new UnauthorizedAccessException("Unknown data module.")
            };
            if (!caps.Any(c => RoleHasCapability(actor.Role, c))) throw new UnauthorizedAccessException("Read permission required for " + module + ".");
        }

        private bool RoleHasCapability(string role, string capability)
        {
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return true;
            Dictionary<string, List<string>> matrix = settings.RoleCapabilities ?? SuiteSettings.DefaultRoleCapabilities();
            if (!matrix.TryGetValue(role ?? "", out List<string>? assigned))
            {
                matrix = SuiteSettings.DefaultRoleCapabilities();
                matrix.TryGetValue(role ?? "", out assigned);
            }
            return assigned != null && (assigned.Contains("*") || assigned.Contains(capability, StringComparer.OrdinalIgnoreCase) ||
                (string.Equals(role, "Supervisor", StringComparison.OrdinalIgnoreCase) &&
                 (capability == "promotion.view" || capability == "promotion.review") &&
                 assigned.Contains("training.manage", StringComparer.OrdinalIgnoreCase)) ||
                ((capability == "training.record" || capability == "training.signoff") &&
                 assigned.Contains("training.manage", StringComparer.OrdinalIgnoreCase)));
        }

        private SuiteUser RequireCapabilityCredentials(string userId, string pin, string capability)
        {
            return RequireAnyCapabilityCredentials(userId, pin, capability);
        }

        private SuiteUser RequireAnyCapabilityCredentials(string userId, string pin, params string[] capabilities)
        {
            SuiteUser user = RequireSession();
            if (!string.Equals(user.Id, userId, StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException("The protected operation must use the signed-in account.");
            if (!capabilities.Any(capability => RoleHasCapability(user.Role, capability)))
                throw new UnauthorizedAccessException("The signed-in role does not have a required capability for this operation.");
            return user;
        }

        private SuiteUser RequireBridgeCapability(JsonElement root, string capability)
        {
            if (!root.TryGetProperty("authorization", out JsonElement auth) || auth.ValueKind != JsonValueKind.Object)
                throw new UnauthorizedAccessException("Protected operation credentials were not supplied.");
            string userId = auth.TryGetProperty("userId", out JsonElement uid) ? uid.GetString() ?? "" : "";
            string pin = auth.TryGetProperty("pin", out JsonElement p) ? p.GetString() ?? "" : "";
            return RequireCapabilityCredentials(userId, pin, capability);
        }

        private SuiteUser RequireModuleWriteCapability(JsonElement root, string module)
        {
            if (!root.TryGetProperty("authorization", out JsonElement auth) || auth.ValueKind != JsonValueKind.Object)
                throw new UnauthorizedAccessException("Module write credentials were not supplied.");
            string userId = auth.TryGetProperty("userId", out JsonElement uid) ? uid.GetString() ?? "" : "";
            string pin = auth.TryGetProperty("pin", out JsonElement p) ? p.GetString() ?? "" : "";
            return (module ?? "").ToLowerInvariant() switch
            {
                "attendance" => RequireAnyCapabilityCredentials(userId, pin, "attendance.edit", "attendance.adjustPoints", "attendance.correctiveAction", "attendance.managePolicy"),
                "roster" => RequireAnyCapabilityCredentials(userId, pin, "roster.edit", "schedule.edit", "schedule.publish", "training.manage", "uniforms.manage", "supplies.manage"),
                "training" => throw new UnauthorizedAccessException("Training changes must use protected training commands."),
                "promotion-packets" => throw new UnauthorizedAccessException("Promotion changes must use protected packet commands."),
                "shift-reports" => RequireCapabilityCredentials(userId, pin, "shiftReports.manage"),
                "shift-intelligence" => RequireCapabilityCredentials(userId, pin, "shiftIntelligence.manage"),
                _ => throw new UnauthorizedAccessException("No governed write capability is registered for module: " + module + ".")
            };
        }

        private void ValidateAndNormalizeSettingsForSave(SuiteSettings candidate)
        {
            candidate.Users ??= new List<SuiteUser>();
            if (!candidate.Users.Any(user => user.Active && string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase)))
                throw new InvalidDataException("Suite Settings must retain at least one active Admin account.");
            var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (SuiteUser user in candidate.Users)
            {
                if (!new[] { "Admin", "Supervisor", "Lead", "Senior Officer", "Viewer" }.Contains(user.Role)) throw new InvalidDataException("Unknown account role.");
                if (string.IsNullOrWhiteSpace(user.Id) || !ids.Add(user.Id))
                    throw new InvalidDataException("Every Suite Settings user requires a unique nonblank ID.");
                if (user.Active && string.IsNullOrWhiteSpace(user.Pin) && string.IsNullOrWhiteSpace(user.PinHash))
                    throw new InvalidDataException("Every active Suite Settings user requires a PIN.");
            }
            Dictionary<string, List<string>> defaults = SuiteSettings.DefaultRoleCapabilities();
            candidate.RoleCapabilities ??= defaults;
            foreach (string role in new[] { "Supervisor", "Lead", "Senior Officer", "Viewer" })
                if (!candidate.RoleCapabilities.ContainsKey(role)) candidate.RoleCapabilities[role] = new List<string>(defaults[role]);
            candidate.RoleCapabilities["Admin"] = new List<string> { "*" };
        }
    }
}
