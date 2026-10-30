// Colosseum balance harness: N matches alternating sides, reports round wins per champion and round lengths
const {chromium}=require('playwright');
const N=+(process.argv[2]||6);
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 const tot={Cora:0,Shade:0,draw:0,len:[]};
 for(let m=0;m<N;m++){const r=await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();
   const mc=document.querySelector('.mapcard[data-v="col"]');if(mc)mc.click();R.newGame();const G=R.G;G.autoPlayer=true;const res=[];let last=0;
   for(let i=0;i<60*900;i++){R.tick(1/60);if(G.col.state==='prep'&&window.__autoReady)window.__autoReady();if(G.over&&G.overShown)break;
     const C=G.col;if(C.state==='over'&&C.stateT>2.75&&C.round!==last){last=C.round;const al=G.champs.filter(c=>c.alive);res.push({w:al.length===1?al[0].name:'draw',t:C.t});}}
   return res;},m%2);
  for(const x of r){tot[x.w]=(tot[x.w]||0)+1;tot.len.push(x.t|0);}}
 console.log(`rounds won: Cora ${tot.Cora} Shade ${tot.Shade} draws ${tot.draw} | round lengths ${tot.len.join(',')}`);
 console.log('errors',errs);await b.close();})();
