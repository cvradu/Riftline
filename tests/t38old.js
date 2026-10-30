const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site_old/index.html');await pg.waitForTimeout(800);
 for(const pick of [0,1,0,1])console.log(await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   const co=G.champs.find(c=>c.key==='cora'),sh=G.champs.find(c=>c.key==='shade');let hooks=0,champHooks=0,arenas=0,snaps=0,ph=null,pa=null,stuck=0;
   for(let i=0;i<60*600;i++){R.tick(1/60);if(G.over)break;
     if(co.hook&&!ph){hooks++;}if(co.hook&&co.hook.u&&!(ph&&ph.u))champHooks++;ph=co.hook?{u:co.hook.u}:null;
     if(G.arena&&!pa)arenas++;pa=G.arena;if(co.alive&&co.axes.RMB.state==='chain'&&!co.hook&&!co.cast)stuck++;}
   const k=c=>G.score[c.team];
   return `t=${G.t|0}${G.over?' (tower fell)':''} kills Cora ${k(co)} Shade ${k(sh)} | dmg ${co.dmgDealt|0}/${sh.dmgDealt|0} | lvl ${co.level}/${sh.level} | hooks ${hooks} (on Shade ${champHooks}) arenas ${arenas} stuck ${stuck}`;},pick));
 console.log('errors',errs);await b.close();})();
