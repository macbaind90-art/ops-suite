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
    normalizeAttendance(){},autoFillRdosForDate(){},setCode(){},renderAttendance(){},
    isIsoDateKey:d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||'')),addDays,parseISO,
    gridEnd:asOf,latestAttendanceDataDate:()=>asOf,attendanceCleanWorkdayEligible:()=>true,
    isArchivedEmployee:()=>false,rosterRdoToAttendanceRdos:()=>[],activeAttendanceEmployees:()=>[],getCode:()=>'',
    audit(){},saveAttendance(){},esc:s=>String(s??''),fmt:s=>s,sortedEmployees:()=>[],currentUserName:()=>'',env:{},
    safeRenderPages(){},toast(){},showModal(){},val(){return ''},closeModal(){},SuiteBridge:{send:async()=>({})},
    confirm:()=>true,prompt:()=>'',scheduleCellIsBlank:()=>true,scheduleCellIsOpen:()=>false,scheduleNameMatchesEmployee:()=>false,
    findRosterEmployeeForAttendanceLoose:()=>null,entryShift:'All',showBlanks:false,entryDate:asOf,activeAttView:'review',
    document:{getElementById:()=>({})}
  };
  vm.createContext(sandbox);
  vm.runInContext(src,sandbox);
  return sandbox;
}
function baseAttendance(events,adjustments=[]){return {
  employees:[{id:'e1',name:'Test Employee',shift:'1st Shift'}],attendance:{e1:events},notes:{},audit:[],
  pointAdjustments:adjustments,correctiveActions:[],recordEdits:[],tardyReclassifications:{},autoOff:{},workdayBasis:{},
  pointSystem:{version:1,migrationPending:false,policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:3}}
};}
function workdays(events,start,count){for(let i=0;i<count;i++)events[addDays(start,i)]='P';}
function assertEq(actual,expected,msg){if(Number(actual)!==Number(expected))throw new Error(`${msg}: expected ${expected}, got ${actual}`);}

// A newly earned +1 must immediately reduce an already-active negative balance.
{
  const events={'2026-07-01':'CO1'};
  workdays(events,'2026-07-02',12);
  const s=makeSandbox(baseAttendance(events),'2026-07-13');
  const snap=s.attendancePointSnapshot('e1','2026-07-13');
  assertEq(snap.activePoints,0.5,'Positive award did not immediately pay down active negative points');
  assertEq(snap.bank,0,'Positive award should be consumed before banking while negative points remain');
  assertEq(snap.earned[0].appliedToNegative,1,'Earned award paydown amount');
}

// Partial paydown banks only the unused fraction.
{
  const events={'2026-07-01':'CO1'};
  workdays(events,'2026-07-02',24);
  const s=makeSandbox(baseAttendance(events),'2026-07-25');
  const snap=s.attendancePointSnapshot('e1','2026-07-25');
  assertEq(snap.activePoints,0,'Second award should clear the remaining negative balance');
  assertEq(snap.bank,0.5,'Unused half-point should remain banked');
}

// Three is a balance cap at any one time, not a lifetime earning cap: spend one, then earn back to three.
{
  const events={};
  workdays(events,'2026-06-01',36); // earns 3
  events['2026-07-07']='T15+';       // spends 1, bank 2
  workdays(events,'2026-07-08',12); // earns again, bank returns to 3
  const s=makeSandbox(baseAttendance(events),'2026-07-19');
  const snap=s.attendancePointSnapshot('e1','2026-07-19');
  assertEq(snap.activePoints,0,'Banked credit should offset the later tardy');
  assertEq(snap.bank,3,'Employee should be able to re-earn back to the 3-point maximum balance');
  if((snap.earned||[]).length<4)throw new Error('Positive credits appear lifetime-capped instead of balance-capped.');
}

// Awards earned after a controlled manual point adjustment must pay down that adjusted current balance.
{
  const events={};
  workdays(events,'2026-07-02',12);
  const adjustments=[{empId:'e1',effectiveDate:'2026-07-01',newActivePoints:2,at:'2026-07-01T12:00:00Z'}];
  const s=makeSandbox(baseAttendance(events,adjustments),'2026-07-13');
  const snap=s.attendancePointSnapshot('e1','2026-07-13');
  assertEq(snap.activePoints,1,'Positive award should pay down a manual current-point balance');
  assertEq(snap.bank,0,'Award should not bank while adjusted negative points remain');
}

// A positive award earned before a later manual adjustment must be consumed by then-active negatives, not carried forward incorrectly.
{
  const events={'2026-06-01':'CO1'};
  workdays(events,'2026-06-02',12);
  const adjustments=[{empId:'e1',effectiveDate:'2026-06-15',newActivePoints:2,at:'2026-06-15T12:00:00Z'}];
  const s=makeSandbox(baseAttendance(events,adjustments),'2026-06-15');
  const snap=s.attendancePointSnapshot('e1','2026-06-15');
  assertEq(snap.activePoints,2,'Manual adjustment should establish the controlled current balance');
  assertEq(snap.bank,0,'Pre-adjustment award was incorrectly carried forward instead of paying down then-active negatives');
}

console.log('Positive-credit immediate paydown: PASS');
console.log('Partial paydown / fractional carryover: PASS');
console.log('3-point balance cap with re-earning after use: PASS');
console.log('Manual adjusted-balance paydown: PASS');
console.log('Pre-adjustment credit chronology: PASS');
