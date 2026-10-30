const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.screenshot({path:'lane2/g_home.png'});
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(400);
 await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="lane"]');
 await pg.screenshot({path:'lane2/g_play.png',clip:{x:120,y:330,width:1200,height:160}});
 await pg.click('#startBtn');await pg.waitForTimeout(1200);
 await pg.screenshot({path:'lane2/g_base.png'});
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;p.x=1650;p.y=900;G.bot.x=2200;});await pg.waitForTimeout(900);await pg.screenshot({path:'lane2/g_tower.png'});
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;p.x=3200;p.y=650;G.bot.x=3500;});await pg.waitForTimeout(900);await pg.screenshot({path:'lane2/g_mid.png'});
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;p.x=1885;p.y=1100;});await pg.waitForTimeout(900);await pg.screenshot({path:'lane2/g_crystal.png'});
 console.log('errors',errs);await b.close();})();
