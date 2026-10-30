// bot vs bot for any pairing on either map: node t53.js <map lane|col> <champA> <champB> <matches>
const {chromium}=require('playwright');
const [map,A,B,N]=[process.argv[2],process.argv[3],process.argv[4],+(process.argv[5]||4)];
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/'+(process.env.SITE||'site/index.html'));await pg.waitForTimeout(900);
 const out=[];
 for(let m=0;m<N;m++){const [pk,fk]=m%2?[B,A]:[A,B];
  out.push(await pg.evaluate(([map,pk,fk])=>{const R=window.__riftline;document.querySelector(`.card[data-k="${pk}"]`).click();document.querySelector(`#optFoe button[data-v="${fk}"]`).click();
    document.querySelector(`.mapcard[data-v="${map}"]`).click();R.newGame();const G=R.G;G.autoPlayer=true;G.xpRate=2;if(map==='lane')G.killsToWin=99;
    const st={uncage:0,tether:0,bounty:0};let pf=null,pt=null,pb=null;const rounds=[];let lastR=0;
    const vk=G.champs.find(c=>c.key==='viktor');
    for(let i=0;i<60*600;i++){R.tick(1/60);if(G.over&&(G.overShown||map==='lane'))break;
      if(vk){if(vk.form==='monster'&&pf!=='monster')st.uncage++;pf=vk.form;if(vk.tether&&!pt)st.tether++;pt=vk.tether;if(vk.bounty&&vk.bounty!==pb)st.bounty++;pb=vk.bounty;}
      if(map==='col'){const C=G.col;if(C.state==='over'&&C.stateT>2.75&&C.round!==lastR){lastR=C.round;const al=G.champs.filter(c=>c.alive);rounds.push(al.length===1?al[0].name:'draw');}}}
    const [p,o]=[G.player,G.bot];
    const res=map==='col'?`rounds ${rounds.join(',')}`:`kills ${p.name} ${G.score[p.team]} ${o.name} ${G.score[o.team]}${G.over?' (tower fell)':''}`;
    return `${p.name} vs ${o.name}: ${res} | dmg ${p.dmgDealt|0}/${o.dmgDealt|0} | viktor uncage ${st.uncage} tether ${st.tether} bounty ${st.bounty}`;},[map,pk,fk]));}
 console.log(out.join('\n'));console.log('errors',errs);await b.close();})();
