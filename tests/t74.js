const {chromium}=require('playwright');
const [A,B]=[process.argv[2]||'shade',process.argv[3]||'viktor'];
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(([A,B])=>{const R=window.__riftline;document.querySelector(`.card[data-k="${A}"]`).click();document.querySelector(`#optFoe button[data-v="${B}"]`).click();document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const log=[];let last={};const stuck={};
   for(let i=0;i<60*400&&!G.over;i++){R.tick(1/60);
     if(i%60===0){for(const c of G.champs){const k=c.name;const l=last[k];if(l&&c.alive&&!c.recall&&Math.hypot(c.x-l.x,c.y-l.y)<5){stuck[k]=(stuck[k]||0)+1;if(stuck[k]===4)log.push(`${k} still at ${c.x|0},${c.y|0} t=${G.t|0} mode ${c.mode} hp ${c.hp|0}/${c.maxHp|0}`);}else stuck[k]=0;last[k]={x:c.x,y:c.y};}}
     if(i%(60*30)===0)log.push(`t=${G.t|0} `+G.champs.map(c=>`${c.name} ${c.alive?'':'dead '}${c.x|0},${c.y|0} ${c.mode||''}`).join(' | '));}
   return log.join('\n');},[A,B]));
 console.log('errors',errs);await b.close();})();
