/* PWADC Security Operations Suite v3.3.0.3 | module: bootstrap */

'use strict';
const MODULES=[{id:'home',label:'Home'},{id:'start-here',label:'Start Here'},{id:'attendance',label:'Attendance'},{id:'roster',label:'Roster'},{id:'employee-profile',label:'Employee Profile'},{id:'training',label:'Training'},{id:'office-supplies',label:'Office Supplies'},{id:'shift-reports',label:'Shift Reports'},{id:'shift-intelligence',label:'Shift Intelligence'},{id:'reports',label:'Reports'},{id:'settings',label:'Settings'},{id:'tasks',label:'Task Tracker'},{id:'data-health',label:'Data Health'},{id:'restore',label:'Restore Center'},{id:'change-log',label:'Change Log'},{id:'other-programs',label:'Other Programs'}];
const REQUIRED_FUNCTIONS=[
  {module:'Shell / Navigation',names:['renderShell','renderPages','renderModule','safeRenderPages','navigate']},
  {module:'Dashboard',names:['renderHome','renderStartHere','printStartHere']},
  {module:'Attendance',names:['renderAttendance','renderDaily','renderDailyRow','renderGrid','renderAttendanceReview','renderPatterns','renderAttendanceNotices','renderAudit','openAttendanceRemoveModal']},
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
  const expected=['bootstrap','data-core','shell-audits','reports-governance','workflows-home','roster-schedule','training-uniforms','attendance','shift-operations','tasks-settings'];
  const moduleCheck=(window.PWADCModuleRegistry&&PWADCModuleRegistry.validate)?PWADCModuleRegistry.validate(expected):{ok:false,missing:expected};
  return `<div class="card"><div class="card-title">Render Safety / QA Guardrails</div><div class="notice">v3.3.0 modularizes the front end behind an ordered startup registry while retaining the existing render-function guardrails.</div><div class="health-row"><span>Front-End Module Registry</span><span class="${moduleCheck.ok?'ok':'bad'}">${moduleCheck.ok?esc(registry.loaded.length+' / '+expected.length+' loaded'):'Missing: '+esc((moduleCheck.missing||[]).join(', '))}</span></div><div class="table-wrap" style="max-height:none;margin-top:10px"><table><thead><tr><th>Module Area</th><th>Required Functions</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div><div class="mini-note">Current result: ${missing.length?missing.length+' missing function(s)':'All required render functions found'}.</div></div>`;
}

const SHIFT_ORDER=['3rd Shift','1st Shift','2nd Shift','Gate','Dock','Reception'];
const DEFAULT_COVERAGE_REQUIREMENTS=[
  {id:'cov1',area:'1st Shift Core Supervisor',section:'1st Shift',post:'Supervisor',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:1,hoursPerPost:8,notes:'0800-1600 core supervisor coverage'},
  {id:'cov2',area:'1st Shift Extra Supervisor',section:'1st Shift',post:'Supervisor',days:['Mon','Tue','Wed'],requiredHeadcount:1,hoursPerPost:8,notes:'Second supervisor row on Mon-Wed'},
  {id:'cov3',area:'1st Shift Base',section:'1st Shift',post:'Base',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:1,hoursPerPost:8,notes:'Base post coverage'},
  {id:'cov4',area:'1st Shift Response',section:'1st Shift',post:'Response',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:2,hoursPerPost:8,notes:'Two response posts; current schedule has open response slots on Sun/Sat'},
  {id:'cov5',area:'1st Shift Floater',section:'1st Shift',post:'Floater',days:['Thu','Fri'],requiredHeadcount:1,hoursPerPost:8,notes:'Floater coverage shown Thu-Fri'},
  {id:'cov6',area:'2nd Shift Core Supervisor',section:'2nd Shift',post:'Supervisor',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:1,hoursPerPost:8,notes:'1600-2400 core supervisor coverage'},
  {id:'cov7',area:'2nd Shift Extra Supervisor',section:'2nd Shift',post:'Supervisor',days:['Mon','Tue','Wed'],requiredHeadcount:1,hoursPerPost:8,notes:'Second supervisor row on Mon-Wed'},
  {id:'cov8',area:'2nd Shift Base',section:'2nd Shift',post:'Base',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:1,hoursPerPost:8,notes:'Base post coverage'},
  {id:'cov9',area:'2nd Shift Response',section:'2nd Shift',post:'Response',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:2,hoursPerPost:8,notes:'Two response posts'},
  {id:'cov10',area:'2nd Shift Floater',section:'2nd Shift',post:'Floater',days:['Mon','Tue','Wed','Thu','Fri'],requiredHeadcount:1,hoursPerPost:8,notes:'Weekday floater coverage'},
  {id:'cov11',area:'3rd Shift Core Supervisor',section:'3rd Shift',post:'Supervisor',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:1,hoursPerPost:8,notes:'0000-0800 core supervisor coverage'},
  {id:'cov12',area:'3rd Shift Extra Supervisor',section:'3rd Shift',post:'Supervisor',days:['Mon','Tue','Wed'],requiredHeadcount:1,hoursPerPost:8,notes:'Second supervisor row on Mon-Wed'},
  {id:'cov13',area:'3rd Shift Base',section:'3rd Shift',post:'Base',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:1,hoursPerPost:8,notes:'Base post coverage'},
  {id:'cov14',area:'3rd Shift Response',section:'3rd Shift',post:'Response',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:2,hoursPerPost:8,notes:'Two response posts'},
  {id:'cov15',area:'3rd Shift Floater',section:'3rd Shift',post:'Floater',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],requiredHeadcount:1,hoursPerPost:8,notes:'Primary floater row'},
  {id:'cov16',area:'3rd Shift Extra Floater',section:'3rd Shift',post:'Floater',days:['Mon','Thu'],requiredHeadcount:1,hoursPerPost:8,notes:'Second floater row on Mon/Thu'},
  {id:'cov17',area:'Gate 0400-1200',section:'Gate',post:'Gate 0400-1200',days:['Mon','Tue','Wed','Thu','Fri'],requiredHeadcount:1,hoursPerPost:8,notes:'Weekday gate coverage'},
  {id:'cov18',area:'Gate 1200-2000',section:'Gate',post:'Gate 1200-2000',days:['Mon','Tue','Wed','Thu','Fri'],requiredHeadcount:2,hoursPerPost:8,notes:'Two weekday gate guards'},
  {id:'cov19',area:'Gate 2000-0400',section:'Gate',post:'Gate 2000-0400',days:['Mon','Tue','Wed','Thu','Fri'],requiredHeadcount:1,hoursPerPost:8,notes:'Weekday overnight gate coverage'},
  {id:'cov20',area:'Gate 0400-1600 Weekend',section:'Gate',post:'Gate 0400-1600',days:['Sun','Sat'],requiredHeadcount:1,hoursPerPost:12,notes:'Weekend day gate coverage'},
  {id:'cov21',area:'Gate 1600-0400 Weekend',section:'Gate',post:'Gate 1600-0400',days:['Sun','Sat'],requiredHeadcount:1,hoursPerPost:12,notes:'Weekend night gate coverage'},
  {id:'cov22',area:'Grocery Dock 0600-1400',section:'Dock & Support',post:'Grocery 0600-1400',days:['Mon','Tue','Wed','Thu','Fri'],requiredHeadcount:1,hoursPerPost:8,notes:'Weekday grocery dock coverage'},
  {id:'cov23',area:'Crosswalk 0500-1300',section:'Dock & Support',post:'Crosswalk 0500-1300',days:['Mon','Tue','Wed','Thu','Fri'],requiredHeadcount:1,hoursPerPost:8,notes:'Weekday crosswalk/dock surge coverage'},
  {id:'cov24',area:'Reception 0800-1700',section:'Dock & Support',post:'Reception 0800-1700',days:['Mon','Tue','Wed','Thu','Fri'],requiredHeadcount:1,hoursPerPost:8,notes:'9-hour window with 1-hour lunch relief covered by another guard; 8 hours for cost/HPW'}
];
const DEFAULT_SETTINGS={theme:'dark',defaultModule:'home',pin:'1234',dataRoot:'\\\\pig-fs\\Security\\MacBain\\Security Operations Suite',backupRetentionDays:180,ftLoadedRate:0.33,ptLoadedRate:0.20,tempLoadedRate:0.35,monthlyMultiplier:4.333,annualMultiplier:52,fteBaselineHours:40,coverageRequirements:DEFAULT_COVERAGE_REQUIREMENTS.map(x=>({...x}))};
const DEFAULT_USERS=[
  {id:'admin',username:'David',displayName:'David MacBain',role:'Admin',pin:'6268',active:true},
  {id:'supervisor',username:'Supervisor',displayName:'Supervisor',role:'Supervisor',pin:'1234',active:false},
  {id:'lead',username:'Lead',displayName:'Lead',role:'Lead',pin:'1111',active:false},
  {id:'viewer',username:'Viewer',displayName:'Viewer',role:'Viewer',pin:'0000',active:false}
];
let settings={...DEFAULT_SETTINGS},env={},unlocked=false,pinInput='',loginUserId='admin',currentUser=null,activeModule='home',activeAttView='daily',activeCode='P',saveTimer=null,rosterSaveTimer=null,showBlanks=false,entryDate=new Date().toISOString().slice(0,10),entryShift='All',gridEnd=new Date().toISOString().slice(0,10),selectedEntryEmpId='',selectedGridEmpId='',selectedGridDate='',activeRosterView='roster',rosterSearch='',rosterShiftFilter='all',rosterRankFilter='all',rosterTypeFilter='all',rosterSortKey='shift',rosterSortDir='asc',scheduleEditContext=null,scheduleClipboard=null,scheduleWorkspaceMode='live',scheduleWorkspaceDraftId='',attendance={employees:[],attendance:{},notes:{},audit:[],flagActions:{},settings:{weekThreshold:3,monthThreshold:5,rollingThreshold:6,patternThreshold:3}},roster={employees:[],schedule:[],trainingTopics:[],trainingRecords:[],audit:[],nextId:1,nextTrainingTopicId:1,nextTrainingRecordId:1},tasks={tasks:[],audit:[],nextId:1,lastSaved:''},shiftReports={reports:[],issues:[],audit:[],nextIssueId:1,lastSaved:''},shiftIntel={issues:[],intake:[],reference:[],audit:[],nextIssueId:1,nextIntakeId:1,lastSaved:''},shiftIntelSearch='',shiftIntelStatusFilter='active',shiftIntelBucketFilter='all',shiftIntelCategoryFilter='all',shiftIntelSelectedIssueId='',shiftReportSearch='',shiftReportStatusFilter='open',shiftReportTypeFilter='all',shiftReportShiftFilter='all',shiftReportLastImport=null,taskSearch='',taskStatusFilter='all',taskPriorityFilter='all',taskCategoryFilter='all',taskEditId=null,taskSaveTimer=null,showArchivedRoster=false,selectedPatternEmpId='',patternStatusFilter='outstanding',attendanceNoticeFilter='all',restoreSelectedModule='attendance',restoreBackups=[],restoreLoading=false,changeLogModule='all',changeLogSearch='',employeeSearch='',activeEmployeeProfileId='',backupStatusRows=null,moduleFileStatusRows=null,moduleLoadInfo={},backupManager=null,backupCleanupPreview=null,backupCleanupModule='all',restorePreview=null,supplySearch='',supplyCategoryFilter='all',supplyStatusFilter='all',showArchivedSupplies=false,reportDateStart='',reportDateEnd='',reportCenterSelection='executive',reportCenterCategory='Recommended',dataHealthFindingFilter='all',settingsActiveSection='general',changeLogLimit=100,attendanceNoticePatternDraft=null;
let shiftIntelSelectedIntakeId='',shiftIntelDetailMode='intake';
const CODES=[['P','Present'],['T','Tardy'],['AL','Approved Leave'],['LE','Left Early Approved'],['UE','Unauthorized Early'],['E','Excused'],['CO','Call-Out'],['NCNS','No Call No Show'],['U','Unexcused'],['V','Vacation'],['O','Off/RDO'],['FL','Floating Holiday'],['NE','Not Employed']];

const OTHER_PROGRAMS=[
  {id:'badge',title:'Badge Audit',folder:'Badge Audit',file:'PWADC_Badge_Audit_Tool.html',purpose:'Punch detail vs reader log audit with drag/drop, XLSX parsing, reader logs, findings, and exports.'},
  {id:'amag',title:'AMAG Audit',folder:'AMAG Audit',file:'PWADC_AMAG_Audit_Tool.html',purpose:'AMAG SymmetryWEB histoper.txt review for badge/user events, inactive badge activity, and exportable report.'},
  {id:'access',title:'Access Audit',folder:'Access Audit',file:'PWADC_Access_Audit_Tool.html',purpose:'SymmetryWEB access-code exports compared against the Badge Access Master Tracking Database.'}
];

const TRACKING_CODES=new Set(['AL','V','E','LE']);const DISCIPLINE_CODES=new Set(['T','U','UE','CO','NCNS']);const PATTERN_CODES=new Set(['T','U','UE','CO','NCNS']);const OCC_CODES=new Set(['T','U','UE','CO','NCNS']);const ISSUE_NOTE_CODES=new Set(['T','U','UE','CO','NCNS']);const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SuiteBridge={seq:0,pending:{},send(type,payload={},extra={}){return new Promise((resolve,reject)=>{const id='r'+(++this.seq);this.pending[id]={resolve,reject};if(window.chrome&&window.chrome.webview){window.chrome.webview.postMessage({id,type,payload,...extra});}else{setTimeout(()=>resolve(mockResponse(type,payload,extra)),150);}})},receive(res){const p=this.pending[res.id];if(!p)return;delete this.pending[res.id];res.ok?p.resolve(res.payload):p.reject(new Error((res.payload&&res.payload.error)||'Bridge error'));}};window.SuiteBridge=SuiteBridge;
async function mockResponse(type,payload,extra){if(type==='suite:getSettings')return{settings:{...DEFAULT_SETTINGS},environment:{user:'Preview',machine:'Browser',version:'3.3.0.3'}};if(type==='suite:loadModuleData'&&extra.module==='attendance'){let r=await fetch('seed/attendance-data.json');return{module:'attendance',data:await r.text()}};if(type==='suite:loadModuleData'&&extra.module==='roster'){let r=await fetch('seed/roster-data.json');return{module:'roster',data:await r.text()}};if(type==='suite:loadModuleData'&&extra.module==='tasks'){let r=await fetch('seed/tasks-data.json');return{module:'tasks',data:await r.text()}};if(type==='suite:loadModuleData'&&extra.module==='shift-reports'){let r=await fetch('seed/shift-reports-data.json');return{module:'shift-reports',data:await r.text()}};if(type==='suite:loadModuleData'&&extra.module==='shift-intelligence'){let r=await fetch('seed/shift-intelligence-data.json');return{module:'shift-intelligence',data:await r.text()}};if(type==='suite:healthCheck')return{dataRoot:settings.dataRoot,checks:[{name:'Preview mode',ok:true,error:''},{name:'Desktop bridge unavailable in browser',ok:false,error:'Run EXE for real checks'}],moduleFiles:[{module:'attendance',label:'Attendance',fileName:'attendance-data.json',path:'Preview',exists:true,sizeBytes:0,modified:'Preview',lastSaved:attendance.lastSaved||'',newestBackup:'Preview only',newestBackupModified:'',newestBackupSize:0},{module:'roster',label:'Roster',fileName:'roster-data.json',path:'Preview',exists:true,sizeBytes:0,modified:'Preview',lastSaved:roster.lastSaved||'',newestBackup:'Preview only',newestBackupModified:'',newestBackupSize:0}]};if(type==='suite:openPath')return{ok:true};if(type==='suite:refreshPrograms')return{ok:true};if(type==='suite:backupPrograms')return{ok:true,path:'Preview'};if(type==='suite:listBackups')return{module:(extra&&extra.module)||'attendance',backups:[]};if(type==='suite:backupInventory')return{generatedAt:new Date().toLocaleString(),totalFiles:0,totalBytes:0,totalCleanable:0,policy:'Preview mode. Run EXE for live backup inventory.',rows:[]};if(type==='suite:previewBackupCleanup')return{module:(payload&&payload.module)||'all',generatedAt:new Date().toLocaleString(),policy:'Preview mode cleanup disabled.',deleteCount:0,keepCount:0,deleteBytes:0,keepBytes:0,delete:[],keep:[]};if(type==='suite:cleanupBackups')return{module:(payload&&payload.module)||'all',deletedCount:0,failedCount:0,bytesRecovered:0,logPath:'Preview'};if(type==='suite:readBackupSummary')return{module:payload.module||'attendance',name:'Preview backup',path:payload.path||'Preview',modified:new Date().toLocaleString(),employees:0,schedule:0,tasks:0,audit:0,attendanceRecords:0,sizeBytes:0,lastSaved:''};if(type==='suite:restoreBackup')return{module:(extra&&extra.module)||'attendance',data:'{}',restoredFrom:'Preview'};return{ok:true}}
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
function roleOf(){return currentUser?.role||'Admin'}
function canAccessModule(id){
  const role=roleOf();
  if(role==='Admin')return true;
  if(role==='Supervisor')return ['home','start-here','attendance','roster','employee-profile','training','office-supplies','shift-reports','shift-intelligence','reports','tasks','change-log','other-programs'].includes(id);
  if(role==='Lead')return ['home','start-here','attendance','roster','employee-profile','training','office-supplies','shift-reports','shift-intelligence','tasks','other-programs'].includes(id);
  if(role==='Viewer')return ['home','start-here','roster','employee-profile','training','office-supplies','other-programs'].includes(id);
  return id==='home'||id==='start-here';
}
function canAdmin(){return roleOf()==='Admin'}
function canViewLaborSummary(){return ['Admin','Supervisor'].includes(roleOf())}
function canViewIndividualPay(){return canAdmin()}
function canAccessReports(){return ['Admin','Supervisor'].includes(roleOf())}
function canRestoreData(){return canAdmin()}
function canRemoveAttendanceEmployee(){return canAdmin()}
function visibleModules(){return MODULES.filter(m=>canAccessModule(m.id))}
function ensureAllowedModule(){if(!canAccessModule(activeModule))activeModule='home'}
function updateUserStatus(){
  const u=document.getElementById('userStatus'); if(u)u.textContent=currentUser?`${userLabel(currentUser)} · ${currentUser.role||'User'}`:'Not signed in';
  document.documentElement.setAttribute('data-role',roleOf());
  const b=document.getElementById('settingsBtn'); if(b)b.classList.toggle('hidden',!canAdmin());
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
function unlockSuite(){unlocked=true;document.getElementById('lockScreen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');ensureAllowedModule();updateUserStatus();renderShell();navigate(canAccessModule(settings.defaultModule)?settings.defaultModule:'home')}
function lockSuite(){unlocked=false;currentUser=null;pinInput='';renderPin();document.getElementById('pinError').textContent='';document.getElementById('app').classList.add('hidden');document.getElementById('lockScreen').classList.remove('hidden');updateUserStatus()}
function normalizeUser(u,i){return {id:String(u.id||u.username||('user'+i)).replace(/[^a-zA-Z0-9_-]/g,'')||('user'+i),username:String(u.username||u.displayName||u.id||('User '+i)),displayName:String(u.displayName||u.username||u.id||('User '+i)),role:['Admin','Supervisor','Lead','Viewer'].includes(u.role)?u.role:(u.role==='Guard'?'Lead':'Viewer'),pin:String(u.pin||'1234'),active:u.active!==false}}
function normalizeSettings(x){
  const rawUsers=Array.isArray(x.users)?x.users:(Array.isArray(x.Users)?x.Users:null);
  const users=rawUsers?rawUsers.map(normalizeUser).filter(Boolean):DEFAULT_USERS.map(normalizeUser);
  if(!users.some(u=>u.role==='Admin'&&u.active!==false))users.unshift(normalizeUser(DEFAULT_USERS[0],0));
  const num=(a,b,def)=>{const v=x[a]!==undefined?x[a]:x[b];const n=Number(v);return Number.isFinite(n)?n:def;};
  const rawCov=Array.isArray(x.coverageRequirements)?x.coverageRequirements:(Array.isArray(x.CoverageRequirements)?x.CoverageRequirements:null);
  const coverageRequirements=(rawCov&&rawCov.length?rawCov:DEFAULT_COVERAGE_REQUIREMENTS).map(normalizeCoverageRequirement);
  return {...DEFAULT_SETTINGS,theme:x.theme||x.Theme||DEFAULT_SETTINGS.theme,defaultModule:x.defaultModule||x.DefaultModule||DEFAULT_SETTINGS.defaultModule,pin:x.pin||x.Pin||DEFAULT_SETTINGS.pin,dataRoot:x.dataRoot||x.DataRoot||DEFAULT_SETTINGS.dataRoot,backupRetentionDays:num('backupRetentionDays','BackupRetentionDays',DEFAULT_SETTINGS.backupRetentionDays),ftLoadedRate:num('ftLoadedRate','FtLoadedRate',DEFAULT_SETTINGS.ftLoadedRate),ptLoadedRate:num('ptLoadedRate','PtLoadedRate',DEFAULT_SETTINGS.ptLoadedRate),tempLoadedRate:num('tempLoadedRate','TempLoadedRate',DEFAULT_SETTINGS.tempLoadedRate),monthlyMultiplier:num('monthlyMultiplier','MonthlyMultiplier',DEFAULT_SETTINGS.monthlyMultiplier),annualMultiplier:num('annualMultiplier','AnnualMultiplier',DEFAULT_SETTINGS.annualMultiplier),fteBaselineHours:num('fteBaselineHours','FteBaselineHours',DEFAULT_SETTINGS.fteBaselineHours),coverageRequirements,users};
}
function normalizeCoverageRequirement(r,i=0){r=r||{};const n=(a,b,d)=>{const v=r[a]!==undefined?r[a]:r[b];const x=Number(v);return Number.isFinite(x)?x:d};return{id:String(r.id||r.Id||('cov'+i)),area:String(r.area||r.Area||r.section||r.Section||'Coverage Area'),section:String(r.section||r.Section||r.area||r.Area||'Coverage Area'),dayType:['All','Weekday','Weekend'].includes(r.dayType||r.DayType)?(r.dayType||r.DayType):'All',requiredHeadcount:n('requiredHeadcount','RequiredHeadcount',1),hoursPerPost:n('hoursPerPost','HoursPerPost',8),notes:String(r.notes||r.Notes||'')}}
async function init(){
  try{
    document.getElementById('saveStatus').textContent='Loading settings...';
    const res=await SuiteBridge.send('suite:getSettings');
    settings=normalizeSettings(res.settings||{});env=res.environment||{};
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
    document.getElementById('saveStatus').textContent='Resetting packaged data...';
    await SuiteBridge.send('suite:resetModuleFromSeed',{}, {module:'attendance'});
    await SuiteBridge.send('suite:resetModuleFromSeed',{}, {module:'roster'});
    location.reload();
  }catch(e){showStartupError(e,'Seed reset failed');}
}
PWADCModuleRegistry.register('bootstrap');
