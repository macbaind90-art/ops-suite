/* Self-contained supervisor packet. No Suite session, network, or external assets are required. */
function promotionPortableSnapshot(p){
  return {format:'PWADC-promotion-offline-1',packetId:p.id,tier:p.tier,issuedAt:p.issuedAt,
    employee:{name:p.employee?.name||'',eid:p.employee?.eid||'',shift:p.employee?.shift||''},
    checklist:p.checklist||[],scenarios:p.scenarios||[],gateNames:promotionGateNamesFor(p.tier),
    exercises:Object.values(promotionDigitalExerciseIds[p.tier]||{}).flat().map(id=>({id,gate:Number(Object.keys(promotionDigitalExerciseIds[p.tier]).find(k=>promotionDigitalExerciseIds[p.tier][k].includes(id))),...promotionGateExercises[id]})),
    missingTraining:(p.trainingEvidence||[]).filter(x=>!x.signoffId).map(x=>({assignmentId:x.assignmentId,requirement:x.requirement}))};
}
function promotionPortableHtml(p){
  const snapshot=JSON.stringify(promotionPortableSnapshot(p)).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PWADC Supervisor Promotion Packet · ${esc(p.id)}</title>
<style>:root{font:16px/1.5 Arial,sans-serif;color:#222;background:#f3f3f3}*{box-sizing:border-box}body{margin:0}header{background:#991b2b;color:white;padding:22px max(20px,calc((100% - 1050px)/2))}header h1{margin:0;font-size:24px}main{max-width:1050px;margin:22px auto;padding:0 14px 55px}.card{background:white;border:1px solid #d6d6d6;border-radius:8px;margin:14px 0;padding:18px}.card h2{margin:0 0 10px;color:#991b2b;font-size:20px}.item{padding:16px 0;border-top:1px solid #ddd}.item:first-of-type{border:0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.full{grid-column:1/-1}label{display:block;font-weight:600;margin:10px 0 4px}input:not([type=checkbox]),textarea,select{font:inherit;width:100%;padding:9px;border:1px solid #999;border-radius:4px}textarea{min-height:85px}button{font:inherit;background:#991b2b;border:0;border-radius:4px;color:white;padding:10px 14px;cursor:pointer;margin:3px}button.secondary{background:#343b46}.actions{position:sticky;top:0;background:#fff;padding:10px;border:1px solid #ddd;z-index:2;display:flex;flex-wrap:wrap;align-items:center}.hint{background:#f9f3e9;border-left:4px solid #a87500;padding:12px;white-space:pre-wrap}small{color:#555}details{padding:9px;background:#f7f7f7;white-space:pre-wrap}#status{font-weight:bold;padding:6px}@media(max-width:650px){.grid{grid-template-columns:1fr}.full{grid-column:auto}}@media print{header{background:white;color:#222}body{background:white}.actions,button,input[type=file]{display:none!important}.card{break-inside:avoid;border:0;border-bottom:1px solid #ccc}textarea{min-height:55px}}</style></head><body><header><h1>PWADC Security · Supervisor Promotion Packet</h1><div id="identity"></div></header><main><div class="actions"><button id="save">Save Progress JSON</button><button id="submit">Export Completed Evaluation JSON</button><button id="resume" class="secondary">Load Saved Progress</button><input id="resumeFile" type="file" accept=".json,application/json" hidden><button class="secondary" onclick="window.print()">Print / Save PDF</button><span id="status" role="status"></span></div><div class="hint">Open this HTML file in a browser. Ask the candidate the six issued scenarios aloud and record the answers and grades. Save Progress JSON whenever you pause; keep that file and load it here to continue. When complete, export the evaluation JSON and return it to the Security Manager. The manager imports and verifies it in the Suite; this file cannot approve a promotion or sign Training records.</div><div id="sections"></div></main><script id="packet-data" type="application/json">${snapshot}</script><script>(${promotionPortableRuntime.toString()})();</script></body></html>`;
}
function promotionPortableRuntime(){
  'use strict';
  const p=JSON.parse(document.getElementById('packet-data').textContent);
  const assessment={checklist:{},gates:{},scenarios:{},practicals:{},training:{}};
  const root=document.getElementById('sections'),status=document.getElementById('status');
  const E=(tag,text,parent,cls)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;if(cls)e.className=cls;(parent||root).appendChild(e);return e};
  function field(parent,section,id,key,label,kind='text',options=[],max=2500){
    const wrap=E('div',null,parent);const labelEl=E('label',label,wrap);
    const el=E(kind==='textarea'?'textarea':kind==='select'?'select':'input',null,wrap);
    if(kind==='select')for(const [value,title] of [['','Choose'],...options]){const o=E('option',title,el);o.value=value}
    else if(kind==='checkbox'){el.type='checkbox';labelEl.appendChild(el)}
    else if(kind==='date')el.type='date';
    else if(kind!=='textarea')el.type='text';
    if(kind!=='select'&&kind!=='checkbox')el.maxLength=max;
    el.dataset.section=section;el.dataset.id=id;el.dataset.key=key;
    const update=()=>{assessment[section][id]??={};assessment[section][id][key]=kind==='checkbox'?el.checked:el.value;status.textContent='Unsaved changes';};
    el.addEventListener(kind==='checkbox'||kind==='select'||kind==='date'?'change':'input',update);
    return el;
  }
  function card(){return E('section',null,root,'card')}
  function titleCard(title){const c=card();E('h2',title,c);return c}
  document.getElementById('identity').textContent=p.employee.name+' · '+p.tier.replace('-', ' → ')+' · Packet '+p.packetId+' · Issued '+new Date(p.issuedAt).toLocaleDateString();
  let c=titleCard('Issued checklist');E('p','Verify each standard against its source record. Record a gap if it is not met.',c);
  for(const x of p.checklist){const item=E('div',null,c,'item');E('strong',x.id+' · '+x.section,item);E('p',x.text,item);const grid=E('div',null,item,'grid');field(grid,'checklist',x.id,'status','Result','select',[['Verified','Verified'],['Gap','Gap'],['Not observed','Not observed']]);field(grid,'checklist',x.id,'evidence','Evidence, source and date','textarea',[],1200)}
  if(p.missingTraining.length){c=titleCard('Missing Training at issue');E('p','A checked box requires a real signed source record. This form does not create a Training signoff.',c);for(const x of p.missingTraining){const item=E('div',null,c,'item');E('strong',x.requirement,item);field(item,'training',x.assignmentId,'resolved','Signed source record verified','checkbox');field(item,'training',x.assignmentId,'reference','Signed record / date / verifier','text',[],500)}}
  c=titleCard('Evidence gates and practical exercises');
  for(let i=0;i<p.gateNames.length;i++){
    const n=i+1,id=String(n),item=E('div',null,c,'item');E('h3','Gate '+id+' · '+p.gateNames[i],item);
    const grid=E('div',null,item,'grid');field(grid,'gates',id,'status','Gate result','select',[['PASS','PASS'],['REMEDIATE','REMEDIATE'],['HOLD','HOLD'],['NOT ELIGIBLE','NOT ELIGIBLE']]);
    const simulation=p.tier==='T1-T2'?[4,5].includes(n):p.tier==='T2-T3'?[5,6].includes(n):[1,4,5,6,7].includes(n);
    field(grid,'gates',id,'method','Evidence method','select',[['Records','Signed records / history'],['Live','Live observation'],...(simulation?[['Simulated','Provided simulation']]:[])]);
    field(grid,'gates',id,'date','Review date','date',[],10);field(grid,'gates',id,'caseRef','Source or event reference','text',[],300);
    field(grid,'gates',id,'evidence','Gate evidence and evaluator','textarea',[],2500);
    for(const x of p.exercises.filter(x=>x.gate===n)){
      const practical=E('div',null,item,'item');E('h3',x.id+' · '+x.title,practical);
      const details=E('details',null,practical);E('summary','Provided simulation prompt and follow-up',details);E('p','Read to candidate: '+x.prompt,details);E('p','Follow-up: '+x.inject,details);E('p','Assess: '+x.task,details);
      const fields=E('div',null,practical,'grid');field(fields,'practicals',x.id,'method','Practical method','select',[['Live','Live event'],['Simulated','Provided simulation']]);field(fields,'practicals',x.id,'result','Result','select',[['MEETS','MEETS'],['COACHING','COACHING'],['REMEDIATE','REMEDIATE']]);field(fields,'practicals',x.id,'date','Date','date',[],10);field(fields,'practicals',x.id,'shift','Shift / context','text',[],80);field(fields,'practicals',x.id,'caseRef','Event or exercise ID','text',[],300);
      if(x.id.startsWith('T4-BASE'))field(fields,'practicals',x.id,'managerReviewed','Security Manager conducted or directly reviewed','checkbox');
      field(fields,'practicals',x.id,'evidence','Candidate response, observed actions, evaluator and recheck','textarea',[],1800);
    }
  }
  c=titleCard('Six verbal scenarios');E('p','Ask each question aloud. Record the candidate’s spoken decisions and follow-up; the candidate does not write an answer.',c);
  p.scenarios.forEach((x,i)=>{const item=E('div',null,c,'item');E('h3','Oral Scenario '+(i+1)+' of 6 · '+x.title,item);E('p','Read aloud: '+x.prompt,item,'hint');if(x.inject)E('p','Evaluator follow-up: '+x.inject,item,'hint');const grid=E('div',null,item,'grid');field(grid,'scenarios',x.id,'grade','Evaluator grade','select',[['MEETS','MEETS'],['COACHING','COACHING'],['REMEDIATE','REMEDIATE']]);field(grid,'scenarios',x.id,'critical','Critical failure','checkbox');field(grid,'scenarios',x.id,'response','Candidate’s verbal decisions and key facts','textarea',[],2500);field(grid,'scenarios',x.id,'followUp','Response to follow-up, coaching and recheck','textarea',[],1500)});
  c=titleCard('Supervisor recommendation');E('p','The Security Manager makes the final promotion decision, including the required T4 interview.',c);
  const meta=E('div',null,c,'grid');
  for(const [id,label,kind,opts,max] of [['evaluatorName','Evaluator full name','text',[],120],['recommendation','Recommendation','select',[['Recommend','Recommend promotion'],['Return for development','Return for development']],25],['notes','Assessment, strengths, gaps and next steps','textarea',[],2000]]){
    const wrap=E('div',null,meta,id==='notes'?'full':'');E('label',label,wrap);
    const el=E(kind==='textarea'?'textarea':kind==='select'?'select':'input',null,wrap);el.id=id;
    if(kind==='select'){for(const [v,t] of [['','Choose'],...opts]){const o=E('option',t,el);o.value=v}}
    else el.maxLength=max;
  }
  function envelope(completed){return {format:'PWADC-promotion-evaluation-1',packetId:p.packetId,tier:p.tier,issuedAt:p.issuedAt,
    checklistIds:p.checklist.map(x=>x.id),scenarioIds:p.scenarios.map(x=>x.id),assessment,
    evaluatorName:document.getElementById('evaluatorName').value.trim(),recommendation:document.getElementById('recommendation').value,
    notes:document.getElementById('notes').value.trim(),completed,submittedAt:completed?new Date().toISOString():''}}
  function download(payload,label){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PWADC_Promotion_'+p.packetId+'_'+label+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);status.textContent=label+' file saved. Keep it in an approved location.'}
  function validate(){const a=assessment,r=document.getElementById('recommendation').value;
    if(document.getElementById('evaluatorName').value.trim().length<3||document.getElementById('notes').value.trim().length<20||!r)return 'Enter evaluator name, recommendation and assessment notes (20+ characters).';
    for(const x of p.checklist){const v=a.checklist[x.id]||{};if(!v.status||(v.status==='Verified'&&(v.evidence||'').trim().length<10))return 'Complete checklist '+x.id+' with evidence.';if(r==='Recommend'&&v.status!=='Verified')return 'Resolve checklist gaps before recommending promotion.'}
    for(let i=0;i<p.gateNames.length;i++){const v=a.gates[String(i+1)]||{};if(!v.status||!v.method||!v.date||(v.evidence||'').trim().length<20||(v.method!=='Records'&&(v.caseRef||'').trim().length<3))return 'Complete evidence gate '+(i+1)+'.';if(r==='Recommend'&&v.status!=='PASS')return 'All gates must PASS for a recommendation.'}
    for(const x of p.exercises){const v=a.practicals[x.id]||{};if(!v.method||!v.result||!v.date||(v.caseRef||'').trim().length<3||(v.evidence||'').trim().length<20)return 'Complete practical '+x.id+'.';if(r==='Recommend'&&v.result==='REMEDIATE')return 'Resolve practical remediation first.'}
    for(const x of p.scenarios){const v=a.scenarios[x.id]||{};if(!v.grade||(v.response||'').trim().length<20||(v.followUp||'').trim().length<10)return 'Grade and document oral scenario '+x.id+'.';if(r==='Recommend'&&(v.grade==='REMEDIATE'||v.critical))return 'Resolve oral scenario remediation or critical failure.'}
    if(p.tier==='T3-T4'){const x=a.practicals['T4-BASE1'],y=a.practicals['T4-BASE2'];if(x.date===y.date&&(!x.shift||x.shift===y.shift))return 'T4 BASE practicals require different dates or shifts.';if(r==='Recommend'&&!x.managerReviewed&&!y.managerReviewed)return 'Security Manager must review one T4 BASE practical.'}
    if(r==='Recommend')for(const x of p.missingTraining){const v=a.training[x.assignmentId]||{};if(!v.resolved||(v.reference||'').trim().length<10)return 'Resolve missing Training '+x.requirement+' against its signed source.'}
    return ''}
  document.getElementById('save').onclick=()=>download(envelope(false),'Progress');
  document.getElementById('submit').onclick=()=>{const error=validate();if(error){status.textContent=error;return}download(envelope(true),'Completed_Evaluation')};
  document.getElementById('resume').onclick=()=>document.getElementById('resumeFile').click();
  document.getElementById('resumeFile').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;const saved=JSON.parse(await file.text());if(saved.format!=='PWADC-promotion-evaluation-1'||saved.packetId!==p.packetId||saved.tier!==p.tier||saved.issuedAt!==p.issuedAt||JSON.stringify(saved.checklistIds)!==JSON.stringify(p.checklist.map(x=>x.id))||JSON.stringify(saved.scenarioIds)!==JSON.stringify(p.scenarios.map(x=>x.id)))throw Error('This progress file belongs to a different or changed packet.');
    for(const section of ['checklist','gates','scenarios','practicals','training']){if(!saved.assessment?.[section]||typeof saved.assessment[section]!=='object')throw Error('The progress file is incomplete.');assessment[section]=saved.assessment[section]}
    for(const el of root.querySelectorAll('[data-section]')){const value=assessment[el.dataset.section]?.[el.dataset.id]?.[el.dataset.key];if(el.type==='checkbox')el.checked=value===true;else el.value=value||''}
    for(const id of ['evaluatorName','recommendation','notes'])document.getElementById(id).value=saved[id]||'';
    status.textContent='Progress loaded. Review before exporting.';
  }catch(e){status.textContent='Could not load progress: '+e.message}event.target.value=''};
}
async function exportPromotionPortablePacket(id){
  const p=promotionPacket(id);if(!p||p.status!=='Issued'||!promotionPacketCan('issue'))return;
  try{const fileName='PWADC_Promotion_'+String(p.id).replace(/[^a-z0-9_-]/gi,'_')+'_Supervisor.html';
    const result=await SuiteBridge.send('suite:writeExport',promotionPortableHtml(p),{module:'promotion-packets',fileName});
    window._promotionPortableExportPath=result.path;
    showModal(`<div class="modal-head"><div class="modal-title">Supervisor packet exported</div><button onclick="closeModal()">Close</button></div><p>Send this HTML file to the supervisor. It opens offline in a browser and needs no Suite access. The supervisor returns a Completed Evaluation JSON file for import.</p><p><strong>Saved at</strong><br><code style="overflow-wrap:anywhere">${esc(result.path)}</code></p><p class="notice">Contains employee promotion and Training gap details. Share and retain it in the approved personnel location.</p><div class="modal-actions"><button onclick="openPromotionPortableExportFolder()">Open Export Folder</button><button class="primary" onclick="closeModal()">Done</button></div>`);
  }catch(e){toast('Supervisor packet export failed: '+e.message)}
}
async function openPromotionPortableExportFolder(){
  const path=window._promotionPortableExportPath?.replace(/[\\/][^\\/]+$/,'');
  if(!path)return;
  try{await SuiteBridge.send('suite:openPath',{path})}catch(e){toast('Could not open export folder: '+e.message)}
}
async function importPromotionPortableEvaluation(input){
  try{const file=input.files?.[0];if(!file)return;if(file.size>180000)throw Error('Evaluation file is too large.');
    const value=JSON.parse(await file.text());const p=promotionPacket(value.packetId);
    if(value.format!=='PWADC-promotion-evaluation-1'||value.completed!==true||!p||p.status!=='Issued'||
      p.tier!==value.tier||p.issuedAt!==value.issuedAt||
      JSON.stringify((p.checklist||[]).map(x=>x.id))!==JSON.stringify(value.checklistIds)||
      JSON.stringify((p.scenarios||[]).map(x=>x.id))!==JSON.stringify(value.scenarioIds))throw Error('The completed file does not match an open issued packet.');
    if(!promotionPacketCan('issue'))throw Error('Manager access is required to import a returned evaluation.');
    window._promotionPortableImport=value;
    const preview=`<details><summary>Review returned grades and evidence</summary><h4>Checklist</h4>${(p.checklist||[]).map(x=>`<p><b>${esc(x.id)} · ${esc(value.assessment?.checklist?.[x.id]?.status||'Missing')}</b><br>${esc(value.assessment?.checklist?.[x.id]?.evidence||'')}</p>`).join('')}<h4>Gates</h4>${promotionGateNamesFor(p.tier).map((name,i)=>{const r=value.assessment?.gates?.[String(i+1)]||{};return `<p><b>${i+1}. ${esc(name)} · ${esc(r.status||'Missing')}</b><br>${esc(r.evidence||'')}</p>`}).join('')}<h4>Practicals</h4>${Object.values(promotionDigitalExerciseIds[p.tier]||{}).flat().map(id=>{const r=value.assessment?.practicals?.[id]||{};return `<p><b>${esc(id)} · ${esc(r.result||'Missing')}</b><br>${esc(r.evidence||'')}</p>`}).join('')}<h4>Six oral scenarios</h4>${(p.scenarios||[]).map((x,i)=>{const r=value.assessment?.scenarios?.[x.id]||{};return `<p><b>${i+1}. ${esc(x.title||x.id)} · ${esc(r.grade||'Missing')}${r.critical?' · Critical failure':''}</b><br>${esc(r.response||'')}<br>${esc(r.followUp||'')}</p>`}).join('')}</details>`;
    showModal(`<div class="modal-head"><div class="modal-title">Import supervisor evaluation</div><button onclick="closeModal()">Close</button></div><p><strong>${esc(p.employee?.name||'')} · ${esc(p.tier)} · ${esc(p.id)}</strong></p><p>Evaluator: ${esc(value.evaluatorName||'')} · Submitted: ${esc(value.submittedAt||'')} · Recommendation: ${esc(value.recommendation||'')}</p><div class="notice">${esc(value.notes||'')}</div><p>${(p.scenarios||[]).length} issued oral scenarios · ${(p.checklist||[]).length} checklist standards · ${promotionGateNamesFor(p.tier).length} gates. Import validates every response and makes the supervisor record read-only. Verify source documents and the evaluator’s identity before final approval.</p>${preview}<div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="confirmPromotionPortableImport()">Import Evaluation</button></div>`);
  }catch(e){toast('Evaluation import failed: '+e.message)}finally{input.value=''}
}
async function confirmPromotionPortableImport(){const value=window._promotionPortableImport;if(!value)return;
  const result=await promotionCommand('import',{packetId:value.packetId,evaluation:value});
  if(result){window._promotionPortableImport=null;openPromotionDigitalPacket(value.packetId,'recommendation')}
}
