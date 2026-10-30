const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;G.killsToWin=99;const p=G.player,o=G.bot,log=[];
   p.level=9;p.ranks.Q=3;G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;p.x=3000;p.y=650;o.x=3800;o.y=650;o.stunT=999;
   for(const [tx,lbl] of [[3200,'cursor 200 away'],[3450,'cursor 450 away'],[4200,'cursor 1200 away']]){p.axes.Q={state:'hand',readyAt:0};p.cds.Q=0;
     window.__tc(p,'Q',tx,650);for(let i=0;i<60;i++)R.tick(1/60);log.push(lbl+' -> landed '+((p.axes.Q.x-3000)|0)+' away');}
   // lifesteal at 100 Corruption
   p.res=100;p.corrT=G.t;p.hp=300;o.stunT=999;o.x=3100;o.hp=o.maxHp=3000;const h0=p.hp,e0=o.hp;
   const d=window.__riftline.G;window.__tc;p.cds.RMB=0;
   // direct damage through the engine
   return log.join('\\n');}));
 console.log('errors',errs);await b.close();})();
