const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="cora"]');await pg.click('#optFoe button[data-v="viktor"]');await pg.click('.mapcard[data-v="col"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(2500);
 const run=(fn)=>pg.evaluate(fn);
 // 1) rush through a foe 200 away, aiming 150 past them
 console.log('rush',await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,o=G.bot,C=window.__COL;G.col.state='fight';
   p.hp=p.maxHp=99999;o.hp=o.maxHp=99999;o.stunT=99;p.ranks.E=3;p.ranks.Q=3;p.cds.E=0;p.dash=null;p.cast=null;p.isBot=true;p.pvCtl=c=>{c.input.mx=c.input.my=0;c.input.attack=false;};
   p.x=C.cx-200;p.y=C.cy;o.x=C.cx;o.y=C.cy;const ok=window.__tc(p,'E',o.x+150,o.y);const x0=p.x;
   for(let i=0;i<40;i++)window.__riftline.tick(1/60);
   return `cast ${ok} moved ${Math.round(p.x-x0)} foe dmg ${Math.round(o.maxHp-o.hp)} bleed ${!!o.bleed} corr ${p.res|0}`;}));
 // 2) throw the axe, then rush aimed near it: dash to it and catch it
 console.log('axe',await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,o=G.bot,C=window.__COL;
   p.cds.E=0;p.cds.Q=0;p.dash=null;p.x=C.cx-300;p.y=C.cy+250;o.x=C.cx+400;o.y=C.cy-300;
   window.__tc(p,'Q',p.x+500,p.y);for(let i=0;i<70;i++)window.__riftline.tick(1/60);const q=p.axes.Q;const st0=q.state,qx=Math.round(q.x-p.x);
   p.cds.E=0;const ok=window.__tc(p,'E',q.x+80,q.y+60);for(let i=0;i<40;i++)window.__riftline.tick(1/60);
   return `axe ${st0} ${qx} ahead; rush ${ok}; axe now ${q.state}, cleave ${!!p.cleaveReady}, gap to where it lay ${Math.round(Math.hypot(p.x-(q.x||0),p.y-(q.y||0)))}`;}));
 // 3) rush aimed away from a grounded axe: normal rush
 console.log('away',await pg.evaluate(()=>{const G=window.__riftline.G,p=G.player,C=window.__COL;
   p.cds.E=0;p.cds.Q=0;p.dash=null;p.x=C.cx-300;p.y=C.cy+250;window.__tc(p,'Q',p.x+500,p.y);for(let i=0;i<70;i++)window.__riftline.tick(1/60);
   const q=p.axes.Q,x0=p.x,y0=p.y;p.cds.E=0;window.__tc(p,'E',p.x,p.y-600);for(let i=0;i<40;i++)window.__riftline.tick(1/60);
   return `axe ${q.state}; moved dx ${Math.round(p.x-x0)} dy ${Math.round(p.y-y0)}`;}));
 console.log('errors',errs);await b.close();})();
