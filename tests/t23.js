const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1400,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;G.killsToWin=99;for(let i=0;i<30;i++)R.tick(1/60);
   const p=G.player,o=G.bot;p.ranks.Q=3;p.ranks.R=1;G.minions.length=0;G.nextWave=1e9;G.spawnQ.length=0;
   p.x=3000;p.y=650;o.x=3350;o.y=800;o.stunT=999;G.paused=true;document.getElementById('pause').hidden=true;});
 const shots=[];
 for(const [i,ang,col,corr] of [[0,Math.PI/2,0,0],[1,Math.PI/2,3,0],[2,0,3,0],[3,-Math.PI/2,3,0],[4,Math.PI,4,0],[5,-Math.PI*0.25,3,100],[6,Math.PI*0.75,1,100]]){
   await pg.evaluate(([ang,col,corr])=>{const G=window.__riftline.G,p=G.player;p.facing=ang;p.vx=p.vy=0;p.res=corr;p.input.ax=p.x+Math.cos(ang)*300;p.input.ay=p.y+Math.sin(ang)*300;
     const W=0.33,off=[0.02,0.15,0.27,W+0.03,W+0.14,W+0.24][col];p.atk={start:G.t-off,W,side:1};},[ang,col,corr]);
   await pg.waitForTimeout(700);await pg.screenshot({path:`shot_${i}.png`});}
 // recall beam on the bot and R telegraph for the player
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;p.atk=null;G.paused=false;o.stunT=0;
   o.recall={start:G.t-5,until:G.t+3};p.cds.R=0;window.__tc(p,'R',3300,500);for(let i=0;i<14;i++)R.tick(1/60);window.__tc(p,'R',3250,850);for(let i=0;i<40;i++)R.tick(1/60);
   p.recall=null;o.x=3350;o.y=700;o.recall={start:G.t-5,until:G.t+3};G.paused=true;document.getElementById('pause').hidden=true;});
 await pg.waitForTimeout(200);await pg.screenshot({path:'shot_r.png'});
 console.log('errors',errs);await b.close();})();
