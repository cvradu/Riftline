const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1000);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="viktor"]');await pg.click('#optFoe button[data-v="shade"]');await pg.click('#startBtn');await pg.waitForTimeout(500);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};const tc=window.__tc;
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;G.autoPlayer=false;p.ranks.E=1;
   const reset=()=>{p.x=2600;p.y=650;p.cds.E=0;p.arm=null;p.dash=null;p.cast=null;p.res=0;};
   // 1 champion
   reset();o.x=3100;o.y=660;o.stunT=1e9;o.stealthT=0;o.dash=null;const h0=o.hp;out.push('grab champion: '+tc(p,'E',o.x,o.y));let st=[];
   for(let i=0;i<70&&(p.arm||p.cast);i++){T(1);if(i%6===0)st.push(`${p.arm?p.arm.state:'-'}:${Math.round(Math.hypot(o.x-p.x,o.y-p.y))}`);}
   out.push(`  ${st.join(' ')} | Shade ended ${Math.round(Math.hypot(o.x-p.x,o.y-p.y))} away, took ${(h0-o.hp)|0}, Fury ${p.res|0}`);
   // 2 minion
   reset();o.x=6000;o.y=650;const m=window.makeMinion?null:null;
   G.spawnQ=[{t:G.t,type:'melee',team:1,slot:0}];T(1);const mn=G.minions[G.minions.length-1];mn.x=3000;mn.y=700;mn.target=null;const mh=mn.hp;
   out.push('grab minion: '+tc(p,'E',mn.x,mn.y));for(let i=0;i<70&&(p.arm||p.cast);i++)T(1);out.push(`  minion now ${Math.round(Math.hypot(mn.x-p.x,mn.y-p.y))} away, took ${(mh-mn.hp)|0}`);G.minions=[];
   // 3 wall
   reset();out.push('aim at the wall: '+tc(p,'E',p.x-200,p.y-900));T(8);let ws='';for(let i=0;i<40&&p.arm&&p.arm.state!=='wall';i++)T(1);ws=p.arm?p.arm.state+' at '+(p.arm.x|0)+','+(p.arm.y|0):'none';
   T(20);const still=p.arm?p.arm.state:'none';p.cds.E=5;const r2=tc(p,'E',0,0);for(let i=0;i<40&&(p.dash||p.arm);i++)T(1);
   out.push(`  hand ${ws}, still ${still} after 20 ticks, recast ${r2} -> Viktor at ${p.x|0},${p.y|0} (on deck ${window.__laneOk(p.x,p.y)}), arm ${p.arm?p.arm.state:'gone'}`);
   // 4 wall grip expires
   reset();tc(p,'E',p.x-200,p.y-900);T(8);for(let i=0;i<40&&p.arm&&p.arm.state!=='wall';i++)T(1);for(let i=0;i<60*4&&p.arm;i++)T(1);out.push(`grip expires and springs back: arm ${p.arm?p.arm.state:'gone'}`);
   // 5 miss
   reset();o.x=6000;tc(p,'E',p.x+700,p.y);let far=0,n=0;for(let i=0;i<120&&(p.arm||p.cast);i++){T(1);n++;if(p.arm)far=Math.max(far,Math.hypot(p.arm.x-p.x,p.arm.y-p.y));}
   out.push(`miss: reached ${far|0} units, back home after ${n} ticks`);
   return out.join('\n');}));
 // pictures: reaching out, and a wall grip
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;p.x=2600;p.y=650;p.cds.E=0;p.arm=null;p.cast=null;p.dash=null;o.x=3150;o.y=640;o.stunT=1e9;window.__tc(p,'E',o.x,o.y);for(let i=0;i<14;i++)R.tick(1/60);});
 await pg.waitForTimeout(400);await pg.screenshot({path:'arm_out.png',clip:{x:340,y:150,width:640,height:420}});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;for(let i=0;i<5;i++)R.tick(1/60);});await pg.waitForTimeout(300);await pg.screenshot({path:'arm_pull.png',clip:{x:340,y:150,width:640,height:420}});
 await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;for(let i=0;i<60;i++)R.tick(1/60);p.x=2600;p.y=650;p.cds.E=0;p.arm=null;window.__tc(p,'E',p.x-200,p.y-900);for(let i=0;i<40&&!(p.arm&&p.arm.state==='wall');i++)R.tick(1/60);});
 await pg.waitForTimeout(400);await pg.screenshot({path:'arm_wall.png',clip:{x:240,y:60,width:800,height:520}});
 console.log('errors',errs);await b.close();})();
