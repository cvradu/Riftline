const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 const T=n=>pg.evaluate(n=>{for(let i=0;i<n;i++)window.__riftline.tick(1/60);},n);
 const place=()=>pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;Object.assign(p.ranks,{Q:1,E:1,RMB:1,R:1});
   p.x=2600;p.y=650;p.dash=null;p.cast=null;p.flush=null;p.cds={Q:0,E:0,RMB:0,R:0};o.x=3050;o.y=650;o.stunT=1e9;o.dash=null;o.slows=[];o.hp=o.maxHp;p.atkCd=0;});
 const aim=async()=>{await pg.waitForTimeout(450);return pg.evaluate(()=>{const o=window.__riftline.G.bot,s=window.__P(o.x,o.y);return{sx:s.x,sy:s.y-45,hp:o.hp};});};
 const hp=()=>pg.evaluate(()=>window.__riftline.G.bot.hp);
 let s;await place();s=await aim();await pg.mouse.move(s.sx,s.sy);await T(2);
 await pg.keyboard.press('KeyQ');await T(60);let h=await hp();const qd=s.hp-h;
 const st=await pg.evaluate(()=>({loaded:window.__riftline.G.player.loaded}));
 console.log(`Q: both shots dealt ${qd|0}; loaded ${st.loaded}`);
 await place();s=await aim();await pg.mouse.move(s.sx,s.sy);await T(2);await pg.mouse.down();await T(16);await pg.mouse.up();await T(30);h=await hp();
 console.log(`loaded basic attack dealt ${(s.hp-h)|0}, still loaded ${await pg.evaluate(()=>window.__riftline.G.player.loaded)}, burst ${await pg.evaluate(()=>{const p=window.__riftline.G.player;return !!(p.msBuff&&p.msBuff.until>window.__riftline.G.t);})}`);
 await place();s=await aim();await pg.mouse.move(s.sx,s.sy);await T(2);await pg.mouse.down();await T(16);await pg.mouse.up();await T(30);h=await hp();console.log(`plain basic attack dealt ${(s.hp-h)|0}`);
 // Royal Flush while holding a direction: hovers slowly and keeps firing into the locked cone
 await place();s=await aim();await pg.mouse.move(s.sx,s.sy);await T(2);const y0=await pg.evaluate(()=>window.__riftline.G.player.y);
 await pg.keyboard.press('KeyR');await pg.keyboard.down('KeyW');await T(40);await pg.keyboard.up('KeyW');const mv=await pg.evaluate(y0=>{const p=window.__riftline.G.player;return Math.round(Math.hypot(p.x-2600,p.y-y0));},y0);
 await T(160);h=await hp();console.log(`Royal Flush: hovered ${mv} units in 0.67s (normal ~228), Cora took ${(s.hp-h)|0} from the barrage`);
 // Double or Nothing redirect: second shot follows the cursor
 await place();s=await aim();await pg.evaluate(()=>{const o2=window.__riftline.G.bot;o2.x=3050;o2.y=650;});await pg.mouse.move(s.sx,s.sy);await T(2);await pg.keyboard.press('KeyQ');await T(8);
 const s2=await pg.evaluate(()=>{const s=window.__P(2600,1000);return{x:s.x,y:s.y};});await pg.mouse.move(s2.x,s2.y);await T(30);
 console.log('second shot heading (deg):',await pg.evaluate(()=>window.__riftline.G.projs.filter(q=>q.kind==='bjshotQ').map(q=>Math.round(q.ang*180/Math.PI))));
 // pictures
 const C={x:330,y:140,width:700,height:460};
 await place();s=await aim();await pg.mouse.move(s.sx,s.sy);await T(2);await pg.waitForTimeout(300);await pg.screenshot({path:'bj_idle.png',clip:C});
 await pg.keyboard.press('KeyE');await T(40);await pg.waitForTimeout(300);await pg.screenshot({path:'bj_coin.png',clip:C});
 await T(60);await pg.keyboard.press('KeyR');await T(28);await pg.waitForTimeout(300);await pg.screenshot({path:'bj_flush.png',clip:C});
 console.log('errors',errs);await b.close();})();
