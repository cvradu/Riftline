const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+e.stack));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const html=require('fs').readFileSync('/home/user/riftline/index.html','utf8');
 await pg.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
 await pg.waitForTimeout(800);
 await pg.screenshot({path:process.argv[2]+'/menu.png'});
 for(const pick of ['aria','shade']){
  const res=await pg.evaluate((pick)=>{
   const R=window.__riftline; document.querySelectorAll('.card')[pick==='aria'?0:1].click();
   R.newGame(); const G=R.G; G.autoPlayer=true; G.killsToWin=99;
   const log=[];
   for(let i=0;i<60*600;i++){R.tick(1/60); if(G.over)break; if(i%(60*30)===0)log.push(`${Math.round(G.t)}s P lvl${G.player.level} hp${Math.round(G.player.hp)} k${G.player.kills} cs${G.player.cs} r${JSON.stringify(G.player.ranks)} | B lvl${G.bot.level} k${G.bot.kills} cs${G.bot.cs} mode ${G.bot.mode} | towers ${Math.round(G.towers[0].hp)}/${Math.round(G.towers[1].hp)} minions ${G.minions.length}`);}
   log.push('over '+JSON.stringify(G.over)+' t='+Math.round(G.t)+' score '+G.score);
   return log;
  },pick);
  console.log(pick,'\n'+res.join('\n'));
 }
 // real-time play screenshot
 await pg.evaluate(()=>{const R=window.__riftline;R.newGame();R.G.autoPlayer=true;});
 await pg.waitForTimeout(25000);
 await pg.mouse.move(1000,450);
 await pg.screenshot({path:process.argv[2]+'/game.png'});
 console.log('ERRORS',errs.slice(0,10));
 await b.close();
})();
