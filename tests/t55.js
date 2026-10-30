const {chromium}=require('playwright');
const foe=process.argv[2]||'cora';
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate((foe)=>{const R=window.__riftline;document.querySelector('.card[data-k="viktor"]').click();document.querySelector(`#optFoe button[data-v="${foe}"]`).click();
   document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;const v=G.player,o=G.bot,out=[];let shots=0,pa=null;const casts={};
   for(let i=0;i<60*60;i++){const cd={...v.cds};R.tick(1/60);if(v.atk&&v.atk!==pa)shots++;pa=v.atk;for(const k of ['Q','E','RMB','R'])if(v.cds[k]>cd[k]+0.5)casts[k]=(casts[k]||0)+1;
     const C=G.col;if(C.state==='fight'&&i%45===0)out.push(`${C.t.toFixed(1)} ${v.mode}/${v.form} hp${(v.hp/v.maxHp*100)|0} fury${v.res|0} d=${Math.hypot(v.x-o.x,v.y-o.y)|0} ${o.name}:${o.mode} hp${(o.hp/o.maxHp*100)|0} shots${shots}`);
     if(C.state==='over')break;}
   out.push('casts '+JSON.stringify(casts)+' ranks '+JSON.stringify(v.ranks)+' dmg '+(v.dmgDealt|0)+'/'+(o.dmgDealt|0));return out.join('\n');},foe));
 console.log('errors',errs);await b.close();})();
