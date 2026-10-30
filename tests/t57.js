const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1400);
 await pg.click('.card[data-k="viktor"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,log=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   p.ranks.RMB=1;G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;p.x=3000;p.y=650;o.x=3180;o.y=650;o.stunT=0;o.hp=o.maxHp=3000;
   o.cast=null;o.recall={start:G.t,until:G.t+8};
   const r=window.__tc(p,'RMB',o.x,o.y);T(20);
   log.push(`Kickback ${r}: Viktor ${3000}->${p.x|0} (facing ${p.facing.toFixed(2)}), Cora 3180->${o.x|0}, gap ${Math.hypot(o.x-p.x,o.y-p.y)|0}, dmg ${(3000-o.hp)|0}, fury ${p.res|0}, Cora recall interrupted ${!o.recall}`);
   return log.join('\n');}));
 // screenshot mid-recoil
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;p.cds.RMB=0;o.x=p.x+170;o.y=p.y;o.stunT=1;window.__tc(p,'RMB',o.x,o.y);for(let i=0;i<4;i++)R.tick(1/60);G.paused=true;document.getElementById('pause').hidden=true;});
 await pg.waitForTimeout(400);await pg.screenshot({path:'kick.png',clip:{x:400,y:200,width:650,height:420}});
 console.log('errors',errs);await b.close();})();
