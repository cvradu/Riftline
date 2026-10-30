const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="blackjack"]').click();document.querySelector('#optFoe button[data-v="cora"]').click();
   document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;G.autoPlayer=true;G.xpRate=2;G.killsToWin=99;
   const bj=G.player;let lastF=null;const log=[];const out=[];
   for(let i=0;i<60*300;i++){R.tick(1/60);const F=bj.bjFire;const fired=F&&F!==lastF;if(fired)lastF=F;
     log.push(`${G.t.toFixed(2)} ${fired?'FIRE'+F.side:'    '} wind=${bj.wind?bj.wind.total.toFixed(2)+(bj.wind.target?'/'+bj.wind.target.kind:''):'-'} atkCd=${bj.atkCd.toFixed(2)} tap=${bj.bjTap?1:0} cast=${bj.cast?1:0} dash=${bj.dash?bj.dash.kind:'-'} q=${bj.bjq?1:0} as=${(1/ (bj.as)).toFixed(2)}`);
     if(log.length>40)log.shift();
     if(fired&&!bj.bjq&&!log[log.length-2].includes('q=1')){const recent=log.filter(l=>l.includes('FIRE')&&!l.includes('q=1'));const ts=recent.map(l=>+l.split(' ')[0]).filter(t=>G.t-t<0.45);if(ts.length>=3){out.push(log.slice(-30).join('\n'));if(out.length>=2)break;}}}
   return out.join('\n=====\n');}));
 console.log('errors',errs);await b.close();})();
