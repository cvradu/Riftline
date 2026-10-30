const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 for(const pick of [0,1])console.log(await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   const co=G.champs.find(c=>c.key==='cora');const st={throws:0,recalls:0,picks:0,E:0,fiss:0,R:0,noAxeT:0,stuck:0};let prev={Q:'hand',RMB:'hand'},pe=2,pr=0,prR=null,away={Q:0,RMB:0};
   for(let i=0;i<60*480;i++){R.tick(1/60);if(G.over)break;
     for(const k of ['Q','RMB']){const s=co.axes[k].state;if(prev[k]==='hand'&&s==='flying')st.throws++;if(prev[k]!=='returning'&&s==='returning'&&G.projs.some(p=>p.sweep))st.recalls++;if(prev[k]==='ground'&&s==='hand'&&!co.dash)st.picks++;prev[k]=s;
       if(co.alive&&s!=='hand'){away[k]+=1/60;if(away[k]>6.5)st.stuck++;}else away[k]=0;}
     if((co.chg.E??2)<pe)st.E++;pe=co.chg.E??2;if(co.cds.RMB>pr+1)st.fiss++;pr=co.cds.RMB;if(co.rSeq&&!prR)st.R++;prR=co.rSeq;if(co.alive&&axesInHandCount(co)===0)st.noAxeT+=1/60;}
   function axesInHandCount(c){return (c.axes.Q.state==='hand')+(c.axes.RMB.state==='hand');}
   return `${G.player.name} vs ${G.bot.name} t=${G.t|0} score ${G.score} lvl ${G.player.level}/${G.bot.level} cs ${G.player.cs}/${G.bot.cs} | throws ${st.throws} recalls ${st.recalls} walk-pickups ${st.picks} E ${st.E} fissures ${st.fiss} R ${st.R} time with no axe ${st.noAxeT.toFixed(0)}s stuck ${st.stuck}`;},pick));
 console.log('ERRORS',errs);await b.close();
})();
