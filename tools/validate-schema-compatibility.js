'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const need=(hay,needle,msg)=>{if(!hay.includes(needle))throw new Error(msg||`Missing: ${needle}`)};

const schema=read('MainForm.SchemaCompatibility.cs');
const registry=read('MainForm.GovernedModules.cs');
const main=read('MainForm.cs');
const storage=read('MainForm.Storage.cs');
const reliability=read('MainForm.DataReliability.cs');
const programs=read('MainForm.Programs.cs');
const dataCore=read('app/js/20-data-core.js');
const shell=read('app/js/30-shell-audits.js');
const workflow=read('.github/workflows/build-windows.yml');
const csproj=read('SecurityOperationsSuite.csproj');
const manifest=read('app.manifest');
const globalJson=read('global.json');

need(main,'private const string AppVersion = "4.6.0";','AppVersion must be 4.6.0 for this maintenance release.');
need(main,'EnsureLiveSchemaMetadata();','Startup schema metadata initialization is missing.');
for(const [id,revision] of [['attendance',3],['roster',1],['tasks',1],['shift-reports',1],['shift-intelligence',1],['suite-settings',3]]){
  need(registry,`Id = "${id}"`,`${id} governed-module registration missing.`);
  const line=registry.split(/\r?\n/).find(x=>x.includes(`Id = "${id}"`))||'';
  need(line,`SchemaRevision = ${revision}`,`${id} schema revision ${revision} registration missing.`);
}
need(schema,'GovernedModule(module)','Schema compatibility must resolve revisions through the governed-module registry.');
need(schema,'private sealed class SchemaCompatibilityException : IOException','SchemaCompatibilityException must derive from IOException; InvalidDataException is sealed on the target framework.');
if(schema.includes('SchemaCompatibilityException : InvalidDataException'))throw new Error('SchemaCompatibilityException still derives from sealed InvalidDataException.');

need(schema,'result.Status = "newer"','Newer-schema detection missing.');
need(schema,'Writes are blocked to protect newer data.','Newer-schema write protection message missing.');
need(schema,'result.Status = "previous"','Immediately-previous schema detection missing.');
need(schema,'result.Status = "legacy-too-old"','Legacy-too-old schema block missing.');
need(schema,'controlled migration to','Older-schema migration gate missing.');
need(schema,'InitialSchemaVersionForLegacy','Legacy schema anchoring helper missing.');
need(schema,'compatibility.Status == "legacy-missing"','Legacy schema initialization branch missing.');
need(schema,'? InitialSchemaVersionForLegacy(module)','Legacy files must anchor to the previous revision before controlled migration.');
need(schema,'root["lastWrittenByAppVersion"] = AppVersion;','Writer-version metadata stamping missing.');
if(schema.includes('Unregistered live JSON file requires a schema registration before use'))throw new Error('Schema startup scan still treats external/specialist JSON as suite-owned live modules.');
if(schema.includes('Directory.GetFiles(dataDir'))throw new Error('Schema startup initialization must not recursively scan unrelated/external JSON under Data.');
need(schema,'Schema compatibility guarding owns only JSON files registered to the core suite modules above.','Schema ownership boundary comment missing.');
need(reliability,'json = PrepareJsonForWrite(module, json);','Atomic write path does not enforce schema metadata.');
need(reliability,'EnsureExistingTargetSchemaCompatibleForWrite(module, fullTarget, operation);','Atomic write path does not protect an existing incompatible live schema.');
need(schema,'SCHEMA_TARGET_BLOCK','Existing incompatible live schema target guard missing.');
need(schema,'IsExplicitInvalidJsonRecoveryOperation','Explicit malformed-JSON recovery exception is not constrained.');
need(reliability,'operation == "module-save" || operation == "schema-metadata-initialize"','Schema initialization is not revision guarded.');
need(storage,'schemaVersion = schema.SchemaVersion','Load envelope does not expose schema version.');
need(storage,'writeAllowed = schema.WriteAllowed','Load envelope does not expose write permission.');
need(programs,'expectedSchemaVersion = schema?.ExpectedSchemaVersion','Health status does not expose expected schema.');
need(dataCore,'if(info.writeAllowed===false)','Browser save path does not honor schema read-only state.');
need(shell,'<th>Schema</th>','Data Health live-file table does not display schema state.');
need(workflow,'node tools/validate-schema-compatibility.js','Windows workflow does not run schema compatibility validation.');
need(csproj,'<TargetFramework>net10.0-windows</TargetFramework>','Project must target net10.0-windows.');
need(csproj,'<Version>4.6.0</Version>','Visible application package version must be 4.6.0.');
need(csproj,'<FileVersion>4.6.0.0</FileVersion>','Windows file metadata must be 4.6.0.0.');
need(csproj,'<AssemblyVersion>4.6.0.0</AssemblyVersion>','Windows assembly metadata must be 4.6.0.0.');
need(manifest,'version="4.6.0.0"','Windows manifest identity must be four-part 4.6.0.0.');
const sdk=JSON.parse(globalJson).sdk||{};
if(sdk.version!=='10.0.400'||sdk.rollForward!=='latestPatch')throw new Error('global.json must pin the suite to .NET SDK 10.0.400 with latestPatch roll-forward.');
need(csproj,'RemoveUnusedWebView2WpfReference','WinForms build must remove the unused WebView2 WPF reference before assembly resolution.');
need(csproj,"%(Reference.Filename)' == 'Microsoft.Web.WebView2.Wpf'",'WebView2 WPF reference removal target is incomplete.');
need(workflow,'Verify .NET 10 SDK selection','Windows workflow must verify the selected .NET SDK before restore/build.');


const seeds={
  'attendance-data.json':'attendance-3',
  'roster-data.json':'roster-1',
  'tasks-data.json':'tasks-1',
  'shift-reports-data.json':'shift-reports-1',
  'shift-intelligence-data.json':'shift-intelligence-1',
  'suite-settings.json':'suite-settings-3'
};
for(const [file,expected] of Object.entries(seeds)){
  const obj=JSON.parse(read(path.join('app','seed',file)));
  if(obj.schemaVersion!==expected)throw new Error(`${file} schemaVersion expected ${expected}, got ${obj.schemaVersion}`);
  if(obj.lastWrittenByAppVersion!=='4.6.0')throw new Error(`${file} lastWrittenByAppVersion is not 4.6.0`);
}
const attendanceSeed=JSON.parse(read(path.join('app','seed','attendance-data.json')));
if(Number(attendanceSeed.pointSystem?.policy?.doctorNoteReductionPercent)!==50)throw new Error('Attendance schema-2 seed must initialize doctorNoteReductionPercent to 50.');
console.log('Schema Version & Compatibility Guarding validation PASS');
console.log('- Attendance is at schema revision 3, Suite Settings is at revision 3, and other current modules remain at revision 1');
console.log('- Legacy missing markers can be stamped safely; immediately previous schemas route to migration, older/newer incompatible schemas block writes');
console.log('- Three-part app version 4.6.0 with four-part Windows metadata retained');
console.log('- .NET 10 SDK 10.0.400 pinned, net10.0-windows targeted, and unused WebView2 WPF reference removed for clean WinForms assembly resolution');
