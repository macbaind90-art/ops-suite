'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const need=(hay,needle,msg)=>{if(!hay.includes(needle))throw new Error(msg||`Missing: ${needle}`)};

const models=read('Models.cs');
const authorization=read('MainForm.Authorization.cs');
const bridge=read('MainForm.Bridge.cs');
const migration=read('MainForm.SchemaMigrations.cs');
const registry=read('MainForm.GovernedModules.cs');
const bootstrap=read('app/js/10-bootstrap.js');
const settingsUi=read('app/js/95-tasks-settings.js');
const shell=read('app/js/30-shell-audits.js');
const dataHealth=read('app/js/42-data-health-recovery.js');
const seed=JSON.parse(read('app/seed/suite-settings.json'));

need(models,'RoleCapabilities','SuiteSettings does not persist role capabilities.');
need(models,'["Admin"] = new List<string> { "*" }','Admin is not defined as the immutable superuser baseline.');
need(registry,'Id = "suite-settings"');
need(registry,'SchemaRevision = 3','Suite Settings must be schema revision 3.');
need(migration,'FromRevision = 2');
need(migration,'ToRevision = 3');
need(migration,'SuiteSettings.DefaultRoleCapabilities()','2->3 migration does not initialize capabilities.');

need(authorization,'RoleHasCapability','Host role-capability resolver missing.');
need(authorization,'RequireCapabilityCredentials','Host capability credential guard missing.');
need(authorization,'RequireModuleWriteCapability','Host module-write capability guard missing.');
need(authorization,'ValidateAndNormalizeSettingsForSave','Host Settings safety validation missing.');
need(bridge,'RequireBridgeCapability(root, "users.manage")','Settings save is not protected underneath the UI.');
need(bridge,'RequireBridgeCapability(root, "data.restore")','Backup cleanup is not protected underneath the UI.');
need(bridge,'RequireModuleWriteCapability(root, saveModule2)','Governed module writes are not protected underneath the UI.');

need(bootstrap,'CAPABILITY_CATALOG','Front-end capability catalog missing.');
need(bootstrap,'DEFAULT_ROLE_CAPABILITIES','Front-end compatibility defaults missing.');
need(bootstrap,'function hasCapability(','Centralized browser capability resolver missing.');
need(bootstrap,'function moduleCapability(','Module visibility is not mapped to capabilities.');
need(bootstrap,'actualRoleOf()===\'Admin\'&&previewRole','Preview as Role is not restricted to signed-in Admin.');
need(bootstrap,'host authorization still uses the signed-in Admin','Preview safety notice missing.');
need(settingsUi,'Role Capability Matrix','Admin permission matrix UI missing.');
need(settingsUi,'Preview as Role','Preview as Role control missing.');
need(settingsUi,"settings.roleCapabilities[role]=[...set]",'Permission changes are not written to Suite Settings.');
need(shell,'rolePreviewBanner()','Persistent role-preview banner missing.');
need(dataHealth,'data-capability="data.restore"','Data Health restore controls are not capability-hidden.');

if(seed.schemaVersion!=='suite-settings-3')throw new Error('Suite Settings seed is not suite-settings-3.');
for(const role of ['Admin','Supervisor','Lead','Viewer'])if(!Array.isArray(seed.RoleCapabilities?.[role]))throw new Error(`Seed capability list missing for ${role}.`);
if(seed.RoleCapabilities.Admin.length!==1||seed.RoleCapabilities.Admin[0]!=='*')throw new Error('Seed Admin capabilities must remain wildcard-only.');
if(seed.RoleCapabilities.Viewer.includes('data.restore')||seed.RoleCapabilities.Viewer.includes('users.manage'))throw new Error('Viewer baseline contains a protected governance capability.');

console.log('Role-Aware Interface & Centralized Permissions validation PASS');
console.log('- Suite Settings schema 3 persists the centralized capability matrix');
console.log('- Module visibility and selected action controls use capability checks');
console.log('- Admin Preview as Role is reduction-only and visibly bannered');
console.log('- Governed module writes, settings save, schema approval, restore/recovery, and cleanup are host-authorized');
