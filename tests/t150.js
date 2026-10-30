const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 for(const [map,foe] of [['lane','cora'],['col','blackjack'],['lane','viktor'],['col','shade']])
 console.log(await pg.evaluate(([map,foe])=>{const R=window.__riftline;document.querySelector('.card[data-k="mantis"]').click();document.querySelector(`#optFoe button[data-v="${foe}"]`).click();
   document.querySelector(`.mapcard[data-v="${map}"]`).click();R.newGame();const G=R.G;G.autoPlayer=true;G.xpRate=2;G.killsToWin=99;
   const m=G.player;const st={Q:0,E:0,RMB:0,R:0,stealthS:0,anchors:0,recasts:0,grips:0,cuts:0};let pa=null;const cd0={};
   for(let i=0;i<60*150;i++){for(const k of ['Q','E','RMB','R'])cd0[k]=m.cds[k];R.tick(1/60);for(const k of ['Q','E','RMB','R'])if(m.cds[k]>cd0[k]+0.5)st[k]++;
     if(m.stealthT>0)st.stealthS+=1/60;if(m.anchor&&m.anchor!==pa)st.anchors++;if(!m.anchor&&pa&&m.mtSpinT>G.t-0.05)st.recasts++;pa=m.anchor;if(m.mtCutT>G.t-1/60)st.cuts++;if(G.over)break;}
   return `${map} vs ${foe}: casts ${JSON.stringify(st)} | score ${G.score.join('-')} | mantis L${m.level} hp ${m.hp|0}/${m.maxHp|0}`;},[map,foe]));
 console.log('errors',errs.slice(0,5));await b.close();})();
