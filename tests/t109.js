const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot,out=[];const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};const tc=window.__tc;
   G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;p.level=9;p.ranks={Q:1,E:3,RMB:1,R:1};p.points=0;o.stunT=1e9;o.hp=o.maxHp=9000;o.res=0;
   // 1) Jetstep through Cora back and forth
   p.x=2500;p.y=650;o.x=2650;o.y=650;p.chg.E=2;p.cds.E=0;const res=[];
   for(let k=0;k<6;k++){const tx=p.x<o.x?o.x+150:o.x-150;res.push(tc(p,'E',tx,650)+'/'+p.chg.E);T(22);}
   out.push('jetstep chain through Cora: '+res.join(' '));
   T(130);out.push('  after 2.2s: '+tc(p,'E',p.x+200,650));
   // 2) casting mid-boost
   T(60);p.cds={Q:0,E:0,RMB:0,R:0};p.chg.E=2;p.dashCd=0;p.jetLock=0;p.x=2400;p.y=650;o.x=2900;o.y=650;
   const a=window.__td(p,2600,650);const mid=!!p.dash;const q=tc(p,'Q',o.x,o.y),rm=tc(p,'RMB',o.x,o.y),e=tc(p,'E',p.x+50,500);T(2);const rr=tc(p,'R',o.x,o.y);
   out.push(`mid-boost: afterburner ${a}, dashing ${mid} -> Q ${q} coin ${rm} jetstep ${e} R ${rr} (stream ${!!p.flush})`);
   T(200);
   // 3) the stream: count shots, damage; Cora stands in line while BJ walks sideways
   p.flush=null;p.bjq=null;p.cds.R=0;p.x=2400;p.y=650;o.x=2900;o.y=650;o.hp=9000;T(2);let h=o.hp,shots=0;const seen=new Set();
   const r0=tc(p,'R',o.x,o.y);const y0=p.y;let ms=0;
   for(let i=0;i<200;i++){p.input.my=1;R.tick(1/60);for(const q of G.projs)if(q.kind==='bjflush'&&!seen.has(q)){seen.add(q);shots++;}if(p.flush)ms=Math.max(ms,window.__ms(p));}
   out.push(`stream ${r0}: ${shots} shots, ${(h-o.hp).toFixed(0)} dmg to Cora (per shot ${(14+0.1*p.ad).toFixed(1)} pre-armour), moved ${Math.abs(p.y-y0)|0} units, ms during ${ms|0}/${p.baseMs|0}`);
   p.cds.R=0;tc(p,'R',o.x,o.y);T(30);const rc=tc(p,'R',o.x,o.y);out.push(`recast: ${rc}, stream ended ${!p.flush}`);
   // 4) fire slow ramp
   G.trails=[];o.x=3000;o.y=650;o.stunT=0;o.slows=[];G.trails.push({x0:2900,y0:650,x1:3150,y1:650,src:p,r:3,until:G.t+3,next:G.t+0.1,t0:G.t});const sl=[];h=o.hp;
   for(let i=0;i<90;i++){R.tick(1/60);o.x=3000;o.y=650;if(i%15===0)sl.push((1-window.__ms(o)/o.baseMs).toFixed(2));}
   out.push(`fire slow over 1.5s: ${sl.join(' ')} | burn dmg ${(h-o.hp).toFixed(0)}`);
   // 5) coin
   G.trails=[];o.slows=[];o.x=2900;o.y=750;p.x=2500;p.y=650;p.cds.RMB=0;h=o.hp;tc(p,'RMB',2900,650);let rooted=0;for(let i=0;i<120;i++){R.tick(1/60);o.stunT=0;if(o.rootT>0)rooted++;}
   out.push(`coin: dmg ${(h-o.hp).toFixed(0)}, Cora pulled to ${o.x|0},${o.y|0} (coin at 2900,650), rooted ${(rooted/60).toFixed(2)}s`);
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
