const {chromium}=require('playwright');
const foe=process.argv[2]||'shade';
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate((foe)=>{const R=window.__riftline;document.querySelector('.card[data-k="viktor"]').click();document.querySelector(`#optFoe button[data-v="${foe}"]`).click();
   document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;const v=G.player,o=G.bot,out=[];
   let lastD=0,lastT=0,lastHp=v.hp,taken={human:0,monster:0},dealt={human:0,monster:0},tHuman=0,tMon=0,dashes=0,pdc=0;
   for(let i=0;i<60*90;i++){const hp0=v.hp,dd0=v.dmgDealt;R.tick(1/60);const C=G.col;if(C.state!=='fight'){if(C.state==='over')break;continue;}
     const f=v.form==='monster'?'monster':'human';if(v.hp<hp0)taken[f]+=hp0-v.hp;dealt[f]+=v.dmgDealt-dd0;if(f==='human')tHuman+=1/60;else tMon+=1/60;if(v.dashCd>pdc+1)dashes++;pdc=v.dashCd;}
   return `${foe}: winner ${G.champs.filter(c=>c.alive).map(c=>c.name)} t=${G.col.t|0}s | human ${tHuman.toFixed(1)}s dealt ${dealt.human|0} taken ${taken.human|0} | monster ${tMon.toFixed(1)}s dealt ${dealt.monster|0} taken ${taken.monster|0} | rolls ${dashes} | foe hp left ${(o.hp/o.maxHp*100)|0}%`;},foe));
 console.log('errors',errs);await b.close();})();
