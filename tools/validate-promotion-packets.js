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
  if(template.checklist.length<8)throw new Error('Promotion checklist is incomplete');
}
const byTier=Object.fromEntries(seed.templates.map(t=>[t.tier,t]));
const content=t=>[...byTier[t].checklist.map(x=>x.text),...byTier[t].scenarios.map(x=>x.prompt)].join(' ');
for(const [tier,terms] of Object.entries({
  'T1-T2':['OJT-001','PMC-T1-Core','verbally hold','independently grant or deny'],
  'T2-T3':['PMC-Officer v2.0','98%','Dispatch','Base Station'],
  'T3-T4':['Acting Supervisor','explicit formal','mentoring','Security Manager']
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
need(read('SecurityOperationsSuite.csproj'),'<Version>5.0.0</Version>');
console.log('Promotion Packets validation PASS');
