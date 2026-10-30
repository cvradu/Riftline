const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);await pg.mouse.move(150,350);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};const tc=window.__tc;
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;G.autoPlayer=false;Object.assign(p.ranks,{Q:1,E:1,RMB:1,R:1});p.level=6;
   const place=()=>{p.x=2600;p.y=650;p.dash=null;p.cast=null;o.x=3100;o.y=650;o.stunT=1e9;o.dash=null;o.slows=[];o.hp=o.maxHp;p.input.ax=o.x;p.input.ay=o.y;};
   // Q
   place();let h0=o.hp;out.push('Q: '+tc(p,'Q',o.x,o.y));T(60);out.push(`  two shots dealt ${(h0-o.hp)|0}`);
   out.push(`  loaded after Q: ${p.loaded}, resource ${p.res}`);
   // loaded auto
   place();h0=o.hp;p.atkCd=0;p.input.attack=true;p.input.attackTarget=o;p.input.mx=p.input.my=0;
   const {x}=p;for(let i=0;i<40&&p.loaded;i++)T(1);p.input.attack=false;T(30);out.push(`loaded basic attack dealt ${(h0-o.hp)|0}, loaded now ${p.loaded}, speed burst ${!!(p.msBuff&&p.msBuff.until>G.t)}`);
   // plain auto for comparison
   place();h0=o.hp;p.atkCd=0;p.input.attack=true;p.input.attackTarget=o;for(let i=0;i<20;i++)T(1);p.input.attack=false;T(30);out.push(`plain basic attack dealt ${(h0-o.hp)|0}`);
   // coin
   place();o.x=3000;o.y=760;p.cds.RMB=0;const d0=Math.hypot(o.x-2950,o.y-650);out.push('coin: '+tc(p,'RMB',2950,650));h0=o.hp;
   T(20);const flying=!!p.coin;T(60);out.push(`  coin out ${flying}; Cora ${Math.round(d0)} from the coin before, ${Math.round(Math.hypot(o.x-2950,o.y-650))} after; took ${(h0-o.hp)|0}; slowed ${o.slows.length>0}`);
   // Jetstep
   place();p.cds.E=0;p.chg.E=2;const r0=p.range;out.push(`Jetstep 1: ${tc(p,'E',2400,650)}`);T(25);out.push(`  moved to ${p.x|0}, charges ${p.chg.E}, range ${r0} -> ${p.range}`);out.push(`Jetstep 2: ${tc(p,'E',2600,650)}`);T(25);out.push(`Jetstep 3: ${tc(p,'E',2400,650)} (charges ${p.chg.E})`);
   // Royal Flush
   place();p.cds.R=0;p.chg.E=2;h0=o.hp;out.push('R: '+tc(p,'R',o.x,o.y));const x0=p.x;p.input.mx=0;p.input.my=1;T(40);out.push(`  hovering: moved ${Math.round(Math.hypot(p.x-x0,p.y-650))} in 0.67s (normal would be ~${Math.round(p.baseMs*0.67)}), Q during: ${tc(p,'Q',o.x,o.y)}, Jetstep during: ${tc(p,'E',p.x,p.y+300)}`);
   T(150);out.push(`  barrage over: ${!p.flush}, Cora took ${(h0-o.hp)|0}`);
   place();p.cds.R=0;tc(p,'R',o.x,o.y);T(30);p.stunT=0.5;T(2);out.push(`stunned mid-barrage: flush ${p.flush?'continues':'ended'}`);
   return out.join('\n');}));
 // pictures
 const snap=async(name,fn,clip)=>{await pg.evaluate(fn);await pg.waitForTimeout(350);await pg.screenshot({path:name,clip});};
 const C={x:390,y:150,width:620,height:440};
 await snap('bj_idle.png',()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;p.stunT=0;p.x=2600;p.y=650;o.x=2900;o.y=560;p.input.mx=p.input.my=0;R.tick(1/60);},C);
 await snap('bj_coin.png',()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;p.cds.RMB=0;window.__tc(p,'RMB',2900,640);for(let i=0;i<40;i++)R.tick(1/60);},C);
 await snap('bj_flush.png',()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;for(let i=0;i<60;i++)R.tick(1/60);p.cds.R=0;window.__tc(p,'R',o.x,o.y);for(let i=0;i<20;i++)R.tick(1/60);},C);
 console.log('errors',errs);await b.close();})();
