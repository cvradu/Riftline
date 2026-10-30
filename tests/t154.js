const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));pg.on('console',m=>{if(m.type()==='warning'||m.type()==='error')errs.push('console: '+m.text());});
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1800);
 await pg.screenshot({path:'mantis/m_home.png',clip:{x:680,y:80,width:640,height:280}});
 await pg.click('.mtabs [data-go="champs"]');await pg.waitForTimeout(600);await pg.screenshot({path:'mantis/m_grid.png'});
 await pg.click('.ctile[data-k="mantis"]');await pg.waitForTimeout(1200);await pg.screenshot({path:'mantis/m_detail.png'});
 const shots=[];
 for(const ab of ['P','Q','E','RMB','R','DASH']){await pg.click(`.abTab[data-ab="${ab}"]`);await pg.waitForTimeout(ab==='Q'||ab==='P'?1400:1200);const el=await pg.$('#pvCv');const f=`mantis/pv_${ab}.png`;await el.screenshot({path:f});shots.push(f);}
 await pg.evaluate(()=>document.getElementById('scrChamp').querySelector('.abil').scrollIntoView());await pg.waitForTimeout(300);await pg.click('.abTab[data-ab="Q"]');await pg.waitForTimeout(400);await pg.screenshot({path:'mantis/m_ab.png'});
 require('fs').writeFileSync('mantis/pv_list.json',JSON.stringify(shots));
 console.log('errors',errs);await b.close();})();
