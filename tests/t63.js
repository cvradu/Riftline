const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1300);
 await pg.click('.card[data-k="viktor"]');await pg.click('#optFoe button[data-v="shade"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   p.ranks.Q=1;G.nextWave=1e9;G.spawnQ.length=0;G.minions.length=0;p.x=3000;p.y=650;o.x=3700;o.y=700;o.stunT=999;o.hp=o.maxHp=3000;
   // three minions in a line in front, slightly off-axis, then the champion behind them
   for(const [x,y] of [[3250,690],[3400,600],[3550,640]]){const m=makeMinion('melee',1,0);m.x=x;m.y=y;m.laneY=y;m.stunT=999;G.minions.push(m);}
   const hp=G.minions.map(m=>m.hp);window.__tc(p,'Q',3700,650);T(21);
   G.paused=true;document.getElementById('pause').hidden=true;return null;}));
 await pg.waitForTimeout(300);await pg.screenshot({path:'slug.png',clip:{x:450,y:200,width:700,height:420}});
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.paused=false;for(let i=0;i<30;i++)R.tick(1/60);
   return `minions hit: ${G.minions.filter(m=>m.hp<m.maxHp||!m.alive).length}/3, champion dmg ${(3000-o.hp)|0}, bounty ${!!(p.bounty&&p.bounty.t===o)}`;}));
 console.log('errors',errs);await b.close();})();
