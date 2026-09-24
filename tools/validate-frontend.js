'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const root=path.resolve(__dirname,'..');
const appRoot=path.join(root,'app');
const html=fs.readFileSync(path.join(appRoot,'index.html'),'utf8');
const scriptRefs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const expectedRefs=[
  'js/00-module-registry.js','js/10-bootstrap.js','js/20-data-core.js','js/30-shell-audits.js',
  'js/40-reports-governance.js','js/42-data-health-recovery.js','js/50-workflows-home.js','js/60-roster-schedule.js',
  'js/70-training-uniforms.js','js/80-attendance.js','js/82-attendance-points.js','js/90-shift-operations.js',
  'js/95-tasks-settings.js','js/99-startup.js'
];
if(JSON.stringify(scriptRefs)!==JSON.stringify(expectedRefs)) throw new Error('Front-end script load order does not match the v4.6.0 architecture contract.');
for(const ref of scriptRefs){if(!fs.existsSync(path.join(appRoot,ref)))throw new Error('Missing front-end script: '+ref);}
if(!fs.existsSync(path.join(appRoot,'assets','styles.css')))throw new Error('Missing app/assets/styles.css');
if(/<script>([\s\S]*?)<\/script>/.test(html))throw new Error('Inline application script detected in index.html.');
if(/<style>([\s\S]*?)<\/style>/.test(html))throw new Error('Inline application stylesheet detected in index.html.');


// v3.3.1.0 responsive UI contract: shared controls resize through CSS without page re-render churn.
const styles=fs.readFileSync(path.join(appRoot,'assets','styles.css'),'utf8');
if(!styles.includes('v3.3.1.0 Suite-wide responsive UI and control normalization'))throw new Error('Missing v3.3.1.0 responsive UI layer.');
if(!/input\[type=checkbox\][\s\S]*?width:16px!important/.test(styles)||!/input\[type=radio\][\s\S]*?width:16px!important/.test(styles))throw new Error('Checkbox/radio normalization contract missing.');
if(!/\.wrap\{width:100%;max-width:min\(var\(--page-max\),calc\(100vw - 20px\)\)/.test(styles))throw new Error('Responsive application wrap contract missing.');
if(!/\.schedule-grid\{grid-template-columns:minmax\(118px,.9fr\) repeat\(7,minmax\(100px,1fr\)\);min-width:850px/.test(styles))throw new Error('Schedule local resize/scroll contract missing.');
const taskSettingsSource=fs.readFileSync(path.join(appRoot,'js','95-tasks-settings.js'),'utf8');
const resizeHandler=(taskSettingsSource.match(/window\.addEventListener\('resize',[^;]+;/)||[''])[0];
if(!resizeHandler||resizeHandler.includes('safeRenderPages'))throw new Error('Window resize must not full-render application pages.');
const mainFormSource=fs.readFileSync(path.join(root,'MainForm.cs'),'utf8');
if(!mainFormSource.includes('MinimumSize = new System.Drawing.Size(900, 600);'))throw new Error('Windows minimum-size responsive contract missing.');

// v3.4.0.0 data reliability contract: critical shared JSON writes use one validated transaction service.
const reliabilityPath=path.join(root,'MainForm.DataReliability.cs');
if(!fs.existsSync(reliabilityPath))throw new Error('Missing MainForm.DataReliability.cs atomic persistence layer.');
const reliabilitySource=fs.readFileSync(reliabilityPath,'utf8');
const storageSource=fs.readFileSync(path.join(root,'MainForm.Storage.cs'),'utf8');
const backupSource=fs.readFileSync(path.join(root,'MainForm.Backups.cs'),'utf8');
const programsSource=fs.readFileSync(path.join(root,'MainForm.Programs.cs'),'utf8');
for(const token of ['WriteJsonAtomically','FileOptions.WriteThrough','stream.Flush(true)','File.Replace(tempPath, fullTarget','Sha256File(tempPath)','Sha256File(fullTarget)','CreateSafetyBackup','WriteDataReliabilityAudit']){
  if(!reliabilitySource.includes(token))throw new Error('Atomic persistence contract missing: '+token);
}
if(!reliabilitySource.includes('Normal save is blocked so damaged data is not silently overwritten'))throw new Error('Malformed-live-file overwrite guard missing.');
if(!storageSource.includes('WriteJsonAtomically("suite-settings"'))throw new Error('Settings save is not routed through atomic persistence.');
if(!storageSource.includes('DataWriteOutcome result = WriteJsonAtomically(module, path, json, "module-save"'))throw new Error('Module save is not routed through atomic persistence.');
if(!storageSource.includes('Source = "live-invalid"'))throw new Error('Invalid live JSON load status is not preserved.');
if(!backupSource.includes('WriteJsonAtomically(module, livePath, json, "restore-backup", "pre-restore")'))throw new Error('Restore path is not routed through atomic persistence.');
if(!programsSource.includes('integrityStatus = integrity.Status')||!programsSource.includes('sha256 = integrity.Sha256'))throw new Error('Data Health integrity status contract missing.');
if(storageSource.includes('File.Copy(tempPath, path, true)'))throw new Error('Legacy temp-file copy-over-live persistence returned.');


// v3.4.1.0 stale-write contract: browser load revisions must be returned to the host on save,
// and the host must block mismatched revisions before touching the live file.
const conflictPath=path.join(root,'MainForm.ConflictDetection.cs');
if(!fs.existsSync(conflictPath))throw new Error('Missing MainForm.ConflictDetection.cs stale-write layer.');
const conflictSource=fs.readFileSync(conflictPath,'utf8');
const bridgeSource=fs.readFileSync(path.join(root,'MainForm.Bridge.cs'),'utf8');
const dataCoreSource=fs.readFileSync(path.join(appRoot,'js','20-data-core.js'),'utf8');
const shiftOpsSource=fs.readFileSync(path.join(appRoot,'js','90-shift-operations.js'),'utf8');
for(const token of ['GetDataRevision','VerifyExpectedRevision','STALE_WRITE_CONFLICT','WriteDataConflictAudit','blocked-stale-write']){
  if(!conflictSource.includes(token))throw new Error('Stale-write contract missing: '+token);
}
if(!storageSource.includes('revision = info.Revision'))throw new Error('Module load envelope does not expose a revision fingerprint.');
if(!storageSource.includes('SaveModuleData(string module, string json, string expectedRevision)'))throw new Error('Module save does not accept an expected revision.');
if(!reliabilitySource.includes('VerifyExpectedRevision(module, fullTarget, expectedRevision, operation)'))throw new Error('Atomic write path does not enforce the loaded revision.');
const revGateIndex=reliabilitySource.indexOf('VerifyExpectedRevision(module, fullTarget, expectedRevision, operation)');
const backupIndex=reliabilitySource.indexOf('backupPath = CreateSafetyBackup(module, fullTarget, backupKind)');
if(revGateIndex<0||backupIndex<0||revGateIndex>backupIndex)throw new Error('Stale-write gate must run before the live-file safety backup/replacement path.');
if(!bridgeSource.includes('expectedRevision2 = savePayload.TryGetProperty("expectedRevision"'))throw new Error('Desktop bridge does not receive the browser loaded revision.');
if(!bridgeSource.includes('revision = GetDataRevision(restoredLivePath).Token'))throw new Error('Restore response does not refresh the revision token.');
if(!dataCoreSource.includes("SuiteBridge.send('suite:saveModuleData2',{module,json,expectedRevision},{authorization:authorizationEnvelope()})"))throw new Error('Browser save path does not send expectedRevision and signed-in authorization.');
if(!dataCoreSource.includes('showDataConflictModal')||!dataCoreSource.includes('exportConflictCopy')||!dataCoreSource.includes('reloadModuleAfterConflict'))throw new Error('Controlled stale-conflict recovery UI is incomplete.');
if(!shiftOpsSource.includes("saveModuleDataStrict('shift-reports',shiftReports)")||!shiftOpsSource.includes("saveModuleDataStrict('shift-intelligence',shiftIntel)"))throw new Error('Shift Operations bypasses revision-aware persistence.');

function element(){return {innerHTML:'',textContent:'',value:'',checked:false,dataset:{},style:{setProperty(){},display:''},classList:{add(){},remove(){},toggle(){},contains(){return false}},appendChild(){},remove(){},click(){},focus(){},setAttribute(){},getAttribute(){return null},querySelector(){return null},querySelectorAll(){return []},insertAdjacentHTML(){},files:[],contentWindow:{location:{reload(){}}}};}
const elements=new Map();
const document={
  documentElement:{clientWidth:1500,clientHeight:950,setAttribute(){},style:{setProperty(){}}},body:element(),
  getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},
  querySelector(){return null;},querySelectorAll(){return [];},createElement(){return element();},addEventListener(){}
};
const context={console,document,navigator:{clipboard:{writeText:async()=>{}}},location:{reload(){}},fetch:async()=>({text:async()=>'',arrayBuffer:async()=>new ArrayBuffer(0)}),FileReader:function(){},Blob:function(){},URL:{createObjectURL(){return 'blob:';},revokeObjectURL(){}},setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},confirm(){return true;},prompt(){return '';},alert(){},Date,Math,JSON,Set,Map,Array,Object,String,Number,Boolean,RegExp,Error,Promise,Intl,parseInt,parseFloat,isNaN,encodeURIComponent,decodeURIComponent};
context.window=context;context.window.chrome=null;context.window.innerWidth=1500;context.window.innerHeight=950;context.window.addEventListener=()=>{};context.window.open=()=>({document:{write(){},close(){}},print(){},focus(){}});
vm.createContext(context);

const startup='js/99-startup.js';
for(const rel of scriptRefs.filter(x=>x!==startup)) vm.runInContext(fs.readFileSync(path.join(appRoot,rel),'utf8'),context,{filename:rel});
const evalx=code=>vm.runInContext(code,context);
const seed=name=>JSON.parse(fs.readFileSync(path.join(appRoot,'seed',name),'utf8'));
evalx(`attendance=${JSON.stringify(seed('attendance-data.json'))}; normalizeAttendance(); roster=${JSON.stringify(seed('roster-data.json'))}; normalizeRoster(); tasks=${JSON.stringify(seed('tasks-data.json'))}; normalizeTasks(); shiftReports=${JSON.stringify(seed('shift-reports-data.json'))}; normalizeShiftReports(); shiftIntel=${JSON.stringify(seed('shift-intelligence-data.json'))}; normalizeShiftIntel(); settings.users=DEFAULT_USERS.map(x=>({...x})); currentUser=settings.users[0]; env={user:'Validation',machine:'Node',version:'4.6.0'}; unlocked=true;`);

const required=evalx('requiredFunctionFailures()');
if(required.length)throw new Error('Required render/action function failure: '+JSON.stringify(required));
const expectedModules=['bootstrap','data-core','shell-audits','reports-governance','data-health-recovery','workflows-home','roster-schedule','training-uniforms','attendance','shift-operations','tasks-settings'];
const registry=evalx(`PWADCModuleRegistry.validate(${JSON.stringify(expectedModules)})`);
if(!registry.ok||registry.unexpected.length)throw new Error('Front-end module registry failure: '+JSON.stringify(registry));

const major=['home','start-here','attendance','roster','employee-profile','training','office-supplies','shift-reports','shift-intelligence','reports','settings','tasks','data-health','restore','change-log','other-programs'];
for(const id of major){const out=evalx(`renderModule(${JSON.stringify(id)})`);if(typeof out!=='string'||out.length<20)throw new Error('Major module render failed: '+id);}

// v4.6.0: render a real linked Employee Profile, not just the empty profile shell.
const linkedProfileTest=evalx(`(()=>{
  const r=(roster.employees||[]).find(x=>attendanceEmployeeForRoster(x));
  if(!r)return {ok:false,reason:'No roster employee linked to Attendance seed'};
  const ae=attendanceEmployeeForRoster(r);
  attendance.attendance=attendance.attendance||{};attendance.attendance[String(ae.id)]=attendance.attendance[String(ae.id)]||{};
  if(!Object.keys(attendance.attendance[String(ae.id)]).length)attendance.attendance[String(ae.id)]['2026-09-01']='P';
  activeEmployeeProfileId=String(r.id);
  const out=renderEmployeeProfile();
  return {ok:typeof out==='string'&&out.includes('Employee Profile')&&out.includes(fullName(r)),name:fullName(r),length:out.length};
})()`);
if(!linkedProfileTest.ok)throw new Error('Linked Employee Profile render validation failed: '+JSON.stringify(linkedProfileTest));
for(const view of ['daily','grid','review','medical','actions','audit']){const out=evalx(`activeAttView='${view}'; renderAttendance()`);if(typeof out!=='string'||out.length<20)throw new Error('Attendance render failed: '+view);}

const attendanceActionReportTest=evalx(`(()=>{
  reportDateStart='2026-03-01';reportDateEnd='2026-06-04';attendanceActionShiftFilter='All';attendanceActionLevelFilter='All';attendanceActionStatusFilter='All';
  const data=attendanceActionReportRows();
  let captured={};const oldShow=showReport;
  showReport=(title,subtitle,body,orientation)=>{captured={title,subtitle,body,orientation};};
  reportAttendanceAction(false);showReport=oldShow;
  const csv=attendanceActionReportCsvRows();
  attendanceActionStatusFilter='Open Attention';reportDateStart='';reportDateEnd='';
  const row=data.rows[0]||{};
  return {ok:data.range.valid&&data.rows.length>0&&Number.isFinite(row.pointsAdded)&&Number.isFinite(row.pointsReduced)&&captured.title==='Attendance Action Report'&&captured.orientation==='landscape'&&captured.body.includes('Attendance Management Action Queue')&&Array.isArray(csv)&&csv.some(r=>Array.isArray(r)&&r.includes('Management Action')),rows:data.rows.length};
})()`);
if(!attendanceActionReportTest.ok)throw new Error('Attendance Action Report runtime validation failed: '+JSON.stringify(attendanceActionReportTest));

const attendanceTrendRiskReportTest=evalx(`(()=>{
  reportDateStart='2026-03-07';reportDateEnd='2026-06-04';attendanceTrendShiftFilter='All';attendanceTrendGroupBy='Week';attendanceTrendFocus='Point-Bearing Events';
  const data=attendanceTrendReportData();
  let captured={};const oldShow=showReport;
  showReport=(title,subtitle,body,orientation)=>{captured={title,subtitle,body,orientation};};
  reportAttendanceTrendRisk(false);showReport=oldShow;
  const csv=attendanceTrendReportCsvRows();
  const sampleName=(attendance.employees||[])[0]?.name||'__no_employee__';
  reportDateStart='';reportDateEnd='';attendanceTrendShiftFilter='All';attendanceTrendGroupBy='Week';attendanceTrendFocus='Point-Bearing Events';
  return {ok:data.range.valid&&data.range.days===90&&data.buckets.length>=12&&data.current.pointEvents>0&&Array.isArray(data.shiftRows)&&data.shiftRows.length>0&&['Rising','Stable','Falling'].includes(data.signal.label)&&captured.title==='Attendance Trend & Risk Report'&&captured.orientation==='landscape'&&captured.body.includes('Period Trend')&&captured.body.includes('Current Period by Shift')&&!captured.body.includes(sampleName)&&Array.isArray(csv)&&csv.some(r=>Array.isArray(r)&&r.includes('Corrective Thresholds Triggered'))&&!csv.some(r=>Array.isArray(r)&&r.includes('Employee')),buckets:data.buckets.length,pointEvents:data.current.pointEvents,signal:data.signal.label};
})()`);
if(!attendanceTrendRiskReportTest.ok)throw new Error('Attendance Trend & Risk Report runtime validation failed: '+JSON.stringify(attendanceTrendRiskReportTest));

// Attendance point behavior is validated by dedicated v3.5 regression validators.

for(const view of ['roster','schedule','training','uniforms','analytics']){const out=evalx(`activeRosterView='${view}'; renderRoster()`);if(typeof out!=='string'||out.length<20)throw new Error('Roster render failed: '+view);}

// Roster printing must support a hand-picked employee group with name/EID search.
const rosterEmployeePrintScopeTest=evalx(`(()=>{
  const emps=(roster.employees||[]).slice(0,2);
  if(emps.length<2)return {ok:false,reason:'Need two roster employees in seed'};
  const [first,second]=emps;
  const oldQuery=document.querySelectorAll,oldPrint=printHtmlDirect,oldClose=closeModal,oldModal=showModal;
  let modal='',captured={};
  showModal=html=>{modal=String(html||'');};
  openRosterPrintModal();
  document.getElementById('rpScope').value='employees';
  document.querySelectorAll=sel=>sel==='.rpCol:checked'?[{value:'Name'},{value:'EID'},{value:'Rank'},{value:'Shift'}]:sel==='.rpEmployee:checked'?[{value:String(second.id)}]:[];
  printHtmlDirect=(title,body,orientation)=>{captured={title,body,orientation};};
  closeModal=()=>{};
  printRosterCustom();
  document.querySelectorAll=oldQuery;printHtmlDirect=oldPrint;closeModal=oldClose;showModal=oldModal;
  return {ok:modal.includes('Selected employees') && modal.includes('Start typing name or employee number') && modal.includes('rpEmployee') && captured.body.includes(fullName(second)) && !captured.body.includes(fullName(first)) && captured.body.includes('Selected employees (1)')===false && captured.body.includes(fullName(second)+' · 1 employee(s)'),first:fullName(first),second:fullName(second),modalPicker:modal.includes('rpEmployee'),orientation:captured.orientation};
})()`);
if(!rosterEmployeePrintScopeTest.ok)throw new Error('Roster selected-employee print validation failed: '+JSON.stringify(rosterEmployeePrintScopeTest));

// Schedule assignment controls: mock schedules must expose the entire active roster,
// and typeahead must match employee numbers as well as names.
const scheduleTest=evalx(`(()=>{
  const active=rosterActiveEmployees();
  if(!active.length)return {ok:false,reason:'No active roster employees in seed'};
  const sample=active.find(e=>String(e.eid||'').trim())||active[0];
  roster.scheduleDrafts=[{id:'validation-mock',name:'Validation Mock',schedule:cloneScheduleRows(roster.schedule||[])}];
  scheduleWorkspaceMode='draft';scheduleWorkspaceDraftId='validation-mock';
  const mockPool=scheduleEmployeePool('1st Shift — 0800-1600','Base');
  const eid=String(sample.eid||'').trim();
  const byEid=eid?scheduleEmployeeTypeaheadResults(eid,'1st Shift — 0800-1600','Base'):[];
  const byName=scheduleEmployeeTypeaheadResults(fullName(sample).split(/\s+/)[0],'1st Shift — 0800-1600','Base');
  scheduleWorkspaceMode='live';scheduleWorkspaceDraftId='';
  return {ok:mockPool.length===active.length && (!eid||byEid.some(e=>String(e.id)===String(sample.id))) && byName.some(e=>String(e.id)===String(sample.id)),active:active.length,mock:mockPool.length,eid,byEid:byEid.length,byName:byName.length};
})()`);
if(!scheduleTest.ok)throw new Error('Schedule mock/typeahead validation failed: '+JSON.stringify(scheduleTest));


// Schedule employee colors must remain stable per employee while avoiding equal colors
// for different employees that share a horizontal or vertical schedule border.
const scheduleColorTest=evalx(`(()=>{
  const priorSchedule=JSON.stringify(roster.schedule||[]),priorMode=scheduleWorkspaceMode,priorDraft=scheduleWorkspaceDraftId;
  roster.schedule=[
    {section:'1st Shift — 0800-1600',post:'Validation A',days:['SO Aiken, Don','SO Brewer, Jazmine','SO Aiken, Don','None','None','None','None']},
    {section:'2nd Shift — 1600-2400',post:'Validation B',days:['SO Parker, Lacey','SO Ferguson, Matt','None','None','None','None','None']}
  ];
  scheduleWorkspaceMode='live';scheduleWorkspaceDraftId='';scheduleColorCache=null;buildScheduleColorCache();
  const conflicts=scheduleAdjacentColorConflicts();
  const a=empColorFromCell('SO Aiken, Don','1st Shift — 0800-1600');
  const aRepeat=empColorFromCell('SO Aiken, Don','1st Shift — 0800-1600');
  const p=empColorFromCell('SO Parker, Lacey','2nd Shift — 1600-2400');
  const b=empColorFromCell('SO Brewer, Jazmine','1st Shift — 0800-1600');
  roster.schedule=JSON.parse(priorSchedule);scheduleWorkspaceMode='live';scheduleWorkspaceDraftId='';scheduleColorCache=null;buildScheduleColorCache();
  const seedConflicts=scheduleAdjacentColorConflicts();
  scheduleWorkspaceMode=priorMode;scheduleWorkspaceDraftId=priorDraft;scheduleColorCache=null;
  return {ok:conflicts.length===0 && seedConflicts.length===0 && a===aRepeat && a!==p && a!==b,conflicts,seedConflicts,a,aRepeat,p,b};
})()`);
if(!scheduleColorTest.ok)throw new Error('Schedule adjacency color validation failed: '+JSON.stringify(scheduleColorTest));

const source=[html,...scriptRefs.map(ref=>fs.readFileSync(path.join(appRoot,ref),'utf8'))].join('\n');
const declarations=[...source.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]);
const counts=new Map();for(const name of declarations)counts.set(name,(counts.get(name)||0)+1);
const duplicates=[...counts].filter(([,count])=>count>1);
if(duplicates.length)throw new Error('Duplicate named function declaration(s): '+JSON.stringify(duplicates));
const attrs=[...source.matchAll(/on(?:click|change|input|focus|blur|keydown|keyup|load|error)=(?:"|')([^"']+)(?:"|')/g)].map(m=>m[1]);
const targets=new Set();for(const body of attrs){for(const m of body.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g))targets.add(m[1]);}
const builtins=new Set(['confirm','prompt','alert','setTimeout','clearTimeout','parseInt','parseFloat','Number','String','Date','Array','Object','Boolean','Math','encodeURIComponent','decodeURIComponent']);
const missingTargets=[...targets].filter(name=>!counts.has(name)&&!builtins.has(name)).sort();
if(missingTargets.length)throw new Error('Inline action handler target(s) missing: '+missingTargets.join(', '));

// Validate the startup gate independently: complete registration initializes once; missing registration does not initialize.
const registrySource=fs.readFileSync(path.join(appRoot,'js','00-module-registry.js'),'utf8');
const startupSource=fs.readFileSync(path.join(appRoot,startup),'utf8');
function startupScenario(names){let initCount=0,error='';const c={window:{},console:{error(){}},Error};c.window=c;c.init=()=>{initCount++;};c.showStartupError=e=>{error=e.message;};vm.createContext(c);vm.runInContext(registrySource,c);for(const name of names)c.PWADCModuleRegistry.register(name);vm.runInContext(startupSource,c);return{initCount,error};}
const full=startupScenario(expectedModules),missing=startupScenario(expectedModules.slice(0,-1));
if(full.initCount!==1||full.error)throw new Error('Startup gate failed with a complete module set.');
if(missing.initCount!==0||!missing.error.includes('tasks-settings'))throw new Error('Startup gate did not block an incomplete module set.');

console.log(`PWADC front-end validation passed: ${major.length} major modules, 6 attendance views, 5 roster views, ${declarations.length} named functions, ${targets.size} inline action targets, ${registry.loaded.length} registered modules.`);
