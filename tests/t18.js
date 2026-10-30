const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;const p=G.player,f=G.bot;G.nextWave=1e9;
   p.ranks={Q:1,E:1,RMB:1,R:0};p.points=0;p.x=2600;p.y=650;f.x=3000;f.y=660;const out=[];const hp=()=>Math.round(f.hp);
   const st=()=>`[bronze ${p.axes.Q.state}${p.axes.Q.state==='hand'?(G.t>=p.axes.Q.readyAt?' ready':' cd'):''}, blue ${p.axes.RMB.state}${p.axes.RMB.state==='hand'?(G.t>=p.axes.RMB.readyAt?' ready':' cd'):''}, Q cd ${p.cds.Q.toFixed(1)}]`;
   const run=(n,mv)=>{for(let i=0;i<n;i++){f.stunT=0.5;f.input.attack=false;p.input={mx:mv?mv[0]:0,my:mv?mv[1]:0,ax:f.x,ay:f.y,attack:false,attackTarget:null};R.tick(1/60);}};
   let h=hp();out.push('Q #1 '+window.__tc(p,'Q',f.x+200,f.y)+' (throw)');run(40);out.push('   '+st()+` dmg ${h-hp()}`);
   h=hp();out.push('Q #2 '+window.__tc(p,'Q',f.x+200,f.y-150)+' (throw second)');run(40);out.push('   '+st()+` dmg ${h-hp()}`);
   const a0=G.t;window.__startAtk=true;p.atkCd=0;p.input={mx:0,my:0,ax:f.x,ay:f.y,attack:true,attackTarget:f};R.tick(1/60);out.push(`   basic attack with both axes out: wind-up started=${!!p.wind}`);
   h=hp();out.push('Q #3 '+window.__tc(p,'Q',0,0)+' (should recall the bronze axe)');run(50);out.push('   '+st()+` dmg ${h-hp()} cleave ${!!p.cleaveReady}`);
   h=hp();out.push('Q #4 '+window.__tc(p,'Q',0,0)+' (should recall the blue axe)');run(50);out.push('   '+st()+` dmg ${h-hp()}`);
   out.push('Q #5 '+window.__tc(p,'Q',f.x,f.y)+' (both on cooldown)');
   // walk-over reset
   p.axes.Q.readyAt=0;out.push('Q #6 '+window.__tc(p,'Q',p.x+300,p.y)+' (throw short)');run(60);out.push('   '+st());
   const tx=p.axes.Q.x;for(let i=0;i<120&&p.axes.Q.state==='ground';i++)run(1,[Math.sign(tx-p.x),0]);out.push('   walked over it: '+st());
   // E to the blue axe
   p.axes.RMB.readyAt=0;out.push('Q #7 '+window.__tc(p,'Q',p.x-500,p.y+100)+' (throw)');run(50);
   out.push('E '+window.__tc(p,'E',p.axes.RMB.x,p.axes.RMB.y)+' -> '+(run(40),st())+` charges ${p.chg.E}`);
   return out.join('\n');}));
 console.log('ERRORS',errs);await b.close();
})();
