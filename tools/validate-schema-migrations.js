'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const need=(hay,needle,msg)=>{if(!hay.includes(needle))throw new Error(msg||`Missing: ${needle}`)};

const migration=read('MainForm.SchemaMigrations.cs');
const schema=read('MainForm.SchemaCompatibility.cs');
const registry=read('MainForm.GovernedModules.cs');
const reliability=read('MainForm.DataReliability.cs');
const storage=read('MainForm.Storage.cs');
const bridge=read('MainForm.Bridge.cs');
const main=read('MainForm.cs');
const bootstrap=read('app/js/10-bootstrap.js');
const dataCore=read('app/js/20-data-core.js');
const workflow=read('.github/workflows/build-windows.yml');
const csproj=read('SecurityOperationsSuite.csproj');

need(main,'private const string AppVersion = "4.4.0";','AppVersion must be 4.4.0.');
need(csproj,'<Version>4.4.0</Version>','Project package version must be 4.4.0.');
need(main,'EnsureDailyLastKnownGoodSnapshot();','Daily LKG must remain part of startup.');
need(main,'EnsureLiveSchemaMetadata();','Schema metadata initialization must remain part of startup.');
need(main,'ProcessStartupSchemaMigrations();','Controlled schema migration processing must run at startup.');
const lkgPos=main.indexOf('EnsureDailyLastKnownGoodSnapshot();');
const schemaPos=main.indexOf('EnsureLiveSchemaMetadata();');
const migrationPos=main.indexOf('ProcessStartupSchemaMigrations();');
if(!(lkgPos>=0 && schemaPos>lkgPos && migrationPos>schemaPos))throw new Error('Startup order must be LKG -> schema metadata -> migrations.');

need(schema,'result.Status = "previous"','Immediately previous schema state missing.');
need(schema,'result.Status = "legacy-too-old"','Older-than-previous schemas must be blocked for manual review.');
need(schema,'actualRevision == expectedRevision - 1','Current + immediately previous support policy missing.');
need(schema,'compatibility.Status == "previous" && IsSchemaMigrationOperation(operation)','Atomic target guard does not allow only controlled previous-schema migration replacement.');
need(reliability,'IsSchemaMigrationOperation(operation)','Migration writes are not revision guarded by the atomic persistence service.');

need(migration,'private sealed class SchemaMigrationDefinition','Migration definition contract missing.');
need(migration,'public string Risk { get; init; } = "minor"','Minor/major migration risk classification missing.');
need(migration,'public bool BusinessMeaningChanged','Business-rule change flag missing.');
need(migration,'BuildSchemaMigrationDefinitions()','Migration registry missing.');
const attendanceRegistryLine=registry.split(/\r?\n/).find(x=>x.includes('Id = "attendance"'))||'';
need(attendanceRegistryLine,'SchemaRevision = 3','Attendance current schema must be revision 3 in the governed-module registry.');
const settingsRegistryLine=registry.split(/\r?\n/).find(x=>x.includes('Id = "suite-settings"'))||'';
need(settingsRegistryLine,'SchemaRevision = 3','Suite Settings current schema must be revision 3 in the governed-module registry.');
need(schema,'GovernedModule(module)','Schema migration compatibility must use the governed-module registry.');
need(migration,'Module = "attendance"','Attendance 1->2 migration is not registered.');
need(migration,'FromRevision = 1','Attendance migration source revision missing.');
need(migration,'ToRevision = 2','Attendance migration target revision missing.');
need(migration,'Risk = "minor"','Attendance 1->2 migration must remain low-risk/automatic.');
need(migration,'doctorNoteReductionPercent','Attendance migration does not initialize configurable doctor-note reduction.');
need(migration,'note["editHistory"] = new JsonArray()','Attendance migration does not initialize doctor-note edit history.');
need(migration,'FromRevision = 2','Attendance notice-lifecycle migration source revision missing.');
need(migration,'ToRevision = 3','Attendance notice-lifecycle migration target revision missing.');
need(migration,'action["status"] = "Recorded"','Attendance notice-lifecycle migration does not preserve legacy actions as Recorded.');
need(migration,'action["noticeType"] = noticeType','Attendance notice-lifecycle migration does not normalize notice types.');
need(migration,'Module = "suite-settings"','Suite Settings 1->2 migration is not registered.');
need(migration,'root.Remove("CoverageRequirements")','Suite Settings migration does not retire legacy coverage requirements.');
need(migration,'FromRevision = 2','Suite Settings role-capability migration source revision missing.');
need(migration,'ToRevision = 3','Suite Settings role-capability migration target revision missing.');
need(migration,'SuiteSettings.DefaultRoleCapabilities()','Suite Settings 2->3 migration does not initialize the role capability matrix.');
need(migration,'IsMajorMigration(definition)','Major migration branch missing.');
need(migration,'summary.Pending.Add(preview)','Major migrations must wait for Admin approval.');
need(migration,'ExecuteSchemaMigration(definition, preview, "SYSTEM", "automatic-minor")','Minor migrations must be able to run automatically.');

need(migration,'EnsurePreMigrationBackup','Pre-migration backup creation missing.');
need(migration,'__pre-migration__','Pre-migration backup naming/identity missing.');
need(migration,'Sha256File(backupPath)','Backup hash verification missing.');
need(migration,'definition.Transform(working)','In-memory transform stage missing.');
need(migration,'ValidateJsonPayload(migratedJson','Migrated staging JSON validation missing.');
need(migration,'VerifyMigrationFingerprintPreserved','Record-count/key-identity preservation validation missing.');
need(migration,'WriteJsonAtomically(','Migration does not use protected atomic persistence.');
need(migration,'File.ReadAllText(livePath)','Post-write reopen-from-disk verification missing.');
need(migration,'post-migration disk verification','Post-write disk fingerprint verification missing.');
need(migration,'RestorePreMigrationBackupDirect','Automatic rollback path missing.');
need(migration,'The pre-migration state was restored.','Rollback result is not surfaced.');

need(migration,'migration-history.jsonl','Append-only migration history file missing.');
need(migration,'FileMode.Append','Migration history must append rather than rewrite.');
need(migration,'appendOnly = true','Migration history API must identify history as append-only.');
need(migration,'approvalMode','Migration history must record automatic vs Admin approval mode.');
need(migration,'recordCounts = preview.RecordCounts','Migration history must retain record-count context.');

need(migration,'schema-migration.lock','Migrations must use one suite-wide coordinator so modules process one at a time.');
if(migration.includes('schema-migration-" + definition.Module'))throw new Error('Migration coordination is still per-module instead of one-at-a-time suite-wide.');
need(migration,'SourceSha256','Migration preview/source-change protection missing.');
need(migration,'Migration source changed after preview','Stale preview protection missing.');
need(migration,'RequireMigrationAdmin','Admin authorization gate missing.');
need(migration,'RequireCapabilityCredentials(userId, pin, "schema.manage")','Host-side schema capability verification missing.');

need(bridge,'suite:getMigrationStatus','Migration status bridge endpoint missing.');
need(bridge,'suite:getMigrationHistory','Migration history bridge endpoint missing.');
need(bridge,'suite:approveSchemaMigration','Admin migration approval bridge endpoint missing.');
need(dataCore,'showNextSchemaMigrationModal','Admin migration preview UI missing.');
need(dataCore,'Records Checked Before Migration','Migration preview does not surface affected record counts.');
need(dataCore,'Cancel / Keep Read-Only','Major migration cancel/read-only behavior missing.');
need(dataCore,'approvePendingSchemaMigration','Admin approval action missing.');
need(dataCore,'reloadDataModuleAfterMigration','Migrated module is not reloaded after approval.');
need(bootstrap,'migrationModuleNeedsAdmin','Role-aware migration module gating missing.');
need(bootstrap,"if(roleOf()!=='Admin'&&migrationModuleNeedsAdmin(migrationModule))return false",'Non-Admins can still enter modules pending Admin migration.');
need(bootstrap,'handlePendingSchemaMigrationsAfterLogin','Login does not surface pending major migrations.');
need(bootstrap,"SuiteBridge.send('suite:getMigrationStatus')",'Startup UI does not retrieve migration state.');

need(storage,'Schema migration framework active','Data health check does not verify migration framework presence.');
need(workflow,'node tools/validate-schema-migrations.js','Windows workflow does not run migration regression validation.');

console.log('Controlled Schema Migration Framework validation PASS');
console.log('- Startup order: Daily LKG -> schema metadata -> one-at-a-time migration queue');
console.log('- Minor migrations automatic; major/business-rule migrations require verified Admin approval');
console.log('- Pre-migration backup, staging validation, atomic write, disk reopen verification, and rollback are present');
console.log('- Current + previous schema support policy and append-only migration history are enforced');
console.log('- Non-Admin users cannot enter modules awaiting Admin migration approval');

const attendanceSeed=JSON.parse(read('app/seed/attendance-data.json'));
if(attendanceSeed.schemaVersion!=='attendance-3')throw new Error('Attendance seed must ship at attendance-3.');
const settingsSeed=JSON.parse(read('app/seed/suite-settings.json'));
if(settingsSeed.schemaVersion!=='suite-settings-3')throw new Error('Suite Settings seed must ship at suite-settings-3.');
if(!settingsSeed.RoleCapabilities||!Array.isArray(settingsSeed.RoleCapabilities.Admin)||settingsSeed.RoleCapabilities.Admin[0]!=='*')throw new Error('Suite Settings seed must include immutable Admin capability defaults.');
if('CoverageRequirements' in settingsSeed||'coverageRequirements' in settingsSeed)throw new Error('Suite Settings seed still contains legacy coverage requirements.');
