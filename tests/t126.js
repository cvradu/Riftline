const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="marty"]').click();document.querySelector('#optFoe button[data-v="viktor"]').click();
   document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;G.autoPlayer=true;G.xpRate=2;G.killsToWin=99;
   const m=G.player,o=G.bot;const casts={Q:0,E:0,RMB:0,R:0,auto:0};const cd0={};const dh=[0,0,0,0,0,0];const modes={};let near=0,inRange=0,atkFoe=0;let lastAtk=null;
   for(let i=0;i<60*240;i++){for(const k of ['Q','E','RMB','R'])cd0[k]=m.cds[k];R.tick(1/60);for(const k of ['Q','E','RMB','R'])if(m.cds[k]>cd0[k]+0.5)casts[k]++;
     if(m.atk&&m.atk!==lastAtk){casts.auto++;lastAtk=m.atk;}
     if(m.alive&&o.alive){const d=Math.hypot(m.x-o.x,m.y-o.y);dh[Math.min(5,Math.floor(d/300))]++;modes[m.mode]=(modes[m.mode]||0)+1;if(m.input.attackTarget===o)atkFoe++;}}
   for(const k in modes)modes[k]=(modes[k]/60)|0;
   return `casts ${JSON.stringify(casts)} | dist hist (300u bins, s) ${dh.map(x=>(x/60)|0).join(',')} | modes ${JSON.stringify(modes)} | ticks targeting foe ${atkFoe} | score ${G.score.join('-')} lvl ${m.level}/${o.level}`;}));
 console.log('errors',errs);await b.close();})();
