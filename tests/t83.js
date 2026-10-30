const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="viktor"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.x=1200;p.y=650;o.x=1650;o.y=650;o.stunT=1e9;
   // 1: full Fury from a shot, R not even learned
   p.ranks.R=0;p.res=96;T(1);const tc=window.__tc;
   const s1=`at 96 Fury: ${p.form||'human'}`;p.res=100;T(2);out.push(`${s1} -> reached 100 with R unlearned: ${p.form}, max hp ${p.maxHp|0}`);
   for(let i=0;i<60*12&&p.form==='monster';i++)T(1);out.push(`reverted after the Fury drained: ${p.form}, Fury ${p.res|0}`);
   // 2: Crash Down
   p.ranks.R=1;p.points=5;p.cds.R=0;p.res=60;out.push(`R at 60 Fury: ${tc(p,'R',o.x,o.y)}`);
   p.res=80;const h0=o.hp;const r=tc(p,'R',o.x,o.y);T(5);const crouch=`${p.cast?'crouching':'-'}`;T(16);const mid=`${p.dash?'leaping kind '+p.dash.kind:'-'} at ${p.x|0}`;
   for(let i=0;i<60&&(p.dash||p.cast);i++)T(1);T(1);
   out.push(`R at 80 Fury: ${r} | ${crouch} | ${mid} | landed at ${p.x|0} (target ${o.x}) form ${p.form} | Cora took ${(h0-o.hp)|0}, slowed ${o.slows.length>0} | R cooldown ${p.cds.R.toFixed(0)}s`);
   out.push(`R while uncaged: ${tc(p,'R',o.x,o.y)}`);
   return out.join('\n');}));
 // a picture mid-leap
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;while(p.form==='monster'){R.tick(1/60);}p.x=1200;p.y=650;o.x=1600;o.y=600;p.res=80;p.cds.R=0;window.__tc(p,'R',o.x,o.y);for(let i=0;i<15+12;i++)R.tick(1/60);});
 await pg.waitForTimeout(400);await pg.screenshot({path:'crash_mid.png',clip:{x:300,y:120,width:700,height:480}});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;for(let i=0;i<40&&p.dash;i++)R.tick(1/60);R.tick(1/60);});
 await pg.waitForTimeout(250);await pg.screenshot({path:'crash_land.png',clip:{x:300,y:120,width:700,height:480}});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;while(p.form==='monster')R.tick(1/60);p.res=82;G.hitStop=0;});await pg.waitForTimeout(300);
 await pg.screenshot({path:'fury_bar.png',clip:{x:500,y:620,width:500,height:100}});
 console.log('errors',errs);await b.close();})();
