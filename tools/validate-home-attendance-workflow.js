'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app','js','50-workflows-home.js'),'utf8');

const required=[
  'function homeAttendanceMetrics(',
  "label:'Daily Entry'",
  "label:'Point Review'",
  "label:'Corrective'",
  "activeAttView='daily';navigate('attendance')",
  "activeAttView='grid';navigate('attendance')",
  "activeAttView='review';navigate('attendance')",
  "activeAttView='actions';navigate('attendance')",
  'Attendance Entries Missing',
  'Attendance Corrective Action Due',
  'High Attendance Points',
  'Positive Attendance Credits',
  'Attendance Control Flow',
  'Live Schedule is the primary work/off authority',
  'Legacy attendance pattern and notice queues are no longer part of Home.'
];
for(const token of required){if(!src.includes(token))throw new Error('Home attendance workflow contract missing: '+token);}

const forbidden=[
  "activeAttView='patterns'",
  "activeAttView='notices'",
  'Outstanding Attendance Patterns',
  'Open Notices',
  'Review Patterns',
  'employeeOpenPatternCount',
  'employeeOpenNoticeCount',
  'outstandingAttendancePatterns()',
  'noticeKpis().open'
];
for(const token of forbidden){if(src.includes(token))throw new Error('Legacy attendance Home control returned: '+token);}

if(!/correctiveDue/.test(src)||!/attendanceActionRank\(snap\.level\)>attendanceActionRank/.test(src))throw new Error('Home corrective-action due metric is not point-threshold based.');
if(!/missingToday/.test(src)||!/attendanceScheduleStatus\(emp,asOf\)/.test(src))throw new Error('Home daily attendance completion is not schedule-aware.');
if(!/totalPositiveBank/.test(src)||!/positiveEmployees/.test(src))throw new Error('Home positive attendance credit summary missing.');
if(!src.includes('v3.5.0.13'))throw new Error('Home release version not updated to v3.5.0.13.');

console.log('Home Attendance Workflow validation PASS');
console.log('- Legacy pattern/notice Home queues removed');
console.log('- Daily completion, Point Review, Corrective Action, positive credits, and Live Schedule workflow present');
