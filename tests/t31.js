const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);await pg.screenshot({path:'menu2.png'});
 await pg.click('#startBtn');await pg.waitForTimeout(300);await pg.keyboard.press('Escape');await pg.waitForTimeout(200);await pg.screenshot({path:'pause2.png'});
 await b.close();})();
