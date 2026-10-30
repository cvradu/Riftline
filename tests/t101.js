// walks between the lane centre, alcove crystals and towers, with and without pathing, plus full bot matches stuck check
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 const r=await pg.evaluate(()=>{const R=window.__riftline,L=window.__LN;document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;
   const rel=G.relics.map(p=>L.clampWalk(p.x,p.y,31));const spots=[...rel];
   for(let x=600;x<=5800;x+=400)for(const y of [380,650,920])spots.push(L.clampWalk(x,y,31));
   function walk(a,g,smart){const u={x:a.x,y:a.y,r:31,nav:null};for(let i=0;i<60*25;i++){G.tickN++;
       let v;if(smart)v=L.laneSteer(u,g.x,g.y);else{const dx=g.x-u.x,dy=g.y-u.y,l=Math.hypot(dx,dy)||1;v={x:dx/l,y:dy/l};}
       const d=Math.hypot(g.x-u.x,g.y-u.y);if(d<20)return i/60;const s=Math.min(d,340/60);u.x+=v.x*s;u.y+=v.y*s;const q=L.clampWalk(u.x,u.y,u.r);u.x=q.x;u.y=q.y;}
     return -1;}
   const out={smartFail:0,dumbFail:0,n:0,dumbStuck:[]};
   for(const r0 of rel)for(const s of spots){if(s===r0)continue;for(const [a,g] of [[r0,s],[s,r0]]){out.n++;if(walk(a,g,true)<0)out.smartFail++;if(walk(a,g,false)<0){out.dumbFail++;if(out.dumbStuck.length<4)out.dumbStuck.push([a.x|0,a.y|0,g.x|0,g.y|0]);}}}
   return out;});
 console.log(JSON.stringify(r));console.log('errors',errs);await b.close();})();
