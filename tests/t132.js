const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('console',m=>{if(m.type()==='warning'||m.type()==='error')errs.push('console: '+m.text());});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 const shots=[];
 for(const k of ['cora','shade','viktor','blackjack','marty']){
   await pg.click('.mtabs [data-go="champs"]');await pg.waitForTimeout(200);await pg.click(`.ctile[data-k="${k}"]`);await pg.waitForTimeout(300);
   for(const ab of ['P','Q','E','RMB','R','DASH']){await pg.click(`.abTab[data-ab="${ab}"]`);await pg.waitForTimeout(ab==='R'?1500:1100);
     const el=await pg.$('#pvCv');const f=`menu/pv_${k}_${ab}.png`;await el.screenshot({path:f});shots.push([f,`${k} ${ab}`]);}}
 require('fs').writeFileSync('menu/pv_list.json',JSON.stringify(shots));
 console.log('errors',errs.slice(0,6));await b.close();})();
