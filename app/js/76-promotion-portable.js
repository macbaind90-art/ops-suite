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
<style>:root{font:16px/1.5 Arial,sans-serif;color:#222;background:#f3f3f3}*{box-sizing:border-box}body{margin:0}header{background:#991b2b;color:white;padding:22px max(20px,calc((100% - 1050px)/2))}header h1{margin:0;font-size:24px}main{max-width:1050px;margin:22px auto;padding:0 14px 55px}.card{background:white;border:1px solid #d6d6d6;border-radius:8px;margin:14px 0;padding:18px}.card h2{margin:0 0 10px;color:#991b2b;font-size:20px}.item{padding:16px 0;border-top:1px solid #ddd}.item:first-of-type{border:0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.full{grid-column:1/-1}label{display:block;font-weight:600;margin:10px 0 4px}input:not([type=checkbox]),textarea,select{font:inherit;width:100%;padding:9px;border:1px solid #999;border-radius:4px}textarea{min-height:85px}button{font:inherit;background:#991b2b;border:0;border-radius:4px;color:white;padding:10px 14px;cursor:pointer;margin:3px}button.secondary{background:#343b46}button:disabled{opacity:.4;cursor:default}.actions,.step-nav{background:#fff;padding:10px;border:1px solid #ddd;display:flex;flex-wrap:wrap;align-items:center;gap:6px}.actions{position:sticky;top:0;z-index:2}.step-nav{margin:14px 0;border-radius:6px}#stepPicker{width:auto;max-width:100%}#stepProgress{font-weight:700;flex:1 1 250px}.hint{background:#f9f3e9;border-left:4px solid #a87500;padding:12px;white-space:pre-wrap}.prompt{background:#f9f3e9;border-left:4px solid #a87500;padding:12px;white-space:pre-wrap;margin:12px 0}.prompt strong{display:block;color:#6d210e;margin-bottom:5px}small{color:#555}#status{font-weight:bold;padding:6px}#reviewSummary{white-space:pre-wrap}.review-list li{margin:6px 0}@media(max-width:650px){.grid{grid-template-columns:1fr}.full{grid-column:auto}}@media print{header{background:white;color:#222}body{background:white}.actions,.step-nav,button,input[type=file]{display:none!important}#sections .card[hidden]{display:block!important}.card{break-inside:avoid;border:0;border-bottom:1px solid #ccc}textarea{min-height:55px}}</style></head><body><header><h1>PWADC Security · Supervisor Promotion Packet</h1><div id="identity"></div></header><main><div class="actions"><span id="stepProgress" role="status"></span><button id="save">Save Progress JSON</button><button id="resume" class="secondary">Load Saved Progress</button><input id="resumeFile" type="file" accept=".json,application/json" hidden><button class="secondary" onclick="window.print()">Print / Save PDF</button><span id="status" role="status"></span></div><div id="sections"></div><div class="step-nav"><button id="previous" class="secondary">Previous</button><label for="stepPicker">Go to step</label><select id="stepPicker"></select><button id="next">Next</button></div></main><script id="packet-data" type="application/json">${snapshot}</script><script>(${promotionPortableRuntime.toString()})();</script></body></html>`;
}
function promotionPortableRuntime(){
  'use strict';
  const p=JSON.parse(document.getElementById('packet-data').textContent);
  const assessment={checklist:{},gates:{},scenarios:{},practicals:{},training:{}};
  const root=document.getElementById('sections'),status=document.getElementById('status');
  const steps=[];let currentStep=0;
  const E=(tag,text,parent,cls)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;if(cls)e.className=cls;(parent||root).appendChild(e);return e};
  function prompt(parent,label,body){const block=E('div',null,parent,'prompt');E('strong',label,block);E('div',body,block)}
  function field(parent,section,id,key,label,kind='text',options=[],max=2500){
    const wrap=E('div',null,parent);const labelEl=E('label',label,wrap);
    const el=E(kind==='textarea'?'textarea':kind==='select'?'select':'input',null,wrap);
    if(kind==='select')for(const [value,title] of [['','Choose'],...options]){const o=E('option',title,el);o.value=value}
    else if(kind==='checkbox'){el.type='checkbox';labelEl.appendChild(el)}
    else if(kind==='date')el.type='date';
    else if(kind!=='textarea')el.type='text';
    if(kind!=='select'&&kind!=='checkbox')el.maxLength=max;
    el.dataset.section=section;el.dataset.id=id;el.dataset.key=key;
    const update=()=>{assessment[section][id]??={};assessment[section][id][key]=kind==='checkbox'?el.checked:el.value;status.textContent='Unsaved changes';updateProgress()};
    el.addEventListener(kind==='checkbox'||kind==='select'||kind==='date'?'change':'input',update);
    return el;
  }
  function titleCard(title,kind,id=''){
    const c=E('section',null,root,'card');steps.push({title,kind,id,element:c});E('h2',title,c);return c;
  }
  document.getElementById('identity').textContent=p.employee.name+' · '+p.tier.replace('-', ' → ')+' · Packet '+p.packetId+' · Issued '+new Date(p.issuedAt).toLocaleDateString();
  let c=titleCard('Start the evaluation','start');
  E('p','Candidate: '+p.employee.name+' · '+p.tier.replace('-', ' → ')+' · '+p.scenarios.length+' issued oral scenarios',c);
  E('p','Work through each step using Next. You may jump back to any step. Save Progress JSON whenever you pause, then use Load Saved Progress to continue in this same HTML file. Nothing is sent automatically.',c);
  prompt(c,'Evaluation sequence','1. Verify the issued checklist against signed records. 2. Review each evidence gate and conduct its listed practicals. 3. Read all six issued oral scenarios to the candidate, then grade and document the verbal answers. 4. Record your recommendation and review the whole packet before exporting the completed JSON.');
  prompt(c,'Important boundary','Only a real signed Training or eligibility record can establish a qualification. A simulated practical can assess operational judgment where allowed. The Security Manager makes the final promotion decision; T4 also requires a Security Manager interview.');
  let checklistSection='';
  for(const x of p.checklist){
    if(x.section!==checklistSection){checklistSection=x.section;c=titleCard('Checklist · '+checklistSection,'checklist',checklistSection);E('p','Verify every item in this section against its source. Record a gap if it is not met.',c)}
    const item=E('div',null,c,'item');E('strong',x.id,item);E('p',x.text,item);const grid=E('div',null,item,'grid');field(grid,'checklist',x.id,'status','Result','select',[['Verified','Verified'],['Gap','Gap'],['Not observed','Not observed']]);field(grid,'checklist',x.id,'evidence','Evidence, source and date','textarea',[],1200);
  }
  if(p.missingTraining.length){c=titleCard('Missing Training at issue','training');E('p','A checked box requires a real signed source record. This form does not create a Training signoff.',c);for(const x of p.missingTraining){const item=E('div',null,c,'item');E('strong',x.requirement,item);field(item,'training',x.assignmentId,'resolved','Signed source record verified','checkbox');field(item,'training',x.assignmentId,'reference','Signed record / date / verifier','text',[],500)}}
  for(let i=0;i<p.gateNames.length;i++){
    const n=i+1,id=String(n),item=titleCard('Gate '+id+' · '+p.gateNames[i],'gate',id);
    E('p','Record the gate result and its source evidence. Any practical exercises for this gate appear in the next steps, each with its own scenario and result.',item);
    const grid=E('div',null,item,'grid');field(grid,'gates',id,'status','Gate result','select',[['PASS','PASS'],['REMEDIATE','REMEDIATE'],['HOLD','HOLD'],['NOT ELIGIBLE','NOT ELIGIBLE']]);
    const simulation=p.tier==='T1-T2'?[4,5].includes(n):p.tier==='T2-T3'?[5,6].includes(n):[1,4,5,6,7].includes(n);
    field(grid,'gates',id,'method','Evidence method','select',[['Records','Signed records / history'],['Live','Live observation'],...(simulation?[['Simulated','Provided simulation']]:[])]);
    field(grid,'gates',id,'date','Review date','date',[],10);field(grid,'gates',id,'caseRef','Source or event reference','text',[],300);
    field(grid,'gates',id,'evidence','Gate evidence and evaluator','textarea',[],2500);
    for(const x of p.exercises.filter(x=>x.gate===n)){
      const practical=titleCard('Practical '+x.id+' · '+x.title,'practical',x.id);
      E('p','Use a suitable live event or read the provided simulated situation to the candidate. Record what the candidate actually did or said, then grade this practical.',practical);
      prompt(practical,'Provided simulation · read to candidate',x.prompt);
      prompt(practical,'Evaluator follow-up fact',x.inject);
      prompt(practical,'Assessment focus',x.task);
      E('p','Use the provided simulation if there is no suitable live event. Record which method you used below.',practical);
      const fields=E('div',null,practical,'grid');field(fields,'practicals',x.id,'method','Practical method','select',[['Live','Live event'],['Simulated','Provided simulation']]);field(fields,'practicals',x.id,'result','Result','select',[['MEETS','MEETS'],['COACHING','COACHING'],['REMEDIATE','REMEDIATE']]);field(fields,'practicals',x.id,'date','Date','date',[],10);field(fields,'practicals',x.id,'shift','Shift / context','text',[],80);field(fields,'practicals',x.id,'caseRef','Event or exercise ID','text',[],300);
      if(x.id.startsWith('T4-BASE'))field(fields,'practicals',x.id,'managerReviewed','Security Manager conducted or directly reviewed','checkbox');
      field(fields,'practicals',x.id,'evidence','Candidate response, observed actions, evaluator and recheck','textarea',[],1800);
    }
  }
  p.scenarios.forEach((x,i)=>{
    const item=titleCard('Oral Scenario '+(i+1)+' of 6 · '+x.title,'scenario',x.id);
    E('p','Read the issued prompt aloud. Let the candidate explain their decisions, then read the follow-up fact and record how the answer changed. Grade the verbal response.',item);
    prompt(item,'Read aloud to candidate',x.prompt);
    prompt(item,'Evaluator follow-up after initial answer',x.inject||'Assume the first contact or resource is unavailable and the situation becomes more urgent. What changes in your priorities, who do you notify, and what do you document?');
    const grid=E('div',null,item,'grid');field(grid,'scenarios',x.id,'grade','Evaluator grade','select',[['MEETS','MEETS'],['COACHING','COACHING'],['REMEDIATE','REMEDIATE']]);field(grid,'scenarios',x.id,'critical','Critical failure','checkbox');field(grid,'scenarios',x.id,'response','Candidate’s verbal decisions and key facts','textarea',[],2500);field(grid,'scenarios',x.id,'followUp','Response to follow-up, coaching and recheck','textarea',[],1500);
  });
  c=titleCard('Supervisor recommendation','recommendation');E('p','Summarize the evidence, gaps, and next steps. The Security Manager makes the final promotion decision, including the required T4 interview.',c);
  const meta=E('div',null,c,'grid');
  for(const [id,label,kind,opts,max] of [['evaluatorName','Evaluator full name','text',[],120],['recommendation','Recommendation','select',[['Recommend','Recommend promotion'],['Return for development','Return for development']],25],['notes','Assessment, strengths, gaps and next steps','textarea',[],2000]]){
    const wrap=E('div',null,meta,id==='notes'?'full':'');E('label',label,wrap);
    const el=E(kind==='textarea'?'textarea':kind==='select'?'select':'input',null,wrap);el.id=id;
    if(kind==='select'){for(const [v,t] of [['','Choose'],...opts]){const o=E('option',t,el);o.value=v}}
    else el.maxLength=max;
  }
  for(const id of ['evaluatorName','recommendation','notes'])document.getElementById(id).addEventListener('input',()=>{status.textContent='Unsaved changes';updateProgress()});
  c=titleCard('Review and return','review');
  E('p','Check the recorded results and any unresolved issues. Export the completed evaluation JSON and return that file to the Security Manager. Keep a copy of the file you send.',c);
  const reviewSummary=E('div',null,c,'hint');
  const submit=E('button','Export Completed Evaluation JSON',c);submit.id='submit';
  function counts(){
    const checklist=p.checklist.filter(x=>assessment.checklist[x.id]?.status).length;
    const gates=p.gateNames.filter((_,i)=>assessment.gates[String(i+1)]?.status).length;
    const practicals=p.exercises.filter(x=>assessment.practicals[x.id]?.result).length;
    const oral=p.scenarios.filter(x=>assessment.scenarios[x.id]?.grade).length;
    return {checklist,gates,practicals,oral};
  }
  function renderReview(){
    const n=counts(),recommendation=document.getElementById('recommendation').value||'Not selected';
    const gaps=p.checklist.filter(x=>assessment.checklist[x.id]?.status==='Gap'||assessment.checklist[x.id]?.status==='Not observed').map(x=>x.id);
    const gateIssues=p.gateNames.map((_,i)=>[String(i+1),assessment.gates[String(i+1)]?.status]).filter(x=>x[1]&&x[1]!=='PASS').map(x=>'Gate '+x[0]+' '+x[1]);
    const oralIssues=p.scenarios.map((x,i)=>({number:i+1,record:assessment.scenarios[x.id]||{}})).filter(x=>x.record.grade==='REMEDIATE'||x.record.critical).map(x=>'Oral '+x.number+(x.record.critical?' critical failure':' remediation'));
    reviewSummary.textContent='Evaluator: '+(document.getElementById('evaluatorName').value||'Not entered')+'\nRecommendation: '+recommendation+'\nChecklist: '+n.checklist+'/'+p.checklist.length+' recorded; Gates: '+n.gates+'/'+p.gateNames.length+'; Practicals: '+n.practicals+'/'+p.exercises.length+'; Oral: '+n.oral+'/6\nChecklist gaps: '+(gaps.join(', ')||'None recorded')+'\nGate issues: '+(gateIssues.join(', ')||'None recorded')+'\nOral issues: '+(oralIssues.join(', ')||'None recorded')+'\nCompletion check: '+(validate()||'Ready to export.');
  }
  function updateProgress(){
    const n=counts();document.getElementById('stepProgress').textContent='Step '+(currentStep+1)+' of '+steps.length+' · Checklist '+n.checklist+'/'+p.checklist.length+' · Gates '+n.gates+'/'+p.gateNames.length+' · Practicals '+n.practicals+'/'+p.exercises.length+' · Oral '+n.oral+'/6';
    if(steps[currentStep]?.kind==='review')renderReview();
  }
  function showStep(index){
    currentStep=Math.max(0,Math.min(steps.length-1,Number(index)||0));
    steps.forEach((s,i)=>{s.element.hidden=i!==currentStep});
    document.getElementById('stepPicker').value=String(currentStep);
    document.getElementById('previous').disabled=currentStep===0;
    document.getElementById('next').disabled=currentStep===steps.length-1;
    document.getElementById('next').textContent=currentStep===steps.length-2?'Review packet':'Next';
    updateProgress();if(typeof window.scrollTo==='function')window.scrollTo(0,0);
  }
  const picker=document.getElementById('stepPicker');
  steps.forEach((s,i)=>{const opt=E('option',(i+1)+'. '+s.title,picker);opt.value=String(i)});
  picker.onchange=()=>showStep(picker.value);
  document.getElementById('previous').onclick=()=>showStep(currentStep-1);
  document.getElementById('next').onclick=()=>showStep(currentStep+1);
  showStep(0);
  function envelope(completed){return {format:'PWADC-promotion-evaluation-1',packetId:p.packetId,tier:p.tier,issuedAt:p.issuedAt,
    checklistIds:p.checklist.map(x=>x.id),scenarioIds:p.scenarios.map(x=>x.id),assessment,
    evaluatorName:document.getElementById('evaluatorName').value.trim(),recommendation:document.getElementById('recommendation').value,
    notes:document.getElementById('notes').value.trim(),stepIndex:currentStep,completed,submittedAt:completed?new Date().toISOString():''}}
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
  function stepForIssue(error){
    if(error.startsWith('Resolve checklist gaps')){
      const item=p.checklist.find(x=>assessment.checklist[x.id]?.status!=='Verified');
      return steps.findIndex(x=>x.kind==='checklist'&&x.id===item?.section);
    }
    if(error.startsWith('All gates must PASS')){
      const n=p.gateNames.findIndex((_,i)=>assessment.gates[String(i+1)]?.status!=='PASS')+1;
      return steps.findIndex(x=>x.kind==='gate'&&x.id===String(n));
    }
    if(error.startsWith('Resolve practical remediation')){
      const exercise=p.exercises.find(x=>assessment.practicals[x.id]?.result==='REMEDIATE');
      return steps.findIndex(x=>x.kind==='practical'&&x.id===exercise?.id);
    }
    if(error.startsWith('Resolve oral scenario remediation')){
      const scenario=p.scenarios.find(x=>assessment.scenarios[x.id]?.grade==='REMEDIATE'||assessment.scenarios[x.id]?.critical);
      return steps.findIndex(x=>x.kind==='scenario'&&x.id===scenario?.id);
    }
    const checklistId=error.match(/checklist (\S+)/)?.[1];
    if(checklistId){const item=p.checklist.find(x=>x.id===checklistId);return steps.findIndex(x=>x.kind==='checklist'&&x.id===item?.section)}
    const gateId=error.match(/gate (\d+)/)?.[1];
    if(gateId)return steps.findIndex(x=>x.kind==='gate'&&x.id===gateId);
    const practicalId=error.match(/practical ([^\s.]+)/)?.[1];
    if(practicalId)return steps.findIndex(x=>x.kind==='practical'&&x.id===practicalId);
    const scenarioId=error.match(/oral scenario ([^\s.]+)/)?.[1];
    if(scenarioId)return steps.findIndex(x=>x.kind==='scenario'&&x.id===scenarioId);
    if(error.startsWith('T4 BASE')||error.startsWith('Security Manager must review'))return steps.findIndex(x=>x.kind==='practical'&&x.id==='T4-BASE1');
    if(error.startsWith('Resolve missing Training'))return steps.findIndex(x=>x.kind==='training');
    if(error.startsWith('Enter evaluator'))return steps.findIndex(x=>x.kind==='recommendation');
    return steps.length-1;
  }
  document.getElementById('save').onclick=()=>download(envelope(false),'Progress');
  document.getElementById('submit').onclick=()=>{const error=validate();if(error){const target=stepForIssue(error);showStep(target<0?steps.length-1:target);status.textContent=error;return}download(envelope(true),'Completed_Evaluation')};
  document.getElementById('resume').onclick=()=>document.getElementById('resumeFile').click();
  document.getElementById('resumeFile').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;const saved=JSON.parse(await file.text());if(saved.format!=='PWADC-promotion-evaluation-1'||saved.packetId!==p.packetId||saved.tier!==p.tier||saved.issuedAt!==p.issuedAt||JSON.stringify(saved.checklistIds)!==JSON.stringify(p.checklist.map(x=>x.id))||JSON.stringify(saved.scenarioIds)!==JSON.stringify(p.scenarios.map(x=>x.id)))throw Error('This progress file belongs to a different or changed packet.');
    for(const section of ['checklist','gates','scenarios','practicals','training']){if(!saved.assessment?.[section]||typeof saved.assessment[section]!=='object')throw Error('The progress file is incomplete.');assessment[section]=saved.assessment[section]}
    for(const el of root.querySelectorAll('[data-section]')){const value=assessment[el.dataset.section]?.[el.dataset.id]?.[el.dataset.key];if(el.type==='checkbox')el.checked=value===true;else el.value=value||''}
    for(const id of ['evaluatorName','recommendation','notes'])document.getElementById(id).value=saved[id]||'';
    showStep(Number.isInteger(saved.stepIndex)?saved.stepIndex:0);
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
