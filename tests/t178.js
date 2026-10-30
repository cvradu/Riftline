const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="viktor"]');await pg.click('.mapcard[data-v="lane"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(3000);
 const st=()=>pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,f=window.__spr(p);return `face ${(p.facing*180/Math.PI).toFixed(0)} row ${f.row} col ${f.col} ${f.S&&f.S.n===36?'atk':f.S&&f.S.n===37?'idle':'walk'}`;});
 // 1) walking: facing follows the keys even with the mouse far to the right
 await pg.mouse.move(1300,450);
 for(const ks of [['KeyW'],['KeyA'],['KeyS'],['KeyD'],['KeyW','KeyA']]){for(const k of ks)await pg.keyboard.down(k);await pg.waitForTimeout(350);const s=await st();for(const k of ks)await pg.keyboard.up(k);console.log('walk',ks.join('+'),s);}
 await pg.waitForTimeout(300);console.log('stopped after W+A:',await st());
 // 2) attack toward a foe placed left of Marty while holding D (walking right): faces the foe during the swing, the keys after
 const hitlog=await pg.evaluate(async()=>{const G=window.__riftline.G,p=G.player,o=G.bot;o.hp=o.maxHp=99999;o.stunT=99;o.x=p.x-150;o.y=p.y;p.atkCd=0;window.__sa(p,o);
   const W=p.atk.W;return {W:+W.toFixed(3)};});
 const seq=[];let hp0=await pg.evaluate(()=>window.__riftline.G.bot.hp);
 for(let j=0;j<20;j++){await pg.waitForTimeout(50);seq.push(await pg.evaluate((hp0)=>{const G=window.__riftline.G,p=G.player,f=window.__spr(p),e=G.t-p.atk.start;return `${e.toFixed(2)}${G.bot.hp<hp0?'!':''}:${f.S&&f.S.n===36?'A':'-'}${f.row}/${f.col}`;},hp0));}
 console.log('attack W',hitlog.W,seq.join(' '));
 // 3) point-and-click: W = utility (Ink Tank, RMB slot), E = movement (Ballast Charge)
 const r=await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;window.__setScheme=1;return 1;});
 await pg.evaluate(()=>{SET.scheme='classic';applySettings&&applySettings();const p=window.__riftline.G.player;p.ranks.RMB=1;p.ranks.E=1;p.cds.RMB=0;p.cds.E=0;p.cast=null;p.wind=null;p.atk=null;});
 await pg.mouse.move(900,450);await pg.keyboard.press('KeyW');await pg.waitForTimeout(500);
 console.log('classic W ->',await pg.evaluate(()=>{const p=window.__riftline.G.player;return `RMB cd ${p.cds.RMB.toFixed(1)} E cd ${p.cds.E.toFixed(1)} ink ${p.mfInk?1:0}`;}));
 await pg.keyboard.press('KeyE');await pg.waitForTimeout(300);
 console.log('classic E ->',await pg.evaluate(()=>{const p=window.__riftline.G.player;return `RMB cd ${p.cds.RMB.toFixed(1)} E cd ${p.cds.E.toFixed(1)} dash ${p.dash?p.dash.kind:'-'}`;}));
 console.log('hud keys',await pg.evaluate(()=>[...document.querySelectorAll('.slot .key')].map(e=>e.textContent+':'+getComputedStyle(e.parentElement).order).join(' ')));
 console.log('errors',errs);await b.close();})();
