const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.addInitScript(()=>{window.__exposeCol=true;});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('#optMap button[data-v="col"]');await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(300);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,log=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   T(60*4.2);log.push('state '+G.col.state);
   const B=window.__COL.bushes[0];p.x=B.x-40;p.y=B.y;o.x=B.x-700;o.y=B.y;o.stunT=1;T(2);
   log.push('player in bush '+p.bush+' hidden '+p.hidden+' | bot sees player: '+(p.alive&&!p.hidden));
   o.x=B.x-150;o.y=B.y;T(1);log.push('bot within 170: hidden '+p.hidden);
   o.x=B.x-700;T(1);p.revealT=0;T(1);log.push('bot far again: hidden '+p.hidden);
   // plant: ripen, break it with a basic attack, collect a bead
   const pl=G.col.plants[2];G.col.t=20;T(1);log.push('plant ripe '+pl.alive);o.stunT=99;o.x=window.__COL.cx+600;o.y=window.__COL.cy-600;
   p.x=pl.x-90;p.y=pl.y;p.hp=p.maxHp*0.5;p.input.attack=true;p.input.attackTarget=pl;
   window.__forceAttack=true;
   return log.join('\n');}));
 console.log('errors',errs);await b.close();})();
