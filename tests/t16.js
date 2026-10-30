const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;const p=G.player,f=G.bot;G.nextWave=1e9;
   p.ranks={Q:1,E:1,RMB:1,R:0};p.points=0;f.x=p.x+450;f.y=p.y+20;p.x=2600;p.y=650;f.x=3050;const out=[];const hp=()=>Math.round(f.hp);
   const run=(n)=>{for(let i=0;i<n;i++){f.stunT=0.5;f.input.attack=false;p.input={mx:0,my:0,ax:f.x,ay:f.y,attack:false,attackTarget:null};R.tick(1/60);}};
   let h=hp();out.push('Q throw past target: '+window.__tc(p,'Q',f.x+250,f.y));run(50);out.push(`  dmg ${h-hp()} axe ${p.axes.Q.state}`);
   h=hp();out.push('Q recast (recall): '+window.__tc(p,'Q',0,0));run(50);out.push(`  dmg ${h-hp()} axe ${p.axes.Q.state} cleaveReady ${!!p.cleaveReady}`);
   p.cds.Q=0;p.cleaveReady=null;h=hp();out.push('Q throw again: '+window.__tc(p,'Q',f.x+250,f.y));run(50);out.push(`  dmg ${h-hp()} axe ${p.axes.Q.state}`);
   h=hp();const x0=p.x|0;out.push('E claim: '+window.__tc(p,'E',0,0));run(40);out.push(`  dmg ${h-hp()} moved ${(p.x|0)-x0} axe ${p.axes.Q.state} charges ${p.chg.E} cleaveReady ${!!p.cleaveReady} corruption ${p.res|0}`);
   out.push('E with no axe out: '+window.__tc(p,'E',0,0));
   f.x=p.x+300;f.y=p.y;h=hp();out.push('RMB fissure: '+window.__tc(p,'RMB',f.x,f.y));run(60);out.push(`  dmg ${h-hp()} slowed ${f.slows.some(s=>s.until>G.t)}`);
   return out.join('\n');}));
 console.log('ERRORS',errs);await b.close();
})();
