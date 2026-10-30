const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});const errs=[];
 const A=await ctx.newPage(),B=await ctx.newPage();
 for(const [n,pg] of [['host',A],['guest',B]]){pg.on('pageerror',e=>errs.push(n+': '+e.message));await pg.addInitScript(()=>{window.__netLag={ms:40,jitter:30,drop:0.05};});await pg.goto('http://localhost:8765/mp.html');await pg.waitForTimeout(700);}
 await A.click('#hostBtn');await A.waitForTimeout(300);const code=await A.evaluate(()=>document.getElementById('onCode').textContent);
 await B.fill('#joinCode',code);await B.click('#joinBtn');
 await A.waitForFunction(()=>!document.getElementById('onReady').disabled);await B.waitForFunction(()=>!document.getElementById('onReady').disabled);
 // host switches map after the guest joined: the guest follows
 await A.click('.mapcard[data-v="col"]');await B.waitForTimeout(400);const gm1=await B.evaluate(()=>document.querySelector('.mapcard[aria-pressed="true"]').dataset.v);
 await B.click('.mapcard[data-v="lane"]',{force:true});await B.waitForTimeout(200);const gm2=await B.evaluate(()=>document.querySelector('.mapcard[aria-pressed="true"]').dataset.v);
 await A.click('.mapcard[data-v="lane"]');await B.waitForTimeout(400);
 console.log('guest map follows host:',gm1,'| guest click ignored, still',gm2,'| start button hidden in lobby',await A.evaluate(()=>document.getElementById('startBtn').hidden));
 await A.screenshot({path:'lobby_host.png',clip:{x:0,y:0,width:1280,height:460}});
 await A.click('#onReady');await B.click('#onReady');
 await A.waitForFunction(()=>window.__NET.live&&window.__riftline.G);await B.waitForFunction(()=>window.__NET.live&&window.__riftline.G);
 await A.waitForTimeout(1500);
 const tk=pg=>pg.evaluate(()=>window.__riftline.G.tickN);
 // the menu does not stop an online match
 await A.keyboard.press('Escape');await A.waitForTimeout(1000);const t1=[await tk(A),await tk(B)];await A.waitForTimeout(1000);const t2=[await tk(A),await tk(B)];
 console.log('host menu open:',await A.evaluate(()=>!document.getElementById('pause').hidden&&document.getElementById('pauseTitle').textContent),'| restart hidden',await A.evaluate(()=>document.getElementById('restartBtn').hidden),'| ticks still advance',t1,'->',t2);
 await A.keyboard.press('Escape');
 // the guest's messages stop for 3 s: the host waits, then catches up
 await B.evaluate(()=>{window.__netLag.drop=1;});await A.waitForTimeout(2500);
 const w=await A.evaluate(()=>({shown:!document.getElementById('netWait').hidden,text:document.getElementById('netWaitT').textContent,tick:window.__riftline.G.tickN}));
 await B.evaluate(()=>{window.__netLag.drop=0.05;});await A.waitForTimeout(2000);
 console.log('while cut off, host shows:',JSON.stringify(w),'| after: wait hidden',await A.evaluate(()=>document.getElementById('netWait').hidden),'ticks',await tk(A),await tk(B),'desync',await A.evaluate(()=>window.__NET.desync));
 // the guest leaves the match from the menu
 await B.keyboard.press('Escape');await B.click('#menuBtn');await A.waitForTimeout(2500);
 const g=await A.evaluate(()=>({shown:!document.getElementById('netWait').hidden,text:document.getElementById('netWaitT').textContent,btn:!document.getElementById('netWaitBtn').hidden}));
 console.log('guest left -> host sees',JSON.stringify(g),'| guest back in lobby',await B.evaluate(()=>!document.getElementById('menu').hidden&&!document.getElementById('onLobby').hidden));
 await A.click('#netWaitBtn');await A.waitForTimeout(500);
 await A.click('#onReady');await B.click('#onReady');
 await A.waitForFunction(()=>window.__NET.live&&window.__NET.match.n===2);await B.waitForFunction(()=>window.__NET.live&&window.__NET.match.n===2);await A.waitForTimeout(1500);
 console.log('second match from the lobby: ticks',await tk(A),await tk(B));
 await A.screenshot({path:'mp_badge.png'});
 console.log('errors',errs);await b.close();})();
