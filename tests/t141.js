const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{window.__zoom=0.32;});
 await pg.goto('file://'+process.cwd()+'/site/zoom.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('#startBtn');await pg.waitForTimeout(800);
 await pg.evaluate(()=>{const G=window.__riftline.G;G.hitStop=1e9;const p=G.player;p.x=3200;p.y=650;for(const r of G.relics)r.active=true;});await pg.waitForTimeout(1200);
 await pg.screenshot({path:'lane2/g_zoom.png'});
 console.log('errors',errs);await b.close();})();
