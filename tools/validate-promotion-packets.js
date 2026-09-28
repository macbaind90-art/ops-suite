const fs=require('fs'),vm=require('vm');
const read=p=>fs.readFileSync(p,'utf8');
const need=(hay,needle,msg)=>{if(!hay.includes(needle))throw new Error(msg||'Missing: '+needle)};
const seed=JSON.parse(read('app/seed/promotion-packets-data.json'));
if(seed.schemaVersion!=='promotion-packets-1')throw new Error('Wrong packet schema');
const expected={'T1-T2':10,'T2-T3':18,'T3-T4':24};
if(seed.templates.length!==3)throw new Error('Expected exactly three promotion templates');
for(const template of seed.templates){
  if(template.scenarios.length!==expected[template.tier])throw new Error('Unexpected bank size for '+template.tier);
  if(new Set(template.scenarios.map(x=>x.id)).size!==template.scenarios.length)throw new Error('Duplicate scenario IDs');
  if(template.scenarios.some(x=>!x.prompt||x.prompt.length<45))throw new Error('Scenario needs a substantive question');
  if(template.checklist.length<({'T1-T2':18,'T2-T3':23,'T3-T4':24}[template.tier]))throw new Error('Promotion checklist is incomplete');
  if(template.checklist.some(x=>!x.section||!x.text||x.text.length<55))throw new Error('Checklist needs grouped, substantive standards');
  if(new Set(template.checklist.map(x=>x.id)).size!==template.checklist.length)throw new Error('Duplicate checklist IDs');
}
const byTier=Object.fromEntries(seed.templates.map(t=>[t.tier,t]));
const content=t=>[...byTier[t].checklist.map(x=>x.text),...byTier[t].scenarios.map(x=>x.prompt)].join(' ');
for(const [tier,terms] of Object.entries({
  'T1-T2':['OJT-001','PMC-T1-Core','verbally hold','independent grant or denial'],
  'T2-T3':['PMC-Officer v2.0','98%','Dispatch','Base'],
  'T3-T4':['Acting Supervisor','explicit Supervisor communication','mentoring','Security Manager']
}))for(const term of terms)need(content(tier),term,tier+' missing current policy: '+term);
const host=read('MainForm.PromotionPackets.cs'),auth=read('MainForm.Authorization.cs'),registry=read('MainForm.GovernedModules.cs');
const browser=read('app/js/74-promotion-packets.js'),bootstrap=read('app/js/10-bootstrap.js');
new vm.Script(browser,{filename:'app/js/74-promotion-packets.js'});
need(host,'RandomNumberGenerator.GetInt32(i, available.Length)','Selection must use unbiased per-issue randomness');
need(host,'for (int i = 0; i < 6; i++)','Each packet must freeze exactly six questions');
need(host,'["scenarios"] = chosen','Frozen questions must be saved with packet');
need(host,'activeBank.Select','Selection must exclude archived scenarios');
need(host,'["previousVersions"] = history','Bank edits must preserve old template revision');
need(browser,'openPromotionBank','Manager must be able to inspect and edit banks');
need(browser,'p.scenarios.map((s,i)=>','Reprint must use issued questions');
need(host,'["trainingEvidence"] = evidence','Issue must capture training evidence');
for(const marker of ['"delete" or "restore" => "promotion.manage"','["deletedPreviousStatus"]','packet["status"] = "Deleted"','packet["status"] = previous','history.Add(new JsonObject { ["action"] = action','Only the Security Manager/Admin may delete or restore'])need(host,marker,'Packet delete/restore audit or role guard missing: '+marker);
for(const marker of ['openPromotionDeleteModal','savePromotionDelete','Show deleted packets',"p.status!=='Deleted'",'promotionCommand(action,{packetId:id,notes})'])need(browser,marker,'Packet delete/restore UI missing: '+marker);

for(const s of ['promotion.manage','promotion.review','promotion.decide'])need(host,s);
need(host,'candidate cannot review or decide','Candidate self review denial missing');
need(auth,'"promotion-packets" => throw','Generic writes must not bypass the packet command');
need(registry,'Id = "promotion-packets"');
need(bootstrap,"await loadPromotionPackets()");
need(read('app/index.html'),'js/74-promotion-packets.js');
for(const term of ['UpgradePromotionPacketChecklists','current.Count != oldCount','["checklist"] = current.DeepClone()','template["checklist"] = replacement.DeepClone()','SaveModuleData("promotion-packets", data.ToJsonString(JsonOptions), loaded.Revision)'])need(host,term,'Live checklist upgrade must preserve prior revisions and issued packets: '+term);
need(read('MainForm.cs'),'UpgradePromotionPacketChecklists();');
for(const term of ['"Approve promotion"','recordsVerified','checklistReviewed','scenariosReviewed','interviewDate','interviewOutcome != "Meets standard"','interviewNotes.Length < 20'])need(host,term,'Manager approval gate missing: '+term);
for(const term of ['openReportWindow(style+header+evidence+checklist+scenarios+supervisor+interview+decision,false','Six verbal scenarios','Evaluator grade:','Security Manager interview'])need(browser,term,'Verbal evaluation or preview missing: '+term);
const ctx={console,Date,PWADCModuleRegistry:{register(){}},esc:x=>String(x??''),openReportWindow:(html,auto,orientation)=>{ctx.preview={html,auto,orientation}},toast:()=>{}};
vm.createContext(ctx);vm.runInContext(browser,ctx);
for(const tier of Object.keys(expected)){
  ctx.sample={id:'test',tier,status:'Issued',employee:{name:'Candidate',eid:'1'},issuedAt:'2026-09-28',templateRevision:3,
    checklist:byTier[tier].checklist,scenarios:byTier[tier].scenarios.slice(0,6),trainingEvidence:[]};
  vm.runInContext('promotionPackets.packets=[sample];printPromotionPacket("test")',ctx);
  if(!ctx.preview||ctx.preview.auto!==false||ctx.preview.orientation!=='portrait')throw Error('Packet must open in preview before print');
  if((ctx.preview.html.match(/Evaluator grade:/g)||[]).length!==6)throw Error('Packet needs six evaluator grades');
  if(ctx.preview.html.includes('Candidate written scenarios'))throw Error('Verbal answers should not be a written candidate form');
  if(!ctx.preview.html.includes('Security Manager final decision'))throw Error('Manager approval page missing');
  if(tier==='T3-T4'&&!ctx.preview.html.includes('Security Manager interview · required for T4'))throw Error('T4 interview page missing');
}
need(read('SecurityOperationsSuite.csproj'),'<Version>5.0.1</Version>');
console.log('Promotion Packets validation PASS');
