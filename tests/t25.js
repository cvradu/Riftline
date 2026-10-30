const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 // pick point and click in the menu
 await pg.click('#optScheme button[data-v="classic"]');
 await pg.screenshot({path:'menu.png'});
 await pg.click('.card >> nth=0');await pg.click('#startBtn');await pg.waitForTimeout(500);
 const st=()=>pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;return {x:p.x|0,y:p.y|0,order:p.order&&p.order.kind,keys:[...document.querySelectorAll('#slots .slot')].map(d=>d.querySelector('.key').textContent+':'+(d.style.order||''))};});
 console.log('start',JSON.stringify(await st()));
 // right click on the ground ahead
 await pg.mouse.move(900,350);await pg.mouse.down({button:'right'});await pg.mouse.up({button:'right'});
 await pg.waitForTimeout(150);await pg.screenshot({path:'click1.png'});
 console.log('after rclick',JSON.stringify(await st()));
 await pg.waitForTimeout(1500);console.log('1.5s later',JSON.stringify(await st()));
 // S stops
 await pg.mouse.down({button:'right'});await pg.mouse.up({button:'right'});await pg.waitForTimeout(200);await pg.keyboard.press('KeyS');const a=await st();await pg.waitForTimeout(500);console.log('stop',JSON.stringify(a),JSON.stringify(await st()));
 // camera unlock and edge pan
 await pg.keyboard.press('KeyY');const c0=await pg.evaluate(()=>0);
 await pg.mouse.move(1395,425);await pg.waitForTimeout(800);
 await pg.screenshot({path:'campan.png'});
 console.log('cam btn',await pg.textContent('#camBtn'));
 await pg.keyboard.press('KeyY');await pg.mouse.move(700,425);await pg.waitForTimeout(800);
 // W casts the RMB ability: learn it first
 await pg.keyboard.down('Shift');await pg.keyboard.press('KeyW');await pg.keyboard.up('Shift');
 const rk=await pg.evaluate(()=>window.__riftline.G.player.ranks.RMB);console.log('rank W',rk);
 await pg.keyboard.press('KeyW');await pg.waitForTimeout(400);console.log('W cd',await pg.evaluate(()=>window.__riftline.G.player.cds.RMB.toFixed(1)));
 // attack-move: hover near the enemy minions later; just check the flag and the cursor
 await pg.keyboard.press('KeyA');await pg.waitForTimeout(100);await pg.screenshot({path:'amove.png'});
 console.log('errors',errs);await b.close();})();
