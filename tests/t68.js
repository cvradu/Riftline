const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="col"]');await pg.click('.card[data-k="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(300);
 await pg.click('#prepAugs .aug >> nth=0');await pg.click('#readyBtn');
 const shot=async(name,fn)=>{console.log(await pg.evaluate(fn));await pg.waitForTimeout(350);await pg.screenshot({path:name});};
 await shot('ar1.png',()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,C=G.col,K=window.__COL;const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   G.autoPlayer=false;T(60*4.3);o.stunT=999;C.t=21;T(30);
   const pl=K.plantSpots[0];p.x=pl.x-60;p.y=pl.y+90;o.x=K.gardens[0].x;o.y=K.gardens[0].y-30;document.getElementById('banner').hidden=true;
   G.paused=true;document.getElementById('pause').hidden=true;return `plants ${C.plants.map(q=>q.alive)} portal ready ${C.portalReady} bot bush ${o.bush} hidden ${o.hidden}`;});
 await shot('ar2.png',()=>{const R=window.__riftline,G=R.G,p=G.player,K=window.__COL;G.paused=false;const q=K.portals[3];p.x=q.x-150;p.y=q.y+40;
   for(let i=0;i<20;i++)R.tick(1/60);G.paused=true;document.getElementById('pause').hidden=true;return 'right fountain';});
 await shot('ar3.png',()=>{const R=window.__riftline,G=R.G,p=G.player,K=window.__COL;G.paused=false;const q=K.portals[1];p.x=q.x-140;p.y=q.y-140;
   for(let i=0;i<20;i++)R.tick(1/60);G.paused=true;document.getElementById('pause').hidden=true;return 'bottom gate';});
 console.log('errors',errs);await b.close();})();
