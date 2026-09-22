'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app','js','82-attendance-points.js'),'utf8');
new vm.Script(src,{filename:'app/js/82-attendance-points.js'});

for(const token of [
  'ATT_DEFAULT_POINT_VALUES','attendanceConfiguredPointValues','normalizeAttendancePointValues',
  'openPointValueSettingsModal','savePointValueSettings','Save Values & Recalculate',
  "hasCapability('attendance.managePolicy')",'The attendance.managePolicy capability is required.','Reason for Point-Policy Change *',
  "SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'})",
  'attendance.pointSystem.pointValueHistory','Attendance point policy updated','lastRecalculatedAt',
  'affectedEmployees','attendancePointDisplayValue','attendancePointPolicySummary',
  'Doctor Note Point Reduction %','doctorNoteReductionPercent','normalizeDoctorNoteReductionPercent',
  'beforePolicy','afterPolicy','doctorNoteReductionChanged'
]) if(!src.includes(token))throw new Error('Point-value editor contract missing: '+token);

if(!src.includes("if(code==='T')return values['T<5'];")||!src.includes("if(code==='T>5')return values['T15+'];")||!src.includes("if(code==='CO')return values.CO1;")){
  throw new Error('Legacy aliases are not tied to the current configurable point policy.');
}
if(!src.includes("if(!reason){toast('A reason is required to change attendance point values.')"))throw new Error('Policy-change reason gate missing.');
if(!src.includes("rawReduction<0||rawReduction>100"))throw new Error('Doctor-note reduction is not constrained to 0-100%.');

function addDays(d,n){const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
function parseISO(d){return new Date(d+'T00:00:00Z');}
const attendance={
  employees:[{id:'e1',name:'Test Employee',shift:'1st Shift'}],
  attendance:{e1:{'2026-09-01':'T15+','2026-09-02':'CO1'}},notes:{},audit:[],pointAdjustments:[],correctiveActions:[],recordEdits:[],tardyReclassifications:{},autoOff:{},workdayBasis:{},
  medicalNotes:[{id:'mn1',empId:'e1',employee:'Test Employee',startDate:'2026-09-02',endDate:'2026-09-02',receivedDate:'2026-09-02',coveredCodes:['CO'],reference:'Ref',editHistory:[],voided:false}],
  pointSystem:{version:1,migrationPending:false,policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:3,doctorNoteReductionPercent:50}}
};
const sandbox={
  console,attendance,roster:{employees:[],schedule:[]},normalizeAttendance(){},setCode(){},renderAttendance(){},
  isIsoDateKey:d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||'')),addDays,parseISO,gridEnd:'2026-09-15',latestAttendanceDataDate:()=> '2026-09-15',attendanceCleanWorkdayEligible:()=>true,
  isArchivedEmployee:()=>false,rosterRdoToAttendanceRdos:()=>[],activeAttendanceEmployees:()=>attendance.employees,getCode:(id,date)=>((attendance.attendance||{})[String(id)]||{})[date]||'',audit(){},saveAttendance(){},esc:s=>String(s??''),fmt:s=>s,sortedEmployees:()=>attendance.employees,currentUserName:()=> 'Admin User',env:{user:'Admin User',machine:'QA'},
  safeRenderPages(){},toast(){},showModal(){},val(){return ''},closeModal(){},SuiteBridge:{send:async()=>({})},confirm:()=>true,prompt:()=>'',scheduleCellIsBlank:()=>true,scheduleCellIsOpen:()=>false,scheduleNameMatchesEmployee:()=>false,
  findRosterEmployeeForAttendanceLoose:()=>null,entryShift:'All',showBlanks:false,entryDate:'2026-09-15',activeAttView:'review',document:{getElementById:()=>({})},roleOf:()=> 'Admin',hasCapability:()=>true
};
vm.createContext(sandbox);
vm.runInContext(src,sandbox);
sandbox.ensureAttendancePointSystem();
let snap=sandbox.attendancePointSnapshot('e1','2026-09-15');
if(snap.activePoints!==1.75)throw new Error('Default point/reduction calculation changed unexpectedly: '+snap.activePoints);
sandbox.attendance.pointSystem.pointValues={...sandbox.attendanceConfiguredPointValues(),'T15+':2.5};
snap=sandbox.attendancePointSnapshot('e1','2026-09-15');
if(snap.activePoints!==3.25)throw new Error('Existing attendance did not recalculate after point-value edit: '+snap.activePoints);
if(sandbox.attendancePointDisplayValue('T15+')!==2.5)throw new Error('Configured point value is not reflected in UI/report display helper.');
sandbox.attendance.pointSystem.policy.doctorNoteReductionPercent=80;
snap=sandbox.attendancePointSnapshot('e1','2026-09-15');
if(snap.activePoints!==2.8)throw new Error('Existing doctor-note coverage did not recalculate after reduction-percentage edit: '+snap.activePoints);

const report=fs.readFileSync(path.join(root,'app','js','40-reports-governance.js'),'utf8');
if((report.match(/attendancePointDisplayValue\(c\.code\)/g)||[]).length<2)throw new Error('Attendance reports are not using configured point values.');

console.log('Attendance point-value/policy editor validation: PASS');
console.log('Retroactive recalculation of existing attendance: PASS');
console.log('Doctor-note reduction percentage recalculation: PASS');
console.log('Policy reason/backup/audit/history controls: PASS');
console.log('Report/display configured-value linkage: PASS');
