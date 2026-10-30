const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.addInitScript(()=>{window.__zoom=0.5;});
 await pg.goto('file://'+process.cwd()+'/site/zoom.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="col"]');await pg.click('.card[data-k="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(300);
 await pg.click('#prepAugs .aug >> nth=0');await pg.click('#readyBtn');
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,C=G.col,COL2=window.__COL,log=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   T(60*4.3);o.stunT=999;
   // portal: too early, then after it opens
   const pl=COL2.portals[2];p.x=pl.x;p.y=pl.y;T(2);log.push(`portal at t=${C.t.toFixed(1)}: moved=${Math.hypot(p.x-pl.x,p.y-pl.y)>50}`);
   C.t=9;p.x=pl.x;p.y=pl.y;T(2);const dst=COL2.portals[3];log.push(`portal ready: now near opposite gate ${Math.hypot(p.x-dst.x,p.y-dst.y)|0} units, pair cooldown ${(C.portalReady[1]-C.t).toFixed(1)}s`);
   p.x=dst.x;p.y=dst.y;T(2);log.push(`stepping on the far pad during cooldown teleports: ${Math.hypot(p.x-dst.x,p.y-dst.y)>50}`);
   // control point
   C.t=21;p.x=COL2.cx+20;p.y=COL2.cy;o.x=COL2.cx+700;o.y=COL2.cy;T(60*2);log.push(`capturing: prog ${C.cp.prog.toFixed(1)} team ${C.cp.team}`);
   o.x=COL2.cx-40;o.stunT=999;T(30);log.push(`contested: ${C.cp.contested} prog ${C.cp.prog.toFixed(1)}`);
   o.x=COL2.cx+700;T(60*2.2);log.push(`after capture: event ${C.event&&C.event.kind} owner ${C.event&&C.event.owner.name} next open in ${(C.cp.openAt-C.t)|0}s`);
   // force each event and measure damage to the owner vs the other
   const run=(kind)=>{C.meteors=[];C.lava=[];C.quake=null;C.event=null;p.hp=p.maxHp;o.hp=o.maxHp;const fake=Math.random;Math.random=()=>({meteors:0.1,quake:0.5,lava:0.9})[kind];colEvent(p);Math.random=fake;
     if(kind==='lava'){for(const l of C.lava){}C.lava[0].x=o.x;C.lava[0].y=o.y;C.lava[1].x=p.x;C.lava[1].y=p.y;}
     if(kind==='meteors'){C.meteors.push({x:o.x,y:o.y,r:120,t0:G.t,t1:G.t+1,owner:p},{x:p.x,y:p.y,r:120,t0:G.t,t1:G.t+1,owner:p});}
     if(kind==='quake'){o.x=COL2.cx+5;o.y=COL2.cy+5;}
     T(60*3);return `${kind}: owner lost ${(p.maxHp-p.hp)|0}, other lost ${(o.maxHp-o.hp)|0}`;};
   log.push(run('meteors'));log.push(run('lava'));
   const r3=run('quake');const q=C.quake;log.push(r3+` | fissure open ${q&&q.open}`);
   // fissure blocks walking across
   if(q){p.x=COL2.cx+q.nx*200;p.y=COL2.cy+q.ny*200;p.order=null;for(let i=0;i<60;i++){p.x-=q.nx*12;p.y-=q.ny*12;colClamp(p,p.r);}log.push(`walked into the fissure: still on own side ${((p.x-COL2.cx)*q.nx+(p.y-COL2.cy)*q.ny)>0}`);}
   G.paused=true;document.getElementById('pause').hidden=true;return log.join('\n');}));
 await pg.waitForTimeout(500);await pg.screenshot({path:'events.png'});
 console.log('errors',errs);await b.close();})();
