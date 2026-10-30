const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 await pg.screenshot({path:'menu/m_home.png'});
 const ow=await pg.evaluate(()=>{const m=document.getElementById('menu');return [m.scrollWidth,m.clientWidth];});
 await pg.evaluate(()=>document.querySelector('.mtabs [data-go="champs"]').click());await pg.waitForTimeout(300);
 await pg.evaluate(()=>document.querySelector('.ctile[data-k="shade"]').click());await pg.waitForTimeout(1200);await pg.screenshot({path:'menu/m_champ.png'});
 const ow2=await pg.evaluate(()=>{const m=document.getElementById('menu');return [m.scrollWidth,m.clientWidth];});
 console.log('overflow home',ow,'champ',ow2,'errors',errs);await b.close();})();
