const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="mantis"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="col"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(2500);
 console.log(await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,o=G.bot,C=window.__COL;G.col.state='fight';o.stunT=99;o.x=C.cx+600;o.y=C.cy+400;
   p.ranks.E=2;p.cds.E=0;p.isBot=true;p.pvCtl=c=>{c.input.mx=c.input.my=0;c.input.attack=false;};p.x=C.cx-250;p.y=C.cy;
   const ok=window.__tc(p,'E',p.x+500,p.y);const log=[`cast ${ok}`];
   for(let i=0;i<24;i++){window.__riftline.tick(1/60);const k=p.anchor;if(i%3===0)log.push(`${i}: copy at +${Math.round(k.x-p.x)} recast ${G.t>=k.land+0.05}`);}
   const ok2=window.__tc(p,'E',0,0);return log.join(' | ')+` | recast ${ok2} mantis now +${Math.round(p.x-(C.cx-250))}`;}));
 await pg.screenshot({path:'marty7/mantis_copy.png'});
 console.log('errors',errs);await b.close();})();
