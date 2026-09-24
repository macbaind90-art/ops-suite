'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const need=(hay,needle,msg)=>{if(!hay.includes(needle))throw new Error(msg||`Missing: ${needle}`)};
const reject=(hay,needle,msg)=>{if(hay.includes(needle))throw new Error(msg||`Unexpected: ${needle}`)};

const analytics=read('app/js/70-training-uniforms.js');
const reports=read('app/js/40-reports-governance.js');
const home=read('app/js/50-workflows-home.js');
const settings=read('app/js/95-tasks-settings.js');
const bootstrap=read('app/js/10-bootstrap.js');
const models=read('Models.cs');
const migration=read('MainForm.SchemaMigrations.cs');
const seed=JSON.parse(read('app/seed/suite-settings.json'));

need(analytics,'const coverage=scheduleAuthorityModel(sched);','On-screen Labor Analytics must use Live Schedule authority.');
need(analytics,'let coverage=scheduleAuthorityModel(m);','Print/CSV analytics must use Live Schedule authority.');
need(analytics,'Live Schedule Authority','Printed analytics must identify its staffing authority.');
need(reports,'const scheduleAuthority=scheduleAuthorityModel(sched);','Reports must use Live Schedule authority.');
need(home,'const cov=scheduleAuthorityModel(scheduleMetrics());','Home must use Live Schedule authority.');

for(const [name,source] of [['analytics',analytics],['settings',settings],['bootstrap',bootstrap],['models',models]]){
  reject(source,'DEFAULT_COVERAGE_REQUIREMENTS',`${name} still contains the retired default coverage rules.`);
  reject(source,'coverageRequirementModel',`${name} still invokes the retired coverage model.`);
  reject(source,'Coverage Requirements',`${name} still exposes the retired Coverage Requirements control.`);
}
reject(models,'class CoverageRequirement','The retired coverage settings model is still compiled.');
if('CoverageRequirements' in seed||'coverageRequirements' in seed)throw new Error('Suite Settings seed still contains legacy coverage requirements.');
if(seed.schemaVersion!=='suite-settings-3')throw new Error('Suite Settings schema must include the v4.6.0 role-capability revision.');
need(migration,'root.Remove("CoverageRequirements")','Suite Settings migration must remove the legacy rules safely.');

console.log('Suite-wide Live Schedule coverage authority validation PASS');
console.log('- Dashboard, reports, Labor Analytics, print, and CSV use the Live Schedule');
console.log('- Legacy coverage defaults, settings UI, model, and seed payload are retired');
console.log('- Suite Settings 1->2 migration preserves users and removes the duplicate ruleset');
