const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="col"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(2500);
 console.log(await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,o=G.bot,C=window.__COL;G.col.state='fight';
     p.hp=p.maxHp=99999;o.hp=o.maxHp=99999;o.stunT=99;p.ranks.Q=3;p.cds.Q=0;p.mq=null;p.cast=null;p.dash=null;
     p.x=C.cx-75;p.y=C.cy;o.x=C.cx+75;o.y=C.cy;
     const ok=window.__tc(p,'Q',o.x,o.y);const log=[`tc ${ok} why ${p.failWhy} mq ${!!p.mq} pend ${JSON.stringify(p.pend||null)}`];
     for(let i=0;i<40;i++){p.aimX=o.x;p.aimY=o.y;p.input.ax=o.x;p.input.ay=o.y;window.__riftline.tick(1/60);if(i===3)p.qUp=true;if(i%4===0)log.push(`${i}: mq ${!!p.mq} qUp ${p.qUp} cast ${p.cast?p.cast.t.toFixed(2):'-'} mfQ ${!!p.mfQ} hp ${o.hp|0} ang ${p.mfQ?p.mfQ.ang.toFixed(2):"-"} fx ${G.fx.filter(f=>f.k==="piston"||f.k==="mfspr").map(f=>f.k+(f.strip??"")).join(",")} ohit ${o.alive} ${o.untargetT} gap ${Math.hypot(o.x-p.x,o.y-p.y)|0}`);}
     return log.join('\n');}));
 console.log('errors',errs);await b.close();})();
