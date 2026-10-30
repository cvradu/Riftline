const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;G.killsToWin=99;const p=G.player,o=G.bot;
   const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};p.level=11;p.ranks.E=3;p.ranks.R=2;p.ranks.Q=3;o.level=11;o.ranks.E=3;
   G.nextWave=G.t+0.01;T(60*14);// let a wave come so minions get thrown out
   p.x=2900;p.y=650;o.x=3200;o.y=700;o.stunT=0.2;
   window.__tc(p,'R',o.x,o.y);T(16);const A=G.arena;
   // Shade tries to blink out with Shadow Step and dash with Slip Through
   o.stunT=0;o.dashCd=0;const rd=window.__tc(o,'E',o.x+900,o.y);const bl=(()=>{try{return 'ok'}catch(e){return e.message}})();T(30);
   const dE=Math.hypot(o.x-A.x,o.y-A.y)|0;
   G.paused=true;document.getElementById('pause').hidden=true;
   const outM=G.minions.filter(m=>m.alive&&Math.hypot(m.x-A.x,m.y-A.y)<A.R).length;
   return `arena r ${A.R}; Shade E cast ${rd}, now ${dE} from centre; minions inside ring: ${outM}`;}));
 await pg.waitForTimeout(600);await pg.screenshot({path:'arena1.png'});
 // hook mid-flight
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;G.paused=false;G.arena=null;p.cds.E=0;p.hook=null;p.axes.RMB.state='hand';p.x=2600;p.y=650;
   window.__tc(p,'E',2900,250);for(let i=0;i<14;i++)R.tick(1/60);G.paused=true;document.getElementById('pause').hidden=true;});
 await pg.waitForTimeout(500);await pg.screenshot({path:'hook1.png'});
 console.log('errors',errs);await b.close();})();
