/* PWADC Security Operations Suite v5.5.0 | startup gate */
(function(){
  const expected=['bootstrap','data-core','shell-audits','reports-governance','data-health-recovery','workflows-home','roster-schedule','training-uniforms','training-replacement','promotion-packets','attendance','shift-operations','settings'];
  const result=PWADCModuleRegistry.validate(expected);
  if(!result.ok){
    const detail='Missing front-end module(s): '+result.missing.join(', ');
    console.error(detail,result);
    if(typeof showStartupError==='function') showStartupError(new Error(detail),'Module load validation failed');
    return;
  }
  init();
})();
