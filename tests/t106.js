const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 const T=async(n,shot)=>{await pg.evaluate(n=>{for(let i=0;i<n;i++)window.__riftline.tick(1/60);},n);if(shot){await pg.waitForTimeout(200);await pg.screenshot({path:shot,clip:{x:240,y:80,width:820,height:520}});}};
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=6;p.ranks.Q=1;p.ranks.RMB=1;p.ranks.R=1;p.points=0;
   p.x=2500;p.y=650;o.x=2800;o.y=650;o.stunT=1e9;o.hp=o.maxHp=5000;for(let i=0;i<3;i++)R.tick(1/60);});
 await pg.waitForTimeout(500);
 const sp=await pg.evaluate(()=>{const o=window.__riftline.G.bot,q=window.__P(o.x,o.y);const cv=document.querySelector('canvas').getBoundingClientRect();return {x:q.x+cv.left,y:q.y+cv.top-30};});
 await pg.mouse.move(sp.x,sp.y);
 await pg.evaluate(()=>{const G=window.__riftline.G;window.__tc(G.player,'Q',G.bot.x,G.bot.y);});
 await T(14,'q1.png');await T(20,'q2.png');
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;p.cds.RMB=0;window.__tc(p,'RMB',p.x+250,p.y+120);});
 await T(8,'coin1.png');await T(22,'coin2.png');await T(10,'coin3.png');
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;for(let i=0;i<60;i++)window.__riftline.tick(1/60);p.cds.R=0;window.__tc(p,'R',G.bot.x,G.bot.y);});
 await T(10,'fl1.png');await T(11,'fl2.png');
 console.log('errors',errs);await b.close();})();
