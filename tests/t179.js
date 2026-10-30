const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(300);
 await pg.click('.card[data-k="marty"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('.mapcard[data-v="col"]');await pg.waitForTimeout(300);
 await pg.click('#startBtn');await pg.waitForTimeout(2500);
 // a) open ground: foe 250 units ahead, charge through, they should be carried and released, not stunned
 // b) foe in front of the arena wall: carried into it and stunned
 for(const [lbl,setup] of [['open',0],['wall',1]]){
   const r=await pg.evaluate(async(w)=>{const G=window.__riftline.G,p=G.player,o=G.bot,C=window.__COL;G.col.state='fight';
     p.hp=p.maxHp=99999;o.hp=o.maxHp=99999;o.stunT=0;o.dash=null;p.ranks.E=3;p.cds.E=0;p.dash=null;p.cast=null;
     let ang;if(!w){p.x=C.cx-300;p.y=C.cy;o.x=C.cx-50;o.y=C.cy;ang=0;}else{
       // a spoke with no rocks between radius 300 and the wall
       let best=0;for(let k=0;k<72;k++){const a=k*Math.PI/36;let ok=true;for(const q of C.rocks){for(let d=300;d<C.R;d+=20){if(Math.hypot(C.cx+Math.cos(a)*d-q.x,C.cy+Math.sin(a)*d-q.y)<q.r+80)ok=false;}}if(ok){best=a;break;}}
       ang=best;const R=C.R;p.x=C.cx+Math.cos(ang)*(R-560);p.y=C.cy+Math.sin(ang)*(R-560);o.x=C.cx+Math.cos(ang)*(R-330);o.y=C.cy+Math.sin(ang)*(R-330);}
     o.input.mx=o.input.my=0;o.isBot=false;o.botOff=true;
     window.__tc(p,'E',p.x+Math.cos(ang)*600,p.y+Math.sin(ang)*600);
     const out=[];const x0=o.x;
     for(let i=0;i<70;i++){window.__riftline.tick(1/60);if(i%6===0)out.push(`${Math.hypot(o.x-x0,o.y-(w?o.y:o.y))|0}/${Math.round(Math.hypot(o.x-C.cx,o.y-C.cy))}${o.dash?'k':''}${o.stunT>0?'S'+o.stunT.toFixed(2):''}${p.dash?'':'·'}`);}
     const q={x:C.cx+430+94,y:C.cy,r:o.r};return {R:C.R,ox:Math.round(o.x-C.cx),out:out.join(' ')};},setup);
   console.log(lbl,JSON.stringify(r));}
 console.log('errors',errs);await b.close();})();
