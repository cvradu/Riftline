const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="mantis"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="lane"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(2500);
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,o=G.bot,C=window.__COL;o.stunT=99;o.x=p.x+1500;
   p.ranks.E=2;p.cds.E=0;p.isBot=true;p.pvCtl=c=>{c.input.mx=c.input.my=0;c.input.attack=false;};window.__tc(p,'E',p.x+500,p.y);});
 await pg.waitForTimeout(110);await pg.screenshot({path:'marty7/mc1.png'});await pg.waitForTimeout(400);await pg.screenshot({path:'marty7/mc2.png'});

 console.log('errors',errs);await b.close();})();
