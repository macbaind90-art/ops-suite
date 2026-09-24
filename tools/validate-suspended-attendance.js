'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app','js','82-attendance-points.js'),'utf8');
new vm.Script(src,{filename:'app/js/82-attendance-points.js'});

for(const token of [
  "{code:'SUS',label:'Suspended',points:0,kind:'reset'}",
  "const ATT_RESET_CODES=new Set(['SUS'])",
  "if(c==='SUS')return 'att-status-suspended'",
  'if(ATT_RESET_CODES.has(code))',
  'Suspended (SUS) carries 0 points but resets clean-attendance progress'
]) if(!src.includes(token))throw new Error('Suspended attendance contract missing: '+token);

const styles=fs.readFileSync(path.join(root,'app','assets','styles.css'),'utf8');
if(!styles.includes('.att-point-cell.att-status-suspended')||!styles.includes('.att-legend.suspended'))throw new Error('Suspended visual status missing.');
const reports=fs.readFileSync(path.join(root,'app','js','40-reports-governance.js'),'utf8');
if(!reports.includes("ATTENDANCE_MISSED_CODES=new Set(['CO1','CO2','NCNS','O','SUS'])"))throw new Error('Suspended status is not treated as unavailable schedule coverage in reports.');

function addDays(d,n){const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
function parseISO(d){return new Date(d+'T00:00:00Z');}
const events={};
for(let i=0;i<11;i++)events[addDays('2026-08-01',i)]='P';
events['2026-08-12']='SUS';
for(let i=0;i<12;i++)events[addDays('2026-08-13',i)]='P';
const attendance={
  employees:[{id:'e1',name:'Test Employee',shift:'1st Shift'}],attendance:{e1:events},notes:{},audit:[],medicalNotes:[],
  pointAdjustments:[],correctiveActions:[],recordEdits:[],tardyReclassifications:{},autoOff:{},workdayBasis:{},
  pointSystem:{version:1,migrationPending:false,pointValues:{'T<5':0,'T5-14':0.5,'T15+':1,CO1:1.5,CO2:3,NCNS:9,LE:1,EIA:2},policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:3,effectiveDate:'2026-01-01'}}
};
const sandbox={
  console,attendance,roster:{employees:[],schedule:[]},normalizeAttendance(){},setCode(){},renderAttendance(){},
  isIsoDateKey:d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||'')),addDays,parseISO,gridEnd:'2026-08-24',latestAttendanceDataDate:()=> '2026-08-24',attendanceCleanWorkdayEligible:()=>true,
  isArchivedEmployee:()=>false,rosterRdoToAttendanceRdos:()=>[],activeAttendanceEmployees:()=>attendance.employees,getCode:(id,date)=>events[date]||'',
  audit(){},saveAttendance(){},saveAttendanceNow:async()=>true,esc:s=>String(s??''),fmt:s=>s,sortedEmployees:()=>attendance.employees,currentUserName:()=>'',env:{},
  safeRenderPages(){},toast(){},showModal(){},val(){return ''},closeModal(){},SuiteBridge:{send:async()=>({})},roleOf:()=> 'Admin',confirm:()=>true,prompt:()=>'',
  scheduleCellIsBlank:()=>true,scheduleCellIsOpen:()=>false,scheduleNameMatchesEmployee:()=>false,findRosterEmployeeForAttendanceLoose:()=>null,
  entryShift:'All',showBlanks:false,entryDate:'2026-08-24',activeAttView:'review',document:{getElementById:()=>({checked:true})}
};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const atSuspension=sandbox.attendancePointSnapshot('e1','2026-08-12');
if(atSuspension.activePoints!==0)throw new Error('Suspended status added negative points.');
if(atSuspension.cleanWorkingDays!==0)throw new Error('Suspended status did not reset clean attendance.');
const final=sandbox.attendancePointSnapshot('e1','2026-08-24');
if(final.activePoints!==0)throw new Error('Suspended status added points after later attendance replay.');
if(final.bank!==1)throw new Error(`Twelve clean working days after suspension should earn one positive point; got ${final.bank}.`);
console.log('Suspended status 0 points: PASS');
console.log('Suspended status resets clean-attendance progress: PASS');
console.log('Positive attendance can restart after suspension: PASS');
