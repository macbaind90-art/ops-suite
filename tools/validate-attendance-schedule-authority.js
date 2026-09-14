'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'app','js','82-attendance-points.js');
const src=fs.readFileSync(file,'utf8');
new vm.Script(src,{filename:'app/js/82-attendance-points.js'});

const staticChecks=[
  ['function liveScheduleDayAuthority(date)', 'Live Schedule day-authority helper missing'],
  ['const rows=Array.isArray(roster.schedule)?roster.schedule:[];', 'Attendance must read the live roster.schedule array directly'],
  ["source:'live-schedule'", 'Live Schedule source marker missing'],
  ["source:'roster-rdo-fallback'", 'Roster RDO fallback marker missing'],
  ['!scheduleCellIsBlank(cell)&&!scheduleCellIsOpen(cell)&&scheduleNameMatchesEmployee(cell,re)', 'Named live-schedule assignment detection missing'],
  ['function syncAttendanceOffFromAuthority(date)', 'Schedule-aware Off synchronization missing'],
  ["date<today", 'Past finalized attendance protection missing'],
  ["if(date>today)return {changed:0,source:'future-derived-only'};", 'Future Off status must remain derived-only until the date arrives'],
  ["stored==='O'&&marker", 'Auto-Off reversal guard missing'],
  ['attendance.autoOff', 'Auto-Off provenance metadata missing'],
  ['attendance.workdayBasis', 'Positive-attendance workday basis metadata missing'],
  ['function attendanceCleanWorkdayEligible', 'Scheduled-workday eligibility helper missing'],
  ['if(!attendanceCleanWorkdayEligible(empId,e.date,code))continue;', 'Positive credits must require scheduled workdays'],
  ["autoFillRdosForDate=function(date){return syncAttendanceOffFromAuthority(date);};", 'Legacy RDO auto-fill was not replaced by schedule authority'],
  ['Live Schedule is the primary authority for scheduled/off days', 'Attendance policy UI must disclose schedule authority'],
  ['Roster RDO fallback', 'Daily Entry must disclose fallback source']
];
for(const [token,msg] of staticChecks)if(!src.includes(token))throw new Error(msg+': '+token);
if(src.includes('scheduleWorkspaceRows()')||src.includes('scheduleDrafts'))throw new Error('Attendance schedule authority must not read mock/draft schedules.');

const context={console,Date,Math,JSON,Set,Map,Promise,setTimeout,clearTimeout};
vm.createContext(context);
vm.runInContext(`
var normalizeAttendance=function(){};
var autoFillRdosForDate=function(){};
var setCode=function(){};
var renderAttendance=function(){};
var attendance={employees:[],attendance:{},notes:{},audit:[],pointSystem:{version:1,policy:{negativeWindowDays:90,calloffWindowDays:14,positiveWorkingDays:12,maxPositiveCredits:3}},autoOff:{},workdayBasis:{}};
var roster={employees:[],schedule:[]};
var env={user:'Validator',machine:'Validator'};
function parseISO(s){return new Date(String(s)+'T12:00:00');}
function isIsoDateKey(s){return /^\\d{4}-\\d{2}-\\d{2}$/.test(String(s||''));}
function scheduleCellIsOpen(v){const x=String(v||'').trim().toLowerCase();return x==='open'||x==='pending';}
function scheduleCellIsBlank(v){const x=String(v||'').trim().toLowerCase();return !x||x==='none'||x==='closed';}
function scheduleNameMatchesEmployee(raw,e){return String(raw||'').includes(String(e.last||''));}
function isArchivedEmployee(){return false;}
function findRosterEmployeeForAttendanceLoose(a){return roster.employees.find(r=>String(r.id)===String(a.rosterId))||null;}
function rosterRdoToAttendanceRdos(rdo){return Array.isArray(rdo)?rdo:[];}
function activeAttendanceEmployees(){return attendance.employees;}
function getCode(id,date){return attendance.attendance[String(id)]&&attendance.attendance[String(id)][date]||'';}
function audit(){}
function saveAttendance(){}
function currentUserName(){return 'Validator';}
function addDays(s,n){const d=parseISO(s);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function latestAttendanceDataDate(){return attendanceLocalToday();}
function esc(s){return String(s??'');}
function fmt(s){return s;}
function toast(){}
function saveAttendanceNow(){return Promise.resolve(true);}
function closeModal(){}
function safeRenderPages(){}
function showModal(){}
function val(){return '';}
var SuiteBridge={send:()=>Promise.resolve({})};
`,context);
vm.runInContext(src,context,{filename:'app/js/82-attendance-points.js'});

const result=vm.runInContext(`
(function(){
  const today=attendanceLocalToday();
  const dow=parseISO(today).getDay();
  const alice={id:'a',rosterId:'1',name:'Alice',rdos:[dow],startDate:'2026-01-01'};
  const bob={id:'b',rosterId:'2',name:'Bob',rdos:[],startDate:'2026-01-01'};
  attendance.employees=[alice,bob];attendance.attendance={a:{},b:{}};
  roster.employees=[{id:'1',last:'Alice',rdo:[dow]},{id:'2',last:'Bob',rdo:[]}];
  const assigned=Array(7).fill('None');assigned[dow]='SO Alice';
  const vacancy=Array(7).fill('None');vacancy[dow]='Open';
  roster.schedule=[{days:assigned},{days:vacancy}];
  const liveAlice=attendanceScheduleStatus(alice,today);
  const liveBob=attendanceScheduleStatus(bob,today);
  const cleanAlice=attendanceCleanWorkdayEligible('a',today,'P');
  const cleanBob=attendanceCleanWorkdayEligible('b',today,'P');
  const sync=syncAttendanceOffFromAuthority(today);
  const bobAuto=getCode('b',today);
  attendance.attendance.a[today]='P';
  const manualPriority=attendanceEffectiveCode(alice,today);
  roster.schedule=[{days:Array(7).fill('None')}];
  const fallbackAlice=attendanceScheduleStatus(alice,today);
  const fallbackBob=attendanceScheduleStatus(bob,today);
  const future=addDays(today,1),futureDow=parseISO(future).getDay();
  const futureDays=Array(7).fill('None');futureDays[futureDow]='SO Alice';roster.schedule=[{days:futureDays}];
  attendance.attendance.b[future]='';delete attendance.attendance.b[future];
  const futureSync=syncAttendanceOffFromAuthority(future);
  const futureStored=getCode('b',future);
  const futureEffective=attendanceEffectiveCode(bob,future);
  return {liveAlice,liveBob,cleanAlice,cleanBob,sync,bobAuto,manualPriority,fallbackAlice,fallbackBob,futureSync,futureStored,futureEffective};
})()
`,context);

if(!result.liveAlice.scheduled||result.liveAlice.source!=='live-schedule')throw new Error('Named employee on populated live schedule must be scheduled even when RDO says off.');
if(!result.liveBob.off||result.liveBob.source!=='live-schedule')throw new Error('Employee absent from populated live schedule must be Off.');
if(!result.cleanAlice||result.cleanBob)throw new Error('Positive-attendance workday eligibility must follow live schedule assignment.');
if(result.bobAuto!=='O'||result.sync.added<1)throw new Error('Live Schedule Off status was not synchronized into Attendance with provenance.');
if(result.manualPriority!=='P')throw new Error('Manual attendance entry must take priority over automatic Off determination.');
if(!result.fallbackAlice.off||result.fallbackAlice.source!=='roster-rdo-fallback')throw new Error('Unpopulated live schedule must fall back to Roster RDO.');
if(!result.fallbackBob.scheduled||result.fallbackBob.source!=='roster-rdo-fallback')throw new Error('Roster RDO fallback must treat non-RDO employee as scheduled.');
if(result.futureSync.source!=='future-derived-only'||result.futureStored||result.futureEffective!=='O')throw new Error('Future Off must display from schedule authority without being persisted early.');

console.log('Attendance Live Schedule authority regression: PASS');
console.log('Live Schedule primary / Roster RDO fallback: PASS');
console.log('Open/Pending support populated-day authority but are not employee assignments: PASS');
console.log('Mock schedules excluded: PASS');
console.log('Manual attendance overrides automatic Off: PASS');
console.log('Positive-credit workday eligibility follows schedule authority: PASS');
console.log('Past finalized records protected from automatic rewrite: PASS');
console.log('Future Off remains derived-only until date arrives: PASS');
