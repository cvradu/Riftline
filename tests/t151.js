const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="mantis"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};const tc=window.__tc;
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=9;p.ranks={Q:1,E:1,RMB:1,R:1};p.points=0;o.hp=o.maxHp=9000;o.res=0;o.stunT=1e9;
   p.isBot=true;p.pvCtl=c=>{c.input.ax=o.x;c.input.ay=o.y;};const reset=(ox,oy,face)=>{o.stunT=1e9;p.x=2500;p.y=650;o.x=ox;o.y=oy;o.facing=face;o.slows=[];p.cds={Q:0,E:0,RMB:0,R:0};p.mq=null;p.anchor=null;p.stealthT=0;p.scan={};};
   // Q: tap vs hold
   reset(2800,650,0);let h=o.hp;tc(p,'Q',o.x,o.y);p.qUp=true;T(30);out.push(`Q tap at 300: dmg ${(h-o.hp).toFixed(0)} (cora facing away from mantis -> scan bonus expected)`);
   reset(3080,650,Math.PI);h=o.hp;p.qUp=false;tc(p,'Q',o.x,o.y);T(30);const mid=p.mq?Math.round(300+350*Math.min(1,(G.t-p.mq.t0))):null;p.qUp=true;T(30);out.push(`Q hold 0.5s (reach ~${mid}) on target 580 away, facing mantis: dmg ${(h-o.hp).toFixed(0)}`);
   reset(3080,650,Math.PI);h=o.hp;tc(p,'Q',o.x,o.y);T(64);p.qUp=true;T(30);out.push(`Q hold 1s on target 580 away: dmg ${(h-o.hp).toFixed(0)}`);
   reset(3080,650,0);h=o.hp;tc(p,'Q',o.x,o.y);T(64);p.qUp=true;T(30);out.push(`  same from behind: dmg ${(h-o.hp).toFixed(0)}, scan cd ${(p.scan[o.id]-G.t).toFixed(1)}s, res ${p.res|0}`);
   reset(3080,650,0);h=o.hp;tc(p,'Q',o.x,o.y);T(64);p.qUp=true;T(30);out.push(`  again from behind right away (scan on cooldown): dmg ${(h-o.hp).toFixed(0)}`);
   reset(2800,650,0);tc(p,'Q',o.x,o.y);T(200);out.push(`Q never released: auto-released ${!p.mq}`);
   // camouflage
   reset(3200,650,0);tc(p,'RMB',0,0);T(5);const vis1=window.__riftline.G.player.stealthT>0;
   out.push(`camo: stealthed ${vis1}, foe can target ${(()=>{const u=p;return u.alive&&!(u.stealthT>0);})()}, ms ${window.__ms(p)|0}/${p.baseMs|0}`);
   tc(p,'E',3000,650);T(2);out.push(`  placed anchor while hidden: still hidden ${p.stealthT>0}, anchor ${!!p.anchor}`);
   window.__dd(o,p,30,'phys');out.push(`  took damage: outline until +${(p.outlineT-G.t).toFixed(2)}s, still hidden ${p.stealthT>0}`);
   T(30);h=o.hp;o.x=3010;o.y=660;const rr=tc(p,'E',0,0);T(2);out.push(`  recast E: ${rr}, teleported to ${p.x|0},${p.y|0}, hidden ${p.stealthT>0}, sweep dmg ${(h-o.hp).toFixed(0)}`);
   // grip
   T(60);reset(2500,650,0);o.x=3100;o.y=650;o.hp=o.maxHp*0.5;h=o.hp;tc(p,'R',o.x,o.y);let caught=false;for(let i=0;i<90;i++){R.tick(1/60);if(p.grip&&p.grip.state==='pull')caught=true;}
   out.push(`R on 600 away, target at 50%: caught ${caught}, mantis ended at ${p.x|0} (target ${o.x|0}), dmg ${(h-o.hp).toFixed(0)} (base ${(125+0.8*p.ad).toFixed(0)}x1.5 pre-armour)`);
   // grip passes minions
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
