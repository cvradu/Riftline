const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:1400}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+e.stack));
 const html=require('fs').readFileSync('/home/user/riftline/index.html','utf8');
 await pg.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
 await pg.waitForTimeout(600);
 // turnaround + walk cycle sheet straight from the rig at screen scale
 const data=await pg.evaluate(()=>{
   const R=window.__riftline;document.querySelectorAll('.card')[1].click();R.newGame();const G=R.G;const u=G.player;
   const t0=performance.now();const fr=[];
   for(let d=2;d<16;d+=4){const row=[];for(let f=0;f<10;f++){const s=window.__spr(u,{anim:'walk',ph:(f+0.5)/10,side:1,dir:d});row.push(s.c.toDataURL());}fr.push(row);}
   const atk=[];for(let f=0;f<10;f++)atk.push(window.__spr(u,{anim:'attack',ph:(f+0.5)/10,side:1,dir:2}).c.toDataURL());
   return {fr,atk,ms:performance.now()-t0};});
 console.log('bake ms for 90 frames',data.ms|0);
 await pg.setContent('<body style="background:#6f8a80;margin:0">'+data.fr.map(r=>'<div style="display:flex">'+r.map(u=>`<img src="${u}">`).join('')+'</div>').join('')+'<div style="display:flex">'+data.atk.map(u=>`<img src="${u}">`).join('')+'</div></body>');
 await pg.waitForTimeout(300);await pg.screenshot({path:'shade_cycle.png',fullPage:true});
 console.log('ERRORS',errs.slice(0,5));await b.close();
})();
