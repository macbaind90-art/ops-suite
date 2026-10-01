using System;
using System.IO;

namespace PWADC.SecurityOperationsSuite;

internal static class GuardedFileCommit
{
    // Caller owns SharedFileLease. A verification failure restores the previous
    // generation before another writer can acquire the coordination handle.
    public static string Commit(string staged, string target, string backup, bool existed, Action verify)
    {
        string method;
        if (existed)
        {
            try { File.Replace(staged, target, null, true); method = "File.Replace"; }
            catch (PlatformNotSupportedException) { File.Move(staged, target, true); method = "File.Move(overwrite-fallback)"; }
        }
        else { File.Move(staged, target); method = "File.Move(create)"; }
        try { verify(); return method; }
        catch (Exception failure)
        {
            try
            {
                if (existed)
                {
                    string rollback = target + ".rollback-" + Guid.NewGuid().ToString("N") + ".tmp";
                    try
                    {
                        File.Copy(backup, rollback, false);
                        using (var stream = new FileStream(rollback, FileMode.Open, FileAccess.ReadWrite, FileShare.None)) stream.Flush(true);
                        File.Move(rollback, target, true);
                    }
                    finally { if (File.Exists(rollback)) File.Delete(rollback); }
                }
                else if (File.Exists(target)) File.Delete(target);
            }
            catch (Exception rollback) { throw new IOException("OUTCOME_UNKNOWN: Verification and rollback failed. Preserve the safety backup and review shared data. " + rollback.Message, failure); }
            throw new IOException("Write verification failed; the prior data was restored.", failure);
        }
    }
}
