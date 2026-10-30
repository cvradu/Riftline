const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 for(const [me,foe,map] of [['cora','marty','lane'],['cora','shade','col'],['marty','cora','col'],['marty','viktor','lane']]){
  console.log(await pg.evaluate(([me,foe,map])=>{const Rr=window.__riftline;document.querySelector(`.card[data-k="${me}"]`).click();document.querySelector(`#optFoe button[data-v="${foe}"]`).click();
    document.querySelector(`.mapcard[data-v="${map}"]`).click();Rr.newGame();const G=Rr.G;G.autoPlayer=true;const p=G.player;let e=0,toAxe=0,taps=0,grabs=0,lastE=0,lastQ=null;
    for(let t=0;t<60*120;t++){const cdE=p.cds.E;Rr.tick(1/60);if(p.cds.E>cdE+1){e++;if(p.dash&&p.dash.claim==='Q')toAxe++;}
      if(p.mfQ&&p.mfQ!==lastQ){lastQ=p.mfQ;if(p.mfQ.full)grabs++;else taps++;}if(G.col&&G.col.state==='over')break;}
    return `${me} vs ${foe} on ${map}: E casts ${e} (to axe ${toAxe}) Q taps/partials ${taps} full-reach ${grabs} | lvl ${p.level}`;},[me,foe,map]));}
 console.log('errors',errs);await b.close();})();
