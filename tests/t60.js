const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.addInitScript(()=>{window.__zoom=0.42;});
 await pg.goto('file://'+process.cwd()+'/site/zoom.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="col"]');await pg.click('.card[data-k="viktor"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
 await pg.click('#prepAugs .aug >> nth=0');await pg.click('#readyBtn');
 await pg.keyboard.press('KeyY');await pg.mouse.move(800,500);
 await pg.evaluate(()=>{window.__setCam&&window.__setCam(3200,650);const R=window.__riftline,G=R.G;for(let i=0;i<60*6;i++)R.tick(1/60);G.col.plants.forEach(p=>p.alive=true);});
 await pg.evaluate(()=>{const G=window.__riftline.G;G.paused=true;document.getElementById('pause').hidden=true;window.__setCam(3200,650);});
 await pg.waitForTimeout(700);await pg.screenshot({path:'colmap2.png'});
 console.log('errors',errs);await b.close();})();
