const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="lane"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(3500);
 for(const [dir,keys] of [['NW',['KeyW','KeyA']],['W',['KeyA']],['N',['KeyW']],['NE',['KeyW','KeyD']]]){
   await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;G.bot.x=p.x+1500;});
   await pg.mouse.move(720,450);for(const k of keys)await pg.keyboard.down(k);await pg.waitForTimeout(450);for(const k of keys)await pg.keyboard.up(k);
   const cols=[];
   for(let k=0;k<14;k++){await pg.waitForTimeout(k==0?200:600);
     cols.push(await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,f=window.__spr(p);return `${(G.t-p.mfStand0).toFixed(1)}s row${f.row} col${f.col} ${f.S&&f.S.n}`;}));
     await pg.screenshot({path:`marty6/i_${dir}${k}.png`,clip:{x:270,y:380,width:240,height:240}});}
   console.log(dir,cols.join(' | '));}
 console.log('errors',errs);await b.close();})();
