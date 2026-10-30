const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log('menu opts',await pg.evaluate(()=>[...document.querySelectorAll('#menuCtl .opt label')].map(l=>l.textContent).join(' | ')));
 await pg.click('#menuCtl .seg[data-set="scheme"] button[data-v="classic"]');
 await pg.click('#menuCtl .seg[data-set="amove"] button[data-v="key"]');
 await pg.evaluate(()=>{const r=document.querySelector('#menuCtl input[data-set="sens"]');r.value=50;r.dispatchEvent(new Event('input'));});
 console.log('set',await pg.evaluate(()=>localStorage.getItem('riftline.settings')), await pg.evaluate(()=>[...document.querySelectorAll('output[data-out]')].map(o=>o.textContent).join(',')));
 await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(300);
 await pg.mouse.move(700,400);await pg.waitForTimeout(100);
 // click: tries pointer lock (headless will likely refuse)
 await pg.mouse.click(700,400);await pg.waitForTimeout(300);
 console.log('lockOK',await pg.evaluate(()=>typeof lockOK!=='undefined'?lockOK:'n/a'),'toast',await pg.textContent('#toast'));
 // simulate a captured mouse: movement scaled by 50%
 const v=await pg.evaluate(()=>{const cv=document.getElementById('game');Object.defineProperty(document,'pointerLockElement',{configurable:true,get:()=>cv});
   const m0=[window.__mx=0];dispatchEvent(new MouseEvent('mousemove',{movementX:100,movementY:40,clientX:0,clientY:0}));
   const cur=document.getElementById('cur');return cur.style.transform;});
 console.log('virtual cursor after +100,+40 at 50%:',v);
 // A only: pressing A issues an attack-move immediately
 await pg.evaluate(()=>{delete document.pointerLockElement;});
 await pg.mouse.move(1000,300);await pg.keyboard.press('KeyA');
 console.log('order after A',await pg.evaluate(()=>{const o=window.__riftline.G.player.order;return o&&o.kind;}));
 await pg.screenshot({path:'menu2.png'});
 await pg.keyboard.press('Escape');await pg.waitForTimeout(200);await pg.screenshot({path:'pause2.png'});
 await pg.evaluate(()=>localStorage.clear());
 console.log('errors',errs);await b.close();})();
