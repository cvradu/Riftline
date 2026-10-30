const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=9;p.ranks={Q:1,E:3,RMB:1,R:1};o.stunT=1e9;o.hp=o.maxHp=9000;
   p.x=2500;p.y=650;o.x=2950;o.y=500;const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   // four trails in different directions around him
   const add=(x0,y0,x1,y1)=>G.trails.push({x0,y0,x1,y1,src:p,r:3,until:G.t+3,next:G.t+0.1,t0:G.t-0.5});
   add(2250,800,2500,800);add(2300,450,2480,250);add(2650,850,2850,700);add(2700,350,2700,600);T(2);});
 await pg.waitForTimeout(400);await pg.screenshot({path:'trail1.png',clip:{x:200,y:60,width:880,height:560}});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;for(let i=0;i<60;i++)R.tick(1/60);G.trails=[];p.jetLock=0;p.chg.E=2;p.cds.E=0;p.x=2400;p.y=650;o.x=2800;o.y=650;
   window.__tc(p,'E',2650,560);for(let i=0;i<16;i++)R.tick(1/60);window.__tc(p,'E',2700,820);for(let i=0;i<16;i++)R.tick(1/60);});
 await pg.waitForTimeout(400);await pg.screenshot({path:'trail2.png',clip:{x:200,y:60,width:880,height:560}});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;for(let i=0;i<200;i++)R.tick(1/60);p.cds.R=0;p.x=2400;p.y=650;o.x=2950;o.y=650;window.__tc(p,'R',o.x,o.y);for(let i=0;i<40;i++)R.tick(1/60);});
 await pg.waitForTimeout(400);await pg.screenshot({path:'stream.png',clip:{x:200,y:60,width:880,height:560}});
 console.log('errors',errs);await b.close();})();
