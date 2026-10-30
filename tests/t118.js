const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="marty"]').click();document.querySelector('#optFoe button[data-v="cora"]').click();
   document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;G.autoPlayer=true;G.xpRate=2;G.killsToWin=99;
   const m=G.player,o=G.bot;const src={};const orig=window.__dd;let modes={};let deaths=[];let pa=true;
   for(let i=0;i<60*300;i++){const hp=m.hp;R.tick(1/60);modes[m.mode]=(modes[m.mode]||0)+1;
     if(pa&&!m.alive)deaths.push(`t${G.t|0} x${m.x|0} mode ${m.mode} foe hp ${(o.hp/o.maxHp).toFixed(2)} L${m.level}/${o.level} cs ${m.cs}/${o.cs}`);pa=m.alive;if(G.over)break;}
   for(const k in modes)modes[k]=(modes[k]/60)|0;
   return `score ${G.score.join('-')} | modes(s) ${JSON.stringify(modes)} | cs ${m.cs} vs ${o.cs} | lvl ${m.level} vs ${o.level}\n deaths:\n  ${deaths.join('\n  ')}`;}));
 console.log('errors',errs);await b.close();})();
