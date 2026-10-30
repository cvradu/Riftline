const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="col"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(2500);
 for(const [lbl,gap,hold] of [['tap close',150,0.05],['tap far',380,0.05],['half hold far',380,0.45],['full hold far',380,1.0],['full hold too far',520,1.0]]){
   const r=await pg.evaluate(([gap,hold])=>{const G=window.__riftline.G,p=G.player,o=G.bot,C=window.__COL;G.col.state='fight';
     p.hp=p.maxHp=99999;o.hp=o.maxHp=99999;o.stunT=99;o.dash=null;o.slows=[];p.ranks.Q=3;p.cds.Q=0;p.mq=null;p.cast=null;p.dash=null;
     p.x=C.cx-gap/2;p.y=C.cy;o.x=C.cx+gap/2;o.y=C.cy;p.isBot=true;p.pvCtl=c=>{c.input.ax=o.x;c.input.ay=o.y;c.input.mx=c.input.my=0;c.input.attack=false;};
     window.__tc(p,'Q',o.x,o.y);const d0=Math.hypot(o.x-p.x,o.y-p.y);let t=0;
     for(let i=0;i<120;i++){p.aimX=o.x;p.aimY=o.y;p.input.ax=o.x;p.input.ay=o.y;window.__riftline.tick(1/60);t+=1/60;if(t>=hold&&p.mq)p.qUp=true;}
     return `start gap ${d0|0} dmg ${Math.round(o.maxHp-o.hp)} end gap ${Math.hypot(o.x-p.x,o.y-p.y)|0}`;},[gap,hold]);
   console.log(lbl.padEnd(18),r);}
 console.log('errors',errs);await b.close();})();
