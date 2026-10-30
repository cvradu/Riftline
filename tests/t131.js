const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('console',m=>{if(m.type()==='warning'||m.type()==='error')errs.push('console: '+m.text());});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1800);
 await pg.screenshot({path:'menu/home.png'});
 await pg.click('.mtabs [data-go="play"]');await pg.waitForTimeout(600);await pg.screenshot({path:'menu/play.png',fullPage:false});
 await pg.click('.mtabs [data-go="champs"]');await pg.waitForTimeout(700);await pg.screenshot({path:'menu/champs.png'});
 await pg.click('.ctile[data-k="blackjack"]');await pg.waitForTimeout(1500);await pg.screenshot({path:'menu/champ_top.png'});
 await pg.evaluate(()=>document.getElementById('scrChamp').querySelector('.abil').scrollIntoView());await pg.waitForTimeout(1200);await pg.screenshot({path:'menu/champ_ab.png'});
 await pg.click('.abTab[data-ab="R"]');await pg.waitForTimeout(1600);await pg.screenshot({path:'menu/champ_r.png'});
 await pg.click('.mtabs [data-go="how"]');await pg.waitForTimeout(500);await pg.screenshot({path:'menu/how.png'});
 await pg.click('.mtabs [data-go="settings"]');await pg.waitForTimeout(500);await pg.screenshot({path:'menu/settings.png'});
 console.log('errors',errs);await b.close();})();
