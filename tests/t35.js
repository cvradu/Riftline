const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;G.killsToWin=99;const p=G.player,o=G.bot,log=[];
   const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   p.level=11;p.ranks.Q=3;p.ranks.E=3;p.ranks.R=2;p.ranks.RMB=1;G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;
   const reset=()=>{p.cds.E=0;p.cds.R=0;p.hook=null;p.axes.RMB.state='hand';p.axes.Q={state:'hand',readyAt:0};};
   // 1. hook a champion
   p.x=3000;p.y=650;o.x=3550;o.y=650;o.stunT=0.01;o.hp=o.maxHp=3000;
   let r=window.__tc(p,'E',3550,650);T(10);log.push('E '+r+' hook '+(p.hook&&p.hook.state));const h0=o.hp;T(40);
   log.push('champ hook: dmg '+(h0-o.hp|0)+'+ , bleed '+!!o.bleed+', gap now '+(Math.hypot(p.x-o.x,p.y-o.y)|0)+', blue axe '+p.axes.RMB.state+', cleave '+!!p.cleaveReady);
   // 2. hook a wall (straight up toward LANE_TOP)
   reset();o.x=5000;p.x=3000;p.y=650;r=window.__tc(p,'E',2700,300);T(50);log.push('wall hook '+r+': moved to '+(p.x|0)+','+(p.y|0)+' blue '+p.axes.RMB.state);
   // 3. hook own grounded axe
   reset();p.x=3000;p.y=650;window.__tc(p,'Q',3400,650);T(60);log.push('axe on ground '+p.axes.Q.state+' at '+(p.axes.Q.x|0));
   p.cds.E=0;r=window.__tc(p,'E',3400,650);T(40);log.push('axe hook '+r+': at '+(p.x|0)+' bronze '+p.axes.Q.state+' corr '+(p.res|0));
   // 4. miss
   reset();p.x=3000;p.y=650;p.res=0;r=window.__tc(p,'E',3700,650);T(60);log.push('miss '+r+': at '+(p.x|0)+' blue '+p.axes.RMB.state+' hook '+p.hook);
   // 5. arena
   reset();p.x=3000;p.y=650;o.x=3300;o.y=650;o.hp=o.maxHp=3000;o.stunT=0;o.hp=1500;
   r=window.__tc(p,'R',o.x,o.y);T(15);const A=G.arena;log.push('R '+r+' arena '+!!A+' inside '+(A?[...A.inside].map(u=>u.name).join('/'):'')+' corr '+(p.res|0));
   // try to blink the bot out with its dash
   o.cds&&(o.dashCd=0);const before=Math.hypot(o.x-A.x,o.y-A.y)|0;window.__tc;const dr=(()=>{try{return 'n/a'}catch(e){}})();
   o.x=A.x+A.R+200;T(1);log.push('trapped clamp: pushed out to '+(Math.hypot(o.x-A.x,o.y-A.y)|0)+' (radius '+A.R+')');
   // minions get kept out
   T(60);r=window.__tc(p,'R',0,0);const h1=o.hp;T(2);log.push('snap '+r+' dmg '+(h1-o.hp|0)+' arena snapped '+(G.arena&&G.arena.snapped));T(40);log.push('arena gone '+!G.arena);
   return log.join('\n');}));
 console.log('errors',errs);await b.close();})();
