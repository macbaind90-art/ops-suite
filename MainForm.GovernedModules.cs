using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private sealed class GovernedModuleDefinition
        {
            public string Id { get; init; } = "";
            public string Label { get; init; } = "";
            public string FileName { get; init; } = "";
            public int SchemaRevision { get; init; }
            public bool InUse { get; init; } = true;
            public bool BackupEligible { get; init; } = true;
            public bool LkgEligible { get; init; } = true;
            public bool MigrationSupported { get; init; } = true;
            public bool RecoveryEligible { get; init; } = true;
            public string RecordCountStrategy { get; init; } = "arrays";
        }

        // One authoritative ownership boundary for suite-governed JSON. Specialist
        // tool files are intentionally excluded and remain informational only.
        private static IReadOnlyList<GovernedModuleDefinition> GovernedModuleRegistry() => new[]
        {
            new GovernedModuleDefinition { Id = "attendance", Label = "Attendance", FileName = "attendance-data.json", SchemaRevision = 3, RecordCountStrategy = "attendance" },
            new GovernedModuleDefinition { Id = "roster", Label = "Roster", FileName = "roster-data.json", SchemaRevision = 1, RecordCountStrategy = "roster" },
            new GovernedModuleDefinition { Id = "tasks", Label = "Task Tracker", FileName = "tasks-data.json", SchemaRevision = 1, RecordCountStrategy = "tasks" },
            new GovernedModuleDefinition { Id = "shift-reports", Label = "Shift Reports", FileName = "shift-reports-data.json", SchemaRevision = 1, RecordCountStrategy = "shift-reports" },
            new GovernedModuleDefinition { Id = "shift-intelligence", Label = "Shift Intelligence", FileName = "shift-intelligence-data.json", SchemaRevision = 1, RecordCountStrategy = "shift-intelligence" },
            new GovernedModuleDefinition { Id = "suite-settings", Label = "Suite Settings", FileName = "suite-settings.json", SchemaRevision = 3, RecordCountStrategy = "suite-settings" }
        };

        private static GovernedModuleDefinition? GovernedModule(string module)
        {
            foreach (GovernedModuleDefinition definition in GovernedModuleRegistry())
                if (string.Equals(definition.Id, module, StringComparison.OrdinalIgnoreCase)) return definition;
            return null;
        }

        private static string[] GovernedModuleNames() => GovernedModuleRegistry().Select(x => x.Id).ToArray();
        private static string[] ModuleNames() => GovernedModuleNames().Concat(new[] { "programs" }).ToArray();
        private static int CurrentSchemaRevision(string module) => GovernedModule(module)?.SchemaRevision
            ?? throw new InvalidOperationException("No schema revision is registered for module: " + module);

        private static string ModuleFileName(string module)
        {
            GovernedModuleDefinition? definition = GovernedModule(module);
            return definition?.FileName ?? module + ".json";
        }

        internal static string ModuleFolder(string module)
        {
            GovernedModuleDefinition? definition = GovernedModule(module);
            if (definition != null) return definition.Label;
            return string.Equals(module, "programs", StringComparison.OrdinalIgnoreCase) ? "Programs" : module;
        }

        private static bool IsKnownModule(string module) => GovernedModule(module) != null || string.Equals(module, "programs", StringComparison.OrdinalIgnoreCase);
        private static bool IsKnownJsonModule(string module) => GovernedModule(module) != null;
    }
}
