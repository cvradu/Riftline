const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.click('.card[data-k="marty"]');await pg.waitForTimeout(200);await pg.screenshot({path:'m_menu.png'});
 await pg.click('.mapcard[data-v="lane"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);await pg.mouse.move(1100,300);
 const clip={x:200,y:60,width:880,height:560};
 const step=async(fn,n,shot)=>{await pg.evaluate(([fn,n])=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;eval(fn);for(let i=0;i<n;i++)R.tick(1/60);},[fn,n]);await pg.waitForTimeout(350);if(shot)await pg.screenshot({path:shot,clip});};
 await step(`G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=9;p.ranks={Q:1,E:1,RMB:1,R:1};p.points=0;o.hp=o.maxHp=9000;p.x=2500;p.y=650;o.x=2880;o.y=640;o.stunT=1e9;window.__tc(p,'Q',o.x,o.y);`,20,'m_q1.png');
 await step('',13,'m_q2.png');await step('',4,'m_q3.png');
 await step(`p.cds.RMB=0;window.__tc(p,'RMB',2750,520);`,50,'m_ink.png');
 await step(`p.shield={amt:250,max:250,until:G.t+3};p.vent=true;`,4,'m_shield.png');
 await step(`G.inks=[];p.shield=null;p.cds.R=0;p.x=2500;p.y=650;window.__tc(p,'R',2850,700);`,14,'m_r1.png');
 await step('',40,'m_r2.png');
 await step('',14,'m_r3.png');
 // walk directions: eight Martys around the player, each walking a different way
 await step(`G.inks=[];o.x=4000;const extra=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;const u={...p};}p.x=2500;p.y=650;`,1,null);
 console.log('errors',errs);await b.close();})();
