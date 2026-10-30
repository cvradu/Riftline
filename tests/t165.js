const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="mantis"]').click();document.querySelector('#optFoe button[data-v="marty"]').click();
   document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const m=G.player,o=G.bot;const log=[];let lastHp=m.hp,lastOhp=o.hp,atks=0,la=null;const st={charge:0,stealth:0,cast:0,stun:0};
   for(let i=0;i<60*40;i++){R.tick(1/60);if(m.atk&&m.atk!==la){atks++;la=m.atk;}if(m.mq)st.charge+=1/60;if(m.stealthT>0)st.stealth+=1/60;if(m.cast)st.cast+=1/60;if(m.stunT>0)st.stun+=1/60;
     if(G.col.state==='fight'&&i%20===0)log.push(`t${G.t.toFixed(1)} d${Math.hypot(m.x-o.x,m.y-o.y)|0} mode ${m.mode} mhp ${m.hp|0} ohp ${o.hp|0} mq ${m.mq?((G.t-m.mq.t0).toFixed(2)):'-'} qUp ${m.qUp} st ${m.stealthT>0?1:0} anc ${m.anchor?1:0} cds Q${m.cds.Q.toFixed(1)} E${m.cds.E.toFixed(1)} R${m.cds.R.toFixed(1)} ranks ${JSON.stringify(m.ranks)} atkCd ${m.atkCd.toFixed(2)} inpAtk ${m.input.attack}`);
     if(G.col.state==='over')break;}
   return `attacks ${atks} ${JSON.stringify(st)}\n`+log.slice(0,60).join('\n');}));
 console.log('errors',errs);await b.close();})();
