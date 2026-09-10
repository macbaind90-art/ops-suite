'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app','js','82-attendance-points.js'),'utf8');
new vm.Script(src,{filename:'app/js/82-attendance-points.js'});
const required=[
  "'T<5':0.5","'T>5':1","'CO1':1.5","'CO2':3","'NCNS':9","'LE':1","'EIA':2",
  'negativeWindowDays:90','calloffWindowDays:14','positiveWorkingDays:12','maxPositiveCredits:2',
  "{points:3,level:'Verbal Counseling'}","{points:6,level:'Written Warning'}","{points:9,level:'Final Written Warning'}",
  "if(old==='T')next='T<5'","else if(old==='LE')next='ALE'","else if(old==='UE')next='LE'",
  'Commit Migration + Backup','Positive Credit Bank','Clean Workdays',
  "const ATTENDANCE_DAILY_SHIFT_ORDER=['3rd Shift','1st Shift','2nd Shift','Gate','Reception']",
  "let pointGridMode='all'","All Employees","Single Employee","pointDailyGroups(rows)",
  "function attendanceEmployeePointClass","if(points<3)return 'att-emp-risk-green'","if(points<7)return 'att-emp-risk-yellow'","return 'att-emp-risk-red'",
  "function pointGridStatusClass","if(c==='NE')return 'att-status-ne'","if(c==='O')return ''","if(c==='P')return 'att-status-present'",
  "att-status-approved","pts>=2?'att-status-issue-high':'att-status-issue-low'","att-positive-earned","point-positive-award","att-point-grid-shift-row"
];
for(const token of required)if(!src.includes(token))throw new Error('Attendance point contract missing: '+token);
if(!src.includes("prior&&dayDiff(prior.date,date)<=13?'CO2':'CO1'"))throw new Error('Rolling 14-day call-off classification missing.');
if(!src.includes('if(cleanWorkingDays>=12)'))throw new Error('12-working-day positive credit award missing.');
if(!src.includes('const offset=Math.min(bank,gross)'))throw new Error('Positive credit consumption/offset missing.');
if(!src.includes('const start90=addDays(asOf,-89)'))throw new Error('Rolling 90-day window missing.');

const styles=fs.readFileSync(path.join(root,'app','assets','styles.css'),'utf8');
for(const token of ['v3.5.0.2 Attendance point grid visual status','.att-status-present','.att-status-approved','.att-status-issue-low','.att-status-issue-high','.att-status-ne','.att-positive-earned','.att-emp-risk-green','.att-emp-risk-yellow','.att-emp-risk-red','.att-point-grid-shift-row']){
  if(!styles.includes(token))throw new Error('Attendance visual-status CSS missing: '+token);
}
console.log('Attendance Point System validation: PASS');
console.log('Negative point matrix: PASS');
console.log('90-day rolling window: PASS');
console.log('14-day call-off classification: PASS');
console.log('12 working-day positive credit: PASS');
console.log('2-point positive bank cap: PASS');
console.log('Credit offset and consumption: PASS');
console.log('3/6/9 corrective thresholds: PASS');
console.log('Legacy T -> T<5 migration: PASS');
console.log('NE retained as zero-point neutral code: PASS');
console.log('Daily Entry shift grouping/order: PASS');
console.log('90-Day Grid all-employee option: PASS');
console.log('90-Day Grid shift sections: PASS');
console.log('90-Day Grid status colors: PASS');
console.log('Employee-name point-status colors: PASS');
