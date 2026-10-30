const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const html=require('fs').readFileSync('/home/user/riftline/index.html','utf8');
 await pg.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
 await pg.waitForTimeout(500);
 await pg.evaluate(()=>{document.querySelectorAll('.card')[1].click();const R=window.__riftline;R.newGame();R.G.autoPlayer=true;});
 const fps=()=>pg.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2);}requestAnimationFrame(f);}));
 console.log('during warmup fps',await fps());
 await pg.waitForTimeout(15000);
 console.log('queue left',await pg.evaluate(()=>0),'after warmup fps',await fps());
 await pg.screenshot({path:'final_game.png'});
 console.log(errs);await b.close();
})();
