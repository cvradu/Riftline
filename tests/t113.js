const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};const tc=window.__tc;
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=9;p.ranks={Q:1,E:1,RMB:1,R:1};p.points=0;o.hp=o.maxHp=9000;o.res=0;
   const reset=(ox,oy)=>{p.x=2500;p.y=650;o.x=ox;o.y=oy;o.stunT=1e9;o.slows=[];o.dash=null;p.cds={Q:0,E:0,RMB:0,R:0};p.res=0;p.vent=false;};
   // Q at the sweet spot and up close
   for(const dx of [380,150]){reset(2500+dx,650);const h=o.hp;tc(p,'Q',o.x,o.y);T(27);const x0=o.x;T(20);out.push(`Q at ${dx}: dmg ${(h-o.hp).toFixed(0)} knocked ${(o.x-x0)|0} units, pressure ${p.res|0}`);}
   // ink: slow + Marty's damage reduction
   reset(2800,650);o.stunT=0;tc(p,'RMB',2800,650);T(30);out.push(`ink: Cora slowed to ${(window.__ms(o)/o.baseMs).toFixed(2)} of her speed`);
   p.x=2800;p.y=650;T(1);const h1=p.hp;o.stunT=1e9;window.__K;const dd=(()=>{const x=p.hp;p.hp=x;return 0;})();
   // E: charge at Cora from 600 units, aimed off to the side; Marty should steer in and stop on her
   T(300);reset(3100,750);p.x=2500;p.y=650;const h2=o.hp;tc(p,'E',3100,450);let n=0,stopped=null;for(let i=0;i<60;i++){p.aimX=o.x;p.aimY=o.y;R.tick(1/60);n++;if(!p.dash){stopped=i;break;}}
   out.push(`charge: stopped after ${stopped} ticks at ${p.x|0},${p.y|0}; Cora took ${(h2-o.hp).toFixed(0)}, now at ${o.x|0},${o.y|0}`);
   // R: drop on Cora; check untargetable mid-air, knock-up, landing spot
   T(60);reset(3000,650);const h3=o.hp;tc(p,'R',3000,650);T(30);const ut=p.untargetT>0,pos=`${p.x|0},${p.y|0}`;T(45);
   out.push(`drop: mid-air untargetable ${ut} at ${pos}; landed ${p.x|0},${p.y|0}; Cora took ${(h3-o.hp).toFixed(0)}, airborne ${!!(o.air&&G.t-o.air.t0<o.air.dur)} stun ${o.stunT>1e8?'(test stun)':o.stunT.toFixed(2)}`);
   // vent: fill pressure, auto Cora, shield
   T(60);reset(2650,650);p.res=99;window.__riftline;const pressBefore=p.res;
   G.autoPlayer=true;o.hp=9000;const h4=o.hp;for(let i=0;i<90&&!p.shield;i++)R.tick(1/60);G.autoPlayer=false;
   out.push(`vent: shield ${p.shield?(p.shield.amt|0):'none'}, pressure ${p.res|0}, vent flag ${p.vent}`);
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
