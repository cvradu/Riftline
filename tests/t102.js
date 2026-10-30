// lane bot matches: time spent trying to walk but going nowhere (per champion), on the given site file
const {chromium}=require('playwright');const file=process.argv[2]||'site/index.html';
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/'+file);await pg.waitForTimeout(900);
 const out=[];
 for(const [A,B] of [['cora','viktor'],['blackjack','shade'],['viktor','blackjack'],['shade','cora']]){
  out.push(await pg.evaluate(([A,B])=>{const R=window.__riftline;document.querySelector(`.card[data-k="${A}"]`).click();document.querySelector(`#optFoe button[data-v="${B}"]`).click();
    document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;G.autoPlayer=true;G.xpRate=2;G.killsToWin=99;
    const hist=G.champs.map(()=>[]);const stuck=G.champs.map(()=>0);const where=[];let t0=performance.now();
    for(let i=0;i<60*240;i++){R.tick(1/60);if(G.over)break;
      G.champs.forEach((c,k)=>{const h=hist[k];const want=c.alive&&!c.wind&&!c.cast&&!c.dash&&(Math.abs(c.input.mx)+Math.abs(c.input.my))>0.5&&c.stunT<=0&&c.rootT<=0&&!c.recall;
        h.push(want?[c.x,c.y]:null);if(h.length>60)h.shift();
        if(h.length===60&&h.every(Boolean)&&Math.hypot(h[59][0]-h[0][0],h[59][1]-h[0][1])<25){stuck[k]+=1/60;if(where.length<6&&i%60===0)where.push([c.name,c.x|0,c.y|0]);}});}
    return `${A} vs ${B}: stuck s ${stuck.map(s=>s.toFixed(1)).join('/')} | kills ${G.score.join('-')} | ${((performance.now()-t0)/1000).toFixed(1)}s cpu | ${JSON.stringify(where)}`;},[A,B]));}
 console.log(out.join('\n'));console.log('errors',errs);await b.close();})();
