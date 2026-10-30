const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=9;p.ranks={Q:1,E:1,RMB:1,R:1};p.points=0;o.hp=o.maxHp=9000;o.res=0;
   p.x=2500;p.y=650;o.x=3100;o.y=750;o.stunT=1e9;for(let i=0;i<3;i++)R.tick(1/60);});
 await pg.waitForTimeout(500);
 const sp=await pg.evaluate(()=>{const o=window.__riftline.G.bot,q=window.__P(o.x,o.y);const cv=document.querySelector('canvas').getBoundingClientRect();return {x:q.x+cv.left,y:q.y+cv.top};});
 await pg.mouse.move(sp.x,sp.y);await pg.waitForTimeout(100);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};const tc=window.__tc;
   // charge aimed 300 units off to the side; the cursor sits on Cora so Marty should curve in
   const h2=o.hp;tc(p,'E',3100,350);let stopped=null;for(let i=0;i<60;i++){R.tick(1/60);if(!p.dash){stopped=i;break;}}
   out.push(`charge: stopped after ${stopped} ticks at ${p.x|0},${p.y|0}; Cora took ${(h2-o.hp).toFixed(0)}, bumped to ${o.x|0},${o.y|0}`);
   // ink
   T(30);p.x=2500;p.y=650;o.x=2800;o.y=650;o.stunT=0;o.slows=[];p.cds.RMB=0;tc(p,'RMB',2800,650);T(45);o.x=2800;o.y=650;T(1);out.push(`ink: Cora moves at ${(window.__ms(o)/o.baseMs).toFixed(2)} of her speed`);
   // damage reduction inside the ink: same hit outside and inside
   o.stunT=1e9;p.x=2200;p.y=650;T(1);let h=p.hp;window.__K;const hit=()=>{const x=p.hp;G.projs.length;return x;};
   const dealt=(x,y)=>{p.x=x;p.y=y;p.shield=null;const h0=p.hp;window.__dd(o,p,100,'phys');return h0-p.hp;};
   out.push(`100 phys from Cora: outside ink ${dealt(2200,650).toFixed(1)}, inside ink ${dealt(2800,650).toFixed(1)}`);
   // vent
   T(240);p.x=2500;p.y=650;o.x=2650;o.y=650;p.res=95;p.vent=false;p.shield=null;window.__dd(o,p,60,'phys');out.push(`after taking a hit: pressure ${p.res|0} vent ${p.vent}`);
   const h4=o.hp;p.atkCd=0;window.__sa(p,o);for(let i=0;i<60&&!p.shield;i++){R.tick(1/60);}
   out.push(`vent: hit for ${(h4-o.hp).toFixed(0)}, shield ${p.shield?(p.shield.amt|0):'none'}, pressure ${p.res|0}`);
   const s0=p.shield?p.shield.amt:0;const hb=p.hp;window.__dd(o,p,150,'true');out.push(`shield soaks: shield ${s0|0} -> ${p.shield?p.shield.amt|0:0}, hp loss ${(hb-p.hp).toFixed(0)}`);
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
