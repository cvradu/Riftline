const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);await pg.mouse.move(150,350);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};const tc=window.__tc;
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.ranks.E=1;
   p.x=2600;p.y=650;o.x=2760;o.y=650;o.stunT=1e9;p.cds.E=0;p.chg.E=2;const h0=o.hp;
   out.push(`through Cora: ${tc(p,'E',2860,650)}`);T(20);out.push(`  ended at ${p.x|0}, charges ${p.chg.E} (2 = refunded), trails ${G.trails.length}`);
   const h1=o.hp;T(60*3.2);out.push(`  Cora standing in the trail: took ${(h0-o.hp)|0} total, trail gone ${G.trails.length===0}`);
   p.x=2600;p.y=650;o.x=2760;o.y=900;p.cds.E=0;p.chg.E=2;out.push(`past Cora (not through): ${tc(p,'E',2860,650)}`);T(20);out.push(`  charges ${p.chg.E} (1 = no refund)`);
   return out.join('\n');}));
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;for(let i=0;i<200;i++)R.tick(1/60);p.x=2500;p.y=700;p.cds.E=0;p.chg.E=2;o.x=2650;o.y=640;window.__tc(p,'E',2760,600);for(let i=0;i<14;i++)R.tick(1/60);window.__tc(p,'E',2700,420);for(let i=0;i<20;i++)R.tick(1/60);});
 await pg.waitForTimeout(400);await pg.screenshot({path:'bj_trail.png',clip:{x:330,y:140,width:700,height:460}});
 console.log('errors',errs);await b.close();})();
