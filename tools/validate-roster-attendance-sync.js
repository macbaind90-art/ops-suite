'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const roster=fs.readFileSync(path.join(root,'app','js','60-roster-schedule.js'),'utf8');
const core=fs.readFileSync(path.join(root,'app','js','20-data-core.js'),'utf8');
const checks=[
  [roster.includes('Sync Roster to Attendance'),'Roster UI must expose Sync Roster to Attendance'],
  [roster.includes('syncOneRosterEmployeeToAttendance(e,true)'),'Roster save must allow Attendance creation'],
  [roster.includes('const attendanceOk=await saveAttendanceNow'),'Roster save must capture Attendance persistence result'],
  [roster.includes('!attendanceOk||!attendanceMatch||isArchivedAttendanceEmployee(attendanceMatch)'),'Roster save must verify active Attendance presence before reporting success'],
  [roster.includes('Roster employee added and verified in Attendance'),'Roster success message must only claim verified Attendance sync'],
  [core.includes('syncOneRosterEmployeeToAttendance(re,true)'),'Manual Roster-to-Attendance sync must add missing active employees'],
  [core.includes('if(result.added)added++'),'Manual sync must count newly created Attendance employees'],
  [core.includes("const saved=await saveAttendanceNow('roster-attendance-sync')"),'Manual sync must verify Attendance save result'],
  [core.includes('Existing attendance history was preserved.'),'Sync audit must state history preservation']
];
const failed=checks.filter(([ok])=>!ok);
if(failed.length){for(const [,msg] of failed)console.error('FAIL:',msg);process.exit(1);}
console.log('Roster → Attendance population regression: PASS');
console.log('Checks:',checks.length);
