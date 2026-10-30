const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=6;p.ranks.Q=1;p.ranks.RMB=1;p.ranks.R=1;p.points=0;p.crit=0;
   p.x=2500;p.y=650;o.x=2900;o.y=650;o.stunT=1e9;o.hp=o.maxHp=5000;o.res=0;for(let i=0;i<3;i++)R.tick(1/60);});
 await pg.waitForTimeout(500);
 const sp=await pg.evaluate(()=>{const o=window.__riftline.G.bot,q=window.__P(o.x,o.y);const cv=document.querySelector('canvas').getBoundingClientRect();return {x:q.x+cv.left,y:q.y+cv.top-30};});
 await pg.mouse.move(sp.x,sp.y);await pg.waitForTimeout(100);
 const shots=[];
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];
   const log=[];const h0=o.hp;let last=o.hp;p.cds.Q=0;out.push('Q '+window.__tc(p,'Q',o.x,o.y));const seen=new Set();
   for(let i=0;i<90;i++){R.tick(1/60);if(o.hp<last){log.push((last-o.hp).toFixed(1));last=o.hp;}for(const q of G.projs)seen.add(q.kind);}
   out.push(`  hits ${log.join(', ')} | total ${(h0-o.hp).toFixed(1)} | kinds ${[...seen]} | loaded ${p.loaded}`);
   p.loaded=false;o.hp=5000;last=5000;log.length=0;p.atkCd=0;p.cds.Q=1e9;
   for(let i=0;i<70;i++){R.tick(1/60);if(o.hp<last){log.push(`${(last-o.hp).toFixed(1)}@${i}`);last=o.hp;}}
   out.push(`  autos (attack-move) hits ${log.join(', ')}, ad ${p.ad.toFixed(1)}`);
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
