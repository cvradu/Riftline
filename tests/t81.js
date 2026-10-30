const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 const el=await pg.$('#menuCtl');await el.scrollIntoViewIfNeeded();await el.screenshot({path:'menu_ctl.png'});
 await pg.click('#menuCtl .seg[data-set="lead"] button[data-v="high"]');
 console.log('lead setting saved:',await pg.evaluate(()=>JSON.parse(localStorage.getItem('riftline.settings')).lead));
 console.log('errors',errs);await b.close();})();
