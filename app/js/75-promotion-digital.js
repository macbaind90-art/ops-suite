/* Saved, evaluator-facing promotion assessment. The printed workbook remains available. */
let promotionDigitalSession=null;
const promotionDigitalExerciseIds={
  'T1-T2':{'4':['T1-BASE'],'5':['T1-COACH']},
  'T2-T3':{'5':['T2-REPORT1','T2-REPORT2','T2-REPORT3','T2-INCIDENT'],'6':['T2-COACH']},
  'T3-T4':{'1':['T4-BASE1','T4-BASE2'],'4':['T4-COACH'],'5':['T4-LEAD1','T4-LEAD2','T4-LEAD3'],
    '6':['T4-REPORT1','T4-REPORT2','T4-REPORT3','T4-SHADOW1','T4-SHADOW2','T4-SHADOW3','T4-FLAWED']}
};
function openPromotionDigitalPacket(id,tab='overview'){
  const p=promotionPacket(id);
  if(!p||p.status==='Deleted'||!hasCapability('promotion.view'))return;
  if(promotionDigitalSession?.id!==id)promotionDigitalSession={id,assessment:JSON.parse(JSON.stringify(p.digitalAssessment||{checklist:{},gates:{},scenarios:{},practicals:{},training:{}})),dirty:false};
  window._promotionDigitalOpen=id;
  window._promotionDigitalTab=tab;
  if(activeModule!=='promotion-packets')navigate('promotion-packets');
  else safeRenderPages({preserveScroll:false});
}
function closePromotionDigitalPacket(){
  if(promotionDigitalSession?.dirty&&!confirm('Leave without saving the digital assessment?'))return;
  promotionDigitalSession=null;window._promotionDigitalOpen='';safeRenderPages({preserveScroll:false});
}
function promotionDigitalDraft(p){
  if(promotionDigitalSession?.id!==p.id)promotionDigitalSession={id:p.id,assessment:JSON.parse(JSON.stringify(p.digitalAssessment||{checklist:{},gates:{},scenarios:{},practicals:{},training:{}})),dirty:false};
  const a=promotionDigitalSession.assessment;
  for(const key of ['checklist','gates','scenarios','practicals','training'])a[key]??={};
  return a;
}
function promotionDigitalSet(section,key,field,value){
  const a=promotionDigitalSession?.assessment;if(!a||!a[section])return;
  a[section][key]??={};a[section][key][field]=value;
  promotionDigitalSession.dirty=true;
  const badge=document.getElementById('promotionDigitalSaveState');if(badge)badge.textContent='Unsaved changes';
}
function promotionDigitalOptions(current,values){return values.map(([value,label])=>`<option value="${esc(value)}" ${current===value?'selected':''}>${esc(label)}</option>`).join('')}
function promotionDigitalInput(section,key,field,value,placeholder='',rows=3,locked=false){
  const limit=section==='checklist'?1200:section==='practicals'?1800:field==='evidence'||field==='response'?2500:1500;
  return `<textarea rows="${rows}" maxlength="${limit}" placeholder="${esc(placeholder)}" ${locked?'disabled':''} oninput="promotionDigitalSet('${section}','${esc(key)}','${field}',this.value)">${esc(value||'')}</textarea>`;
}
function promotionDigitalSelect(section,key,field,value,values,locked=false){
  return `<select ${locked?'disabled':''} onchange="promotionDigitalSet('${section}','${esc(key)}','${field}',this.value)">${promotionDigitalOptions(value||'',values)}</select>`;
}
function promotionDigitalProgress(p,a){
  const check=(p.checklist||[]).filter(x=>a.checklist[x.id]?.status).length;
  const gates=promotionGateNamesFor(p.tier).filter((_,i)=>a.gates[String(i+1)]?.status).length;
  const oral=(p.scenarios||[]).filter(x=>a.scenarios[x.id]?.grade).length;
  const ids=Object.values(promotionDigitalExerciseIds[p.tier]||{}).flat();
  const practicals=ids.filter(id=>a.practicals[id]?.result).length;
  return `${check}/${(p.checklist||[]).length} checklist · ${gates}/${promotionGateNamesFor(p.tier).length} gates · ${practicals}/${ids.length} practicals · ${oral}/6 oral scenarios`;
}
function renderPromotionDigitalPacket(id){
  const p=promotionPacket(id);if(!p||p.status==='Deleted'||!hasCapability('promotion.view')){window._promotionDigitalOpen='';return renderPromotionPackets()}
  const a=promotionDigitalDraft(p),editable=p.status==='Issued'&&promotionPacketCan('review');
  const tabs=[['overview','Overview'],['checklist','Checklist'],['gates','Evidence Gates'],['scenarios','Six Oral Scenarios'],['recommendation','Recommendation']];
  const tab=window._promotionDigitalTab||'overview';
  const main=tab==='checklist'?promotionDigitalChecklist(p,a,editable):tab==='gates'?promotionDigitalGates(p,a,editable):tab==='scenarios'?promotionDigitalScenarios(p,a,editable):tab==='recommendation'?promotionDigitalRecommendation(p,a,editable):promotionDigitalOverview(p,a,editable);
  return `<style>.promo-digital-nav{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.promo-digital-card{border:1px solid var(--border);border-radius:10px;padding:16px;margin:14px 0;background:var(--surface)}.promo-digital-card h3{margin:0 0 12px}.promo-digital-card textarea{width:100%;min-height:80px}.promo-digital-card select,.promo-digital-card input[type="text"],.promo-digital-card input[type="date"]{width:100%}.promo-digital-row{display:grid;grid-template-columns:minmax(180px,1fr) minmax(240px,2fr);gap:14px;border-top:1px solid var(--border);padding:12px 0}.promo-digital-row:first-of-type{border-top:0}.promo-digital-row label{display:block;margin:8px 0 4px}.promo-digital-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;position:sticky;bottom:0;padding:10px;background:var(--surface);border-top:1px solid var(--border);z-index:5}@media(max-width:800px){.promo-digital-row{grid-template-columns:1fr}}</style>
    <div class="page-head"><div><div class="page-title">Digital Promotion Packet</div><div class="page-sub">${esc(p.employee?.name||'')} · ${esc(p.tier?.replace('-',' → ')||'')} · ${esc(p.status||'')} · ${esc(p.id)}</div></div><div class="top-actions"><button onclick="closePromotionDigitalPacket()">Back to Register</button>${p.status==='Issued'&&promotionPacketCan('issue')?`<button onclick="exportPromotionPortablePacket('${esc(p.id)}')">Export Supervisor HTML</button>`:''}<button onclick="printPromotionPacket('${esc(p.id)}')">Blank Packet Preview</button><button onclick="printPromotionDigitalRecord('${esc(p.id)}')">Completed Record Preview</button></div></div>
    <div class="notice">${esc(promotionDigitalProgress(p,a))}. This assessment is saved in the governed Promotion Packets record. The candidate responds to scenarios verbally; the evaluator records and grades the answers. Signed qualifications and historical conduct still require their source records.</div>
    <div class="promo-digital-nav">${tabs.map(([key,label])=>`<button class="${tab===key?'primary':''}" onclick="openPromotionDigitalPacket('${esc(p.id)}','${key}')">${label}</button>`).join('')}</div>
    ${main}
    <div class="promo-digital-actions">${editable?`<button class="primary" onclick="savePromotionDigitalPacket('${esc(p.id)}')">Save Progress</button>`:''}<span class="mini-note" id="promotionDigitalSaveState">${promotionDigitalSession?.dirty?'Unsaved changes':a.updatedAt?'Last saved '+esc(promotionLocalDate(a.updatedAt)):'Not yet saved'}</span>${p.status==='Reviewed'&&promotionPacketCan('decide')?`<button class="gold" onclick="openPromotionDecisionModal('${esc(p.id)}')">Manager Decision</button>`:''}</div>`;
}
function promotionDigitalOverview(p,a,editable){
  const gaps=(p.trainingEvidence||[]).filter(x=>!x.signoffId);
  return `<div class="promo-digital-card"><h3>Assessment record</h3><p>Issued ${esc(promotionLocalDate(p.issuedAt))} · Template revision ${esc(p.templateRevision||1)} · Six issued questions remain fixed.</p><p>Use Save Progress as you work. Complete the checklist, each gate, and all six oral scenario records before submitting a recommendation. A printed packet may still be used instead.</p>${p.review?`<div class="notice">Supervisor recommendation: ${esc(p.review.recommendation||'')} · ${esc(p.review.reviewerName||'')} · ${esc(promotionLocalDate(p.review.reviewedAt))}<br>${esc(p.review.notes||'')}</div>`:''}${p.decision?`<div class="notice">Manager decision: ${esc(p.decision.result||'')} · ${esc(p.decision.managerName||'')} · ${esc(promotionLocalDate(p.decision.decidedAt))}<br>${esc(p.decision.notes||'')}</div>`:''}</div>
    ${gaps.length?`<div class="promo-digital-card"><h3>Missing training at issue</h3><p>Record the signed source reference after resolving a gap. A checkbox here does not create a Training signoff.</p>${gaps.map(x=>{const id=x.assignmentId||'',t=a.training[id]||{};return `<div class="promo-digital-row"><div><strong>${esc(x.requirement||id)}</strong><div class="mini-note">No current signoff in issue snapshot</div></div><div><label><input type="checkbox" ${t.resolved?'checked':''} ${editable?'':'disabled'} onchange="promotionDigitalSet('training','${esc(id)}','resolved',this.checked)"> Signed source record verified</label><label>Signed record / date / verifier</label><input type="text" maxlength="500" value="${esc(t.reference||'')}" ${editable?'':'disabled'} oninput="promotionDigitalSet('training','${esc(id)}','reference',this.value)"></div></div>`}).join('')}</div>`:''}`;
}
function promotionDigitalChecklist(p,a,editable){
  let section='';return `<div class="promo-digital-card"><h3>Required checklist</h3><p>Document the source and date for each verified standard. Record gaps rather than marking an item complete without evidence.</p>${(p.checklist||[]).map(x=>{const heading=x.section!==section?(section=x.section,`<h3 class="pp-subheading">${esc(section)}</h3>`):'';const row=a.checklist[x.id]||{};return `${heading}<div class="promo-digital-row"><div><strong>${esc(x.id||'')}</strong> · ${esc(x.text||'')}</div><div><label>Result</label>${promotionDigitalSelect('checklist',x.id,'status',row.status,[['','Not assessed'],['Verified','Verified'],['Gap','Gap'],['Not observed','Not observed']],!editable)}<label>Evidence / source / date</label>${promotionDigitalInput('checklist',x.id,'evidence',row.evidence,'Cite the signed source or describe the gap.',3,!editable)}</div></div>`}).join('')}</div>`;
}
function promotionDigitalSimulationGate(tier,gate){return tier==='T1-T2'?[4,5].includes(gate):tier==='T2-T3'?[5,6].includes(gate):[1,4,5,6,7].includes(gate)}
function promotionDigitalGates(p,a,editable){
  return promotionGateNamesFor(p.tier).map((name,i)=>{
    const key=String(i+1),row=a.gates[key]||{},exercises=promotionDigitalExerciseIds[p.tier]?.[key]||[];
    const practicalCards=exercises.map(id=>{const x=promotionGateExercises[id],r=a.practicals[id]||{};
      return `<div class="promo-digital-card"><h4>${esc(id)} · ${esc(x.title)}</h4><details><summary>Read provided simulation prompt and follow-up</summary><div class="notice"><p><b>Read to candidate:</b> ${esc(x.prompt)}</p><p><b>Follow-up:</b> ${esc(x.inject)}</p><p><b>Assess:</b> ${esc(x.task)}</p></div></details><div class="form-grid"><div><label>Practical method</label>${promotionDigitalSelect('practicals',id,'method',r.method,[['','Not assessed'],['Live','Live event'],['Simulated','Provided simulation']],!editable)}</div><div><label>Result</label>${promotionDigitalSelect('practicals',id,'result',r.result,[['','Not assessed'],['MEETS','MEETS'],['COACHING','COACHING'],['REMEDIATE','REMEDIATE']],!editable)}</div><div><label>Date</label><input type="date" value="${esc(r.date||'')}" ${editable?'':'disabled'} onchange="promotionDigitalSet('practicals','${id}','date',this.value)"></div><div><label>Shift / context</label><input type="text" maxlength="80" value="${esc(r.shift||'')}" ${editable?'':'disabled'} oninput="promotionDigitalSet('practicals','${id}','shift',this.value)"></div><div><label>Event or exercise ID</label><input type="text" maxlength="300" value="${esc(r.caseRef||'')}" placeholder="${id} or live record reference" ${editable?'':'disabled'} oninput="promotionDigitalSet('practicals','${id}','caseRef',this.value)"></div>${id.startsWith('T4-BASE')?`<div class="full"><label><input type="checkbox" ${r.managerReviewed?'checked':''} ${editable?'':'disabled'} onchange="promotionDigitalSet('practicals','${id}','managerReviewed',this.checked)"> Security Manager conducted or directly reviewed this practical</label></div>`:''}<div class="full"><label>Candidate response, observed actions, evaluator and recheck</label>${promotionDigitalInput('practicals',id,'evidence',r.evidence,'Document the actual response, grade basis and follow-up.',4,!editable)}</div></div></div>`
    }).join('');
    return `<div class="promo-digital-card"><h3>Gate ${key} · ${esc(name)}</h3><p>Record the gate determination and source evidence. Complete each practical below with its own date and result.</p><div class="form-grid"><div><label>Gate result</label>${promotionDigitalSelect('gates',key,'status',row.status,[['','Not assessed'],['PASS','PASS'],['REMEDIATE','REMEDIATE'],['HOLD','HOLD'],['NOT ELIGIBLE','NOT ELIGIBLE']],!editable)}</div><div><label>Evidence method</label>${promotionDigitalSelect('gates',key,'method',row.method,[['','Choose method'],['Records','Signed records / history'],['Live','Live observation'],...(promotionDigitalSimulationGate(p.tier,i+1)?[['Simulated','Provided simulation']]:[])],!editable)}</div><div><label>Review date</label><input type="date" value="${esc(row.date||'')}" ${editable?'':'disabled'} onchange="promotionDigitalSet('gates','${key}','date',this.value)"></div><div><label>Source or event references</label><input type="text" maxlength="300" value="${esc(row.caseRef||'')}" placeholder="Source record reference" ${editable?'':'disabled'} oninput="promotionDigitalSet('gates','${key}','caseRef',this.value)"></div><div class="full"><label>Gate evidence, evaluator and required recheck</label>${promotionDigitalInput('gates',key,'evidence',row.evidence,'Identify signed sources, practical results, outcome and any recheck.',5,!editable)}</div></div></div>${practicalCards}`;
  }).join('');
}
function promotionDigitalScenarios(p,a,editable){
  return `<div class="notice">Ask all six issued questions aloud. The candidate answers verbally. Record the decision sequence, follow-up response and any critical failure. These questions are separate from optional gate simulations.</div>${(p.scenarios||[]).map((x,i)=>{const row=a.scenarios[x.id]||{};return `<div class="promo-digital-card"><h3>Oral Scenario ${i+1} of 6 · ${esc(x.title||x.id||'')}</h3><div class="notice"><b>Prompt:</b> ${esc(x.prompt||'').replace(/\n/g,'<br>')}${x.inject?`<p><b>Evaluator follow-up:</b> ${esc(x.inject)}</p>`:''}</div><div class="form-grid"><div><label>Evaluator grade</label>${promotionDigitalSelect('scenarios',x.id,'grade',row.grade,[['','Not graded'],['MEETS','MEETS'],['COACHING','COACHING'],['REMEDIATE','REMEDIATE']],!editable)}</div><div><label><input type="checkbox" ${row.critical?'checked':''} ${editable?'':'disabled'} onchange="promotionDigitalSet('scenarios','${esc(x.id)}','critical',this.checked)"> Critical failure</label></div><div class="full"><label>Candidate's verbal decisions and key facts</label>${promotionDigitalInput('scenarios',x.id,'response',row.response,'Record what the candidate actually said.',4,!editable)}</div><div class="full"><label>Response to follow-up, coaching and recheck</label>${promotionDigitalInput('scenarios',x.id,'followUp',row.followUp,'Record the answer after facts changed and any gaps.',3,!editable)}</div></div></div>`}).join('')}`;
}
function promotionDigitalRecommendation(p,a,editable){
  if(p.review)return `<div class="promo-digital-card"><h3>Supervisor recommendation submitted</h3><p>${esc(p.review.recommendation||'')} · ${esc(p.review.reviewerName||'')} · ${esc(promotionLocalDate(p.review.reviewedAt))}</p><p>${esc(p.review.notes||'')}</p>${p.tier==='T3-T4'?'<p>The Security Manager interview and final decision are recorded separately.</p>':''}</div>`;
  return `<div class="promo-digital-card"><h3>Submit supervisor recommendation</h3><p>Save progress first. Submission checks every checklist result, gate, six oral responses, and any missing Training resolution. Submitted assessments become read-only.</p>${editable?`<label>Recommendation</label><select id="promotionDigitalRecommendation"><option value="Recommend">Recommend promotion</option><option value="Return for development">Return for development</option></select><label>Assessment, strengths, gaps and next steps</label><textarea id="promotionDigitalSummary" rows="5" maxlength="2000" placeholder="Give your evidence-based recommendation."></textarea><div class="modal-actions"><button class="primary" onclick="submitPromotionDigitalPacket('${esc(p.id)}')">Submit to Security Manager</button></div>`:'<p>Supervisor review access is required.</p>'}</div>`;
}
async function savePromotionDigitalPacket(id){
  const p=promotionPacket(id);if(!p||p.status!=='Issued'||!promotionPacketCan('review'))return false;
  const a=promotionDigitalDraft(p);
  const res=await promotionCommand('assessment',{packetId:id,assessment:a});
  if(res){promotionDigitalSession={id,assessment:JSON.parse(JSON.stringify(promotionPacket(id).digitalAssessment)),dirty:false};return true}
  return false;
}
async function submitPromotionDigitalPacket(id){
  const recommendation=val('promotionDigitalRecommendation'),notes=val('promotionDigitalSummary')?.trim()||'';
  if(notes.length<20){toast('Explain the recommendation in at least 20 characters.');return}
  if(!await savePromotionDigitalPacket(id))return;
  const res=await promotionCommand('review',{packetId:id,mode:'digital',recommendation,notes});
  if(res){promotionDigitalSession=null;openPromotionDigitalPacket(id,'recommendation')}
}
function printPromotionDigitalRecord(id){
  const p=promotionPacket(id);if(!p||p.status==='Deleted'||!hasCapability('promotion.view'))return;
  const a=p.digitalAssessment;if(!a){toast('Save the digital assessment before previewing its record.');return}
  const table=(headers,rows)=>`<table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(c=>`<tr>${c.map(v=>`<td>${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const missing=(p.trainingEvidence||[]).filter(x=>!x.signoffId);
  const html=`<style>@page{size:letter;margin:.58in}body{font:10pt Arial,sans-serif;color:#171717}h1,h2{color:#c8102e}h2{break-before:page;padding-top:8px}table{width:100%;border-collapse:collapse;font-size:9pt}th,td{border:1px solid #999;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eee}tr{break-inside:avoid}.summary{border-left:4px solid #c8102e;padding:8px;background:#f8f5f3;margin:10px 0;white-space:pre-wrap}</style><h1>Digital Promotion Assessment</h1><p>PWADC Security · ${esc(p.employee?.name||'')} · ${esc(p.tier?.replace('-',' → ')||'')} · Packet ${esc(p.id)}</p><p>Issued ${esc(promotionLocalDate(p.issuedAt))} · Assessment last saved ${esc(promotionLocalDate(a.updatedAt))} · Evaluator ID ${esc(a.updatedBy||'')}</p><h2>Checklist evidence</h2>${table(['Standard','Result','Evidence / source'],(p.checklist||[]).map(x=>[x.id+' · '+x.text,a.checklist?.[x.id]?.status||'',a.checklist?.[x.id]?.evidence||'']))}<h2>Evidence gates</h2>${table(['Gate','Result / method / date','Case or source / evidence'],promotionGateNamesFor(p.tier).map((x,i)=>{const r=a.gates?.[String(i+1)]||{};return [String(i+1)+' · '+x,[r.status,r.method,r.date].filter(Boolean).join(' · '),[r.caseRef,r.evidence].filter(Boolean).join('\n')]}))}<h2>Practical evaluations</h2>${table(['Exercise','Method / date / result','Case and evaluator evidence'],Object.values(promotionDigitalExerciseIds[p.tier]||{}).flat().map(id=>{const r=a.practicals?.[id]||{};return [id+' · '+(promotionGateExercises[id]?.title||''),[r.method,r.date,r.shift,r.result,r.managerReviewed?'Manager reviewed':''].filter(Boolean).join(' · '),[r.caseRef,r.evidence].filter(Boolean).join('\n')]}))}${missing.length?`<h2>Missing training at issue</h2>${table(['Requirement','Resolution / source'],missing.map(x=>[x.requirement,(a.training?.[x.assignmentId]?.resolved?'Verified · ':'Open · ')+(a.training?.[x.assignmentId]?.reference||'')]))}`:''}<h2>Six oral scenarios</h2>${(p.scenarios||[]).map((x,i)=>{const r=a.scenarios?.[x.id]||{};return `<h3>${i+1}. ${esc(x.title||x.id)}</h3><p><b>Issued prompt:</b> ${esc(x.prompt||'')}</p><p><b>Grade:</b> ${esc(r.grade||'Not graded')} · Critical failure: ${r.critical?'Yes':'No'}</p><div class="summary">${esc(r.response||'No response recorded')}</div><p><b>Follow-up / coaching:</b> ${esc(r.followUp||'')}</p>`}).join('')}<h2>Supervisor and Manager determination</h2><p><b>Supervisor:</b> ${esc(p.review?.reviewerName||'Pending')} · ${esc(p.review?.recommendation||'')} · ${esc(promotionLocalDate(p.review?.reviewedAt))}</p><div class="summary">${esc(p.review?.notes||'')}</div><p><b>Security Manager:</b> ${esc(p.decision?.managerName||'Pending')} · ${esc(p.decision?.result||'')} · ${esc(promotionLocalDate(p.decision?.decidedAt))}</p><div class="summary">${esc(p.decision?.notes||'')}</div>${p.tier==='T3-T4'?`<p><b>Manager interview:</b> ${esc(p.decision?.interviewDate||'Pending')} · ${esc(p.decision?.interviewOutcome||'')}</p><div class="summary">${esc(p.decision?.interviewNotes||'')}</div>`:''}<p>Controlled digital record · v5.2.0 · Verify original Training and personnel sources before final approval.</p>`;
  openReportWindow(html,false,'portrait');
}
