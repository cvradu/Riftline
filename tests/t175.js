const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.screenshot({path:'marty5/home.png',clip:{x:700,y:80,width:700,height:300}});
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="lane"]');await pg.waitForTimeout(300);
 await pg.screenshot({path:'marty5/play.png'});
 await pg.click('#startBtn');await pg.waitForTimeout(3500);
 const box=await pg.evaluate(()=>{const G=window.__riftline.G;G.bot.x+=900;G.hold=true;const p=G.player;p.vx=p.vy=0;const s=window.__P(p.x,p.y);return s;});
 console.log('screen',JSON.stringify(box));
 for(let k=0;k<8;k++){await pg.evaluate(k=>{const G=window.__riftline.G,p=G.player;p.vx=p.vy=0;p.facing=k*Math.PI/4;},k);await pg.waitForTimeout(150);
   await pg.screenshot({path:`marty5/s${k}.png`,clip:{x:270,y:380,width:240,height:240}});}
 await pg.evaluate(()=>{const G=window.__riftline.G;G.hold=false;G.autoPlayer=true;});
 for(let k=0;k<3;k++){await pg.waitForTimeout(1800);await pg.screenshot({path:`marty5/g${k}.png`,clip:{x:420,y:200,width:600,height:500}});}
 console.log('errors',errs);await b.close();})();
