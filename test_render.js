const fs=require('fs'), vm=require('vm');
let html=fs.readFileSync('/mnt/data/v274/app/index.html','utf8');
let script=html.match(/<script>([\s\S]*)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const fakeEl=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}},setAttribute(){},value:'',checked:false});
const doc={
  documentElement:{clientWidth:1400,clientHeight:900,setAttribute(){},style:{setProperty(){}}},
  getElementById(id){return fakeEl()},
  querySelectorAll(){return []},
  querySelector(){return fakeEl()},
  addEventListener(){},
};
const context={console, setTimeout, clearTimeout, fetch: async()=>({text:async()=>''}), window:{innerWidth:1400,innerHeight:900,addEventListener(){},chrome:null,open(){return {document:{write(){},close(){}},print(){}}}}, document:doc, confirm:()=>true, alert:()=>{}, Blob, URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}}, FileReader:function(){}};
context.window.document=doc;
vm.createContext(context);
vm.runInContext(script, context, {filename:'index.js'});
const attendance=JSON.parse(fs.readFileSync('/mnt/data/v274/app/seed/attendance-data.json','utf8'));
const roster=JSON.parse(fs.readFileSync('/mnt/data/v274/app/seed/roster-data.json','utf8'));
const tasks=JSON.parse(fs.readFileSync('/mnt/data/v274/app/seed/tasks-data.json','utf8'));
vm.runInContext(`attendance=${JSON.stringify(attendance)}; roster=${JSON.stringify(roster)}; tasks=${JSON.stringify(tasks)}; settings={theme:'dark',defaultModule:'home',pin:'6268',dataRoot:'\\\\pig-fs\\Security\\MacBain\\Security Operations Suite'}; env={user:'test',machine:'test'}; normalizeAttendance(); normalizeRoster(); normalizeTasks();`, context);
const modules=['home','attendance','roster','tasks','data-health','restore','change-log','other-programs'];
for(const m of modules){
  try{
    const out=vm.runInContext(`activeModule='${m}'; renderModule('${m}')`, context);
    console.log('OK',m, String(out).length);
  }catch(e){
    console.error('FAIL',m,e.stack||e.message); process.exitCode=1;
  }
}
// roster subviews
for(const v of ['roster','schedule','training','uniforms','analytics']){
  try{ const out=vm.runInContext(`activeRosterView='${v}'; renderRoster()`, context); console.log('OK roster-'+v, String(out).length); }
  catch(e){ console.error('FAIL roster-'+v,e.stack||e.message); process.exitCode=1; }
}
