const {chromium}=require('playwright');
const Z=+(process.argv[2]||0.42);
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.addInitScript(z=>{window.__zoom=z;},Z);
 await pg.goto('file://'+process.cwd()+'/site/zoom.html');await pg.waitForTimeout(1200);
 await pg.screenshot({path:'menu_arena.png',clip:{x:0,y:0,width:1600,height:520}});
 await pg.click('.mapcard[data-v="col"]');await pg.click('.card[data-k="viktor"]');await pg.click('#startBtn');await pg.waitForTimeout(300);
 await pg.click('#prepAugs .aug >> nth=0');await pg.click('#readyBtn');
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,C=G.col,K=window.__COL;const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   T(60*4.3);o.stunT=999;p.x=K.cx;p.y=K.cy;o.x=K.portals[1].x;o.y=K.portals[1].y-200;
   window.__setCam&&window.__setCam(K.cx,K.cy);G.paused=true;document.getElementById('pause').hidden=true;
   return `R ${K.R} rbMax ${K.rbMax|0} rb@0 ${K.rb[0]|0} rb@90 ${K.rb[180]|0} rb@-45 ${K.rb[630]|0} rb@135 ${K.rb[270]|0} rb@225 ${K.rb[450]|0} rb@45 ${K.rb[90]|0}; portals ${K.portals.map(q=>Math.hypot(q.x-K.cx,q.y-K.cy)|0)}`;}));
 await pg.waitForTimeout(400);await pg.screenshot({path:'arena_over.png'});
 console.log('errors',errs);await b.close();})();
