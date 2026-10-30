const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;const p=G.player,f=G.bot;G.nextWave=1e9;
   p.ranks={Q:1,E:1,RMB:1,R:0};f.x=p.x+500;f.y=p.y+20;f.isBot=false;const out=[];
   const hp=()=>f.hp|0;let h0=hp();
   // keep the target still
   const still=()=>{f.input={mx:0,my:0,ax:f.x,ay:f.y,attack:false,attackTarget:null};};
   G.bot=G.player; // botThink drives the player slot harmlessly; freeze both
   out.push('E cast: '+window.__tc(p,'E',f.x,f.y));for(let i=0;i<90;i++){still();p.input={mx:0,my:0,ax:f.x,ay:f.y,attack:false};R.tick(1/60);}
   out.push(`fissure dmg ${h0-hp()} slowed ${f.slows.length>0}`);
   h0=hp();out.push('Q cast: '+window.__tc(p,'Q',f.x+200,f.y));for(let i=0;i<60;i++){still();R.tick(1/60);}out.push(`throw dmg ${h0-hp()} axe ${p.axes.Q.state}`);
   h0=hp();out.push('Q recast: '+window.__tc(p,'Q',0,0));for(let i=0;i<60;i++){still();R.tick(1/60);}out.push(`recall dmg ${h0-hp()} axe ${p.axes.Q.state} cleave ${!!p.cleaveReady}`);
   out.push('Q again (cooldown expected): '+window.__tc(p,'Q',f.x,f.y));
   return out.join('\n');}));
 console.log('ERRORS',errs);await b.close();
})();
