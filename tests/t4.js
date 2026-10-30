const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+e.stack));
 const html=require('fs').readFileSync('/home/user/riftline/index.html','utf8');
 await pg.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
 await pg.waitForTimeout(500);
 await pg.screenshot({path:'m_menu.png'});
 for(const pick of [0,1]){
  const res=await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;
   const st={dash:[0,0],spin:0,E:[0,0]};let lastD=[0,0];
   for(let i=0;i<60*600;i++){R.tick(1/60);if(G.over)break;G.champs.forEach((c,j)=>{if(c.dashCd>4.98)st.dash[j]++;if(c.spin&&c.spin.next===c.spin.until-3)st.spin++;if(c.cds.E>0&&c.cds.E>=c.def.ab.E.cd[c.ranks.E-1]*100/(100+c.ah)-0.02)st.E[j]++;});}
   return `${G.player.name} vs ${G.bot.name}: t=${G.t|0} score ${G.score} lvl ${G.player.level}/${G.bot.level} cs ${G.player.cs}/${G.bot.cs} towers ${G.towers.map(t=>t.hp|0)} over=${JSON.stringify(G.over)} dashes ${st.dash} Ecasts ${st.E}`;},pick);
  console.log(res);
 }
 // interactive: aria leap + shade blink via Space
 for(const pick of [0,1]){
  await pg.evaluate((pick)=>{document.querySelectorAll('#menu .card')[pick].click();window.__riftline.newGame();},pick);
  await pg.mouse.move(1300,300);await pg.waitForTimeout(300);
  const a=await pg.evaluate(()=>{const p=window.__riftline.G.player;return [p.x|0,p.y|0];});
  await pg.keyboard.press('Space');await pg.waitForTimeout(600);
  const b2=await pg.evaluate(()=>{const p=window.__riftline.G.player;return [p.x|0,p.y|0,p.dashCd.toFixed(1)];});
  await pg.keyboard.press('Space');await pg.waitForTimeout(100);
  const t=await pg.evaluate(()=>document.getElementById('toast').textContent);
  console.log('dash',pick,a,b2,'toast:',t);
 }
 await pg.evaluate(()=>{document.querySelectorAll('#menu .card')[0].click();const R=window.__riftline;R.newGame();const G=R.G;G.autoPlayer=true;for(let i=0;i<60*40;i++)R.tick(1/60);const p=G.player,bt=G.bot;p.x=3000;p.y=650;bt.x=3150;bt.y=600;p.ranks.R=1;p.spin={until:G.t+3,next:G.t,dmg:30};});
 await pg.mouse.move(900,400);await pg.waitForTimeout(700);
 await pg.screenshot({path:'m_fight.png'});
 console.log('ERRORS',errs.slice(0,5));
 await b.close();
})();
