const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(800);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelectorAll('.card')[0].click();R.newGame();const G=R.G;const p=G.player,f=G.bot;G.nextWave=1e9;
   p.ranks={Q:1,E:1,RMB:1,R:0};p.points=0;p.x=2600;p.y=650;f.x=3400;f.y=900;const out=[];
   const st=()=>`[bronze ${p.axes.Q.state}${p.axes.Q.state==='hand'?(G.t>=p.axes.Q.readyAt?' ready':' cd'):''}, blue ${p.axes.RMB.state}${p.axes.RMB.state==='hand'?(G.t>=p.axes.RMB.readyAt?' ready':' cd'):''}, Q cd ${p.cds.Q.toFixed(1)}]`;
   const run=(n,mv)=>{for(let i=0;i<n;i++){f.stunT=0.5;f.input.attack=false;p.input={mx:mv?mv[0]:0,my:mv?mv[1]:0,ax:p.x+100,ay:p.y,attack:false,attackTarget:null};R.tick(1/60);}};
   run(2);out.push('Q '+window.__tc(p,'Q',p.x+300,p.y)+' throw bronze short');run(40);out.push('   '+st());
   out.push('Q '+window.__tc(p,'Q',p.x-300,p.y)+' throw blue');run(40);out.push('   '+st());
   for(let i=0;i<120&&p.axes.Q.state==="ground";i++){p.x+=6;run(1);}run(1);out.push('   walked over bronze: '+st());
   out.push('Q '+window.__tc(p,'Q',p.x+300,p.y)+' (bronze should throw again right away)');run(30);out.push('   '+st());
   return out.join('\n');}));
 console.log('ERRORS',errs);await b.close();
})();
