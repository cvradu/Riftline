const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const co=G.champs.find(c=>c.key==='cora'),sh=G.champs.find(c=>c.key==='shade');const log=[];
   let coHeal=0,prevCoHp=co.hp,casts={},arena=0,hooked=0;const origTc=window.__tc;
   for(let i=0;i<60*60;i++){const before=co.hp;const sc={...sh.cds};const cc={...co.cds};R.tick(1/60);
     for(const k of ['Q','E','RMB','R']){if(sh.cds[k]>sc[k]+0.5)casts['sh'+k]=(casts['sh'+k]||0)+1;if(co.cds[k]>cc[k]+0.5)casts['co'+k]=(casts['co'+k]||0)+1;}
     if(G.col.state==='over')break;}
   log.push(`t=${G.col.t|0}s winner=${G.champs.filter(c=>c.alive).map(c=>c.name)} lvl ${co.level}/${sh.level}`);
   log.push(`Cora dmg ${co.dmgDealt|0} hp ${co.hp|0}/${co.maxHp|0} corr ${co.res|0} | Shade dmg ${sh.dmgDealt|0} hp ${sh.hp|0}/${sh.maxHp|0} energy ${sh.res|0}`);
   log.push('casts '+JSON.stringify(casts)+' ranks cora '+JSON.stringify(co.ranks)+' shade '+JSON.stringify(sh.ranks));
   log.push(`stats Cora ad ${co.ad|0} armor ${co.armor|0} hp ${co.maxHp|0} | Shade ad ${sh.ad|0} armor ${sh.armor|0} hp ${sh.maxHp|0}`);
   return log.join('\n');}));
 console.log('errors',errs);await b.close();})();
