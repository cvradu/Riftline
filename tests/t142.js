const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="lane"]');await pg.click('#startBtn');await pg.waitForTimeout(800);
 // stand in range of the red tower and let it shoot
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;G.bot.x=200;p.hp=p.maxHp=99999;p.x=G.towers[1].x-450;p.y=820;const o=G.bot;o.x=G.towers[1].x+200;o.y=650;
   p.harm={victim:o,until:G.t+60};G.towers[1].target=p;});
 await pg.waitForTimeout(1600);await pg.screenshot({path:'tower2/g_red.png'});
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;p.x=G.towers[1].x;p.y=650-450;G.towers[1].target=p;});await pg.waitForTimeout(1200);await pg.screenshot({path:'tower2/g_red2.png'});
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;G.bot.x=G.towers[0].x+450;G.bot.y=900;G.towers[0].target=G.bot;G.bot.hp=G.bot.maxHp=99999;p.x=G.towers[0].x-200;p.y=500;});await pg.waitForTimeout(1500);await pg.screenshot({path:'tower2/g_blue.png'});
 await pg.evaluate(()=>{const G=window.__riftline.G;window.__K(G.towers[0],G.bot);});await pg.waitForTimeout(800);await pg.screenshot({path:'tower2/g_ruin.png'});
 console.log('errors',errs);await b.close();})();
