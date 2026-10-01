using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading;

namespace PWADC.SecurityOperationsSuite;

// File sharing is enforced by SMB as well as the local filesystem. Keep lock files;
// deleting a lock file would allow another handle to coordinate on a different inode.
internal sealed class SharedFileLease : IDisposable
{
    [ThreadStatic] private static Dictionary<string, (FileStream Stream, int Count)>? held;
    private readonly string key;
    private bool disposed;
    private SharedFileLease(string key) { this.key = key; }
    public static SharedFileLease Acquire(string target)
    {
        string key = Path.GetFullPath(target) + ".write-lock";
        held ??= new(StringComparer.OrdinalIgnoreCase);
        if (held.TryGetValue(key, out var entry))
        {
            held[key] = (entry.Stream, entry.Count + 1);
            return new(key);
        }
        Directory.CreateDirectory(Path.GetDirectoryName(key)!);
        var clock = Stopwatch.StartNew();
        while (true)
        {
            try
            {
                var stream = new FileStream(key, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
                held[key] = (stream, 1);
                return new(key);
            }
            catch (IOException) when (clock.ElapsedMilliseconds < 5000) { Thread.Sleep(25); }
        }
    }
    public void Dispose()
    {
        if (disposed) return;
        disposed = true;
        var entry = held![key];
        if (entry.Count > 1) held[key] = (entry.Stream, entry.Count - 1);
        else { held.Remove(key); entry.Stream.Dispose(); }
    }
}
