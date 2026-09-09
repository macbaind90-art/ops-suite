/* PWADC Security Operations Suite v3.5.0.1 | Attendance Point System */
'use strict';

const ATT_POINT_SYSTEM_VERSION=1;
const ATT_POINT_CODES=[
  {code:'P',label:'Present',points:0,kind:'work'},
  {code:'T<5',label:'Tardy < 5 Minutes',points:0.5,kind:'issue'},
  {code:'T>5',label:'Tardy > 5 Minutes',points:1,kind:'issue'},
  {code:'CO',label:'Call Off (Auto CO1/CO2)',points:null,kind:'issue'},
  {code:'NCNS',label:'No Call No Show',points:9,kind:'issue'},
  {code:'LE',label:'Left Early',points:1,kind:'issue'},
  {code:'EIA',label:'Clocked In Early w/o Approval',points:2,kind:'issue'},
  {code:'ALE',label:'Approved Left Early',points:0,kind:'work'},
  {code:'AT',label:'Approved Tardy',points:0,kind:'work'},
  {code:'V',label:'Vacation',points:0,kind:'neutral'},
  {code:'O',label:'Off',points:0,kind:'neutral'},
  {code:'AA',label:'Approved Absence',points:0,kind:'neutral'},
  {code:'NE',label:'Not Employed',points:0,kind:'neutral'}
];
const ATT_NEGATIVE_POINTS={'T<5':0.5,'T>5':1,'CO1':1.5,'CO2':3,'NCNS':9,'LE':1,'EIA':2};
const ATT_ISSUE_CODES=new Set(Object.keys(ATT_NEGATIVE_POINTS));
const ATT_CLEAN_WORK_CODES=new Set(['P','AT','ALE']);
const ATT_NEUTRAL_CODES=new Set(['V','O','AA','NE']);
const ATT_OLD_ISSUE_CODES=new Set(['T','CO','UE','U']);
const ATT_ACTION_LEVELS=[
  {points:9,level:'Final Written Warning'},
  {points:6,level:'Written Warning'},
  {points:3,level:'Verbal Counseling'}
];
let selectedPointEmployeeId='';
let pointReviewShift='All';
let pointReviewSearch='';
let pointGridMode='all';
let pointGridShift='All';
const ATTENDANCE_DAILY_SHIFT_ORDER=['3rd Shift','1st Shift','2nd Shift','Gate','Reception'];

const _normalizeAttendanceV3411=normalizeAttendance;
normalizeAttendance=function(){
  _normalizeAttendanceV3411();
  ensureAttendancePointSystem();
};

function ensureAttendancePointSystem(){
  attendance.correctiveActions=Array.isArray(attendance.correctiveActions)?attendance.correctiveActions:[];
  attendance.pointSystem=attendance.pointSystem&&typeof attendance.pointSystem==='object'?attendance.pointSystem:{};
  if(Number(attendance.pointSystem.version||0)!==ATT_POINT_SYSTEM_VERSION){
    attendance.pointSystem={
      ...attendance.pointSystem,
      version:Number(attendance.pointSystem.version||0),
      migrationPending:true,
      targetVersion:ATT_POINT_SYSTEM_VERSION,
      policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:2}
    };
  }else{
    attendance.pointSystem.migrationPending=false;
    attendance.pointSystem.policy={negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:2,...(attendance.pointSystem.policy||{})};
  }
}

function attendanceMigrationPending(){return !!(attendance.pointSystem&&attendance.pointSystem.migrationPending);}
function pointSystemAsOf(){return isIsoDateKey(gridEnd)?gridEnd:(latestAttendanceDataDate(attendance)||new Date().toISOString().slice(0,10));}
function dayDiff(a,b){return Math.round((parseISO(b)-parseISO(a))/86400000);}
function pointCodeLabel(code){
  const fixed={CO1:'Call Off - 1st in 14 Days',CO2:'Call Off - Additional in 14 Days',U:'Legacy Unexcused - Review'};
  const hit=ATT_POINT_CODES.find(x=>x.code===code);
  return fixed[code]||(hit&&hit.label)||code||'';
}
function pointValue(code){
  if(Object.prototype.hasOwnProperty.call(ATT_NEGATIVE_POINTS,code))return ATT_NEGATIVE_POINTS[code];
  if(code==='T')return 0.5;
  if(code==='CO')return 1.5;
  if(code==='UE')return 1;
  return 0;
}
function isChargeableAttendanceCode(code){return ATT_ISSUE_CODES.has(code)||ATT_OLD_ISSUE_CODES.has(code);}
function attendanceActionLevel(points){
  const p=Number(points)||0;
  return (ATT_ACTION_LEVELS.find(x=>p>=x.points)||{}).level||'None';
}
function attendanceActionRank(level){return {'None':0,'Verbal Counseling':1,'Written Warning':2,'Final Written Warning':3}[level]||0;}
function latestCorrectiveAction(empId){
  return (attendance.correctiveActions||[]).filter(a=>String(a.empId)===String(empId)).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0]||null;
}

function attendanceEventsForEmployee(empId){
  const row=(attendance.attendance||{})[String(empId)]||{};
  return Object.entries(row).filter(([d,c])=>isIsoDateKey(d)&&c).map(([date,code])=>({date,code:String(code)})).sort((a,b)=>a.date.localeCompare(b.date));
}

function classifyCalloffAtDate(empId,date,eventsOverride=null){
  const events=(eventsOverride||attendanceEventsForEmployee(empId)).filter(e=>e.date<date&&['CO','CO1','CO2'].includes(e.code));
  const prior=events.length?events[events.length-1]:null;
  return prior&&dayDiff(prior.date,date)<=13?'CO2':'CO1';
}

function attendancePointSnapshot(empId,asOf=pointSystemAsOf()){
  const events=attendanceEventsForEmployee(empId).filter(e=>e.date<=asOf);
  const legacyMode=attendanceMigrationPending();
  let bank=0,cleanWorkingDays=0;
  const earned=[],issues=[];
  for(let i=0;i<events.length;i++){
    const e=events[i];
    let code=e.code;
    if(code==='T')code='T<5';
    if(code==='CO')code=classifyCalloffAtDate(empId,e.date,events.slice(0,i));
    if(legacyMode&&code==='LE')code='ALE';
    if(code==='UE')code='LE';
    if(code==='E'||code==='AL'||code==='FL')code='AA';
    if(code==='AE')code='ALE';
    if(code==='U'){
      issues.push({date:e.date,code:'U',gross:0,offset:0,net:0,legacyReview:true});
      cleanWorkingDays=0;
      continue;
    }
    if(ATT_ISSUE_CODES.has(code)){
      const gross=pointValue(code);
      const offset=Math.min(bank,gross);
      bank=Number((bank-offset).toFixed(2));
      const net=Number((gross-offset).toFixed(2));
      issues.push({date:e.date,code,gross,offset,net});
      cleanWorkingDays=0;
      continue;
    }
    if(ATT_CLEAN_WORK_CODES.has(code)){
      cleanWorkingDays++;
      if(cleanWorkingDays>=12){
        const awarded=bank<2?1:0;
        if(awarded){bank=Math.min(2,bank+1);earned.push({date:e.date,amount:1,balanceAfter:bank});}
        cleanWorkingDays=0;
      }
      continue;
    }
    if(ATT_NEUTRAL_CODES.has(code))continue;
  }
  const start90=addDays(asOf,-89);
  const activeIssues=issues.filter(x=>x.date>=start90&&x.date<=asOf);
  const gross90=Number(activeIssues.reduce((s,x)=>s+(Number(x.gross)||0),0).toFixed(2));
  const offsets90=Number(activeIssues.reduce((s,x)=>s+(Number(x.offset)||0),0).toFixed(2));
  const activePoints=Number(activeIssues.reduce((s,x)=>s+(Number(x.net)||0),0).toFixed(2));
  const level=attendanceActionLevel(activePoints);
  return {empId:String(empId),asOf,start90,bank:Number(bank.toFixed(2)),cleanWorkingDays,gross90,offsets90,activePoints,level,issues,activeIssues,earned};
}

function migrateLegacyAttendanceCodes(){
  let changed=0,unresolved=0;
  const summary={T:0,CO:0,UE:0,LE:0,E:0,AL:0,AE:0,FL:0,U:0};
  for(const emp of attendance.employees||[]){
    const row=(attendance.attendance||{})[String(emp.id)]||{};
    const dates=Object.keys(row).filter(isIsoDateKey).sort();
    let priorCalloff='';
    for(const d of dates){
      const old=String(row[d]||'');
      let next=old;
      if(old==='T')next='T<5';
      else if(old==='CO'){
        next=priorCalloff&&dayDiff(priorCalloff,d)<=13?'CO2':'CO1';
        priorCalloff=d;
      }else if(old==='CO1'||old==='CO2')priorCalloff=d;
      else if(old==='UE')next='LE';
      else if(old==='LE')next='ALE';
      else if(old==='E'||old==='AL'||old==='FL')next='AA';
      else if(old==='AE')next='ALE';
      else if(old==='U'){unresolved++;summary.U++;continue;}
      if(next!==old){row[d]=next;changed++;if(Object.prototype.hasOwnProperty.call(summary,old))summary[old]++;}
    }
  }
  return {changed,unresolved,summary};
}

async function commitAttendancePointMigration(){
  if(!attendanceMigrationPending()){toast('Attendance point migration is already complete.');return;}
  if(!confirm('Commit the v3.5 Attendance Point System migration? A full Attendance backup will be created before any legacy codes are converted.'))return;
  try{
    await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});
  }catch(e){toast('Migration stopped: pre-migration backup failed. '+(e.message||e));return;}
  const result=migrateLegacyAttendanceCodes();
  attendance.pointSystem={
    version:ATT_POINT_SYSTEM_VERSION,
    migrationPending:false,
    migratedAt:new Date().toISOString(),
    migratedBy:currentUserName()||env.user||'',
    policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:2},
    migrationSummary:result
  };
  audit('Attendance point migration committed',`${result.changed} legacy code(s) converted; ${result.unresolved} legacy U record(s) preserved for manual review.`);
  const ok=await saveAttendanceNow('attendance-point-migration-v3.5');
  if(ok){safeRenderPages();toast(`Attendance point migration complete: ${result.changed} legacy records converted.`);}
}

function reclassifyCalloffsForEmployee(empId){
  const row=(attendance.attendance||{})[String(empId)]||{};
  let prior='';
  for(const d of Object.keys(row).filter(isIsoDateKey).sort()){
    if(['CO','CO1','CO2'].includes(String(row[d]||''))){
      row[d]=prior&&dayDiff(prior,d)<=13?'CO2':'CO1';
      prior=d;
    }
  }
}

function setAttendancePointCode(empId,date,rawCode){
  if(attendanceMigrationPending()){toast('Commit the Attendance Point System migration before entering new attendance.');return false;}
  const key=String(empId||'');
  attendance.attendance=attendance.attendance||{};
  attendance.attendance[key]=attendance.attendance[key]||{};
  attendance.notes=attendance.notes||{};
  let code=String(rawCode||'').trim().toUpperCase();
  const noteKey=key+'|'+date;
  if(code==='CO')code=classifyCalloffAtDate(key,date);
  if(!code){delete attendance.attendance[key][date];delete attendance.notes[noteKey];reclassifyCalloffsForEmployee(key);audit('Attendance code cleared',key+' · '+date);saveAttendance();return true;}
  if(ATT_ISSUE_CODES.has(code)){
    const existing=attendance.notes[noteKey]||'';
    const note=prompt(`${pointCodeLabel(code)} requires a reason/note:`,existing);
    if(note===null)return false;
    if(!String(note).trim()){toast(code+' requires a note before it can be saved.');return false;}
    attendance.notes[noteKey]=String(note).trim();
  }
  attendance.attendance[key][date]=code;
  reclassifyCalloffsForEmployee(key);
  audit('Attendance point code updated',`${key} · ${date} · ${attendance.attendance[key][date]}${attendance.notes[noteKey]?' · Note: '+attendance.notes[noteKey]:''}`);
  saveAttendance('point-code');
  return true;
}

setCode=function(id,date,code,opts={}){return setAttendancePointCode(id,date,code,opts);};

renderAttendance=function(){
  ensureAttendancePointSystem();
  const views=['daily','grid','review','actions','audit'];
  if(!views.includes(activeAttView))activeAttView='review';
  const labels={daily:'Daily Entry',grid:'90-Day Grid',review:'Point Review',actions:'Corrective Action',audit:'Audit Log'};
  const migration=attendanceMigrationPending()?`<div class="notice warn"><strong>Attendance Point Migration Required</strong><br>The current Attendance JSON is being preserved in memory. Daily entry is locked until a backup is created and legacy codes are converted to the v3.5 point model. <button class="primary" onclick="commitAttendancePointMigration()">Commit Migration + Backup</button></div>`:'';
  return `<div class="page-head"><div><div class="page-title">Attendance</div><div class="page-sub">90-day point accountability, 14-day call-off classification, positive attendance credits, and corrective-action tracking</div></div><div><button onclick="document.getElementById('attendanceImportFile').click()">Import JSON</button> <button onclick="createAttendanceBackup()">Backup Now</button> <button onclick="exportAttendanceCSV()">Export CSV</button> <button class="danger admin-only" onclick="openAttendanceRemoveModal()">Remove Employee</button><input id="attendanceImportFile" type="file" accept=".json,application/json" class="hidden" onchange="importAttendanceJSON(this)"></div></div>${migration}<div class="notice"><strong>Point Policy:</strong> T&lt;5 = .5 · T&gt;5 = 1 · CO1 = 1.5 · CO2 = 3 · NCNS = 9 · LE = 1 · EIA = 2. Points roll for 90 days. Every 12 clean working days earns +1 attendance credit, maximum 2. Credits automatically offset and are consumed by chargeable points.</div><div class="subnav">${views.map(v=>`<button class="${activeAttView===v?'active':''}" onclick="activeAttView='${v}';safeRenderPages()">${labels[v]}</button>`).join('')}</div>${activeAttView==='daily'?renderPointDaily():activeAttView==='grid'?renderPointGrid():activeAttView==='review'?renderPointReview():activeAttView==='actions'?renderPointCorrectiveActions():renderAudit()}`;
};

function attendanceDailyShiftRank(shift){const i=ATTENDANCE_DAILY_SHIFT_ORDER.indexOf(String(shift||''));return i>=0?i:99;}
function attendanceDailyShiftList(){
  const present=Array.from(new Set(activeAttendanceEmployees().map(e=>e.shift).filter(Boolean)));
  return [...ATTENDANCE_DAILY_SHIFT_ORDER.filter(s=>present.includes(s)),...present.filter(s=>!ATTENDANCE_DAILY_SHIFT_ORDER.includes(s)).sort()];
}
function pointDailyRows(){
  let rows=activeAttendanceEmployees().slice().sort((a,b)=>attendanceDailyShiftRank(a.shift)-attendanceDailyShiftRank(b.shift)||(a.shift||'').localeCompare(b.shift||'')||(a.name||'').localeCompare(b.name||''));
  if(entryShift!=='All')rows=rows.filter(e=>e.shift===entryShift);
  if(showBlanks)rows=rows.filter(e=>!getCode(e.id,entryDate));
  return rows;
}
function pointDailyGroups(rows){
  const map=new Map();
  for(const e of rows){const shift=e.shift||'Unassigned';if(!map.has(shift))map.set(shift,[]);map.get(shift).push(e);}
  return [...map.entries()].map(([shift,items])=>({shift,rows:items})).sort((a,b)=>attendanceDailyShiftRank(a.shift)-attendanceDailyShiftRank(b.shift)||a.shift.localeCompare(b.shift));
}
function renderPointDaily(){
  autoFillRdosForDate(entryDate);
  const shifts=['All',...attendanceDailyShiftList()];
  const rows=pointDailyRows();
  const groups=pointDailyGroups(rows);
  const locked=attendanceMigrationPending();
  return `<div class="card"><div class="card-title">Daily Attendance Entry</div><div class="toolbar"><div><label>Date</label><input type="date" value="${entryDate}" onchange="entryDate=this.value;safeRenderPages()"></div><div><label>Shift</label><select onchange="entryShift=this.value;safeRenderPages()">${shifts.map(s=>`<option ${entryShift===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div><button onclick="showBlanks=!showBlanks;safeRenderPages()">${showBlanks?'Show All':'Missing Entries Only'}</button></div><div class="mini-note">Daily Entry order: 3rd Shift → 1st Shift → 2nd Shift → Gate → Reception.</div>${locked?'<div class="notice warn">Entry is locked until the legacy Attendance migration is committed.</div>':''}</div><div class="people-list">${groups.map(g=>renderPointDailyGroup(g,locked)).join('')}</div>`;
}
function renderPointDailyGroup(g,locked=false){
  const counts=dailyCounts(g.rows||[]);
  return `<div class="shift-card"><div class="shift-head"><div>${esc(g.shift)} (${(g.rows||[]).length})</div><div>${counts.entered} / ${counts.total} entered · ${counts.blank} missing</div></div>${(g.rows||[]).map(e=>renderPointDailyRow(e,locked)).join('')}</div>`;
}
function applyAttendancePointCode(empId,date,code){if(setAttendancePointCode(empId,date,code))safeRenderPages({preserveScroll:true});}
function renderPointDailyRow(e,locked=false){
  const current=getCode(e.id,entryDate);
  const snap=attendancePointSnapshot(e.id,entryDate);
  return `<div class="person-row"><div class="person-name"><strong>${esc(e.name)}</strong><span>${esc(e.title)} · ${esc(e.shift)}</span><span class="mini-note">Active Points: ${snap.activePoints} · Positive Credit: ${snap.bank} · Clean Workdays: ${snap.cleanWorkingDays}/12</span></div><div class="row-code-pad">${ATT_POINT_CODES.map(x=>`<button class="row-code-btn ${current===x.code||(['CO1','CO2'].includes(current)&&x.code==='CO')?'active':''}" title="${esc(x.label+(x.points===null?'':` · ${x.points} pt`))}" ${locked?'disabled':''} onclick="event.stopPropagation();applyAttendancePointCode('${esc(e.id)}','${entryDate}','${x.code}')">${esc(x.code)}</button>`).join('')}</div><div class="row-status"><span class="badge ${esc(current)}">${esc(current||'Blank')}</span></div><div><button class="sm" onclick="event.stopPropagation();editNote('${esc(e.id)}','${entryDate}')">Note</button></div></div>`;
}

function pointGridEmployees(){
  let emps=activeAttendanceEmployees().slice().sort((a,b)=>attendanceDailyShiftRank(a.shift)-attendanceDailyShiftRank(b.shift)||(a.shift||'').localeCompare(b.shift||'')||(a.name||'').localeCompare(b.name||''));
  if(pointGridShift!=='All')emps=emps.filter(e=>e.shift===pointGridShift);
  return emps;
}
function pointGridCell(emp,d){
  const c=getCode(emp.id,d),pts=pointValue(c);
  return `<td title="${esc(d+' · '+pointCodeLabel(c)+(pts?' · '+pts+' pt':''))}" style="text-align:center;min-width:38px"><div>${esc(c||'')}</div><div class="mini-note">${pts||''}</div></td>`;
}
function renderPointGrid(){
  const end=gridEnd||pointSystemAsOf();
  const dates=[];for(let d=addDays(end,-89);d<=end;d=addDays(d,1))dates.push(d);
  const allEmps=activeAttendanceEmployees().slice().sort((a,b)=>attendanceDailyShiftRank(a.shift)-attendanceDailyShiftRank(b.shift)||(a.shift||'').localeCompare(b.shift||'')||(a.name||'').localeCompare(b.name||''));
  const shifts=['All',...attendanceDailyShiftList()];
  const emps=pointGridEmployees();
  if(!selectedGridEmpId&&allEmps.length)selectedGridEmpId=String(allEmps[0].id);
  const emp=allEmps.find(e=>String(e.id)===String(selectedGridEmpId))||allEmps[0];
  if(!emp)return '<div class="card">No active Attendance employees.</div>';
  const single=pointGridMode==='single';
  const snap=attendancePointSnapshot(emp.id,end);
  const controls=`<div class="toolbar"><div><label>View</label><select onchange="pointGridMode=this.value;safeRenderPages()"><option value="all" ${!single?'selected':''}>All Employees</option><option value="single" ${single?'selected':''}>Single Employee</option></select></div>${single?`<div><label>Employee</label><select onchange="selectedGridEmpId=this.value;safeRenderPages()">${allEmps.map(e=>`<option value="${esc(e.id)}" ${String(e.id)===String(emp.id)?'selected':''}>${esc(e.name)} · ${esc(e.shift)}</option>`).join('')}</select></div>`:`<div><label>Shift</label><select onchange="pointGridShift=this.value;safeRenderPages()">${shifts.map(s=>`<option ${pointGridShift===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>`}<div><label>Ending Date</label><input type="date" value="${end}" onchange="gridEnd=this.value;safeRenderPages()"></div></div>`;
  const summary=single?`<div class="health-row"><span>Gross Negative Points</span><strong>${snap.gross90}</strong></div><div class="health-row"><span>Credit Applied</span><strong>${snap.offsets90}</strong></div><div class="health-row"><span>Active Disciplinary Points</span><strong>${snap.activePoints}</strong></div><div class="health-row"><span>Positive Credit Bank</span><strong>${snap.bank} / 2</strong></div>`:`<div class="mini-note">Showing ${emps.length} active employee(s)${pointGridShift==='All'?'':' · '+esc(pointGridShift)}. Use Single Employee view for an individual point summary.</div>`;
  const rows=single?[emp]:emps;
  return `<div class="card"><div class="card-title">90-Day Grid</div>${controls}${summary}</div><div class="table-wrap" id="attendancePointGridWrap"><table><thead><tr><th class="name">Employee</th>${dates.map(d=>`<th style="min-width:38px">${d.slice(5)}</th>`).join('')}</tr></thead><tbody>${rows.map(e=>`<tr><td class="name"><strong>${esc(e.name)}</strong><div class="mini-note">${esc(e.shift)} · ${esc(e.title||'')}</div></td>${dates.map(d=>pointGridCell(e,d)).join('')}</tr>`).join('')||`<tr><td colspan="${dates.length+1}">No employees match the selected shift.</td></tr>`}</tbody></table></div>`;
}

function pointReviewRows(){
  let emps=sortedEmployees();
  if(pointReviewShift!=='All')emps=emps.filter(e=>e.shift===pointReviewShift);
  const q=pointReviewSearch.trim().toLowerCase();if(q)emps=emps.filter(e=>(e.name+' '+e.title+' '+e.shift).toLowerCase().includes(q));
  return emps.map(emp=>({emp,snap:attendancePointSnapshot(emp.id)})).sort((a,b)=>b.snap.activePoints-a.snap.activePoints||a.emp.name.localeCompare(b.emp.name));
}
function renderPointReview(){
  const shifts=['All',...Array.from(new Set(activeAttendanceEmployees().map(e=>e.shift).filter(Boolean)))];
  const rows=pointReviewRows();
  return `<div class="card"><div class="card-title">Attendance Point Review</div><div class="toolbar"><div><label>Shift</label><select onchange="pointReviewShift=this.value;safeRenderPages()">${shifts.map(s=>`<option ${pointReviewShift===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div><div><label>Search</label><input value="${esc(pointReviewSearch)}" oninput="pointReviewSearch=this.value;safeRenderPages({preserveScroll:true})" placeholder="Employee..."></div><div class="chip">As of ${esc(fmt(pointSystemAsOf()))}</div></div></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Gross 90-Day</th><th>Credits Used</th><th>Active Points</th><th>Positive Bank</th><th>Clean Workdays</th><th>Current Threshold</th><th>Next Step</th></tr></thead><tbody>${rows.map(({emp,snap})=>{const last=latestCorrectiveAction(emp.id);const due=attendanceActionRank(snap.level)>attendanceActionRank(last&&last.level||'None');return `<tr><td class="name"><strong>${esc(emp.name)}</strong><div class="mini-note">${esc(emp.title)} · ${esc(emp.shift)}</div></td><td>${snap.gross90}</td><td>${snap.offsets90}</td><td><strong>${snap.activePoints}</strong></td><td>${snap.bank} / 2</td><td>${snap.cleanWorkingDays} / 12</td><td>${esc(snap.level)}</td><td>${due?`<span class="chip critical">Action Due</span> <button class="sm" onclick="openCorrectiveActionModal('${esc(emp.id)}')">Record</button>`:'<span class="chip ok">Current</span>'}</td></tr>`}).join('')}</tbody></table></div>`;
}

function renderPointCorrectiveActions(){
  const rows=sortedEmployees().map(emp=>({emp,snap:attendancePointSnapshot(emp.id),last:latestCorrectiveAction(emp.id)})).filter(x=>x.snap.level!=='None'||x.last).sort((a,b)=>b.snap.activePoints-a.snap.activePoints||a.emp.name.localeCompare(b.emp.name));
  return `<div class="card"><div class="card-title">Corrective Action Control</div><div class="notice">Disciplinary thresholds use active points after positive attendance credits are applied: Verbal Counseling at 3, Written Warning at 6, Final Written Warning at 9. Recording an action documents completion; it does not change the point calculation.</div></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Active Points</th><th>Required Level</th><th>Last Recorded Action</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(({emp,snap,last})=>{const due=attendanceActionRank(snap.level)>attendanceActionRank(last&&last.level||'None');return `<tr><td class="name"><strong>${esc(emp.name)}</strong><div class="mini-note">${esc(emp.shift)}</div></td><td>${snap.activePoints}</td><td>${esc(snap.level)}</td><td>${last?`${esc(last.level)}<div class="mini-note">${esc(String(last.at||'').slice(0,10))} · ${esc(last.by||'')}</div>`:'None'}</td><td>${due?'<span class="chip critical">Due</span>':'<span class="chip ok">Current</span>'}</td><td><button class="sm" onclick="openCorrectiveActionModal('${esc(emp.id)}')">Record Action</button></td></tr>`}).join('')||'<tr><td colspan="6">No employees are currently at a corrective-action threshold.</td></tr>'}</tbody></table></div>`;
}

function openCorrectiveActionModal(empId){
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  const snap=attendancePointSnapshot(empId);
  const suggested=snap.level==='None'?'Verbal Counseling':snap.level;
  showModal(`<div class="modal-head"><div><div class="modal-title">Record Attendance Corrective Action</div><div class="mini-note">${esc(emp.name)} · ${snap.activePoints} active point(s)</div></div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div><label>Action Level</label><select id="caLevel">${['Verbal Counseling','Written Warning','Final Written Warning'].map(x=>`<option ${x===suggested?'selected':''}>${x}</option>`).join('')}</select></div><div><label>Action Date</label><input id="caDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="full"><label>Notes</label><textarea id="caNote" placeholder="Counseling/document reference, HR note, or management comments"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="saveCorrectiveAction('${esc(empId)}')">Record Action</button></div>`);
}
function saveCorrectiveAction(empId){
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  const level=val('caLevel'),date=val('caDate'),note=val('caNote');
  if(!level||!date){toast('Action level and date are required.');return;}
  const snap=attendancePointSnapshot(empId,date);
  attendance.correctiveActions=Array.isArray(attendance.correctiveActions)?attendance.correctiveActions:[];
  attendance.correctiveActions.unshift({id:'ca-'+Date.now(),empId:String(empId),employee:emp.name,level,date,at:new Date().toISOString(),by:currentUserName()||env.user||'',pointsAtAction:snap.activePoints,note});
  audit('Attendance corrective action recorded',`${emp.name} · ${level} · ${date} · ${snap.activePoints} active points`);
  closeModal();saveAttendance('corrective-action');safeRenderPages();toast(level+' recorded for '+emp.name);
}
