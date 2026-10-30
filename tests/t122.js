const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="blackjack"]');await pg.click('#startBtn');await pg.waitForTimeout(600);await pg.mouse.move(1000,300);
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=9;p.ranks={Q:1,E:1,RMB:1,R:1};
   p.x=2300;p.y=650;o.x=3200;o.y=600;o.stunT=1e9;window.__tc(p,'E',3200,600);for(let i=0;i<18;i++)R.tick(1/60);});
 await pg.waitForTimeout(350);await pg.screenshot({path:'ghost.png',clip:{x:200,y:100,width:880,height:480}});
 console.log('errors',errs);await b.close();})();
