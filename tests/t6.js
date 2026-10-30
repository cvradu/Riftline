const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 const html=require('fs').readFileSync('/home/user/riftline/index.html','utf8');
 await pg.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
 await pg.waitForTimeout(400);
 await pg.evaluate(()=>{const R=window.__riftline;R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;
   const p=G.player,bt=G.bot;p.x=3000;p.y=650;bt.x=3150;bt.y=650;for(const c of [p,bt]){c.ranks.Q=1;c.ranks.E=1;c.points=0;}
   G.relics.forEach(r=>r.at=1e9);});
 await pg.mouse.move(800,450);
 for(let i=0;i<10;i++){await pg.waitForTimeout(110);await pg.screenshot({path:`c${i}.png`,clip:{x:560,y:260,width:480,height:340}});}
 console.log(errs);await b.close();
})();
