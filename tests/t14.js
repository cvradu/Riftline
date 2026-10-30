const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 for(const pick of [0,1]){
  console.log(await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   const co=G.champs.find(c=>c.key==='cora');const st={Q:0,recall:0,W:0,E:0,R:0,maxCorr:0,stuck:0};let prev={Q:'hand',RMB:'hand'},prevE=0,prevR=null,away=0;
   for(let i=0;i<60*480;i++){R.tick(1/60);if(G.over)break;
     const q=co.axes.Q.state;if(prev.Q==='hand'&&q==='flying')st.Q++;if((prev.Q==='ground'||prev.Q==='flying')&&q==='returning'&&G.projs.some(p=>p.sweep))st.recall++;prev.Q=q;
     if(co.cds.RMB>(st._pr||0)+1)st.W++;st._pr=co.cds.RMB;
     if((co.chg.E??2)<(st._pe??2))st.E++;st._pe=co.chg.E??2;if(co.rSeq&&!prevR)st.R++;prevR=co.rSeq;st.maxCorr=Math.max(st.maxCorr,co.res);
     if(co.alive&&q!=='hand'){away+=1/60;if(away>6.5)st.stuck++;}else away=0;}
   return `${G.player.name} vs ${G.bot.name} t=${G.t|0} score ${G.score} lvl ${G.player.level}/${G.bot.level} cs ${G.player.cs}/${G.bot.cs} | Cora Q ${st.Q} recalls ${st.recall} fissure ${st.W} E-dash ${st.E} R ${st.R} maxCorr ${st.maxCorr|0} stuckTicks ${st.stuck}`;},pick));
 }
 // showcase
 await pg.evaluate(()=>{document.querySelectorAll('#menu .card')[0].click();const R=window.__riftline;R.newGame();const G=R.G;G.killsToWin=99;const p=G.player,bt=G.bot;
   p.x=2900;p.y=650;bt.x=3180;bt.y=600;for(const c of [p,bt]){c.ranks={Q:3,E:3,RMB:3,R:1};c.points=0;c.level=9;}G.relics.forEach(r=>r.at=1e9);G.nextWave=1e9;
   window.__frozen=bt;setInterval(()=>{bt.stunT=0.5;bt.input.attack=false;},50);});
 const clip={x:380,y:150,width:840,height:520};const snap=n=>pg.screenshot({path:n,clip});
 await pg.mouse.move(1180,300);await pg.waitForTimeout(300);
 await pg.keyboard.press('KeyQ');await pg.waitForTimeout(700);await snap('rq1.png');
 const hp0=await pg.evaluate(()=>window.__frozen.hp|0);
 await pg.mouse.move(700,560);await pg.keyboard.press('KeyQ');await pg.waitForTimeout(110);await snap('rq2.png');await pg.waitForTimeout(400);
 const hp1=await pg.evaluate(()=>window.__frozen.hp|0);
 await pg.mouse.move(1180,300);await pg.keyboard.press('KeyE');await pg.waitForTimeout(380);await snap('re1.png');await pg.waitForTimeout(300);await snap('re2.png');
 const hp2=await pg.evaluate(()=>window.__frozen.hp|0);
 console.log('foe hp after throw',hp0,'after recall',hp1,'after fissure',hp2, await pg.evaluate(()=>JSON.stringify({q:window.__riftline.G.player.axes.Q.state,cleave:!!window.__riftline.G.player.cleaveReady})));
 console.log('ERRORS',errs.slice(0,5));await b.close();
})();
