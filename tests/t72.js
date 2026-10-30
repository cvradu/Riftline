const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G;window.__T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};G.autoPlayer=false;document.getElementById('banner').hidden=true;});
 const at=async(name,x,y,extra)=>{console.log(name,await pg.evaluate(([x,y,extra])=>{const G=window.__riftline.G,p=G.player,o=G.bot;G.paused=false;p.x=x;p.y=y;p.order=null;o.stunT=99;if(extra)eval(extra);window.__T(90);G.paused=true;document.getElementById('pause').hidden=true;
     return `p ${p.x|0},${p.y|0} bush ${p.bush} hidden ${p.hidden} relics ${G.relics.map(r=>r.active)}`;},[x,y,extra||'']));await pg.waitForTimeout(700);await pg.screenshot({path:name+'.png'});};
 await at('ln_base',700,650);
 await at('ln_alcove',3300,-120,"G.t=60;for(const r of G.relics)r.at=0;window.__T(2);");
 await at('ln_alcoveB',3100,1580,"");
 console.log('errors',errs);await b.close();})();
