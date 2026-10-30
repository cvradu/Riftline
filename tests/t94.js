const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 const card=await pg.$('.card[data-k="blackjack"]');await card.scrollIntoViewIfNeeded();await card.screenshot({path:'bj_card.png'});
 await pg.click('.card[data-k="blackjack"]');await pg.click('.mapcard[data-v="lane"]');await pg.click('#startBtn');await pg.waitForTimeout(800);
 await pg.evaluate(()=>{const p=window.__riftline.G.player;Object.assign(p.ranks,{Q:1,E:1,RMB:1,R:1});p.loaded=true;});await pg.waitForTimeout(400);
 const core=await pg.$('#core');await core.screenshot({path:'bj_hud.png'});
 await pg.hover('#slots .slot >> nth=1');await pg.waitForTimeout(300);await pg.screenshot({path:'bj_tip.png',clip:{x:300,y:250,width:700,height:470}});
 console.log('errors',errs);await b.close();})();
