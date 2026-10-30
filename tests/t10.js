const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1500);
 console.log('sheets ready',await pg.evaluate(()=>typeof SHEETS_READY!=='undefined'?SHEETS_READY:'n/a'));
 await pg.screenshot({path:'k_menu.png'});
 for(const pick of [1,0]){
  const res=await pg.evaluate((pick)=>{const R=window.__riftline;document.querySelectorAll('.card')[pick].click();R.newGame();const G=R.G;G.autoPlayer=true;G.killsToWin=99;G.xpRate=2;
   const casts={};const sh=G.champs.find(c=>c.key==='shade');let prev={...sh.cds},recasts=0,quarry=0,cross=0;
   for(let i=0;i<60*420;i++){R.tick(1/60);if(G.over)break;for(const k of ['Q','E','RMB','R'])if(sh.cds[k]>prev[k]+0.5)casts[k]=(casts[k]||0)+1;prev={...sh.cds};if(sh.eRecast)recasts++;if(sh.quarry&&sh.quarry.until>G.t)quarry++;if(sh.atk&&sh.atk.cross)cross++;}
   return `shade=${sh===G.player?'player':'bot'} t=${G.t|0} score ${G.score} lvl ${G.player.level}/${G.bot.level} shade casts ${JSON.stringify(casts)} recastTicks ${recasts} quarryTicks ${quarry} crossTicks ${cross}`;},pick);
  console.log(res);
 }
 // manual showcase: player Shade vs bot, force each ability and screenshot
 await pg.evaluate(()=>{document.querySelectorAll('#menu .card')[1].click();const R=window.__riftline;R.newGame();const G=R.G;G.killsToWin=99;const p=G.player,bt=G.bot;
   p.x=3000;p.y=650;bt.x=3260;bt.y=650;bt.isBot=true;for(const c of [p,bt]){c.ranks={Q:3,E:3,RMB:3,R:1};c.points=0;c.level=8;}G.relics.forEach(r=>r.at=1e9);G.minions.length=0;G.nextWave=1e9;window.__frz=true;});
 // freeze the bot so screenshots are readable
 await pg.evaluate(()=>{const G=window.__riftline.G;G.bot.input={mx:0,my:0,ax:G.player.x,ay:G.player.y,attack:false,attackTarget:null};G.bot.isBot=false;});
 const P=async()=>pg.evaluate(()=>{const G=window.__riftline.G;return [G.player.x|0,G.player.y|0];});
 const shot=async(name,clipY)=>pg.screenshot({path:name,clip:{x:450,y:200,width:700,height:420}});
 // aim at the bot: compute its screen position
 const botScreen=await pg.evaluate(()=>{const G=window.__riftline.G;const b=G.bot;return {x:0,y:0};});
 await pg.mouse.move(1000,380);await pg.waitForTimeout(300);
 const cast=async(key,waits)=>{if(key==='RMB'){await pg.mouse.click(1000,380,{button:'right'});}else await pg.keyboard.press(key==='SPACE'?'Space':'Key'+key);for(const [i,w] of waits.entries()){await pg.waitForTimeout(w);await shot(`k_${key}${i}.png`);}};
 await cast('RMB',[150,350]);
 await cast('Q',[120,260]);
 await cast('E',[90,300]);
 await pg.waitForTimeout(800);
 await cast('R',[120,250,500]);
 console.log('state',await pg.evaluate(()=>{const G=window.__riftline.G;return {bothp:G.bot.hp|0,quarry:!!G.player.quarry,recast:!!G.player.eRecast,cross:!!G.bot.crosscut}}));
 console.log('ERRORS',errs.slice(0,6));await b.close();
})();
