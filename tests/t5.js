const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+e.stack));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const html=require('fs').readFileSync('/home/user/riftline/index.html','utf8');
 await pg.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
 await pg.waitForTimeout(800);
 await pg.screenshot({path:'p_menu.png'});
 for(const pick of [0,1]){
  const res=await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;
   for(let i=0;i<60*300;i++){R.tick(1/60);if(G.over)break;}
   return `${G.player.name}: t=${G.t|0} score ${G.score} lvl ${G.player.level}/${G.bot.level} cs ${G.player.cs}/${G.bot.cs}`;},pick);
  console.log(res);
 }
 // set up a fight in view, real-time
 await pg.evaluate(()=>{document.querySelectorAll('#menu .card')[0].click();const R=window.__riftline;R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;for(let i=0;i<60*14;i++)R.tick(1/60);
   const p=G.player,bt=G.bot;p.x=2700;p.y=650;bt.x=2830;bt.y=640;p.ranks.Q=1;p.ranks.E=1;p.ranks.RMB=1;bt.ranks.Q=1;bt.ranks.E=1;});
 await pg.mouse.move(900,420);
 const fps=await pg.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2);}requestAnimationFrame(f);}));
 console.log('fps',fps,'sprites cached',await pg.evaluate(()=>0));
 for(let i=0;i<4;i++){await pg.waitForTimeout(260);await pg.screenshot({path:`p_fight${i}.png`});}
 console.log('ERRORS',errs.slice(0,5));
 await b.close();
})();
