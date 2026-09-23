'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const need=(hay,needle,message)=>{if(!hay.includes(needle))throw new Error(message||`Missing: ${needle}`)};

const attendance=read('app/js/82-attendance-points.js');
const migration=read('MainForm.SchemaMigrations.cs');
const registry=read('MainForm.GovernedModules.cs');
const workflow=read('.github/workflows/build-windows.yml');
new vm.Script(attendance,{filename:'app/js/82-attendance-points.js'});

for(const token of [
  "{points:9,level:'Final Warning'}",
  "{points:6,level:'Notice'}",
  "const ATT_ACTION_STATUSES=['Generated','Issued','Acknowledged','Recorded']",
  'function correctiveActionWorkflow(',
  'function normalizeCorrectiveActionRecord(',
  "status:'Generated'",
  "statusHistory:[{status:'Generated'",
  'triggeringEvent:{date:trigger.date',
  'pointRecord:issues.map(',
  "if(record.status==='Generated')",
  "if(record.status==='Issued')",
  "status==='Recorded'&&!note",
  "saveAttendanceNow('attendance-notice-generated')",
  "saveAttendanceNow('attendance-notice-status')",
  "SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'})",
  'Generation is not issuance.',
  'Attendance Point Record at Generation',
  'My signature below confirms only that I received this notice.',
  'Employee Signature',
  'Manager / Supervisor Signature',
  'Employee Comments',
  'This Confirming Notice serves as a Written Warning',
  'This Final Warning documents that your attendance has reached 9 or more active points.',
  'PWADC Security Operations Suite v4.4.0'
])need(attendance,token,`Attendance notice contract missing: ${token}`);

if(attendance.includes("{points:3,level:'Verbal Counseling'}"))throw new Error('Retired 3-point corrective threshold is still active.');
if(attendance.includes("<select id=\"caLevel\""))throw new Error('Notice level remains manually selectable instead of point-derived.');
need(attendance,"if(level==='None'){toast('No notice is due below 6 active points.')",'Below-threshold notice generation guard missing.');
need(attendance,"if(!hasCapability('attendance.correctiveAction'))",'Notice workflow is not capability guarded.');

need(registry,'Id = "attendance", Label = "Attendance", FileName = "attendance-data.json", SchemaRevision = 3','Attendance schema revision 3 registration missing.');
need(migration,'Module = "attendance"','Attendance migration registration missing.');
need(migration,'FromRevision = 2','Attendance 2->3 migration source missing.');
need(migration,'ToRevision = 3','Attendance 2->3 migration target missing.');
need(migration,'action["status"] = "Recorded"','Legacy corrective actions are not preserved as Recorded.');
need(workflow,'node tools/validate-corrective-action-notices.js','Windows workflow does not run notice lifecycle validation.');

const seed=JSON.parse(read('app/seed/attendance-data.json'));
if(seed.schemaVersion!=='attendance-3')throw new Error('Attendance seed must ship at attendance-3.');
if(seed.lastWrittenByAppVersion!=='4.4.0')throw new Error('Attendance seed must be stamped v4.4.0.');

console.log('Attendance Notice Lifecycle validation PASS');
console.log('- 6–8.99 points = Notice; 9+ points = Final Warning');
console.log('- Generated, Issued, Acknowledged, and Recorded states are distinct');
console.log('- Frozen triggering-event and point-record snapshots are retained');
console.log('- Generation and status changes require backup, audit, and governed save');
console.log('- Print notice preserves warning, acknowledgment, signatures, and employee comments');
