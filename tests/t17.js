const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[1].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   const co=G.bot;let ground=0,availTrue=0,nearFoe=0,through=0,eDash=0;
   for(let i=0;i<60*300;i++){R.tick(1/60);const q=co.axes.Q;if(q.state==='ground'&&!q.r){ground++;if(co.def.ab.E.avail(co)===true)availTrue++;const f=G.player;if(Math.hypot(q.x-f.x,q.y-f.y)<260)nearFoe++;}
     if(co.dash&&co.dash.kind==='E')eDash++;}
   return `ranks ${JSON.stringify(co.ranks)} chg ${JSON.stringify(co.chg)} groundTicks ${ground} EavailTicks ${availTrue} axeNearFoeTicks ${nearFoe} EdashTicks ${eDash} mode ${co.mode}`;}));
 console.log(errs);await b.close();
})();
