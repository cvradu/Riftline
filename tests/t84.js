const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="viktor"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.x=1200;p.y=650;o.x=1650;o.y=650;o.stunT=1e9;G.autoPlayer=false;
   p.ranks.R=1;p.res=80;p.cds.R=0;const h0=o.hp;out.push(`cast from ${p.x|0} at Cora ${o.x|0} hp ${o.hp|0} alive ${o.alive}: ${window.__tc(p,'R',o.x,o.y)}`);
   for(let i=0;i<50;i++){T(1);if(i%5===0||!p.dash&&!p.cast)out.push(`t${i} p ${p.x|0} cast ${!!p.cast} dash ${p.dash?p.dash.kind+' '+p.dash.t.toFixed(2):'-'} form ${p.form} | cora ${o.x|0} hp ${o.hp|0}`);if(!p.dash&&!p.cast&&i>20)break;}
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
