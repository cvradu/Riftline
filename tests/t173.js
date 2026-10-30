const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.click('.mtabs [data-go="champs"]');await pg.waitForTimeout(300);await pg.click('.ctile[data-k="mantis"]');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>document.getElementById('cdAbTabs').scrollIntoView());await pg.waitForTimeout(1500);await pg.screenshot({path:'mantis/icons_page.png',clip:{x:120,y:0,width:1200,height:520}});
 await pg.click('.mtabs [data-go="play"]');await pg.waitForTimeout(200);await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="mantis"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(900);
 await pg.screenshot({path:'mantis/icons_hud.png',clip:{x:560,y:740,width:520,height:160}});
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;p.level=9;p.ranks.Q=1;p.isBot=true;p.pvCtl=c=>{c.input.ax=o.x;c.input.ay=o.y;};o.stunT=1e9;o.hp=o.maxHp=9000;const out=[];
   for(const [dx,hold] of [[240,0],[440,70],[500,70]]){p.x=2500;p.y=650;o.x=2500+dx;o.y=650;p.cds.Q=0;const h=o.hp;window.__tc(p,'Q',o.x,o.y);for(let i=0;i<hold;i++)R.tick(1/60);p.qUp=true;for(let i=0;i<30;i++)R.tick(1/60);out.push(`target ${dx} away, held ${(hold/60).toFixed(1)}s: dmg ${(h-o.hp).toFixed(0)}`);}
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
