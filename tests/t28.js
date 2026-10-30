const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(300);
 await pg.keyboard.press('KeyY');await pg.mouse.move(700,425);
 for(const [i,x,y] of [[0,3200,1300],[1,3200,0],[2,200,650],[3,6400,650]]){
   await pg.evaluate(([x,y])=>{window.__setCam(x,y);},[x,y]);await pg.waitForTimeout(250);await pg.screenshot({path:`edge${i}.png`});}
 await b.close();})();
