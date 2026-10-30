const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();pg.on('pageerror',e=>console.log('ERR',e.message,e.stack&&e.stack.split('\n')[1]));pg.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);await b.close();})();
