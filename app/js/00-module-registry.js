/* PWADC Security Operations Suite v3.3.0.8 | front-end module registry */
(function(global){
  const state={loaded:[],loadedAt:{}};
  global.PWADCModuleRegistry={
    register(name){
      if(!name||state.loaded.includes(name)) return;
      state.loaded.push(name);
      state.loadedAt[name]=new Date().toISOString();
    },
    status(){return {loaded:[...state.loaded],loadedAt:{...state.loadedAt}};},
    validate(expected){
      const missing=expected.filter(name=>!state.loaded.includes(name));
      const unexpected=state.loaded.filter(name=>!expected.includes(name));
      return {ok:missing.length===0,missing,unexpected,loaded:[...state.loaded]};
    }
  };
})(window);
