const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;
   p.level=6;p.crit=0;for(const k of ['Q','RMB','E','R','SPACE'])p.cds[k]=1e9;p.chg.E=0;G.autoPlayer=true;
   p.x=2500;p.y=650;o.x=2850;o.y=650;o.stunT=1e9;o.hp=o.maxHp=5000;o.res=0;
   const log=[];let last=o.hp;
   for(let i=0;i<150;i++){R.tick(1/60);if(o.hp<last){log.push(`${(last-o.hp).toFixed(1)}@${i}`);last=o.hp;}if(i===70)p.loaded=true;}
   out.push(`autos: ${log.join(', ')} | ad ${p.ad.toFixed(1)} armor mult ${(100/(100+o.armor)).toFixed(3)} loaded bonus ${(15+7*6+0.45*p.ad).toFixed(1)}`);
   // last-hit xp: player kill vs tower kill
   G.nextWave=G.t;for(let i=0;i<120;i++)R.tick(1/60);const en=G.minions.filter(m=>m.team!==p.team&&m.alive);
   en.forEach(m=>{m.x=p.x+200;m.y=p.y;});const xp0=p.xp,lv0=p.level;window.__K(en[0],p);const own=p.xp-xp0;const xp1=p.xp;window.__K(en[1],G.towers[0]);const by=p.xp-xp1;
   out.push(`last hit xp ${own.toFixed(1)} vs nearby death ${by.toFixed(1)} (minion ${en[0].mtype} ${en[0].xp}/${en[1].mtype} ${en[1].xp}, lvl ${lv0}->${p.level})`);
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
