using System;
using System.Collections.Generic;
using System.IO;

namespace PWADC.SecurityOperationsSuite
{
    internal class BackupFileInfo
    {
        public string Module { get; }
        public string Name { get; }
        public string Path { get; }
        public DateTime Modified { get; }
        public string ModifiedText => Modified.ToString("yyyy-MM-dd HH:mm:ss");
        public long SizeBytes { get; }
        public string Kind { get; }
        public BackupFileInfo(string module, FileInfo info, string kind)
        {
            Module = module;
            Name = info.Name;
            Path = info.FullName;
            Modified = info.LastWriteTime;
            SizeBytes = info.Length;
            Kind = kind;
        }
    }

    internal class BackupPlanFile
    {
        public string Module { get; }
        public string Label { get; }
        public string Name { get; }
        public string Path { get; }
        public string Modified { get; }
        public long SizeBytes { get; }
        public string Kind { get; }
        public string Reason { get; set; } = "";
        public BackupPlanFile(BackupFileInfo file)
        {
            Module = file.Module;
            Label = MainForm.ModuleFolder(file.Module);
            Name = file.Name;
            Path = file.Path;
            Modified = file.ModifiedText;
            SizeBytes = file.SizeBytes;
            Kind = file.Kind;
        }
        public object ToResponse() => new { module = Module, label = Label, name = Name, path = Path, modified = Modified, sizeBytes = SizeBytes, kind = Kind, reason = Reason };
    }



    internal class JsonIntegrityInfo
    {
        public string Status { get; set; } = "missing";
        public string Error { get; set; } = "";
        public string Sha256 { get; set; } = "";
    }


    internal class DataRevisionInfo
    {
        public bool Exists { get; set; } = false;
        public string Token { get; set; } = "missing";
        public string Sha256 { get; set; } = "";
        public string Path { get; set; } = "";
        public long SizeBytes { get; set; } = 0;
        public string ModifiedUtc { get; set; } = "";
    }

    internal class DataWriteOutcome
    {
        public string Module { get; set; } = "";
        public string Operation { get; set; } = "";
        public string Path { get; set; } = "";
        public string SavedAt { get; set; } = "";
        public long SizeBytes { get; set; } = 0;
        public string BackupPath { get; set; } = "";
        public string Sha256 { get; set; } = "";
        public string Method { get; set; } = "";
        public bool Verified { get; set; } = false;
    }

    public class SuiteSettings
    {
        public string Theme { get; set; } = "dark";
        public string DefaultModule { get; set; } = "home";
        public string Pin { get; set; } = "1234";
        public string DataRoot { get; set; } = @"\\pig-fs\Security\MacBain\Security Operations Suite";
        public int BackupRetentionDays { get; set; } = 180;
        public double FtLoadedRate { get; set; } = 0.33;
        public double PtLoadedRate { get; set; } = 0.20;
        public double TempLoadedRate { get; set; } = 0.35;
        public double MonthlyMultiplier { get; set; } = 4.333;
        public double AnnualMultiplier { get; set; } = 52;
        public double FteBaselineHours { get; set; } = 40;
        public List<SuiteUser> Users { get; set; } = new List<SuiteUser>
        {
            new SuiteUser { Id = "admin", Username = "David", DisplayName = "David MacBain", Role = "Admin", Pin = "6268", Active = true },
            new SuiteUser { Id = "supervisor", Username = "Supervisor", DisplayName = "Supervisor", Role = "Supervisor", Pin = "1234", Active = false },
            new SuiteUser { Id = "lead", Username = "Lead", DisplayName = "Lead", Role = "Lead", Pin = "1111", Active = false },
            new SuiteUser { Id = "viewer", Username = "Viewer", DisplayName = "Viewer", Role = "Viewer", Pin = "0000", Active = false }
        };
    }

    public class SuiteUser
    {
        public string Id { get; set; } = "";
        public string Username { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string Role { get; set; } = "Viewer";
        public string Pin { get; set; } = "1234";
        public bool Active { get; set; } = true;
    }
}
