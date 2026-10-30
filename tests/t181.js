const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 const R=['cora','shade','viktor','blackjack','marty','mantis'];
 for(let i=0;i<R.length;i++){const me=R[i],foe=R[(i+2)%R.length],map=i%2?'col':'lane';
  console.log(await pg.evaluate(([me,foe,map])=>{const Rr=window.__riftline;document.querySelector(`.card[data-k="${me}"]`).click();document.querySelector(`#optFoe button[data-v="${foe}"]`).click();
    document.querySelector(`.mapcard[data-v="${map}"]`).click();Rr.newGame();const G=Rr.G;G.autoPlayer=true;G.hold=false;const p=G.player;let casts=0,atks=0,la=null,turns=0,lf=p.facing;
    for(let t=0;t<60*90;t++){Rr.tick(1/60);if(p.atk&&p.atk!==la){atks++;la=p.atk;}if(Math.abs(p.facing-lf)>0.01)turns++;lf=p.facing;if(G.col&&G.col.state==='over')break;}
    return `${me} vs ${foe} on ${map}: attacks ${atks} facing changes ${turns} lvl ${p.level} hp ${p.hp|0}/${p.maxHp|0} foe hp ${G.bot.hp|0}`;},[me,foe,map]));}
 console.log('errors',errs);await b.close();})();
