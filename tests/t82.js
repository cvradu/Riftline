const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const errs=[];
 for(const [scheme,champ] of [['modern','shade'],['modern','viktor'],['classic','cora']]){
  const pg=await b.newPage({viewport:{width:1280,height:720}});pg.on('pageerror',e=>errs.push(scheme+': '+e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.addInitScript(s=>{localStorage.setItem('riftline.settings',JSON.stringify({scheme:s}));},scheme);
  await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
  await pg.click('.mapcard[data-v="lane"]');await pg.click(`.card[data-k="${champ}"]`);await pg.click('#startBtn');await pg.waitForTimeout(400);
  const setup=await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;p.x=900;p.y=650;o.x=p.x+p.range*0.6+60;o.y=650;o.stunT=1e9;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;
    const s=window.__P(o.x,o.y);return{sx:s.x,sy:s.y-40};});
  const T=n=>pg.evaluate(n=>{for(let i=0;i<n;i++)window.__riftline.tick(1/60);},n);
  const st=()=>pg.evaluate(()=>{const G=window.__riftline.G,p=G.player;return{wind:!!p.wind,x:p.x|0,y:p.y|0,botHp:G.bot.hp|0};});
  await pg.mouse.move(setup.sx,setup.sy);const a=await st();let mid;
  if(scheme==='modern'){await pg.keyboard.down('KeyS');await pg.mouse.down();await T(4);mid=await st();await T(30);await pg.mouse.up();await pg.keyboard.up('KeyS');}
  else{await pg.mouse.click(setup.sx,setup.sy,{button:'right'});await T(4);mid=await st();await pg.mouse.click(640,300,{button:'right'});await T(30);}
  const c=await st();
  console.log(scheme,champ,'| winding up:',mid.wind,'| moved during the swing',a.x+','+a.y,'->',mid.x+','+mid.y,'->',c.x+','+c.y,'| bot hp',a.botHp,'->',c.botHp);
  await pg.close();}
 console.log('errors',errs);await b.close();})();
