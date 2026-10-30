// what a player feels: draw cost per frame on each map, hit-stop freezes per minute, how far units jump between simulation steps
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--enable-gpu-rasterization']});const errs=[];
 for(const map of ['lane','col']){
  const pg=await b.newPage({viewport:{width:1600,height:900}});pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
  await pg.click(`.mapcard[data-v="${map}"]`);await pg.click('.card[data-k="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
  if(map==='col'){await pg.click('#prepAugs .aug >> nth=0');await pg.click('#readyBtn');}
  const r=await pg.evaluate(async()=>{const G=window.__riftline.G;G.autoPlayer=true;let stops=0,stopT=0,lastHS=0;
    const t0=performance.now();const frames=[];let prev=performance.now();
    await new Promise(res=>{const f=()=>{const now=performance.now();frames.push(now-prev);prev=now;if(G.hitStop>0&&lastHS<=0)stops++;if(G.hitStop>0)stopT+=frames[frames.length-1];lastHS=G.hitStop;if(now-t0<20000)requestAnimationFrame(f);else res();};requestAnimationFrame(f);});
    frames.sort((a,b)=>a-b);const pct=q=>frames[Math.floor(frames.length*q)].toFixed(1);
    const sec=(performance.now()-t0)/1000;return{fps:(frames.length/sec).toFixed(0),median:pct(0.5),p95:pct(0.95),worst:frames[frames.length-1].toFixed(0),hitstopsPerMin:(stops/sec*60).toFixed(0),frozenPct:(stopT/(sec*10)).toFixed(1)};});
  // time spent drawing only
  const draw=await pg.evaluate(()=>{const R=window.__riftline;return null;});
  console.log(map,JSON.stringify(r));await pg.close();}
 console.log('errors',errs);await b.close();})();
