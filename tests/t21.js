const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;G.killsToWin=99;
   const p=G.player,o=G.bot,log=[];const W0=(G.towers[0].x+G.towers[1].x)/2,MID=G.towers[0].y;const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   if(p.key!=='cora')return 'player is '+p.key;
   p.level=11;p.ranks.Q=5;p.ranks.R=2;p.ranks.E=3;p.ranks.RMB=1;
   p.x=W0-300;p.y=MID;o.x=W0;o.y=MID;o.stunT=999;o.hp=o.maxHp=5000;G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;
   // Q: throw through the bot, check the bleed
   let r=window.__tc(p,'Q',W0+200,MID);T(20);log.push('Q '+r+' axe '+p.axes.Q.state+' bleed '+(o.bleed?o.bleed.n+'x'+o.bleed.per.toFixed(1):'none'));
   const h0=o.hp;T(130);log.push('bleed done '+!o.bleed+' bleedDmg '+(h0-o.hp).toFixed(0)+' axe '+p.axes.Q.state);
   r=window.__tc(p,'Q',0,0);log.push('recall '+r);T(5);log.push('bleed after recall hit '+(o.bleed?'yes':'no'));T(60);log.push('axe '+p.axes.Q.state+' cdQ '+p.cds.Q.toFixed(1));
   // R: three presses
   p.axes.Q.readyAt=0;o.hp=o.maxHp;
   r=window.__tc(p,'R',W0+200,MID);T(14);log.push('R1 '+r+' state '+p.rSeq.state+' Q '+p.axes.Q.state);
   r=window.__tc(p,'R',W0,MID+200);T(14);log.push('R2 '+r+' state '+(p.rSeq&&p.rSeq.state));
   r=window.__tc(p,'R',0,0);log.push('R3 early '+r);T(40);log.push('axes '+p.axes.Q.state+'/'+p.axes.RMB.state+' r '+p.axes.Q.r+'/'+p.axes.RMB.r);
   const h1=o.hp;r=window.__tc(p,'R',0,0);log.push('R3 '+r+' state '+(p.rSeq&&p.rSeq.state));T(60);log.push('after dashes rSeq '+p.rSeq+' axes '+p.axes.Q.state+'/'+p.axes.RMB.state+' dmg '+(h1-o.hp).toFixed(0)+' corr '+p.res.toFixed(0)+' pos '+(p.x|0)+','+(p.y|0));
   // R expiry without dashing
   p.cds.R=0;r=window.__tc(p,'R',W0-600,MID);T(400);log.push('R expiry: rSeq '+p.rSeq+' Q '+p.axes.Q.state+' r '+p.axes.Q.r);
   // recall: interrupted by moving, then a full channel
   p.hp=100;p.x=2400;p.y=600;
   const cons=document.querySelector('#toast');
   r=window.__tc?null:null;
   const k=new KeyboardEvent('keydown',{code:'KeyB'});dispatchEvent(k);T(60);log.push('recalling '+!!p.recall);
   dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));T(2);dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));log.push('after move recall '+!!p.recall+' toast "'+cons.textContent+'"');
   dispatchEvent(new KeyboardEvent('keydown',{code:'KeyB'}));T(60*4);p.hp-=50;T(60*3);log.push('mid '+!!p.recall+' pos '+(p.x|0));T(60*1+5);log.push('done recall '+!!p.recall+' pos '+(p.x|0)+','+(p.y|0)+' fountain '+FOUNTX());
   function FOUNTX(){return 'n/a';}
   return log.join('\n');}));
 console.log('errors',errs);await b.close();})();
