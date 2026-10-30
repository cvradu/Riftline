const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{document.querySelector('.mtabs [data-go="play"]').click();});await pg.waitForTimeout(200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="mantis"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(700);await pg.mouse.move(900,300);
 const clip={x:330,y:150,width:620,height:430};const shots=[];
 const step=async(fn,n,label)=>{await pg.evaluate(([fn,n])=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;eval(fn);for(let i=0;i<n;i++)R.tick(1/60);},[fn,n]);await pg.waitForTimeout(300);if(label){const f='mantis/s_'+shots.length+'.png';await pg.screenshot({path:f,clip});shots.push([f,label]);}};
 await step(`G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=9;p.ranks={Q:1,E:1,RMB:1,R:1};p.points=0;o.hp=o.maxHp=9000;o.stunT=1e9;p.isBot=true;p.pvCtl=c=>{c.input.ax=o.x;c.input.ay=o.y;};p.x=2500;p.y=650;o.x=2950;o.y=600;o.facing=0;`,10,'idle + scan arc');
 await step(`window.__tc(p,'Q',o.x,o.y);`,40,'Q charging');
 await step(`p.qUp=true;`,12,'Q strike');
 await step(``,8,'Q snap');
 await step(`p.cds.RMB=0;window.__tc(p,'RMB',0,0);`,20,'camouflage (own view)');
 await step(`p.cds.E=0;window.__tc(p,'E',o.x+120,o.y);`,20,'anchor copy placed');
 await step(`window.__tc(p,'E',0,0);`,6,'teleport sweep');
 await step(`p.x=2400;p.y=700;o.x=2950;o.y=650;p.cds.R=0;o.hp=o.maxHp*0.5;window.__tc(p,'R',o.x,o.y);`,14,'grip flying');
 await step(``,8,'grip pull');
 await step(``,12,'execution cut');
 require('fs').writeFileSync('mantis/s_list.json',JSON.stringify(shots));
 // enemy view of the copy: become the enemy side by swapping player
 console.log('errors',errs);await b.close();})();
