const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
 for(const [w,h] of [[1280,720],[1000,650]]){const pg=await b.newPage({viewport:{width:w,height:h}});await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
   const r=await pg.evaluate(()=>{const e=document.getElementById('optMap').getBoundingClientRect();const m=document.getElementById('menu');return {top:e.top|0,bottom:e.bottom|0,vh:innerHeight,scrollH:m.scrollHeight,clientH:m.clientHeight};});
   console.log(w+'x'+h,JSON.stringify(r));await pg.screenshot({path:`menu_${w}.png`});await pg.close();}
 await b.close();})();
