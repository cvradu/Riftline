const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.addInitScript(()=>{try{localStorage.setItem('riftline.settings',JSON.stringify({scheme:'classic',cursor:'hand',amove:'click',sens:100,cam:100}));}catch(e){}});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.click('.card >> nth=2');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(500);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,log=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   T(30);log.push(`start fury ${p.res.toFixed(1)}`);
   G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;p.x=3000;p.y=650;o.x=3450;o.y=650;o.stunT=999;o.hp=o.maxHp=4000;p.ranks.Q=1;
   window.__tc(p,'Q',3450,650);T(30);const f0=p.res;p.order={kind:'attack',t:o};T(60*3);log.push(`revolver 3s on bounty: fury ${f0|0} -> ${p.res|0}, dmg ${(4000-o.hp)|0}`);
   // stolen hide: Cora's basic attack from the front
   p.ranks.RMB=1;p.order=null;o.stunT=0;o.x=p.x+120;window.__tc(p,'RMB',o.x,o.y);const f1=p.res;T(90);log.push(`hide up while Cora attacks: fury ${f1|0} -> ${p.res|0}`);
   return log.join('\n');}));
 // screenshots: human shooting, then uncaged
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;o.stunT=999;o.x=p.x+380;o.y=p.y-60;p.order={kind:'attack',t:o};for(let i=0;i<20;i++)R.tick(1/60);G.paused=true;document.getElementById('pause').hidden=true;});
 await pg.waitForTimeout(500);await pg.screenshot({path:'vik1.png'});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.paused=false;p.res=100;p.ranks.R=1;p.cds.R=0;p.order=null;window.__tc(p,'R',0,0);for(let i=0;i<50;i++)R.tick(1/60);o.x=p.x+150;p.order={kind:'attack',t:o};for(let i=0;i<20;i++)R.tick(1/60);G.paused=true;document.getElementById('pause').hidden=true;});
 await pg.waitForTimeout(500);await pg.screenshot({path:'vik2.png'});
 console.log('errors',errs);await b.close();})();
