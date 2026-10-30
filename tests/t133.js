const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.addInitScript(()=>{window.__noIntro=false;});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.click('.heroTxt [data-go="play"][data-mode="bot"]');await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="blackjack"]');await pg.click('#startBtn');
 await pg.waitForTimeout(500);await pg.screenshot({path:'menu/vs.png'});
 const t0=await pg.evaluate(()=>window.__riftline.G.t);await pg.waitForTimeout(800);const t1=await pg.evaluate(()=>window.__riftline.G.t);
 await pg.waitForTimeout(1500);const t2=await pg.evaluate(()=>window.__riftline.G.t);const vsHidden=await pg.evaluate(()=>document.getElementById('vs').hidden);
 console.log(`sim held during intro: t ${t0.toFixed(2)} -> ${t1.toFixed(2)}, after: ${t2.toFixed(2)}, vs hidden ${vsHidden}`);
 // finish the match: give the player the kills
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G;G.killsToWin=1;const o=G.bot;window.__K(o,G.player);});
 await pg.waitForTimeout(2600);await pg.screenshot({path:'menu/over.png'});
 const hist=await pg.evaluate(()=>JSON.parse(localStorage.getItem('riftline.history')||'[]'));console.log('history',JSON.stringify(hist));
 await pg.click('#overMenuBtn');await pg.waitForTimeout(400);
 console.log('screen after champion select:',await pg.evaluate(()=>[...document.querySelectorAll('.scr')].filter(s=>!s.hidden).map(s=>s.id).join(',')));
 await pg.click('.mtabs [data-go="home"]');await pg.waitForTimeout(400);await pg.screenshot({path:'menu/home2.png'});
 await pg.click('.mtabs [data-go="champs"]');await pg.waitForTimeout(300);await pg.click('.ctile[data-k="marty"]');await pg.waitForTimeout(600);
 console.log('detail record:',await pg.evaluate(()=>document.getElementById('cdRec').innerText.replace(/\s+/g,' ')));
 console.log('errors',errs);await b.close();})();
