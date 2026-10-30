const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="shade"]').click();document.querySelector('#optFoe button[data-v="cora"]').click();document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   for(let i=0;i<60*60&&G.col.state!=="fight";i++)R.tick(1/60);G.autoPlayer=false;const p=G.player,o=G.bot,K=window.__COL;o.stunT=999;
   p.x=K.cx-180;p.y=K.cy+150;o.x=p.x+260;o.y=p.y-60;p.ranks.R=1;p.cds.R=0;document.getElementById('banner').hidden=true;
   G.hitStop=999;window.__go=()=>window.__tc(p,'R',o.x,o.y);window.__T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};return 'placed';}));
 await pg.mouse.move(640,410);await pg.waitForTimeout(1500);console.log('cast',await pg.evaluate(()=>window.__go()));
 const shots=[[0,'r0'],[3,'r1'],[4,'r2'],[3,'r3'],[8,'r4'],[10,'r5'],[12,'r6']];
 for(const [n,name] of shots){await pg.evaluate(n=>{window.__T(n);const p=window.__riftline.G.player;window.__st=(p.dash?'dash '+p.dash.kind:'')+(p.castAnim?' ca '+p.castAnim.kind+' '+(window.__riftline.G.t-p.castAnim.start).toFixed(2):'');},n);
   await pg.waitForTimeout(120);console.log(name,await pg.evaluate(()=>window.__st));await pg.screenshot({path:'shr_'+name+'.png',clip:{x:400,y:180,width:520,height:400}});}
 console.log('errors',errs);await b.close();})();
