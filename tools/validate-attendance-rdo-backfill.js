'use strict';
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('app/js/82-attendance-points.js','utf8');
const start=src.indexOf('function backfillHistoricalRdos('),end=src.indexOf('function pointSystemAsOf()',start);
if(start<0||end<0)throw Error('Historical RDO backfill is missing');
for(const token of ["source:'manual-clear'","backfillHistoricalRdos();","source:'roster-rdo-history'"])
  if(!src.includes(token))throw Error('RDO correction or Daily Entry hook missing: '+token);
const context={Date,console,attendance:{employees:[],attendance:{},autoOff:{},audit:[]},roster:{employees:[]},moduleLoadInfo:{attendance:{writeAllowed:true}},saves:0,audits:[],
  attendanceLocalToday:()=> '2026-09-28',isIsoDateKey:d=>/^\d{4}-\d{2}-\d{2}$/.test(d),attendanceMigrationPending:()=>false,hasCapability:()=>true,
  activeAttendanceEmployees:()=>context.attendance.employees,attendanceRosterEmployee:e=>context.roster.employees.find(r=>String(r.id)===String(e.rosterId)),
  rosterRdoToAttendanceRdos:rdos=>rdos.map(d=>({Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6})[d]),
  attendanceAutoOffKey:(id,date)=>id+'|'+date,getCode:(id,date)=>context.attendance.attendance[id]?.[date]||'',
  audit:(action,detail)=>context.audits.push({action,detail}),saveAttendance:()=>{context.saves++}};
vm.createContext(context);vm.runInContext(src.slice(start,end),context);
context.attendance.employees=[
  {id:'alice',rosterId:'1',startDate:'2026-01-01'},
  {id:'bob',rosterId:'2',startDate:'2026-01-01'},
  {id:'new',rosterId:'3',startDate:'2026-09-28'}];
context.roster.employees=[{id:'1',rdo:['Sat','Sun']},{id:'2',rdo:['Sun']},{id:'3',rdo:['Sun']}];
context.attendance.attendance={alice:{'2026-09-26':'P'},bob:{}};
context.attendance.autoOff={'bob|2026-09-27':{source:'manual-clear',at:'2026-09-27T12:00:00Z'}};
const first=vm.runInContext("backfillHistoricalRdos('2026-09-28')",context);
if(first.changed<1||context.attendance.attendance.alice['2026-09-27']!=='O')throw Error('Missed Sunday RDO not filled');
if(context.attendance.attendance.alice['2026-09-26']!=='P')throw Error('Existing attendance was overwritten');
if(context.attendance.attendance.bob['2026-09-27'])throw Error('Explicitly cleared date was repopulated');
if(context.attendance.attendance.new?.['2026-09-27'])throw Error('Date before hire was populated');
if(context.attendance.attendance.alice['2026-09-28'])throw Error('Today was backfilled as a past date');
if(context.attendance.autoOff['alice|2026-09-27']?.source!=='roster-rdo-history')throw Error('Backfill provenance missing');
if(context.saves!==1||context.audits.length!==1)throw Error('Backfill must batch one audited save');
const second=vm.runInContext("backfillHistoricalRdos('2026-09-28')",context);
if(second.changed!==0||context.saves!==1)throw Error('Backfill must be idempotent');
context.moduleLoadInfo.attendance.writeAllowed=false;
if(vm.runInContext("backfillHistoricalRdos('2026-09-28')",context).source!=='blocked')throw Error('Read-only data must not be mutated');
console.log('PASS missed RDO backfill, existing entries, manual clear, hire date, idempotence, and audit');
