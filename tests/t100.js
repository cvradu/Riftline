// lane pathing: grid connectivity, then many walks between random spots with and without pathing
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 const r=await pg.evaluate(()=>{const R=window.__riftline,L=window.__LN;document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;
   const t0=performance.now();const N=L.lnavBuild();const tb=performance.now()-t0;
   // components
   const comp=new Int32Array(N.nx*N.ny).fill(-1);const sizes=[];
   for(let k=0;k<comp.length;k++){if(!N.ok[k]||comp[k]>=0)continue;const id=sizes.length;let n=0;const st=[k];comp[k]=id;
     while(st.length){const c=st.pop();n++;const i=c%N.nx,j=(c-i)/N.nx;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=N.nx||jj>=N.ny)continue;const kk=jj*N.nx+ii;if(N.ok[kk]&&comp[kk]<0){comp[kk]=id;st.push(kk);}}}
     sizes.push(n);}
   // walks
   let seed=7;const rn=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
   const pts=[];const big=sizes.indexOf(Math.max(...sizes));
   while(pts.length<400){const k=Math.floor(rn()*comp.length);if(comp[k]!==big)continue;const x=N.x0+(k%N.nx+rn())*N.cs,y=N.y0+(Math.floor(k/N.nx)+rn())*N.cs;const q=L.clampWalk(x,y,31);pts.push(q);}
   function walk(a,g,smart){const u={x:a.x,y:a.y,r:31,nav:null};let tt=0;for(let i=0;i<60*25;i++){G.tickN++;
       let v;if(smart)v=L.laneSteer(u,g.x,g.y);else{const dx=g.x-u.x,dy=g.y-u.y,l=Math.hypot(dx,dy)||1;v={x:dx/l,y:dy/l};}
       const d=Math.hypot(g.x-u.x,g.y-u.y);if(d<20)return i/60;const s=Math.min(d,340/60);u.x+=v.x*s;u.y+=v.y*s;const q=L.clampWalk(u.x,u.y,u.r);u.x=q.x;u.y=q.y;}
     return -1;}
   const res={smart:{fail:0,t:0},dumb:{fail:0,t:0}};const fails=[];let tp=0,np=0;
   for(let i=0;i<200;i++){const a=pts[2*i],g=pts[2*i+1];
     const t1=performance.now();const ts=walk(a,g,true);tp+=performance.now()-t1;np++;
     const td=walk(a,g,false);
     if(ts<0){res.smart.fail++;fails.push([a,g]);}else res.smart.t+=ts;if(td<0)res.dumb.fail++;else res.dumb.t+=td;}
   return {grid:[N.nx,N.ny],build:tb.toFixed(1),walk:sizes.reduce((a,b)=>a+b,0),comps:sizes.sort((a,b)=>b-a).slice(0,8),res,fails:fails.slice(0,5),msPerWalk:(tp/np).toFixed(2),ok:Array.from(N.ok),x0:N.x0,y0:N.y0,cs:N.cs};});
 require('fs').writeFileSync('lnav.json',JSON.stringify({ok:r.ok,nx:r.grid[0],ny:r.grid[1],x0:r.x0,y0:r.y0,cs:r.cs}));delete r.ok;
 console.log(JSON.stringify(r,null,0));console.log('errors',errs);await b.close();})();
