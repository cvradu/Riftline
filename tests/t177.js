const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="viktor"]');await pg.click('.mapcard[data-v="lane"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(3000);
 for(let k=0;k<8;k++){
   const r=await pg.evaluate(k=>{const G=window.__riftline.G,p=G.player,o=G.bot;o.hp=o.maxHp=99999;p.hp=p.maxHp=99999;o.stunT=99;p.atkCd=0;p.wind=null;
     o.x=p.x+Math.cos(k*Math.PI/4)*140;o.y=p.y+Math.sin(k*Math.PI/4)*140;window.__sa(p,o);return !!p.atk;},k);
   const log=[];
   for(let j=0;j<14;j++){await pg.waitForTimeout(70);
     log.push(await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,f=window.__spr(p);const at=p.atk;return `${at?(G.t-at.start).toFixed(2):'-'}${p.wind?'w':''}:${f.S&&f.S.n===36?'A':f.S&&f.S.n===37?'I':'W'}${f.row}/${f.col}`;}));
     if(j===6)await pg.screenshot({path:`marty7/hit${k}.png`});}
   const hp=await pg.evaluate(()=>{const G=window.__riftline.G;return Math.round(G.bot.maxHp-G.bot.hp);});console.log(k,r,'dmg',hp,log.join(' '));await pg.evaluate(()=>{const G=window.__riftline.G;G.bot.hp=G.bot.maxHp;});
   await pg.waitForTimeout(600);}
 console.log('errors',errs);await b.close();})();
