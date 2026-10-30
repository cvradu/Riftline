const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1000);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="viktor"]');await pg.click('#optFoe button[data-v="shade"]');await pg.click('#startBtn');await pg.waitForTimeout(500);await pg.mouse.move(150,350);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};const tc=window.__tc;
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.x=2600;p.y=650;o.x=3100;o.y=650;o.stunT=1e9;p.ranks.R=1;
   p.res=100;T(2);out.push(`at 100 Fury: ${p.form}, R ${tc(p,'R',o.x,o.y)} right after (cd ${p.cds.R.toFixed(1)}s)`);T(95);
   const h0=o.hp;out.push(`R in beast form 1.6s later: ${tc(p,'R',o.x,o.y)}`);for(let i=0;i<60&&(p.cast||p.dash);i++)T(1);T(1);
   out.push(`  landed ${Math.round(Math.hypot(p.x-o.x,p.y-o.y))} from Shade, dealt ${(h0-o.hp)|0}, still ${p.form}, R cd ${p.cds.R.toFixed(1)}s, again now: ${tc(p,'R',o.x,o.y)}`);
   T(60*6.2);out.push(`  6s later: ${tc(p,'R',o.x,o.y)}`);for(let i=0;i<60&&(p.cast||p.dash);i++)T(1);
   return out.join('\n');}));
 // pictures: human at 95 Fury (flashing), and the monster next to the man-sized Shade
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;while(p.form==='monster')R.tick(1/60);p.x=2600;p.y=650;o.x=2800;o.y=600;p.res=97;p.furyT=G.t;});
 for(let i=0;i<3;i++){await pg.waitForTimeout(110);await pg.screenshot({path:`warn${i}.png`,clip:{x:440,y:220,width:420,height:320}});}
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;p.res=100;R.tick(1/60);R.tick(1/60);});await pg.waitForTimeout(300);await pg.screenshot({path:'beast.png',clip:{x:440,y:180,width:420,height:360}});
 console.log('errors',errs);await b.close();})();
