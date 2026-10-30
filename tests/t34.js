const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;G.killsToWin=99;const p=G.player,o=G.bot;
   p.level=9;p.ranks.Q=3;G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;p.x=3000;p.y=650;o.x=3300;o.y=650;o.stunT=999;o.hp=o.maxHp=4000;
   const out=[];for(const corr of [0,100]){p.res=corr;p.corrT=G.t+99;p.hp=300;p.hp5=0;p.axes.Q={state:'hand',readyAt:0};p.cds.Q=0;const e0=o.hp;
     window.__tc(p,'Q',3400,650);for(let i=0;i<30;i++)R.tick(1/60);out.push(`corruption ${corr}: dealt ${(e0-o.hp)|0}, healed ${(p.hp-300).toFixed(1)}`);}
   return out.join(' | ');}));
 console.log('errors',errs);await b.close();})();
