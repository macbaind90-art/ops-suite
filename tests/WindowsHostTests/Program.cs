using System.Diagnostics;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using PWADC.SecurityOperationsSuite;

internal static class Program
{
    private static readonly BindingFlags Flags=BindingFlags.Instance|BindingFlags.Static|BindingFlags.NonPublic;
    private static object? Call(MainForm host,string name,params object?[] values){try{return typeof(MainForm).GetMethod(name,Flags)!.Invoke(host,values);}catch(TargetInvocationException e){throw e.InnerException!;}}
    private static void Set(MainForm host,string name,object value)=>typeof(MainForm).GetField(name,Flags)!.SetValue(host,value);
    private static JsonElement Element(object value)=>JsonSerializer.SerializeToElement(value);
    private static string Hash(string path)=>Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path))).ToLowerInvariant();
    private static void Check(bool condition,string name){if(!condition)throw new Exception(name);Console.WriteLine("PASS "+name);}
    private static bool Fails(Action run,string contains=""){try{run();return false;}catch(Exception e){return e.Message.Contains(contains);}}
    private static MainForm Host(string root){var h=new MainForm();Set(h,"settings",new SuiteSettings{DataRoot=root});Set(h,"appFolder",Path.Combine(Directory.GetCurrentDirectory(),"app"));return h;}
    [STAThread]
    private static int Main(string[] args)
    {
        if(args.Length>0&&args[0]=="writer")
        {
            using var host=Host(args[1]);string path=Path.Combine(args[1],"Data","tasks-data.json");File.WriteAllText(args[3]+".ready","");while(!File.Exists(args[3]))Thread.Sleep(10);
            try{Call(host,"WriteJsonAtomically","tasks",path,"{\"schemaVersion\":\"tasks-1\",\"tasks\":[],\"audit\":[],\"writer\":\""+args[4]+"\"}",args[5],"test",args[2]);return 0;}
            catch(Exception e){return e.Message.Contains("STALE_WRITE_CONFLICT")?20:30;}
        }
        string root=Path.Combine(Path.GetTempPath(),"PWADC-host-tests-"+Guid.NewGuid());Directory.CreateDirectory(Path.Combine(root,"Data"));
        string pointer=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"PWADC","suite-root.txt");Directory.CreateDirectory(Path.GetDirectoryName(pointer)!);string? prior=File.Exists(pointer)?File.ReadAllText(pointer):null;
        try
        {
            File.WriteAllText(pointer,root);using var host=Host(root);
            var settings=new SuiteSettings{DataRoot=root,Users=new(){new SuiteUser{Id="admin",Username="Manager",DisplayName="Manager",Role="Admin",Pin="626882"},new SuiteUser{Id="supply",Username="Supplies",DisplayName="Supplies",Role="Viewer",Pin="1234"}},RoleCapabilities=SuiteSettings.DefaultRoleCapabilities()};settings.RoleCapabilities["Viewer"]=new(){"supplies.view","supplies.manage"};
            string settingsPath=Path.Combine(root,"Data","suite-settings.json");File.WriteAllText(settingsPath,JsonSerializer.Serialize(settings));
            Check(Fails(()=>Call(host,"RequireSession")),"Native module access is denied before authentication");
            Check(Fails(()=>Call(host,"Authenticate",Element(new{userId="admin",pin="wrong"}))),"Native sign-in rejects the wrong PIN");
            var login=Element(Call(host,"Authenticate",Element(new{userId="admin",pin="626882"}))!);string token=login.GetProperty("token").GetString()!;
            Check(!login.ToString().Contains("626882")&&!login.ToString().Contains("PinHash"),"Native login response contains no PIN or credential hash");
            string disk=File.ReadAllText(settingsPath);Check(!disk.Contains("626882")&&!disk.Contains("\"1234\"")&&disk.Contains("pbkdf2-sha256"),"Legacy credentials migrate to salted hashes on disk");
            Call(host,"RequireRequestSession",Element(new{authorization=new{token}}));Check(Fails(()=>Call(host,"RequireRequestSession",Element(new{authorization=new{token="forged"}}))),"Host requests reject a forged session token");
            var safe=JsonNode.Parse(login.GetProperty("settings").GetRawText())!.AsObject();safe["Theme"]="light";string rev=Hash(settingsPath);
            Call(host,"SaveSettingsCandidate",Element(safe),rev);Check(Fails(()=>Call(host,"SaveSettingsCandidate",Element(safe),rev),"STALE_WRITE_CONFLICT"),"Settings edits require the loaded revision");
            login=Element(Call(host,"Authenticate",Element(new{userId="supply",pin="1234"}))!);
            Check(Fails(()=>Call(host,"RequireModuleReadCapability","attendance")),"Supplies-only account cannot read Attendance");
            File.WriteAllText(Path.Combine(root,"Data","roster-data.json"),"{\"schemaVersion\":\"roster-1\",\"employees\":[{\"id\":1,\"rate\":22}],\"schedule\":[],\"officeSupplies\":[],\"audit\":[]}");
            var roster=Element(Call(host,"LoadModuleDataEnvelope","roster")!);Check(!roster.GetProperty("data").GetString()!.Contains("rate"),"Host module projection removes individual pay and employee data");
            var supplyData=JsonNode.Parse(roster.GetProperty("data").GetString()!)!.AsObject();supplyData["officeSupplies"]!.AsArray().Add(JsonNode.Parse("{\"id\":1,\"name\":\"Paper\"}"));supplyData["nextOfficeSupplyId"]=2;
            Call(host,"SaveModuleData","roster",supplyData.ToJsonString(),roster.GetProperty("revision").GetString(),settings.Users[1]);
            Check(JsonNode.Parse(File.ReadAllText(Path.Combine(root,"Data","roster-data.json")))!["employees"]![0]!["rate"]!.ToString()=="22","Native supplies edit retains hidden employee pay");
            string tasksPath=Path.Combine(root,"Data","tasks-data.json"),baseline="{\"schemaVersion\":\"tasks-1\",\"tasks\":[],\"audit\":[]}";File.WriteAllText(tasksPath,baseline);
            var loaded=Element(Call(host,"LoadModuleDataWithSource","tasks")!);Check(loaded.GetProperty("Revision").GetString()==Hash(tasksPath),"Loaded data and revision derive from the same byte buffer");
            string backup=Path.Combine(root,"Backups","Task Tracker","test.json");Directory.CreateDirectory(Path.GetDirectoryName(backup)!);File.WriteAllText(backup,baseline);
            Call(host,"Authenticate",Element(new{userId="admin",pin="626882"}));
            var preview=Element(Call(host,"ReadBackupSummary","tasks",backup)!);File.WriteAllText(tasksPath,baseline+" ");
            Check(Fails(()=>Call(host,"RestoreBackup","tasks",backup,"Test reason","admin","",preview.GetProperty("currentRevision").GetString(),preview.GetProperty("backupHash").GetString()),"STALE_WRITE_CONFLICT"),"Recovery rejects a live revision changed since preview");
            preview=Element(Call(host,"ReadBackupSummary","tasks",backup)!);File.WriteAllText(backup,baseline+" ");
            Check(Fails(()=>Call(host,"RestoreBackup","tasks",backup,"Test reason","admin","",preview.GetProperty("currentRevision").GetString(),preview.GetProperty("backupHash").GetString()),"changed after preview"),"Recovery rejects a changed backup candidate");
            Check(Fails(()=>Call(host,"WriteExport","tasks","bad.cmd","echo executable")),"Native exports reject executable scripts");
            Check(Fails(()=>Call(host,"LaunchProgram","arbitrary")),"Native launcher rejects unregistered program IDs");
            string trainingPath=Path.Combine(root,"Data","training-data.json");
            var training=JsonNode.Parse("{\"schemaVersion\":\"training-1\",\"requirements\":[{\"id\":\"neo\",\"title\":\"NEO\",\"active\":true,\"renewalDays\":30}],\"assignments\":[{\"id\":\"a\",\"employeeId\":\"1\",\"requirementId\":\"neo\",\"status\":\"active\",\"events\":[{\"id\":\"pass\",\"type\":\"record\",\"outcome\":\"Pass\",\"date\":\"2026-01-01\",\"at\":\"2026-01-01T10:00:00Z\"},{\"id\":\"fail\",\"type\":\"record\",\"outcome\":\"Needs practice\",\"date\":\"2026-01-02\",\"at\":\"2026-01-02T10:00:00Z\"}]}],\"audit\":[]}")!.AsObject();
            File.WriteAllText(trainingPath,training.ToJsonString());
            Check(Fails(()=>Call(host,"RunTrainingCommand",Element(new{authorization=new{userId="admin"},payload=new{action="signoff",assignmentId="a",date="2026-10-01",expectedRevision=Hash(trainingPath)}})),"passing observation"),"Actual host signoff rejects an older Pass after Needs practice");
            training["assignments"]![0]!["events"]!.AsArray().Add(JsonNode.Parse("{\"id\":\"v\",\"type\":\"void\",\"reference\":\"fail\",\"at\":\"2026-01-03T10:00:00Z\"}"));
            File.WriteAllText(trainingPath,training.ToJsonString());
            Call(host,"RunTrainingCommand",Element(new{authorization=new{userId="admin"},payload=new{action="signoff",assignmentId="a",date="2026-01-04",expectedRevision=Hash(trainingPath)}}));
            Check(File.ReadAllText(trainingPath).Contains("signoff"),"Voiding the later failed observation permits standard signoff");
            string packetPath=Path.Combine(root,"Data","promotion-packets-data.json");File.Copy(Path.Combine(Directory.GetCurrentDirectory(),"app","seed","promotion-packets-data.json"),packetPath,true);
            var issued=Element(Call(host,"RunPromotionPacketCommand",Element(new{authorization=new{userId="admin"},payload=new{action="issue",employeeId="1",tier="T1-T2",expectedRevision=Hash(packetPath)}}))!);
            var issuedData=JsonNode.Parse(issued.GetProperty("data").GetString()!)!.AsObject();
            Check(issuedData["packets"]!.AsArray().Last()!["trainingEvidence"]![0]!["signoffId"]!.ToString()=="", "Actual promotion issue lists expired Training as missing");
            var lkg=Element(Call(host,"EnsureDailyLastKnownGoodSnapshot")!);Check(lkg.GetProperty("Success").GetBoolean(),"Native Last-Known-Good snapshot is created before corruption");
            File.WriteAllText(tasksPath,"{broken-json");
            var lkgPreview=Element(Call(host,"PreviewLastKnownGood","tasks","admin","")!);
            Check(lkgPreview.GetProperty("recoveryAvailable").GetBoolean(),"LKG preview remains available when live JSON is corrupt");
            var recovery=Element(Call(host,"RestoreLastKnownGood","tasks","Corruption recovery test",lkgPreview.GetProperty("currentRevision").GetString(),"admin","",lkgPreview.GetProperty("backupHash").GetString())!);
            Check(File.ReadAllText(recovery.GetProperty("preRestoreBackupPath").GetString()!)=="{broken-json", "Corrupt original is preserved before native recovery");
            Check(recovery.GetProperty("revision").GetString()==Hash(tasksPath),"Verified recovery returns its committed revision");
            string legacyAttendance="{\"employees\":[],\"attendance\":{},\"notes\":{},\"audit\":[]}";
            string migrated=(string)Call(host,"PrepareRecoveryCandidate","attendance",legacyAttendance)!;
            Check(Element(Call(host,"EvaluateSchemaCompatibility","attendance",migrated)!).GetProperty("Status").GetString()=="current","Legacy Attendance recovery candidate is migrated before replacement");
            var fixtureRows=JsonNode.Parse(File.ReadAllText("tests/fixtures/portable-completed.json"))!.AsArray();
            foreach(JsonObject fixture in fixtureRows.OfType<JsonObject>())
            {
                var packet=fixture["packet"]!.AsObject();var evaluation=fixture["evaluation"]!;
                var normalized=(JsonObject)Call(host,"NormalizePromotionDigitalAssessment",Element(evaluation),packet,settings.Users[0],"2026-10-01T12:00:00Z")!;
                packet["digitalAssessment"]=normalized;
                Call(host,"ValidatePromotionDigitalCompletion",packet,"Recommend");
                Check(true,"Actual native validation accepts portable completion for "+packet["tier"]);
                if(packet["tier"]!.ToString()=="T3-T4")
                {
                    normalized["practicals"]!["T4-BASE2"]!["shift"]=" DAY ";
                    Check(Fails(()=>Call(host,"ValidatePromotionDigitalCompletion",packet,"Recommend"),"different dates or shifts"),"Native and portable rules both reject equivalent BASE shift labels");
                }
            }
            foreach(string operation in new[]{"module-save","restore-backup","schema-migration:tasks-0->tasks-1"})
            {
                File.WriteAllText(tasksPath,baseline);string expected=Hash(tasksPath),gate=Path.Combine(root,"go-"+Guid.NewGuid());
                Process Start(string name,string op){var i=new ProcessStartInfo(Environment.ProcessPath!){UseShellExecute=false};if(Path.GetFileNameWithoutExtension(Environment.ProcessPath)=="dotnet")i.ArgumentList.Add(Assembly.GetExecutingAssembly().Location);foreach(string a in new[]{"writer",root,expected,gate+name,name,op})i.ArgumentList.Add(a);return Process.Start(i)!;}
                using var one=Start("one","module-save");using var two=Start("two",operation);var clock=Stopwatch.StartNew();while(!File.Exists(gate+"one.ready")||!File.Exists(gate+"two.ready")){if(clock.ElapsedMilliseconds>20000)throw new Exception("Native writer startup timeout");Thread.Sleep(10);}File.WriteAllText(gate+"one","");File.WriteAllText(gate+"two","");one.WaitForExit();two.WaitForExit();Check(new[]{one.ExitCode,two.ExitCode}.Order().SequenceEqual(new[]{0,20}),"Actual host simultaneous save versus "+operation+" permits one writer");
            }
            Console.WriteLine("Windows host behavioral tests passed.");return 0;
        }
        catch(Exception e){Console.Error.WriteLine(e);return 1;}
        finally{if(prior==null)File.Delete(pointer);else File.WriteAllText(pointer,prior);try{Directory.Delete(root,true);}catch{}}
    }
}
