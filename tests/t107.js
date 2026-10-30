// log every Black Jack muzzle flash in bot matches; flag bursts of 3+ shots inside 0.45s that are not his Q
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 for(const [map,foe] of [['lane','cora'],['col','viktor']])
 console.log(await pg.evaluate(([map,foe])=>{const R=window.__riftline;document.querySelector('.card[data-k="blackjack"]').click();document.querySelector(`#optFoe button[data-v="${foe}"]`).click();
   document.querySelector(`.mapcard[data-v="${map}"]`).click();R.newGame();const G=R.G;G.autoPlayer=true;G.xpRate=2;G.killsToWin=99;
   const bj=G.player;let lastF=null;const shots=[];
   for(let i=0;i<60*150;i++){R.tick(1/60);const F=bj.bjFire;if(F&&F!==lastF){lastF=F;shots.push({t:G.t,q:!!bj.bjq||(bj.cast&&bj.cast.total===0.1),fl:!!bj.flush,dash:!!bj.dash,wind:!!bj.wind});}if(G.over)break;}
   const bursts=[];for(let i=0;i+2<shots.length;i++){const a=shots[i],c=shots[i+2];if(c.t-a.t<0.45&&!a.q&&!c.q&&!a.fl&&!c.fl){const grp=shots.filter(s=>s.t>=a.t-0.01&&s.t<a.t+0.6);bursts.push(grp.map(s=>`${s.t.toFixed(2)}${s.q?'q':''}${s.dash?'d':''}`).join(' '));i+=2;}}
   return `${map}: ${shots.length} shots, ${bursts.length} bursts\n  `+bursts.slice(0,8).join('\n  ');},[map,foe]));
 console.log('errors',errs);await b.close();})();
