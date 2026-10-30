const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(300);
 await pg.evaluate(()=>{const G=window.__riftline.G;G.player.x=3000;G.player.y=650;});await pg.waitForTimeout(600);
 await pg.keyboard.press('KeyY');
 const cam=()=>pg.evaluate(()=>{const s=document.querySelector('#game');return 'see'});
 // read cam via screenToWorld of screen center isn't exported; infer from a world point projection by probing the player position on screen
 for(const [nm,x,y] of [['right',1399,425],['left',0,425],['up',700,0],['down',700,849]]){
   await pg.evaluate(()=>{const G=window.__riftline.G;});
   await pg.mouse.move(700,425);await pg.waitForTimeout(100);
   const before=await pg.evaluate(()=>window.__camProbe&&window.__camProbe());
   await pg.mouse.move(x,y);await pg.waitForTimeout(1200);
   const after=await pg.evaluate(()=>window.__camProbe&&window.__camProbe());
   console.log(nm,JSON.stringify(before),JSON.stringify(after));}
 console.log('errors',errs);await b.close();})();
