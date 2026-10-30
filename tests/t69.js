const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="cora"]').click();document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};for(let i=0;i<60*60&&G.col.state!=="fight";i++)R.tick(1/60);G.autoPlayer=false;const p=G.player,o=G.bot,K=window.__COL,C=G.col,out=[];o.stunT=999;
   T(60*9);out.push(`portals ready ${C.portalReady} at t=${C.t.toFixed(1)}`);
   for(const [a,bb] of [[2,3],[0,1]]){C.portalReady=[0,0];p.order=null;const q=K.portals[a],d=K.portals[bb];p.x=q.x;p.y=q.y;T(2);out.push(`portal ${a}->${bb}: ${Math.hypot(p.x-d.x,p.y-d.y)|0} from the far pad, inside floor ${Math.hypot(p.x-K.cx,p.y-K.cy)<K.rb[0]}`);}
   // brush: each garden hides
   o.x=K.cx+600;o.y=K.cy-600;for(let g=0;g<4;g++){const b2=K.bushes.find(x=>x.g===g);p.x=b2.x;p.y=b2.y;T(2);out.push(`garden ${g}: bush ${p.bush} hidden ${p.hidden}`);}
   // ruins block walking
   const rk=K.rocks[0];p.x=rk.x-150;p.y=rk.y;p.order=null;p.input.mx=1;p.input.my=0;for(let i=0;i<90;i++){p.x+=6;window.__COL&&0;T(1);}
   out.push(`walked into ruin: distance from its centre ${Math.hypot(p.x-rk.x,p.y-rk.y)|0} (radius ${rk.r})`);
   // walls: try to walk out in 8 directions
   for(let k=0;k<8;k++){const a=k*Math.PI/4;p.x=K.cx+Math.cos(a)*900;p.y=K.cy+Math.sin(a)*900;for(let i=0;i<60;i++){p.x+=Math.cos(a)*10;p.y+=Math.sin(a)*10;T(1);}
     out.push(`dir ${k*45}: stopped at r=${Math.hypot(p.x-K.cx,p.y-K.cy)|0}`);}
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
