const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const html=require('fs').readFileSync('/home/user/riftline/index.html','utf8');
 await pg.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
 await pg.waitForTimeout(500);
 await pg.evaluate(()=>{const R=window.__riftline;R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;for(let i=0;i<60*50;i++)R.tick(1/60);G.player.x=4000;G.player.y=700;});
 await pg.mouse.move(1000,300);
 await pg.waitForTimeout(1500);
 await pg.screenshot({path:'iso_tower.png'});
 console.log(errs);await b.close();
})();
