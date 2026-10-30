const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="cora"]').click();document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G,p=G.player,o=G.bot,out=[];
   const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};G.autoPlayer=false;o.stunT=1e9;o.x=6000;o.y=650;
   // walk hard in 8 directions from several spots; report the farthest point reached and whether it is still on the deck (checked with a dash so movement code clamps)
   const spots=[[700,650],[1700,650],[3200,650],[3300,-150],[3100,1600],[4800,650],[5600,650],[250,650],[2200,150],[4200,1250]];let bad=0,n=0;
   for(const [x,y] of spots)for(let k=0;k<8;k++){const a=k*Math.PI/4;p.x=x;p.y=y;p.dash=null;p.input.mx=Math.cos(a);p.input.my=Math.sin(a);
     for(let i=0;i<120;i++){p.input.mx=Math.cos(a);p.input.my=Math.sin(a);p.dashCd=0;T(1);}n++;
     // a point is fine when it is within a few units of the deck outline
     const ok=window.__laneOk?window.__laneOk(p.x,p.y):true;if(!ok)bad++;}
   out.push(`walk tests ${n}, off-deck ${bad}, alive ${p.alive}`);p.alive=true;p.hp=p.maxHp;
   // brush A
   p.x=2200;p.y=150;p.input.mx=p.input.my=0;o.x=2200;o.y=800;o.stunT=1e9;T(3);out.push(`in brush: bush ${p.bush} hidden ${p.hidden}; foe 455 away sees? ${!p.hidden}`);
   o.x=2240;o.y=290;T(3);out.push(`foe walks up within 170: hidden ${p.hidden}`);
   // crystal
   G.t=70;for(const r of G.relics)r.at=0;T(2);const r0=G.relics[0];p.hp=200;p.x=r0.x;p.y=r0.y+20;T(5);out.push(`crystal A at ${r0.x},${r0.y}: picked ${!r0.active}, hp now ${p.hp|0}`);
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
