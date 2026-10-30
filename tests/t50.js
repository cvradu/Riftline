const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="col"]');await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(600);
 const st=()=>pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;return {state:G.col.state,round:G.col.round,lvl:p.level,points:p.points,ranks:p.ranks,augs:p.augList,botAugs:G.bot.augList,botRanks:G.bot.ranks,prepHidden:document.getElementById('prep').hidden,ready:!document.getElementById('readyBtn').disabled};});
 console.log('prep1',JSON.stringify(await st()));
 await pg.screenshot({path:'prep1.png'});
 // spend two points with Shift+Q, Shift+E, pick the first augment, ready
 for(const k of ['KeyQ','KeyE','KeyW']){await pg.keyboard.down('Shift');await pg.keyboard.press(k);await pg.keyboard.up('Shift');}
 await pg.click('#prepAugs .aug >> nth=0');console.log('picked',JSON.stringify(await st()));
 await pg.click('#readyBtn');await pg.waitForTimeout(200);console.log('after ready',JSON.stringify(await st()));
 // finish round 1 quickly: kill the bot
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G;for(let i=0;i<60*4.2;i++)R.tick(1/60);G.bot.hp=1;G.bot.untargetT=0;const p=G.player;p.x=G.bot.x-60;p.y=G.bot.y;});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G;window.__tc(G.player,'Q',G.bot.x,G.bot.y);for(let i=0;i<60*4;i++)R.tick(1/60);});
 console.log('round 2',JSON.stringify(await st()), await pg.evaluate(()=>window.__riftline.G.col.wins.join('-')));
 await pg.waitForTimeout(300);await pg.screenshot({path:'prep2.png'});
 console.log('help:',await pg.textContent('#help'));
 console.log('errors',errs);await b.close();})();
