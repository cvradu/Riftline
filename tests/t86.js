const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1000);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="viktor"]');await pg.click('#optFoe button[data-v="shade"]');await pg.click('#startBtn');await pg.waitForTimeout(500);
 await pg.mouse.move(150,350);
 console.log(await pg.evaluate(()=>{const A=window.__VA;return 'arm textures: '+(A.fore?A.fore.width+'x'+A.fore.height:'none')+' / '+(A.hand?A.hand.width+'x'+A.hand.height:'none');}));
 const shot=async(name,fn,clip)=>{await pg.evaluate(fn);await pg.waitForTimeout(400);await pg.screenshot({path:name,clip});};
 await shot('arm_out.png',()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.ranks.E=1;p.x=2600;p.y=650;p.cds.E=0;p.arm=null;o.x=3150;o.y=640;o.stunT=1e9;window.__tc(p,'E',o.x,o.y);for(let i=0;i<16;i++)R.tick(1/60);window.__st=p.arm&&p.arm.state;},{x:380,y:120,width:700,height:400});
 console.log('state at shot 1',await pg.evaluate(()=>window.__st));
 await shot('arm_pull.png',()=>{const R=window.__riftline;for(let i=0;i<6;i++)R.tick(1/60);window.__st=R.G.player.arm&&R.G.player.arm.state;},{x:380,y:200,width:560,height:330});
 console.log('state at shot 2',await pg.evaluate(()=>window.__st));
 await shot('arm_wall.png',()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;for(let i=0;i<60;i++)R.tick(1/60);o.x=5000;o.y=650;p.cast=null;p.dash=null;p.x=2600;p.y=650;p.cds.E=0;p.arm=null;window.__tc(p,'E',p.x-200,p.y-900);for(let i=0;i<50&&!(p.arm&&p.arm.state==='wall');i++)R.tick(1/60);window.__st=p.arm&&p.arm.state;},{x:240,y:40,width:800,height:520});
 console.log('state at shot 3',await pg.evaluate(()=>window.__st));
 console.log('errors',errs);await b.close();})();
