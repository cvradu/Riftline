const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="shade"]').click();document.querySelector('#optFoe button[data-v="viktor"]').click();document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const out=[];const modes={};let casts=0,atks=0;const p=G.player;const tc=window.__tc;
   for(let i=0;i<60*240&&!G.over;i++){R.tick(1/60);modes[p.mode]=(modes[p.mode]||0)+1;if(p.wind)atks++;
     if(i%(60*20)===0)out.push(`t=${G.t|0} lvl ${p.level} ranks ${JSON.stringify(p.ranks)} pts ${p.points} hp ${p.hp|0} res ${p.res|0} pos ${p.x|0},${p.y|0} mode ${p.mode} retreat ${p.retreat} cs ${p.cs} dmg ${p.dmgDealt|0}`);}
   out.push('modes '+JSON.stringify(modes)+' attack-windup ticks '+atks);return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
