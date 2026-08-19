'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const root=path.resolve(__dirname,'..');
const appRoot=path.join(root,'app');
const html=fs.readFileSync(path.join(appRoot,'index.html'),'utf8');
const scriptRefs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const expectedRefs=[
  'js/00-module-registry.js','js/10-bootstrap.js','js/20-data-core.js','js/30-shell-audits.js',
  'js/40-reports-governance.js','js/50-workflows-home.js','js/60-roster-schedule.js',
  'js/70-training-uniforms.js','js/80-attendance.js','js/90-shift-operations.js',
  'js/95-tasks-settings.js','js/99-startup.js'
];
if(JSON.stringify(scriptRefs)!==JSON.stringify(expectedRefs)) throw new Error('Front-end script load order does not match the v3.3.0 architecture contract.');
for(const ref of scriptRefs){if(!fs.existsSync(path.join(appRoot,ref)))throw new Error('Missing front-end script: '+ref);}
if(!fs.existsSync(path.join(appRoot,'assets','styles.css')))throw new Error('Missing app/assets/styles.css');
if(/<script>([\s\S]*?)<\/script>/.test(html))throw new Error('Inline application script detected in index.html.');
if(/<style>([\s\S]*?)<\/style>/.test(html))throw new Error('Inline application stylesheet detected in index.html.');

function element(){return {innerHTML:'',textContent:'',value:'',checked:false,dataset:{},style:{setProperty(){},display:''},classList:{add(){},remove(){},toggle(){},contains(){return false}},appendChild(){},remove(){},click(){},focus(){},setAttribute(){},getAttribute(){return null},querySelector(){return null},querySelectorAll(){return []},insertAdjacentHTML(){},files:[],contentWindow:{location:{reload(){}}}};}
const elements=new Map();
const document={
  documentElement:{clientWidth:1500,clientHeight:950,setAttribute(){},style:{setProperty(){}}},body:element(),
  getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},
  querySelector(){return null;},querySelectorAll(){return [];},createElement(){return element();},addEventListener(){}
};
const context={console,document,navigator:{clipboard:{writeText:async()=>{}}},location:{reload(){}},fetch:async()=>({text:async()=>'',arrayBuffer:async()=>new ArrayBuffer(0)}),FileReader:function(){},Blob:function(){},URL:{createObjectURL(){return 'blob:';},revokeObjectURL(){}},setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},confirm(){return true;},prompt(){return '';},alert(){},Date,Math,JSON,Set,Map,Array,Object,String,Number,Boolean,RegExp,Error,Promise,Intl,parseInt,parseFloat,isNaN,encodeURIComponent,decodeURIComponent};
context.window=context;context.window.chrome=null;context.window.innerWidth=1500;context.window.innerHeight=950;context.window.addEventListener=()=>{};context.window.open=()=>({document:{write(){},close(){}},print(){},focus(){}});
vm.createContext(context);

const startup='js/99-startup.js';
for(const rel of scriptRefs.filter(x=>x!==startup)) vm.runInContext(fs.readFileSync(path.join(appRoot,rel),'utf8'),context,{filename:rel});
const evalx=code=>vm.runInContext(code,context);
const seed=name=>JSON.parse(fs.readFileSync(path.join(appRoot,'seed',name),'utf8'));
evalx(`attendance=${JSON.stringify(seed('attendance-data.json'))}; normalizeAttendance(); roster=${JSON.stringify(seed('roster-data.json'))}; normalizeRoster(); tasks=${JSON.stringify(seed('tasks-data.json'))}; normalizeTasks(); shiftReports=${JSON.stringify(seed('shift-reports-data.json'))}; normalizeShiftReports(); shiftIntel=${JSON.stringify(seed('shift-intelligence-data.json'))}; normalizeShiftIntel(); settings.users=DEFAULT_USERS.map(x=>({...x})); currentUser=settings.users[0]; env={user:'Validation',machine:'Node',version:'3.3.0.0'}; unlocked=true;`);

const required=evalx('requiredFunctionFailures()');
if(required.length)throw new Error('Required render/action function failure: '+JSON.stringify(required));
const expectedModules=['bootstrap','data-core','shell-audits','reports-governance','workflows-home','roster-schedule','training-uniforms','attendance','shift-operations','tasks-settings'];
const registry=evalx(`PWADCModuleRegistry.validate(${JSON.stringify(expectedModules)})`);
if(!registry.ok||registry.unexpected.length)throw new Error('Front-end module registry failure: '+JSON.stringify(registry));

const major=['home','start-here','attendance','roster','employee-profile','training','office-supplies','shift-reports','shift-intelligence','reports','settings','tasks','data-health','restore','change-log','other-programs'];
for(const id of major){const out=evalx(`renderModule(${JSON.stringify(id)})`);if(typeof out!=='string'||out.length<20)throw new Error('Major module render failed: '+id);}
for(const view of ['daily','grid','review','patterns','notices','audit']){const out=evalx(`activeAttView='${view}'; renderAttendance()`);if(typeof out!=='string'||out.length<20)throw new Error('Attendance render failed: '+view);}
for(const view of ['roster','schedule','training','uniforms','analytics']){const out=evalx(`activeRosterView='${view}'; renderRoster()`);if(typeof out!=='string'||out.length<20)throw new Error('Roster render failed: '+view);}

const source=[html,...scriptRefs.map(ref=>fs.readFileSync(path.join(appRoot,ref),'utf8'))].join('\n');
const declarations=[...source.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]);
const counts=new Map();for(const name of declarations)counts.set(name,(counts.get(name)||0)+1);
const duplicates=[...counts].filter(([,count])=>count>1);
if(duplicates.length)throw new Error('Duplicate named function declaration(s): '+JSON.stringify(duplicates));
const attrs=[...source.matchAll(/on(?:click|change|input|focus|blur|keydown|keyup|load|error)=(?:"|')([^"']+)(?:"|')/g)].map(m=>m[1]);
const targets=new Set();for(const body of attrs){for(const m of body.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g))targets.add(m[1]);}
const builtins=new Set(['confirm','prompt','alert','setTimeout','clearTimeout','parseInt','parseFloat','Number','String','Date','Array','Object','Boolean','Math','encodeURIComponent','decodeURIComponent']);
const missingTargets=[...targets].filter(name=>!counts.has(name)&&!builtins.has(name)).sort();
if(missingTargets.length)throw new Error('Inline action handler target(s) missing: '+missingTargets.join(', '));

// Validate the startup gate independently: complete registration initializes once; missing registration does not initialize.
const registrySource=fs.readFileSync(path.join(appRoot,'js','00-module-registry.js'),'utf8');
const startupSource=fs.readFileSync(path.join(appRoot,startup),'utf8');
function startupScenario(names){let initCount=0,error='';const c={window:{},console:{error(){}},Error};c.window=c;c.init=()=>{initCount++;};c.showStartupError=e=>{error=e.message;};vm.createContext(c);vm.runInContext(registrySource,c);for(const name of names)c.PWADCModuleRegistry.register(name);vm.runInContext(startupSource,c);return{initCount,error};}
const full=startupScenario(expectedModules),missing=startupScenario(expectedModules.slice(0,-1));
if(full.initCount!==1||full.error)throw new Error('Startup gate failed with a complete module set.');
if(missing.initCount!==0||!missing.error.includes('tasks-settings'))throw new Error('Startup gate did not block an incomplete module set.');

console.log(`PWADC front-end validation passed: ${major.length} major modules, 6 attendance views, 5 roster views, ${declarations.length} named functions, ${targets.size} inline action targets, ${registry.loaded.length} registered modules.`);
