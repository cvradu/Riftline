const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{try{localStorage.setItem('riftline.settings',JSON.stringify({scheme:'classic',cursor:'hand',amove:'click',sens:100,cam:100}));}catch(e){}});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 for(const k of ['cora','shade','viktor'])console.log(k,await pg.evaluate(k=>[...document.querySelector(`.card[data-k="${k}"]`).querySelectorAll('li')].map(li=>li.textContent).join(' | '),k));
 await pg.click('.card[data-k="viktor"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
 console.log('hud',await pg.evaluate(()=>[...document.querySelectorAll('#slots .slot')].sort((a,b)=>(+a.style.order||0)-(+b.style.order||0)).map(d=>d.querySelector('.key').textContent).join(' ')));
 await pg.evaluate(()=>{const p=window.__riftline.G.player;p.ranks.E=1;p.ranks.RMB=1;p.points=0;});
 await pg.mouse.move(900,300);await pg.keyboard.press('KeyW');await pg.waitForTimeout(300);
 const a=await pg.evaluate(()=>{const p=window.__riftline.G.player;return {E:p.cds.E>0,RMB:p.cds.RMB>0};});
 await pg.keyboard.press('KeyE');await pg.waitForTimeout(300);
 const b2=await pg.evaluate(()=>{const p=window.__riftline.G.player;return {E:p.cds.E>0,RMB:p.cds.RMB>0};});
 console.log('after W (movement slot on cooldown?)',JSON.stringify(a),'after E',JSON.stringify(b2));
 console.log('errors',errs);await b.close();})();
