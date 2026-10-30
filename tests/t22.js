const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 for(const pick of [0,1,0])console.log(await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   const co=G.champs.find(c=>c.key==='cora');const st={Q:0,R1:0,R2:0,R3:0,rec:{},recDone:{},bleeds:0,stuck:0};let pq='hand',prs=null,pb=new Set();
   for(const c of G.champs){st.rec[c.name]=0;st.recDone[c.name]=0;}
   const pr={};let away=0;
   for(let i=0;i<60*600;i++){const before=G.champs.map(c=>[c.x,c.y]);R.tick(1/60);if(G.over)break;
     const s=co.axes.Q.state;if(pq==='hand'&&s==='flying'&&!co.rSeq)st.Q++;pq=s;
     const rs=co.rSeq?co.rSeq.state:null;if(rs!==prs){if(rs==='one')st.R1++;if(rs==='two')st.R2++;if(rs==='dash1')st.R3++;}prs=rs;
     for(const c of G.champs){if(c.recall&&!pr[c.name])st.rec[c.name]++;if(pr[c.name]&&!c.recall&&c.alive&&Math.abs(c.x-(c.team?6150-80:250+80))<5)st.recDone[c.name]++;pr[c.name]=!!c.recall;}
     for(const u of [...G.champs,...G.minions])if(u.bleed&&!pb.has(u)){st.bleeds++;}pb=new Set([...G.champs,...G.minions].filter(u=>u.bleed));
     if(co.alive&&(co.axes.Q.state!=='hand'||co.axes.RMB.state!=='hand')){away+=1/60;if(away>9)st.stuck++;}else away=0;}
   return `${G.player.name} vs ${G.bot.name} t=${G.t|0} score ${G.score} lvl ${G.player.level}/${G.bot.level} | Q ${st.Q} R ${st.R1}/${st.R2}/${st.R3} bleeds ${st.bleeds} recall ${JSON.stringify(st.rec)} done ${JSON.stringify(st.recDone)} stuck ${st.stuck}`;},pick));
 console.log('errors',errs);await b.close();})();
