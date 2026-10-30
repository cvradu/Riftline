// Black Jack's coin and Royal Flush sprites, and the last-hit marker on minions
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(1200);
 await pg.click('.mapcard[data-v="lane"]');await pg.click('.card[data-k="blackjack"]');await pg.click('#optFoe button[data-v="cora"]');await pg.click('#startBtn');await pg.waitForTimeout(600);await pg.mouse.move(150,350);
 const T=async(n,shot)=>{await pg.evaluate(n=>{for(let i=0;i<n;i++)window.__riftline.tick(1/60);},n);if(shot){await pg.waitForTimeout(250);await pg.screenshot({path:shot,clip:{x:290,y:110,width:700,height:480}});}};
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;G.minions=[];G.spawnQ=[];G.nextWave=1e9;G.hitStop=1e9;
   p.level=6;p.ranks.RMB=1;p.ranks.R=1;p.points=0;p.x=2500;p.y=650;o.x=2900;o.y=650;o.stunT=1e9;p.cds.RMB=0;p.cds.R=0;
   return 'coin '+window.__tc(p,'RMB',2850,650);}));
 await T(9,'bj_coin1.png');   // mid-throw, coin in flight
 await T(20,'bj_coin2.png');  // landed
 await T(12,'bj_coin3.png');  // popping
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;o.stunT=1e9;o.x=3000;o.y=700;p.cds.R=0;const h=o.hp;const r=window.__tc(p,'R',3000,650);return 'flush '+r+' state '+!!p.flush;}));
 await T(8,'bj_flush1.png');await T(22,'bj_flush2.png');await T(30,'bj_flush3.png');
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player;for(let i=0;i<180;i++)R.tick(1/60);return 'flush over '+!p.flush+' cora hp '+(G.bot.hp|0)+'/'+(G.bot.maxHp|0);}));
 // minions: spawn a wave beside the player, wound a few to just above / below last-hit range
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,o=G.bot;o.x=4500;G.nextWave=G.t;for(let i=0;i<2;i++)R.tick(1/60);
   const en=G.minions.filter(m=>m.team!==p.team);const fr=G.minions.filter(m=>m.team===p.team);
   en.forEach((m,i)=>{m.x=2700+i*55;m.y=560+(i%2)*120;m.stunT=1e9;});fr.forEach(m=>{m.x=1500;m.stunT=1e9;});p.x=2450;p.y=650;
   const d=p.ad*100/(100+(en[0].armor||0));en.forEach((m,i)=>{m.hp=i<2?d*0.9:i<4?d*1.4:m.maxHp;});
   return `enemy minions ${en.length}, auto dmg ${d.toFixed(0)}`;}));
 await T(1,'lasthit.png');
 console.log(await pg.evaluate(()=>{const R=window.__riftline,G=R.G,p=G.player,m=G.minions.find(m=>m.team!==p.team);const lv0=p.xp;p.atkCd=0;p.input.attack=true;
   // land a last hit: simulate a kill from the player, then a kill from a tower
   const xp0=p.xp;m.hp=1;m.x=p.x+200;m.y=p.y;m.stunT=0;p.loaded=false;
   let n=0;G.player.order={kind:'attack',t:m};for(let i=0;i<120&&m.alive;i++){R.tick(1/60);n++;}
   const own=p.xp-xp0;const m2=G.minions.find(u=>u.team!==p.team&&u.alive);const xp1=p.xp;m2.hp=0.5;window.__riftline;m2.alive=true;
   return `last hit killed ${!m.alive} in ${n} ticks, xp gain ${own.toFixed(1)} (minion xp ${m.xp}, rate ${G.xpRate})`;}));
 console.log('errors',errs);await b.close();})();
