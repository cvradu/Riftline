const {chromium}=require('playwright');
const [A,B,N,MAP]=[process.argv[2],process.argv[3],+(process.argv[4]||2),process.argv[5]||'col'];
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/diag.html');await pg.waitForTimeout(900);
 const r=await pg.evaluate(([pk,fk,N,MAP])=>{const R=window.__riftline;const agg={},casts={};
  for(let m=0;m<N;m++){document.querySelector(`.card[data-k="${m%2?fk:pk}"]`).click();document.querySelector(`#optFoe button[data-v="${m%2?pk:fk}"]`).click();
   document.querySelector(`.mapcard[data-v="${MAP}"]`).click();R.newGame();const G=R.G;G.autoPlayer=true;window.__dlog=[];
   for(let i=0;i<60*900;i++){const n0=window.__dlog.length;R.tick(1/60);
     for(let j=n0;j<window.__dlog.length;j++){const e=window.__dlog[j];const dmg=Math.max(0,e.h0-e.t.hp);const k=e.s+':'+e.ln;agg[k]=(agg[k]||0)+dmg;}
     for(const c of G.champs)if(c.cast&&!c._cl){c._cl=1;}else if(!c.cast)c._cl=0;
     if(G.over&&G.overShown)break;}}
  const tot={};for(const [k,v] of Object.entries(agg)){const c=k.split(':')[0].replace('[M]','');tot[c]=(tot[c]||0)+v;}return Object.entries(agg).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>k+' '+(v|0)).join('\n')+'\nTOTAL '+JSON.stringify(Object.fromEntries(Object.entries(tot).map(([k,v])=>[k,v|0])));},[A,B,N,MAP]);
 console.log(r);console.log('errors',errs);await b.close();})();
