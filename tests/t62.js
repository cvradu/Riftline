const {chromium}=require('playwright');
const [A,B,N]=[process.argv[2],process.argv[3],+(process.argv[4]||2)];
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);const out=[];
 for(let m=0;m<N;m++){const [pk,fk]=m%2?[B,A]:[A,B];
  out.push(await pg.evaluate(([pk,fk])=>{const R=window.__riftline;document.querySelector(`.card[data-k="${pk}"]`).click();document.querySelector(`#optFoe button[data-v="${fk}"]`).click();
    document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;const st={portal:0,events:{},beads:0};const rounds=[];let last=0,pr=null,pe=null;
    for(let i=0;i<60*900;i++){R.tick(1/60);if(G.over&&G.overShown)break;const C=G.col;if(!C.portalReady)continue;
      const k=C.portalReady.join();if(pr&&k!==pr&&C.state==='fight')st.portal++;pr=k;
      if(C.event&&C.event!==pe){st.events[C.event.kind]=(st.events[C.event.kind]||0)+1;}pe=C.event;
      if(C.state==='over'&&C.stateT>2.75&&C.round!==last){last=C.round;const al=G.champs.filter(c=>c.alive);rounds.push((al.length===1?al[0].name:'draw')+'@'+(C.t|0));}}
    return `${G.player.name} vs ${G.bot.name}: ${rounds.join(', ')} | portals ${st.portal} events ${JSON.stringify(st.events)}`;},[pk,fk]));}
 console.log(out.join('\n'));console.log('errors',errs);await b.close();})();
