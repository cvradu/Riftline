const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;G.killsToWin=99;
   const p=G.player,o=G.bot,tw=G.towers[1];p.x=tw.x-500;p.y=tw.y+150;o.x=tw.x+600;o.stunT=999;G.nextWave=1e9;G.spawnQ.length=0;G.minions.length=0;
   p.harm={victim:o,until:G.t+5};o.team=1;
   for(let i=0;i<60*1.2;i++){R.tick(1/60);if(G.projs.some(q=>q.kind==='towerShot'))break;}
   G.paused=true;document.getElementById('pause').hidden=true;});
 await pg.waitForTimeout(900);await pg.screenshot({path:'tw1.png'});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G;G.paused=false;for(let i=0;i<5;i++)R.tick(1/60);G.paused=true;document.getElementById('pause').hidden=true;});
 await pg.waitForTimeout(300);await pg.screenshot({path:'tw2.png'});
 console.log('errors',errs);await b.close();})();
