/* v3.5.0.13 browser startup binding regression guard */
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app','js','82-attendance-points.js'),'utf8');

const requiredDeclarations=[
  'function autoFillRdosForDate(date)',
  'function renderAttendance()'
];
for(const token of requiredDeclarations){
  if(!src.includes(token))throw new Error('Browser startup binding missing explicit declaration: '+token);
}

const forbiddenAssignments=[
  /^\s*autoFillRdosForDate\s*=\s*function/m,
  /^\s*renderAttendance\s*=\s*function/m
];
for(const pattern of forbiddenAssignments){
  if(pattern.test(src))throw new Error('Strict-mode startup risk: undeclared global override remains: '+pattern);
}

const html=fs.readFileSync(path.join(root,'app','index.html'),'utf8');
const baseIndex=html.indexOf('<script src="js/80-attendance.js"></script>');
const pointsIndex=html.indexOf('<script src="js/82-attendance-points.js"></script>');
const startupIndex=html.indexOf('<script src="js/99-startup.js"></script>');
if(baseIndex<0||pointsIndex<0||startupIndex<0||!(baseIndex<pointsIndex&&pointsIndex<startupIndex)){
  throw new Error('Attendance script load order is invalid. Expected 80-attendance -> 82-attendance-points -> 99-startup.');
}

console.log('Browser startup binding regression passed: Attendance renderer and schedule-Off helper are explicitly declared before startup validation.');
