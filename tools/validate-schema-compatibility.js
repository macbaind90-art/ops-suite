'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const need=(hay,needle,msg)=>{if(!hay.includes(needle))throw new Error(msg||`Missing: ${needle}`)};

const schema=read('MainForm.SchemaCompatibility.cs');
const main=read('MainForm.cs');
const storage=read('MainForm.Storage.cs');
const reliability=read('MainForm.DataReliability.cs');
const programs=read('MainForm.Programs.cs');
const dataCore=read('app/js/20-data-core.js');
const shell=read('app/js/30-shell-audits.js');
const workflow=read('.github/workflows/build-windows.yml');
const csproj=read('SecurityOperationsSuite.csproj');
const manifest=read('app.manifest');

need(main,'private const string AppVersion = "4.0.0";','AppVersion must use the new three-part 4.0.0 scheme.');
need(main,'EnsureLiveSchemaMetadata();','Startup schema metadata initialization is missing.');
need(schema,'["attendance"] = 1','Attendance schema registration missing.');
need(schema,'["roster"] = 1','Roster schema registration missing.');
need(schema,'["tasks"] = 1','Tasks schema registration missing.');
need(schema,'["shift-reports"] = 1','Shift Reports schema registration missing.');
need(schema,'["shift-intelligence"] = 1','Shift Intelligence schema registration missing.');
need(schema,'["suite-settings"] = 1','Suite Settings schema registration missing.');
need(schema,'result.Status = "newer"','Newer-schema detection missing.');
need(schema,'Writes are blocked to protect newer data.','Newer-schema write protection message missing.');
need(schema,'result.Status = "older"','Older-schema migration-required detection missing.');
need(schema,'controlled migration to','Older-schema migration gate missing.');
need(schema,'root["schemaVersion"] = CurrentSchemaVersion(module);','Schema metadata stamping missing.');
need(schema,'root["lastWrittenByAppVersion"] = AppVersion;','Writer-version metadata stamping missing.');
need(schema,'Unregistered live JSON file requires a schema registration before use','Unknown live JSON files are not surfaced for schema registration.');
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
need(csproj,'<Version>4.0.0</Version>','Visible application package version must be 4.0.0.');
need(csproj,'<FileVersion>4.0.0.0</FileVersion>','Windows file metadata should retain required four-part numeric format.');
need(csproj,'<AssemblyVersion>4.0.0.0</AssemblyVersion>','Windows assembly metadata should retain required four-part numeric format.');
need(manifest,'version="4.0.0.0"','Windows manifest identity must be four-part 4.0.0.0.');

const seeds={
  'attendance-data.json':'attendance-1',
  'roster-data.json':'roster-1',
  'tasks-data.json':'tasks-1',
  'shift-reports-data.json':'shift-reports-1',
  'shift-intelligence-data.json':'shift-intelligence-1',
  'suite-settings.json':'suite-settings-1'
};
for(const [file,expected] of Object.entries(seeds)){
  const obj=JSON.parse(read(path.join('app','seed',file)));
  if(obj.schemaVersion!==expected)throw new Error(`${file} schemaVersion expected ${expected}, got ${obj.schemaVersion}`);
  if(obj.lastWrittenByAppVersion!=='4.0.0')throw new Error(`${file} lastWrittenByAppVersion is not 4.0.0`);
}
console.log('Schema Version & Compatibility Guarding validation PASS');
console.log('- All current live JSON modules registered at schema revision 1');
console.log('- Legacy missing markers can be stamped safely; older/newer formal schemas block writes');
console.log('- Three-part app version 4.0.0 with four-part Windows metadata retained');
