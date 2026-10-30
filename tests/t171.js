// two browsers in one context play each other over the tab link, driven by scripted players; compare state checksums
const {chromium}=require('playwright');
const MAP=process.argv[2]||'lane',SECS=+(process.argv[3]||60),LAG=process.argv[4]!=='nolag';
const DRIVER=`(()=>{const R=window.__riftline;let t0=performance.now();
  const key=(type,code,shift)=>window.dispatchEvent(new KeyboardEvent(type,{code,key:code,shiftKey:!!shift,bubbles:true}));
  const cv=document.getElementById('game');const held={};
  const hold=(code,on)=>{if(!!held[code]===on)return;held[code]=on;key(on?'keydown':'keyup',code);};
  setInterval(()=>{const G=R.G;if(!G||G.over)return;const p=G.player,o=G.champs.find(c=>c!==p);if(!p.alive){for(const k of ['KeyW','KeyA','KeyS','KeyD'])hold(k,false);return;}
    for(const k of ['Q','E','R'])if(p.points>0&&Math.random()<0.3)key('keydown','Key'+k,true);
    if(p.points>0&&Math.random()<0.2)cv.dispatchEvent(new MouseEvent('mousedown',{button:2,shiftKey:true,clientX:640,clientY:400,bubbles:true}));
    const tgt=o.alive?o:{x:p.team?250:6150,y:650};const s=window.__P(tgt.x,tgt.y);
    window.dispatchEvent(new MouseEvent('mousemove',{clientX:s.x+(Math.random()-0.5)*40,clientY:s.y-40+(Math.random()-0.5)*40,bubbles:true}));
    const me=window.__P(p.x,p.y),dx=s.x-me.x,dy=s.y-me.y,d=Math.hypot(p.x-tgt.x,p.y-tgt.y);
    const far=d>(p.range+200),str=Math.random()<0.5;
    hold('KeyD',far?dx>40:str&&Math.random()<0.5);hold('KeyA',far?dx<-40:!str&&Math.random()<0.5);hold('KeyS',far?dy>40:Math.random()<0.3);hold('KeyW',far?dy<-40:Math.random()<0.3);
    if(d<900){if(Math.random()<0.15)key('keydown','KeyQ');if(Math.random()<0.08)key('keydown','KeyE');if(Math.random()<0.05)key('keydown','KeyR');if(Math.random()<0.06)cv.dispatchEvent(new MouseEvent('mousedown',{button:2,clientX:s.x,clientY:s.y,bubbles:true}));if(Math.random()<0.05)key('keydown','Space');
      if(Math.random()<0.08)cv.dispatchEvent(new MouseEvent('mousedown',{button:2,clientX:s.x,clientY:s.y,bubbles:true}));
      cv.dispatchEvent(new MouseEvent(Math.random()<0.7?'mousedown':'mouseup',{button:0,clientX:s.x,clientY:s.y,bubbles:true}));if(Math.random()<0.3)window.dispatchEvent(new MouseEvent('mouseup',{button:0,bubbles:true}));}
    // in the colosseum prep: pick and ready
    const pr=document.getElementById('prep');if(!pr.hidden){const a=document.querySelector('#prepAugs .aug');if(a&&a.getAttribute('aria-pressed')!=='true')a.click();const rb=document.getElementById('readyBtn');if(!rb.disabled)rb.click();}
  },100);})()`;
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});const errs=[];
 const A=await ctx.newPage(),B=await ctx.newPage();
 for(const [n,pg] of [['host',A],['guest',B]]){pg.on('pageerror',e=>errs.push(n+': '+e.message+' '+(e.stack||'').split('\n')[1]));
   if(LAG)await pg.addInitScript(()=>{window.__netLag={ms:60,jitter:50,drop:0.1};});
   if(process.env.MOCK){await pg.addInitScript({path:'mockroom.js'});if(process.env.MOCK==='nojoin')await pg.addInitScript(()=>{window.__mockOpts={lag:90,jitter:60,joinFails:true};});}
   await pg.goto('http://localhost:8765/mp.html');await pg.waitForTimeout(800);await pg.click('.mtabs [data-go="play"]');await pg.click('.mode[data-m="online"]');}
 await A.click('.mapcard[data-v="'+MAP+'"]');await A.click('.card[data-k="mantis"]');await A.click('#hostBtn');await A.waitForTimeout(300);
 const code=await A.evaluate(()=>document.getElementById('onCode').textContent);
 await B.click('.card[data-k="blackjack"]');await B.fill('#joinCode',code);await B.click('#joinBtn');
 await A.waitForFunction(()=>!document.getElementById('onReady').disabled,null,{timeout:8000});await B.waitForFunction(()=>!document.getElementById('onReady').disabled,null,{timeout:8000});
 const lob=await B.evaluate(()=>document.getElementById('onPlayers').innerText.replace(/\n/g,' / '));
 await A.click('#onReady');await B.click('#onReady');
 await A.waitForFunction(()=>window.__riftline.G&&window.__NET.live,null,{timeout:8000});await B.waitForFunction(()=>window.__riftline.G&&window.__NET.live,null,{timeout:8000});
 console.log('link',await A.evaluate(()=>window.__NET.kind+' / '+document.getElementById('onTag').textContent),'code',code,'| guest lobby:',lob,'| map on guest',await B.evaluate(()=>window.__riftline.G.mode));
 await A.evaluate(DRIVER);await B.evaluate(DRIVER);
 for(const pg of [A,B])await pg.evaluate(()=>{setInterval(()=>{const v=window.__VIEW;window.__pdMax=Math.max(window.__pdMax||0,Math.hypot(v.pdx,v.pdy));},16);});
 const snap=pg=>pg.evaluate(()=>{const G=window.__riftline.G,N=window.__NET;return{pd:Math.round(Math.hypot(window.__VIEW.pdx,window.__VIEW.pdy)),pdMax:window.__pdMax|0,tick:G.tickN,t:+G.t.toFixed(1),over:G.over&&G.over.reason,me:G.player.name,champs:G.champs.map(c=>`${c.name} ${c.alive?'':'dead '}hp${c.hp|0} L${c.level} k${c.kills}`).join(' | '),wait:+N.waitT.toFixed(2),desync:N.desync,hashes:[...N.hashes.entries()],col:G.col?`r${G.col.round} ${G.col.wins} ${G.col.state}`:''};});
 const start=Date.now();let mism=0,cmp=0;
 while(Date.now()-start<SECS*1000){await A.waitForTimeout(10000);const a=await snap(A),bb=await snap(B);
   const hb=new Map(bb.hashes);for(const [t,h] of a.hashes)if(hb.has(t)){cmp++;if(hb.get(t)!==h)mism++;}
   const pr=await A.evaluate(()=>`rtt ${window.__NET.rtt|0}±${window.__NET.rttDev|0} dly ${window.__NET.dly} predicted lead now ${Math.round(Math.hypot(window.__VIEW.pdx,window.__VIEW.pdy))} max ${window.__pdMax|0}`);console.log(pr,`${((Date.now()-start)/1000)|0}s host tick ${a.tick} guest tick ${bb.tick} | ${a.champs} ${a.col} | host waited ${a.wait}s guest ${bb.wait}s | desync ${a.desync}/${bb.desync} | hash checks ${cmp} mismatches ${mism}${a.over?' | OVER '+a.over:''}`);
   if(a.over&&bb.over)break;}
 // rematch: both press it on the result screen
 const over=await A.evaluate(()=>!!window.__riftline.G.over);
 if(over){await A.waitForFunction(()=>!document.getElementById('over').hidden,null,{timeout:6000});await B.waitForFunction(()=>!document.getElementById('over').hidden,null,{timeout:6000});
   console.log('result host:',await A.evaluate(()=>document.getElementById('overTitle').textContent+' / '+document.getElementById('overReason').textContent),'| guest:',await B.evaluate(()=>document.getElementById('overTitle').textContent));
   await A.click('#againBtn');await B.click('#againBtn');
   await A.waitForFunction(()=>window.__NET.match.n===2&&window.__riftline.G&&!window.__riftline.G.over,null,{timeout:8000});await B.waitForFunction(()=>window.__NET.match.n===2&&window.__riftline.G&&!window.__riftline.G.over,null,{timeout:8000});
   await A.waitForTimeout(4000);const a=await snap(A),bb=await snap(B);console.log('rematch running: host tick',a.tick,'guest tick',bb.tick,'|',a.champs,a.col,'| desync',a.desync,bb.desync);}
 await A.screenshot({path:'mp_host.png'});await B.screenshot({path:'mp_guest.png'});
 console.log('errors',errs.slice(0,8));await b.close();})();
