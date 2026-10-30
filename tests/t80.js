const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const errs=[];
 for(const scheme of ['modern','classic']){
  const pg=await b.newPage({viewport:{width:1280,height:720}});pg.on('pageerror',e=>errs.push(scheme+': '+e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.addInitScript(s=>{localStorage.setItem('riftline.settings',JSON.stringify({scheme:s}));},scheme);
  await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
  await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="shade"]');await pg.click('#startBtn');await pg.waitForTimeout(400);
  // park the bot in front of us, stunned, and freeze the game so ticks are ours to drive
  const setup=await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;p.x=900;p.y=650;o.x=1000;o.y=650;o.stunT=1e9;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;
    const s=window.__P(o.x,o.y);return{sx:s.x,sy:s.y-40};});
  const T=n=>pg.evaluate(n=>{for(let i=0;i<n;i++)window.__riftline.tick(1/60);},n);
  const st=()=>pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;return{wind:!!p.wind,atkCd:+p.atkCd.toFixed(2),x:p.x|0,y:p.y|0,botHp:G.bot.hp|0};});
  await pg.mouse.move(setup.sx,setup.sy);
  if(scheme==='modern'){await pg.mouse.down();await T(3);await pg.mouse.up();}
  else{await pg.mouse.click(setup.sx,setup.sy,{button:'right'});await T(3);}
  const a=await st();
  if(scheme==='modern'){await pg.keyboard.down("KeyA");await T(2);}else{await pg.mouse.click(300,300,{button:"right"});await T(2);}
  const bb=await st();await T(20);const c=await st();
  if(scheme==='modern')await pg.keyboard.up('KeyA');
  // holding a direction then attacking still finishes the swing
  await pg.evaluate(()=>{const p=window.__riftline.G.player;p.x=900;p.y=650;p.order=null;});
  if(scheme==='modern'){await pg.keyboard.down('KeyD');await T(2);await pg.mouse.down();await T(40);await pg.mouse.up();await pg.keyboard.up('KeyD');}
  else{await pg.mouse.click(setup.sx,setup.sy,{button:'right'});await T(40);}
  const d=await st();
  console.log(scheme,'| attack started: wind',a.wind,'| new move during wind-up: wind',bb.wind,'atkCd',bb.atkCd,'| 20 ticks later moved',a.x,'->',c.x,'| attack while already moving lands: bot hp',a.botHp,'->',d.botHp);
  // smooth rendering puts every unit back exactly
  const v=await pg.evaluate(()=>{const R=window.__riftline,G=R.G;G.bot.stunT=0;G.nextWave=G.t;for(let i=0;i<300;i++)R.tick(1/60);
    const snap=()=>[...G.champs,...G.minions,...G.projs].map(u=>u.x.toFixed(6)+','+u.y.toFixed(6)).join('|');const before=snap();
    for(const u of G.champs){u._ox=u.x-6;u._oy=u.y-3;}window.__vb(0.5,1/60);const mid=G.champs.map(u=>(u.x|0)+','+(u.y|0));window.__ve();
    return{restored:snap()===before,mid,real:G.champs.map(u=>(u.x|0)+','+(u.y|0))};});
  console.log('   view: drawn halfway',JSON.stringify(v.mid),'real',JSON.stringify(v.real),'restored exactly',v.restored);
  await pg.close();}
 // hit-stop now only on kills
 const pg=await b.newPage();pg.on('pageerror',e=>errs.push('hs: '+e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="cora"]').click();document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;let n=0,last=0,kills=0,k0=0;
   for(let i=0;i<60*120&&!G.over;i++){R.tick(1/60);if(G.hitStop>0&&last<=0)n++;last=G.hitStop;G.hitStop=Math.max(0,G.hitStop-1/60);}
   kills=G.champs.reduce((a,c)=>a+c.deaths,0);return `2 min of arena: ${n} hit-stops, ${kills} deaths`;}));
 console.log('errors',errs);await b.close();})();
