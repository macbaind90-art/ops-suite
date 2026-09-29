'use strict';
const fs=require('fs'),vm=require('vm');
const read=path=>fs.readFileSync(path,'utf8');
const templates=JSON.parse(read('app/seed/promotion-packets-data.json')).templates;
const suite={PWADCModuleRegistry:{register(){}},window:{},esc:value=>String(value??'')};
vm.createContext(suite);
for(const path of ['app/js/74-promotion-packets.js','app/js/75-promotion-digital.js','app/js/76-promotion-portable.js'])vm.runInContext(read(path),suite);

class Element {
  constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.value='';this.checked=false;this.hidden=false;this.events={};this.textContent=''}
  appendChild(child){this.children.push(child);return child}
  remove(){}
  click(){if(this.onclick)this.onclick()}
  addEventListener(event,handler){this.events[event]=handler}
  querySelectorAll(selector){const matches=[];const visit=node=>{for(const child of node.children){if(selector==='[data-section]'&&child.dataset.section)matches.push(child);visit(child)}};visit(this);return matches}
}
function find(root,id){if(root.id===id)return root;for(const child of root.children){const match=find(child,id);if(match)return match}return null}
function flatten(root){return [root,...root.children.flatMap(flatten)]}

(async()=>{
  for(const template of templates){
    suite.sample={id:'portable-'+template.tier,tier:template.tier,issuedAt:'2026-09-29T10:00:00Z',
      employee:{name:'Candidate',eid:'100'},checklist:template.checklist,scenarios:template.scenarios.slice(0,6),trainingEvidence:[]};
    const html=vm.runInContext('promotionPortableHtml(sample)',suite);
    const packet=html.match(/<script id="packet-data" type="application\/json">([^<]+)<\/script>/)?.[1];
    const runtime=html.match(/<script>\(([\s\S]+)\)\(\);<\/script>/)?.[1];
    if(!packet||!runtime)throw Error('Offline packet is not self-contained');
    const nodes=Object.fromEntries(['identity','sections','status','packet-data','stepProgress','stepPicker','previous','next','save','resume','resumeFile'].map(id=>[id,new Element()]));
    for(const [id,node] of Object.entries(nodes))node.id=id;
    nodes['packet-data'].textContent=packet;
    const document={body:new Element('body'),createElement:tag=>new Element(tag),getElementById:id=>nodes[id]||find(nodes.sections,id)};
    let download;
    const context={document,window:{scrollTo(){}},Blob,Date,setTimeout:()=>{},URL:{createObjectURL:blob=>(download=blob,'blob:packet'),revokeObjectURL(){}},console};
    vm.createContext(context);vm.runInContext('('+runtime+')()',context);
    const cards=nodes.sections.children;
    if(cards.filter(x=>!x.hidden).length!==1||!cards[0].textContent&&cards[0].children[0].textContent!=='Start the evaluation')throw Error('Wizard did not start at introduction');
    nodes.next.click();if(cards.filter(x=>!x.hidden).length!==1||!cards[1].children[0].textContent.startsWith('Checklist'))throw Error('Next did not open the checklist');
    const scenarioIndex=nodes.stepPicker.children.findIndex(x=>x.textContent.includes('Oral Scenario 1 of 6'));
    nodes.stepPicker.value=String(scenarioIndex);nodes.stepPicker.onchange();
    if(!flatten(cards[scenarioIndex]).some(x=>x.textContent===suite.sample.scenarios[0].prompt))throw Error('Issued oral prompt is not shown on its step');
    if(!cards.filter(x=>x.children[0].textContent.startsWith('Practical ')).some(practical=>flatten(practical).some(x=>x.textContent.includes('Provided simulation · read to candidate'))))throw Error('Practical prompt is not shown on its step');
    for(const field of nodes.sections.querySelectorAll('[data-section]')){
      const {section,key,id}=field.dataset;let value='';
      if(key==='managerReviewed'){if(id==='T4-BASE1')field.checked=true;value=true}
      else if(key==='status')value=section==='checklist'?'Verified':'PASS';
      else if(key==='method')value='Records';
      else if(key==='result'||key==='grade')value='MEETS';
      else if(key==='date')value='2026-09-29';
      else if(key==='shift')value=id==='T4-BASE2'?'Night':'Day';
      else if(key==='caseRef')value='CASE-123';
      else if(key==='evidence'||key==='response'||key==='followUp')value='Observed, documented and verified by evaluator with source evidence.';
      if(value){if(key!=='managerReviewed')field.value=value;(field.events.change||field.events.input)()}
    }
    document.getElementById('evaluatorName').value='Supervisor One';
    document.getElementById('recommendation').value='Recommend';
    document.getElementById('notes').value='All issued standards were evaluated with supporting evidence.';
    nodes.stepPicker.value=String(cards.length-1);nodes.stepPicker.onchange();
    if(!cards.at(-1).children[0].textContent.includes('Review and return')||!nodes.stepProgress.textContent.includes('Oral 6/6'))throw Error('Final review or progress is missing');
    const firstOral=nodes.sections.querySelectorAll('[data-section]').find(x=>x.dataset.section==='scenarios'&&x.dataset.key==='response');
    const original=firstOral.value;firstOral.value='';firstOral.events.input();
    document.getElementById('submit').click();
    if(nodes.stepPicker.value===String(cards.length-1)||!nodes.status.textContent.includes('oral scenario'))throw Error('Incomplete response did not return to the relevant question');
    firstOral.value=original;firstOral.events.input();
    nodes.stepPicker.value=String(cards.length-1);nodes.stepPicker.onchange();
    document.getElementById('submit').click();
    if(!download)throw Error('Completed evaluation did not download for '+template.tier+': '+nodes.status.textContent);
    const exported=JSON.parse(await download.text());
    if(!exported.completed||exported.scenarioIds.length!==6||exported.assessment.scenarios[template.scenarios[0].id].grade!=='MEETS')throw Error('Completed export omitted issued scenario evidence');
    const first=firstOral;first.value='Changed after export';first.events.input();
    nodes.resumeFile.files=[{text:async()=>JSON.stringify(exported)}];
    await nodes.resumeFile.onchange({target:nodes.resumeFile});
    if(first.value==='Changed after export'||nodes.stepPicker.value!==String(cards.length-1))throw Error('Resume did not restore answers and step');
  }
  console.log('Portable promotion wizard validation PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
