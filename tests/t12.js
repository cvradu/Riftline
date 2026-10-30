const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 for(const pick of [0,1]){
  console.log(await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   const co=G.champs.find(c=>c.key==='cora');const st={Q:0,RMB:0,E:0,R:0,catch:0,rdash:0,maxCorr:0,stuck:0,awayMax:0};let prevAx={Q:'hand',RMB:'hand'},prevR=null,awayT={Q:0,RMB:0};let prevChg=2;
   for(let i=0;i<60*480;i++){R.tick(1/60);if(G.over)break;
     for(const k of ['Q','RMB']){const s=co.axes[k].state;if(prevAx[k]==='hand'&&s==='flying')st[k]++;prevAx[k]=s;
       if(s!=='hand'){awayT[k]+=1/60;st.awayMax=Math.max(st.awayMax,awayT[k]);}else awayT[k]=0;}
     if((co.chg.E??2)<prevChg)st.E++;prevChg=co.chg.E??2;
     if(co.rSeq&&!prevR)st.R++;if(co.rSeq&&co.rSeq.state==='dash1'&&prevR!=='dash1')st.rdash++;prevR=co.rSeq?co.rSeq.state:null;
     st.maxCorr=Math.max(st.maxCorr,co.res);}
   return `${G.player.name} vs ${G.bot.name} t=${G.t|0} score ${G.score} lvl ${G.player.level}/${G.bot.level} cs ${G.player.cs}/${G.bot.cs} | Cora throws Q${st.Q} W${st.RMB} E-dashes ${st.E} R ${st.R} (dashed ${st.rdash}) maxCorr ${st.maxCorr|0} longest axe away ${st.awayMax.toFixed(1)}s`;},pick));
 }
 console.log('ERRORS',errs.slice(0,5));await b.close();
})();
