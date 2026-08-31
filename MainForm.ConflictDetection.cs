using System;
using System.IO;
using System.Text.Json;
using System.Windows.Forms;

namespace PWADC.SecurityOperationsSuite
{
    public partial class MainForm : Form
    {
        private DataRevisionInfo GetDataRevision(string path)
        {
            string fullPath = Path.GetFullPath(path);
            if (!File.Exists(fullPath))
                return new DataRevisionInfo { Exists = false, Token = "missing", Path = fullPath };

            FileInfo info = new FileInfo(fullPath);
            string sha = Sha256File(fullPath);
            return new DataRevisionInfo
            {
                Exists = true,
                Token = sha,
                Sha256 = sha,
                Path = fullPath,
                SizeBytes = info.Length,
                ModifiedUtc = info.LastWriteTimeUtc.ToString("O")
            };
        }

        private DataRevisionInfo VerifyExpectedRevision(string module, string targetPath, string expectedRevision, string operation)
        {
            DataRevisionInfo current = GetDataRevision(targetPath);
            string expected = string.IsNullOrWhiteSpace(expectedRevision) ? "" : expectedRevision.Trim().ToLowerInvariant();
            string actual = (current.Token ?? "missing").Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(expected))
            {
                WriteDataConflictAudit(module, operation, targetPath, "revision-required", actual, current, "Save blocked because this workstation did not provide the revision that was loaded.");
                throw new InvalidOperationException("STALE_WRITE_CONFLICT: " + ModuleFolder(module) + " must be reloaded before saving because its loaded revision is unavailable. Your in-memory changes were not written to the shared file.");
            }

            if (!string.Equals(expected, actual, StringComparison.OrdinalIgnoreCase))
            {
                WriteDataConflictAudit(module, operation, targetPath, expected, actual, current, "The live file changed after this workstation loaded it.");
                throw new InvalidOperationException("STALE_WRITE_CONFLICT: Newer " + ModuleFolder(module) + " data exists on the shared drive. This workstation loaded revision " + ShortRevision(expected) + " but the live file is now " + ShortRevision(actual) + ". Your changes remain open in this window and were not saved. Export your unsaved copy if needed, then reload the latest shared data before continuing.");
            }

            return current;
        }

        private static string ShortRevision(string revision)
        {
            if (string.IsNullOrWhiteSpace(revision)) return "unknown";
            if (string.Equals(revision, "missing", StringComparison.OrdinalIgnoreCase)) return "missing";
            return revision.Length <= 12 ? revision : revision.Substring(0, 12);
        }

        private void WriteDataConflictAudit(string module, string operation, string targetPath, string expectedRevision, string currentRevision, DataRevisionInfo current, string detail)
        {
            try
            {
                string auditDir = Path.Combine(settings.DataRoot, "Data Integrity", "Conflict Audit");
                Directory.CreateDirectory(auditDir);
                string machine = string.Join("_", Environment.MachineName.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
                string name = "conflict__" + DateTime.Now.ToString("yyyy-MM-dd_HHmmssfff") + "__" + machine + "__" + Guid.NewGuid().ToString("N").Substring(0, 8) + ".json";
                string path = Path.Combine(auditDir, name);
                var record = new
                {
                    at = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                    version = "3.4.1.1",
                    user = Environment.UserName,
                    machine = Environment.MachineName,
                    module,
                    operation,
                    target = targetPath,
                    result = "blocked-stale-write",
                    expectedRevision,
                    currentRevision,
                    currentModifiedUtc = current.ModifiedUtc,
                    currentSizeBytes = current.SizeBytes,
                    detail
                };
                File.WriteAllText(path, JsonSerializer.Serialize(record, JsonOptions));
            }
            catch { }
        }
    }
}
