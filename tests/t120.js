const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="marty"]').click();document.querySelector('#optFoe button[data-v="viktor"]').click();
   document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;G.autoPlayer=true;G.xpRate=2;G.killsToWin=99;
   const m=G.player,o=G.bot;const log=[];let stuck=0;const h=[];const modes={};
   for(let i=0;i<60*240;i++){R.tick(1/60);modes[m.mode]=(modes[m.mode]||0)+1/60;
     const want=m.alive&&!m.cast&&!m.dash&&(Math.abs(m.input.mx)+Math.abs(m.input.my))>0.5;h.push(want?[m.x,m.y]:null);if(h.length>60)h.shift();
     if(h.length===60&&h.every(Boolean)&&Math.hypot(h[59][0]-h[0][0],h[59][1]-h[0][1])<25){stuck+=1/60;if(i%120===0)log.push(`stuck t${G.t|0} at ${m.x|0},${m.y|0} mode ${m.mode} goal-dir ${m.input.mx.toFixed(2)},${m.input.my.toFixed(2)} nav ${JSON.stringify(m.nav)}`);}
     if(i%(60*20)===0)log.push(`t${G.t|0} pos ${m.x|0},${m.y|0} hp ${(m.hp/m.maxHp).toFixed(2)} mode ${m.mode} alive ${m.alive} drop ${!!m.drop} dash ${m.dash?m.dash.kind:'-'} cast ${!!m.cast} | foe ${o.x|0},${o.y|0}`);}
   for(const k in modes)modes[k]=modes[k]|0;
   return `stuck ${stuck.toFixed(1)}s modes ${JSON.stringify(modes)} score ${G.score.join('-')}\n`+log.slice(0,30).join('\n');}));
 console.log('errors',errs);await b.close();})();
