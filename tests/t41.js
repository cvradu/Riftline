const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{window.__zoom=0.42;});
 await pg.goto('file://'+process.cwd()+'/site/zoom.html');await pg.waitForTimeout(1200);
 await pg.click('#optMap button[data-v="col"]');await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(400);
 await pg.evaluate(()=>{const G=window.__riftline.G;G.paused=false;window.__setCam&&0;});
 await pg.keyboard.press('KeyY');await pg.mouse.move(800,500);
 await pg.evaluate(()=>{window.__setCam(3200,650);const G=window.__riftline.G;for(let i=0;i<60*5;i++)window.__riftline.tick(1/60);G.col.plants.forEach(p=>p.alive=true);});
 await pg.waitForTimeout(600);await pg.screenshot({path:'colmap.png'});
 // storm view
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G;G.bot.stunT=0;G.col.t=70;});
 console.log('errors',errs);await b.close();})();
