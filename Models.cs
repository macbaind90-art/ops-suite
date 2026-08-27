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
        public List<CoverageRequirement> CoverageRequirements { get; set; } = new List<CoverageRequirement>
        {
            new CoverageRequirement { Id = "cov1", Area = "1st Shift Core Supervisor", Section = "1st Shift", Post = "Supervisor", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "0800-1600 core supervisor coverage" },
            new CoverageRequirement { Id = "cov2", Area = "1st Shift Extra Supervisor", Section = "1st Shift", Post = "Supervisor", Days = new List<string> { "Mon", "Tue", "Wed" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Second supervisor row on Mon-Wed" },
            new CoverageRequirement { Id = "cov3", Area = "1st Shift Base", Section = "1st Shift", Post = "Base", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Base post coverage" },
            new CoverageRequirement { Id = "cov4", Area = "1st Shift Response", Section = "1st Shift", Post = "Response", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 2, HoursPerPost = 8, Notes = "Two response posts; current schedule has open response slots on Sun/Sat" },
            new CoverageRequirement { Id = "cov5", Area = "1st Shift Floater", Section = "1st Shift", Post = "Floater", Days = new List<string> { "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Floater coverage shown Thu-Fri" },
            new CoverageRequirement { Id = "cov6", Area = "2nd Shift Core Supervisor", Section = "2nd Shift", Post = "Supervisor", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "1600-2400 core supervisor coverage" },
            new CoverageRequirement { Id = "cov7", Area = "2nd Shift Extra Supervisor", Section = "2nd Shift", Post = "Supervisor", Days = new List<string> { "Mon", "Tue", "Wed" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Second supervisor row on Mon-Wed" },
            new CoverageRequirement { Id = "cov8", Area = "2nd Shift Base", Section = "2nd Shift", Post = "Base", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Base post coverage" },
            new CoverageRequirement { Id = "cov9", Area = "2nd Shift Response", Section = "2nd Shift", Post = "Response", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 2, HoursPerPost = 8, Notes = "Two response posts" },
            new CoverageRequirement { Id = "cov10", Area = "2nd Shift Floater", Section = "2nd Shift", Post = "Floater", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday floater coverage" },
            new CoverageRequirement { Id = "cov11", Area = "3rd Shift Core Supervisor", Section = "3rd Shift", Post = "Supervisor", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "0000-0800 core supervisor coverage" },
            new CoverageRequirement { Id = "cov12", Area = "3rd Shift Extra Supervisor", Section = "3rd Shift", Post = "Supervisor", Days = new List<string> { "Mon", "Tue", "Wed" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Second supervisor row on Mon-Wed" },
            new CoverageRequirement { Id = "cov13", Area = "3rd Shift Base", Section = "3rd Shift", Post = "Base", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Base post coverage" },
            new CoverageRequirement { Id = "cov14", Area = "3rd Shift Response", Section = "3rd Shift", Post = "Response", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 2, HoursPerPost = 8, Notes = "Two response posts" },
            new CoverageRequirement { Id = "cov15", Area = "3rd Shift Floater", Section = "3rd Shift", Post = "Floater", Days = new List<string> { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Primary floater row" },
            new CoverageRequirement { Id = "cov16", Area = "3rd Shift Extra Floater", Section = "3rd Shift", Post = "Floater", Days = new List<string> { "Mon", "Thu" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Second floater row on Mon/Thu" },
            new CoverageRequirement { Id = "cov17", Area = "Gate 0400-1200", Section = "Gate", Post = "Gate 0400-1200", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday gate coverage" },
            new CoverageRequirement { Id = "cov18", Area = "Gate 1200-2000", Section = "Gate", Post = "Gate 1200-2000", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 2, HoursPerPost = 8, Notes = "Two weekday gate guards" },
            new CoverageRequirement { Id = "cov19", Area = "Gate 2000-0400", Section = "Gate", Post = "Gate 2000-0400", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday overnight gate coverage" },
            new CoverageRequirement { Id = "cov20", Area = "Gate 0400-1600 Weekend", Section = "Gate", Post = "Gate 0400-1600", Days = new List<string> { "Sun", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 12, Notes = "Weekend day gate coverage" },
            new CoverageRequirement { Id = "cov21", Area = "Gate 1600-0400 Weekend", Section = "Gate", Post = "Gate 1600-0400", Days = new List<string> { "Sun", "Sat" }, RequiredHeadcount = 1, HoursPerPost = 12, Notes = "Weekend night gate coverage" },
            new CoverageRequirement { Id = "cov22", Area = "Grocery Dock 0600-1400", Section = "Dock & Support", Post = "Grocery 0600-1400", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday grocery dock coverage" },
            new CoverageRequirement { Id = "cov23", Area = "Crosswalk 0500-1300", Section = "Dock & Support", Post = "Crosswalk 0500-1300", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "Weekday crosswalk/dock surge coverage" },
            new CoverageRequirement { Id = "cov24", Area = "Reception 0800-1700", Section = "Dock & Support", Post = "Reception 0800-1700", Days = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri" }, RequiredHeadcount = 1, HoursPerPost = 8, Notes = "9-hour window with 1-hour lunch relief covered by another guard; 8 hours for cost/HPW" }
        };
        public List<SuiteUser> Users { get; set; } = new List<SuiteUser>
        {
            new SuiteUser { Id = "admin", Username = "David", DisplayName = "David MacBain", Role = "Admin", Pin = "6268", Active = true },
            new SuiteUser { Id = "supervisor", Username = "Supervisor", DisplayName = "Supervisor", Role = "Supervisor", Pin = "1234", Active = false },
            new SuiteUser { Id = "lead", Username = "Lead", DisplayName = "Lead", Role = "Lead", Pin = "1111", Active = false },
            new SuiteUser { Id = "viewer", Username = "Viewer", DisplayName = "Viewer", Role = "Viewer", Pin = "0000", Active = false }
        };
    }

    public class CoverageRequirement
    {
        public string Id { get; set; } = "";
        public string Area { get; set; } = "Coverage Area";
        public string Section { get; set; } = "Coverage Area";
        public string DayType { get; set; } = "All";
        public string Post { get; set; } = "";
        public List<string> Days { get; set; } = new List<string>();
        public double RequiredHeadcount { get; set; } = 1;
        public double HoursPerPost { get; set; } = 8;
        public string Notes { get; set; } = "";
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
