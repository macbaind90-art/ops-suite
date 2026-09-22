using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private bool RoleHasCapability(string role, string capability)
        {
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return true;
            Dictionary<string, List<string>> matrix = settings.RoleCapabilities ?? SuiteSettings.DefaultRoleCapabilities();
            if (!matrix.TryGetValue(role ?? "", out List<string>? assigned))
            {
                matrix = SuiteSettings.DefaultRoleCapabilities();
                matrix.TryGetValue(role ?? "", out assigned);
            }
            return assigned != null && (assigned.Contains("*") || assigned.Contains(capability, StringComparer.OrdinalIgnoreCase));
        }

        private SuiteUser RequireCapabilityCredentials(string userId, string pin, string capability)
        {
            return RequireAnyCapabilityCredentials(userId, pin, capability);
        }

        private SuiteUser RequireAnyCapabilityCredentials(string userId, string pin, params string[] capabilities)
        {
            foreach (SuiteUser user in settings.Users ?? new List<SuiteUser>())
            {
                if (!user.Active || !string.Equals(user.Id, userId, StringComparison.OrdinalIgnoreCase)) continue;
                if (!string.Equals(user.Pin ?? "", pin ?? "", StringComparison.Ordinal))
                    throw new UnauthorizedAccessException("PIN verification failed for this protected operation.");
                if (capabilities == null || capabilities.Length == 0 || !capabilities.Any(capability => RoleHasCapability(user.Role, capability)))
                    throw new UnauthorizedAccessException("The signed-in role does not have a required capability for this operation.");
                return user;
            }
            throw new UnauthorizedAccessException("An active signed-in account is required for this protected operation.");
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
                "tasks" => RequireCapabilityCredentials(userId, pin, "tasks.manage"),
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
                if (string.IsNullOrWhiteSpace(user.Id) || !ids.Add(user.Id))
                    throw new InvalidDataException("Every Suite Settings user requires a unique nonblank ID.");
                if (user.Active && string.IsNullOrWhiteSpace(user.Pin))
                    throw new InvalidDataException("Every active Suite Settings user requires a PIN.");
            }
            Dictionary<string, List<string>> defaults = SuiteSettings.DefaultRoleCapabilities();
            candidate.RoleCapabilities ??= defaults;
            foreach (string role in new[] { "Supervisor", "Lead", "Viewer" })
                if (!candidate.RoleCapabilities.ContainsKey(role)) candidate.RoleCapabilities[role] = new List<string>(defaults[role]);
            candidate.RoleCapabilities["Admin"] = new List<string> { "*" };
        }
    }
}
