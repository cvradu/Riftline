const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 for(const pick of [0,1,0,1])console.log(await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   for(let i=0;i<60*600;i++){R.tick(1/60);if(G.over)break;}
   const co=G.champs.find(c=>c.key==='cora'),sh=G.champs.find(c=>c.key==='shade');
   const sc=G.score;const k=c=>sc[c.team];
   return `t=${G.t|0}${G.over?' (tower fell)':''} kills Cora ${k(co)} Shade ${k(sh)} | champ dmg Cora ${co.dmgDealt|0} Shade ${sh.dmgDealt|0} | lvl ${co.level}/${sh.level} cs ${co.cs}/${sh.cs}`;},pick));
 console.log('errors',errs);await b.close();})();
