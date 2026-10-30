const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(200);
 // play as Cora against a Mantis bot to see the copy as the enemy does
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="cora"]');await pg.click('#optFoe button[data-v="mantis"]');await pg.click('#startBtn');await pg.waitForTimeout(700);await pg.mouse.move(900,300);
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,m=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;m.level=9;m.ranks={Q:1,E:1,RMB:1,R:1};m.isBot=true;m.pvCtl=c=>{};
   p.x=2500;p.y=650;m.x=2800;m.y=750;p.stunT=1e9;window.__tc(m,'RMB',0,0);window.__tc(m,'E',2700,520);for(let i=0;i<20;i++)R.tick(1/60);});
 await pg.waitForTimeout(400);await pg.screenshot({path:'mantis/enemyview.png',clip:{x:330,y:150,width:620,height:430}});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,m=G.bot;window.__tc(m,'E',0,0);for(let i=0;i<8;i++)R.tick(1/60);});await pg.waitForTimeout(300);await pg.screenshot({path:'mantis/spin.png',clip:{x:330,y:150,width:620,height:430}});
 console.log('errors',errs);await b.close();})();
