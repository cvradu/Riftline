const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;G.killsToWin=99;const p=G.player,o=G.bot,log=[];
   const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   p.level=11;p.ranks.Q=3;p.ranks.E=3;p.ranks.R=2;G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;
   p.x=3000;p.y=650;o.x=3550;o.y=650;o.stunT=999;o.hp=o.maxHp=3000;
   let r=window.__tc(p,'E',3550,650);const h0=o.hp;T(50);
   log.push('champ hook '+r+': dmg '+(h0-o.hp|0)+', bleeding '+!!o.bleed+', gap '+(Math.hypot(p.x-o.x,p.y-o.y)|0)+' (radii '+(p.r+o.r)+'), blue '+p.axes.RMB.state+', cleave '+!!p.cleaveReady);
   p.cds.R=0;o.hp=1500;r=window.__tc(p,'R',o.x,o.y);T(70);const h1=o.hp;r=window.__tc(p,'R',0,0);log.push('snap '+r+': dmg '+(h1-o.hp|0)+' (missing hp 1500)');
   return log.join('\n');}));
 console.log('errors',errs);await b.close();})();
