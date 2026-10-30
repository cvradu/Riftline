const {chromium}=require('playwright');
const Z=+(process.argv[2]||0.3);
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.addInitScript(z=>{window.__zoom=z;},Z);
 await pg.goto('file://'+process.cwd()+'/site/zoom.html');await pg.waitForTimeout(1500);
 await pg.screenshot({path:'lane_menu.png',clip:{x:0,y:150,width:1600,height:250}});
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="viktor"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};G.autoPlayer=true;T(60*40);G.autoPlayer=false;
   p.x=3200;p.y=650;document.getElementById('banner').hidden=true;G.paused=true;document.getElementById('pause').hidden=true;
   return `minions ${G.minions.filter(m=>m.alive).length}, relics ${G.relics.map(r=>r.active)}, towers ${G.towers.map(t=>t.x)}`;}));
 await pg.waitForTimeout(800);await pg.screenshot({path:'lane_over.png'});
 console.log('errors',errs);await b.close();})();
