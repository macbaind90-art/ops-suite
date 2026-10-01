using System.Diagnostics;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json.Nodes;
using PWADC.SecurityOperationsSuite;

static string Hash(string p) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(p))).ToLowerInvariant();
static void Check(bool condition, string name) { if (!condition) throw new Exception(name); Console.WriteLine("PASS " + name); }
static bool Denied(Action action) { try { action(); return false; } catch (UnauthorizedAccessException) { return true; } }
if (args.Length > 0 && args[0] == "writer")
{
    string target = args[1], expected = args[2];
    File.WriteAllText(args[3] + ".ready", "ready");
    while (!File.Exists(args[3])) Thread.Sleep(10);
    using var lease = SharedFileLease.Acquire(target);
    if (Hash(target) != expected) return 20;
    string backup = target + ".bak-" + Guid.NewGuid(); File.Copy(target, backup);
    string staged = target + ".tmp-" + Guid.NewGuid(); File.WriteAllText(staged, args[4]);
    GuardedFileCommit.Commit(staged, target, backup, true, () => { if (File.ReadAllText(target) != args[4]) throw new IOException("Verification"); });
    return 0;
}
string scratch = Path.Combine(Path.GetTempPath(), "PWADC-core-tests-" + Guid.NewGuid());Directory.CreateDirectory(scratch);
try
{
    string first = PinCredential.Hash("626882"), second = PinCredential.Hash("626882");
    Check(first != second && PinCredential.Verify("626882", first) && !PinCredential.Verify("1234", first) && !PinCredential.Verify("626882", "bad"), "Salted PIN authentication rejects incorrect and malformed credentials");
    JsonObject live = JsonNode.Parse("{\"employees\":[{\"id\":1,\"first\":\"Jane\",\"last\":\"Smith\",\"rate\":22,\"rank\":\"SO\"}],\"schedule\":[],\"officeSupplies\":[],\"audit\":[]}")!.AsObject();
    Func<string,bool> supplies = c => c is "supplies.view" or "supplies.manage";
    var restricted = ModuleWritePolicy.Project("roster", live, supplies);
    Check(restricted["employees"] == null && restricted["schedule"] == null, "Supplies reader receives no employee or schedule records");
    restricted["officeSupplies"]!.AsArray().Add(JsonNode.Parse("{\"id\":1,\"name\":\"Paper\"}"));restricted["nextOfficeSupplyId"]=2;
    var supplySave=ModuleWritePolicy.Apply("roster",live,restricted,supplies);
    Check(supplySave["officeSupplies"]!.AsArray().Count==1 && supplySave["employees"]![0]!["rate"]!.ToString()=="22", "Supplies edit preserves hidden employee data and tolerates normalized counters");
    var attack = (JsonObject)live.DeepClone();attack["employees"]![0]!["rate"] = 99;
    Check(Denied(() => ModuleWritePolicy.Apply("roster",live,attack,supplies)), "Supplies writer cannot alter employee pay");
    Func<string,bool> roster = c => c is "roster.view" or "roster.edit";
    var projected = ModuleWritePolicy.Project("roster",live,roster);Check(projected["employees"]![0]!["rate"] == null, "Individual pay is removed from roster reads");
    projected["employees"]![0]!["first"]="Janet";var patched=ModuleWritePolicy.Apply("roster",live,projected,roster);
    Check(patched["employees"]![0]!["rate"]!.ToString()=="22" && patched["employees"]![0]!["first"]!.ToString()=="Janet", "Authorized identity edit preserves redacted pay");
    var attendance=JsonNode.Parse("{\"attendance\":{},\"pointSystem\":{\"policy\":{\"maxPositiveCredits\":3}}}")!.AsObject();var policyAttack=(JsonObject)attendance.DeepClone();policyAttack["pointSystem"]!["policy"]!["maxPositiveCredits"]=99;
    Check(Denied(()=>ModuleWritePolicy.Apply("attendance",attendance,policyAttack,c=>c=="attendance.edit")), "Attendance editor cannot alter point policy");
    var assignment=JsonNode.Parse("{\"status\":\"active\",\"events\":[{\"id\":\"s\",\"type\":\"signoff\",\"date\":\"2026-01-01\",\"at\":\"2026-01-01T10:00:00Z\"}]}")!.AsObject();var requirement=JsonNode.Parse("{\"active\":true,\"renewalDays\":30}")!.AsObject();
    Check(TrainingQualification.CurrentSignoff(assignment,requirement,"2026-01-31")!=null && TrainingQualification.CurrentSignoff(assignment,requirement,"2026-02-01")==null, "Qualification expires after the inclusive renewal date");
    var events=assignment["events"]!.AsArray();events.Add(JsonNode.Parse("{\"id\":\"r\",\"type\":\"retrain\",\"date\":\"2026-01-02\",\"at\":\"2026-01-02T10:00:00Z\"}"));
    events.Add(JsonNode.Parse("{\"type\":\"void\",\"reference\":\"r\"}"));Check(TrainingQualification.CurrentSignoff(assignment,requirement,"2026-01-10")!=null,"Voided retraining does not invalidate qualification");
    events.Add(JsonNode.Parse("{\"id\":\"fail\",\"type\":\"record\",\"outcome\":\"Needs practice\",\"date\":\"2026-01-03\",\"at\":\"2026-01-03T10:00:00Z\"}"));Check(TrainingQualification.LatestEffective(events,"record")!["outcome"]!.ToString()=="Needs practice" && TrainingQualification.CurrentSignoff(assignment,requirement,"2026-01-10")==null,"Latest unsuccessful observation replaces older qualification evidence");
    string target=Path.Combine(scratch,"data.json"),backup=target+".bak",staged=target+".tmp";File.WriteAllText(target,"old");File.Copy(target,backup);File.WriteAllText(staged,"new");
    using(var lease=SharedFileLease.Acquire(target)){try{GuardedFileCommit.Commit(staged,target,backup,true,()=>throw new IOException("Injected post-replacement failure"));throw new Exception("Failure was not reported");}catch(IOException){Check(File.ReadAllText(target)=="old","Post-replacement verification failure rolls back under the writer lock");}}
    staged=Path.Combine(scratch,"new.tmp");string absent=Path.Combine(scratch,"absent.json");File.WriteAllText(staged,"new");try{GuardedFileCommit.Commit(staged,absent,"",false,()=>throw new IOException("Injected failure"));}catch(IOException){}Check(!File.Exists(absent),"Failed first creation removes its unverified generation");
    File.WriteAllText(target,"baseline");string expected=Hash(target);string gate=Path.Combine(scratch,"go");
    Process Start(string name,string value){var info=new ProcessStartInfo(Environment.ProcessPath!){UseShellExecute=false};if(Path.GetFileNameWithoutExtension(Environment.ProcessPath)=="dotnet")info.ArgumentList.Add(Assembly.GetExecutingAssembly().Location);foreach(string a in new[]{"writer",target,expected,gate+name,value})info.ArgumentList.Add(a);return Process.Start(info)!;}
    using var one=Start("one","first");using var two=Start("two","second");var clock=Stopwatch.StartNew();while(!File.Exists(gate+"one.ready")||!File.Exists(gate+"two.ready")){if(clock.ElapsedMilliseconds>10000)throw new Exception("Writer startup timeout");Thread.Sleep(10);}File.WriteAllText(gate+"one","");File.WriteAllText(gate+"two","");one.WaitForExit();two.WaitForExit();
    Check(new[]{one.ExitCode,two.ExitCode}.Order().SequenceEqual(new[]{0,20}),"Two simultaneous processes yield exactly one commit and one revision conflict");
    Console.WriteLine("Core behavioral tests passed.");return 0;
}
finally{Directory.Delete(scratch,true);}
