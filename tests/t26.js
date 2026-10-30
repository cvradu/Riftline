const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1000);
 console.log('modern card',await pg.evaluate(()=>[...document.querySelectorAll('#cards .card')[0].querySelectorAll('kbd')].map(k=>k.textContent).join(' ')));
 await pg.click('#optScheme button[data-v="classic"]');
 console.log('classic card',await pg.evaluate(()=>[...document.querySelectorAll('#cards .card')[0].querySelectorAll('kbd')].map(k=>k.textContent).join(' ')));
 // reload: setting persists
 await pg.reload();await pg.waitForTimeout(800);
 console.log('after reload',await pg.evaluate(()=>[document.querySelector('#optScheme [aria-pressed="true"]').dataset.v,document.querySelector('#optCursor [aria-pressed="true"]').dataset.v].join(',')));
 // classic: right click an enemy minion -> attack order and kills it eventually
 await pg.click('#startBtn');await pg.waitForTimeout(300);
 const r=await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;G.nextWave=G.t+0.1;for(let i=0;i<60*24;i++)R.tick(1/60);
   const m=G.minions.filter(x=>x.alive&&x.team!==p.team).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
   if(!m)return 'no minion';p.order={kind:'attack',t:m};const hp0=m.hp;let n=0;for(let i=0;i<60*6;i++){window.__riftline.tick(1/60);if(!m.alive)break;}
   return `attack order: minion hp ${hp0|0} -> ${m.alive?m.hp|0:'dead'} player at ${p.x|0} order ${p.order&&p.order.kind}`;});
 console.log(r);
 // attack-move toward the enemy side
 const r2=await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;p.order={kind:'amove',x:p.x+900,y:p.y,best:1e9,stall:0};let first=null;
   for(let i=0;i<60*6;i++){R.tick(1/60);if(!first&&p.order&&p.order.kind==='attack')first=p.order.t.kind+' at t+'+(i/60).toFixed(1);}return 'amove engaged: '+first;});
 console.log(r2);
 // switch back to WASD from the pause menu mid-game
 await pg.keyboard.press('Escape');await pg.waitForTimeout(200);await pg.click('#pScheme button[data-v="modern"]');
 console.log('slots now',await pg.evaluate(()=>[...document.querySelectorAll('#slots .slot .key')].map(k=>k.textContent).join(' ')));
 await pg.evaluate(()=>localStorage.clear());
 console.log('errors',errs);await b.close();})();
