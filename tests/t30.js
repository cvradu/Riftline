const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(300);
 await pg.mouse.move(700,400);await pg.waitForTimeout(100);
 const t0=await pg.evaluate(()=>document.getElementById('cur').style.transform);
 const v=await pg.evaluate(()=>{const cv=document.getElementById('game');Object.defineProperty(document,'pointerLockElement',{configurable:true,get:()=>cv});
   dispatchEvent(new MouseEvent('mousemove',{movementX:100,movementY:40}));return 1;});
 await pg.waitForTimeout(100);
 const t1=await pg.evaluate(()=>document.getElementById('cur').style.transform);
 console.log(t0,'->',t1,'(100% speed)');
 console.log('errors',errs);await b.close();})();
