const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('#optMap button[data-v="col"]');await pg.click('.card >> nth=0');await pg.click('#startBtn');
 await pg.waitForTimeout(1500);await pg.screenshot({path:'col0.png'});
 await pg.waitForTimeout(3500);await pg.mouse.move(800,300);await pg.waitForTimeout(500);await pg.screenshot({path:'col1.png'});
 console.log(await pg.evaluate(()=>{const G=window.__riftline.G;return JSON.stringify({mode:G.mode,state:G.col.state,round:G.col.round,lvl:G.player.level,ranks:G.player.ranks,p:[G.player.x|0,G.player.y|0],b:[G.bot.x|0,G.bot.y|0]});}));
 console.log('errors',errs);await b.close();})();
