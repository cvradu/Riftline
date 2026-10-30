const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="cora"]').click();document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};for(let i=0;i<60*60&&G.col.state!=="fight";i++)R.tick(1/60);G.autoPlayer=false;const p=G.player,o=G.bot,K=window.__COL;o.stunT=999;o.x=K.cx+600;o.y=K.cy+600;
   const rk=K.rocks[0],a=Math.atan2(rk.y-K.cy,rk.x-K.cx);p.x=rk.x-Math.cos(a)*200;p.y=rk.y-Math.sin(a)*200;p.axes.Q={state:'hand',readyAt:0};p.cds.Q=0;
   const tx=rk.x+Math.cos(a)*200,ty=rk.y+Math.sin(a)*200;const rr=window.__tc(p,"Q",tx,ty);const st=["cast:"+rr+" ranks:"+JSON.stringify(p.ranks)+" state:"+G.col.state];for(let i=0;i<60;i++){T(1);if(i%6===0)st.push(p.axes.Q.state+":"+Math.hypot(p.axes.Q.x-p.x,p.axes.Q.y-p.y).toFixed(0)+"/"+Math.hypot(p.x-tx,p.y-ty).toFixed(0));}window.__st=st.join(" ");
   return window.__st+` | axe thrown across a ruin: landed ${Math.hypot(p.axes.Q.x-tx,p.axes.Q.y-ty)|0} units from the target (state ${p.axes.Q.state})`;}));
 console.log('errors',errs);await b.close();})();
