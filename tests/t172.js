const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="mantis"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;p.level=9;p.ranks.Q=1;p.points=0;p.x=2500;p.y=650;o.x=3050;o.y=650;o.stunT=1e9;o.hp=o.maxHp=9000;});
 await pg.waitForTimeout(500);
 const sp=await pg.evaluate(()=>{const o=window.__riftline.G.bot,q=window.__P(o.x,o.y);const cv=document.querySelector('canvas').getBoundingClientRect();return {x:q.x+cv.left,y:q.y+cv.top-30};});
 await pg.mouse.move(sp.x,sp.y);await pg.mouse.click(sp.x,sp.y);await pg.waitForTimeout(100);
 const res=[];
 for(const hold of [80,500,1100]){
   await pg.evaluate(()=>{const G=window.__riftline.G;G.player.cds.Q=0;G.player.x=2500;G.player.y=650;window.__h0=G.bot.hp;});
   await pg.keyboard.down('KeyQ');await pg.waitForTimeout(hold);const charging=await pg.evaluate(()=>!!window.__riftline.G.player.mq);await pg.keyboard.up('KeyQ');await pg.waitForTimeout(700);
   res.push(await pg.evaluate(([hold,charging])=>{const G=window.__riftline.G;return `hold ${hold}ms: charging while held ${charging}, released ${!G.player.mq}, dmg to Cora 550 away ${(window.__h0-G.bot.hp).toFixed(0)}`;},[hold,charging]));}
 console.log(res.join('\n'));console.log('errors',errs);await b.close();})();
