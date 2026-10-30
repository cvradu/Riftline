const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 console.log('cards',await pg.evaluate(()=>[...document.querySelectorAll('#cards .card h3')].map(h=>h.textContent).join(' | ')));
 await pg.click('.card >> nth=2');await pg.click('#optFoe button[data-v="shade"]');await pg.click('#startBtn');await pg.waitForTimeout(500);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,log=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   log.push(`player ${p.name} range ${p.range} res ${p.res}/${p.maxRes} vs ${o.name}`);
   p.level=11;p.ranks={Q:5,E:3,RMB:3,R:2};p.points=0;G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;
   p.x=3000;p.y=650;o.x=3600;o.y=650;o.stunT=999;o.hp=o.maxHp=4000;
   let r=window.__tc(p,'Q',3600,650);T(40);log.push(`Q ${r}: bounty ${p.bounty&&p.bounty.t===o} fury ${p.res|0} dmg ${(4000-o.hp)|0}`);
   // basic attacks on the bounty build extra fury
   o.x=3400;const f0=p.res;p.input.attack=true;p.input.attackTarget=o;for(let i=0;i<180;i++){p.input.attack=true;p.input.attackTarget=o;R.tick(1/60);}
   log.push(`3s of revolver on the bounty: fury ${f0|0} -> ${p.res|0}`);
   // Stolen Hide blocks a hit from the front
   p.cds.RMB=0;window.__tc(p,'RMB',o.x,o.y);const h0=p.hp;const dd=window.__dd;log.push('hide '+!!p.hide);
   // Dragline then pull
   p.cds.E=0;o.x=3650;r=window.__tc(p,'E',3650,650);T(30);log.push(`E ${r}: tether ${!!p.tether} fury ${p.res|0}`);
   const g0=Math.hypot(o.x-p.x,o.y-p.y)|0;r=window.__tc(p,'E',0,0);T(30);log.push(`E recast ${r}: gap ${g0} -> ${Math.hypot(o.x-p.x,o.y-p.y)|0}`);
   // Uncage
   p.res=p.maxRes;p.cds.R=0;const hp0=p.maxHp;r=window.__tc(p,'R',0,0);T(45);log.push(`R ${r}: form ${p.form} maxHp ${hp0|0} -> ${p.maxHp|0} range ${p.range} fury ${p.res|0}`);
   p.cds.Q=0;r=window.__tc(p,'Q',o.x,o.y);T(20);log.push(`monster Q ${r}: bleed on bounty ${!!o.bleed}`);
   p.cds.E=0;o.x=p.x+300;r=window.__tc(p,'E',o.x,o.y);T(40);log.push(`monster E ${r}: landed gap ${Math.hypot(o.x-p.x,o.y-p.y)|0}`);
   p.cds.RMB=0;r=window.__tc(p,'RMB',0,0);T(5);log.push(`monster W ${r}: ms buff ${!!p.msBuff} bounty slowed ${o.slows.length>0}`);
   T(60*10);log.push(`after 10s: form ${p.form} fury ${p.res|0} maxHp ${p.maxHp|0} range ${p.range}`);
   return log.join('\n');}));
 console.log('errors',errs);await b.close();})();
