const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.screenshot({path:'c_menu.png',clip:{x:290,y:320,width:1020,height:280}});
 for(const pick of [0,1]){
  console.log(await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   for(let i=0;i<60*360;i++){R.tick(1/60);if(G.over)break;}return `${G.player.name} vs ${G.bot.name}: t=${G.t|0} score ${G.score} lvl ${G.player.level}/${G.bot.level} cs ${G.player.cs}/${G.bot.cs}`;},pick));
 }
 await pg.evaluate(()=>{document.querySelectorAll('#menu .card')[0].click();const R=window.__riftline;R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=4;for(let i=0;i<60*20;i++)R.tick(1/60);const p=G.player,bt=G.bot;p.x=3000;p.y=640;bt.x=3170;bt.y=640;G.relics.forEach(r=>r.at=1e9);});
 await pg.mouse.move(900,400);
 for(let i=0;i<8;i++){await pg.waitForTimeout(160);await pg.screenshot({path:`c${i}.png`,clip:{x:500,y:220,width:600,height:380}});}
 console.log('ERRORS',errs.slice(0,5));await b.close();
})();
