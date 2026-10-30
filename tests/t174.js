const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.screenshot({path:'marty4/shots/home.png'});
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="viktor"]');await pg.click('.mapcard[data-v="lane"]');await pg.waitForTimeout(300);
 await pg.screenshot({path:'marty4/shots/play.png'});
 await pg.click('#startBtn');await pg.waitForTimeout(3500);
 await pg.evaluate(()=>{const G=window.__riftline.G;G.autoPlayer=true;});
 for(let k=0;k<5;k++){await pg.waitForTimeout(2200);await pg.screenshot({path:`marty4/shots/g${k}.png`,clip:{x:420,y:200,width:600,height:500}});}
 // walk him around in a circle by hand so every direction row shows
 await pg.evaluate(()=>{const G=window.__riftline.G;G.autoPlayer=false;const p=G.player;p.hp=p.maxHp=99999;G.bot.x=p.x+600;});
 for(let k=0;k<8;k++){await pg.evaluate(k=>{const G=window.__riftline.G,p=G.player,a=k*Math.PI/4;p.input=p.input||{};window.__dir=a;},k);
   await pg.evaluate(k=>{const G=window.__riftline.G,p=G.player,a=k*Math.PI/4;const tx=p.x+Math.cos(a)*300,ty=p.y+Math.sin(a)*300;if(p.input){p.input.moveTo={x:tx,y:ty};}p.order={kind:'move',x:tx,y:ty};p.dest={x:tx,y:ty};},k);
   await pg.waitForTimeout(260);await pg.screenshot({path:`marty4/shots/w${k}.png`,clip:{x:520,y:250,width:400,height:400}});}
 console.log('errors',errs);await b.close();})();
