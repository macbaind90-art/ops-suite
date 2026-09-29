const fs=require('fs'),vm=require('vm');
const read=p=>fs.readFileSync(p,'utf8');
const need=(hay,needle,msg)=>{if(!hay.includes(needle))throw new Error(msg||'Missing: '+needle)};
const seed=JSON.parse(read('app/seed/promotion-packets-data.json'));
if(seed.schemaVersion!=='promotion-packets-1')throw new Error('Wrong packet schema');
const expected={'T1-T2':10,'T2-T3':18,'T3-T4':25};
if(seed.templates.length!==3)throw new Error('Expected exactly three promotion templates');
for(const template of seed.templates){
  if(template.scenarios.length!==expected[template.tier])throw new Error('Unexpected bank size for '+template.tier);
  if(new Set(template.scenarios.map(x=>x.id)).size!==template.scenarios.length)throw new Error('Duplicate scenario IDs');
  if(template.scenarios.some(x=>!x.prompt||x.prompt.length<45))throw new Error('Scenario needs a substantive question');
  if(template.checklist.length<({'T1-T2':18,'T2-T3':23,'T3-T4':24}[template.tier]))throw new Error('Promotion checklist is incomplete');
  if(template.checklist.some(x=>!x.section||!x.text||x.text.length<55))throw new Error('Checklist needs grouped, substantive standards');
  if(new Set(template.checklist.map(x=>x.id)).size!==template.checklist.length)throw new Error('Duplicate checklist IDs');
}
for(const tier of ['T1-T2','T2-T3']){
  const template=seed.templates.find(x=>x.tier===tier);
  const fourth=tier==='T1-T2'?'professional':'incident';
  for(const [category,count] of [['gate',2],['patrol',2],['base',1],[fourth,1]])
    if(template.scenarios.filter(x=>x.category===category).length<count)throw Error(tier+' missing '+category+' selection coverage');
  if(template.scenarios.some(x=>x.prompt.length<250||!x.inject||x.inject.length<70))
    throw Error(tier+' needs detailed prompts and evaluator fact changes');
}
const t4=seed.templates.find(x=>x.tier==='T3-T4');
if(t4.scenarios.length<=seed.templates.find(x=>x.tier==='T2-T3').scenarios.length)throw Error('T4 bank must be larger than lower tiers');
for(let i=1;i<=8;i++)if(!t4.scenarios.some(x=>x.id==='C-'+String(i).padStart(2,'0')&&x.category==='leadership'))
  throw Error('Restricted source conduct prompt missing: C-'+i);
for(const [category,focus] of [['leadership','access'],['leadership','personnel'],['emergency','medicalFire'],['emergency','hazardEvac'],['emergency','compound']])
  if(!t4.scenarios.some(x=>x.category===category&&x.focus===focus))throw Error('T4 bank missing '+category+' '+focus);
const byTier=Object.fromEntries(seed.templates.map(t=>[t.tier,t]));
const content=t=>[...byTier[t].checklist.map(x=>x.text),...byTier[t].scenarios.map(x=>x.prompt)].join(' ');
for(const [tier,terms] of Object.entries({
  'T1-T2':['OJT-001','PMC-T1-Core','verbally hold','independent grant or denial'],
  'T2-T3':['PMC-Officer v2.0','98%','Dispatch','Base'],
  'T3-T4':['Acting Supervisor','explicit Supervisor communication','mentoring','Security Manager']
}))for(const term of terms)need(content(tier),term,tier+' missing current policy: '+term);
const host=read('MainForm.PromotionPackets.cs'),auth=read('MainForm.Authorization.cs'),registry=read('MainForm.GovernedModules.cs');
const digitalHost=read('MainForm.PromotionPackets.Digital.cs');
const browser=read('app/js/74-promotion-packets.js'),digital=read('app/js/75-promotion-digital.js'),bootstrap=read('app/js/10-bootstrap.js');
new vm.Script(browser,{filename:'app/js/74-promotion-packets.js'});
new vm.Script(digital,{filename:'app/js/75-promotion-digital.js'});
need(host,'RandomNumberGenerator.GetInt32(i, available.Length)','Selection must use unbiased per-issue randomness');
need(host,'for (int i = 0; i < 6; i++)','Each packet must freeze exactly six questions');
need(host,'["scenarios"] = chosen','Frozen questions must be saved with packet');
need(host,'activeBank.Select','Selection must exclude archived scenarios');
need(host,'["previousVersions"] = history','Bank edits must preserve old template revision');
need(browser,'openPromotionBank','Manager must be able to inspect and edit banks');
need(browser,'p.scenarios.map((x,i)=>','Reprint must use issued questions');
for(const text of ['Draw("leadership", "access")','Draw("leadership", "personnel")','Draw("emergency", "medicalFire")','Draw("emergency", "hazardEvac")','Draw("emergency", "compound")','All eight T4 evidence gates must be recorded PASS'])need(host,text,'T4 coverage or approval gate missing: '+text);
for(const text of ['DrawTier("gate", 2)','DrawTier("patrol", 2)','DrawTier("base", 1)','stockSeventeen','system-upgrade-v5.0.3','All evidence gates must be recorded PASS'])need(host,text,'Lower promotion coverage or approval gate missing: '+text);
need(host,'["trainingEvidence"] = evidence','Issue must capture training evidence');
for(const marker of ['"delete" or "restore" => "promotion.manage"','["deletedPreviousStatus"]','packet["status"] = "Deleted"','packet["status"] = previous','history.Add(new JsonObject { ["action"] = action','Only the Security Manager/Admin may delete or restore'])need(host,marker,'Packet delete/restore audit or role guard missing: '+marker);
for(const marker of ['openPromotionDeleteModal','savePromotionDelete','Show deleted packets',"p.status!=='Deleted'",'promotionCommand(action,{packetId:id,notes})'])need(browser,marker,'Packet delete/restore UI missing: '+marker);

for(const s of ['promotion.manage','promotion.review','promotion.decide'])need(host,s);
need(host,'AssertPromotionEvaluatorIsNotCandidate(actor, packet)','Candidate self assessment denial missing');
need(digitalHost,'The candidate cannot assess their own promotion packet.','Candidate self assessment guard missing');
for(const marker of ['"review" or "assessment" => "promotion.review"','NormalizePromotionDigitalAssessment(command, packet, actor, now)','ValidatePromotionDigitalCompletion(packet, recommendation)','ValidatePromotionDigitalCompletion(packet, "Recommend")'])need(host,marker,'Digital assessment write or approval guard missing: '+marker);
for(const marker of ['checklistIds.Contains(row.Name)','scenarioIds.Contains(row.Name)','missingIds.Contains(row.Name)','PromotionPracticalIds(tier)','PromotionGateAllowsSimulation(tier, number)','Only an issued packet can be edited.','Complete each checklist result','Grade all six oral scenarios','Complete each live or simulated practical','T4 BASE practicals must occur on different dates or shifts.','Resolve and cite each missing training record'])need(host+digitalHost,marker,'Digital packet validation missing: '+marker);
need(auth,'"promotion-packets" => throw','Generic writes must not bypass the packet command');
need(registry,'Id = "promotion-packets"');
need(bootstrap,"await loadPromotionPackets()");
need(read('app/index.html'),'js/74-promotion-packets.js');
need(read('app/index.html'),'js/75-promotion-digital.js');
for(const term of ['UpgradePromotionPacketChecklists','current.Count != oldCount','["checklist"] = current.DeepClone()','template["checklist"] = replacement.DeepClone()','SaveModuleData("promotion-packets", data.ToJsonString(JsonOptions), loaded.Revision)'])need(host,term,'Live checklist upgrade must preserve prior revisions and issued packets: '+term);
need(read('MainForm.cs'),'UpgradePromotionPacketChecklists();');
for(const term of ['"Approve promotion"','recordsVerified','checklistReviewed','scenariosReviewed','interviewDate','interviewOutcome != "Meets standard"','interviewNotes.Length < 20'])need(host,term,'Manager approval gate missing: '+term);
for(const term of ['openReportWindow(style+header+evidence+checklist+scenarios+supervisor+interview+decision,false','Six verbal scenarios','Evaluator grade:','Security Manager interview'])need(browser,term,'Verbal evaluation or preview missing: '+term);
const ctx={console,Date,window:{},document:{getElementById:()=>null},activeModule:'promotion-packets',safeRenderPages:()=>{},hasCapability:()=>true,PWADCModuleRegistry:{register(){}},esc:x=>String(x??''),openReportWindow:(html,auto,orientation)=>{ctx.preview={html,auto,orientation}},toast:()=>{}};
vm.createContext(ctx);vm.runInContext(browser,ctx);vm.runInContext(digital,ctx);
const exerciseIds={
  'T1-T2':['T1-BASE','T1-COACH'],
  'T2-T3':['T2-REPORT1','T2-REPORT2','T2-REPORT3','T2-INCIDENT','T2-COACH'],
  'T3-T4':['T4-BASE1','T4-BASE2','T4-COACH','T4-LEAD1','T4-LEAD2','T4-LEAD3','T4-REPORT1','T4-REPORT2','T4-REPORT3','T4-SHADOW1','T4-SHADOW2','T4-SHADOW3','T4-FLAWED']
};
ctx.exerciseIds=exerciseIds;
vm.runInContext('for(const id of Object.values(exerciseIds).flat()){const x=promotionGateExercises[id];if(!x||x.prompt.length<170||x.inject.length<80||x.task.length<45)throw Error("Incomplete provided simulation: "+id)}',ctx);
for(const tier of Object.keys(expected)){
  ctx.sample={id:'test',tier,status:'Issued',employee:{name:'Candidate',eid:'1'},issuedAt:'2026-09-28',templateRevision:3,
    checklist:byTier[tier].checklist,scenarios:tier==='T3-T4'?[...byTier[tier].scenarios.filter(x=>x.category==='leadership').slice(0,3),...byTier[tier].scenarios.filter(x=>x.category==='emergency').slice(0,3)]:[...byTier[tier].scenarios.filter(x=>x.category==='gate').slice(0,2),...byTier[tier].scenarios.filter(x=>x.category==='patrol').slice(0,2),...byTier[tier].scenarios.filter(x=>x.category==='base').slice(0,1),...byTier[tier].scenarios.filter(x=>x.category===('T1-T2'===tier?'professional':'incident')).slice(0,1)],trainingEvidence:[]};
  vm.runInContext('promotionPackets.packets=[sample];printPromotionPacket("test")',ctx);
  if(!ctx.preview||ctx.preview.auto!==false||ctx.preview.orientation!=='portrait')throw Error('Packet must open in preview before print');
  if((ctx.preview.html.match(/Evaluator grade:/g)||[]).length!==6)throw Error('Packet needs six evaluator grades');
  if(ctx.preview.html.includes('Missing training at issue'))throw Error('Do not show missing training when no requirements are missing');
  if(!ctx.preview.html.includes('□ Simulated exercise'))throw Error('Evaluations must permit a documented simulation');
  for(const id of exerciseIds[tier])if(!ctx.preview.html.includes('Provided simulation '+id+' ·'))throw Error('Packet omitted provided gate exercise '+id);
  if((ctx.preview.html.match(/Provided simulation /g)||[]).length!==exerciseIds[tier].length)throw Error('Wrong number of provided gate exercises for '+tier);
  ctx.sample.trainingEvidence=[{requirement:'SIGNED-CURRENT-TRAINING',signoffId:'signed-1',signoffDate:'2026-09-01'}];
  vm.runInContext('promotionPackets.packets=[sample];printPromotionPacket("test")',ctx);
  if(ctx.preview.html.includes('Missing training at issue')||ctx.preview.html.includes('SIGNED-CURRENT-TRAINING'))throw Error('Signed training must not appear in the missing training section');
  ctx.sample.trainingEvidence.push({requirement:'MISSING-CURRENT-TRAINING',signoffId:'',signoffDate:''});
  vm.runInContext('promotionPackets.packets=[sample];printPromotionPacket("test")',ctx);
  if(!ctx.preview.html.includes('Missing training at issue')||!ctx.preview.html.includes('MISSING-CURRENT-TRAINING')||ctx.preview.html.includes('SIGNED-CURRENT-TRAINING'))throw Error('Show only training without a current signoff');
  if(ctx.preview.html.includes('Candidate written scenarios'))throw Error('Verbal answers should not be a written candidate form');
  if(!ctx.preview.html.includes(tier==='T3-T4'?'Security Manager final determination':'Security Manager final decision'))throw Error('Manager approval page missing');
  if(tier!=='T3-T4'){
    const gateCount=tier==='T1-T2'?5:6;
    for(const item of byTier[tier].checklist)if(!ctx.preview.html.includes(item.text))throw Error('Printed workbook omitted '+item.id);
    if((ctx.preview.html.match(/Evaluator follow-up after initial answer:/g)||[]).length!==6)throw Error('Every lower-tier scenario needs its evaluator follow-up');
    if(!ctx.preview.html.includes('Evidence extension and reevaluation plan'))throw Error('Lower-tier remediation page missing');
    if(!ctx.preview.html.includes('Supervisor evidence review and recommendation'))throw Error('Lower-tier supervisor record missing');
    if((ctx.preview.html.match(/Gate [1-6] ·/g)||[]).length<gateCount)throw Error('Lower-tier evidence gates missing');
    if(tier==='T1-T2'&&!ctx.preview.html.includes('Coaching and response practical'))throw Error('T1 coaching practical must allow simulation');
    if(tier==='T2-T3'&&(!ctx.preview.html.includes('controlled simulated cases')||!ctx.preview.html.includes('Corrective coaching practical')))throw Error('T2 incident and coaching evaluations must allow simulation');
    ctx.sample.status='Reviewed';ctx.sample.review={recommendation:'Recommend',reviewerName:'Supervisor',notes:'Evidence reviewed'};
    ctx.lastModal='';ctx.showModal=html=>{ctx.lastModal=html};
    vm.runInContext('promotionPackets.packets=[sample];openPromotionDecisionModal("test")',ctx);
    if((ctx.lastModal.match(/id="promoGate\d+"/g)||[]).length!==gateCount)throw Error('Manager approval does not assess every gate');
  }
  if(tier==='T3-T4'){
    if(!ctx.preview.html.includes('Security Manager final candidate interview'))throw Error('T4 Manager interview page missing');
    if((ctx.preview.html.match(/Gate [1-8] ·/g)||[]).length<8)throw Error('All eight evidence gates must be printable');
    for(const term of ['two successful practicals','Three shadow report reviews','Targeted factual 360 input','Remediation and reevaluation plan','Package completion checklist'])
      if(!ctx.preview.html.toLowerCase().includes(term.toLowerCase()))throw Error('T4 workbook missing '+term);
    for(const term of ['controlled role-play','controlled simulations','controlled simulated cases','live/simulated, case ID'])
      if(!ctx.preview.html.includes(term))throw Error('T4 coaching and incident simulation evidence missing: '+term);
    if(ctx.preview.html.includes('Expected Decision Points')||ctx.preview.html.includes('Critical Failure Conditions'))throw Error('Restricted evaluator answer keys must not be included in the packet');
  }
}
for(const tier of Object.keys(expected)){
  ctx.sample={id:'digital-test',tier,status:'Issued',employee:{name:'Candidate',eid:'1'},issuedAt:'2026-09-28',templateRevision:3,
    checklist:byTier[tier].checklist,scenarios:byTier[tier].scenarios.slice(0,6),trainingEvidence:[{assignmentId:'missing-1',requirement:'Missing requirement',signoffId:''}]};
  vm.runInContext('promotionPackets.packets=[sample];openPromotionDigitalPacket("digital-test","overview")',ctx);
  if(!ctx.window._promotionDigitalOpen)throw Error('Digital packet does not open');
  const overview=vm.runInContext('renderPromotionDigitalPacket("digital-test")',ctx);
  if(!overview.includes('Missing requirement')||!overview.includes('Save Progress'))throw Error('Digital issue snapshot or save action missing');
  for(const [tab,phrase] of [['checklist',byTier[tier].checklist[0].text],['gates','Gate 1'],['scenarios','Oral Scenario 1 of 6'],['recommendation','Submit to Security Manager']]){
    ctx.window._promotionDigitalTab=tab;
    if(!vm.runInContext('renderPromotionDigitalPacket("digital-test")',ctx).includes(phrase))throw Error(tier+' digital '+tab+' is incomplete');
  }
  ctx.window._promotionDigitalTab='gates';
  const gateHtml=vm.runInContext('renderPromotionDigitalPacket("digital-test")',ctx);
  for(const id of exerciseIds[tier])if(!gateHtml.includes(id+' · '))throw Error('Digital gate omitted the provided '+id+' practical');
  if((gateHtml.match(/Practical method/g)||[]).length!==exerciseIds[tier].length)throw Error('Every practical needs an independent digital evaluation');
  if(gateHtml.slice(gateHtml.indexOf('Gate 1 ·'),gateHtml.indexOf('Gate 2 ·')).includes('value="Simulated"')&&tier!=='T3-T4')throw Error('Eligibility gate cannot use simulated source records');
  vm.runInContext('promotionDigitalSet("gates","1","status","PASS")',ctx);
  if(!vm.runInContext('promotionDigitalSession.assessment.gates["1"].status',ctx).includes('PASS'))throw Error('Digital gate edits do not stay in the draft');
  vm.runInContext('sample.digitalAssessment=promotionDigitalSession.assessment',ctx);
  ctx.sample.status='Reviewed';ctx.sample.review={mode:'digital',recommendation:'Recommend',notes:'Complete review'};
  ctx.window._promotionDigitalTab='scenarios';
  if(vm.runInContext('renderPromotionDigitalPacket("digital-test")',ctx).includes('Save Progress'))throw Error('Submitted assessment should be read-only');
  vm.runInContext('printPromotionDigitalRecord("digital-test")',ctx);
  if(!ctx.preview||ctx.preview.auto!==false||!ctx.preview.html.includes('Digital Promotion Assessment'))throw Error('Completed digital record must preview before print');
  ctx.window._promotionDigitalOpen='';
  vm.runInContext('promotionDigitalSession=null',ctx);
}
need(read('SecurityOperationsSuite.csproj'),'<Version>5.1.0</Version>');
console.log('Promotion Packets validation PASS');
