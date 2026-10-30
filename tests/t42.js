const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 await pg.click('#optMap button[data-v="col"]');
 for(const pick of [0,1,0,1])console.log(await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();
   document.querySelector('#optMap button[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const st={rounds:[],breaks:0,beads:0,hiddenT:{},stormDmgT:0,maxT:0};let pb=0,lastRound=0,prevBeads=0;
   for(const c of G.champs)st.hiddenT[c.name]=0;
   for(let i=0;i<60*600;i++){R.tick(1/60);if(G.over&&G.overShown)break;if(G.over){continue;}
     const C=G.col;if(C.beads.length>prevBeads)st.breaks++;prevBeads=C.beads.length;
     for(const c of G.champs)if(c.hidden)st.hiddenT[c.name]+=1/60;
     if(C.state==='fight')st.maxT=Math.max(st.maxT,C.t);
     if(C.state==='over'&&C.round!==lastRound&&C.stateT>2.7){lastRound=C.round;st.rounds.push(`R${C.round}:${G.champs.filter(c=>c.alive).map(c=>c.name).join('+')||'draw'}@${C.t|0}s`);}
   }
   return `${G.player.name} vs ${G.bot.name}: over=${!!G.over} winner=${G.over?G.champs.find(c=>c.team===G.over.team).name:'-'} wins=${G.col.wins} rounds=[${st.rounds.join(', ')}] hidden=${JSON.stringify(Object.fromEntries(Object.entries(st.hiddenT).map(([k,v])=>[k,v|0])))} longest=${st.maxT|0}s plantBreaks=${st.breaks}`;},pick));
 console.log('errors',errs);await b.close();})();
