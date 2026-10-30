const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{document.querySelectorAll('#menu .card')[0].click();const R=window.__riftline;R.newGame();const G=R.G;G.killsToWin=99;const p=G.player,bt=G.bot;
   p.x=2900;p.y=650;bt.x=3250;bt.y=600;for(const c of [p,bt]){c.ranks={Q:3,E:3,RMB:3,R:1};c.points=0;c.level=9;}G.relics.forEach(r=>r.at=1e9);G.nextWave=1e9;
   window.__frozen=bt;setInterval(()=>{bt.stunT=0.5;bt.input.attack=false;},50);});
 // keep the enemy idle: the tick loop calls botThink(G.bot) - G.bot is null so guard
 const clip={x:380,y:150,width:840,height:520};
 const snap=async n=>pg.screenshot({path:n,clip});
 const sc=await pg.evaluate(()=>{const G=window.__riftline.G;const e=window.__frozen;return 0;});
 await pg.mouse.move(1150,330);await pg.waitForTimeout(400);
 await pg.keyboard.press('KeyQ');await pg.waitForTimeout(500);await snap('cq.png');
 await pg.mouse.move(1150,520);await pg.mouse.click(1150,520,{button:'right'});await pg.waitForTimeout(350);await snap('cw.png');
 await pg.mouse.move(1150,330);await pg.keyboard.press('KeyE');await pg.waitForTimeout(140);await snap('ce.png');
 await pg.waitForTimeout(700);
 await pg.evaluate(()=>{window.__riftline.G.player.res=100;});
 await pg.mouse.move(1100,420);await pg.keyboard.press('KeyR');await pg.waitForTimeout(600);await snap('cr1.png');
 await pg.keyboard.press('KeyR');await pg.waitForTimeout(160);await snap('cr2.png');await pg.waitForTimeout(500);await snap('cr3.png');
 console.log(await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;return JSON.stringify({axes:{Q:p.axes.Q.state,W:p.axes.RMB.state},chg:p.chg,corr:p.res|0,foeHp:window.__frozen.hp|0,rSeq:!!p.rSeq});}));
 console.log('ERRORS',errs.slice(0,5));await b.close();
})();
