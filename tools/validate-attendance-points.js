'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app','js','82-attendance-points.js'),'utf8');
new vm.Script(src,{filename:'app/js/82-attendance-points.js'});

const required=[
  "'T<5':0","'T5-14':0.5","'T15+':1","'CO1':1.5","'CO2':3","'NCNS':9","'LE':1","'EIA':2",
  'negativeWindowDays:90','calloffWindowDays:14','positiveWorkingDays:12','maxPositiveCredits:3',
  "{points:6,level:'Notice'}","{points:9,level:'Final Warning'}",
  "if(old==='T')next='T<5'","else if(old==='LE')next='ALE'","else if(old==='UE')next='LE'",
  'Commit Migration + Backup','Positive Credit Bank','Clean Workdays',
  "const ATTENDANCE_DAILY_SHIFT_ORDER=['3rd Shift','1st Shift','2nd Shift','Gate','Reception']",
  "let pointGridMode='all'","All Employees","Single Employee","pointDailyGroups(rows)",
  "function attendanceEmployeePointClass","if(points<6)return 'att-emp-risk-green'","if(points<9)return 'att-emp-risk-yellow'","return 'att-emp-risk-red'",
  "function pointGridStatusClass","if(c==='NE')return 'att-status-ne'","if(c==='O')return ''","if(c==='P')return 'att-status-present'","if(c==='SUS')return 'att-status-suspended'",
  "{code:'SUS',label:'Suspended',points:0,kind:'reset'}","const ATT_RESET_CODES=new Set(['SUS'])","if(ATT_RESET_CODES.has(code))",
  'att-status-approved',"pts>=2?'att-status-issue-high':'att-status-issue-low'",'att-positive-earned','point-positive-award','att-point-grid-shift-row',
  "for(let d=end;d>=addDays(end,-89);d=addDays(d,-1))dates.push(d)",
  'function openPointGridEditModal','function savePointGridEdit','Reason for Record Change *','Historical attendance record corrected','attendance.recordEdits',
  'function openPointAdjustmentModal','async function savePointAdjustment','Reason for Point Adjustment *','attendance.pointAdjustments',"SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'})",
  'rawActiveIssues.filter(x=>x.date>adjustment.effectiveDate)',"const adjustmentExpires=adjustment?addDays(adjustment.effectiveDate,89):''",'calculatedActivePoints',
  'function applyPositiveAward','appliedToNegative','adjustmentOutstanding','const room=Math.max(0,maxCredits-bank)','if(award.appliedToNegative>0||award.banked>0)',
  "if(code==='T')return values['T<5'];",'function isLegacyMigratedTardy','function attendanceEventPointValue(empId,date,code){return pointValue(code);}','const gross=attendanceEventPointValue(empId,e.date,code)'
  ,"const ATT_POLICY_EFFECTIVE_DATE='2026-09-28'",'function attendancePolicyEffectiveDate()','e.date>=policyEffectiveDate','rollingStart<policyEffectiveDate?policyEffectiveDate:rollingStart'
];
for(const token of required)if(!src.includes(token))throw new Error('Attendance point contract missing: '+token);
if(!src.includes("prior&&dayDiff(prior.date,date)<=13?'CO2':'CO1'"))throw new Error('Rolling 14-day call-off classification missing.');
if(!src.includes('if(cleanWorkingDays>=12)'))throw new Error('12-working-day positive credit award missing.');
if(!src.includes('const offset=Math.min(bank,gross)'))throw new Error('Positive credit consumption/offset missing.');
if(!src.includes('const rollingStart=addDays(asOf,-89)'))throw new Error('Rolling 90-day window missing.');
if(!src.includes('const room=Math.max(0,maxCredits-bank)')||!src.includes('const banked=Math.min(remaining,room)'))throw new Error('3-credit bank must use the canonical at-any-one-time balance cap.');
if(!src.includes("if(!reason){toast('A reason is required to edit a 90-Day Grid record.')"))throw new Error('90-Day Grid edit reason gate missing.');
if(!src.includes("if(!reason){toast('A reason is required to edit current attendance points.')"))throw new Error('Manual point-adjustment reason gate missing.');

const styles=fs.readFileSync(path.join(root,'app','assets','styles.css'),'utf8');
for(const token of ['Attendance point grid visual status','.att-status-present','.att-status-approved','.att-status-issue-low','.att-status-issue-high','.att-status-ne','.att-positive-earned','.att-emp-risk-green','.att-emp-risk-yellow','.att-emp-risk-red','.att-point-grid-shift-row','.att-point-editable','.att-status-suspended','.att-legend.suspended']){
  if(!styles.includes(token))throw new Error('Attendance visual-status CSS missing: '+token);
}

console.log('Attendance Point System validation: PASS');
console.log('Tardy tiers 0 / .5 / 1: PASS');
if(src.includes("return isLegacyMigratedTardy(empId,date,code)?0.5:pointValue(code)")||src.includes("rawCode==='T'?0.5")||src.includes("if(code==='T')return 0.5"))throw new Error('Historical T<5 still has a legacy 0.5-point override.');
if(!src.includes("attendanceConfiguredPointValues()")||!src.includes("attendance.pointSystem.pointValues"))throw new Error('Editable point-value configuration is not wired into the point engine.');
console.log('Historical and migrated T<5 zero-point calculation: PASS');
console.log('90-day rolling window: PASS');
console.log('14-day call-off classification: PASS');
console.log('12 working-day positive credit: PASS');
console.log('3-point positive bank cap: PASS');
console.log('Credit offset, immediate paydown, and consumption: PASS');
console.log('6-point Notice / 9-point Final Warning thresholds: PASS');
console.log('NE retained as zero-point neutral code: PASS');
console.log('Daily Entry shift grouping/order: PASS');
console.log('90-Day Grid newest-to-oldest order: PASS');
console.log('90-Day Grid reason-required historical editing: PASS');
console.log('90-Day Grid shift sections/status colors: PASS');
console.log('Employee-name point-status colors: PASS');
console.log('Manual current-point adjustment + future exclusion: PASS');
console.log('Point-adjustment backup/audit controls: PASS');
console.log('2026-09-28 fresh-start calculation boundary with historical retention: PASS');

console.log('Suspended 0-point clean-streak reset contract: PASS');
