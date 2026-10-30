const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();document.querySelector('#optMap button[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const out=[];for(let i=0;i<60*110;i++){R.tick(1/60);const C=G.col;if(C.state==='fight'&&i%120===0){const [a,b2]=G.champs;out.push(`${C.t|0}s ${a.name}:${a.mode} hp${(a.hp/a.maxHp*100)|0} ${b2.name}:${b2.mode} hp${(b2.hp/b2.maxHp*100)|0} d=${Math.hypot(a.x-b2.x,a.y-b2.y)|0} dmg ${a.dmgDealt|0}/${b2.dmgDealt|0} storm ${C.storm?C.storm.r|0:'-'}`);}if(C.state==='over')break;}
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
