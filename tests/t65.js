const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1280,height:720}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="viktor"]').click();document.querySelector('.mapcard[data-v="col"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const T=n=>{for(let i=0;i<n;i++)R.tick(1/60);};for(let i=0;i<60*60&&G.col.state!=="fight";i++)R.tick(1/60);G.autoPlayer=false;const p=G.player,o=G.bot,K=window.__COL;
   p.ranks.RMB=3;const a=p.def.ab.RMB,out=[];
   for(const d of [80,150,220,300,380,440]){p.x=K.cx-250;p.y=K.cy+120;p.dash=null;p.cast=null;p.cds.RMB=0;o.alive=true;o.hp=o.maxHp;o.stunT=0;o.dash=null;o.x=p.x+d;o.y=p.y;o.stunT=999;o.slows=[];
     const h0=o.hp,ok=window.__tc(p,"RMB",o.x,o.y);const np=G.projs.filter(q=>q.kind==='pellet').length;T(40);
     out.push(`d=${d}: cast ${ok}, pellets ${np}, dmg ${(h0-o.hp)|0} (full blast pre-armor ${a.blast(p,3)|0}), foe pushed to ${(o.x-p.x)|0}, viktor recoiled ${(K.cx-250-p.x)|0}`);}
   // pellets into a minion-free wall: stop on a ruin
   const rk=K.rocks[0],an=Math.atan2(rk.y-K.cy,rk.x-K.cx);p.x=rk.x-Math.cos(an)*150;p.y=rk.y-Math.sin(an)*150;p.dash=null;p.cds.RMB=0;o.x=rk.x+Math.cos(an)*120;o.y=rk.y+Math.sin(an)*120;o.hp=o.maxHp;
   window.__tc(p,"RMB",o.x,o.y);T(40);out.push(`behind a ruin: dmg ${(o.maxHp-o.hp)|0}`);
   // set up a visual
   o.hp=o.maxHp;p.x=K.cx-250;p.y=K.cy+120;p.dash=null;p.cds.RMB=0;o.x=p.x+230;o.y=p.y-60;window.__tc(p,"RMB",o.x,o.y);T(3);G.hitStop=999;document.getElementById("banner").hidden=true;
   return out.join("\n");}));
 await pg.waitForTimeout(150);await pg.screenshot({path:'kick.png',clip:{x:560,y:220,width:720,height:380}});
 console.log('errors',errs);await b.close();})();
