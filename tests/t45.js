const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.addInitScript(()=>{try{localStorage.setItem('riftline.settings',JSON.stringify({scheme:'classic',cursor:'hand',amove:'click',sens:100,cam:100}));}catch(e){}});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('#optMap button[data-v="col"]');await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(300);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,log=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   T(60*4.2);const pl=G.col.plants[2];G.col.t=20;T(1);o.stunT=99;o.x=window.__COL.cx+500;o.y=window.__COL.cy-500;
   p.x=pl.x-150;p.y=pl.y-60;p.hp=Math.round(p.maxHp*0.5);p.order={kind:'attack',t:pl};
   for(let i=0;i<120&&pl.alive;i++)T(1);log.push('plant broken '+!pl.alive+' beads '+G.col.beads.length+' regrows at '+pl.ripeAt);
   const hp0=p.hp,bd=G.col.beads[0];T(30);p.order={kind:'move',x:bd.x,y:bd.y,best:1e9,stall:0};for(let i=0;i<120&&G.col.beads.includes(bd);i++)T(1);
   log.push('bead picked '+!G.col.beads.includes(bd)+', healed '+(p.hp-hp0|0)+' (40 + 6% of '+p.maxHp+')');
   // storm: jump the clock, stand outside, take damage
   G.col.t=70;T(2);const r=G.col.storm.r;p.order=null;p.x=window.__COL.cx-r*0.72-60;p.y=window.__COL.cy-r*0.72-60;const h1=p.hp;T(61);log.push('storm r '+(r|0)+', storm damage over 1s outside: '+(h1-p.hp|0));
   G.paused=true;document.getElementById('pause').hidden=true;return log.join('\n');}));
 await pg.waitForTimeout(700);await pg.screenshot({path:'storm.png'});
 console.log('errors',errs);await b.close();})();
