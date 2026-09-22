'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app','js','82-attendance-points.js'),'utf8');
new vm.Script(src,{filename:'app/js/82-attendance-points.js'});

function addDays(d,n){const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
function parseISO(d){return new Date(d+'T00:00:00Z');}
function makeSandbox(attendance,asOf){
  const sandbox={
    console,attendance,roster:{employees:[],schedule:[]},
    normalizeAttendance(){},setCode(){},renderAttendance(){},
    isIsoDateKey:d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||'')),addDays,parseISO,
    gridEnd:asOf,latestAttendanceDataDate:()=>asOf,attendanceCleanWorkdayEligible:()=>true,
    isArchivedEmployee:()=>false,rosterRdoToAttendanceRdos:()=>[],activeAttendanceEmployees:()=>attendance.employees||[],getCode:(id,date)=>((attendance.attendance||{})[String(id)]||{})[date]||'',
    audit(){},saveAttendance(){},saveAttendanceNow:async()=>true,esc:s=>String(s??''),fmt:s=>s,sortedEmployees:()=>attendance.employees||[],currentUserName:()=>'',env:{},
    safeRenderPages(){},toast(){},showModal(){},val(){return ''},closeModal(){},SuiteBridge:{send:async()=>({})},roleOf:()=> 'Admin',hasCapability:()=>true,
    confirm:()=>true,prompt:()=>'',scheduleCellIsBlank:()=>true,scheduleCellIsOpen:()=>false,scheduleNameMatchesEmployee:()=>false,
    findRosterEmployeeForAttendanceLoose:()=>null,entryShift:'All',showBlanks:false,entryDate:asOf,activeAttView:'review',
    document:{getElementById:()=>({checked:true})}
  };
  vm.createContext(sandbox);
  vm.runInContext(src,sandbox);
  sandbox.ensureAttendancePointSystem();
  return sandbox;
}
function baseAttendance(events,medicalNotes=[],reduction=50){return {
  employees:[{id:'e1',name:'Test Employee',shift:'1st Shift'}],attendance:{e1:events},notes:{},audit:[],medicalNotes,
  pointAdjustments:[],correctiveActions:[],recordEdits:[],tardyReclassifications:{},autoOff:{},workdayBasis:{},
  pointSystem:{version:1,migrationPending:false,pointValues:{'T<5':0,'T5-14':0.5,'T15+':1,CO1:1.5,CO2:3,NCNS:9,LE:1,EIA:2},policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:3,doctorNoteReductionPercent:reduction}}
};}
function note(startDate,endDate,codes,extra={}){return {id:'mn1',empId:'e1',employee:'Test Employee',startDate,endDate,receivedDate:endDate,coveredCodes:codes,reference:'Administrative reference',editHistory:[],at:endDate+'T12:00:00Z',voided:false,...extra};}
function assertEq(actual,expected,msg){if(Number(actual)!==Number(expected))throw new Error(`${msg}: expected ${expected}, got ${actual}`);}

// Multiple call-off days covered by one doctor note must produce one reduced occurrence only.
{
  const events={'2026-09-01':'CO1','2026-09-02':'CO2','2026-09-03':'CO2'};
  const s=makeSandbox(baseAttendance(events,[note('2026-09-01','2026-09-03',['CO'])]),'2026-09-03');
  s.reclassifyCalloffsForEmployee('e1');
  const snap=s.attendancePointSnapshot('e1','2026-09-03');
  assertEq(snap.activePoints,0.75,'Multi-day doctor note did not charge exactly one 50%-reduced CO1 occurrence');
  const covered=snap.issues.filter(x=>x.medicalCovered);
  if(covered.length!==3)throw new Error('Doctor-note-covered call-off days were not retained as visible covered issues.');
  if(covered.filter(x=>x.medicalPrimary).length!==1)throw new Error('Doctor note must have exactly one primary point-bearing occurrence.');
  assertEq(covered.reduce((n,x)=>n+Number(x.gross||0),0),0.75,'Additional covered days added extra points.');
}

// The covered call-off range counts as one call-off occurrence for the rolling 14-day rule.
{
  const events={'2026-09-01':'CO1','2026-09-02':'CO2','2026-09-03':'CO2','2026-09-10':'CO1'};
  const s=makeSandbox(baseAttendance(events,[note('2026-09-01','2026-09-03',['CO'])]),'2026-09-10');
  s.reclassifyCalloffsForEmployee('e1');
  if(events['2026-09-10']!=='CO2')throw new Error('Doctor-note call-off range did not count as one rolling-14-day call-off occurrence.');
  const snap=s.attendancePointSnapshot('e1','2026-09-10');
  assertEq(snap.activePoints,3.75,'Later call-off did not combine correctly with the reduced doctor-note occurrence');
}

// A doctor-note-covered tardy still resets clean attendance and charges the configured reduced value.
{
  const events={};
  for(let i=0;i<11;i++)events[addDays('2026-08-20',i)]='P';
  events['2026-08-31']='T15+';
  const s=makeSandbox(baseAttendance(events,[note('2026-08-31','2026-08-31',['T15+'])]),'2026-08-31');
  const snap=s.attendancePointSnapshot('e1','2026-08-31');
  assertEq(snap.activePoints,0.5,'Doctor-note-covered tardy did not use the default 50% reduction');
  if((snap.earned||[]).length!==0)throw new Error('Doctor-note-covered tardy incorrectly preserved the clean-workday streak.');
  assertEq(snap.cleanWorkingDays,0,'Doctor-note-covered tardy did not reset clean attendance progress');
}

// Global policy reduction must retroactively recalculate covered records.
{
  const events={'2026-09-01':'CO1'};
  const s=makeSandbox(baseAttendance(events,[note('2026-09-01','2026-09-01',['CO'])],80),'2026-09-01');
  const snap=s.attendancePointSnapshot('e1','2026-09-01');
  assertEq(s.attendanceDoctorNoteReductionPercent(),80,'Configured doctor-note reduction was not read from point policy');
  assertEq(s.attendanceDoctorNoteChargePercent(),20,'Charge percentage did not invert the reduction percentage');
  assertEq(snap.activePoints,0.3,'80% doctor-note reduction did not recalculate CO1 to 20% of normal points');
}

// Coverage is selective by event type within the date range.
{
  const events={'2026-09-01':'T15+','2026-09-02':'CO1'};
  const s=makeSandbox(baseAttendance(events,[note('2026-09-01','2026-09-03',['CO'])]),'2026-09-03');
  const snap=s.attendancePointSnapshot('e1','2026-09-03');
  assertEq(snap.activePoints,1.75,'CO-only doctor-note coverage incorrectly changed an uncovered tardy or failed to reduce the covered CO');
}

// Voiding coverage restores normal point and call-off behavior.
{
  const events={'2026-09-01':'CO1','2026-09-10':'CO2'};
  const s=makeSandbox(baseAttendance(events,[note('2026-09-01','2026-09-03',['CO'],{voided:true,voidReason:'Entered in error'})]),'2026-09-10');
  s.reclassifyCalloffsForEmployee('e1');
  if(events['2026-09-10']!=='CO2')throw new Error('Voided doctor note altered normal CO classification.');
  const snap=s.attendancePointSnapshot('e1','2026-09-10');
  assertEq(snap.activePoints,4.5,'Voided doctor note did not restore normal points');
}

// A later-entered matching record inside the authorized range automatically receives the configured treatment.
{
  const events={};
  const attendance=baseAttendance(events,[note('2026-09-01','2026-09-05',['T5-14'])]);
  events['2026-09-04']='T5-14';
  const s=makeSandbox(attendance,'2026-09-05');
  const snap=s.attendancePointSnapshot('e1','2026-09-05');
  assertEq(snap.activePoints,0.25,'Later-entered matching event did not receive the configured doctor-note treatment');
}

for(const token of [
  'function openDoctorNoteModal','function openDoctorNoteEditModal','async function saveDoctorNoteCoverage','async function saveDoctorNoteEdit','async function voidDoctorNoteCoverage','function renderDoctorNotes',
  'function attendanceMedicalPointMultiplier','function attendanceMedicalIsPrimaryEvent','attendanceDoctorNoteReductionPercent','attendanceDoctorNoteChargePercent',
  'Reason for Editing Coverage *','editHistory','Doctor note coverage edited','doctor-note-coverage-edit',
  'Save Coverage','Do not enter diagnosis or medical details'
]){
  if(!src.includes(token))throw new Error('Doctor-note UI/calculation contract missing: '+token);
}
(async()=>{
  // Editing an active note to extend its range must preserve identity, create history/backup/audit,
  // and immediately fold newly covered matching dates into the same single occurrence.
  const events={'2026-09-01':'CO1','2026-09-04':'CO2'};
  const medical=note('2026-09-01','2026-09-01',['CO']);
  const s=makeSandbox(baseAttendance(events,[medical]),'2026-09-05');
  const values={
    medicalEmpId:'e1',medicalStartDate:'2026-09-01',medicalEndDate:'2026-09-05',medicalReceivedDate:'2026-09-02',
    medicalReference:'Extended note received',medicalAdminNote:'Coverage extension only',medicalEditReason:'Provider extended return date'
  };
  let backups=0,audits=[];
  s.val=id=>values[id]||'';
  s.document={getElementById:id=>({checked:id==='medicalCode_CO'})};
  s.SuiteBridge={send:async(action)=>{if(action==='suite:createBackup')backups++;return {};}};
  s.audit=(action,detail)=>audits.push({action,detail});
  s.saveAttendanceNow=async()=>true;
  await s.saveDoctorNoteEdit('mn1');
  const edited=s.attendance.medicalNotes.find(n=>n.id==='mn1');
  if(!edited||edited.endDate!=='2026-09-05')throw new Error('Doctor-note edit did not extend the coverage end date.');
  if((edited.editHistory||[]).length!==1)throw new Error('Doctor-note edit history was not appended.');
  if(edited.editHistory[0].reason!=='Provider extended return date')throw new Error('Doctor-note edit reason was not preserved.');
  if(backups!==1)throw new Error('Doctor-note edit did not create exactly one pre-save backup.');
  if(!audits.some(x=>x.action==='Doctor note coverage edited'))throw new Error('Doctor-note edit audit event missing.');
  const snap=s.attendancePointSnapshot('e1','2026-09-05');
  assertEq(snap.activePoints,0.75,'Extended doctor-note range did not recalculate newly covered matching day into the same occurrence');

  console.log('Doctor-note configurable single-occurrence treatment: PASS');
  console.log('Multi-day covered events do not stack points: PASS');
  console.log('Covered call-off range counts as one CO occurrence: PASS');
  console.log('Doctor-note issue resets clean streak: PASS');
  console.log('Configurable global reduction recalculates existing coverage: PASS');
  console.log('Active doctor-note coverage edit/history/backup/recalculation: PASS');
  console.log('Void and later-entered-match recalculation behavior: PASS');
})().catch(err=>{console.error(err&&err.stack||err);process.exit(1);});
