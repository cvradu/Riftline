const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+e.stack));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.screenshot({path:'s_menu.png'});
 const res=await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[1].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;for(let i=0;i<60*240;i++){R.tick(1/60);if(G.over)break;}return `t=${G.t|0} score ${G.score} cs ${G.player.cs}/${G.bot.cs}`;});
 console.log(res);
 await pg.evaluate(()=>{const R=window.__riftline;R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;const p=G.player,bt=G.bot;p.x=3000;p.y=650;bt.x=3140;bt.y=650;for(const c of [p,bt]){c.ranks.Q=1;c.ranks.E=1;c.points=0;}G.relics.forEach(r=>r.at=1e9);});
 await pg.mouse.move(800,450);
 const fps=await pg.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2);}requestAnimationFrame(f);}));
 console.log('fps',fps);
 for(let i=0;i<10;i++){await pg.waitForTimeout(110);await pg.screenshot({path:`d${i}.png`,clip:{x:500,y:230,width:560,height:380}});}
 await pg.screenshot({path:'s_game.png'});
 console.log('ERRORS',errs.slice(0,5));await b.close();
})();
