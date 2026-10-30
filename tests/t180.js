const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.evaluate(()=>localStorage.setItem('riftline.settings',JSON.stringify({scheme:'classic',cursor:'hand',amove:'click',sens:100,cam:100,lead:'low'})));
 await pg.reload();await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="lane"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(2500);
 await pg.evaluate(()=>{const p=window.__riftline.G.player;p.ranks.RMB=1;p.ranks.E=1;p.cds.RMB=0;p.cds.E=0;});
 await pg.mouse.move(900,450);await pg.keyboard.press('KeyW');await pg.waitForTimeout(600);
 console.log('W ->',await pg.evaluate(()=>{const p=window.__riftline.G.player;return `utility(RMB) cd ${p.cds.RMB.toFixed(1)} movement(E) cd ${p.cds.E.toFixed(1)}`;}));
 await pg.keyboard.press('KeyE');await pg.waitForTimeout(200);
 console.log('E ->',await pg.evaluate(()=>{const p=window.__riftline.G.player;return `utility(RMB) cd ${p.cds.RMB.toFixed(1)} movement(E) cd ${p.cds.E.toFixed(1)} dash ${p.dash?p.dash.kind:'-'}`;}));
 console.log('hud',await pg.evaluate(()=>[...document.querySelectorAll('.slot')].filter(e=>e.querySelector('.key')).map(e=>e.querySelector('.key').textContent+'@'+getComputedStyle(e).order).join(' ')));
 console.log('help',await pg.evaluate(()=>document.getElementById('keysList')?document.getElementById('keysList').innerText.split('\n').filter(l=>/Q · W/.test(l)||/utility/.test(l)).join(' | '):''));
 await pg.evaluate(()=>localStorage.removeItem('riftline.settings'));
 console.log('errors',errs);await b.close();})();
