/* PWADC Security Operations Suite v4.3.0 | Attendance Point System */
'use strict';

const ATT_POINT_SYSTEM_VERSION=1;
const ATT_POINT_CODES=[
  {code:'P',label:'Present',points:0,kind:'work'},
  {code:'T<5',label:'Tardy Less Than 5 Minutes',points:0,kind:'issue'},
  {code:'T5-14',label:'Tardy 5-14 Minutes',points:0.5,kind:'issue'},
  {code:'T15+',label:'Tardy 15 Minutes or More',points:1,kind:'issue'},
  {code:'CO',label:'Call Off (Auto CO1/CO2)',points:null,kind:'issue'},
  {code:'NCNS',label:'No Call No Show',points:9,kind:'issue'},
  {code:'LE',label:'Left Early',points:1,kind:'issue'},
  {code:'EIA',label:'Clocked In Early w/o Approval',points:2,kind:'issue'},
  {code:'SUS',label:'Suspended',points:0,kind:'reset'},
  {code:'ALE',label:'Approved Left Early',points:0,kind:'work'},
  {code:'AT',label:'Approved Tardy',points:0,kind:'work'},
  {code:'V',label:'Vacation',points:0,kind:'neutral'},
  {code:'O',label:'Off',points:0,kind:'neutral'},
  {code:'AA',label:'Approved Absence',points:0,kind:'neutral'},
  {code:'NE',label:'Not Employed',points:0,kind:'neutral'}
];
const ATT_DEFAULT_POINT_VALUES={'T<5':0,'T5-14':0.5,'T15+':1,'CO1':1.5,'CO2':3,'NCNS':9,'LE':1,'EIA':2};
// Compatibility constant retained for validators/callers that need the canonical chargeable-code list.
const ATT_NEGATIVE_POINTS=ATT_DEFAULT_POINT_VALUES;
const ATT_ISSUE_CODES=new Set(Object.keys(ATT_DEFAULT_POINT_VALUES));
const ATT_CLEAN_WORK_CODES=new Set(['P','AT','ALE']);
const ATT_RESET_CODES=new Set(['SUS']);
const ATT_NEUTRAL_CODES=new Set(['V','O','AA','NE']);
const ATT_OLD_ISSUE_CODES=new Set(['T','T>5','CO','UE','U']);
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
const ATT_MEDICAL_CODE_OPTIONS=[
  {code:'CO',label:'Call Off (CO / CO1 / CO2)'},
  {code:'T<5',label:'Tardy Less Than 5 Minutes'},
  {code:'T5-14',label:'Tardy 5-14 Minutes'},
  {code:'T15+',label:'Tardy 15 Minutes or More'},
  {code:'LE',label:'Left Early'},
  {code:'EIA',label:'Clocked In Early w/o Approval'},
  {code:'NCNS',label:'No Call No Show'},
  {code:'U',label:'Legacy Unexcused'}
];
let medicalNoteFilter='active';

const _normalizeAttendanceV3411=normalizeAttendance;
normalizeAttendance=function(){
  _normalizeAttendanceV3411();
  ensureAttendancePointSystem();
};

function normalizeAttendancePointValues(values){
  const source=values&&typeof values==='object'?values:{};
  const clean={};
  for(const [code,defaultValue] of Object.entries(ATT_DEFAULT_POINT_VALUES)){
    const raw=Number(source[code]);
    clean[code]=Number.isFinite(raw)&&raw>=0?Number(raw.toFixed(2)):defaultValue;
  }
  return clean;
}
function attendanceConfiguredPointValues(){
  const configured=attendance&&attendance.pointSystem&&attendance.pointSystem.pointValues;
  return normalizeAttendancePointValues(configured);
}
function ensureAttendancePointSystem(){
  attendance.correctiveActions=Array.isArray(attendance.correctiveActions)?attendance.correctiveActions:[];
  attendance.recordEdits=Array.isArray(attendance.recordEdits)?attendance.recordEdits:[];
  attendance.pointAdjustments=Array.isArray(attendance.pointAdjustments)?attendance.pointAdjustments:[];
  attendance.medicalNotes=Array.isArray(attendance.medicalNotes)?attendance.medicalNotes:[];
  attendance.medicalNotes=attendance.medicalNotes.map(n=>({...n,empId:String(n.empId||''),coveredCodes:Array.isArray(n.coveredCodes)?n.coveredCodes:[],editHistory:Array.isArray(n.editHistory)?n.editHistory:[],voided:!!n.voided}));
  attendance.tardyReclassifications=attendance.tardyReclassifications&&typeof attendance.tardyReclassifications==='object'?attendance.tardyReclassifications:{};
  attendance.autoOff=attendance.autoOff&&typeof attendance.autoOff==='object'?attendance.autoOff:{};
  attendance.workdayBasis=attendance.workdayBasis&&typeof attendance.workdayBasis==='object'?attendance.workdayBasis:{};
  attendance.pointSystem=attendance.pointSystem&&typeof attendance.pointSystem==='object'?attendance.pointSystem:{};
  attendance.pointSystem.pointValueHistory=Array.isArray(attendance.pointSystem.pointValueHistory)?attendance.pointSystem.pointValueHistory:[];
  attendance.pointSystem.pointValues=normalizeAttendancePointValues(attendance.pointSystem.pointValues);
  if(Number(attendance.pointSystem.version||0)!==ATT_POINT_SYSTEM_VERSION){
    attendance.pointSystem={
      ...attendance.pointSystem,
      version:Number(attendance.pointSystem.version||0),
      migrationPending:true,
      targetVersion:ATT_POINT_SYSTEM_VERSION,
      pointValues:normalizeAttendancePointValues(attendance.pointSystem.pointValues),
      pointValueHistory:Array.isArray(attendance.pointSystem.pointValueHistory)?attendance.pointSystem.pointValueHistory:[],
      policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:3,doctorNoteReductionPercent:50}
    };
  }else{
    attendance.pointSystem.migrationPending=false;
    attendance.pointSystem.policy={negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:3,doctorNoteReductionPercent:50,...(attendance.pointSystem.policy||{})};
    attendance.pointSystem.policy.maxPositiveCredits=3;
    attendance.pointSystem.policy.doctorNoteReductionPercent=normalizeDoctorNoteReductionPercent(attendance.pointSystem.policy.doctorNoteReductionPercent);
    attendance.pointSystem.pointValues=normalizeAttendancePointValues(attendance.pointSystem.pointValues);
  }
}


function normalizeDoctorNoteReductionPercent(value){
  const n=Number(value);
  return Number.isFinite(n)?Number(Math.min(100,Math.max(0,n)).toFixed(2)):50;
}
function attendanceDoctorNoteReductionPercent(){
  return normalizeDoctorNoteReductionPercent(attendance&&attendance.pointSystem&&attendance.pointSystem.policy&&attendance.pointSystem.policy.doctorNoteReductionPercent);
}
function attendanceDoctorNoteChargePercent(){return Number((100-attendanceDoctorNoteReductionPercent()).toFixed(2));}

function attendanceMigrationPending(){return !!(attendance.pointSystem&&attendance.pointSystem.migrationPending);}
function attendanceLocalToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function attendanceRosterEmployee(emp){
  if(!emp)return null;
  const rid=String(emp.rosterId||'');
  if(rid){const direct=(roster.employees||[]).find(r=>String(r.id)===rid&&!isArchivedEmployee(r));if(direct)return direct;}
  try{if(typeof findRosterEmployeeForAttendanceLoose==='function')return findRosterEmployeeForAttendanceLoose(emp);}catch(_e){}
  return null;
}
function liveScheduleDayAuthority(date){
  const dow=parseISO(date).getDay();
  const rows=Array.isArray(roster.schedule)?roster.schedule:[];
  const populated=rows.some(row=>{const cell=(row.days||[])[dow];return !scheduleCellIsBlank(cell);});
  return {dow,populated,rows};
}
function attendanceScheduleStatus(emp,date){
  const {dow,populated,rows}=liveScheduleDayAuthority(date);
  const re=attendanceRosterEmployee(emp);
  if(populated&&re){
    const scheduled=rows.some(row=>{const cell=(row.days||[])[dow];return !scheduleCellIsBlank(cell)&&!scheduleCellIsOpen(cell)&&scheduleNameMatchesEmployee(cell,re);});
    return {scheduled,off:!scheduled,source:'live-schedule',authoritative:true,dow};
  }
  const rdos=(emp&&Array.isArray(emp.rdos))?emp.rdos:(re?rosterRdoToAttendanceRdos(re.rdo):[]);
  const off=rdos.includes(dow);
  return {scheduled:!off,off,source:'roster-rdo-fallback',authoritative:false,dow};
}
function attendanceAutoOffKey(empId,date){return String(empId)+'|'+String(date);}
function attendanceEffectiveCode(emp,date){
  const stored=getCode(emp.id,date);
  if(stored)return stored;
  if(date<attendanceLocalToday())return '';
  if(emp.startDate&&isIsoDateKey(emp.startDate)&&date<emp.startDate)return 'NE';
  return attendanceScheduleStatus(emp,date).off?'O':'';
}
function attendanceCaptureWorkdayBasis(empId,date,code,mode='entry'){
  attendance.workdayBasis=attendance.workdayBasis&&typeof attendance.workdayBasis==='object'?attendance.workdayBasis:{};
  const key=attendanceAutoOffKey(empId,date);
  if(!ATT_CLEAN_WORK_CODES.has(code)){delete attendance.workdayBasis[key];return;}
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  if(date<attendanceLocalToday()&&mode==='historical-correction'){
    attendance.workdayBasis[key]={scheduled:true,source:'historical-manual-correction',capturedAt:new Date().toISOString(),by:currentUserName()||env.user||''};
    return;
  }
  const status=attendanceScheduleStatus(emp,date);
  attendance.workdayBasis[key]={scheduled:!!status.scheduled,source:status.source,capturedAt:new Date().toISOString(),by:currentUserName()||env.user||''};
}
function attendanceCleanWorkdayEligible(empId,date,code){
  if(!ATT_CLEAN_WORK_CODES.has(code))return false;
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return false;
  const key=attendanceAutoOffKey(empId,date),basis=attendance.workdayBasis&&attendance.workdayBasis[key];
  if(date<attendanceLocalToday())return basis&&typeof basis.scheduled==='boolean'?basis.scheduled:true;
  return attendanceScheduleStatus(emp,date).scheduled;
}
function syncAttendanceOffFromAuthority(date){
  const today=attendanceLocalToday();
  if(!isIsoDateKey(date)||date<today)return {changed:0,source:'past-protected'};
  if(date>today)return {changed:0,source:'future-derived-only'};
  attendance.autoOff=attendance.autoOff&&typeof attendance.autoOff==='object'?attendance.autoOff:{};
  let changed=0,added=0,cleared=0;
  for(const emp of activeAttendanceEmployees()){
    if(emp.startDate&&isIsoDateKey(emp.startDate)&&date<emp.startDate)continue;
    const key=attendanceAutoOffKey(emp.id,date),stored=getCode(emp.id,date),marker=attendance.autoOff[key],status=attendanceScheduleStatus(emp,date);
    attendance.attendance[String(emp.id)]=attendance.attendance[String(emp.id)]||{};
    if(status.off){
      if(!stored){attendance.attendance[String(emp.id)][date]='O';attendance.autoOff[key]={source:status.source,at:new Date().toISOString()};changed++;added++;}
      else if(stored==='O'&&marker&&marker.source!==status.source){attendance.autoOff[key]={source:status.source,at:new Date().toISOString()};}
    }else if(stored==='O'&&marker){
      delete attendance.attendance[String(emp.id)][date];delete attendance.autoOff[key];changed++;cleared++;
    }
  }
  if(changed){audit('Attendance Off synchronized',`${date} · ${added} auto-Off added · ${cleared} stale auto-Off cleared · Live Schedule primary / Roster RDO fallback`);saveAttendance('schedule-off-authority');}
  return {changed,added,cleared};
}
function autoFillRdosForDate(date){return syncAttendanceOffFromAuthority(date);}
function pointSystemAsOf(){return isIsoDateKey(gridEnd)?gridEnd:(latestAttendanceDataDate(attendance)||new Date().toISOString().slice(0,10));}
function dayDiff(a,b){return Math.round((parseISO(b)-parseISO(a))/86400000);}
function pointCodeLabel(code){
  const fixed={CO1:'Call Off - 1st in 14 Days',CO2:'Call Off - Additional in 14 Days',U:'Legacy Unexcused - Review'};
  const hit=ATT_POINT_CODES.find(x=>x.code===code);
  return fixed[code]||(hit&&hit.label)||code||'';
}
function pointValue(code){
  const values=attendanceConfiguredPointValues();
  if(Object.prototype.hasOwnProperty.call(values,code))return values[code];
  // Legacy aliases use the current configured policy so a policy edit recalculates historical records too.
  if(code==='T')return values['T<5'];
  if(code==='T>5')return values['T15+'];
  if(code==='CO')return values.CO1;
  if(code==='UE')return values.LE;
  return 0;
}
function attendancePointDisplayValue(code){
  if(code==='CO')return 'Auto';
  if(ATT_ISSUE_CODES.has(code))return pointValue(code);
  return 0;
}
function attendancePointPolicySummary(){
  const v=attendanceConfiguredPointValues();
  return `T&lt;5 = ${v['T<5']} · T5-14 = ${v['T5-14']} · T15+ = ${v['T15+']} · CO1 = ${v.CO1} · CO2 = ${v.CO2} · NCNS = ${v.NCNS} · LE = ${v.LE} · EIA = ${v.EIA} · Doctor Note Reduction = ${attendanceDoctorNoteReductionPercent()}%`;
}
function tardyRecordKey(empId,date){return String(empId)+'|'+String(date);}
function isLegacyMigratedTardy(empId,date,code){
  // Compatibility helper retained for older saved Attendance metadata. Historical T<5 records now use the current 0-point policy.
  return false;
}
function attendanceEventPointValue(empId,date,code){return pointValue(code);}
function latestPointAdjustment(empId,asOf=pointSystemAsOf()){
  return (attendance.pointAdjustments||[]).filter(a=>String(a.empId)===String(empId)&&isIsoDateKey(a.effectiveDate)&&a.effectiveDate<=asOf).sort((a,b)=>String(b.effectiveDate).localeCompare(String(a.effectiveDate))||String(b.at||'').localeCompare(String(a.at||'')))[0]||null;
}

function attendanceEmployeePointClass(empId,asOf=pointSystemAsOf()){
  const points=attendancePointSnapshot(empId,asOf).activePoints;
  if(points<3)return 'att-emp-risk-green';
  if(points<7)return 'att-emp-risk-yellow';
  return 'att-emp-risk-red';
}
function attendanceEmployeeNameHtml(emp,asOf=pointSystemAsOf(),meta=''){
  const risk=attendanceEmployeePointClass(emp.id,asOf);
  const snap=attendancePointSnapshot(emp.id,asOf);
  const detail=meta||[emp.title,emp.shift].filter(Boolean).join(' · ');
  return `<div class="att-employee-name-wrap ${risk}">${attendanceEmployeeProfileLink(emp)}${detail?`<div class="mini-note">${esc(detail)}</div>`:''}<div class="mini-note">${snap.activePoints} active point${snap.activePoints===1?'':'s'}</div></div>`;
}
function pointGridStatusClass(code,pointsOverride=null){
  const c=String(code||'');
  if(!c)return '';
  if(c==='NE')return 'att-status-ne';
  if(c==='O')return '';
  if(c==='P')return 'att-status-present';
  if(c==='SUS')return 'att-status-suspended';
  if(['AT','ALE','AA','V','AL','E','AE','FL'].includes(c))return 'att-status-approved';
  const pts=pointsOverride===null?pointValue(c):Number(pointsOverride)||0;
  if(pts>0)return pts>=2?'att-status-issue-high':'att-status-issue-low';
  if(c==='U')return 'att-status-issue-high';
  return '';
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

function attendanceMedicalCodeKey(code){
  const c=String(code||'').toUpperCase();
  if(['CO','CO1','CO2'].includes(c))return 'CO';
  if(c==='T')return 'T<5';
  if(c==='T>5')return 'T15+';
  if(c==='UE')return 'LE';
  return c;
}
function activeAttendanceMedicalNotes(){return (attendance.medicalNotes||[]).filter(n=>n&&!n.voided&&n.empId&&isIsoDateKey(n.startDate)&&isIsoDateKey(n.endDate));}
function attendanceMedicalCoverageFor(empId,date,code){
  const key=attendanceMedicalCodeKey(code);
  if(!key||!isIsoDateKey(date))return null;
  return activeAttendanceMedicalNotes().filter(n=>String(n.empId)===String(empId)&&n.startDate<=date&&n.endDate>=date&&(n.coveredCodes||[]).includes(key)).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0]||null;
}
function attendanceMedicalNoteEmployee(note){return (attendance.employees||[]).find(e=>String(e.id)===String(note&&note.empId))||null;}
function attendanceMedicalMatchingEvents(note){
  if(!note)return [];
  return attendanceEventsForEmployee(note.empId).filter(e=>e.date>=note.startDate&&e.date<=note.endDate&&(note.coveredCodes||[]).includes(attendanceMedicalCodeKey(e.code))).map(e=>({date:e.date,code:e.code,key:attendanceMedicalCodeKey(e.code)}));
}
function attendanceMedicalNoteStatus(note){return note&&note.voided?'Voided':'Active';}
function attendanceMedicalPointMultiplier(_note){return Number((attendanceDoctorNoteChargePercent()/100).toFixed(4));}
function attendanceMedicalFirstMatchingEvent(note){
  const rows=attendanceMedicalMatchingEvents(note);
  return rows.length?rows[0]:null;
}
function attendanceMedicalIsPrimaryEvent(note,date,code){
  const first=attendanceMedicalFirstMatchingEvent(note);
  return !!(first&&first.date===date&&attendanceMedicalCodeKey(first.code)===attendanceMedicalCodeKey(code));
}
function attendanceMedicalNormalizedPointCode(empId,date,rawCode){
  let code=String(rawCode||'');
  if(code==='T')code='T<5';
  if(code==='T>5')code='T15+';
  if(['CO','CO1','CO2'].includes(code))code=classifyCalloffAtDate(empId,date);
  if(code==='UE')code='LE';
  return code;
}
function attendanceMedicalDisplayPoints(empId,date,rawCode){
  const note=attendanceMedicalCoverageFor(empId,date,rawCode);
  if(!note)return null;
  if(!attendanceMedicalIsPrimaryEvent(note,date,rawCode))return 0;
  const pointCode=attendanceMedicalNormalizedPointCode(empId,date,rawCode);
  const original=attendanceEventPointValue(empId,date,pointCode);
  return Number((original*attendanceMedicalPointMultiplier(note)).toFixed(2));
}

function classifyCalloffAtDate(empId,date,eventsOverride=null){
  const source=(eventsOverride||attendanceEventsForEmployee(empId)).filter(e=>e.date<date&&['CO','CO1','CO2'].includes(e.code)).sort((a,b)=>a.date.localeCompare(b.date));
  const seenMedicalNotes=new Set(),occurrences=[];
  for(const e of source){
    const medical=attendanceMedicalCoverageFor(empId,e.date,e.code);
    if(medical){
      const id=String(medical.id||'');
      if(seenMedicalNotes.has(id))continue;
      seenMedicalNotes.add(id);
    }
    occurrences.push(e);
  }
  const prior=occurrences.length?occurrences[occurrences.length-1]:null;
  return prior&&dayDiff(prior.date,date)<=13?'CO2':'CO1';
}

function attendancePointSnapshot(empId,asOf=pointSystemAsOf()){
  const events=attendanceEventsForEmployee(empId).filter(e=>e.date<=asOf);
  const legacyMode=attendanceMigrationPending();
  const maxCredits=Number(attendance.pointSystem&&attendance.pointSystem.policy&&attendance.pointSystem.policy.maxPositiveCredits||3);
  const adjustment=latestPointAdjustment(empId,asOf);
  const adjustmentExpires=adjustment?addDays(adjustment.effectiveDate,89):'';
  let bank=0,cleanWorkingDays=0,adjustmentOutstanding=0,adjustmentActivated=false;
  const earned=[],issues=[],chargedMedicalNotes=new Set();

  function expireIssueBalances(onDate){
    const cutoff=addDays(onDate,-89);
    for(const issue of issues){
      if(issue.date<cutoff)issue.expiredBefore=onDate;
    }
  }
  function activateAdjustmentIfNeeded(nextDate='9999-12-31'){
    if(!adjustment||adjustmentActivated||nextDate<=adjustment.effectiveDate)return;
    adjustmentActivated=true;
    if(asOf<=adjustmentExpires)adjustmentOutstanding=Math.max(0,Number(adjustment.newActivePoints)||0);
  }
  function activeIssueBalance(issue,onDate){
    if(!issue||issue.date<addDays(onDate,-89))return 0;
    if(adjustmentActivated&&adjustment&&issue.date<=adjustment.effectiveDate)return 0;
    return Math.max(0,Number(issue.net)||0);
  }
  function applyPositiveAward(onDate,amount=1){
    let remaining=Number(amount)||0;
    let appliedToNegative=0;
    activateAdjustmentIfNeeded(onDate);
    expireIssueBalances(onDate);

    if(adjustmentActivated&&adjustmentOutstanding>0&&onDate>adjustment.effectiveDate){
      const used=Math.min(remaining,adjustmentOutstanding);
      adjustmentOutstanding=Number((adjustmentOutstanding-used).toFixed(2));
      remaining=Number((remaining-used).toFixed(2));
      appliedToNegative=Number((appliedToNegative+used).toFixed(2));
    }

    if(remaining>0){
      for(const issue of issues){
        if(remaining<=0)break;
        const balance=activeIssueBalance(issue,onDate);
        if(balance<=0)continue;
        const used=Math.min(remaining,balance);
        issue.positivePaydown=Number(((Number(issue.positivePaydown)||0)+used).toFixed(2));
        issue.net=Number((Number(issue.net)-used).toFixed(2));
        remaining=Number((remaining-used).toFixed(2));
        appliedToNegative=Number((appliedToNegative+used).toFixed(2));
      }
    }

    const room=Math.max(0,maxCredits-bank);
    const banked=Math.min(remaining,room);
    if(banked>0)bank=Number((bank+banked).toFixed(2));
    return {appliedToNegative,banked:Number(banked.toFixed(2)),unused:Number((remaining-banked).toFixed(2)),balanceAfter:Number(bank.toFixed(2))};
  }

  for(let i=0;i<events.length;i++){
    const e=events[i];
    activateAdjustmentIfNeeded(e.date);
    const rawCode=e.code;
    let code=rawCode;
    if(code==='T')code='T<5';
    if(code==='CO')code=classifyCalloffAtDate(empId,e.date,events.slice(0,i));
    if(legacyMode&&code==='LE')code='ALE';
    if(code==='UE')code='LE';
    if(code==='E'||code==='AL'||code==='FL')code='AA';
    if(code==='AE')code='ALE';
    const medicalCoverage=attendanceMedicalCoverageFor(empId,e.date,rawCode);
    if(medicalCoverage){
      const originalGross=(ATT_ISSUE_CODES.has(code)||rawCode==='T>5')?attendanceEventPointValue(empId,e.date,code):0;
      const medicalId=String(medicalCoverage.id||'');
      const primary=!chargedMedicalNotes.has(medicalId);
      let gross=0,offset=0,net=0;
      if(primary){
        chargedMedicalNotes.add(medicalId);
        gross=Number((originalGross*attendanceMedicalPointMultiplier(medicalCoverage)).toFixed(2));
        offset=Math.min(bank,gross);
        bank=Number((bank-offset).toFixed(2));
        net=Number((gross-offset).toFixed(2));
      }
      issues.push({date:e.date,code,gross,originalGross,offset,positivePaydown:0,net,medicalCovered:true,medicalPrimary:primary,medicalMultiplier:attendanceMedicalPointMultiplier(medicalCoverage),medicalNoteId:medicalCoverage.id});
      cleanWorkingDays=0;
      continue;
    }
    if(code==='U'){
      issues.push({date:e.date,code:'U',gross:0,offset:0,positivePaydown:0,net:0,legacyReview:true});
      cleanWorkingDays=0;
      continue;
    }
    if(ATT_ISSUE_CODES.has(code)||rawCode==='T>5'){
      const gross=attendanceEventPointValue(empId,e.date,code);
      const offset=Math.min(bank,gross);
      bank=Number((bank-offset).toFixed(2));
      const net=Number((gross-offset).toFixed(2));
      issues.push({date:e.date,code,gross,offset,positivePaydown:0,net,legacyTardy:false});
      cleanWorkingDays=0;
      continue;
    }
    if(ATT_RESET_CODES.has(code)){
      cleanWorkingDays=0;
      continue;
    }
    if(ATT_CLEAN_WORK_CODES.has(code)){
      if(!attendanceCleanWorkdayEligible(empId,e.date,code))continue;
      cleanWorkingDays++;
      if(cleanWorkingDays>=12){
        const award=applyPositiveAward(e.date,1);
        if(award.appliedToNegative>0||award.banked>0)earned.push({date:e.date,amount:1,...award});
        cleanWorkingDays=0;
      }
      continue;
    }
    if(ATT_NEUTRAL_CODES.has(code))continue;
  }

  activateAdjustmentIfNeeded('9999-12-31');
  const start90=addDays(asOf,-89);
  const rawActiveIssues=issues.filter(x=>x.date>=start90&&x.date<=asOf);
  const gross90=Number(rawActiveIssues.reduce((sum,x)=>sum+(Number(x.gross)||0),0).toFixed(2));
  const offsets90=Number(rawActiveIssues.reduce((sum,x)=>sum+(Number(x.offset)||0)+(Number(x.positivePaydown)||0),0).toFixed(2));
  const calculatedActivePoints=Number(rawActiveIssues.reduce((sum,x)=>sum+(Number(x.net)||0),0).toFixed(2));
  let activeIssues=rawActiveIssues,adjustmentBase=0;
  if(adjustment){
    activeIssues=rawActiveIssues.filter(x=>x.date>adjustment.effectiveDate);
    if(asOf<=adjustmentExpires)adjustmentBase=Number(adjustmentOutstanding.toFixed(2));
  }
  const postAdjustmentPoints=Number(activeIssues.reduce((sum,x)=>sum+(Number(x.net)||0),0).toFixed(2));
  const activePoints=Number((adjustmentBase+postAdjustmentPoints).toFixed(2));
  const level=attendanceActionLevel(activePoints);
  return {empId:String(empId),asOf,start90,bank:Number(bank.toFixed(2)),maxCredits,cleanWorkingDays,gross90,offsets90,calculatedActivePoints,activePoints,level,issues,activeIssues,earned,adjustment,adjustmentBase,adjustmentExpires,postAdjustmentPoints};
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
  const configuredValues=attendanceConfiguredPointValues();
  const pointValueHistory=Array.isArray(attendance.pointSystem.pointValueHistory)?attendance.pointSystem.pointValueHistory:[];
  attendance.pointSystem={
    version:ATT_POINT_SYSTEM_VERSION,
    migrationPending:false,
    migratedAt:new Date().toISOString(),
    migratedBy:currentUserName()||env.user||'',
    policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:3,doctorNoteReductionPercent:50},
    pointValues:configuredValues,
    pointValueHistory,
    migrationSummary:result
  };
  audit('Attendance point migration committed',`${result.changed} legacy code(s) converted; ${result.unresolved} legacy U record(s) preserved for manual review.`);
  const ok=await saveAttendanceNow('attendance-point-migration-v3.5');
  if(ok){safeRenderPages();toast(`Attendance point migration complete: ${result.changed} legacy records converted.`);}
}

function reclassifyCalloffsForEmployee(empId){
  const row=(attendance.attendance||{})[String(empId)]||{};
  let prior='';
  const seenMedicalNotes=new Set();
  for(const d of Object.keys(row).filter(isIsoDateKey).sort()){
    if(['CO','CO1','CO2'].includes(String(row[d]||''))){
      const existing=String(row[d]||'');
      const medical=attendanceMedicalCoverageFor(empId,d,existing);
      row[d]=prior&&dayDiff(prior,d)<=13?'CO2':'CO1';
      if(medical){
        const id=String(medical.id||'');
        if(seenMedicalNotes.has(id))continue;
        seenMedicalNotes.add(id);
      }
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
  attendance.tardyReclassifications=attendance.tardyReclassifications||{};
  const oldCode=getCode(key,date)||'';
  let code=String(rawCode||'').trim().toUpperCase();
  const noteKey=key+'|'+date;
  if(code==='CO')code=classifyCalloffAtDate(key,date);
  if(!code){delete attendance.attendance[key][date];delete attendance.notes[noteKey];delete attendance.tardyReclassifications[noteKey];if(attendance.workdayBasis)delete attendance.workdayBasis[noteKey];if(attendance.autoOff)delete attendance.autoOff[noteKey];reclassifyCalloffsForEmployee(key);audit('Attendance code cleared',key+' · '+date);saveAttendance();return true;}
  if(ATT_ISSUE_CODES.has(code)){
    const existing=attendance.notes[noteKey]||'';
    const note=prompt(`${pointCodeLabel(code)} requires a reason/note:`,existing);
    if(note===null)return false;
    if(!String(note).trim()){toast(code+' requires a note before it can be saved.');return false;}
    attendance.notes[noteKey]=String(note).trim();
  }
  attendance.attendance[key][date]=code;
  attendanceCaptureWorkdayBasis(key,date,code,'entry');
  if(attendance.autoOff)delete attendance.autoOff[noteKey];
  if(code==='T<5'&&oldCode!=='T<5')attendance.tardyReclassifications[noteKey]={at:new Date().toISOString(),by:currentUserName()||env.user||'',reason:'Explicit T<5 classification entered under current tardy policy'};
  else if(code!=='T<5')delete attendance.tardyReclassifications[noteKey];
  reclassifyCalloffsForEmployee(key);
  audit('Attendance point code updated',`${key} · ${date} · ${attendance.attendance[key][date]}${attendance.notes[noteKey]?' · Note: '+attendance.notes[noteKey]:''}`);
  saveAttendance('point-code');
  return true;
}

setCode=function(id,date,code,opts={}){return setAttendancePointCode(id,date,code,opts);};

function renderAttendance(){
  ensureAttendancePointSystem();
  const views=['daily','grid','review','medical','actions','audit'];
  if(!views.includes(activeAttView))activeAttView='review';
  const labels={daily:'Daily Entry',grid:'90-Day Grid',review:'Point Review',medical:'Doctor Notes',actions:'Corrective Action',audit:'Audit Log'};
  const migration=attendanceMigrationPending()?`<div class="notice warn"><strong>Attendance Point Migration Required</strong><br>The current Attendance JSON is being preserved in memory. Daily entry is locked until a backup is created and legacy codes are converted to the v3.5 point model. <button class="primary" onclick="commitAttendancePointMigration()">Commit Migration + Backup</button></div>`:'';
  return `<div class="page-head"><div><div class="page-title">Attendance</div><div class="page-sub">90-day point accountability, 14-day call-off classification, positive attendance credits, and corrective-action tracking</div></div><div><button onclick="document.getElementById('attendanceImportFile').click()">Import JSON</button> <button onclick="createAttendanceBackup()">Backup Now</button> <button onclick="exportAttendanceCSV()">Export CSV</button> <button class="" data-capability="attendance.edit" onclick="openDoctorNoteModal()">Add Doctor Note</button> <button class="" data-capability="attendance.managePolicy" onclick="openPointValueSettingsModal()">Edit Point Values</button> <button class="danger" data-capability="attendance.edit" onclick="openAttendanceRemoveModal()">Remove Employee</button><input id="attendanceImportFile" type="file" accept=".json,application/json" class="hidden" onchange="importAttendanceJSON(this)"></div></div>${migration}<div class="notice"><strong>Point Policy:</strong> ${attendancePointPolicySummary()}. Points roll for 90 days. Every 12 clean working days earns +1 attendance credit. Newly earned credits immediately pay down active negative points first; any unused remainder is banked, with a maximum positive balance of 3 at any one time. Banked credits are consumed by future chargeable points and can be earned again after use. Suspended (SUS) carries 0 points but resets clean-attendance progress. Doctor-note coverage counts as one occurrence with the configured ${attendanceDoctorNoteReductionPercent()}% point reduction (${attendanceDoctorNoteChargePercent()}% charged) on the first matching event; additional matching days on the same note add no extra points. Live Schedule is the primary authority for scheduled/off days; Roster RDO is used only when that weekday has no usable live schedule.</div><div class="subnav">${views.map(v=>`<button class="${activeAttView===v?'active':''}" onclick="activeAttView='${v}';safeRenderPages()">${labels[v]}</button>`).join('')}</div>${activeAttView==='daily'?renderPointDaily():activeAttView==='grid'?renderPointGrid():activeAttView==='review'?renderPointReview():activeAttView==='medical'?renderDoctorNotes():activeAttView==='actions'?renderPointCorrectiveActions():renderAudit()}`;
}

function attendanceDailyShiftRank(shift){const i=ATTENDANCE_DAILY_SHIFT_ORDER.indexOf(String(shift||''));return i>=0?i:99;}
function attendanceDailyShiftList(){
  const present=Array.from(new Set(activeAttendanceEmployees().map(e=>e.shift).filter(Boolean)));
  return [...ATTENDANCE_DAILY_SHIFT_ORDER.filter(s=>present.includes(s)),...present.filter(s=>!ATTENDANCE_DAILY_SHIFT_ORDER.includes(s)).sort()];
}
function pointDailyRows(){
  let rows=activeAttendanceEmployees().slice().sort((a,b)=>attendanceDailyShiftRank(a.shift)-attendanceDailyShiftRank(b.shift)||(a.shift||'').localeCompare(b.shift||'')||(a.name||'').localeCompare(b.name||''));
  if(entryShift!=='All')rows=rows.filter(e=>e.shift===entryShift);
  if(showBlanks)rows=rows.filter(e=>!attendanceEffectiveCode(e,entryDate));
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
  return `<div class="card"><div class="card-title">Daily Attendance Entry</div><div class="toolbar"><div><label>Date</label><input type="date" value="${entryDate}" onchange="entryDate=this.value;safeRenderPages()"></div><div><label>Shift</label><select onchange="entryShift=this.value;safeRenderPages()">${shifts.map(s=>`<option ${entryShift===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div><button onclick="showBlanks=!showBlanks;safeRenderPages()">${showBlanks?'Show All':'Missing Entries Only'}</button></div><div class="mini-note">Daily Entry order: 3rd Shift → 1st Shift → 2nd Shift → Gate → Reception. Off status comes from the Live Schedule when populated for that weekday, with Roster RDO as fallback.</div>${locked?'<div class="notice warn">Entry is locked until the legacy Attendance migration is committed.</div>':''}</div><div class="people-list">${groups.map(g=>renderPointDailyGroup(g,locked)).join('')}</div>`;
}
function pointDailyCounts(rows){let entered=0,blank=0,off=0;for(const e of rows||[]){const c=attendanceEffectiveCode(e,entryDate);if(c){entered++;if(c==='O')off++;}else blank++;}return{entered,blank,off,total:(rows||[]).length};}
function renderPointDailyGroup(g,locked=false){
  const counts=pointDailyCounts(g.rows||[]);
  return `<div class="shift-card"><div class="shift-head"><div>${esc(g.shift)} (${(g.rows||[]).length})</div><div>${counts.entered} / ${counts.total} entered · ${counts.blank} missing · ${counts.off} Off</div></div>${(g.rows||[]).map(e=>renderPointDailyRow(e,locked)).join('')}</div>`;
}
function applyAttendancePointCode(empId,date,code){if(setAttendancePointCode(empId,date,code))safeRenderPages({preserveScroll:true});}
function renderPointDailyRow(e,locked=false){
  const current=attendanceEffectiveCode(e,entryDate);
  const sched=attendanceScheduleStatus(e,entryDate);
  const snap=attendancePointSnapshot(e.id,entryDate);
  const risk=attendanceEmployeePointClass(e.id,entryDate);
  const medical=attendanceMedicalCoverageFor(e.id,entryDate,current);
  return `<div class="person-row"><div class="person-name att-employee-name-wrap ${risk}">${attendanceEmployeeProfileLink(e)}<span>${esc(e.title)} · ${esc(e.shift)}</span><span class="mini-note">Active Points: ${snap.activePoints} · Positive Credit: ${snap.bank}/${snap.maxCredits} · Clean Workdays: ${snap.cleanWorkingDays}/12 · ${sched.source==='live-schedule'?'Live Schedule':'Roster RDO fallback'}${medical?` · Doctor Note ${attendanceDoctorNoteReductionPercent()}% Reduction`:''}</span></div><div class="row-code-pad">${ATT_POINT_CODES.map(x=>`<button class="row-code-btn ${current===x.code||(['CO1','CO2'].includes(current)&&x.code==='CO')?'active':''}" title="${esc(x.label+(x.code==='CO'?' · auto-classified':` · ${attendancePointDisplayValue(x.code)} pt`))}" ${locked?'disabled':''} onclick="event.stopPropagation();applyAttendancePointCode('${esc(e.id)}','${entryDate}','${x.code}')">${esc(x.code)}</button>`).join('')}</div><div class="row-status"><span class="badge ${esc(current)}">${esc(current||'Blank')}</span></div><div><button class="sm" onclick="event.stopPropagation();editNote('${esc(e.id)}','${entryDate}')">Note</button> <button class="sm" data-capability="attendance.edit" onclick="event.stopPropagation();openDoctorNoteModal('${esc(e.id)}','${entryDate}','${entryDate}')">Doctor Note</button></div></div>`;
}

function pointGridEmployees(){
  let emps=activeAttendanceEmployees().slice().sort((a,b)=>attendanceDailyShiftRank(a.shift)-attendanceDailyShiftRank(b.shift)||(a.shift||'').localeCompare(b.shift||'')||(a.name||'').localeCompare(b.name||''));
  if(pointGridShift!=='All')emps=emps.filter(e=>e.shift===pointGridShift);
  return emps;
}
function pointGridEditOptionValue(code){return ['CO1','CO2'].includes(code)?'CO':(code==='T>5'?'T15+':code);}
function pointGridCell(emp,d,earnedDates=new Set()){
  const c=attendanceEffectiveCode(emp,d),medical=attendanceMedicalCoverageFor(emp.id,d,c);
  const medicalPoints=medical?attendanceMedicalDisplayPoints(emp.id,d,c):null;
  const pts=medical?Number(medicalPoints||0):attendanceEventPointValue(emp.id,d,c);
  const earned=earnedDates.has(d);
  const statusClass=medical?'att-status-approved':pointGridStatusClass(c,pts);
  const classes=['att-point-cell','att-point-editable',statusClass,medical?'att-medical-covered':'',earned?'att-positive-earned':''].filter(Boolean).join(' ');
  const pointText=pts>0?String(pts):'';
  const medicalDetail=medical?(attendanceMedicalIsPrimaryEvent(medical,d,c)?` · Doctor note ${attendanceDoctorNoteReductionPercent()}% reduction · ${pts} pt`:' · Doctor note same occurrence · 0 additional points'):'';
  return `<td class="${classes}" onclick="openPointGridEditModal('${esc(emp.id)}','${esc(d)}')" title="${esc(d+' · '+pointCodeLabel(c)+medicalDetail+(!medical&&pts?' · '+pts+' pt':'')+(earned?' · +1 positive attendance point earned':'')+' · Click to edit with required reason')}"><div class="att-point-code">${esc(c||'')}</div>${pointText?`<div class="mini-note">${esc(pointText)}</div>`:''}${medical?'<span class="point-medical-note">DN</span>':''}${earned?'<span class="point-positive-award">+1</span>':''}</td>`;
}
function openPointGridEditModal(empId,date){
  if(attendanceMigrationPending()){toast('Commit the Attendance Point System migration before editing historical records.');return;}
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  const storedCode=getCode(empId,date)||'';
  const oldCode=storedCode||attendanceEffectiveCode(emp,date)||'';
  const selectValue=pointGridEditOptionValue(oldCode);
  const options=[{code:'',label:'Clear / Blank'},...ATT_POINT_CODES];
  const existingNote=(attendance.notes&&attendance.notes[tardyRecordKey(empId,date)])||'';
  showModal(`<div class="modal-head"><div><div class="modal-title">Edit 90-Day Attendance Record</div><div class="mini-note">${esc(emp.name)} · ${esc(fmt(date))} · Current: ${esc(oldCode||'Blank')}</div></div><button onclick="closeModal()">Close</button></div><div class="notice warn"><strong>Controlled historical correction.</strong> A reason is required and the change is retained in the Attendance correction history and audit log.</div><div class="form-grid"><div><label>Attendance Code</label><select id="gridEditCode">${options.map(x=>`<option value="${esc(x.code)}" ${selectValue===x.code?'selected':''}>${esc(x.code?x.code+' · '+x.label:x.label)}</option>`).join('')}</select></div><div><label>Date</label><input value="${esc(date)}" disabled></div><div class="full"><label>Attendance Note</label><textarea id="gridEditNote" placeholder="Optional attendance detail">${esc(existingNote)}</textarea></div><div class="full"><label>Reason for Record Change *</label><textarea id="gridEditReason" placeholder="Required: explain why this historical record is being changed"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="savePointGridEdit('${esc(empId)}','${esc(date)}')">Save Historical Correction</button></div>`);
}
function savePointGridEdit(empId,date){
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  const reason=String(val('gridEditReason')||'').trim();
  if(!reason){toast('A reason is required to edit a 90-Day Grid record.');return;}
  const key=String(empId),noteKey=tardyRecordKey(empId,date),storedOldCode=getCode(empId,date)||'',oldCode=storedOldCode||attendanceEffectiveCode(emp,date)||'',oldNote=(attendance.notes&&attendance.notes[noteKey])||'';
  let requested=String(val('gridEditCode')||'').trim().toUpperCase();
  const newNote=String(val('gridEditNote')||'').trim();
  attendance.attendance=attendance.attendance||{};attendance.attendance[key]=attendance.attendance[key]||{};attendance.notes=attendance.notes||{};
  if(!requested){delete attendance.attendance[key][date];delete attendance.notes[noteKey];if(attendance.workdayBasis)delete attendance.workdayBasis[noteKey];if(attendance.autoOff)delete attendance.autoOff[noteKey];}
  else{
    attendance.attendance[key][date]=requested;
    if(newNote)attendance.notes[noteKey]=newNote;else delete attendance.notes[noteKey];
    attendanceCaptureWorkdayBasis(key,date,requested,'historical-correction');
    if(attendance.autoOff)delete attendance.autoOff[noteKey];
    attendance.tardyReclassifications=attendance.tardyReclassifications||{};
    if(requested==='T<5')attendance.tardyReclassifications[noteKey]={at:new Date().toISOString(),by:currentUserName()||env.user||'',reason};
    else delete attendance.tardyReclassifications[noteKey];
  }
  reclassifyCalloffsForEmployee(key);
  const finalCode=getCode(key,date)||'';
  attendance.recordEdits=Array.isArray(attendance.recordEdits)?attendance.recordEdits:[];
  attendance.recordEdits.unshift({id:'re-'+Date.now(),empId:key,employee:emp.name,date,oldCode,newCode:finalCode,requestedCode:requested,oldNote,newNote,reason,at:new Date().toISOString(),by:currentUserName()||env.user||'',machine:env.machine||''});
  attendance.recordEdits=attendance.recordEdits.slice(0,2000);
  audit('Historical attendance record corrected',`${emp.name} · ${date} · ${oldCode||'Blank'} → ${finalCode||'Blank'} · Reason: ${reason}`);
  closeModal();saveAttendance('historical-grid-correction');safeRenderPages({preserveScroll:true});toast('Historical attendance correction saved.');
}

function pointGridShiftGroups(emps){return pointDailyGroups(emps);}
function renderPointGridEmployeeRow(e,dates,end){
  const snap=attendancePointSnapshot(e.id,end);
  const earnedDates=new Set((snap.earned||[]).map(x=>x.date));
  return `<tr><td class="name">${attendanceEmployeeNameHtml(e,end)}</td>${dates.map(d=>pointGridCell(e,d,earnedDates)).join('')}</tr>`;
}
function renderPointGrid(){
  const end=gridEnd||pointSystemAsOf();
  const dates=[];for(let d=end;d>=addDays(end,-89);d=addDays(d,-1))dates.push(d);
  const allEmps=activeAttendanceEmployees().slice().sort((a,b)=>attendanceDailyShiftRank(a.shift)-attendanceDailyShiftRank(b.shift)||(a.shift||'').localeCompare(b.shift||'')||(a.name||'').localeCompare(b.name||''));
  const shifts=['All',...attendanceDailyShiftList()];
  const emps=pointGridEmployees();
  if(!selectedGridEmpId&&allEmps.length)selectedGridEmpId=String(allEmps[0].id);
  const emp=allEmps.find(e=>String(e.id)===String(selectedGridEmpId))||allEmps[0];
  if(!emp)return '<div class="card">No active Attendance employees.</div>';
  const single=pointGridMode==='single';
  const snap=attendancePointSnapshot(emp.id,end);
  const controls=`<div class="toolbar"><div><label>View</label><select onchange="pointGridMode=this.value;safeRenderPages()"><option value="all" ${!single?'selected':''}>All Employees</option><option value="single" ${single?'selected':''}>Single Employee</option></select></div>${single?`<div><label>Employee</label><select onchange="selectedGridEmpId=this.value;safeRenderPages()">${allEmps.map(e=>`<option value="${esc(e.id)}" ${String(e.id)===String(emp.id)?'selected':''}>${esc(e.name)} · ${esc(e.shift)}</option>`).join('')}</select></div>`:`<div><label>Shift</label><select onchange="pointGridShift=this.value;safeRenderPages()">${shifts.map(s=>`<option ${pointGridShift===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>`}<div><label>Ending Date</label><input type="date" value="${end}" onchange="gridEnd=this.value;safeRenderPages()"></div></div>`;
  const adjustmentNote=snap.adjustment?`<div class="health-row"><span>Manual Point Adjustment</span><strong>Set to ${snap.adjustment.newActivePoints} on ${esc(fmt(snap.adjustment.effectiveDate))}</strong></div>`:'';
  const summary=single?`<div class="health-row"><span>Calculated 90-Day Points</span><strong>${snap.calculatedActivePoints}</strong></div>${adjustmentNote}<div class="health-row"><span>Active Disciplinary Points</span><strong>${snap.activePoints}</strong></div><div class="health-row"><span>Positive Credit Bank</span><strong>${snap.bank} / ${snap.maxCredits}</strong></div><div class="toolbar"><button class="sm" data-capability="attendance.adjustPoints" onclick="openPointAdjustmentModal('${esc(emp.id)}')">Edit Current Points</button> <button class="sm" data-capability="attendance.edit" onclick="openDoctorNoteModal('${esc(emp.id)}')">Doctor Note</button></div>`:`<div class="mini-note">Showing ${emps.length} active employee(s)${pointGridShift==='All'?'':' · '+esc(pointGridShift)}. Employees are separated by shift in operational order.</div>`;
  const legend=`<div class="att-point-grid-legend"><span class="att-legend present">Present</span><span class="att-legend approved">Approved / Doctor Note</span><span class="att-legend medical">DN = Doctor Note ${attendanceDoctorNoteReductionPercent()}% reduction / single occurrence</span><span class="att-legend suspended">Suspended · 0 pts / resets clean streak</span><span class="att-legend low">Low Point Action</span><span class="att-legend high">High Point Action</span><span class="att-legend positive">+ Positive Point Earned</span><span class="att-legend ne">Not Employed</span><span class="att-legend off">Off = no highlight</span></div>`;
  let body='';
  if(single){body=renderPointGridEmployeeRow(emp,dates,end);}
  else{
    const groups=pointGridShiftGroups(emps);
    body=groups.map(g=>`<tr class="att-point-grid-shift-row"><td colspan="${dates.length+1}">${esc(g.shift)} · ${g.rows.length} employee(s)</td></tr>${g.rows.map(e=>renderPointGridEmployeeRow(e,dates,end)).join('')}`).join('');
  }
  return `<div class="card"><div class="card-title">90-Day Grid</div>${controls}<div class="mini-note">The ending/current date is the first column on the left; older dates continue to the right. Click any attendance cell to make a controlled correction with a required reason.</div>${summary}${legend}</div><div class="table-wrap attendance-point-grid-wrap" id="attendancePointGridWrap"><table><thead><tr><th class="name">Employee</th>${dates.map(d=>`<th style="min-width:38px">${d.slice(5)}</th>`).join('')}</tr></thead><tbody>${body||`<tr><td colspan="${dates.length+1}">No employees match the selected shift.</td></tr>`}</tbody></table></div>`;
}

function doctorNoteDefaultCodes(){return ['CO','T<5','T5-14','T15+'];}
function doctorNoteFormHtml(note=null,empId='',startDate='',endDate=''){
  const emps=activeAttendanceEmployees().slice().sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  if(note){const linked=attendanceMedicalNoteEmployee(note);if(linked&&!emps.some(e=>String(e.id)===String(linked.id)))emps.unshift(linked);}
  if(!emps.length)return '';
  const today=attendanceLocalToday();
  const selected=note?String(note.empId||''):(emps.some(e=>String(e.id)===String(empId))?String(empId):String(emps[0].id));
  const coverageStart=note&&isIsoDateKey(note.startDate)?note.startDate:(isIsoDateKey(startDate)?startDate:today);
  const coverageEnd=note&&isIsoDateKey(note.endDate)?note.endDate:(isIsoDateKey(endDate)?endDate:coverageStart);
  const received=note&&isIsoDateKey(note.receivedDate)?note.receivedDate:today;
  const codes=new Set(note&&Array.isArray(note.coveredCodes)?note.coveredCodes:doctorNoteDefaultCodes());
  const reduction=attendanceDoctorNoteReductionPercent(),charge=attendanceDoctorNoteChargePercent();
  const editing=!!note;
  return `<div class="modal-head"><div><div class="modal-title">${editing?'Edit':'Add'} Doctor Note Coverage</div><div class="mini-note">Controlled attendance exception with date-range coverage and audit history</div></div><button onclick="closeModal()">Close</button></div><div class="notice"><strong>Coverage preserves the original attendance record.</strong> The first matching event in the covered date range is treated as one doctor-note occurrence with a ${reduction}% point reduction (${charge}% of normal points charged). Additional matching days covered by the same note add no extra points. A doctor-note occurrence still resets clean-attendance progress. For call-offs, the covered range counts as one call-off occurrence for the rolling 14-day CO1/CO2 rule. Do not enter diagnosis or medical details; use only an administrative reference.</div><div class="form-grid"><div class="full"><label>Employee</label><select id="medicalEmpId" ${editing?'disabled':''}>${emps.map(e=>`<option value="${esc(e.id)}" ${String(e.id)===selected?'selected':''}>${esc(e.name)} · ${esc(e.shift||'')}</option>`).join('')}</select></div><div><label>Coverage Start Date</label><input id="medicalStartDate" type="date" value="${coverageStart}"></div><div><label>Coverage End Date</label><input id="medicalEndDate" type="date" value="${coverageEnd}"></div><div><label>Doctor Note Received</label><input id="medicalReceivedDate" type="date" value="${received}"></div><div><label>Administrative Reference</label><input id="medicalReference" value="${esc(note&&note.reference||'')}" placeholder="Example: Note received / HR file reference"></div><div class="full"><label>Attendance Events Covered</label><div class="att-medical-code-grid">${ATT_MEDICAL_CODE_OPTIONS.map(x=>`<label class="att-medical-code-option"><input type="checkbox" id="medicalCode_${x.code.replace(/[^A-Za-z0-9]/g,'_')}" ${codes.has(x.code)?'checked':''}> <span>${esc(x.code)} · ${esc(x.label)}</span></label>`).join('')}</div></div><div class="full"><label>Administrative Note</label><textarea id="medicalAdminNote" placeholder="Optional. Do not enter diagnosis, treatment, or other medical details.">${esc(note&&note.adminNote||'')}</textarea></div>${editing?`<div class="full"><label>Reason for Editing Coverage *</label><textarea id="medicalEditReason" placeholder="Required: document why the doctor-note coverage dates or details changed"></textarea></div>`:''}</div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="${editing?`saveDoctorNoteEdit('${esc(note.id)}')`:'saveDoctorNoteCoverage()'}">${editing?'Save Changes':'Save Coverage'} & Recalculate</button></div>`;
}
function openDoctorNoteModal(empId='',startDate='',endDate=''){
  if(attendanceMigrationPending()){toast('Commit the Attendance Point System migration before adding doctor-note coverage.');return;}
  if(!hasCapability('attendance.edit')){toast('The attendance.edit capability is required for doctor-note coverage.');return;}
  if(!activeAttendanceEmployees().length){toast('No active Attendance employees are available.');return;}
  showModal(doctorNoteFormHtml(null,empId,startDate,endDate));
}
function openDoctorNoteEditModal(id){
  if(attendanceMigrationPending()){toast('Commit the Attendance Point System migration before editing doctor-note coverage.');return;}
  if(!hasCapability('attendance.edit')){toast('The attendance.edit capability is required for doctor-note coverage.');return;}
  const note=(attendance.medicalNotes||[]).find(n=>String(n.id)===String(id));
  if(!note||note.voided){toast('Only active doctor-note coverage can be edited.');return;}
  showModal(doctorNoteFormHtml(note));
}
function selectedDoctorNoteCodes(){return ATT_MEDICAL_CODE_OPTIONS.filter(x=>{const el=document.getElementById('medicalCode_'+x.code.replace(/[^A-Za-z0-9]/g,'_'));return !!(el&&el.checked);}).map(x=>x.code);}
function readDoctorNoteForm(){
  const empId=String(val('medicalEmpId')||'').trim();
  const startDate=String(val('medicalStartDate')||'').trim(),endDate=String(val('medicalEndDate')||'').trim(),receivedDate=String(val('medicalReceivedDate')||'').trim();
  const reference=String(val('medicalReference')||'').trim(),adminNote=String(val('medicalAdminNote')||'').trim();
  const coveredCodes=selectedDoctorNoteCodes();
  if(!isIsoDateKey(startDate)||!isIsoDateKey(endDate)||!isIsoDateKey(receivedDate))throw new Error('Coverage start, end, and received dates are required.');
  if(endDate<startDate)throw new Error('Doctor-note coverage end date cannot be before the start date.');
  if(!coveredCodes.length)throw new Error('Select at least one attendance event type for the doctor note to cover.');
  if(!reference)throw new Error('An administrative reference is required. Do not enter medical details.');
  return {empId,startDate,endDate,receivedDate,reference,adminNote,coveredCodes};
}
async function saveDoctorNoteCoverage(){
  if(!hasCapability('attendance.edit')){toast('The attendance.edit capability is required for doctor-note coverage.');return;}
  let form;try{form=readDoctorNoteForm();}catch(e){toast(e.message||e);return;}
  const emp=(attendance.employees||[]).find(e=>String(e.id)===form.empId);if(!emp){toast('Select a valid employee.');return;}
  const matching=attendanceMedicalMatchingEvents(form);
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){toast('Doctor-note coverage stopped: backup failed. '+(e.message||e));return;}
  const note={id:'mn-'+Date.now(),empId:form.empId,employee:emp.name,startDate:form.startDate,endDate:form.endDate,receivedDate:form.receivedDate,coveredCodes:[...form.coveredCodes],reference:form.reference,adminNote:form.adminNote,matchingAtEntry:matching.map(x=>({date:x.date,code:x.code})),editHistory:[],at:new Date().toISOString(),by:currentUserName()||env.user||'',machine:env.machine||'',voided:false};
  attendance.medicalNotes=Array.isArray(attendance.medicalNotes)?attendance.medicalNotes:[];
  attendance.medicalNotes.unshift(note);
  attendance.medicalNotes=attendance.medicalNotes.slice(0,2000);
  reclassifyCalloffsForEmployee(form.empId);
  const reduction=attendanceDoctorNoteReductionPercent();
  audit('Doctor note coverage added',`${emp.name} · ${form.startDate} through ${form.endDate} · ${reduction}% point reduction / single-occurrence treatment · ${form.coveredCodes.join(', ')} · ${matching.length} current matching event(s) · Reference: ${form.reference}`);
  closeModal();
  const ok=await saveAttendanceNow('doctor-note-coverage');
  if(ok){safeRenderPages();toast(`Doctor note saved. The covered range will count as one attendance occurrence with the configured ${reduction}% point reduction; additional matching days add no extra points, and later-entered matches inside the range recalculate automatically.`);}
}
async function saveDoctorNoteEdit(id){
  if(!hasCapability('attendance.edit')){toast('The attendance.edit capability is required for doctor-note coverage.');return;}
  const note=(attendance.medicalNotes||[]).find(n=>String(n.id)===String(id));if(!note||note.voided){toast('Only active doctor-note coverage can be edited.');return;}
  let form;try{form=readDoctorNoteForm();}catch(e){toast(e.message||e);return;}
  const reason=String(val('medicalEditReason')||'').trim();if(!reason){toast('A reason is required to edit doctor-note coverage.');return;}
  if(String(note.empId)!==String(form.empId)){toast('The employee on an existing doctor note cannot be changed. Void it and create a new note if needed.');return;}
  const before={startDate:note.startDate,endDate:note.endDate,receivedDate:note.receivedDate,coveredCodes:[...(note.coveredCodes||[])],reference:note.reference||'',adminNote:note.adminNote||''};
  const after={startDate:form.startDate,endDate:form.endDate,receivedDate:form.receivedDate,coveredCodes:[...form.coveredCodes],reference:form.reference,adminNote:form.adminNote};
  if(JSON.stringify(before)===JSON.stringify(after)){toast('No doctor-note coverage changes were made.');return;}
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){toast('Doctor-note edit stopped: backup failed. '+(e.message||e));return;}
  const priorHistory=Array.isArray(note.editHistory)?note.editHistory.slice():[];
  Object.assign(note,after);
  note.editHistory=priorHistory;
  const edit={id:'mne-'+Date.now(),at:new Date().toISOString(),by:currentUserName()||env.user||'',machine:env.machine||'',reason,before,after};
  note.editHistory.unshift(edit);note.editHistory=note.editHistory.slice(0,200);
  note.lastEditedAt=edit.at;note.lastEditedBy=edit.by;
  reclassifyCalloffsForEmployee(note.empId);
  const matches=attendanceMedicalMatchingEvents(note);
  audit('Doctor note coverage edited',`${note.employee||note.empId} · ${before.startDate} through ${before.endDate} → ${after.startDate} through ${after.endDate} · ${matches.length} current matching event(s) · Reason: ${reason}`);
  closeModal();
  const ok=await saveAttendanceNow('doctor-note-coverage-edit');
  if(ok){safeRenderPages();toast('Doctor-note coverage updated and attendance recalculated.');}
}
async function voidDoctorNoteCoverage(id){
  if(!hasCapability('attendance.edit')){toast('The attendance.edit capability is required for doctor-note coverage.');return;}
  const note=(attendance.medicalNotes||[]).find(n=>String(n.id)===String(id));if(!note||note.voided)return;
  const reason=prompt('Reason for voiding this doctor-note coverage:','');
  if(reason===null)return;
  if(!String(reason).trim()){toast('A reason is required to void doctor-note coverage.');return;}
  if(!confirm('Void this doctor-note coverage? Attendance points and call-off classifications will recalculate immediately.'))return;
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){toast('Doctor-note void stopped: backup failed. '+(e.message||e));return;}
  note.voided=true;note.voidedAt=new Date().toISOString();note.voidedBy=currentUserName()||env.user||'';note.voidReason=String(reason).trim();
  reclassifyCalloffsForEmployee(note.empId);
  audit('Doctor note coverage voided',`${note.employee||note.empId} · ${note.startDate} through ${note.endDate} · Reason: ${note.voidReason}`);
  const ok=await saveAttendanceNow('doctor-note-coverage-void');
  if(ok){safeRenderPages();toast('Doctor-note coverage voided and attendance recalculated.');}
}
function renderDoctorNotes(){
  const notes=(attendance.medicalNotes||[]).slice().sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).filter(n=>medicalNoteFilter==='all'||(medicalNoteFilter==='active'&&!n.voided)||(medicalNoteFilter==='voided'&&n.voided));
  const reduction=attendanceDoctorNoteReductionPercent(),charge=attendanceDoctorNoteChargePercent();
  return `<div class="card"><div class="card-title">Doctor Note Coverage</div><div class="toolbar"><button class="primary" data-capability="attendance.edit" onclick="openDoctorNoteModal()">Add Doctor Note</button><div><label>Status</label><select onchange="medicalNoteFilter=this.value;safeRenderPages()"><option value="active" ${medicalNoteFilter==='active'?'selected':''}>Active</option><option value="voided" ${medicalNoteFilter==='voided'?'selected':''}>Voided</option><option value="all" ${medicalNoteFilter==='all'?'selected':''}>All</option></select></div></div><div class="notice">Doctor-note coverage is an attendance calculation control, not a medical record repository. The covered range counts as one occurrence with the current ${reduction}% point reduction (${charge}% charged) on the first matching event; additional matching days add no extra points. Original attendance codes remain visible. Active coverage can be edited if the authorized date range changes. Store only administrative references here and keep medical details in the appropriate HR process.</div></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Coverage Range</th><th>Events Covered</th><th>Point Treatment</th><th>Received</th><th>Current Matches</th><th>Reference</th><th>Status</th><th>Action</th></tr></thead><tbody>${notes.map(n=>{const emp=attendanceMedicalNoteEmployee(n);const matches=attendanceMedicalMatchingEvents(n);const edits=(n.editHistory||[]).length;return `<tr><td>${emp?attendanceEmployeeProfileLink(emp,n.employee||emp.name):esc(n.employee||n.empId)}</td><td>${esc(fmt(n.startDate))} → ${esc(fmt(n.endDate))}${edits?`<div class="mini-note">Edited ${edits} time${edits===1?'':'s'}${n.lastEditedAt?' · '+esc(String(n.lastEditedAt).replace('T',' ').slice(0,16)):''}</div>`:''}</td><td>${esc((n.coveredCodes||[]).join(', '))}</td><td>${esc(reduction)}% reduction<div class="mini-note">${esc(charge)}% charged once</div></td><td>${esc(fmt(n.receivedDate||''))}</td><td>${matches.length}${matches.length?`<div class="mini-note">${esc(matches.map(x=>x.date+' '+x.code).join(' · '))}</div>`:''}</td><td>${esc(n.reference||'')}${n.adminNote?`<div class="mini-note">${esc(n.adminNote)}</div>`:''}</td><td>${n.voided?`<span class="chip critical">Voided</span><div class="mini-note">${esc(n.voidReason||'')}</div>`:'<span class="chip ok">Active</span>'}</td><td>${!n.voided?`<button class="sm" data-capability="attendance.edit" onclick="openDoctorNoteEditModal('${esc(n.id)}')">Edit</button> <button class="sm danger" data-capability="attendance.edit" onclick="voidDoctorNoteCoverage('${esc(n.id)}')">Void</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="9">No doctor-note coverage records match this view.</td></tr>'}</tbody></table></div>`;
}

function pointReviewRows(){
  let emps=sortedEmployees();
  if(pointReviewShift!=='All')emps=emps.filter(e=>e.shift===pointReviewShift);
  const q=pointReviewSearch.trim().toLowerCase();if(q)emps=emps.filter(e=>(e.name+' '+e.title+' '+e.shift).toLowerCase().includes(q));
  return emps.map(emp=>({emp,snap:attendancePointSnapshot(emp.id)})).sort((a,b)=>b.snap.activePoints-a.snap.activePoints||a.emp.name.localeCompare(b.emp.name));
}
function updateDoctorNoteReductionPreview(){
  const input=document.getElementById('doctorNoteReductionPercent'),out=document.getElementById('doctorNoteChargePreview');
  if(!input||!out)return;
  const raw=Number(input.value);
  out.value=Number.isFinite(raw)&&raw>=0&&raw<=100?`${Number((100-raw).toFixed(2))}% of the first matching event`:'Enter 0-100%';
}
function openPointValueSettingsModal(){
  if(!hasCapability('attendance.managePolicy')){toast('The attendance.managePolicy capability is required.');return;}
  if(attendanceMigrationPending()){toast('Commit the Attendance Point System migration before editing point values.');return;}
  const values=attendanceConfiguredPointValues();
  const fields=[
    ['T<5','Tardy Less Than 5 Minutes'],['T5-14','Tardy 5-14 Minutes'],['T15+','Tardy 15 Minutes or More'],
    ['CO1','Call Off - First in Rolling 14 Days'],['CO2','Call Off - Additional in Rolling 14 Days'],
    ['NCNS','No Call No Show'],['LE','Left Early'],['EIA','Clocked In Early Without Approval']
  ];
  const rows=fields.map(([code,label])=>`<tr><td><strong>${esc(code)}</strong></td><td>${esc(label)}</td><td><input id="pointValue_${code.replace(/[^A-Za-z0-9]/g,'_')}" type="number" min="0" step="0.5" value="${esc(values[code])}" style="max-width:120px"></td></tr>`).join('');
  const last=(attendance.pointSystem.pointValueHistory||[])[0];
  const doctorReduction=attendanceDoctorNoteReductionPercent();
  showModal(`<div class="modal-head"><div><div class="modal-title">Edit Attendance Point Values</div><div class="mini-note">Administrator policy control · changes recalculate Attendance immediately after save</div></div><button onclick="closeModal()">Close</button></div><div class="notice warn"><strong>Policy-level change.</strong> Saving new values or the doctor-note reduction recalculates historical attendance under the current point policy, including 90-day totals, positive-credit paydowns, thresholds, highlighting, and reports. Manual Edit Current Points adjustments remain authoritative baselines; only attendance after their effective date is recalculated into that controlled balance.</div><div class="table-wrap"><table><thead><tr><th>Code</th><th>Attendance Event</th><th>Points</th></tr></thead><tbody>${rows}</tbody></table></div><div class="card" style="margin-top:12px"><div class="card-title">Doctor Note Point Treatment</div><div class="form-grid"><div><label>Doctor Note Point Reduction %</label><input id="doctorNoteReductionPercent" type="number" min="0" max="100" step="1" value="${esc(doctorReduction)}" oninput="updateDoctorNoteReductionPreview()"></div><div><label>Resulting Charge</label><input id="doctorNoteChargePreview" value="${esc(Number((100-doctorReduction).toFixed(2)))}% of the first matching event" disabled></div></div><div class="mini-note">Example: a 50% reduction charges half of the original point value. The covered date range still counts as one occurrence, and additional matching days add no extra points.</div></div><div style="margin-top:12px"><label>Reason for Point-Policy Change *</label><textarea id="pointValueReason" placeholder="Required: document the policy or management reason for changing point values"></textarea></div>${last?`<div class="mini-note" style="margin-top:8px">Last change: ${esc(String(last.at||'').replace('T',' ').slice(0,19))} by ${esc(last.by||'')} · ${esc(last.reason||'')}</div>`:''}<div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="savePointValueSettings()">Save Values & Recalculate</button></div>`);
}
async function savePointValueSettings(){
  if(!hasCapability('attendance.managePolicy')){toast('The attendance.managePolicy capability is required.');return;}
  const reason=String(val('pointValueReason')||'').trim();
  if(!reason){toast('A reason is required to change attendance point values.');return;}
  const ids={'T<5':'pointValue_T_5','T5-14':'pointValue_T5_14','T15+':'pointValue_T15_','CO1':'pointValue_CO1','CO2':'pointValue_CO2','NCNS':'pointValue_NCNS','LE':'pointValue_LE','EIA':'pointValue_EIA'};
  const before=attendanceConfiguredPointValues();
  const beforeReduction=attendanceDoctorNoteReductionPercent();
  const next={};
  for(const code of Object.keys(ATT_DEFAULT_POINT_VALUES)){
    const raw=Number(val(ids[code]));
    if(!Number.isFinite(raw)||raw<0){toast(code+' must have a point value of zero or greater.');return;}
    next[code]=Number(raw.toFixed(2));
  }
  const nextReduction=normalizeDoctorNoteReductionPercent(val('doctorNoteReductionPercent'));
  const rawReduction=Number(val('doctorNoteReductionPercent'));
  if(!Number.isFinite(rawReduction)||rawReduction<0||rawReduction>100){toast('Doctor Note Point Reduction must be between 0% and 100%.');return;}
  const changed=Object.keys(next).filter(code=>Number(before[code])!==Number(next[code]));
  const reductionChanged=Number(beforeReduction)!==Number(nextReduction);
  if(!changed.length&&!reductionChanged){toast('No point-policy values were changed.');return;}
  const asOf=attendanceLocalToday();
  const employees=activeAttendanceEmployees();
  const beforeSnapshots=new Map(employees.map(emp=>[String(emp.id),attendancePointSnapshot(emp.id,asOf)]));
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){toast('Point-policy change stopped: backup failed. '+(e.message||e));return;}
  attendance.pointSystem.pointValues=normalizeAttendancePointValues(next);
  attendance.pointSystem.policy=attendance.pointSystem.policy&&typeof attendance.pointSystem.policy==='object'?attendance.pointSystem.policy:{};
  attendance.pointSystem.policy.doctorNoteReductionPercent=nextReduction;
  let affected=0;
  try{
    for(const emp of employees){
      const prior=beforeSnapshots.get(String(emp.id));
      const after=attendancePointSnapshot(emp.id,asOf);
      if(!prior||prior.activePoints!==after.activePoints||prior.calculatedActivePoints!==after.calculatedActivePoints||prior.bank!==after.bank)affected++;
    }
  }catch(e){
    attendance.pointSystem.pointValues=before;
    attendance.pointSystem.policy.doctorNoteReductionPercent=beforeReduction;
    toast('Point-policy recalculation failed and the change was not applied. '+(e.message||e));
    return;
  }
  const detailParts=changed.map(code=>`${code}: ${before[code]} → ${next[code]}`);
  if(reductionChanged)detailParts.push(`Doctor Note Reduction: ${beforeReduction}% → ${nextReduction}%`);
  const detail=detailParts.join(' · ');
  const record={id:'pv-'+Date.now(),at:new Date().toISOString(),by:currentUserName()||env.user||'',machine:env.machine||'',reason,before:{...before},after:{...next},beforePolicy:{doctorNoteReductionPercent:beforeReduction},afterPolicy:{doctorNoteReductionPercent:nextReduction},changedCodes:changed,doctorNoteReductionChanged:reductionChanged,affectedEmployees:affected,asOf};
  attendance.pointSystem.pointValueHistory=Array.isArray(attendance.pointSystem.pointValueHistory)?attendance.pointSystem.pointValueHistory:[];
  attendance.pointSystem.pointValueHistory.unshift(record);
  attendance.pointSystem.pointValueHistory=attendance.pointSystem.pointValueHistory.slice(0,200);
  attendance.pointSystem.lastRecalculatedAt=record.at;
  attendance.pointSystem.lastRecalculatedBy=record.by;
  attendance.pointSystem.lastRecalculationAffectedEmployees=affected;
  audit('Attendance point policy updated',`${detail} · ${affected} active employee(s) recalculated as of ${asOf} · Reason: ${reason}`);
  closeModal();
  const ok=await saveAttendanceNow('point-value-policy-update');
  if(ok){safeRenderPages();toast(`Attendance point policy updated. Recalculated ${affected} affected employee(s).`);}
}

function openPointAdjustmentModal(empId){if(!hasCapability('attendance.adjustPoints')){toast('The attendance.adjustPoints capability is required.');return;}
  if(attendanceMigrationPending()){toast('Commit the Attendance Point System migration before adjusting current points.');return;}
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  const asOf=pointSystemAsOf(),snap=attendancePointSnapshot(empId,asOf);
  const latest=snap.adjustment;
  showModal(`<div class="modal-head"><div><div class="modal-title">Edit Current Attendance Points</div><div class="mini-note">${esc(emp.name)} · current active points: ${snap.activePoints}</div></div><button onclick="closeModal()">Close</button></div><div class="notice warn"><strong>Manual point-control action.</strong> Saving a new current balance excludes attendance incidents on or before the effective date from future active-point calculations. The manually set balance remains active for up to 90 days from that effective date; future attendance incidents are added normally. A backup and audit record are created.</div><div class="form-grid"><div><label>Current Active Points</label><input value="${snap.activePoints}" disabled></div><div><label>New Active Points</label><input id="pointAdjValue" type="number" min="0" step="0.5" value="${snap.activePoints}"></div><div><label>Effective Date</label><input id="pointAdjDate" type="date" value="${esc(asOf)}"></div><div><label>Positive Credit Bank</label><input value="${snap.bank} / ${snap.maxCredits}" disabled></div><div class="full"><label>Reason for Point Adjustment *</label><textarea id="pointAdjReason" placeholder="Required: document why previously accumulated points are being reduced, cleared, or otherwise adjusted"></textarea></div>${latest?`<div class="full mini-note">Last adjustment: set to ${esc(latest.newActivePoints)} on ${esc(fmt(latest.effectiveDate))} by ${esc(latest.by||'')}.</div>`:''}</div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="savePointAdjustment('${esc(empId)}')">Save Point Adjustment</button></div>`);
}
async function savePointAdjustment(empId){if(!hasCapability('attendance.adjustPoints')){toast('The attendance.adjustPoints capability is required.');return;}
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  const effectiveDate=String(val('pointAdjDate')||'').trim();
  const reason=String(val('pointAdjReason')||'').trim();
  const raw=String(val('pointAdjValue')||'').trim();
  const newActivePoints=Number(raw);
  if(!isIsoDateKey(effectiveDate)){toast('A valid effective date is required.');return;}
  if(!Number.isFinite(newActivePoints)||newActivePoints<0){toast('New active points must be zero or greater.');return;}
  if(!reason){toast('A reason is required to edit current attendance points.');return;}
  const before=attendancePointSnapshot(empId,effectiveDate);
  if(Number(before.activePoints)===Number(newActivePoints)){toast('The new point balance matches the current balance. No adjustment was saved.');return;}
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){toast('Point adjustment stopped: backup failed. '+(e.message||e));return;}
  attendance.pointAdjustments=Array.isArray(attendance.pointAdjustments)?attendance.pointAdjustments:[];
  attendance.pointAdjustments.unshift({id:'pa-'+Date.now(),empId:String(empId),employee:emp.name,effectiveDate,newActivePoints:Number(newActivePoints.toFixed(2)),previousActivePoints:before.activePoints,calculatedPointsAtAdjustment:before.calculatedActivePoints,reason,at:new Date().toISOString(),by:currentUserName()||env.user||'',machine:env.machine||'',expiresOn:addDays(effectiveDate,89)});
  attendance.pointAdjustments=attendance.pointAdjustments.slice(0,1000);
  audit('Attendance point balance adjusted',`${emp.name} · ${before.activePoints} → ${Number(newActivePoints.toFixed(2))} active points effective ${effectiveDate} · Reason: ${reason}`);
  closeModal();
  const ok=await saveAttendanceNow('manual-point-adjustment');
  if(ok){safeRenderPages();toast('Current attendance points updated for '+emp.name+'.');}
}

function renderPointReview(){
  const shifts=['All',...Array.from(new Set(activeAttendanceEmployees().map(e=>e.shift).filter(Boolean)))];
  const rows=pointReviewRows();
  const asOf=pointSystemAsOf();
  return `<div class="card"><div class="card-title">Attendance Point Review</div><div class="toolbar"><div><label>Shift</label><select onchange="pointReviewShift=this.value;safeRenderPages()">${shifts.map(s=>`<option ${pointReviewShift===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div><div><label>Search</label><input value="${esc(pointReviewSearch)}" oninput="pointReviewSearch=this.value;safeRenderPages({preserveScroll:true})" placeholder="Employee..."></div><div class="chip">As of ${esc(fmt(asOf))}</div><button class="sm" data-capability="attendance.managePolicy" onclick="openPointValueSettingsModal()">Edit Point Values</button></div><div class="mini-note">Edit Current Points creates a controlled point-balance adjustment with a required reason, pre-save backup, and audit record. Attendance incidents through the effective date are excluded from future active-point calculations.</div></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Calculated 90-Day</th><th>Active Points</th><th>Positive Bank</th><th>Clean Workdays</th><th>Current Threshold</th><th>Adjustment</th><th>Next Step</th></tr></thead><tbody>${rows.map(({emp,snap})=>{const last=latestCorrectiveAction(emp.id);const due=attendanceActionRank(snap.level)>attendanceActionRank(last&&last.level||'None');const adj=snap.adjustment?`<span class="chip">Set ${esc(snap.adjustment.newActivePoints)} · ${esc(fmt(snap.adjustment.effectiveDate))}</span>`:'None';return `<tr><td class="name">${attendanceEmployeeNameHtml(emp,asOf)}</td><td>${snap.calculatedActivePoints}</td><td><strong>${snap.activePoints}</strong></td><td>${snap.bank} / ${snap.maxCredits}</td><td>${snap.cleanWorkingDays} / 12</td><td>${esc(snap.level)}</td><td>${adj}<br><button class="sm" data-capability="attendance.adjustPoints" onclick="openPointAdjustmentModal('${esc(emp.id)}')">Edit Current Points</button></td><td>${due?`<span class="chip critical">Action Due</span> <button class="sm" data-capability="attendance.correctiveAction" onclick="openCorrectiveActionModal('${esc(emp.id)}')">Record</button>`:'<span class="chip ok">Current</span>'}</td></tr>`}).join('')}</tbody></table></div>`;
}

function renderPointCorrectiveActions(){
  const asOf=pointSystemAsOf();
  const rows=sortedEmployees().map(emp=>({emp,snap:attendancePointSnapshot(emp.id,asOf),last:latestCorrectiveAction(emp.id)})).filter(x=>x.snap.level!=='None'||x.last).sort((a,b)=>b.snap.activePoints-a.snap.activePoints||a.emp.name.localeCompare(b.emp.name));
  return `<div class="card"><div class="card-title">Corrective Action Control</div><div class="notice">Disciplinary thresholds use active points after positive attendance credits are applied: Verbal Counseling at 3, Written Warning at 6, Final Written Warning at 9. Recording an action documents completion; it does not change the point calculation.</div></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Active Points</th><th>Required Level</th><th>Last Recorded Action</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(({emp,snap,last})=>{const due=attendanceActionRank(snap.level)>attendanceActionRank(last&&last.level||'None');return `<tr><td class="name">${attendanceEmployeeNameHtml(emp,asOf,emp.shift)}</td><td>${snap.activePoints}</td><td>${esc(snap.level)}</td><td>${last?`${esc(last.level)}<div class="mini-note">${esc(String(last.at||'').slice(0,10))} · ${esc(last.by||'')}</div>`:'None'}</td><td>${due?'<span class="chip critical">Due</span>':'<span class="chip ok">Current</span>'}</td><td><button class="sm" data-capability="attendance.correctiveAction" onclick="openCorrectiveActionModal('${esc(emp.id)}')">Record Action</button></td></tr>`}).join('')||'<tr><td colspan="6">No employees are currently at a corrective-action threshold.</td></tr>'}</tbody></table></div>`;
}

function openCorrectiveActionModal(empId){if(!hasCapability('attendance.correctiveAction')){toast('The attendance.correctiveAction capability is required.');return;}
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  const snap=attendancePointSnapshot(empId);
  const suggested=snap.level==='None'?'Verbal Counseling':snap.level;
  showModal(`<div class="modal-head"><div><div class="modal-title">Record Attendance Corrective Action</div><div class="mini-note">${esc(emp.name)} · ${snap.activePoints} active point(s)</div></div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div><label>Action Level</label><select id="caLevel">${['Verbal Counseling','Written Warning','Final Written Warning'].map(x=>`<option ${x===suggested?'selected':''}>${x}</option>`).join('')}</select></div><div><label>Action Date</label><input id="caDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="full"><label>Notes</label><textarea id="caNote" placeholder="Counseling/document reference, HR note, or management comments"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="saveCorrectiveAction('${esc(empId)}')">Record Action</button></div>`);
}
function saveCorrectiveAction(empId){if(!hasCapability('attendance.correctiveAction')){toast('The attendance.correctiveAction capability is required.');return;}
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(empId));if(!emp)return;
  const level=val('caLevel'),date=val('caDate'),note=val('caNote');
  if(!level||!date){toast('Action level and date are required.');return;}
  const snap=attendancePointSnapshot(empId,date);
  attendance.correctiveActions=Array.isArray(attendance.correctiveActions)?attendance.correctiveActions:[];
  attendance.correctiveActions.unshift({id:'ca-'+Date.now(),empId:String(empId),employee:emp.name,level,date,at:new Date().toISOString(),by:currentUserName()||env.user||'',pointsAtAction:snap.activePoints,note});
  audit('Attendance corrective action recorded',`${emp.name} · ${level} · ${date} · ${snap.activePoints} active points`);
  closeModal();saveAttendance('corrective-action');safeRenderPages();toast(level+' recorded for '+emp.name);
}
