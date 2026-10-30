const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();pg.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')console.log('console',m.text());});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);console.log('cards',await pg.evaluate(()=>document.querySelectorAll('#cards .card').length));await b.close();})();
