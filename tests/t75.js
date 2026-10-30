const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const errs=[];
 for(const scheme of ['modern','classic']){
  const pg=await b.newPage({viewport:{width:1280,height:720}});pg.on('pageerror',e=>errs.push(scheme+': '+e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.addInitScript(s=>{localStorage.setItem('riftline.settings',JSON.stringify({scheme:s}));},scheme);
  await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
  await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(500);
  const st=()=>pg.evaluate(()=>{const p=window.__riftline.G.player;return {x:p.x|0,y:p.y|0,q:p.ranks.Q,e:p.ranks.E,pts:p.points,axe:p.axes&&p.axes.Q.state,cdQ:+(p.cds.Q||0).toFixed(1),recall:!!p.recall,order:p.order&&p.order.kind};});
  const s0=await st();
  await pg.mouse.move(900,300);
  await pg.keyboard.down('Shift');await pg.keyboard.press('KeyQ');await pg.keyboard.up('Shift');await pg.waitForTimeout(200);
  const s1=await st();
  let s2;
  if(scheme==='modern'){await pg.keyboard.down('KeyD');await pg.waitForTimeout(800);await pg.keyboard.up('KeyD');s2=await st();}
  else{await pg.mouse.click(900,250,{button:'right'});await pg.waitForTimeout(900);s2=await st();}
  await pg.mouse.move(1000,250);await pg.keyboard.press('KeyQ');await pg.waitForTimeout(300);const s3=await st();
  await pg.waitForTimeout(2500);await pg.keyboard.press('KeyB');await pg.waitForTimeout(300);const s4=await st();
  console.log(scheme,'| start',JSON.stringify(s0),'| shift+Q',JSON.stringify(s1),'| moved',JSON.stringify(s2),'| Q cast',JSON.stringify(s3),'| B',JSON.stringify(s4));
  await pg.close();}
 // colosseum prep through the UI
 const pg=await b.newPage({viewport:{width:1280,height:720}});pg.on('pageerror',e=>errs.push('col: '+e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 await pg.click('.mapcard[data-v="col"]');await pg.click('.card[data-k="shade"]');await pg.click('#startBtn');await pg.waitForTimeout(500);
 const vis=await pg.evaluate(()=>!document.getElementById('prep').hidden);
 await pg.click('#prepAugs .aug >> nth=1');const picked=await pg.evaluate(()=>document.querySelector('#prepAugs .aug[aria-pressed="true"]').dataset.id);
 await pg.click('#readyBtn');await pg.waitForTimeout(400);
 console.log('prep shown',vis,'picked',picked,'->',await pg.evaluate(()=>{const G=window.__riftline.G;return `state ${G.col.state}, player augs ${G.player.augList}, bot augs ${G.bot.augList}, points left ${G.player.points}`;}));
 console.log('errors',errs);await b.close();})();
