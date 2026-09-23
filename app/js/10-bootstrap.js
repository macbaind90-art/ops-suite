/* PWADC Security Operations Suite v4.5.0 | module: bootstrap */

'use strict';
const MODULES=[{id:'home',label:'Home'},{id:'start-here',label:'Start Here'},{id:'attendance',label:'Attendance'},{id:'roster',label:'Roster'},{id:'employee-profile',label:'Employee Profile'},{id:'training',label:'Training'},{id:'office-supplies',label:'Office Supplies'},{id:'shift-reports',label:'Shift Reports'},{id:'shift-intelligence',label:'Shift Intelligence'},{id:'reports',label:'Reports'},{id:'settings',label:'Settings'},{id:'tasks',label:'Task Tracker'},{id:'data-health',label:'Data Health & Recovery'},{id:'restore',label:'Restore Center'},{id:'change-log',label:'Change Log'},{id:'other-programs',label:'Other Programs'}];
const REQUIRED_FUNCTIONS=[
  {module:'Shell / Navigation',names:['renderShell','renderPages','renderModule','safeRenderPages','navigate']},
  {module:'Dashboard',names:['renderHome','renderStartHere','printStartHere']},
  {module:'Attendance',names:['renderAttendance','renderPointDaily','renderPointGrid','renderPointReview','renderPointCorrectiveActions','renderAudit','openAttendanceRemoveModal','openPointAdjustmentModal','openCorrectiveActionModal']},
  {module:'Roster / Schedule',names:['renderRoster','renderRosterList','renderRosterSchedule','renderScheduleWorkspaceBanner','renderScheduleSection','renderScheduleRow','renderScheduleCell','openMockScheduleManager','openCreateMockScheduleModal','openClearScheduleModal','copyScheduleCell','pasteScheduleCell','renderRosterUniforms','renderRosterAnalytics']},
  {module:'Training',names:['renderTrainingPage','renderTrainingMatrix','renderTrainingCell','openTrainingRecordModal','openTrainingForEmployee']},
  {module:'Employee Profile',names:['renderEmployeeProfile','openEmployeeProfile']},
  {module:'Office Supplies',names:['renderOfficeSupplies','addOfficeSupply','saveOfficeSupplyRow','removeOfficeSupply','restoreOfficeSupply']},
  {module:'Shift Reports',names:['renderShiftReports','importShiftReportFile','parseShiftReportText','saveShiftReportsNow','updateShiftIssueStatus','reviewShiftReportsInIntel','renderShiftSourceSummary']},
  {module:'Shift Intelligence',names:['renderShiftIntelligence','normalizeShiftIntel','loadShiftIntel','saveShiftIntelNow','generateShiftIntelIntake','approveShiftIntelNewIssue','linkShiftIntelItem','updateShiftIntelIssueStatus','renderShiftIntelDetail','selectShiftIntelIntake','selectShiftIntelIssue']},
  {module:'Reports',names:['renderReports','viewReport','printReport','exportReportCSV','reportDoc','governanceNav','reportCatalogItem']},
  {module:'Task Tracker',names:['renderTasks','openWeeklyTaskEmail','generateWeeklyUpdate','copyWeeklyTaskText']},
  {module:'Data Health / Restore',names:['renderDataHealth','renderRestoreCenter','computeDataHealth','moduleInventoryPanel','dataHealthFindingsHtml','restoreBackupListHtml']},
  {module:'Settings / Change Log',names:['renderSettingsPage','renderSettings','renderChangeLog','setSettingsSection','changeLogRisk']},
  {module:'Other Programs',names:['renderOtherPrograms','renderAuditTool']}
];
function functionExistsByName(name){
  try{return typeof eval(name)==='function';}
  catch(_){return false;}
}
function requiredFunctionFailures(){
  const out=[];
  for(const group of REQUIRED_FUNCTIONS){
    for(const name of group.names){
      if(!functionExistsByName(name))out.push({module:group.module,name});
    }
  }
  return out;
}
function validateRequiredFunctions(phase='startup'){
  const missing=requiredFunctionFailures();
  if(missing.length){
    const first=missing[0];
    const err=new Error(`${first.name} is not defined`);
    err.name='SuiteRenderGuardError';
    err.module=first.module;
    err.missingFunction=first.name;
    err.phase=phase;
    err.details=missing.map(x=>`${x.module}: ${x.name}`).join('\\n');
    throw err;
  }
  return true;
}
function qaGuardrailPanel(){
  const missing=requiredFunctionFailures();
  const rows=REQUIRED_FUNCTIONS.map(g=>{
    const bad=g.names.filter(n=>!functionExistsByName(n));
    return `<tr><td class="name"><strong>${esc(g.module)}</strong></td><td>${esc(g.names.length+' required function(s)')}</td><td>${bad.length?'<span class="chip critical">Missing: '+esc(bad.join(', '))+'</span>':'<span class="chip ok">OK</span>'}</td></tr>`;
  }).join('');
  const registry=(window.PWADCModuleRegistry&&PWADCModuleRegistry.status)?PWADCModuleRegistry.status():{loaded:[]};
  const expected=['bootstrap','data-core','shell-audits','reports-governance','data-health-recovery','workflows-home','roster-schedule','training-uniforms','attendance','shift-operations','tasks-settings'];
  const moduleCheck=(window.PWADCModuleRegistry&&PWADCModuleRegistry.validate)?PWADCModuleRegistry.validate(expected):{ok:false,missing:expected};
  return `<div class="card"><div class="card-title">Render Safety / QA Guardrails</div><div class="notice">v3.3.0 modularizes the front end behind an ordered startup registry while retaining the existing render-function guardrails.</div><div class="health-row"><span>Front-End Module Registry</span><span class="${moduleCheck.ok?'ok':'bad'}">${moduleCheck.ok?esc(registry.loaded.length+' / '+expected.length+' loaded'):'Missing: '+esc((moduleCheck.missing||[]).join(', '))}</span></div><div class="table-wrap" style="max-height:none;margin-top:10px"><table><thead><tr><th>Module Area</th><th>Required Functions</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div><div class="mini-note">Current result: ${missing.length?missing.length+' missing function(s)':'All required render functions found'}.</div></div>`;
}

const SHIFT_ORDER=['3rd Shift','1st Shift','2nd Shift','Gate','Dock','Reception'];
const DEFAULT_SETTINGS={theme:'dark',defaultModule:'home',pin:'1234',dataRoot:'\\\\pig-fs\\Security\\MacBain\\Security Operations Suite',backupRetentionDays:180,ftLoadedRate:0.33,ptLoadedRate:0.20,tempLoadedRate:0.35,monthlyMultiplier:4.333,annualMultiplier:52,fteBaselineHours:40};
const DEFAULT_USERS=[
  {id:'admin',username:'David',displayName:'David MacBain',role:'Admin',pin:'6268',active:true},
  {id:'supervisor',username:'Supervisor',displayName:'Supervisor',role:'Supervisor',pin:'1234',active:false},
  {id:'lead',username:'Lead',displayName:'Lead',role:'Lead',pin:'1111',active:false},
  {id:'viewer',username:'Viewer',displayName:'Viewer',role:'Viewer',pin:'0000',active:false}
];
const CAPABILITY_CATALOG=[
  ['Attendance','attendance.view','View attendance'],['Attendance','attendance.edit','Edit attendance'],['Attendance','attendance.managePolicy','Manage attendance policy'],['Attendance','attendance.adjustPoints','Adjust points'],['Attendance','attendance.correctiveAction','Manage attendance notices'],
  ['People','roster.view','View roster and profiles'],['People','roster.edit','Edit roster'],['Schedule','schedule.view','View live schedule'],['Schedule','schedule.edit','Edit schedules'],['Schedule','schedule.publish','Publish a mock schedule'],
  ['Training','training.view','View training'],['Training','training.manage','Manage training'],['Uniforms','uniforms.view','View uniforms'],['Uniforms','uniforms.manage','Manage uniforms'],
  ['Supplies','supplies.view','View office supplies'],['Supplies','supplies.manage','Manage office supplies'],['Shift Operations','shiftReports.view','View shift reports'],['Shift Operations','shiftReports.manage','Manage shift reports'],['Shift Operations','shiftIntelligence.view','View shift intelligence'],['Shift Operations','shiftIntelligence.manage','Manage shift intelligence'],
  ['Tasks & Reports','tasks.view','View tasks'],['Tasks & Reports','tasks.manage','Manage tasks'],['Tasks & Reports','reports.view','View reports'],['Tasks & Reports','reports.viewPay','View individual pay'],
  ['Governance','dataHealth.view','View Data Health'],['Governance','data.restore','Restore or delete protected data'],['Governance','schema.manage','Approve schema migrations'],['Governance','users.manage','Manage settings, users, and permissions'],['Governance','audit.view','View governance audit'],['Governance','programs.launch','Launch standalone programs'],
  ['Emergency (reserved)','emergency.execute','Execute emergency protocols'],['Emergency (reserved)','emergency.manage','Manage emergency protocols']
];
const DEFAULT_ROLE_CAPABILITIES={Admin:['*'],Supervisor:['attendance.view','attendance.edit','attendance.adjustPoints','attendance.correctiveAction','roster.view','roster.edit','schedule.view','schedule.edit','training.view','training.manage','uniforms.view','uniforms.manage','supplies.view','supplies.manage','shiftReports.view','shiftReports.manage','shiftIntelligence.view','shiftIntelligence.manage','tasks.view','tasks.manage','reports.view','programs.launch','audit.view'],Lead:['attendance.view','attendance.edit','attendance.adjustPoints','attendance.correctiveAction','roster.view','roster.edit','schedule.view','schedule.edit','training.view','training.manage','uniforms.view','uniforms.manage','supplies.view','supplies.manage','shiftReports.view','shiftReports.manage','shiftIntelligence.view','shiftIntelligence.manage','tasks.view','tasks.manage','programs.launch'],Viewer:['roster.view','schedule.view','training.view','uniforms.view','supplies.view','programs.launch']};
let settings={...DEFAULT_SETTINGS,roleCapabilities:JSON.parse(JSON.stringify(DEFAULT_ROLE_CAPABILITIES))},env={},schemaMigrationStatus={pending:[],blocked:[],completedAutomatically:[],warnings:[]},unlocked=false,pinInput='',loginUserId='admin',currentUser=null,previewRole='',activeModule='home',activeAttView='daily',activeCode='P',saveTimer=null,rosterSaveTimer=null,showBlanks=false,entryDate=new Date().toISOString().slice(0,10),entryShift='All',gridEnd=new Date().toISOString().slice(0,10),selectedEntryEmpId='',selectedGridEmpId='',selectedGridDate='',activeRosterView='roster',rosterSearch='',rosterShiftFilter='all',rosterRankFilter='all',rosterTypeFilter='all',rosterSortKey='shift',rosterSortDir='asc',scheduleEditContext=null,scheduleClipboard=null,scheduleWorkspaceMode='live',scheduleWorkspaceDraftId='',attendance={employees:[],attendance:{},notes:{},audit:[],correctiveActions:[],recordEdits:[],pointAdjustments:[],medicalNotes:[],tardyReclassifications:{},autoOff:{},workdayBasis:{},pointSystem:{}},roster={employees:[],schedule:[],trainingTopics:[],trainingRecords:[],audit:[],nextId:1,nextTrainingTopicId:1,nextTrainingRecordId:1},tasks={tasks:[],audit:[],nextId:1,lastSaved:''},shiftReports={reports:[],issues:[],audit:[],nextIssueId:1,lastSaved:''},shiftIntel={issues:[],intake:[],reference:[],audit:[],nextIssueId:1,nextIntakeId:1,lastSaved:''},shiftIntelSearch='',shiftIntelStatusFilter='active',shiftIntelBucketFilter='all',shiftIntelCategoryFilter='all',shiftIntelSelectedIssueId='',shiftReportSearch='',shiftReportStatusFilter='open',shiftReportTypeFilter='all',shiftReportShiftFilter='all',shiftReportLastImport=null,taskSearch='',taskStatusFilter='all',taskPriorityFilter='all',taskCategoryFilter='all',taskEditId=null,taskSaveTimer=null,showArchivedRoster=false,restoreSelectedModule='attendance',restoreBackups=[],restoreLoading=false,changeLogModule='all',changeLogSearch='',employeeSearch='',activeEmployeeProfileId='',backupStatusRows=null,moduleFileStatusRows=null,moduleLoadInfo={},backupManager=null,backupCleanupPreview=null,backupCleanupModule='all',restorePreview=null,supplySearch='',supplyCategoryFilter='all',supplyStatusFilter='all',showArchivedSupplies=false,reportDateStart='',reportDateEnd='',reportCenterSelection='executive',reportCenterCategory='Recommended',attendanceActionShiftFilter='All',attendanceActionLevelFilter='All',attendanceActionStatusFilter='Open Attention',dataHealthFindingFilter='all',settingsActiveSection='general',changeLogLimit=100;
let shiftIntelSelectedIntakeId='',shiftIntelDetailMode='intake';
const CODES=[['P','Present'],['T<5','Tardy Less Than 5 Minutes'],['T5-14','Tardy 5-14 Minutes'],['T15+','Tardy 15 Minutes or More'],['CO','Call Off (Auto CO1/CO2)'],['NCNS','No Call No Show'],['LE','Left Early'],['EIA','Clocked In Early w/o Approval'],['ALE','Approved Left Early'],['AT','Approved Tardy'],['V','Vacation'],['O','Off'],['AA','Approved Absence'],['NE','Not Employed']];

const OTHER_PROGRAMS=[
  {id:'badge',title:'Badge Audit',folder:'Badge Audit',file:'PWADC_Badge_Audit_Tool.html',purpose:'Punch detail vs reader log audit with drag/drop, XLSX parsing, reader logs, findings, and exports.'},
  {id:'amag',title:'AMAG Audit',folder:'AMAG Audit',file:'PWADC_AMAG_Audit_Tool.html',purpose:'AMAG SymmetryWEB histoper.txt review for badge/user events, inactive badge activity, and exportable report.'},
  {id:'access',title:'Access Audit',folder:'Access Audit',file:'PWADC_Access_Audit_Tool.html',purpose:'SymmetryWEB access-code exports compared against the Badge Access Master Tracking Database.'}
];

const ISSUE_NOTE_CODES=new Set(['T5-14','T15+','CO','NCNS','LE','EIA']);const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SuiteBridge={seq:0,pending:{},send(type,payload={},extra={}){return new Promise((resolve,reject)=>{const id='r'+(++this.seq);this.pending[id]={resolve,reject};if(window.chrome&&window.chrome.webview){window.chrome.webview.postMessage({id,type,payload,...extra});}else{setTimeout(()=>resolve(mockResponse(type,payload,extra)),150);}})},receive(res){const p=this.pending[res.id];if(!p)return;delete this.pending[res.id];res.ok?p.resolve(res.payload):p.reject(new Error((res.payload&&res.payload.error)||'Bridge error'));}};window.SuiteBridge=SuiteBridge;
async function mockResponse(type,payload,extra){if(type==='suite:getSettings')return{settings:{...DEFAULT_SETTINGS},environment:{user:'Preview',machine:'Browser',version:'4.5.0'}};if(type==='suite:loadModuleData'&&extra.module==='attendance'){let r=await fetch('seed/attendance-data.json');return{module:'attendance',data:await r.text()}};if(type==='suite:loadModuleData'&&extra.module==='roster'){let r=await fetch('seed/roster-data.json');return{module:'roster',data:await r.text()}};if(type==='suite:loadModuleData'&&extra.module==='tasks'){let r=await fetch('seed/tasks-data.json');return{module:'tasks',data:await r.text()}};if(type==='suite:loadModuleData'&&extra.module==='shift-reports'){let r=await fetch('seed/shift-reports-data.json');return{module:'shift-reports',data:await r.text()}};if(type==='suite:loadModuleData'&&extra.module==='shift-intelligence'){let r=await fetch('seed/shift-intelligence-data.json');return{module:'shift-intelligence',data:await r.text()}};if(type==='suite:getMigrationStatus')return{checkedAt:new Date().toLocaleString(),pending:[],blocked:[],completedAutomatically:[],warnings:[],historyPath:'Preview'};if(type==='suite:getMigrationHistory')return{path:'Preview',appendOnly:true,rows:[]};if(type==='suite:approveSchemaMigration')return{migration:{module:payload.module||'',status:'completed'},status:{checkedAt:new Date().toLocaleString(),pending:[],blocked:[],completedAutomatically:[],warnings:[]}};if(type==='suite:healthCheck')return{dataRoot:settings.dataRoot,checks:[{name:'Preview mode',ok:true,error:''},{name:'Desktop bridge unavailable in browser',ok:false,error:'Run EXE for real checks'}],moduleFiles:[{module:'attendance',label:'Attendance',fileName:'attendance-data.json',path:'Preview',exists:true,sizeBytes:0,modified:'Preview',lastSaved:attendance.lastSaved||'',newestBackup:'Preview only',newestBackupModified:'',newestBackupSize:0},{module:'roster',label:'Roster',fileName:'roster-data.json',path:'Preview',exists:true,sizeBytes:0,modified:'Preview',lastSaved:roster.lastSaved||'',newestBackup:'Preview only',newestBackupModified:'',newestBackupSize:0}]};if(type==='suite:openPath')return{ok:true};if(type==='suite:refreshPrograms')return{ok:true};if(type==='suite:backupPrograms')return{ok:true,path:'Preview'};if(type==='suite:listBackups')return{module:(extra&&extra.module)||'attendance',backups:[]};if(type==='suite:backupInventory')return{generatedAt:new Date().toLocaleString(),totalFiles:0,totalBytes:0,totalCleanable:0,policy:'Preview mode. Run EXE for live backup inventory.',rows:[]};if(type==='suite:previewBackupCleanup')return{module:(payload&&payload.module)||'all',generatedAt:new Date().toLocaleString(),policy:'Preview mode cleanup disabled.',deleteCount:0,keepCount:0,deleteBytes:0,keepBytes:0,delete:[],keep:[]};if(type==='suite:cleanupBackups')return{module:(payload&&payload.module)||'all',deletedCount:0,failedCount:0,bytesRecovered:0,logPath:'Preview'};if(type==='suite:readBackupSummary')return{module:payload.module||'attendance',name:'Preview backup',path:payload.path||'Preview',modified:new Date().toLocaleString(),employees:0,schedule:0,tasks:0,audit:0,attendanceRecords:0,sizeBytes:0,lastSaved:''};if(type==='suite:restoreBackup')return{module:(extra&&extra.module)||'attendance',data:'{}',restoredFrom:'Preview'};return{ok:true}}
function esc(s){const str=String(s??'');let out='';for(let i=0;i<str.length;i++){const ch=str[i];if(ch==='&')out+='&amp;';else if(ch==='<')out+='&lt;';else if(ch==='>')out+='&gt;';else if(ch==='\"')out+='&quot;';else if(ch==="'")out+='&#39;';else out+=ch;}return out;}function parseISO(s){const [y,m,d]=String(s).split('-').map(Number);return new Date(y,m-1,d)}function toISO(d){return d.toISOString().slice(0,10)}function addDays(iso,n){const d=parseISO(iso);d.setDate(d.getDate()+n);return toISO(d)}function fmt(iso){const d=parseISO(iso);return (d.getMonth()+1)+'/'+d.getDate()}function weekKey(d){let x=new Date(d);x.setDate(x.getDate()-x.getDay());return toISO(x)}
function toast(msg){
  const el=document.getElementById('toast');
  if(!el){try{console.log(msg)}catch(_){ } return;}
  el.textContent=String(msg||'');
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>el.classList.remove('show'),3200);
}
function showToast(msg,isError){toast(msg);}
function reportActionError(area,e){
  const msg=(e&&e.message)?e.message:String(e||'Unknown error');
  try{console.error(area,e)}catch(_){ }
  const save=document.getElementById('saveStatus');
  if(save)save.textContent=area+' failed';
  toast(area+' failed: '+msg);
}
window.addEventListener('error',ev=>{reportActionError('Script error',ev.error||ev.message);});
window.addEventListener('unhandledrejection',ev=>{reportActionError('Unhandled action',ev.reason||ev);});function applyTheme(){document.documentElement.setAttribute('data-theme',settings.theme||'dark')}
function activeUsers(){return (settings.users||[]).filter(u=>u&&u.active!==false)}
function userLabel(u){return (u&&u.displayName)||u?.username||u?.id||'User'}
function currentUserName(){return currentUser?userLabel(currentUser):(env.user||'')}
function actualRoleOf(){return currentUser?.role||'Admin'}
function roleOf(){return actualRoleOf()==='Admin'&&previewRole?previewRole:actualRoleOf()}
function normalizeRoleCapabilities(raw){const src=raw&&typeof raw==='object'?raw:{};const out={};for(const role of ['Admin','Supervisor','Lead','Viewer']){const list=Array.isArray(src[role])?src[role]:DEFAULT_ROLE_CAPABILITIES[role];out[role]=[...new Set((list||[]).map(String))];}out.Admin=['*'];return out}
function hasCapability(capability,role=roleOf()){if(role==='Admin')return true;const matrix=settings.roleCapabilities||DEFAULT_ROLE_CAPABILITIES;const list=Array.isArray(matrix[role])?matrix[role]:DEFAULT_ROLE_CAPABILITIES[role]||[];return list.includes('*')||list.includes(capability)}
function authorizationEnvelope(){return {userId:currentUser?.id||'',pin:currentUser?.pin||''}}
function moduleCapability(id){return ({attendance:'attendance.view',roster:'roster.view','employee-profile':'roster.view',training:'training.view','office-supplies':'supplies.view','shift-reports':'shiftReports.view','shift-intelligence':'shiftIntelligence.view',reports:'reports.view',settings:'users.manage',tasks:'tasks.view','data-health':'dataHealth.view',restore:'data.restore','change-log':'audit.view','other-programs':'programs.launch'})[id]||''}
function migrationDataModuleForUi(id){if(id==='attendance')return'attendance';if(['roster','employee-profile','training','office-supplies'].includes(id))return'roster';if(id==='tasks')return'tasks';if(id==='shift-reports')return'shift-reports';if(id==='shift-intelligence')return'shift-intelligence';if(id==='settings')return'suite-settings';return''}
function migrationModuleNeedsAdmin(module){if(!module)return false;return (schemaMigrationStatus.pending||[]).some(x=>x&&x.module===module)||(schemaMigrationStatus.blocked||[]).some(x=>x&&x.module===module)}
function canAccessModule(id){
  const migrationModule=migrationDataModuleForUi(id);
  if(roleOf()!=='Admin'&&migrationModuleNeedsAdmin(migrationModule))return false;
  if(id==='home'||id==='start-here')return true;
  const capability=moduleCapability(id);
  return capability?hasCapability(capability):false;
}
function canAdmin(){return actualRoleOf()==='Admin'&&!previewRole}
function canManageUsers(){return hasCapability('users.manage')}
function canViewLaborSummary(){return hasCapability('reports.view')}
function canViewIndividualPay(){return hasCapability('reports.viewPay')}
function canAccessReports(){return hasCapability('reports.view')}
function canRestoreData(){return hasCapability('data.restore')}
function canRemoveAttendanceEmployee(){return hasCapability('attendance.edit')}
function startRolePreview(role){if(actualRoleOf()!=='Admin')return;previewRole=['Supervisor','Lead','Viewer'].includes(role)?role:'';ensureAllowedModule();renderShell();safeRenderPages();}
function stopRolePreview(){previewRole='';ensureAllowedModule();renderShell();safeRenderPages();}
function rolePreviewBanner(){return previewRole?`<div class="role-preview-banner"><strong>Previewing ${esc(previewRole)}</strong><span>Signed in as ${esc(userLabel(currentUser))}. This preview can only reduce the interface; host authorization still uses the signed-in Admin.</span><button onclick="stopRolePreview()">Exit Preview</button></div>`:''}
function applyCapabilityVisibility(scope=document){scope.querySelectorAll('[data-capability]').forEach(el=>el.classList.toggle('capability-hidden',!hasCapability(el.dataset.capability)));scope.querySelectorAll('.admin-only').forEach(el=>el.classList.toggle('capability-hidden',!canAdmin()));scope.querySelectorAll('.admin-pay').forEach(el=>el.classList.toggle('capability-hidden',!canViewIndividualPay()));}
function visibleModules(){return MODULES.filter(m=>canAccessModule(m.id))}
function ensureAllowedModule(){if(!canAccessModule(activeModule))activeModule='home'}
function updateUserStatus(){
  const u=document.getElementById('userStatus'); if(u)u.textContent=currentUser?`${userLabel(currentUser)} · ${currentUser.role||'User'}${previewRole?' · Preview '+previewRole:''}`:'Not signed in';
  document.documentElement.setAttribute('data-role',roleOf());
  const b=document.getElementById('settingsBtn'); if(b)b.classList.toggle('hidden',!canManageUsers());
}
function renderPin(){
  const users=activeUsers();
  if(!users.length){settings.users=[...DEFAULT_USERS];}
  if(!activeUsers().some(u=>u.id===loginUserId))loginUserId=activeUsers()[0]?.id||'admin';
  const sel=document.getElementById('loginUser');
  if(sel)sel.innerHTML=activeUsers().map(u=>`<option value="${esc(u.id)}" ${u.id===loginUserId?'selected':''}>${esc(userLabel(u))} · ${esc(u.role||'User')}</option>`).join('');
  const expected=(activeUsers().find(u=>u.id===loginUserId)?.pin||settings.pin||'1234');
  document.getElementById('pinDots').innerHTML=Array.from({length:Math.max(4,expected.length)},(_,i)=>`<div class="pin-dot ${pinInput.length>i?'on':''}"></div>`).join('');
  document.getElementById('pinPad').innerHTML=[1,2,3,4,5,6,7,8,9,'C',0,'X'].map(x=>`<button onclick="pinPress('${x}')">${x==='C'?'CLR':x==='X'?'⌫':x}</button>`).join('')
}
function checkPin(){
  if(pinInput.length===0)return;
  const u=activeUsers().find(x=>x.id===loginUserId);
  const expected=(u?.pin||settings.pin||'1234');
  if(pinInput===expected){currentUser=u||{id:'admin',username:'David',displayName:'David MacBain',role:'Admin',pin:expected,active:true};unlockSuite();}
  else{document.getElementById('pinError').textContent='Invalid PIN';pinInput='';setTimeout(renderPin,250)}
}
function pinPress(x){const expected=(activeUsers().find(u=>u.id===loginUserId)?.pin||settings.pin||'1234');if(x==='C')pinInput='';else if(x==='X')pinInput=pinInput.slice(0,-1);else if(pinInput.length<8)pinInput+=x;renderPin();if(pinInput.length>=expected.length)checkPin();}
// Global sign-in keyboard handling belongs to the shell, not Attendance.
document.addEventListener('keydown',function(ev){if(unlocked)return;if(ev.target&&['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName))return;const k=String(ev.key||'');if(/^\d$/.test(k)){ev.preventDefault();pinPress(k);return;}if(k==='Backspace'){ev.preventDefault();pinPress('X');return;}if(k==='Escape'||k.toLowerCase()==='c'){ev.preventDefault();pinPress('C');return;}if(k==='Enter'){ev.preventDefault();checkPin();return;}});

function unlockSuite(){unlocked=true;document.getElementById('lockScreen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');ensureAllowedModule();updateUserStatus();renderShell();const startHealth=hasCapability('dataHealth.view')&&env.openDataHealthAfterLogin;const target=startHealth?'data-health':(canAccessModule(settings.defaultModule)?settings.defaultModule:'home');navigate(target);setTimeout(()=>{if(typeof handlePendingSchemaMigrationsAfterLogin==='function')handlePendingSchemaMigrationsAfterLogin();if(hasCapability('dataHealth.view')&&typeof loadHealthIndicator==='function')loadHealthIndicator()},80)}
function lockSuite(){unlocked=false;currentUser=null;previewRole='';pinInput='';renderPin();document.getElementById('pinError').textContent='';document.getElementById('app').classList.add('hidden');document.getElementById('lockScreen').classList.remove('hidden');updateUserStatus()}
function normalizeUser(u,i){return {id:String(u.id||u.username||('user'+i)).replace(/[^a-zA-Z0-9_-]/g,'')||('user'+i),username:String(u.username||u.displayName||u.id||('User '+i)),displayName:String(u.displayName||u.username||u.id||('User '+i)),role:['Admin','Supervisor','Lead','Viewer'].includes(u.role)?u.role:(u.role==='Guard'?'Lead':'Viewer'),pin:String(u.pin||'1234'),active:u.active!==false}}
function normalizeSettings(x){
  const rawUsers=Array.isArray(x.users)?x.users:(Array.isArray(x.Users)?x.Users:null);
  const users=rawUsers?rawUsers.map(normalizeUser).filter(Boolean):DEFAULT_USERS.map(normalizeUser);
  if(!users.some(u=>u.role==='Admin'&&u.active!==false))users.unshift(normalizeUser(DEFAULT_USERS[0],0));
  const num=(a,b,def)=>{const v=x[a]!==undefined?x[a]:x[b];const n=Number(v);return Number.isFinite(n)?n:def;};
  return {...DEFAULT_SETTINGS,theme:x.theme||x.Theme||DEFAULT_SETTINGS.theme,defaultModule:x.defaultModule||x.DefaultModule||DEFAULT_SETTINGS.defaultModule,pin:x.pin||x.Pin||DEFAULT_SETTINGS.pin,dataRoot:x.dataRoot||x.DataRoot||DEFAULT_SETTINGS.dataRoot,backupRetentionDays:num('backupRetentionDays','BackupRetentionDays',DEFAULT_SETTINGS.backupRetentionDays),ftLoadedRate:num('ftLoadedRate','FtLoadedRate',DEFAULT_SETTINGS.ftLoadedRate),ptLoadedRate:num('ptLoadedRate','PtLoadedRate',DEFAULT_SETTINGS.ptLoadedRate),tempLoadedRate:num('tempLoadedRate','TempLoadedRate',DEFAULT_SETTINGS.tempLoadedRate),monthlyMultiplier:num('monthlyMultiplier','MonthlyMultiplier',DEFAULT_SETTINGS.monthlyMultiplier),annualMultiplier:num('annualMultiplier','AnnualMultiplier',DEFAULT_SETTINGS.annualMultiplier),fteBaselineHours:num('fteBaselineHours','FteBaselineHours',DEFAULT_SETTINGS.fteBaselineHours),users,roleCapabilities:normalizeRoleCapabilities(x.roleCapabilities||x.RoleCapabilities)};
}
async function init(){
  try{
    document.getElementById('saveStatus').textContent='Loading settings...';
    const res=await SuiteBridge.send('suite:getSettings');
    settings=normalizeSettings(res.settings||{});env=res.environment||{};
    try{schemaMigrationStatus=await SuiteBridge.send('suite:getMigrationStatus')||schemaMigrationStatus;}catch(e){schemaMigrationStatus={pending:[],blocked:[],completedAutomatically:[],warnings:['Migration status unavailable: '+(e.message||e)]};}
    applyTheme();renderPin();renderShell();
    if(MODULES.some(m=>m.id===settings.defaultModule)) activeModule=settings.defaultModule;
    document.getElementById('saveStatus').textContent='Loading attendance...';
    await loadAttendance();
    document.getElementById('saveStatus').textContent='Loading roster...';
    await loadRoster();
    document.getElementById('saveStatus').textContent='Loading tasks...';
    await loadTasks();
    document.getElementById('saveStatus').textContent='Loading shift reports...';
    await loadShiftReports();
    document.getElementById('saveStatus').textContent='Loading shift intelligence...';
    await loadShiftIntel();
    document.getElementById('saveStatus').textContent='Running render self-check...';
    validateRequiredFunctions('startup');
    safeRenderPages();
    document.getElementById('saveStatus').textContent='Ready';
    document.getElementById('moduleStatus').textContent=MODULES.find(m=>m.id===activeModule)?.label||activeModule;
  }catch(e){showStartupError(e);}
}
function safeRenderPages(options){
  const preserveScroll = options===true || (options && options.preserveScroll);
  const sx = window.scrollX || 0, sy = window.scrollY || 0;
  try{
    validateRequiredFunctions('render');
    renderPages();
    applyCapabilityVisibility();
    enhanceSortableTables();
    if(preserveScroll){setTimeout(()=>window.scrollTo(sx,sy),0);}
  }
  catch(e){showStartupError(e,'Page render failed');}
}

function enhanceSortableTables(scope=document){
  const tables=Array.from(scope.querySelectorAll('table')).filter(t=>!t.dataset.noSort);
  for(const table of tables){
    const thead=table.tHead;
    const tbody=table.tBodies&&table.tBodies[0];
    if(!thead||!tbody)continue;
    const headerRow=thead.rows&&thead.rows[0];
    if(!headerRow)continue;
    const ths=Array.from(headerRow.cells);
    if(ths.length<2)continue;
    table.classList.add('sortable-table');
    ths.forEach((th,col)=>{
      if(th.dataset.sortReady==='1')return;
      if(Number(th.colSpan||1)>1){th.classList.add('sortable-disabled');return;}
      th.dataset.sortReady='1';
      th.classList.add('sortable-column');
      th.title=(th.title?th.title+' · ':'')+'Click to sort this table by '+cleanSortText(th.textContent||('Column '+(col+1)));
      th.addEventListener('click',()=>sortHtmlTable(table,col,th));
    });
  }
}
function cleanSortText(v){return String(v||'').replace(/\s+/g,' ').trim()||'this column'}
function sortHtmlTable(table,col,th){
  const tbody=table.tBodies&&table.tBodies[0];
  if(!tbody)return;
  const rows=Array.from(tbody.rows).filter(r=>r.cells.length>1 && !r.classList.contains('sort-placeholder'));
  if(rows.length<2)return;
  const nextDir=th.dataset.sortDir==='asc'?'desc':'asc';
  Array.from(table.tHead.rows[0].cells).forEach(h=>{h.classList.remove('sort-asc','sort-desc');delete h.dataset.sortDir;});
  th.dataset.sortDir=nextDir;
  th.classList.add(nextDir==='asc'?'sort-asc':'sort-desc');
  const decorated=rows.map((row,i)=>({row,i,value:sortCellValue(row.cells[col])}));
  decorated.sort((a,b)=>compareSortValues(a.value,b.value)||a.i-b.i);
  if(nextDir==='desc')decorated.reverse();
  const frag=document.createDocumentFragment();
  decorated.forEach(x=>frag.appendChild(x.row));
  tbody.appendChild(frag);
}
function sortCellValue(cell){
  let raw=cell?cleanSortText(cell.textContent):'';
  let lower=raw.toLowerCase();
  let money=raw.replace(/[$,%]/g,'').replace(/,/g,'').replace(/\bhrs?\b/ig,'').trim();
  if(/^[-+]?\d+(\.\d+)?$/.test(money))return{type:'number',value:Number(money)};
  let d=Date.parse(raw);
  if(!Number.isNaN(d) && /\d/.test(raw) && (raw.includes('/')||raw.includes('-')||raw.includes(':')))return{type:'date',value:d};
  const badge=cell?cell.querySelector('.badge,.task-status,.status-badge,.uniform-chip') : null;
  if(badge)return{type:'text',value:cleanSortText(badge.textContent).toLowerCase()};
  return{type:'text',value:lower};
}
function compareSortValues(a,b){
  if(a.type===b.type && (a.type==='number'||a.type==='date'))return a.value-b.value;
  return String(a.value).localeCompare(String(b.value),undefined,{numeric:true,sensitivity:'base'});
}

function showStartupError(e,title='Startup failed'){
  const msg=(e&&e.message)?e.message:String(e||'Unknown error');
  const stack=(e&&e.stack)?e.stack:'';
  const save=document.getElementById('saveStatus'); if(save) save.textContent=title;
  const app=document.getElementById('app'); if(app) app.classList.remove('hidden');
  const lock=document.getElementById('lockScreen'); if(lock) lock.classList.add('hidden');
  const pages=document.getElementById('pages');
  if(pages){
    const guardInfo=(e&&e.missingFunction)?`<div class="notice warn"><strong>Render guard:</strong> Missing function <code>${esc(e.missingFunction)}</code> in ${esc(e.module||'unknown module')} during ${esc(e.phase||'startup')}. This is a code/build issue, not a shared-data issue.</div>`:'';
    const details=(e&&e.details)?`\n\nRequired function check:\n${e.details}`:'';
    pages.innerHTML=`<section class="page active"><div class="startup-error"><h2>${esc(title)}</h2><p>The suite opened, but a module failed while loading or rendering. This screen is designed so we can see the real problem instead of a blank “Initializing” screen.</p>${guardInfo}<br><strong>Error:</strong><pre>${esc(msg+details+'\n'+stack)}</pre><div class="toolbar"><button class="primary" onclick="forceSeedAndReload()">Use Packaged Recovery Data</button><button onclick="openSettings()">Open Settings</button><button onclick="location.reload()">Reload App</button></div><div class="notice">If this happened after updating versions, the shared JSON file may be stale or malformed. If the render guard names a missing function, use a corrected build instead of resetting data.</div></div></section>`;
  }
  try{toast(title+': '+msg)}catch(_){ }
}
async function forceSeedAndReload(){
  try{
    if(typeof packagedRecoveryApproval!=='function')throw new Error('The governed recovery approval control is unavailable.');
    const attendanceApproval=packagedRecoveryApproval('attendance','Attendance');
    if(!attendanceApproval)return;
    const rosterApproval=packagedRecoveryApproval('roster','Roster');
    if(!rosterApproval)return;
    document.getElementById('saveStatus').textContent='Resetting packaged data...';
    await SuiteBridge.send('suite:resetModuleFromSeed',attendanceApproval,{module:'attendance'});
    await SuiteBridge.send('suite:resetModuleFromSeed',rosterApproval,{module:'roster'});
    location.reload();
  }catch(e){showStartupError(e,'Seed reset failed');}
}
PWADCModuleRegistry.register('bootstrap');
