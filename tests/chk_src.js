
(()=>{
'use strict';
// The same numbers in every browser: engines may round sin, cos and atan differently in the last bit, which would let two
// copies of an online match drift apart, so these are built from + - * / and sqrt, which every engine rounds identically.
const Math=(()=>{const N=globalThis.Math,o=Object.create(N),H1=1.5707963267948966,H2=6.123233995736766e-17,HP=N.PI/2;
  const ps=r=>{const z=r*r;return r*(1+z*(-1/6+z*(1/120+z*(-1/5040+z*(1/362880+z*(-1/39916800+z*(1/6227020800)))))));};
  const pc=r=>{const z=r*r;return 1+z*(-1/2+z*(1/24+z*(-1/720+z*(1/40320+z*(-1/3628800+z*(1/479001600+z*(-1/87178291200)))))));};
  const trig=(x,c)=>{if(!(x>-1e9&&x<1e9))return NaN;const k=N.round(x/H1),r=(x-k*H1)-k*H2,q=(((k+c)%4)+4)%4;return q===0?ps(r):q===1?pc(r):q===2?-ps(r):-pc(r);};
  const at=x=>{if(x!==x)return NaN;let s=1,inv=false;if(x<0){x=-x;s=-1;}if(x>1){x=1/x;inv=true;}
    x=x/(1+N.sqrt(1+x*x));x=x/(1+N.sqrt(1+x*x));const z=x*x;let t=0;for(let n=11;n>=0;n--)t=1/(2*n+1)-z*t;const r=4*x*t;return s*(inv?HP-r:r);};
  o.sin=x=>trig(x,0);o.cos=x=>trig(x,1);o.atan=at;
  o.atan2=(y,x)=>x>0?at(y/x):x<0?(y>=0?at(y/x)+N.PI:at(y/x)-N.PI):y>0?HP:y<0?-HP:0;
  o.hypot=(x,y,z)=>N.sqrt(x*x+y*y+(z?z*z:0));
  return o;})();
const $=id=>document.getElementById(id);

// ================= world constants =================
const W=6400,H=1300,LANE_TOP=200,LANE_BOT=1150,MIDY=650;  // LANE_TOP/BOT: the bridge deck's usual edges (the deck itself is LANE_POLY)
const BLUE=0,RED=1;
const TEAMC=['#4aa8ff','#ff5d52'],TEAMD=['#1b4a78','#7a2520'],TEAML=['#9fd0ff','#ffb0a8'];
const FOUNT=[{x:250,y:MIDY},{x:W-250,y:MIDY}],FOUNT_R=320;
const TOWER_X=[1624,W-1624];  // on the small emblems of the bridge art
const SPAWN_X=[620,W-620];
const RELIC_POS=[{x:3290,y:-200},{x:3110,y:1640}];  // healing crystals in the bridge's two alcoves
const WAVE_INT=30;
const XP_NEXT=[280,380,480,580,680,780,880,980,1080,1180,1280,1380,1480,1580,1680,1780,1880];
const KILL_XP=[42,114,144,174,204,234,308,392,486,612,762,936,1134,1356,1602,1872,2166,2484];
const ABK=['Q','E','RMB','R'];
const gf=n=>(n-1)*(0.7025+0.0175*(n-1)); // League stat growth curve
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const hyp=Math.hypot,PI=Math.PI,TAU=PI*2;
const dist=(a,b)=>hyp(a.x-b.x,a.y-b.y);
const edge=(a,b)=>dist(a,b)-a.r-b.r;
const angTo=(a,x,y)=>Math.atan2(y-a.y,x-a.x);
const angDiff=(a,b)=>{let d=(a-b)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return Math.abs(d)};
const n0=v=>Math.round(v);
const rnd=(a,b)=>a+Math.random()*(b-a);  // cosmetic randomness only
// gameplay randomness comes from a seeded stream, so every copy of a match rolls the same numbers (online play depends on it)
let SIM_RNG=Math.random;
const srand=()=>SIM_RNG(),srnd=(a,b)=>a+SIM_RNG()*(b-a);
let UID=1,G=null;

// ================= champion kits =================
const CH={
  cora:{key:'cora',name:'Cora',fullName:'Coralisse',role:'Skirmisher',reach:'Melee',resource:'Corruption',r:32,ranged:false,
    blurb:'A dual-axe skirmisher. Throws her bronze axe to cut a wide, bleeding path, hooks her chained blue axe into enemies, walls or her own axe to drag herself in, rips the ground open, and locks her prey inside a ring of chains. She grows deadlier and more fragile as Corruption spreads.',
    base:{hp:660,hpG:109,hp5:8,hp5G:0.8,res:100,resG:0,rg5:0,rg5G:0,ad:68,adG:3.6,as:0.75,asG:3,armor:35,armorG:4.5,mr:32,mrG:2.05,ms:345,range:150,windup:0.25,proj:0},
    castKind:{Q:'swing',E:'swing',RMB:'slam',R:'slam'},
    dash:{name:'Leap',desc:'Leap up to 375 units toward the cursor. Enemies within 175 units of where you land are slowed by 25% for 1s.',
      cast(c,ax,ay){const ang=angTo(c,ax,ay),len=clamp(hyp(ax-c.x,ay-c.y),120,375);
        dash(c,ang,len,1100,{leap:true,onEnd:()=>{for(const u of enemiesOf(c.team))if(u.kind!=='tower'&&hittable(u)&&dist(c,u)<175+u.r)slow(u,0.25,1);ring(c.x,c.y,10,175,'#e8a25a',0.4);spark(c.x,c.y,'#c9b9a0',10);}});return true;}},
    ab:{}},
  shade:{key:'shade',name:'Shade',role:'Assassin',reach:'Melee',resource:'Energy',r:30,ranged:false,
    blurb:'A dual-blade hunter. Marks prey with shurikens, slips through them, and punishes every ability hit with a crossing double strike.',
    passive:{name:'Crosscut',desc:c=>`Hitting an enemy champion with an ability marks them for 3s. Your next basic attack against them strikes with both blades, consuming the mark for <span class="ph">${n0(crossDmg(c))}</span> bonus physical damage (25 + 9 per level + 50% AD) and 30% decaying move speed for 1.5s. Each ability cast applies one mark per target.`},
    base:{hp:680,hpG:102,hp5:7,hp5G:0.65,res:200,resG:0,rg5:50,rg5G:0,ad:63,adG:3.4,as:0.75,asG:3.3,armor:32,armorG:4.7,mr:32,mrG:2.05,ms:345,range:125,windup:0.25,proj:0},
    castKind:{Q:'q',E:'e',RMB:'rmb',R:'r'},
    dash:{name:'Shadow Step',desc:'Instantly blink up to 325 units toward the cursor. A blink can carry you out through the chains of The Hunger Between.',
      cast(c,ax,ay){const ang=angTo(c,ax,ay),len=Math.min(325,hyp(ax-c.x,ay-c.y));ghost(c);spark(c.x,c.y,'#b48cff',8);c.blinkT=G.t;
        c.x+=Math.cos(ang)*len;c.y+=Math.sin(ang)*len;clampUnit(c);c.facing=ang;ghost(c);spark(c.x,c.y,'#b48cff',8);return true;}},
    ab:{}}
};
const A1=CH.cora.ab,S1=CH.shade.ab;
// ---- Coralisse: a recallable bronze axe that bleeds, a chained blue axe that drags her, a ground-splitting fissure and a chain arena;
// Corruption trades durability for damage and life steal ----
// Prototype tuning, not validated balance.
const CORA_AXES={Q:{name:'bronze',col:'#ffb347',glow:'#ff9a3c',kind:'axeQ'},RMB:{name:'blue',col:'#7cc8ff',glow:'#4aa8ff',kind:'axeW'}};
const AXE_LIFE=4,AXE_W=75;
function gainCorr(c,n){if(c.def.resource!=='Corruption')return;c.res=Math.min(100,c.res+n);c.corrT=G.t;}
const corrStage=c=>Math.min(5,Math.floor((c.res||0)/20));
// one Corruption grant per cast, on the first champion that cast hits
function axeHit(c,tok,t){if(t.kind==='champ'&&!tok.g){tok.g=true;gainCorr(c,10);}}
function axeLand(c,k,x,y){const ax=c.axes[k];ax.proj=null;ax.state='ground';ax.x=x;ax.y=y;ax.until=G.t+AXE_LIFE;ax.t0=G.t;ax.r=false;ring(x,y,10,60,CORA_AXES[k].glow,0.3);}
function stopFlight(ax){if(ax.proj){ax.proj.alive=false;ax.proj.onEnd=null;ax.proj=null;}}
function axePos(ax){return ax.state==='flying'&&ax.proj?{x:ax.proj.x,y:ax.proj.y}:{x:ax.x,y:ax.y};}
// timed-out axes drift home harmlessly; only an active recall cuts through enemies
function returnAxe(c,k){const ax=c.axes[k];if(ax.state==='hand'||ax.state==='returning')return;
  if(!c.alive||ax.state==='flying'){stopFlight(ax);ax.state='hand';return;}
  ax.state='returning';G.projs.push({homing:c,x:ax.x,y:ax.y,speed:1700,team:c.team,src:c,kind:CORA_AXES[k].kind,alive:true,age:0,ang:0,onHit:()=>{ax.state='hand';},onLost:()=>{ax.state='hand';}});}
// walking over a grounded axe picks it up with its cooldown reset
function pickAxe(c,k){const ax=c.axes[k];ax.state='hand';ax.readyAt=G.t;spark(ax.x,ax.y,CORA_AXES[k].glow,6);if(c===G.player)popText(c.x,c.y,'Axe ready','#ffcf7a',14,130);}
const axeReady=(c,k)=>c.axes[k].state==='hand'&&G.t>=(c.axes[k].readyAt||0);
const readyAxe=c=>axeReady(c,'Q')?'Q':null;
const axesInHand=c=>(c.axes.Q.state==='hand')+(c.axes.RMB.state==='hand');
// the next recall takes whichever axe was thrown first
function oldestOut(c){let best=null;for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.r||!(ax.state==='ground'||ax.state==='flying'))continue;if(!best||(ax.thrownAt||0)<(c.axes[best].thrownAt||0))best=k;}return best;}
function updateAxes(c){
  if(!c.axes)return;
  for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.state!=='ground'||ax.r)continue;
    if(c.dash&&c.dash.claim===k)continue;
    if(G.t>ax.until)returnAxe(c,k);
    else if(c.alive&&!c.dash&&G.t-ax.t0>0.5&&dist(c,ax)<c.r+30)pickAxe(c,k);}
  c.cds.Q=Math.max(0,(c.axes.Q.readyAt||0)-G.t);
}
function throwAxe(c,k,ax_,ay_,o){
  const ang=angTo(c,ax_,ay_),len=clamp(hyp(ax_-c.x,ay_-c.y),100,o.range);
  const tp=clampWalk(c.x+Math.cos(ang)*len,c.y+Math.sin(ang)*len,40),tx=tp.x,ty=tp.y,L=hyp(tx-c.x,ty-c.y);
  const tok={g:false},ax=c.axes[k];ax.state='flying';ax.thrownAt=G.t;
  ax.proj=shoot(c,{ang:angTo(c,tx,ty),speed:o.speed,range:L,radius:o.radius,pierce:true,overWalls:true,kind:CORA_AXES[k].kind,
    onHit:t=>{dealDamage(c,t,o.dmg,'phys',{});if(o.bleed)bleed(t,c,o.bleed);axeHit(c,tok,t);spark(t.x,t.y,CORA_AXES[k].glow,6);t.kick={until:G.t+0.12,ang};if(o.onHit)o.onHit(t);},
    onEnd:p=>{let lx=tx,ly=ty;if(p&&p.blocked){const q=clampWalk(p.x-p.vx/p.speed*24,p.y-p.vy/p.speed*24,24);lx=q.x;ly=q.y;}  // stopped by a wall or a ruin: it drops there
      axeLand(c,k,lx,ly);if(o.onLand)o.onLand(lx,ly,tok);}});
}
// bleed: a short physical damage-over-time from her axes, 4 ticks over 2s; a fresh hit replaces the old bleed
function bleed(u,src,total){if(!u.alive||u.kind==='tower')return;u.bleed={src,per:total/4,n:4,next:G.t+0.5};}
function updateBleeds(){for(const u of [...G.champs,...G.minions]){const b=u.bleed;if(!b)continue;if(!u.alive){u.bleed=null;continue;}
  if(G.t>=b.next){b.next+=0.5;b.n--;dealDamage(b.src,u,b.per,'phys',{});spark(u.x,u.y,'#d42a3a',4);if(b.n<=0)u.bleed=null;}}}
// recall: the axe flies back from wherever it is, hitting everything along the way, and arms the cleave when caught
function recallAxe(c,k,dmg){
  const ax=c.axes[k],from=axePos(ax);stopFlight(ax);ax.state='returning';const tok={g:false},hit=new Set();
  G.projs.push({homing:c,x:from.x,y:from.y,speed:2100,team:c.team,src:c,kind:CORA_AXES[k].kind,alive:true,age:0,ang:0,
    sweep:{hit,radius:AXE_W,onHit:u=>{dealDamage(c,u,dmg,'phys',{});bleed(u,c,A1.Q.bleed(c,Math.max(1,c.ranks.Q)));axeHit(c,tok,u);spark(u.x,u.y,CORA_AXES[k].glow,8);u.kick={until:G.t+0.12,ang:angTo(u,c.x,c.y)};}},
    onHit:()=>{ax.state='hand';ring(c.x,c.y,10,80,CORA_AXES[k].glow,0.35);
      c.cleaveReady={until:G.t+5,dmg:A1.Q.cleave(c,Math.max(1,c.ranks.Q))};if(c===G.player)popText(c.x,c.y,'Cleave ready','#ffb347',14,130);},
    onLost:()=>{ax.state='hand';}});
  SFX.play('dash',from.x,from.y,0.7);
}
A1.Q={name:"Mother's Wrath",max:5,cd:[9,8.5,8,7.5,7],cost:[0,0,0,0,0],range:575,manualCd:true,
  dmg:(c,r)=>[62,96,130,164,198][r-1]+0.72*c.ad, cleave:(c,r)=>[28,45,62,79,96][r-1]+0.45*c.ad, bleed:(c,r)=>[25,37,50,62,75][r-1]+0.2*c.ad,
  desc:(c,r,a)=>`Throw your bronze axe to your cursor, up to 575 units away. In flight it cuts a wide path, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (62/96/130/164/198 + 72% AD) to everything it passes through, flying straight over ruins and walls, and making them bleed for <span class="ph">${n0(a.bleed(c,r))}</span> physical damage (25/37/50/62/75 + 20% AD) over 2s. Enemies where it lands are slowed by 35% for 1s. The axe stays there for 4s as an anchor for Father's Chain, then returns to you.<br><br>Recast to <b>recall</b> it: it flies back to you, hitting and bleeding everything on the way for 60% of the throw's damage, and catching it makes your next basic attack cleave for <span class="ph">${n0(a.cleave(c,r))}</span> bonus damage. Walk over the grounded axe to pick it up with the cooldown reset. The ${(a.cd[r-1]*100/(100+c.ah)).toFixed(1)}s cooldown starts when the axe is thrown.`,
  canRecast:c=>!!c.axes&&!c.axes.Q.r&&(c.axes.Q.state==='ground'||c.axes.Q.state==='flying'),
  recast(c){recallAxe(c,'Q',A1.Q.dmg(c,Math.max(1,c.ranks.Q))*0.6);c.castAnim={start:G.t,W:0.05,kind:'roar'};return true;},
  cast(c,ax,ay,r,a){if(!axeReady(c,'Q')){c.failWhy='cooldown';return false;}
    const ang=angTo(c,ax,ay),axe=c.axes.Q;axe.readyAt=G.t+a.cd[r-1]*100/(100+c.ah);
    beginCast(c,0.18,ang,()=>{if(axe.state!=='hand')return;
      throwAxe(c,'Q',ax,ay,{range:575,speed:1500,radius:AXE_W,dmg:a.dmg(c,r),bleed:a.bleed(c,r),onLand:(x,y,tok)=>{
        for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||hyp(u.x-x,u.y-y)>160+u.r)continue;slow(u,0.35,1);}
        ring(x,y,20,160,CORA_AXES.Q.col,0.35);}});});return true;}};
A1.RMB={name:'Earthrend',max:5,cd:[11,10,9,8,7],cost:[0,0,0,0,0],range:700,
  dmg:(c,r)=>[62,96,130,164,198][r-1]+0.62*c.ad,
  desc:(c,r,a)=>`Drive an axe into the ground and rip it open in a straight line. After 0.25s a fissure tears 700 units ahead of you, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (62/96/130/164/198 + 62% AD) to every enemy it reaches and slowing them by 30% for 1.5s.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.25,ang,()=>{
    let len=700;if(isCol())for(let s2=40;s2<=700;s2+=20)if(colBlocked(c.x+Math.cos(ang)*s2,c.y+Math.sin(ang)*s2)){len=s2-20;break;}  // the fissure stops at walls and ruins
    G.rifts.push({x0:c.x+Math.cos(ang)*c.r,y0:c.y+Math.sin(ang)*c.r,ux:Math.cos(ang),uy:Math.sin(ang),len,speed:2000,half:65,t:0,spawned:0,
      hit:new Set(),tok:{g:false},dmg:a.dmg(c,r),src:c,seed:(srand()*1e9)|0});
    SFX.play('quake',c.x,c.y);if(c===G.player)shake(5,0.25);});return true;}};
// E: the blue axe flies out on a chain and bites the first enemy champion, wall, tower, arena chain or grounded bronze axe it meets, then drags her there
const HOOK_RANGE=700,HOOK_SPEED=2200,HOOK_R=34;
function hookWall(c,x,y){
  if(isCol()){const dx=x-COL.cx,dy=y-COL.cy,d=hyp(dx,dy)||1,rb=colRB(Math.atan2(dy,dx));
    if(d>rb-8)return{x:COL.cx+dx/d*(rb-8),y:COL.cy+dy/d*(rb-8)};
    for(const o of COL.rocks){const e=hyp(x-o.x,y-o.y);if(e<o.r+6)return{x:o.x+(x-o.x)/(e||1)*(o.r+6),y:o.y+(y-o.y)/(e||1)*(o.r+6)};}
    const q=colQuake();if(q&&Math.abs(dx*q.nx+dy*q.ny)<q.half+4)return{x,y};}
  else if(!laneInside(x,y)||laneEdge(x,y).d<8){const p={x,y};laneClamp(p,8);return p;}
  for(const t of G.towers){const d=hyp(x-t.x,y-t.y),m=t.r*0.85+6;if(d<m)return{x:t.x+(x-t.x)/d*m,y:t.y+(y-t.y)/d*m};}
  const a=G.arena;if(a&&!a.snapped&&a.inside.has(c)){const d=hyp(x-a.x,y-a.y);if(d>a.R-8)return{x:a.x+(x-a.x)/d*(a.R-8),y:a.y+(y-a.y)/d*(a.R-8)};}
  return null;}
function endHook(c){c.hook=null;if(c.axes)c.axes.RMB.state='hand';}
function hookCatch(c){c.cleaveReady={until:G.t+5,dmg:A1.Q.cleave(c,Math.max(1,c.ranks.Q))};if(c===G.player)popText(c.x,c.y,'Cleave ready','#ffb347',14,130);}
function updateHook(c,dt){const h=c.hook;
  if(!h){if(c.axes&&c.axes.RMB.state==='chain'&&!c.cast)c.axes.RMB.state='hand';return;}
  if(!c.alive){endHook(c);return;}
  if(h.state==='out'){
    if(c.stunT>0){h.state='back';return;}
    c.rootT=Math.max(c.rootT,0.05);
    const step=HOOK_SPEED*dt;h.x+=h.ux*step;h.y+=h.uy*step;h.d+=step;
    for(const u of G.champs){if(u.team===c.team||!u.alive||!targetable(u)||!hittable(u)||hyp(u.x-h.x,u.y-h.y)>u.r+HOOK_R)continue;
      const r=h.rank;dealDamage(c,u,A1.E.dmg(c,r),'phys',{});bleed(u,c,A1.E.bleed(c,r));axeHit(c,{g:false},u);impact(u,'#7cc8ff',true);u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};
      if(c===G.player||u===G.player)shake(4,0.12);SFX.play('hit',u.x,u.y);
      h.state='drag';h.u=u;h.x=u.x;h.y=u.y;
      dash(c,angTo(c,u.x,u.y),HOOK_RANGE*2,1900,{kind:'E',interrupt:true,onCancel:()=>endHook(c),onTick:()=>{const d=c.dash;if(!u.alive){d.t=0;return;}
          const a=angTo(c,u.x,u.y);d.vx=Math.cos(a)*1900;d.vy=Math.sin(a)*1900;c.facing=a;if(dist(c,u)<=c.r+u.r+20)d.t=0;},
        onEnd:()=>{endHook(c);hookCatch(c);}});
      return;}
    const q=c.axes.Q;
    if(q.state==='ground'&&hyp(q.x-h.x,q.y-h.y)<HOOK_R+30){h.state='drag';h.x=q.x;h.y=q.y;
      dash(c,angTo(c,q.x,q.y),Math.max(1,dist(c,q)),1900,{kind:'E',claim:'Q',interrupt:true,onCancel:()=>endHook(c),onEnd:()=>{endHook(c);
        if(q.state==='ground'){q.state='hand';gainCorr(c,10);ring(c.x,c.y,10,90,CORA_AXES.Q.glow,0.35);hookCatch(c);}}});return;}
    const w=hookWall(c,h.x,h.y);
    if(w){h.state='drag';h.x=w.x;h.y=w.y;spark(w.x,w.y,'#cfe6ff',8);ring(w.x,w.y,6,50,'#7cc8ff',0.25);SFX.play('towerHit',w.x,w.y,0.5);
      const len=dist(c,w)-c.r-4;if(len<8){endHook(c);return;}
      dash(c,angTo(c,w.x,w.y),len,1900,{kind:'E',interrupt:true,onCancel:()=>endHook(c),onEnd:()=>endHook(c)});return;}
    if(h.d>=HOOK_RANGE)h.state='back';
  }else if(h.state==='back'){const dx=c.x-h.x,dy=c.y-h.y,l=hyp(dx,dy),step=HOOK_SPEED*1.3*dt;if(l<=step+c.r){endHook(c);return;}h.x+=dx/l*step;h.y+=dy/l*step;}
  else if(h.state==='drag'&&h.u){h.x=h.u.x;h.y=h.u.y;}
}
A1.E={name:"Father's Chain",max:5,cd:[14,13,12,11,10],cost:[0,0,0,0,0],range:HOOK_RANGE,
  dmg:(c,r)=>[52,82,112,142,172][r-1]+0.55*c.ad, bleed:(c,r)=>[25,37,50,62,75][r-1]+0.2*c.ad,
  desc:(c,r,a)=>`Hurl your blue axe on its chain, up to ${HOOK_RANGE} units, rooting yourself while it flies. It passes over minions and bites the first thing it meets, then drags you to it:<br>· an <b>enemy champion</b> takes <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (52/82/112/142/172 + 55% AD) and bleeds for <span class="ph">${n0(a.bleed(c,r))}</span> (25/37/50/62/75 + 20% AD) over 2s, and you are pulled to them;<br>· a <b>wall</b>, a <b>tower</b> or the chains of The Hunger Between pull you to that spot;<br>· your grounded <b>bronze axe</b> pulls you to it and you catch it (+10 Corruption).<br>Arriving at a champion or catching the axe makes your next basic attack cleave. Stuns interrupt the drag. A miss reels the chain back in.`,
  cast(c,ax,ay,r,a){if(c.hook||c.axes.RMB.state!=='hand'){c.failWhy='busy';return false;}
    const ang=angTo(c,ax,ay);c.axes.RMB.state='chain';
    beginCast(c,0.12,ang,()=>{if(!c.alive||c.axes.RMB.state!=='chain')return;c.hook={x:c.x+Math.cos(ang)*c.r,y:c.y+Math.sin(ang)*c.r,ux:Math.cos(ang),uy:Math.sin(ang),d:0,state:'out',rank:r};SFX.play('swing',c.x,c.y);});
    return true;}};
// the fissure travels outward, hitting each enemy once as it reaches them
// Jetstep's fire trails: anyone of the other team standing in one burns every half second
function updateTrails(){if(!G.trails.length)return;
  for(const tr of G.trails){if(G.t<tr.next)continue;tr.next+=BJ_TRAIL.tick;const c=tr.src;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!u.alive||!hittable(u))continue;if(segDist(u.x,u.y,tr.x0,tr.y0,tr.x1,tr.y1).d>BJ_TRAIL.half+u.r)continue;
      dealDamage(c,u,B1.E.burn(c,tr.r),'magic',{});spark(u.x,u.y,'#7fe9ff',3);if(u.kind==='champ')bjPrime(c);}}
  G.trails=G.trails.filter(tr=>G.t<tr.until);}
function updateRifts(dt){
  for(const f of G.rifts){f.t+=dt;const reach=Math.min(f.len,f.t*f.speed);
    for(const u of enemiesOf(f.src.team)){if(u.kind==='tower'||f.hit.has(u)||!hittable(u))continue;
      const rx=u.x-f.x0,ry=u.y-f.y0,al=rx*f.ux+ry*f.uy,pp=Math.abs(rx*f.uy-ry*f.ux);
      if(al<-u.r||al>reach+u.r||pp>f.half+u.r)continue;
      f.hit.add(u);dealDamage(f.src,u,f.dmg,'phys',{});slow(u,0.3,1.5);axeHit(f.src,f.tok,u);u.kick={until:G.t+0.16,ang:Math.atan2(f.uy,f.ux)+PI/2};impact(u,'#d9a066',u.kind==='champ');}
    while(f.spawned<reach){const s=f.spawned,px=f.x0+f.ux*s,py=f.y0+f.uy*s;f.spawned+=40;
      for(let i=0;i<2;i++)G.fx.push({k:'rock',x:px+rnd(-f.half,f.half)*f.uy,y:py-rnd(-f.half,f.half)*f.ux,t:0,dur:rnd(0.45,0.75),vz:rnd(160,300),s:rnd(6,13),rot:rnd(0,TAU)});
      G.fx.push({k:'smoke',x:px,y:py,t:0,dur:rnd(0.6,1),r:rnd(16,30),col:'#6b5a48'});}}
  G.rifts=G.rifts.filter(f=>f.t<f.len/f.speed+1.4);
}
// R: both axes slam down and a ring of chains locks her and her prey together; nobody walks, dashes or blinks out until it ends
const ARENA_R=360,ARENA_T=4;
function openArena(c,foe,r){
  const mp=clampWalk((c.x+foe.x)/2,(c.y+foe.y)/2,60),x=mp.x,y=mp.y,R=mulberry((srand()*1e9)|0);
  const a={src:c,target:foe,x,y,R:ARENA_R,start:G.t,until:G.t+ARENA_T,rank:r,inside:new Set(),snapped:false,posts:[]};
  for(const u of G.champs)if(u.alive&&hyp(u.x-x,u.y-y)<ARENA_R-u.r*0.5)a.inside.add(u);a.inside.add(c);a.inside.add(foe);
  for(let i=0;i<22;i++)a.posts.push({a:i/22*TAU+R()*0.08,h:58+R()*26});
  G.arena=a;gainCorr(c,100);
  ring(x,y,20,ARENA_R+40,'#c27bff',0.45);ring(x,y,10,ARENA_R*0.6,'#f0d6ff',0.3);
  for(const p of a.posts){const px=x+Math.cos(p.a)*ARENA_R,py=y+Math.sin(p.a)*ARENA_R;for(let i=0;i<2;i++)G.fx.push({k:'rock',x:px+rnd(-14,14),y:py+rnd(-14,14),t:0,dur:rnd(0.45,0.7),vz:rnd(180,320),s:rnd(6,12),rot:rnd(0,TAU)});}
  SFX.play('quake',x,y);SFX.play('tower',x,y,0.8);
  if(a.inside.has(G.player)){shake(10,0.4);G.hitStop=0.04;}
  if(c===G.player||foe===G.player)popText(x,y,'The Hunger Between','#e6c2ff',18,200);
}
function snapArena(a,dissolve){if(a.snapped)return;a.snapped=true;a.snapT=G.t;
  if(dissolve)return;const c=a.src;
  for(const u of a.inside){if(u.team===c.team||!u.alive||hyp(u.x-a.x,u.y-a.y)>a.R+u.r)continue;
    dealDamage(c,u,A1.R.snap(c,a.rank,u),'phys',{force:true});impact(u,'#b46bff',true);u.kick={until:G.t+0.18,ang:angTo(a,u.x,u.y)};
    for(let i=0;i<4;i++)slash(u.x,u.y,i*PI/4+0.2,'#c27bff');ring(u.x,u.y,10,140,'#e6c2ff',0.4);}
  SFX.play('crit',a.x,a.y);SFX.play('quake',a.x,a.y,0.7);if(a.inside.has(G.player)){shake(12,0.35);G.hitStop=0.07;}
}
// keeps the trapped inside and everyone else out; a dash that hits the chains stops there
function updateArena(){const a=G.arena;if(!a)return;
  if(a.snapped){if(G.t>a.snapT+0.4)G.arena=null;return;}
  if(!a.src.alive||!a.target.alive){snapArena(a,true);return;}
  if(G.t>=a.until){snapArena(a);return;}
  for(const u of G.champs){if(!u.alive)continue;const dx=u.x-a.x,dy=u.y-a.y,d=hyp(dx,dy)||1;
    if(a.inside.has(u)&&d>a.R-u.r&&u.blinkT===G.t){a.inside.delete(u);spark(u.x,u.y,'#e6c2ff',10);if(u===G.player||a.src===G.player)popText(u.x,u.y,'Slipped the chains','#d9b8ff',15,140);continue;}
    if(a.inside.has(u)){const m=a.R-u.r;if(d>m){u.x=a.x+dx/d*m;u.y=a.y+dy/d*m;if(u.dash){const dd=u.dash;u.dash=null;if(dd.onEnd)dd.onEnd();}}}
    else{const m=a.R+u.r;if(d<m){u.x=a.x+dx/d*m;u.y=a.y+dy/d*m;if(u.dash){const dd=u.dash;u.dash=null;if(dd.onEnd)dd.onEnd();}}}}
  for(const m of G.minions){if(!m.alive)continue;const dx=m.x-a.x,dy=m.y-a.y,d=hyp(dx,dy)||1,lim=a.R+m.r;if(d<lim){m.x=a.x+dx/d*lim;m.y=a.y+dy/d*lim;}}
  if(a.inside.has(a.src)){a.src.res=100;a.src.corrT=G.t;}
}
A1.R={name:'The Hunger Between',max:3,cd:[100,85,70],cost:[0,0,0],range:450,
  snap:(c,r,u)=>[90,150,210][r-1]+0.6*c.ad+[0.15,0.2,0.25][r-1]*(u.maxHp-u.hp),
  desc:(c,r,a)=>`Slam both axes into the ground beside an enemy champion within 450 units. A ring of chains (${ARENA_R} radius) erupts around you both for ${ARENA_T}s: nobody inside can walk, dash or blink out, and minions are thrown clear and kept out. While inside you sit at 100 Corruption (+15% damage, 10% life steal), and the chains count as walls for Father's Chain.<br><br>When it ends, or when you recast after 0.5s, the chains snap inward on every enemy still inside for <span class="ph">${[90,150,210][r-1]} + 60% AD + ${[15,20,25][r-1]}% of their missing health</span> physical damage. It ends early without snapping if you or your target dies.`,
  canRecast:c=>!!(G.arena&&G.arena.src===c&&!G.arena.snapped&&G.t>=G.arena.start+0.5),
  recast(c){snapArena(G.arena);return true;},
  avail:c=>G.arena&&G.arena.src===c&&!G.arena.snapped?'chainset':true,
  cast(c,ax,ay,r,a){const foe=G.champs.find(u=>u.team!==c.team);
    if(!foe||!foe.alive||!targetable(foe)||edge(c,foe)>450)return false;
    beginCast(c,0.2,angTo(c,foe.x,foe.y),()=>{if(c.alive&&foe.alive)openArena(c,foe,r);});return true;}};
// ---- Viktor: a ranged bounty hunter who builds Fury with precise shots, then uncages his grafted monster to finish the hunt up close ----
// Prototype tuning, not validated balance.
CH.viktor={key:'viktor',name:'Viktor',role:'Bounty Hunter',reach:'Ranged / Melee',resource:'Fury',r:31,ranged:true,
  blurb:'A ranged bounty hunter with monster grafts. Marks his bounty with a deliberate shot, builds Fury with every hit, drags his prey in with a stretching grafted arm, then uncages the monster to finish the hunt with claws before the Fury runs dry.',
  base:{hp:625,hpG:100,hp5:7,hp5G:0.7,res:100,resG:0,rg5:0,rg5G:0,ad:62,adG:3.3,as:0.7,asG:3,armor:28,armorG:4.2,mr:30,mrG:1.3,ms:335,range:525,windup:0.2,proj:2200},
  castKind:{Q:'shot',E:'shot',RMB:'shot',R:'roar'},
  dash:{name:"Hunter's Roll",desc:'Roll up to 300 units toward the cursor. Works in both forms.',
    cast(c,ax,ay){const ang=angTo(c,ax,ay),len=clamp(hyp(ax-c.x,ay-c.y),120,300);dash(c,ang,len,1250,{kind:'roll'});spark(c.x,c.y,'#c9a27a',6);return true;}},
  ab:{}};
const V1=CH.viktor.ab;
const VIK_MON={hp:[150,240,330],dur:[8,9,10],range:175};
const vikMonster=c=>c.form==='monster';
const vikCd=(c,a,r)=>(vikMonster(c)&&a.mcd?a.mcd:a.cd)[r-1]*100/(100+c.ah);
// Fury: shots and graft abilities build it (more against the bounty); none is gained while uncaged
const VIK_LEAP_FURY=75;
// only fighting champions keeps Fury from cooling, so the monster breaks loose in fights rather than while farming
function gainFury(c,n,minion){if(c.key!=='viktor'||vikMonster(c)||!c.alive)return;const was=c.res;c.res=Math.min(c.maxRes,c.res+n);if(!minion)c.furyT=G.t;
  if(was<VIK_LEAP_FURY&&c.res>=VIK_LEAP_FURY&&c.res<c.maxRes&&c===G.player&&c.ranks.R){popText(c.x,c.y,`Crash Down ready · ${keyLabel('R')}`,'#ff8a4c',15,150);SFX.play('level',c.x,c.y,0.5);}}
const vikBounty=c=>c&&c.bounty&&c.bounty.until>G.t&&c.bounty.t.alive?c.bounty.t:null;
function setBounty(c,t){const fresh=vikBounty(c)!==t;c.bounty={t,until:G.t+6,reveal:G.t+3};if(fresh){ring(t.x,t.y,t.r,t.r+40,'#ff8a4c',0.35);if(c===G.player||t===G.player)popText(t.x,t.y,'Bounty','#ffb36b',15,150);}}
function vikShotHit(c,t){if(t.kind==='champ')gainFury(c,vikBounty(c)===t?10:6);else if(t.kind==='minion'||t.kind==='plant')gainFury(c,2,true);}
function vikTransform(c,r){if(!c.alive||vikMonster(c))return;c.form='monster';c.formRank=r;c.crashReady=G.t+1.5;c.drain=c.maxRes/VIK_MON.dur[r-1];c.res=c.maxRes;
  computeStats(c,false);c.atk=null;c.atkCd=0;
  ring(c.x,c.y,10,220,'#ff5a2e',0.5);ring(c.x,c.y,10,140,'#3a0d08',0.6);for(let i=0;i<10;i++)G.fx.push({k:'rock',x:c.x+rnd(-40,40),y:c.y+rnd(-40,40),t:0,dur:rnd(0.5,0.8),vz:rnd(200,340),s:rnd(5,10),rot:rnd(0,TAU)});
  spark(c.x,c.y,'#ff8a4c',22);SFX.play('quake',c.x,c.y);SFX.play('death',c.x,c.y,0.5);if(c===G.player||dist(c,G.player)<900){shake(8,0.35);G.hitStop=0.04;}
  if(c===G.player)refreshIcons();}
function vikRevert(c){if(!vikMonster(c))return;c.form='human';c.res=0;computeStats(c,false);c.hp=Math.max(1,c.hp);c.atk=null;
  if(c.alive){ring(c.x,c.y,10,140,'#c9a27a',0.4);G.fx.push({k:'smoke',x:c.x,y:c.y,t:0,dur:0.9,r:60,col:'#3a2a22'});}
  if(c===G.player)refreshIcons();}
function updateViktor(c,dt){if(c.key!=='viktor')return;
  c.cds.R=vikMonster(c)?Math.max(0,(c.crashReady||0)-G.t):Math.max(0,(c.rReady||0)-G.t);
  // full Fury uncages the monster by itself (once any dash or aim in progress finishes)
  if(!vikMonster(c)&&c.alive&&c.res>=c.maxRes-0.01&&!c.dash&&!c.cast){vikTransform(c,Math.max(1,c.ranks.R));if(c===G.player)popText(c.x,c.y,'Uncaged','#ff6a3d',18,160);}
  if(vikMonster(c)){c.res-=c.drain*dt;if(c.res<=0)vikRevert(c);}
  else if(G.t-(c.furyT||-99)>8)c.res=Math.max(0,c.res-6*dt);  // Fury cools off out of combat
  updateArm(c,dt);
}
// knockback: a short forced slide that interrupts casts and channels; champions lose control for its duration
function knockback(u,ang,len,dur){if(!u.alive||u.kind==='tower'||u.untargetT>0)return;const sp=len/dur;
  if(u.kind==='champ'){if(u.dash&&u.dash.onCancel)u.dash.onCancel();u.wind=null;u.cast=null;u.recall=null;u.dash={vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,t:dur,total:dur,kind:'knock',ghostT:99};}
  else u.knock={vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,t:dur};}
V1.Q={name:'Bounty Round / Gut Ripper',max:5,cd:[6,5.5,5,4.5,4],mcd:[4.5,4.5,4.5,4.5,4.5],cost:[0,0,0,0,0],range:1000,manualCd:true,
  dmg:(c,r)=>[55,85,115,145,175][r-1]+0.7*c.ad, rip:(c,r)=>[60,90,120,150,180][r-1]+0.7*c.ad, ripBleed:(c,r)=>[35,50,65,80,95][r-1]+0.25*c.ad,
  desc:(c,r,a)=>`<b>${vikMonster(c)?'Gut Ripper (now)':'Bounty Round (now)'}</b><br><b>Human, Bounty Round:</b> after a 0.25s aim, fire a wide, heavy slug up to 1000 units that tears through every enemy in its path for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (55/85/115/145/175 + 70% AD). The first champion hit becomes your <b>bounty</b> for 6s: revealed for 3s, and your revolver hits on them deal 15% more damage and build extra Fury. Grants 10 Fury on a champion. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.<br><br><b>Monster, Gut Ripper:</b> sweep your demonic arm through a short cone for <span class="ph">${n0(a.rip(c,r))}</span> physical damage (60/90/120/150/180 + 70% AD). Your bounty also bleeds for <span class="ph">${n0(a.ripBleed(c,r))}</span> over 2s. 5s cooldown.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);c.cds.Q=vikCd(c,a,r);
    if(vikMonster(c)){beginCast(c,0.15,ang,()=>{const b=vikBounty(c);
      for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>300+u.r||angDiff(angTo(c,u.x,u.y),ang)>0.85)continue;
        dealDamage(c,u,a.rip(c,r),'phys',{});if(u===b)bleed(u,c,a.ripBleed(c,r));u.kick={until:G.t+0.16,ang:angTo(c,u.x,u.y)};impact(u,'#ff6a3d',u.kind==='champ');}
      G.fx.push({k:'smear',x:c.x,y:c.y,z:46,ang,side:1,col:'#ff6a3d',r0:c.r*0.4,r1:300,span:1.7,t:0,dur:0.22});SFX.play('swing',c.x,c.y);});return true;}
    beginCast(c,0.25,ang,()=>{muzzle(c,ang,1.6);SFX.play('crit',c.x,c.y,0.6);
      // a heavy slug: wide, and it tears through everything in its path; the first champion it hits becomes the bounty
      let marked=false;shoot(c,{ang,speed:2400,range:1000,radius:62,pierce:true,kind:'slug',onHit:t=>{dealDamage(c,t,a.dmg(c,r),'phys',{});impact(t,'#ffcf7a',t.kind==='champ');t.kick={until:G.t+0.14,ang};
        if(t.kind==='champ'){if(!marked){marked=true;setBounty(c,t);}gainFury(c,10);}}});});return true;}};
const VIK_PELLETS=7,VIK_SPREAD=0.42;
V1.RMB={name:'Kickback / Molt',max:5,cd:[11,10,9,8,7],mcd:[8,7.5,7,6.5,6],cost:[0,0,0,0,0],range:320,manualCd:true,
  blast:(c,r)=>[60,90,120,150,180][r-1]+0.55*c.ad, molt:(c,r)=>[55,85,115,145,175][r-1]+0.5*c.ad,
  desc:(c,r,a)=>`<b>${vikMonster(c)?'Molt (now)':'Kickback (now)'}</b><br><b>Human, Kickback:</b> pull the scattergun and fire 7 pellets in a cone toward the cursor (about 380 units). Each pellet stops on the first enemy it hits: the first pellet deals 40% and each extra one 10%, up to <span class="ph">${n0(a.blast(c,r))}</span> physical damage (60/90/120/150/180 + 55% AD) when all seven land point-blank. The first pellet knocks the enemy back 220 units, interrupting what they were doing, while the recoil throws you 320 units the other way. Grants 10 Fury on a champion. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.<br><br><b>Monster, Molt:</b> shed the carapace in a burst, dealing <span class="ph">${n0(a.molt(c,r))}</span> physical damage (55/85/115/145/175 + 50% AD) to enemies within 270 units, slowing them by 40% for 1.5s, and gaining a burst of move speed. Use it to stick, or to get out before the Fury runs dry.`,
  cast(c,ax,ay,r,a){c.cds.RMB=vikCd(c,a,r);
    if(vikMonster(c)){for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>270+u.r)continue;dealDamage(c,u,a.molt(c,r),'phys',{});slow(u,0.4,1.5);u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};}
      c.msBuff={until:G.t+1.5,pct:0.5};ring(c.x,c.y,10,270,'#e8c7a0',0.35);
      for(let i=0;i<12;i++)G.fx.push({k:'rock',x:c.x+rnd(-30,30),y:c.y+rnd(-30,30),t:0,dur:rnd(0.4,0.7),vz:rnd(160,300),s:rnd(5,9),rot:rnd(0,TAU)});SFX.play('quake',c.x,c.y,0.6);return true;}
    // seven pellets fanned across the cone: each stops on the first thing it hits, so point-blank all of them land and at range only a few do
    const ang=angTo(c,ax,ay);c.facing=ang;const hits=new Map();let champ=false;
    for(let i=0;i<VIK_PELLETS;i++){const pa=ang+(i/(VIK_PELLETS-1)-0.5)*2*VIK_SPREAD+srnd(-0.03,0.03);
      shoot(c,{ang:pa,speed:srnd(2500,2800),range:srnd(370,400),radius:14,kind:'pellet',onHit:t=>{const n=hits.get(t)||0;hits.set(t,n+1);
        dealDamage(c,t,a.blast(c,r)*(n?0.1:0.4),'phys',{});
        if(!n){knockback(t,angTo(c,t.x,t.y),220,0.22);impact(t,'#ffcf7a',t.kind==='champ');if(t.kind==='champ'&&!champ){champ=true;gainFury(c,10);}}
        else spark(t.x,t.y,'#ffd27a',2);},
        onEnd:p=>{if(!p.blocked)spark(p.x,p.y,'#c9b48e',1);}});}
    muzzle(c,ang,2.4);
    dash(c,ang+PI,320,1450,{kind:'recoil'});c.dash.ghostT=99;c.facing=ang;SFX.play('crit',c.x,c.y);SFX.play('quake',c.x,c.y,0.4);if(c===G.player)shake(6,0.18);
    return true;}};
// Dragline: the grafted arm stretches out like sinew with an oversized hand; it grabs the first enemy or minion and snaps back
// with it, grips a wall so Viktor can haul himself across, or springs home empty
const ARM={range:450,speed:2100,back:2400,r:56,hold:3,pull:1700};
V1.E={name:'Dragline / Run Them Down',max:5,cd:[9,8.5,8,7.5,7],mcd:[7,6.5,6,5.5,5],cost:[0,0,0,0,0],range:ARM.range,manualCd:true,
  dmg:(c,r)=>[50,80,110,140,170][r-1]+0.5*c.ad, leap:(c,r)=>[60,95,130,165,200][r-1]+0.55*c.ad,
  desc:(c,r,a)=>`<b>${vikMonster(c)?'Run Them Down (now)':'Dragline (now)'}</b><br><b>Human, Dragline:</b> fling your grafted arm up to ${ARM.range} units. It stretches like sinew and ends in a huge clawed hand that catches anything near its path. The first enemy champion or minion it grabs takes <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (50/80/110/140/170 + 50% AD) and is yanked back to you as the arm snaps home (10 Fury on a champion). If the hand strikes a wall it grips it for ${ARM.hold}s: recast to haul yourself there. Otherwise it springs back empty. You stand still while the arm flies out. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.<br><br><b>Monster, Run Them Down:</b> a short, heavy leap toward the cursor (up to 420 units). Landing deals <span class="ph">${n0(a.leap(c,r))}</span> physical damage (60/95/130/165/200 + 55% AD) around you, and your bounty is slowed by 50% for 1s if they are close. No resets: committing matters.`,
  canRecast:c=>!!(c.arm&&c.arm.state==='wall'),
  recast(c){const h=c.arm,len=dist(c,h)-c.r-4;if(len<8){h.state='back';return true;}h.state='haul';
    dash(c,angTo(c,h.x,h.y),len,1900,{kind:'E',interrupt:true,onCancel:()=>{if(c.arm)c.arm.state='back';},onEnd:()=>{c.arm=null;}});SFX.play('dash',c.x,c.y);return true;},
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);c.cds.E=vikCd(c,a,r);
    if(vikMonster(c)){const len=clamp(hyp(ax-c.x,ay-c.y),150,420),b=vikBounty(c);
      dash(c,ang,len,1150,{leap:true,kind:'leap',onEnd:()=>{for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>200+u.r)continue;dealDamage(c,u,a.leap(c,r),'phys',{});u.kick={until:G.t+0.16,ang:angTo(c,u.x,u.y)};}
        if(b&&dist(c,b)<260+b.r)slow(b,0.5,1);ring(c.x,c.y,10,200,'#ff6a3d',0.35);for(let i=0;i<8;i++)G.fx.push({k:'rock',x:c.x+rnd(-50,50),y:c.y+rnd(-50,50),t:0,dur:rnd(0.4,0.7),vz:rnd(150,280),s:rnd(5,10),rot:rnd(0,TAU)});
        SFX.play('quake',c.x,c.y,0.7);if(c===G.player||b===G.player)shake(6,0.2);}});return true;}
    beginCast(c,0.12,ang,()=>{c.arm={state:'out',x:c.x+Math.cos(ang)*c.r,y:c.y+Math.sin(ang)*c.r,ux:Math.cos(ang),uy:Math.sin(ang),d:0,rank:r,t0:G.t};SFX.play('swing',c.x,c.y);});return true;}};
function updateArm(c,dt){const h=c.arm;if(!h)return;
  if(!c.alive){c.arm=null;return;}
  if(h.state==='out'){
    if(c.stunT>0||(c.dash&&c.dash.kind==='knock')){h.state='back';return;}
    c.rootT=Math.max(c.rootT,0.05);
    const step=ARM.speed*dt,px=h.x,py=h.y;h.x+=h.ux*step;h.y+=h.uy*step;h.d+=step;
    // the first enemy along this stretch of the path, champion or minion, gets grabbed
    let best=null,bt=2;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!u.alive||!hittable(u)||(u.kind==='champ'&&!targetable(u)))continue;const sd=segDist(u.x,u.y,px,py,h.x,h.y);if(sd.d<=u.r+ARM.r&&sd.t<bt){bt=sd.t;best=u;}}
    if(best){const u=best;dealDamage(c,u,V1.E.dmg(c,h.rank),'phys',{});impact(u,'#ff6a3d',u.kind==='champ');SFX.play('hit',u.x,u.y);
      if(u.kind==='champ'){gainFury(c,10);if(c===G.player||u===G.player)shake(4,0.12);}
      const len=Math.max(0,dist(u,c)-c.r-u.r-24),dur=Math.max(0.08,len/ARM.pull);
      if(u.alive&&u.kind!=='plant'&&len>4)knockback(u,angTo(u,c.x,c.y),len,dur);
      h.state='pull';h.u=u;h.x=u.x;h.y=u.y;h.t1=G.t+dur+0.04;return;}
    const w=hookWall(c,h.x,h.y);
    if(w){h.state='wall';h.x=w.x;h.y=w.y;h.until=G.t+ARM.hold;spark(w.x,w.y,'#ff9a6a',8);ring(w.x,w.y,6,60,'#ff6a3d',0.25);SFX.play('towerHit',w.x,w.y,0.5);
      if(c===G.player)popText(w.x,w.y,`Gripped · ${keyLabel('E')} to haul`,'#ffb08a',14,90);return;}
    if(h.d>=ARM.range){h.state='back';h.bt=G.t;}return;}
  if(h.state==='pull'){const u=h.u;h.x=u.x;h.y=u.y;if(!u.alive||G.t>h.t1){h.state='back';h.bt=G.t;}return;}
  if(h.state==='wall'){if(G.t>h.until||c.stunT>0||dist(c,h)>ARM.range+250){h.state='back';h.bt=G.t;}return;}
  if(h.state==='haul')return;
  // back: the arm snaps home like elastic
  const dx=c.x-h.x,dy=c.y-h.y,l=hyp(dx,dy),step=ARM.back*dt;if(l<=step+c.r){c.arm=null;return;}h.x+=dx/l*step;h.y+=dy/l*step;}
const VIK_BEAST_CRASH=4;  // seconds between Crash Downs while uncaged
V1.R={name:'Crash Down',max:3,cd:[55,45,35],cost:[0,0,0],range:600,manualCd:true,
  dmg:(c,r)=>[90,150,210][r-1]+0.6*c.ad,
  desc:(c,r,a)=>`Needs ${VIK_LEAP_FURY} Fury. Crouch for 0.25s, then leap up to 600 units toward the cursor and crash down: enemies within 260 units of where you land take <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (90/150/210 + 60% AD) and are slowed by 40% for 1s, and you land uncaged. The monster gains <span class="ph">${VIK_MON.hp[r-1]}</span> maximum health, 25 armor, claw attacks (175 range, 10% more attack damage, 5% more attack speed), 25 move speed and the monster forms of your abilities, and lasts ${VIK_MON.dur[r-1]}s as the Fury drains. Reaching full Fury uncages you on its own; Crash Down is the way in sooner, from wherever you choose. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.<br><br><b>Uncaged:</b> R is a quick Crash Down you can use whenever you like, no Fury needed: a 500-unit leap that deals <span class="ph">${n0(a.dmg(c,r)*0.7)}</span> physical damage and the same slow where you land. ${VIK_BEAST_CRASH}s between leaps.`,
  avail:c=>vikMonster(c)?(G.t>=(c.crashReady||0)?true:'cooldown'):c.res>=VIK_LEAP_FURY-0.01?true:'nofury',
  cast(c,ax,ay,r,a){const beast=vikMonster(c),ang=angTo(c,ax,ay),len=clamp(hyp(ax-c.x,ay-c.y),120,beast?500:600);
    if(beast)c.crashReady=G.t+VIK_BEAST_CRASH*100/(100+c.ah);else{c.rReady=G.t+a.cd[r-1]*100/(100+c.ah);c.uncaging=G.t;}ring(c.x,c.y,c.r+40,c.r,'#ff5a2e',0.3);SFX.play('cast',c.x,c.y,0.9);
    beginCast(c,beast?0.12:0.25,ang,()=>{const tp=clampWalk(c.x+Math.cos(ang)*len,c.y+Math.sin(ang)*len,c.r),L=Math.max(1,hyp(tp.x-c.x,tp.y-c.y));
      dash(c,ang,L,1300,{leap:true,kind:'crash',onEnd:()=>{
        for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>260+u.r)continue;dealDamage(c,u,a.dmg(c,r)*(beast?0.7:1),'phys',{});slow(u,0.4,1);u.kick={until:G.t+0.2,ang:angTo(c,u.x,u.y)};impact(u,'#ff6a3d',u.kind==='champ');}
        ring(c.x,c.y,10,260,'#ff6a3d',0.45);ring(c.x,c.y,10,170,'#3a0d08',0.55);G.fx.push({k:'smoke',x:c.x,y:c.y,t:0,dur:0.9,r:110,col:'#4a3022'});
        for(let i=0;i<14;i++)G.fx.push({k:'rock',x:c.x+rnd(-70,70),y:c.y+rnd(-70,70),t:0,dur:rnd(0.5,0.8),vz:rnd(200,360),s:rnd(6,12),rot:rnd(0,TAU)});
        if(!beast)vikTransform(c,r);}});SFX.play('dash',c.x,c.y);});
    return true;}};
CH.viktor.passive={name:'Something in the Blood',desc:c=>`Revolver hits and graft abilities build Fury: 6 per revolver hit on a champion (10 on your bounty), 2 on minions, 10 per ability hit, 10 per champion hit with Kickback. Fury only holds while you are fighting champions: 8s without hitting one and it cools. At full Fury the monster breaks loose on its own; from ${VIK_LEAP_FURY} Fury, Crash Down lets you uncage sooner. The monster cannot build Fury, and it drains away, so the window is limited. Out of combat for 8s, Fury slowly cools. Now: ${n0(c.res||0)} Fury${vikMonster(c)?' (uncaged)':''}.`};
// muzzle flash at the revolver: a little forward of him and at hand height
function muzzle(c,ang,big){const x=c.x+Math.cos(ang)*(c.r+18),y=c.y+Math.sin(ang)*(c.r+18);G.fx.push({k:'flash',x,y,z:58,ang,t:0,dur:0.09*(big||1),s:big||1});spark(x,y,'#ffd27a',big?6:3);}

// ---- Viktor's sheets: human and monster, 8 directions x 8 walk frames ----
const VIK_SHEETS={human:{"cw": 179, "ch": 156, "ax": 94, "ay": 139, "h": 122.0},monster:{"cw": 120, "ch": 120, "ax": 61, "ay": 113, "h": 94.0}};VIK_SHEETS.human.img=VIK_SHEETS.monster.img=null;
// the monster is drawn 50% larger than the man
const VIK_H={human:100,monster:150},VIK_STRIDE={human:150,monster:215};let VIK_READY=false;
(function(){let left=2;for(const k of ['human','monster']){const im=new Image();im.onload=()=>{VIK_SHEETS[k].img=im;if(k==='human')buildVikArm(im);if(--left===0){VIK_READY=true;
  for(const b of document.querySelectorAll('#cards .card'))if(b.dataset.k==='viktor')drawPortrait(b.querySelector('canvas'),'viktor',BLUE);if(G&&G.player.key==='viktor')drawPortrait($('portC'),'viktor',G.player.team);}};im.src=`assets/viktor_${k}.webp`;}})();
// the grafted forearm and clawed hand, cut from the front-facing frame and turned to point along +x (hand end to the right)
const VIK_ARM={fore:null,hand:null};
function buildVikArm(im){const cut=(sx,sy,w,h)=>{const c=document.createElement('canvas');c.width=h;c.height=w;const g=c.getContext('2d');g.translate(0,w);g.rotate(-PI/2);g.drawImage(im,sx,sy,w,h,0,0,w,h);return c;};
  VIK_ARM.fore=cut(124,56,18,28);VIK_ARM.hand=cut(119,82,25,30);}
function drawArm(c,h){const F=VIK_ARM.fore,Hn=VIK_ARM.hand;if(!F)return;
  const k=SCALE*VIK_H.human/VIK_SHEETS.human.h,ang0=angTo(c,h.x,h.y),a=P(c.x+Math.cos(ang0)*c.r*0.5,c.y+Math.sin(ang0)*c.r*0.5,58),b=P(h.x,h.y,44),dx=b.x-a.x,dy=b.y-a.y,L=hyp(dx,dy),ang=Math.atan2(dy,dx);
  const tw=F.width*k,th=F.height*k*1.8,n=Math.max(1,Math.ceil(L/(tw*0.8))),back=h.state==='back',wob=back?Math.exp(-(G.t-(h.bt||G.t))*5)*6*SCALE:h.state==='out'?1.5*SCALE:0;
  ctx.save();ctx.translate(a.x,a.y);ctx.rotate(ang);
  // a dark outline first so the sinew reads against any floor, then the forearm texture repeated along the stretch
  ctx.strokeStyle='rgba(20,8,6,.85)';ctx.lineWidth=th*0.95;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<=n;i++){const x=i*L/n,y=Math.sin(i*1.3+G.t*38)*wob;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  for(let i=0;i<n;i++){const x=i*L/n,y=Math.sin(i*1.3+G.t*38)*wob;ctx.drawImage(F,x,-th/2+y,L/n+1.5,th);}
  // glowing sinew where the graft is stretched thin
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(255,110,50,${back?0.35:0.5})`;ctx.lineWidth=Math.max(1,1.6*SCALE);ctx.beginPath();
  for(let i=0;i<=n;i++){const x=i*L/n,y=Math.sin(i*1.3+G.t*38)*wob+Math.sin(i*2.1)*th*0.18;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.globalCompositeOperation='source-over';
  const hw=Hn.width*k*3.4,hh=Hn.height*k*3.4,grip=h.state==='wall'||h.state==='haul'||h.state==='pull'?0.85:1;
  ctx.translate(L,0);ctx.scale(1,grip);ctx.shadowColor='rgba(10,4,2,.9)';ctx.shadowBlur=5*SCALE;ctx.drawImage(Hn,-hw*0.3,-hh/2,hw,hh);ctx.shadowBlur=0;
  if(h.state==='out'){ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(hw*0.2,0,2,hw*0.2,0,hw*0.6);g.addColorStop(0,'rgba(255,140,60,.35)');g.addColorStop(1,'rgba(255,90,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(hw*0.2,0,hw*0.6,0,TAU);ctx.fill();}
  ctx.restore();}
function viktorFrame(u){const fr=viktorFrame0(u);
  // warning: the man flushes red as the monster gets close (from 85 Fury, faster near 100) and pulses hard through Crash Down's crouch
  if(!vikMonster(u)&&u.alive){const crouch=u.cast&&u.uncaging&&G.t-u.uncaging<0.4,f=crouch?1:(u.res-85)/15;
    if(f>0){const hz=crouch?22:6+f*16;fr.tint={col:'#ff1e1e',a:(crouch?0.45:0.18+0.3*f)*(0.55+0.45*Math.sin(G.t*hz))};}}
  return fr;}
function viktorFrame0(u){const m=vikMonster(u)?'monster':'human',S=VIK_SHEETS[m],fa=projAng(u.facing);
  const fr={S,H:VIK_H[m],row:((Math.round((fa-PI/2)/(PI/4))%8)+8)%8,col:0,ox:0,oy:0,rot:0,sx:1,sy:1};
  const lunge=(b,d)=>{fr.ox=Math.cos(fa)*b*d;fr.oy=Math.sin(fa)*b*d*0.7;fr.rot=b*0.1*(Math.cos(fa)>=0?1:-1);fr.sy=1-Math.max(0,-b)*0.05;fr.sx=1+Math.max(0,-b)*0.03;};
  if(u.dash){const p=1-u.dash.t/u.dash.total;fr.col=3;if(u.dash.leap){fr.rot=(p-0.5)*0.3*(Math.cos(fa)>=0?1:-1);fr.sy=p<0.15||p>0.85?0.9:1.05;}else if(u.dash.kind==='roll'){fr.sy=0.85;fr.sx=1.08;fr.rot=Math.sin(p*PI)*0.35*(Math.cos(fa)>=0?1:-1);}else if(u.dash.kind==='recoil'){fr.col=0;fr.ox=-Math.cos(fa)*4;fr.oy=-Math.sin(fa)*3;fr.sy=0.96;}else lunge(0.8,10);return fr;}
  if(u.cast&&u.uncaging&&G.t-u.uncaging<0.7){const k=(G.t-u.uncaging)/0.6;fr.sx=1+0.06*k+Math.sin(G.t*60)*0.02*k;fr.sy=1-0.08*k;fr.ox=Math.sin(G.t*70)*2*k;return fr;}
  const ca=u.castAnim;
  if(ca&&G.t-ca.start<ca.W+0.25){const t=G.t-ca.start,W=Math.max(ca.W,0.001),p=t<W?0.55*t/W:0.55+0.45*Math.min(1,(t-W)/0.25);
    if(ca.kind==='guard'){fr.sy=0.94;fr.sx=1.04;}else if(m==='monster')lunge(kf([[0,0],[0.4,-1],[0.55,1.2],[0.8,0.6],[1,0]],p),14);else lunge(kf([[0,0],[0.5,0],[0.6,-0.9],[1,0]],p),8);
    return fr;}
  const at=u.atk;
  if(at&&G.t-at.start<at.W+0.25){const t=G.t-at.start,W=at.W,p=t<W?0.55*t/W:0.55+0.45*Math.min(1,(t-W)/0.25);
    if(m==='monster'){lunge(kf([[0,0],[0.4,-1],[0.55,1.2],[0.75,0.8],[1,0]],p),15);fr.col=p<0.55?1:5;}else lunge(kf([[0,0],[0.5,0],[0.6,-0.8],[1,0]],p),7);
    return fr;}
  if(hyp(u.vx,u.vy)>30){fr.col=Math.floor(((u.walkD||0)/VIK_STRIDE[m])%1*8);return fr;}
  fr.sy=1+Math.sin(G.t*2.2)*0.012;return fr;}

CH.cora.passive={name:'Corruption',desc:c=>{const st=corrStage(c);return`Corruption runs from 0 to 100. Each ability cast that hits a champion grants 10, and catching your bronze axe with Father's Chain grants 10. The Hunger Between holds you at 100. Every 20 Corruption gives 3% more damage dealt, 2% life steal and 2% more damage taken, up to +15% dealt, 10% life steal and +10% taken. Life steal heals you for that share of all damage you deal, half as much against minions. It starts decaying after 5s without dealing or taking champion damage. Now: ${n0(c.res||0)} (+${st*3}% dealt, ${st*2}% life steal, +${st*2}% taken).`;}};

// Passive: Crosscut. Ability hits mark enemy champions; the next basic attack on them consumes it.
function crossMark(c,t){if(!c.def.passive||t.kind!=='champ'||t.team===c.team||!t.alive)return;const fresh=!(t.crosscut&&t.crosscut.src===c&&t.crosscut.until>G.t);t.crosscut={src:c,until:G.t+3};if(fresh)ring(t.x,t.y,t.r,t.r+30,'#ff4d61',0.3);}
const crossDmg=c=>25+9*c.level+0.5*c.ad;
const shadeQuarry=c=>c.quarry&&c.quarry.until>G.t&&c.quarry.t.alive?c.quarry.t:null;
S1.Q={name:'Scissor Blades',max:5,cd:[8,7.5,7,6.5,6],cost:[45,45,45,45,45],range:340,
  dmg:(c,r)=>[60,95,130,165,200][r-1]+0.9*c.ad,
  desc:(c,r,a)=>`After a 0.24s wind-up, sweep both blades inward across a 340-unit cone for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (60/95/130/165/200 + 90% AD). Enemies where the tips cross, near the end of the cone, take <span class="ph">${n0(a.dmg(c,r)*1.5)}</span> instead, and landing that sweet spot cuts the remaining cooldown by 40%.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.24,ang,()=>{
    const d=a.dmg(c,r),sx=c.x+Math.cos(ang)*255,sy=c.y+Math.sin(ang)*255;let sweet=false;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u))continue;
      if(dist(c,u)>340+u.r||angDiff(angTo(c,u.x,u.y),ang)>0.75)continue;
      const sw=hyp(u.x-sx,u.y-sy)<=75+u.r;dealDamage(c,u,sw?d*1.5:d,'phys',{});crossMark(c,u);u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};
      if(sw){sweet=true;impact(u,'#ff6b7a',true);}}
    if(sweet){c.cds.Q*=0.6;if(c===G.player)popText(c.x,c.y,'Sweet spot','#ff9aa6',14,130);}
    ring(sx,sy,10,85,sweet?'#ff6b7a':'#e6d9ff',0.25);});return true;}};
S1.RMB={name:"Hunter's Shurikens",max:5,cd:[10,9.5,9,8.5,8],cost:[50,50,50,50,50],range:850,
  dmg:(c,r)=>[45,70,95,120,145][r-1]+0.55*c.ad,
  desc:(c,r,a)=>`Throw three shurikens in a narrow fan (850 range). Each deals <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (45/70/95/120/145 + 55% AD) and slows by 20% for 1s; extra shurikens on the same target deal half. The first enemy champion hit is revealed as your quarry for 5s, and your next Slip Through aimed at them reaches 250 units further.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.2,ang,()=>{const d=a.dmg(c,r),hits=new Map();let first=true;
    for(const o of [-0.12,0,0.12])shoot(c,{ang:ang+o,speed:1800,range:850,radius:24,pierce:false,kind:'shuriken',onHit:t=>{
      const n=hits.get(t)||0;hits.set(t,n+1);dealDamage(c,t,n?d*0.5:d,'phys',{});slow(t,0.2,1);spark(t.x,t.y,'#ff8a96',6);crossMark(c,t);
      if(t.kind==='champ'&&first){first=false;c.quarry={t,until:G.t+5};if(c===G.player||t===G.player)popText(t.x,t.y,'Quarry','#ff6b7a',15,135);}}});});return true;}};
S1.E={name:'Slip Through',max:5,cd:[14,13,12,11,10],cost:[40,40,40,40,40],range:300,
  dmg:(c,r)=>[55,85,115,145,175][r-1]+0.6*c.ad,
  desc:(c,r,a)=>`Dash 300 units toward the cursor and slash enemies within 200 units of where you land for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (55/85/115/145/175 + 60% AD). Aimed at your quarry, the dash reaches 250 units further. Pass through your quarry and you can recast within 3s to dash 220 units in any direction.`,
  canRecast:c=>!!(c.eRecast&&c.eRecast.until>G.t),
  recast(c,ax,ay){c.eRecast=null;ghost(c);dash(c,angTo(c,ax,ay),220,1600,{kind:'E'});SFX.play('dash',c.x,c.y);return true;},
  cast(c,ax,ay,r,a){let ang=angTo(c,ax,ay),len=300;const q=shadeQuarry(c);
    if(q&&angDiff(angTo(c,q.x,q.y),ang)<0.6){ang=angTo(c,q.x,q.y);len=Math.min(550,dist(c,q)+c.r+q.r+60);}
    const d=a.dmg(c,r);let passed=false;ghost(c);
    dash(c,ang,Math.max(140,len),1500,{kind:'E',onTick:()=>{if(q&&!passed&&dist(c,q)<c.r+q.r+25)passed=true;},onEnd:()=>{
      for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>200+u.r)continue;dealDamage(c,u,d,'phys',{});crossMark(c,u);u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};}
      ring(c.x,c.y,20,200,'#e6d9ff',0.25);c.castAnim={start:G.t,W:0,kind:'eArrive'};
      if(passed){c.eRecast={until:G.t+3};if(c===G.player)popText(c.x,c.y,'Recast ready','#e6d9ff',14,130);}}});
    return true;}};
S1.R={name:'Closing Blades',max:3,cd:[100,85,70],cost:[0,0,0],range:500,
  cut:(c,r)=>[90,150,210][r-1]+0.6*c.ad, miss:r=>[0.2,0.25,0.3][r-1],
  desc:(c,r,a)=>`Lunge through an enemy champion within 500 units with two crossing cuts. The first deals <span class="ph">${n0(a.cut(c,r))}</span> physical damage (90/150/210 + 60% AD). The second deals the same plus ${[20,25,30][r-1]}% of their missing health. A takedown within 3s refreshes Slip Through.`,
  cast(c,ax,ay,r,a){const foe=G.champs.find(u=>u.team!==c.team);
    if(!foe||!foe.alive||!targetable(foe)||edge(c,foe)>500)return false;
    const ang=angTo(c,foe.x,foe.y),len=dist(c,foe)+foe.r+c.r+70;let first=false;foe.execBy={src:c,until:G.t+3};ghost(c);
    c.rStart=G.t;
    const cut1=()=>{first=true;c.rCutAt=G.t;if(!foe.alive)return;dealDamage(c,foe,a.cut(c,r),'phys',{force:true});crossMark(c,foe);impact(foe,'#ff4d61',true);foe.kick={until:G.t+0.14,ang};
      if(c===G.player||foe===G.player)shake(5,0.15);};
    dash(c,ang,len,1900,{kind:'R',onTick:()=>{if(!first&&dist(c,foe)<c.r+foe.r+30)cut1();},onEnd:()=>{if(!first)cut1();
      c.castAnim={start:G.t,W:0.12,kind:'rCut'};
      beginCast(c,0.12,ang+PI,()=>{if(foe.alive){dealDamage(c,foe,a.cut(c,r)+a.miss(r)*(foe.maxHp-foe.hp),'phys',{force:true});impact(foe,'#ff4d61',true);
        foe.kick={until:G.t+0.14,ang:ang+PI};if(c===G.player||foe===G.player){shake(7,0.2);G.hitStop=0.05;}}
        slash(foe.x,foe.y,ang+PI*0.25,'#ff4d61');slash(foe.x,foe.y,ang-PI*0.25,'#ff4d61');ring(foe.x,foe.y,10,120,'#ff4d61',0.4);});}});
    return true;}};

// ================= Captain Black Jack: a mobile mid-range gunslinger on jet boots =================
CH.blackjack={key:'blackjack',name:'Black Jack',fullName:'Captain Black Jack',role:'Gunslinger',reach:'Mid-range',resource:'Luck',r:30,ranged:true,
  blurb:'A mobile gunslinger in a gold-trimmed exosuit, twin revolvers in hand and jets on his boots. Land an ability and his next shot fires both guns; set enemies up with a gravity coin, double-tap them, and Jetstep to keep his distance.',
  base:{hp:620,hpG:98,hp5:6.5,hp5G:0.65,res:1,resG:0,rg5:0,rg5G:0,ad:63,adG:3.3,as:0.72,asG:3.2,armor:27,armorG:4.2,mr:30,mrG:1.3,ms:340,range:500,windup:0.18,proj:2600},
  castKind:{Q:'shot',E:'shot',RMB:'shot',R:'shot'},
  dash:{name:'Afterburner',desc:'A short burst on the jets, up to 220 units toward the cursor.',
    cast(c,ax,ay){if(c.flush)return false;const ang=angTo(c,ax,ay),len=clamp(hyp(ax-c.x,ay-c.y),100,220);dash(c,ang,len,1500,{kind:'jet'});bjJets(c);return true;}},
  ab:{}};
const B1=CH.blackjack.ab;
const BJ_TRAIL={dur:3,half:45,tick:0.5},BJ_LONG=150,BJ_COIN={range:650,r:260,pull:160,fly:0.35,delay:0.6},BJ_FLUSH={range:900,cone:0.32,gap:0.35,volleys:6};
const bjLoaded=c=>15+7*c.level+0.45*c.ad;
// Loaded Luck: an ability that hits a champion loads the next basic attack (one at most)
function bjPrime(c){if(c.key!=='blackjack'||c.loaded)return;c.loaded=true;if(c===G.player){popText(c.x,c.y,'Loaded','#ffd36b',14,130);hudDirty=true;}}
function bjJets(c){for(let i=0;i<6;i++)G.fx.push({k:'spark',x:c.x+rnd(-12,12),y:c.y+rnd(-12,12),vx:rnd(-90,90),vy:rnd(-90,90),col:'#7fe9ff',t:0,dur:rnd(0.25,0.45)});}
// which revolver: muzzle a little to that side of where he is aiming
function bjMuzzle(c,ang,side){const px=-Math.sin(ang)*14*side,py=Math.cos(ang)*14*side,x=c.x+Math.cos(ang)*(c.r+16)+px,y=c.y+Math.sin(ang)*(c.r+16)+py;
  G.fx.push({k:'flash',x,y,z:58,ang,t:0,dur:0.08,s:1});spark(x,y,'#ffd27a',2);c.bjFire={t:G.t,side};}
function bjShot(c,ang,side,o){bjMuzzle(c,ang,side);const ca=Math.cos(ang),sa=Math.sin(ang),px=-sa*14*side,py=ca*14*side;
  const p=shoot(c,{ang,speed:o.speed||2600,range:o.range,radius:o.radius||22,pierce:false,hitSet:o.hitSet,kind:o.kind||'bjshot',onHit:o.onHit});p.x+=px;p.y+=py;return p;}
B1.Q={name:'Double or Nothing',max:5,cd:[7,6.5,6,5.5,5],cost:[0,0,0,0,0],range:850,
  dmg:(c,r)=>[45,70,95,120,145][r-1]+0.55*c.ad, bonus:(c,r)=>[30,45,60,75,90][r-1]+0.3*c.ad,
  desc:(c,r,a)=>`Fire two aimed shots, 0.35s apart, each up to 850 units: the second follows wherever you are aiming when it fires. Each deals <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (45/70/95/120/145 + 55% AD). Land both on the same champion for <span class="ph">${n0(a.bonus(c,r))}</span> bonus damage (30/45/60/75/90 + 30% AD). ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.`,
  avail:c=>c.flush?'busy':true,
  cast(c,ax,ay,r,a){const st={r},ang=angTo(c,ax,ay);beginCast(c,0.1,ang,()=>{bjQShot(c,ang,r,1,st);c.dbl={at:G.t+0.35,r,st};});return true;}};
function bjQShot(c,ang,r,n,st){const A=B1.Q;
  bjShot(c,ang,n===1?1:-1,{range:850,radius:26,kind:'bjshotQ',onHit:t=>{dealDamage(c,t,A.dmg(c,r),'phys',{});impact(t,'#7fe9ff',t.kind==='champ');
    if(t.kind!=='champ')return;bjPrime(c);st['h'+n]=t;
    if(st.h1&&st.h1===st.h2&&!st.done){st.done=true;dealDamage(c,t,A.bonus(c,r),'phys',{});ring(t.x,t.y,t.r,t.r+50,'#ffd36b',0.35);if(c===G.player||t===G.player)popText(t.x,t.y,'Double!','#ffd36b',16,150);}}});
  SFX.play('crit',c.x,c.y,0.5);}
// Captain's Courtesy: a gold coin that lands, glows, then drags nearby enemies to its centre and slows them
B1.RMB={name:"Captain's Courtesy",max:5,cd:[14,13,12,11,10],cost:[0,0,0,0,0],range:BJ_COIN.range,
  dmg:(c,r)=>[40,65,90,115,140][r-1]+0.3*c.ad,
  desc:(c,r,a)=>`Toss a gold coin up to ${BJ_COIN.range} units. ${BJ_COIN.delay}s after it lands it collapses into a gravity snare: enemies within ${BJ_COIN.r} units are pulled up to ${BJ_COIN.pull} units toward its centre, take <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (40/65/90/115/140 + 30% AD) and are slowed by 35% for 1.25s. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.`,
  avail:c=>c.flush?'busy':true,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay),l=Math.min(BJ_COIN.range,hyp(ax-c.x,ay-c.y)),tp=clampWalk(c.x+Math.cos(ang)*l,c.y+Math.sin(ang)*l,10);
    c.bjThrow=G.t;beginCast(c,0.12,ang,()=>{c.coin={x0:c.x,y0:c.y,x:tp.x,y:tp.y,t0:G.t,land:G.t+BJ_COIN.fly,pop:G.t+BJ_COIN.fly+BJ_COIN.delay,r};SFX.play('swing',c.x,c.y,0.7);});return true;}};
// Jetstep: two charges of a short boost; the next basic attack reaches further
B1.E={name:'Jetstep',max:5,cd:[9,8.5,8,7.5,7],cost:[0,0,0,0,0],range:260,charges:2,
  burn:(c,r)=>[10,15,20,25,30][r-1]+0.1*c.ad,
  desc:(c,r,a)=>`Two charges. Boost up to 260 units in any direction on your jet boots, leaving a trail of cyan fire for ${BJ_TRAIL.dur}s: enemies in it burn for <span class="ph">${n0(a.burn(c,r))}</span> magic damage (10/15/20/25/30 + 10% AD) every 0.5s. Boost through an enemy champion and the charge comes straight back. For 3s your next basic attack reaches ${BJ_LONG} units further. Works during Royal Flush (the barrage keeps its direction). Each charge returns after ${n0(a.cd[r-1]*100/(100+c.ah))}s.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay),len=clamp(hyp(ax-c.x,ay-c.y),120,260),keep=c.flush?c.flush.ang:null,x0=c.x,y0=c.y;let through=null;
    dash(c,ang,len,1600,{kind:'jet',onTick:()=>{if(through)return;for(const u of G.champs)if(u.team!==c.team&&u.alive&&targetable(u)&&dist(c,u)<c.r+u.r+12){through=u;break;}},
      onEnd:()=>{G.trails.push({x0,y0,x1:c.x,y1:c.y,src:c,r,until:G.t+BJ_TRAIL.dur,next:G.t+0.1,t0:G.t});
        if(through){c.chg.E=Math.min(a.charges,(c.chg.E||0)+1);ring(c.x,c.y,c.r,c.r+50,'#7fe9ff',0.3);if(c===G.player){popText(c.x,c.y,'Jetstep refreshed','#7fe9ff',14,130);hudDirty=true;}}}});
    if(keep!==null)c.facing=keep;
    c.longShot=G.t+3;bjJets(c);SFX.play('dash',c.x,c.y,0.8);return true;}};
// Royal Flush: six alternating volleys into a locked cone while he hovers slowly
B1.R={name:'Royal Flush',max:3,cd:[90,75,60],cost:[0,0,0],range:BJ_FLUSH.range,
  dmg:(c,r)=>[40,65,90][r-1]+0.3*c.ad,
  desc:(c,r,a)=>`Lock your aim into a cone toward the cursor and fire ${BJ_FLUSH.volleys} alternating revolver volleys over ${(BJ_FLUSH.volleys*BJ_FLUSH.gap).toFixed(1)}s, each a spray of three shots up to ${BJ_FLUSH.range} units. An enemy is hit at most once per volley, for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (40/65/90 + 30% AD). You hover at 40% speed and can Jetstep, but the barrage keeps its direction. Stuns and knockbacks end it; enemies can step out sideways. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.`,
  cast(c,ax,ay,r,a){c.flush={ang:angTo(c,ax,ay),next:G.t+0.2,n:0,r};c.dbl=null;ring(c.x,c.y,c.r,c.r+60,'#ffd36b',0.35);SFX.play('cast',c.x,c.y,0.8);return true;}};
CH.blackjack.passive={name:'Loaded Luck',desc:c=>`Basic attacks alternate revolvers. An ability that hits a champion loads your next basic attack to fire both guns for <span class="ph">${n0(bjLoaded(c))}</span> bonus physical damage (15 + 7 per level + 45% AD) and a 25% move-speed burst for 1.2s. Only one loaded shot is stored. Now: ${c.loaded?'loaded':'not loaded'}.`};
function bjVolley(c,f){const side=f.n%2?-1:1,hs=new Set(),A=B1.R;
  for(const j of [-1,0,1]){const a=f.ang+j*BJ_FLUSH.cone*0.7+side*0.05+srnd(-0.05,0.05);
    bjShot(c,a,side,{range:BJ_FLUSH.range,radius:22,speed:2800,hitSet:hs,kind:'bjflush',onHit:t=>{dealDamage(c,t,A.dmg(c,f.r),'phys',{});G.fx.push({k:'bjspr',set:'flush',fi:3,x:t.x,y:t.y,z:heightOf(t)*0.5,sc:1.2,t:0,dur:0.32});if(t.kind==='champ')bjPrime(c);}});}
  {const px=-Math.sin(f.ang)*14*side,py=Math.cos(f.ang)*14*side;G.fx.push({k:'bjspr',set:'flush',fi:2,x:c.x+Math.cos(f.ang)*(c.r+20)+px,y:c.y+Math.sin(f.ang)*(c.r+20)+py,z:58,sc:0.75,t:0,dur:0.12});}
  SFX.play('hit',c.x,c.y,0.6);}
function updateBJ(c,dt){if(c.key!=='blackjack')return;
  c.res=c.loaded?1:0;c.range=c.def.base.range+(c.longShot>G.t?BJ_LONG:0);
  if(c.dbl&&G.t>=c.dbl.at){const d=c.dbl;c.dbl=null;if(c.stunT<=0&&!(c.dash&&c.dash.kind==='knock'))bjQShot(c,angTo(c,c.input.ax,c.input.ay),d.r,2,d.st);}
  const k=c.coin;
  if(k&&G.t>=k.pop){c.coin=null;const A=B1.RMB;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!u.alive||!hittable(u)||hyp(u.x-k.x,u.y-k.y)>BJ_COIN.r+u.r)continue;
      dealDamage(c,u,A.dmg(c,k.r),'phys',{});slow(u,0.35,1.25);if(u.kind==='champ')bjPrime(c);
      const dd=hyp(u.x-k.x,u.y-k.y),len=Math.min(BJ_COIN.pull,Math.max(0,dd-24));if(u.alive&&u.kind!=='plant'&&len>4)knockback(u,angTo(u,k.x,k.y),len,0.2);}
    G.fx.push({k:'bjspr',set:'coin',fi:2,x:k.x,y:k.y,z:0,sc:2*BJ_COIN.r/(BJ_FX.coin.cw*0.9),t:0,dur:0.45,shrink:true},{k:'bjspr',set:'coin',fi:3,x:k.x,y:k.y,z:0,sc:2.4,t:-0.35,dur:0.75});spark(k.x,k.y,'#ffd36b',10);SFX.play('quake',k.x,k.y,0.5);}
  const f=c.flush;
  if(f){if(!c.alive||c.stunT>0||(c.dash&&c.dash.kind==='knock'))c.flush=null;
    else if(G.t>=f.next){f.next+=BJ_FLUSH.gap;bjVolley(c,f);f.n++;if(f.n>=BJ_FLUSH.volleys)c.flush=null;}}
}
// ---- Black Jack's sheets: 8 directions; flight (4 frames) and firing (6: aim, left gun, recoil, aim, right gun, recoil) on one pixel scale ----
// (the barrage poses are drawn crouched like the attack sheet, so their height is scaled to match it)
const BJ_SHEETS={move:{cw:240,ch:170,ax:129,ay:153,h:124.5,img:null},atk:{cw:253,ch:172,ax:140,ay:155,h:124.5,img:null},
  throw:{cw:138,ch:113,ax:68,ay:96,h:84,img:null},flush:{cw:155,ch:110,ax:76,ay:93,h:92.8,img:null}},BJ_SHOT={img:null,cw:208,ch:68};
// effect strips, 4 frames each: coin (spinning, landed, vortex, fading) and barrage (small bolt, long bolt, muzzle burst, hit sparkle)
const BJ_FX={coin:{img:null,cw:111,ch:94},flush:{img:null,cw:90,ch:78}};
const BJ_H=104;let BJ_READY=false;
(function(){let left=7;const done=()=>{if(--left)return;BJ_READY=true;for(const b of document.querySelectorAll('#cards .card'))if(b.dataset.k==='blackjack')drawPortrait(b.querySelector('canvas'),'blackjack',BLUE);
    if(G&&G.player.key==='blackjack')drawPortrait($('portC'),'blackjack',G.player.team);};
  for(const [k,src] of [['move','assets/blackjack_move.webp'],['atk','assets/blackjack_atk.webp'],['throw','assets/blackjack_throw.webp'],['flush','assets/blackjack_flush.webp']]){const im=new Image();im.onload=()=>{BJ_SHEETS[k].img=im;done();};im.src=src;}
  for(const [k,src] of [['coin','assets/blackjack_coinfx.webp'],['flush','assets/blackjack_flushfx.webp']]){const im=new Image();im.onload=()=>{BJ_FX[k].img=im;done();};im.src=src;}
  const im=new Image();im.onload=()=>{BJ_SHOT.img=im;done();};im.src='assets/blackjack_shot.webp';})();
function bjFrame(u){const fa=projAng(u.facing),row=((Math.round((fa-PI/2)/(PI/4))%8)+8)%8;
  // he hovers on his jets: lifted off the ground with a gentle bob
  const fr={S:BJ_SHEETS.move,H:BJ_H,row,col:0,ox:0,oy:-10+Math.sin(G.t*3.4+u.id)*2.5,rot:0,sx:1,sy:1};
  if(u.dash){const p=1-u.dash.t/u.dash.total;fr.col=1;fr.oy-=12*Math.sin(p*PI);fr.rot=(Math.cos(fa)>=0?1:-1)*0.16*Math.sin(p*PI);return fr;}
  const th=u.bjThrow?G.t-u.bjThrow:9;if(th<0.38){fr.S=BJ_SHEETS.throw;fr.col=th<0.06?0:th<0.12?1:th<0.26?2:3;return fr;}
  const F=u.bjFire,side=u.bjFire?u.bjFire.side:(u.atkSide||1),base=side>0?0:3;
  if(u.flush){fr.S=BJ_SHEETS.flush;fr.col=F&&G.t-F.t<0.12?(side>0?1:2):F&&G.t-F.t<0.24?3:0;return fr;}
  if(F&&G.t-F.t<0.22){fr.S=BJ_SHEETS.atk;fr.col=base+(G.t-F.t<0.08?1:2);return fr;}
  if(u.flush||u.cast||(u.atk&&G.t-u.atk.start<u.atk.W)){fr.S=BJ_SHEETS.atk;fr.col=(u.flush?(u.flush.n%2?3:0):base);return fr;}
  fr.col=hyp(u.vx,u.vy)>30?Math.floor(((u.walkD||0)/140)%1*4):Math.floor(G.t*5+u.id)%4;return fr;}
function drawBJIcon(g,k){const gr=g.createRadialGradient(26,22,4,26,26,40);gr.addColorStop(0,'#3a2448');gr.addColorStop(1,'#0c0a16');g.fillStyle=gr;g.fillRect(0,0,52,52);
  g.lineCap='round';g.lineJoin='round';const C='#7fe9ff',Au='#ffd36b';
  const bolt=(x,y,a,s)=>{g.save();g.translate(x,y);g.rotate(a);g.scale(s,s);g.fillStyle=C;g.beginPath();g.moveTo(10,0);g.quadraticCurveTo(0,-5,-12,0);g.quadraticCurveTo(0,5,10,0);g.fill();g.fillStyle='#e8fbff';g.beginPath();g.ellipse(4,0,4,1.8,0,0,TAU);g.fill();g.restore();};
  if(k==='Q'){bolt(28,18,-0.5,1.1);bolt(24,34,-0.5,1.1);g.fillStyle=Au;g.font='800 13px Oxanium,sans-serif';g.fillText('x2',4,48);}
  if(k==='RMB'){g.strokeStyle='rgba(255,211,107,.5)';g.lineWidth=2;g.beginPath();g.arc(26,26,20,0,TAU);g.stroke();g.fillStyle=Au;g.beginPath();g.arc(26,26,11,0,TAU);g.fill();g.strokeStyle='#8a6a1e';g.lineWidth=2;g.beginPath();g.arc(26,26,7,0.4,TAU*0.85);g.stroke();
    for(let i=0;i<4;i++){const a=i*PI/2+0.4;g.strokeStyle=C;g.lineWidth=2;g.beginPath();g.moveTo(26+Math.cos(a)*23,26+Math.sin(a)*23);g.lineTo(26+Math.cos(a)*15,26+Math.sin(a)*15);g.stroke();}}
  if(k==='E'){g.fillStyle='#2a2a3a';g.beginPath();g.moveTo(14,10);g.lineTo(26,10);g.lineTo(28,32);g.lineTo(36,36);g.lineTo(36,40);g.lineTo(14,40);g.closePath();g.fill();g.strokeStyle=Au;g.lineWidth=1.5;g.stroke();
    g.fillStyle=C;g.beginPath();g.moveTo(16,42);g.lineTo(22,52);g.lineTo(28,42);g.closePath();g.fill();g.strokeStyle=C;g.lineWidth=2.5;g.beginPath();g.moveTo(40,10);g.lineTo(46,16);g.lineTo(40,22);g.moveTo(40,24);g.lineTo(46,30);g.lineTo(40,36);g.stroke();}
  if(k==='R'){for(let i=0;i<5;i++){g.save();g.translate(26,44);g.rotate(-0.6+i*0.3);g.fillStyle='#f4ead2';g.fillRect(-6,-34,12,18);g.strokeStyle='#8a6a1e';g.lineWidth=1;g.strokeRect(-6,-34,12,18);g.fillStyle=i===2?'#151020':'#a8203a';g.beginPath();g.arc(0,-25,2.6,0,TAU);g.fill();g.restore();}}
  if(k==='P'){g.fillStyle='#f4ead2';g.fillRect(14,8,24,34);g.strokeStyle=Au;g.lineWidth=2;g.strokeRect(14,8,24,34);g.fillStyle='#151020';g.beginPath();g.moveTo(26,16);g.quadraticCurveTo(36,26,26,32);g.quadraticCurveTo(16,26,26,16);g.fill();g.fillRect(25,30,2,6);}
  if(k==='DASH'){g.strokeStyle=C;g.lineWidth=3;for(let i=0;i<3;i++){g.beginPath();g.moveTo(8+i*4,40-i*8);g.lineTo(34+i*4,40-i*8);g.stroke();}g.fillStyle='#e8fbff';g.beginPath();g.arc(42,24,5,0,TAU);g.fill();}}
// ================= units =================
const zeroBonus=()=>({hp:0,hp5:0,ad:0,ap:0,armor:0,mr:0,asPct:0,crit:0,lethality:0,armorPen:0,magicPen:0,magicPenPct:0,ah:0,ms:0});
function makeChamp(key,team,isBot){
  const def=CH[key];
  const c={id:UID++,kind:'champ',key,def,team,isBot,name:def.name,x:FOUNT[team].x+(team?-80:80),y:MIDY,r:def.r,level:1,xp:0,points:1,
    ranks:{Q:0,E:0,RMB:0,R:0},cds:{Q:0,E:0,RMB:0,R:0},alive:true,facing:team===BLUE?0:PI,atkCd:0,rootT:0,wind:null,cast:null,dash:null,
    stunT:0,slows:[],stealthT:0,stealthMs:0,stealthBonus:0,untargetT:0,empower:null,dashCd:0,spin:null,asBuff:null,kills:0,deaths:0,cs:0,dmgDealt:0,respawnT:0,
    input:{mx:0,my:0,ax:0,ay:0,attack:false,attackTarget:null},vx:0,vy:0,px:0,py:0,bonus:zeroBonus(),hitFlash:0,windP:0,chg:{}};
  computeStats(c,true);resetKitState(c);
  return c;
}
function resetKitState(c){if(c.key==='blackjack'){c.loaded=false;c.flush=null;c.dbl=null;c.coin=null;c.longShot=0;c.bjFire=null;c.bjThrow=null;}if(c.def.resource==='Corruption')c.res=0;if(c.key==='viktor'){if(c.form==='monster'){c.form='human';computeStats(c,false);}c.res=0;c.bounty=null;c.arm=null;c.rReady=0;c.crashReady=0;c.uncaging=null;}if(c.key==='cora'){c.axes={Q:{state:'hand',readyAt:0},RMB:{state:'hand',readyAt:0}};c.hook=null;c.cleaveReady=null;}}
function computeStats(c,init){
  const b=c.def.base,g=gf(c.level),x=c.bonus,oldMax=c.maxHp,oldRes=c.maxRes;
  c.maxHp=b.hp+b.hpG*g+x.hp; c.hp5=b.hp5+b.hp5G*g+x.hp5;
  c.maxRes=b.res+b.resG*g; c.rg5=b.rg5+b.rg5G*g;
  c.baseAd=b.ad+b.adG*g; c.ad=c.baseAd+x.ad; c.ap=x.ap;
  c.armor=b.armor+b.armorG*g+x.armor; c.mr=b.mr+b.mrG*g+x.mr;
  c.as=Math.min(2.5,b.as*(1+(b.asG*g+x.asPct)/100));
  c.crit=Math.min(1,x.crit); c.critDmg=1.75; c.lethality=x.lethality; c.armorPenPct=x.armorPen; c.magicPen=x.magicPen; c.magicPenPct=x.magicPenPct;
  c.ah=x.ah; c.baseMs=b.ms+x.ms; c.range=b.range;
  if(c.form==='monster'){const r=c.formRank||1;c.maxHp+=VIK_MON.hp[r-1];c.range=VIK_MON.range;c.baseMs+=25;c.as=Math.min(2.5,c.as*1.05);c.ad*=1.1;c.armor+=25;}
  if(c.aug){if(c.aug.jugg)c.maxHp*=1.2;if(c.aug.swift)c.baseMs*=1.1;if(c.aug.haste)c.ah+=25;if(c.aug.fury)c.as=Math.min(2.5,c.as*1.35);}
  if(init){c.hp=c.maxHp;c.res=c.maxRes;}else{c.hp+=c.maxHp-oldMax;c.res+=c.maxRes-oldRes;}
}
const MINION_VS_CHAMP=0.6,AGGRO_R=500; // minion damage to champions; range for minion aggro on champions
const MINION={
  melee:{hp:477,hpU:22,ad:12,adU:1,range:110,as:1.25,r:24,xp:60.45,armor:0,mr:0},
  caster:{hp:296,hpU:8,ad:24,adU:1.5,range:550,as:0.667,r:20,xp:29.76,armor:0,mr:0},
  super:{hp:1600,hpU:100,ad:120,adU:3,range:170,as:0.85,r:38,xp:97,armor:30,mr:-30}
};
function makeMinion(type,team,slot){
  const s=MINION[type],u=Math.floor(G.t/90);
  const m={id:UID++,kind:'minion',mtype:type,team,x:SPAWN_X[team],y:MIDY+srnd(-30,30),r:s.r,maxHp:s.hp+s.hpU*u,ad:s.ad+s.adU*u,armor:s.armor,mr:s.mr,
    range:s.range,as:s.as,baseMs:325,xp:s.xp,alive:true,atkCd:srnd(0,0.3),target:null,forced:null,forcedUntil:0,scan:0,
    laneY:MIDY+((slot%3)-1)*75+srnd(-15,15),slows:[],stunT:0,facing:team===BLUE?0:PI,deadT:0,hitFlash:0,swing:0};
  m.hp=m.maxHp;return m;
}
function makeTower(team){return{id:UID++,kind:'tower',team,x:TOWER_X[team],y:MIDY,r:88,aim:team?PI:0,hp:2500,maxHp:2500,armor:40,mr:40,alive:true,range:775,atkCd:0,target:null,ramp:0,hitFlash:0,slows:[],stunT:0};}
const FOUNT_SRC=[{kind:'fountain',team:BLUE,name:'Fountain'},{kind:'fountain',team:RED,name:'Fountain'}];

const targetable=u=>u.alive&&!(u.stealthT>0)&&!(u.untargetT>0)&&!u.hidden;
const hittable=u=>u.alive&&!(u.untargetT>0); // skillshots hit stealthed units
// what a basic attack may hit: enemies, plus ripe healing plants in the Colosseum
function attackables(team){const out=enemiesOf(team);if(isCol())for(const p of G.col.plants)if(p.alive)out.push(p);return out;}
function enemiesOf(team){const out=[];for(const c of G.champs)if(c.team!==team&&c.alive)out.push(c);for(const m of G.minions)if(m.team!==team&&m.alive)out.push(m);for(const t of G.towers)if(t.team!==team&&t.alive)out.push(t);return out;}
function physMult(src,t){let ar=t.armor||0;if(ar>0){ar*=1-(src.armorPenPct||0);ar=Math.max(0,ar-(src.lethality||0));}return ar>=0?100/(100+ar):2-100/(100-ar);}
function magMult(src,t){let m=t.mr||0;if(m>0){m*=1-(src.magicPenPct||0);m=Math.max(0,m-(src.magicPen||0));}return m>=0?100/(100+m):2-100/(100-m);}
function msOf(u){
  let ms=u.baseMs;if(u.stealthT>0)ms*=1+(u.stealthMs||0);if(u.flush)ms*=0.4;
  let s=0;for(const sl of u.slows)if(sl.until>G.t)s=Math.max(s,sl.amt);ms*=1-s;
  if(u.spin)ms*=1.2;
  if(u.msBuff&&u.msBuff.until>G.t)ms*=1+u.msBuff.pct*(u.msBuff.until-G.t)/1.5;
  if(ms>490)ms=415+75*0.8+(ms-490)*0.5;else if(ms>415)ms=415+(ms-415)*0.8;
  return Math.max(110,ms);
}
function backdoorMult(t){const r=t.range+200;for(const m of G.minions)if(m.alive&&m.team!==t.team&&dist(m,t)<r)return 1;return 0.33;}

// ================= combat =================
function dealDamage(src,t,amt,type,o){
  o=o||{};
  if(!t.alive||amt<=0)return 0;
  if(t.kind==='plant'){if(src.kind==='champ')breakPlant(t,src);return 0;}
  if(t.untargetT>0&&!o.force)return 0;
  if(src.kind==='champ')src.revealT=G.t+1;  // dealing damage gives away a champion hiding in brush
  let a=amt;
  if(src.def&&src.def.resource==='Corruption')a*=1+0.03*corrStage(src);
  if(t.def&&t.def.resource==='Corruption')a*=1+0.02*corrStage(t);
  if(src.kind==='minion'&&t.kind==='champ')a*=MINION_VS_CHAMP;
  if(type==='phys')a*=physMult(src,t);else if(type==='magic')a*=magMult(src,t);
  if(t.kind==='tower'&&src.kind!=='tower')a*=backdoorMult(t);
  if(src.aug){if(src.aug.brute)a*=1.12;if(src.aug.exec&&t.kind==='champ'&&t.hp<t.maxHp*0.4)a*=1.2;}
  if(src===STORM_SRC&&hasAug(t,'storm'))a*=0.4;
  t.hp-=a;t.hitFlash=0.1;
  // life steal: Corruption's share plus Vampirism, half as much from minions, none from towers
  if(src.kind==='champ'&&src.alive&&t.kind!=='tower'){const ls=((src.def.resource==='Corruption'?0.02*corrStage(src):0)+(hasAug(src,'vamp')?0.1:0))*(t.kind==='champ'?1:0.5);if(ls>0)src.hp=Math.min(src.maxHp,src.hp+a*ls);}
  if(hasAug(t,'wind')&&!t.windUsed&&t.hp>0&&t.hp<t.maxHp*0.25){t.windUsed=true;t.hp+=t.maxHp*0.3;ring(t.x,t.y,10,110,'#7dff9a',0.45);if(t===G.player||src===G.player)popText(t.x,t.y,'Second Wind','#7dff9a',16,150);}
  if(src.kind==='champ'){src.dmgDealt+=t.kind==='champ'?a:0;
    if(t.kind==='champ'){t.lastChampHit={src,t:G.t};src.harm={victim:t,until:G.t+2};callForHelp(src,t);src.corrT=G.t;t.corrT=G.t;}}
  if(src===G.player||t===G.player){
    const col=t===G.player?'#ff6b61':type==='true'?'#ffffff':o.crit?'#ffcf5a':'#ffb067';
    popText(t.x,t.y,(o.crit?n0(a)+'!':n0(a)),col,o.crit?24:t===G.player?17:18,heightOf(t)+12);
  }
  if(t.hp<=0){killUnit(t,src);return a;}
  if(hasAug(t,'thorns')&&src.kind==='champ'&&!o.thorns&&src.alive)dealDamage(t,src,a*0.2,'true',{thorns:true,force:true});
  if(o.det&&t.shadeMark&&t.shadeMark.src===src&&t.shadeMark.until>G.t){const m=t.shadeMark;t.shadeMark=null;ring(t.x,t.y,10,70,'#b48cff',0.3);dealDamage(src,t,m.dmg,'phys',{});}
  return a;
}
function callForHelp(src,victim){
  for(const m of G.minions){if(!m.alive||m.team!==victim.team)continue;
    if(dist(m,src)<=AGGRO_R&&(!m.forced||m.forced!==src)){m.forced=src;m.forcedUntil=G.t+2.5;}}
}
function dropTargeting(u){for(const m of G.minions)if(m.target===u||m.forced===u){m.target=null;m.forced=null;}for(const t of G.towers)if(t.target===u){t.target=null;t.ramp=0;}for(const c of G.champs)if(c.wind&&c.wind.target===u)c.wind.target=null;}
function slow(u,amt,dur){if(u.kind==='tower')return;u.slows.push({amt,until:G.t+dur});}
function stun(u,dur){if(u.kind==='tower')return;u.stunT=Math.max(u.stunT,dur);if(u.kind==='champ'){u.wind=null;u.cast=null;if(u.dash&&u.dash.interrupt){const d=u.dash;u.dash=null;if(d.onCancel)d.onCancel();}}popText(u.x,u.y,'Stunned','#e8fbff',14,heightOf(u)+44);}
function beginCast(c,t,ang,fn){c.cast={t,fn,ang,total:t};c.wind=null;c.facing=ang;}
function dash(c,ang,len,speed,o){o=o||{};const keepFacing=o.kind==='recoil'?c.facing:null;c.dash={vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,t:len/speed,total:len/speed,leap:!!o.leap,kind:o.kind,claim:o.claim,interrupt:!!o.interrupt,onCancel:o.onCancel,onTick:o.onTick,onEnd:o.onEnd,ghostT:0};c.wind=null;c.facing=keepFacing===null?ang:keepFacing;}
function shoot(src,o){
  const ca=Math.cos(o.ang),sa=Math.sin(o.ang);
  G.projs.push({x:src.x+ca*src.r*0.8,y:src.y+sa*src.r*0.8,vx:ca*o.speed,vy:sa*o.speed,ang:o.ang,speed:o.speed,team:src.team,src,range:o.range,traveled:0,
    radius:o.radius,pierce:!!o.pierce,hitSet:o.hitSet||null,own:new Set(),champsOnly:!!o.champsOnly,hitTowers:!!o.hitTowers,overWalls:!!o.overWalls,onHit:o.onHit,onEnd:o.onEnd,kind:o.kind,alive:true,age:0});
  return G.projs[G.projs.length-1];
}
function homing(src,target,o){G.projs.push({homing:target,x:src.x,y:src.y,d0:Math.max(1,dist(src,target)),speed:o.speed,team:src.team,src,onHit:o.onHit,kind:o.kind,alive:true,age:0,ang:angTo(src,target.x,target.y),est:o.est||0,mz:o.mz});}

const asOf=c=>Math.min(2.5,c.as*(1+(c.asBuff&&c.asBuff.until>G.t?c.asBuff.pct:0)));
function startAttack(c,target){
  if(c.axes&&axesInHand(c)===0){if(c===G.player&&G.t>(c.noAxeMsg||0)){showReason('noaxehand');c.noAxeMsg=G.t+1.2;}return;}
  if(c.atkCd>0||c.wind||c.cast||c.dash||c.stunT>0)return;
  const at=1/asOf(c),wu=at*c.def.base.windup;
  const ang=target?angTo(c,target.x,target.y):angTo(c,c.input.ax,c.input.ay);
  c.facing=ang;let ambush=false;
  if(c.stealthT>0){c.stealthT=0;ambush=true;}
  c.atkSide=-(c.atkSide||1);if(c.axes){const q=c.axes.Q.state==='hand',w=c.axes.RMB.state==='hand';if(q&&!w)c.atkSide=1;else if(w&&!q)c.atkSide=-1;}
  c.atk={start:G.t,W:wu,side:c.atkSide,cross:!!(target&&target.crosscut&&target.crosscut.src===c&&target.crosscut.until>G.t)};
  c.wind={t:wu,total:wu,target,ang,ambush,side:c.atkSide};
}
const windMove=c=>c.key==='blackjack'?0.8:c.def.ranged&&!vikMonster(c)?0.65:0.85;
function releaseAttack(c){
  const w=c.wind;c.wind=null;c.atkCd=Math.max(0,1/asOf(c)-w.total);
  const crit=srand()<c.crit;let dmg=c.ad*(crit?c.critDmg:1),extra=0;
  if(c.empower&&c.empower.until>G.t){extra+=c.empower.bonus;c.empower=null;}
  const bjLoad=c.key==='blackjack'&&c.loaded;if(bjLoad){extra+=bjLoaded(c);c.loaded=false;c.msBuff={until:G.t+1.2,pct:0.25};hudDirty=true;}
  if(c.key==='blackjack')c.longShot=0;
  if(w.ambush)extra+=c.stealthBonus||0;
  const onHit=t=>{dealDamage(c,t,(dmg+extra)*(c.key==='viktor'&&!vikMonster(c)&&vikBounty(c)===t?1.15:1),'phys',{crit,det:true});if(c.key==='viktor'&&!vikMonster(c))vikShotHit(c,t);if(c.def.furyOnHit)c.res=Math.min(c.maxRes,c.res+c.def.furyOnHit);
    if(t.crosscut&&t.crosscut.src===c&&t.crosscut.until>G.t){t.crosscut=null;dealDamage(c,t,crossDmg(c),'phys',{});c.msBuff={until:G.t+1.5,pct:0.3};if(c.atk)c.atk.cross=true;
      slash(t.x,t.y,c.facing+PI*0.25,'#ff4d61');slash(t.x,t.y,c.facing-PI*0.25,'#ff4d61');if(c===G.player||t===G.player)popText(t.x,t.y,'Crosscut','#ff6b7a',14,140);}
    if(c.cleaveReady&&c.cleaveReady.until>G.t){const cd=c.cleaveReady.dmg;c.cleaveReady=null;
      for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>c.r+c.range+140+u.r||angDiff(angTo(c,u.x,u.y),c.facing)>0.95)continue;dealDamage(c,u,cd,'phys',{});u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};}
      G.fx.push({k:'smear',x:c.x,y:c.y,z:44,ang:c.facing,side:-(w.side||1),col:'#ffb347',r0:c.r*0.4,r1:c.r+c.range+150,span:2.4,t:0,dur:0.22});
      if(c===G.player||t===G.player)popText(t.x,t.y,'Cleave','#ffb347',14,140);}
    t.kick={until:G.t+0.14,ang:angTo(c,t.x,t.y)};impact(t,c.key==='cora'?(w.side>0?'#ffb36b':'#9ad8ff'):'#d9b8ff',crit||t.kind==='champ');
    SFX.play(crit?'crit':'hit',t.x,t.y,t.kind==='champ'?1:0.5);
    if(c===G.player||t===G.player)shake(t.kind==='champ'?4:2,0.12);};
  let tgt=w.target;
  if(tgt&&(!targetable(tgt)||edge(c,tgt)>c.range+90))tgt=null;
  if(!c.def.ranged||vikMonster(c)){
    if(!tgt)tgt=meleeSweep(c,w.ang);
    if(!(c.key==='shade'&&SHEETS_READY)&&!(c.key==='cora'&&CORA_READY&&CORA_AUTO.img))G.fx.push({k:'smear',x:c.x,y:c.y,z:48,ang:w.ang,side:w.side||1,col:w.ambush?'#c9a6ff':c.key==='cora'?(w.side>0?'#ff9a3c':'#6cc4ff'):c.key==='viktor'?'#ff5a2e':'#b48cff',r0:c.r*0.6,r1:c.r+c.range+(c.key==='viktor'?-20:18),span:c.key==='viktor'?1.3:2.1,t:0,dur:0.16});
    SFX.play('swing',c.x,c.y,c===G.player?1:0.6);
    if(tgt)onHit(tgt);
  }else if(tgt){
    if(c.key==='viktor'){muzzle(c,angTo(c,tgt.x,tgt.y));SFX.play('hit',c.x,c.y,0.5);}
    if(c.key==='blackjack'){const a=angTo(c,tgt.x,tgt.y);bjMuzzle(c,a,w.side||1);SFX.play('hit',c.x,c.y,0.5);if(bjLoad){bjMuzzle(c,a,-(w.side||1));homing(c,tgt,{speed:c.def.base.proj*0.95,kind:'bjshot',onHit:()=>{}});}}
    homing(c,tgt,{speed:c.def.base.proj,kind:c.key==='viktor'?'bullet':c.key==='blackjack'?(bjLoad?'bjshotQ':'bjshot'):extra>0?'arrowBig':'arrow',onHit,est:c.ad*physMult(c,tgt)});
  }else{
    if(c.key==='viktor'){muzzle(c,w.ang);SFX.play('hit',c.x,c.y,0.5);}
    if(c.key==='blackjack'){bjMuzzle(c,w.ang,w.side||1);SFX.play('hit',c.x,c.y,0.5);}
    shoot(c,{ang:w.ang,speed:c.def.base.proj,range:c.range+c.r+40,radius:14,pierce:false,hitTowers:true,kind:c.key==='viktor'?'bullet':c.key==='blackjack'?(bjLoad?'bjshotQ':'bjshot'):extra>0?'arrowBig':'arrow',onHit});
  }
}
function meleeSweep(c,ang){let best=null,bd=1e9;for(const u of attackables(c.team)){if(!targetable(u))continue;const e=edge(c,u);if(e>c.range+25)continue;if(angDiff(angTo(c,u.x,u.y),ang)>0.95)continue;const s=e+(u.kind==='champ'?-30:0);if(s<bd){bd=s;best=u;}}return best;}

function costOf(c,k){const r=c.ranks[k];return r?c.def.ab[k].cost[r-1]:0;}
function canRank(c,k){if(c.points<=0)return false;if(k==='R')return c.ranks.R<(c.level>=16?3:c.level>=11?2:c.level>=6?1:0);return c.ranks[k]<Math.min(5,Math.ceil(c.level/2));}
function rankUp(c,k){if(!canRank(c,k))return false;c.ranks[k]++;c.points--;if(c===G.player){ring(c.x,c.y,c.r,c.r+40,'#e8c06a',0.4);hudDirty=true;}return true;}
const DASH_CD=5; // flat: ability haste does not apply
function tryDash(c,ax,ay){
  if(!c.alive)return'dead';if(c.dashCd>0)return'dashcd';if(c.stunT>0)return'stunned';if(c.cast||c.dash)return'busy';
  c.wind=null;if(!c.def.dash.cast(c,ax,ay))return'notarget';c.dashCd=hasAug(c,'swift')?3.5:DASH_CD;SFX.play('dash',c.x,c.y);return'ok';
}
function tryCast(c,k,ax,ay){
  if(!c.alive)return'dead';
  const a=c.def.ab[k],r=c.ranks[k];
  if(r<1)return'unlearned';
  if(a.canRecast&&a.canRecast(c)){if(c.stunT>0)return'stunned';if(c.cast||c.dash)return'busy';c.wind=null;a.recast(c,ax,ay);return'ok';}
  if(a.avail){const why=a.avail(c);if(why!==true)return why;}
  if(a.charges?!(c.chg[k]>0):c.cds[k]>0)return'cooldown';
  if(c.stunT>0)return'stunned';
  if(c.cast||c.dash)return'busy';
  const cost=a.cost[r-1];if(c.res<cost)return'resource';
  const wasStealth=c.stealthT;if(k!=='RMB')c.stealthT=0;
  c.wind=null;
  if(!a.cast(c,ax,ay,r,a)){c.stealthT=wasStealth;const why=c.failWhy||'notarget';c.failWhy=null;return why;}
  if(a.charges){c.chg[k]--;if(c.cds[k]<=0)c.cds[k]=a.cd[r-1]*100/(100+c.ah);}else if(!a.manualCd)c.cds[k]=a.cd[r-1]*100/(100+c.ah);
  c.res-=cost;
  c.castAnim={start:G.t,W:c.cast?c.cast.total:0.08,kind:c.def.castKind[k]};SFX.play('cast',c.x,c.y,0.8);
  return'ok';
}

function giveXP(c,amt){
  if(!c.alive||c.level>=18||isCol())return;
  c.xp+=amt*G.xpRate;
  while(c.level<18&&c.xp>=XP_NEXT[c.level-1]){c.xp-=XP_NEXT[c.level-1];c.level++;c.points++;computeStats(c,false);
    ring(c.x,c.y,c.r,c.r+70,'#e8c06a',0.6);if(c===G.player){popText(c.x,c.y,'Level '+c.level,'#e8c06a',20,140);hudDirty=true;SFX.play('level');}}
  if(c.level>=18)c.xp=0;
}
function killUnit(t,src){
  t.alive=false;t.hp=0;
  if(t.kind==='minion'){
    t.deadT=0;if(src&&src.kind==='champ'){src.cs++;}
    const near=G.champs.filter(c=>c.alive&&c.team!==t.team&&dist(c,t)<1600);
    for(const c of near)giveXP(c,t.xp/near.length);
    spark(t.x,t.y,TEAMC[t.team],8);
  }else if(t.kind==='champ'){
    t.deaths++;SFX.play('death',t.x,t.y);t.respawnT=6+t.level;t.wind=t.cast=t.dash=null;t.spin=null;t.asBuff=null;t.stealthT=0;t.slows=[];t.stunT=0;t.shadeMark=null;t.crosscut=null;t.eRecast=null;t.msBuff=null;
    let killer=null;
    if(src&&src.kind==='champ'&&src.team!==t.team)killer=src;
    else if(t.lastChampHit&&G.t-t.lastChampHit.t<10)killer=t.lastChampHit.src;
    const et=1-t.team;G.score[et]++;
    if(killer===G.player||t===G.player)G.hitStop=0.08;  // a champion kill is the one hit that freezes the frame
    if(killer){killer.kills++;giveXP(killer,KILL_XP[t.level-1]);feed(`<span class="${killer.team?'r':'b'}">${killer.name}</span> has slain <span class="${t.team?'r':'b'}">${t.name}</span>`);}
    else{for(const c of G.champs)if(c.team!==t.team&&c.alive&&dist(c,t)<1600)giveXP(c,KILL_XP[t.level-1]);
      feed(`<span class="${t.team?'r':'b'}">${t.name}</span> was executed`);}
    if(t.execBy&&t.execBy.until>G.t){const sx=t.execBy.src;sx.cds.E=0;sx.eRecast=null;popText(sx.x,sx.y,'Slip Through refreshed','#ff9aa6',15,140);}
    t.execBy=null;
    ring(t.x,t.y,10,120,TEAMC[t.team],0.6);spark(t.x,t.y,TEAMC[t.team],22);
    dropTargeting(t);
    if(isCol())colDeath();else if(G.score[et]>=G.killsToWin)endGame(et,'kills');
  }else if(t.kind==='tower'){
    for(let i=0;i<40;i++)spark(t.x+rnd(-60,60),t.y+rnd(-60,60),'#c9b9a0',1);
    ring(t.x,t.y,40,320,TEAMC[t.team],0.9);
    feed(`<span class="${t.team?'r':'b'}">${t.team?'Red':'Blue'} tower</span> destroyed`);
    endGame(1-t.team,'tower');
  }
}
function endGame(team,reason){if(G.over)return;G.over={team,reason};G.overT=0;}

// ================= minions & towers =================
function queueWave(){
  G.waveN++;const sup=G.waveN%3===0;
  const list=(sup?['super']:[]).concat(['melee','melee','melee','caster','caster','caster']);
  for(const team of [BLUE,RED])list.forEach((type,i)=>G.spawnQ.push({t:G.t+i*0.7,type,team,slot:i}));
  if(sup)feed('<span class="g">Super minions</span> are spawning');
}
function minionAcquire(m){
  let best=null,bd=600;
  for(const o of G.minions){if(!o.alive||o.team===m.team)continue;const d=dist(m,o);if(d<bd){bd=d;best=o;}}
  if(best)return best;bd=600;
  bd=AGGRO_R;for(const c of G.champs){if(c.team===m.team||!targetable(c))continue;const d=dist(m,c);if(d<bd){bd=d;best=c;}}
  if(best)return best;
  const t=G.towers[1-m.team];if(t.alive&&edge(m,t)<500)return t;
  return null;
}
function moveToward(u,x,y,dt,stop){const dx=x-u.x,dy=y-u.y,l=hyp(dx,dy);if(l<(stop||2))return;const s=Math.min(l,msOf(u)*dt);u.x+=dx/l*s;u.y+=dy/l*s;u.facing=Math.atan2(dy,dx);u.moving=true;u.walkD=(u.walkD||0)+s;}
function updateMinion(m,dt){
  if(!m.alive){m.deadT+=dt;return;}
  if(m.knock){m.x+=m.knock.vx*dt;m.y+=m.knock.vy*dt;clampUnit(m);m.knock.t-=dt;if(m.knock.t<=0)m.knock=null;return;}
  m.moving=false;m.engaged=false;
  m.hitFlash=Math.max(0,m.hitFlash-dt);m.swing=Math.max(0,m.swing-dt);m.atkCd=Math.max(0,m.atkCd-dt);
  m.slows=m.slows.filter(s=>s.until>G.t);
  if(m.stunT>0){m.stunT-=dt;return;}
  if(m.forced&&(G.t>m.forcedUntil||!targetable(m.forced)||dist(m,m.forced)>AGGRO_R)){m.forced=null;m.scan=0;}
  let t=m.forced||(m.target&&targetable(m.target)&&dist(m,m.target)<850?m.target:null);
  // a champion is only a fallback target: drop it once it walks out of range or one of its minions is close
  if(t&&t.kind==='champ'&&!m.forced&&(dist(m,t)>AGGRO_R||G.minions.some(o=>o.alive&&o.team!==m.team&&dist(m,o)<600))){t=null;m.scan=0;}
  m.scan-=dt;if(!t||(m.scan<=0&&t.kind==='tower')){if(m.scan<=0){m.scan=0.25;const n=minionAcquire(m);if(n)t=n;}}
  m.target=t;
  if(t){
    const e=edge(m,t);
    if(e<=m.range){m.facing=angTo(m,t.x,t.y);m.engaged=true;
      if(m.atkCd<=0){m.atkCd=1/m.as;m.swing=0.2;m.lastAtk=G.t;
        if(m.mtype==='caster')homing(m,t,{speed:650,kind:'orb',onHit:u=>dealDamage(m,u,m.ad,'phys'),est:m.ad*physMult(m,t)});
        else{dealDamage(m,t,m.ad,'phys');t.kick={until:G.t+0.1,ang:m.facing};if(t===G.player)SFX.play('tick',t.x,t.y);
          G.fx.push({k:'smear',x:m.x,y:m.y,z:m.mtype==='super'?40:24,ang:m.facing,side:m.id%2?1:-1,col:TEAML[m.team],r0:m.r*0.4,r1:m.r+m.range,span:1.6,t:0,dur:0.14,alpha:0.5});}}}
    else moveToward(m,t.x,t.y,dt);
  }else{const tx=G.towers[1-m.team].x;moveToward(m,tx,m.laneY,dt,5);}
}
function updateTower(t,dt){
  if(!t.alive)return;t.atkCd=Math.max(0,t.atkCd-dt);t.hitFlash=Math.max(0,t.hitFlash-dt);
  const inR=u=>u.alive&&u.team!==t.team&&targetable(u)&&dist(t,u)-u.r<=t.range;
  for(const c of G.champs){if(inR(c)&&c.harm&&c.harm.until>G.t&&c.harm.victim.team===t.team&&dist(t,c.harm.victim)<=t.range+200&&t.target!==c){t.target=c;t.ramp=0;}}
  if(t.target&&!inR(t.target)){t.target=null;t.ramp=0;}
  if(!t.target){let best=null,bd=1e9;
    for(const m of G.minions)if(inR(m)){const d=dist(t,m);if(d<bd){bd=d;best=m;}}
    if(!best)for(const c of G.champs)if(inR(c)){const d=dist(t,c);if(d<bd){bd=d;best=c;}}
    t.target=best;t.ramp=0;}
  if(t.target)t.aim=angTo(t,t.target.x,t.target.y);
  if(t.target&&t.atkCd<=0){
    t.atkCd=0.83;const tg=t.target;
    if(tg.kind==='champ'){const dmg=(152+6*G.t/60)*(1+0.4*Math.min(3,t.ramp));t.ramp++;
      SFX.play('tower',t.x,t.y,0.6);homing(t,tg,{speed:1300,kind:'towerShot',mz:towerMuzzle(t),onHit:u=>{dealDamage(t,u,dmg,'phys');impact(u,TEAML[t.team],true);SFX.play('towerHit',u.x,u.y);if(u===G.player)shake(6,0.2);},est:dmg});}
    else{const f=tg.mtype==='melee'?0.45:tg.mtype==='caster'?0.7:0.14;
      homing(t,tg,{speed:1300,kind:'towerShot',mz:towerMuzzle(t),onHit:u=>dealDamage(t,u,u.maxHp*f,'true'),est:tg.maxHp*f});}
  }
}

// ================= champions =================
// recall: an 8s channel back to the fountain; moving, attacking, casting, dashing or being stunned cancels it, damage does not
const RECALL_T=8;
function startRecall(c){if(!c.alive)return'dead';if(isCol())return'norecall';if(c.recall)return'recalling';if(c.stunT>0)return'stunned';if(c.cast||c.dash||c.wind)return'busy';
  c.recall={start:G.t,until:G.t+RECALL_T};SFX.play('cast',c.x,c.y,0.6);return'ok';}
function cancelRecall(c){if(!c.recall)return;c.recall=null;if(c===G.player)showReason('recallx');}
function finishRecall(c){c.recall=null;ring(c.x,c.y,10,140,TEAML[c.team],0.5);
  c.x=FOUNT[c.team].x+(c.team?-80:80);c.y=MIDY;c.px=c.x;c.py=c.y;c.vx=c.vy=0;
  ring(c.x,c.y,10,180,TEAML[c.team],0.6);spark(c.x,c.y,TEAML[c.team],14);SFX.play('level',c.x,c.y);if(c===G.player){cam.x=c.x;cam.y=c.y;}}
function respawn(c){c.alive=true;c.recall=null;c.bleed=null;computeStats(c,true);resetKitState(c);c.x=FOUNT[c.team].x+(c.team?-80:80);c.y=MIDY;c.stunT=0;c.slows=[];c.stealthT=0;c.untargetT=0;c.atkCd=0;c.wind=c.cast=c.dash=null;c.empower=null;c.retreat=false;c.spin=null;c.asBuff=null;c.dashCd=0;}
function updateChamp(c,dt){
  if(!c.alive){c.recall=null;if(isCol())return;c.respawnT-=dt;if(c.respawnT<=0)respawn(c);return;}
  for(const k of ABK)c.cds[k]=Math.max(0,c.cds[k]-dt);
  c.dashCd=Math.max(0,c.dashCd-dt);
  for(const k of ABK){const a=c.def.ab[k];if(!a.charges||!c.ranks[k])continue;if(c.chg[k]===undefined)c.chg[k]=a.charges;
    if(c.chg[k]<a.charges&&c.cds[k]<=0){c.chg[k]++;if(c.chg[k]<a.charges)c.cds[k]=a.cd[c.ranks[k]-1]*100/(100+c.ah);}}
  updateAxes(c);updateHook(c,dt);updateViktor(c,dt);updateBJ(c,dt);
  if(c.def.resource==='Corruption'&&G.t-(c.corrT||-99)>5)c.res=Math.max(0,c.res-12*dt);
  if(c.spin){if(G.t>=c.spin.until)c.spin=null;else if(G.t>=c.spin.next){c.spin.next+=0.25;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>260+u.r)continue;dealDamage(c,u,c.spin.dmg,'phys',{});}
    ring(c.x,c.y,60,260,'rgba(255,190,130,.7)',0.25);if(!c.alive)return;}}
  c.atkCd=Math.max(0,c.atkCd-dt);c.rootT=Math.max(0,c.rootT-dt);c.hitFlash=Math.max(0,c.hitFlash-dt);
  if(c.stealthT>0){c.stealthT-=dt;if(c.stealthT<=0){c.stealthT=0;}}
  if(c.untargetT>0)c.untargetT=Math.max(0,c.untargetT-dt);
  c.slows=c.slows.filter(s=>s.until>G.t);
  c.hp=Math.min(c.maxHp,c.hp+c.hp5/5*dt);c.res=Math.min(c.maxRes,c.res+c.rg5/5*dt);
  const df=dist(c,FOUNT[c.team]);if(df<FOUNT_R){c.hp=Math.min(c.maxHp,c.hp+c.maxHp*0.1*dt);if(c.def.resource!=='Corruption'&&c.def.resource!=='Fury')c.res=Math.min(c.maxRes,c.res+c.maxRes*0.1*dt);}
  if(dist(c,FOUNT[1-c.team])<FOUNT_R+80){dealDamage(FOUNT_SRC[1-c.team],c,900*dt,'true',{force:true});if(!c.alive)return;}
  const inp=c.input;
  if(c.recall){if(c.dash||c.stunT>0||c.cast||c.wind||inp.mx||inp.my)cancelRecall(c);else if(G.t>=c.recall.until){finishRecall(c);return;}}
  if(c.dash){const d=c.dash;c.x+=d.vx*dt;c.y+=d.vy*dt;clampUnit(c);d.t-=dt;d.ghostT-=dt;if(d.ghostT<=0){d.ghostT=0.03;ghost(c);}
    if(d.onTick)d.onTick();if(d.t<=0){c.dash=null;if(d.onEnd)d.onEnd();}return;}
  if(c.stunT>0){c.stunT=Math.max(0,c.stunT-dt);return;}
  if(c.cast){c.facing=c.cast.ang;c.cast.t-=dt;if(c.cast.t<=0){const f=c.cast.fn;c.cast=null;f();}return;}
  if(c.wind&&c.cancelWind){c.wind=null;c.atk=null;}  // stopping (S) drops the swing; nothing is spent
  // you keep moving while an attack winds up, a little slower (ranged champions more so, so kiting is not free)
  if(c.wind){c.wind.t-=dt;if(c.wind.target&&targetable(c.wind.target))c.facing=angTo(c,c.wind.target.x,c.wind.target.y);if(c.wind.t<=0)releaseAttack(c);
    const ms=msOf(c)*windMove(c);c.x+=inp.mx*ms*dt;c.y+=inp.my*ms*dt;return;}
  c.facing=angTo(c,inp.ax,inp.ay);
  if(c.flush)c.facing=c.flush.ang;
  if(inp.attack&&c.atkCd<=0&&!c.spin&&!c.cancelWind&&!c.flush){startAttack(c,inp.attackTarget);if(c.wind){const ms=msOf(c)*windMove(c);c.x+=inp.mx*ms*dt;c.y+=inp.my*ms*dt;return;}}
  if(c.rootT>0)return;
  const ms=msOf(c);c.x+=inp.mx*ms*dt;c.y+=inp.my*ms*dt;
}
function clampUnit(u){
  if(isCol()){colClamp(u,u.r);return;}
  laneClamp(u,u.r);
  for(const t of G.towers){const d=dist(u,t),m=u.r+t.r*0.85;if(d<m&&d>0.01){u.x=t.x+(u.x-t.x)/d*m;u.y=t.y+(u.y-t.y)/d*m;}}
}
function separate(){
  const us=[];for(const c of G.champs)if(c.alive&&!c.dash&&!(c.untargetT>0))us.push(c);for(const m of G.minions)if(m.alive)us.push(m);
  for(let i=0;i<us.length;i++)for(let j=i+1;j<us.length;j++){const a=us[i],b=us[j];const dx=b.x-a.x,dy=b.y-a.y,d=hyp(dx,dy),o=a.r+b.r-d;
    if(o>0){const nx=d>0.01?dx/d:1,ny=d>0.01?dy/d:0;const wa=a.kind==='champ'?1:a.mtype==='super'?0.6:2,wb=b.kind==='champ'?1:b.mtype==='super'?0.6:2;const s=o/(wa+wb)*0.6;
      a.x-=nx*s*wa;a.y-=ny*s*wa;b.x+=nx*s*wb;b.y+=ny*s*wb;}}
  for(const u of us)clampUnit(u);
}

// ================= projectiles =================
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;let t=l2?((px-ax)*dx+(py-ay)*dy)/l2:0;t=clamp(t,0,1);return{d:hyp(px-(ax+dx*t),py-(ay+dy*t)),t};}
function updateProjs(dt){
  for(const p of G.projs){if(!p.alive)continue;p.age+=dt;
    if(p.homing){const t=p.homing;if(!t.alive){p.alive=false;if(p.onLost)p.onLost();continue;}
      const dx=t.x-p.x,dy=t.y-p.y,d=hyp(dx,dy),step=p.speed*dt;p.ang=Math.atan2(dy,dx);
      const arrive=d<=step+t.r*0.4,nx=arrive?t.x:p.x+dx/d*step,ny=arrive?t.y:p.y+dy/d*step;
      if(p.sweep)for(const u of enemiesOf(p.team)){if(u.kind==='tower'||p.sweep.hit.has(u)||!hittable(u))continue;if(segDist(u.x,u.y,p.x,p.y,nx,ny).d<=u.r+p.sweep.radius){p.sweep.hit.add(u);p.sweep.onHit(u);}}
      p.x=nx;p.y=ny;if(arrive){p.alive=false;p.onHit(t,p);}continue;}
    const nx=p.x+p.vx*dt,ny=p.y+p.vy*dt,hits=[];
    for(const u of enemiesOf(p.team)){
      if(!hittable(u)||p.own.has(u))continue;if(u.kind==='tower'&&!p.hitTowers)continue;if(p.champsOnly&&u.kind!=='champ')continue;if(p.hitSet&&p.hitSet.has(u))continue;
      const s=segDist(u.x,u.y,p.x,p.y,nx,ny);if(s.d<=u.r+p.radius)hits.push({u,t:s.t});}
    hits.sort((a,b)=>a.t-b.t);
    for(const h of hits){p.own.add(h.u);if(p.hitSet)p.hitSet.add(h.u);p.onHit(h.u,p);if(!p.pierce){p.alive=false;break;}}
    const step=p.speed*dt;p.x=nx;p.y=ny;p.traveled+=step;
    if(p.alive&&isCol()&&!p.overWalls&&colBlocked(p.x,p.y)){p.alive=false;p.blocked=true;spark(p.x,p.y,'#d8c8a8',5);if(p.onEnd)p.onEnd(p);continue;}
    if(p.alive&&p.traveled>=p.range&&p.onEnd){p.alive=false;p.onEnd(p);}
    if(p.traveled>=p.range||p.x<0||p.x>W)p.alive=false;}
  G.projs=G.projs.filter(p=>p.alive);
}

// ================= effects =================
function popText(x,y,txt,col,size,z){G.texts.push({x,y,z:z||100,txt,col,size:size||16,t:0,dur:0.9,ox:rnd(-14,14)});}
function ring(x,y,r0,r1,col,dur){G.fx.push({k:'ring',x,y,r0,r1,col,t:0,dur});}
function spark(x,y,col,n){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(80,320);G.fx.push({k:'spark',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,col,t:0,dur:rnd(0.25,0.55)});}}
function slash(x,y,ang,col){G.fx.push({k:'slash',x,y,ang,col,t:0,dur:0.18});}
function ghost(c){G.fx.push({k:'ghost',x:c.x,y:c.y,spr:champSprite(c),t:0,dur:0.3});}
function feed(html){G.feedQ.push(html);}
function updateFx(dt){
  for(const f of G.fx){f.t+=dt;if(f.k==='spark'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=0.9;f.vy*=0.9;}}
  G.fx=G.fx.filter(f=>f.t<f.dur);
  for(const t of G.texts)t.t+=dt;
  G.texts=G.texts.filter(t=>t.t<t.dur);
}

// ================= bot (hard) =================
function botSkillPoints(c){
  let guard=4;
  while(c.points>0&&guard--){
    if(canRank(c,'R')){rankUp(c,'R');continue;}
    const first=['Q','E','RMB'].find(k=>c.ranks[k]===0&&canRank(c,k));
    if(first){rankUp(c,first);continue;}
    const k=['Q','E','RMB'].find(k=>canRank(c,k));if(k){rankUp(c,k);continue;}
    break;
  }
}
function estBurst(c,f){
  const pm=physMult(c,f),A=c.def.ab;let d=0,res=c.res;
  const has=k=>{const r=c.ranks[k];if(!r||c.cds[k]>0.6)return 0;const co=A[k].cost[r-1];if(res<co)return 0;res-=co;return r;};
  if(c.key==='cora'){let r;if(c.ranks.Q&&readyAxe(c))d+=A.Q.dmg(c,c.ranks.Q)+A.Q.bleed(c,c.ranks.Q);if(r=has('RMB'))d+=A.RMB.dmg(c,r);if(r=has('E'))d+=A.E.dmg(c,r)+A.E.bleed(c,r);if(c.ranks.Q&&c.axes.Q.state!=='hand')d+=A.Q.dmg(c,c.ranks.Q)+A.Q.cleave(c,c.ranks.Q);if(r=has('R'))d+=A.R.snap(c,r,f);d=(d+c.ad*3)*(1+0.05*corrStage(c));}
  else if(c.key==='blackjack'){let r;if(r=has('Q'))d+=A.Q.dmg(c,r)*2+A.Q.bonus(c,r);if(r=has('RMB'))d+=A.RMB.dmg(c,r);if(c.ranks.R&&c.cds.R<=0.6)d+=A.R.dmg(c,c.ranks.R)*4;d+=c.ad*2+(c.loaded?bjLoaded(c):0);}
  else if(c.key==='viktor'){let r;const m=vikMonster(c);if(r=has('Q'))d+=m?A.Q.rip(c,r)+A.Q.ripBleed(c,r):A.Q.dmg(c,r);if(r=has('E'))d+=m?A.E.leap(c,r):A.E.dmg(c,r);if(m&&(r=has('RMB')))d+=A.RMB.molt(c,r);d+=c.ad*(m?3:2.2);}
  else{let r;if(r=has('Q'))d+=A.Q.dmg(c,r)*1.2;if(r=has('RMB'))d+=A.RMB.dmg(c,r)*1.3;if(r=has('E'))d+=A.E.dmg(c,r);if(r=has('R'))d+=A.R.cut(c,r)*2+A.R.miss(r)*(f.maxHp-f.hp+A.R.cut(c,r));d+=crossDmg(c)+c.ad*2.5;}
  return d*pm*0.92;
}
function incoming(m,horizon,team){
  let s=0;
  for(const o of G.minions)if(o.alive&&o.team===team&&o.target===m&&o.atkCd<=horizon&&edge(o,m)<=o.range)s+=o.ad*physMult(o,m);
  for(const p of G.projs)if(p.homing===m&&p.team===team)s+=p.est||0;
  const t=G.towers[team];if(t&&t.alive&&t.target===m&&t.atkCd<=horizon)s+=m.maxHp*(m.mtype==='melee'?0.45:m.mtype==='caster'?0.7:0.14);
  return s;
}
function findDodge(c){
  let best=null;
  for(const p of G.projs){
    if(p.team===c.team||p.homing||!p.alive||p.age<0.09)continue;
    const ux=p.vx/p.speed,uy=p.vy/p.speed,rx=c.x-p.x,ry=c.y-p.y,along=rx*ux+ry*uy;
    if(along<-c.r||along>p.range-p.traveled+c.r)continue;
    const perp=rx*uy-ry*ux,need=p.radius+c.r+14;if(Math.abs(perp)>=need)continue;
    const tHit=along/p.speed;if(tHit>0.85)continue;
    let s=perp>=0?1:-1;let mx=uy*s,my=-ux*s;
    {const tp=clampWalk(c.x+mx*90,c.y+my*90,c.r);if(hyp(tp.x-c.x-mx*90,tp.y-c.y-my*90)>5){mx=-mx;my=-my;}}  // never dodge into a wall
    const danger=p.kind==='axe'||p.kind==='shuriken'?2:1;
    if(!best||danger>best.danger)best={x:mx,y:my,danger,urgent:(need-Math.abs(perp))/msOf(c)>tHit};
  }
  return best;
}
function predict(c,f,speed,delay){const d=dist(c,f),t=d/speed+(delay||0);return{x:f.x+f.vx*t*0.85+srnd(-12,12),y:f.y+f.vy*t*0.85+srnd(-12,12)};}
const NO_TOWER={alive:false,target:null,x:0,y:0,range:0,r:0};
function botThink(c,dt){
  const inp=c.input;inp.mx=0;inp.my=0;inp.attack=false;inp.attackTarget=null;
  if(!c.alive)return;
  botSkillPoints(c);
  const foe=G.champs.find(u=>u!==c),A=c.def.ab,aria=c.key==='cora',shade=c.key==='shade',vik=c.key==='viktor',bj=c.key==='blackjack';
  const vis=foe.alive&&targetable(foe);
  if(vis)c.mem={x:foe.x,y:foe.y,t:G.t};
  const dir=c.team===BLUE?1:-1,myT=G.towers[c.team]||NO_TOWER,foeT=G.towers[1-c.team]||NO_TOWER;
  const hpP=c.hp/c.maxHp,fP=foe.hp/foe.maxHp,d=vis?dist(c,foe):1e9;
  c.strafeT=(c.strafeT||0)-dt;if(c.strafeT<=0){c.strafeT=srnd(0.35,0.9);c.strafe=srand()<0.5?-1:1;}
  const can=k=>{const r=c.ranks[k],a=A[k];if(!r||c.cast||c.dash||c.stunT>0)return false;if(a.canRecast&&a.canRecast(c))return true;if(a.avail&&a.avail(c)!==true)return false;if(a.charges)return c.chg[k]>0;return c.cds[k]<=0&&c.res>=a.cost[r-1];};
  const cast=(k,x,y)=>{if(G.t<(c.nextCast||0)||!can(k))return false;if(tryCast(c,k,x,y)==='ok'){c.nextCast=G.t+0.2;return true;}return false;};
  const dashTo=(x,y)=>{if(G.t<(c.nextCast||0)||c.dashCd>0||c.cast||c.dash||c.stunT>0)return false;if(tryDash(c,x,y)==='ok'){c.nextCast=G.t+0.2;return true;}return false;};
  const away=(len)=>{const fx=vis?foe.x:c.x+dir*100,fy=vis?foe.y:c.y;let vx=c.x-fx,vy=c.y-fy;const l=hyp(vx,vy)||1;vx=vx/l-(isCol()?0:dir*0.9);vy=vy/l;const l2=hyp(vx,vy)||1;return clampWalk(c.x+vx/l2*len,c.y+vy/l2*len,60);};
  if(hpP<0.3)c.retreat=true;if(c.retreat&&hpP>0.85)c.retreat=false;
  const burst=vis?estBurst(c,foe):0,killable=vis&&burst>=foe.hp;
  const foeSafe=vis&&foeT.alive&&dist(foe,foeT)<=foeT.range+150;
  const tanked=foeT.target&&foeT.target.kind==='minion';
  const diveOk=!foeSafe||(tanked&&hpP>0.55&&burst>=foe.hp*1.25);
  const towerOnMe=foeT.alive&&foeT.target===c;
  // recall when low with nobody near; keep channeling unless someone closes in, and wait a moment before trying again
  const nearFoes=k=>(vis&&d<1000*k)||enemiesOf(c.team).some(u=>u.kind==='minion'&&u.alive&&dist(c,u)<550*k);
  if(c.recall){if(!nearFoes(1)&&!towerOnMe)return;c.recallRetry=G.t+3;}
  else if(hpP<0.4&&G.t>(c.recallRetry||0)&&!nearFoes(1.4)&&!towerOnMe&&dist(c,FOUNT[c.team])>FOUNT_R+400&&!(G.arena&&G.arena.inside.has(c))&&startRecall(c)==='ok')return;
  const reach=c.range+c.r+foe.r;
  let mode='farm';
  if(c.retreat&&!(killable&&d<450))mode='retreat';
  else if(towerOnMe&&!(killable&&d<300))mode='tower';
  else if(killable&&d<900&&diveOk)mode='allin';
  else if(vis&&d<700&&hpP>=fP-0.08&&!foeSafe)mode='trade';
  if(isCol()){const C=G.col;if(mode==='farm'||mode==='tower')mode='hunt';
    // no fountain here: only fall back when there is healing to fall back to, and once the storm is fully closed it is a fight to the death
    if(mode==='retreat'&&!C.plants.some(q=>q.alive)&&!C.beads.length&&!(killable&&d<450))mode=vis&&d<700?'trade':'hunt';
    if(vis&&C.storm&&C.storm.r<=COL.STORM_MIN+60)mode='allin';}
  c.mode=mode;
  let goal=null,atk=null;
  const myEdgeRange=u=>edge(c,u)<=c.range;
  const crowd=G.minions.filter(m=>m.alive&&m.team!==c.team&&dist(m,c)<AGGRO_R).length;
  // Colosseum retreat: slip into a bush on the far side from the enemy (and out of the storm) to break sight
  const bushRetreat=()=>{if(!vis)return null;let best=null,bd=900;for(const b of COL.bushes){if(dist(b,foe)<dist(c,foe)+80)continue;
    if(G.col.storm&&hyp(b.x-COL.cx,b.y-COL.cy)>G.col.storm.r-60)continue;const dd=dist(c,b);if(dd<bd){bd=dd;best=b;}}return best&&{x:best.x,y:best.y};};
  const rStart=()=>!G.arena&&edge(c,foe)<=440&&cast('R',foe.x,foe.y);
  const hookFoe=()=>{if(!can('E')||d>HOOK_RANGE-40)return false;const p=predict(c,foe,HOOK_SPEED,0.12);
    for(const m of G.minions)if(m.alive&&m.team!==c.team&&segDist(m.x,m.y,c.x,c.y,p.x,p.y).d<m.r+HOOK_R&&dist(c,m)<dist(c,p))return false;
    return cast('E',p.x,p.y);};
  const throwQ=()=>{if(!vis)return false;
    if(aria){if(d<600&&readyAxe(c)){const p=predict(c,foe,1500,0.18),l=hyp(p.x-c.x,p.y-c.y)||1;if(cast('Q',p.x+(p.x-c.x)/l*160,p.y+(p.y-c.y)/l*160))return true;}
      if(d<640){const p=predict(c,foe,2000,0.25);return cast('RMB',p.x,p.y);}return false;}
    if(!shade||d>820)return false;const p=predict(c,foe,1800,0.2);return cast('RMB',p.x,p.y);};
  const closeIn=()=>{if(aria&&c.axes){
      if(d>reach+60&&hookFoe())return;
      const q=c.axes.Q;if(q.state==='ground'&&G.t-q.t0>0.15&&hyp(q.x-foe.x,q.y-foe.y)<200&&dist(c,q)<HOOK_RANGE-60&&d>reach+60&&can('E')&&cast('E',q.x,q.y))return;
      const ok=oldestOut(c);
      if(ok&&A.Q.canRecast(c)){const q=c.axes[ok],qp=axePos(q),through=segDist(foe.x,foe.y,qp.x,qp.y,c.x,c.y).d<foe.r+AXE_W-10;
        if(((through&&q.state==='ground'&&!can('E'))||(q.state==='ground'&&G.t>q.until-0.5)||(axesInHand(c)===0&&edge(c,foe)<c.range+60))&&cast('Q',0,0))return;}
      if(d<640){const pr=predict(c,foe,2000,0.25);if(cast('RMB',pr.x,pr.y))return;}}
    if(shade){const er=(shadeQuarry(c)===foe?550:300)+c.r;if(d>reach+40&&d<er&&cast('E',foe.x,foe.y))return;}if(!(vik&&!vikMonster(c))&&d>reach+70&&d<(aria?400:350))dashTo(foe.x,foe.y);};
  const melee=()=>{
    if(shade&&d>reach-30&&d<330+foe.r)cast('Q',foe.x,foe.y);
  };
  if(mode==='retreat'){
    const rel=G.relics.find(r=>r.active&&dist(c,r)<900&&(r.x-c.x)*dir<200);
    goal=rel?{x:rel.x,y:rel.y}:isCol()?(bushRetreat()||away(420)):{x:FOUNT[c.team].x,y:MIDY};
    if(vis&&d<450){
      if(!aria){const a=away(300);if(!(shade&&cast('E',a.x,a.y))){const b=away(350);dashTo(b.x,b.y);}}
      else{// escape: hook our own tower if it is close, otherwise the cliff on the side away from the enemy
        const own=myT.alive&&dist(c,myT)<HOOK_RANGE&&dist(foe,myT)>dist(c,myT)?myT:null,wy=foe.y>c.y?LANE_TOP:LANE_BOT;
        const ux=(c.x-foe.x)/(d||1),uy=(c.y-foe.y)/(d||1),tgt=own||(isCol()?{x:c.x+ux*(HOOK_RANGE-40),y:c.y+uy*(HOOK_RANGE-40)}:{x:c.x-dir*220,y:wy});
        const wallNear=isCol()?colBlocked(tgt.x,tgt.y):Math.abs(wy-c.y)<HOOK_RANGE-60;
        if(can('E')&&(own||wallNear)&&cast('E',tgt.x,tgt.y)){}else{const a=away(350);dashTo(a.x,a.y);}if(d<520){const pr=predict(c,foe,2000,0.25);cast('RMB',pr.x,pr.y);}}
    }
  }else if(mode==='tower'){
    goal={x:foeT.x-dir*(foeT.range+c.r+180),y:c.y};
  }else if(mode==='hunt'){
    // no minions here: stalk the enemy, check the brush where it was last seen, otherwise sweep the bushes in turn
    if(vis){throwQ();if(myEdgeRange(foe))atk=foe;const pa=angTo(c,foe.x,foe.y);goal=d>560||hpP>fP?{x:foe.x,y:foe.y}:{x:c.x-Math.sin(pa)*c.strafe*150,y:c.y+Math.cos(pa)*c.strafe*150};}
    else if(c.mem&&G.t-c.mem.t<8&&dist(c,c.mem)>70)goal={x:c.mem.x,y:c.mem.y};
    else{if(c.sweep===undefined)c.sweep=(srand()*COL.bushes.length)|0;const b=COL.bushes[c.sweep];if(dist(c,b)<70)c.sweep=(c.sweep+1)%COL.bushes.length;goal={x:b.x,y:b.y};}
  }else if(mode==='allin'){
    closeIn();throwQ();melee();
    if(aria){if(c.ranks.R)rStart();}
    else if(shade){if(c.ranks.R&&edge(c,foe)<=500)cast('R',0,0);if(A.E.canRecast(c)&&hpP<0.35){const a=away(220);cast('E',a.x,a.y);}}
    if(myEdgeRange(foe))atk=foe;
    goal={x:foe.x,y:foe.y};
  }else if(mode==='trade'){
    throwQ();
    if(crowd<3||hpP>fP+0.2){
      const marked=foe.crosscut&&foe.crosscut.src===c&&foe.crosscut.until>G.t;
      if(aria||marked)melee();
      if(aria&&c.ranks.R&&fP<0.55)rStart();
      if(myEdgeRange(foe))atk=foe;
      const pa=angTo(c,foe.x,foe.y);
      goal=myEdgeRange(foe)||hpP>fP+0.15?{x:foe.x,y:foe.y}:d<reach+120?away(200):{x:c.x-Math.sin(pa)*c.strafe*140,y:c.y+Math.cos(pa)*c.strafe*140};
    }else goal=away(220);
  }
  if(mode==='farm'){
    const em=G.minions.filter(m=>m.alive&&m.team!==c.team&&dist(m,c)<1400);
    const am=G.minions.filter(m=>m.alive&&m.team===c.team);
    const wu=1/asOf(c)*c.def.base.windup;
    let lh=null;
    for(const m of em){if(edge(c,m)>c.range+30)continue;
      const dmg=c.ad*physMult(c,m),inc=incoming(m,wu,c.team);if(m.hp-inc<=dmg&&(!lh||m.hp<lh.hp))lh=m;}
    const foeAround=vis&&d<1300;
    if(lh)atk=lh;
    else if(em.length){
      const push=em.filter(m=>myEdgeRange(m)&&m.hp-incoming(m,1.2,c.team)>c.ad*2.2).sort((a,b)=>a.hp-b.hp)[0];
      if(push&&!foeAround)atk=push;
      if(vis&&myEdgeRange(foe)&&crowd<3&&!em.some(m=>m.hp<c.ad*1.6&&myEdgeRange(m)))atk=foe;
    }
    if(!em.some(m=>dist(m,foeT)<foeT.range+100)&&foeT.alive&&myEdgeRange(foeT)&&am.some(m=>dist(m,foeT)<foeT.range))atk=atk||foeT;
    if(vis&&d<850&&(aria||c.res>150))throwQ();
    let gx;
    if(em.length){const near=em.reduce((a,b)=>dist(a,c)<dist(b,c)?a:b);const ref=lh||near;gx=ref.x-dir*(c.r+ref.r+c.range*0.6);}
    else if(am.length){const front=am.reduce((a,b)=>(a.x-b.x)*dir>0?a:b);gx=front.x-dir*90;
      if(am.some(m=>dist(m,foeT)<foeT.range)&&foeT.alive)gx=foeT.x-dir*(foeT.r+c.range*0.8);}
    else gx=myT.x+dir*260;
    const limit=foeT.alive?foeT.x-dir*(foeT.range+c.r+60):(dir>0?W:0);
    const towerOk=tanked&&am.filter(m=>dist(m,foeT)<foeT.range).length>=2;
    if(!towerOk&&(gx-limit)*dir>0)gx=limit;
    if(vis){const threat=hpP<fP+0.05?320:0;if(d<threat&&(gx-(foe.x-dir*threat))*dir>0)gx=foe.x-dir*threat;}
    if(!vis&&c.mem&&G.t-c.mem.t<2&&dist(c,c.mem)<700)gx=c.x-dir*150;
    goal={x:gx,y:MIDY+c.strafe*110+Math.sin(G.t*0.7+c.id)*60};
  }
  // Colosseum upkeep: heal from beads and plants when it is safe, and never linger in the storm
  if(isCol()){const C=G.col,safe=!vis||d>520||mode==='retreat';
    // the control point: take it when the coast is clear or the fight is going our way
    if(C.cp&&C.t>=C.cp.openAt&&mode!=='retreat'&&mode!=='allin'&&(!vis||d>600||hpP>=fP-0.05))goal={x:COL.cx+Math.cos(c.id)*60,y:COL.cy+Math.sin(c.id)*60};
    const bead=C.beads.filter(b=>G.t>=b.land&&dist(c,b)<700&&(!vis||dist(c,b)<dist(foe,b))).sort((a,b)=>dist(c,a)-dist(c,b))[0];
    if(bead&&hpP<0.95&&safe&&mode!=='allin')goal={x:bead.x,y:bead.y};
    else if(hpP<0.75&&safe&&mode!=='allin'){const pl=C.plants.filter(q=>q.alive&&dist(c,q)<900&&(!vis||dist(c,q)<dist(foe,q)+100)).sort((a,b)=>dist(c,a)-dist(c,b))[0];
      if(pl){goal={x:pl.x,y:pl.y};if(edge(c,pl)<=c.range)atk=pl;}}
    if(C.storm){const S=C.storm.r-c.r-50;if(goal){const gd=hyp(goal.x-COL.cx,goal.y-COL.cy);if(gd>S){const k=Math.max(0,S)/gd;goal={x:COL.cx+(goal.x-COL.cx)*k,y:COL.cy+(goal.y-COL.cy)*k};}}
      if(hyp(c.x-COL.cx,c.y-COL.cy)>C.storm.r-10&&mode!=='allin')goal={x:COL.cx+(c.x-COL.cx)*0.5,y:COL.cy+(c.y-COL.cy)*0.5};}
    // chased while hurt: duck through a ready portal that the enemy is not standing beside
    if(mode==='retreat'&&vis&&d<600&&C.portalReady){const pt=COL.portals.filter(q=>C.t>=C.portalReady[q.pair]&&dist(c,q)<520&&dist(foe,q)>dist(c,q)+60).sort((a,b)=>dist(c,a)-dist(c,b))[0];if(pt)goal={x:pt.x,y:pt.y};}
    // step out of lava and meteor strikes, and never path into them
    const haz=[...C.lava.filter(l=>l.owner!==c),...C.meteors.filter(m=>m.owner!==c)];
    for(const h of haz){const dd=dist(c,h);if(dd<h.r+c.r+10){const k=(h.r+c.r+80)/(dd||1);goal={x:h.x+(c.x-h.x)*k,y:h.y+(c.y-h.y)*k};break;}
      if(goal&&hyp(goal.x-h.x,goal.y-h.y)<h.r+c.r){const gd=hyp(goal.x-h.x,goal.y-h.y)||1,k=(h.r+c.r+40)/gd;goal={x:h.x+(goal.x-h.x)*k,y:h.y+(goal.y-h.y)*k};}}}
  // inside the arena: fight, and snap the chains early once that finishes the job
  const ar=G.arena;
  if(ar&&!ar.snapped&&ar.inside.has(c)){if(vis){goal={x:foe.x,y:foe.y};if(myEdgeRange(foe))atk=foe;}
    if(aria&&A.R.canRecast(c)&&(A.R.snap(c,ar.rank,foe)*physMult(c,foe)>=foe.hp||hpP<0.2))cast('R',0,0);}
  if(aria&&vis&&mode!=='retreat'&&mode!=='tower'&&hpP>fP-0.15&&!foeSafe)closeIn();
  // in a duel (the Colosseum, or locked in a chain ring) Shade cuts with Scissor Blades on sight and finishes with Closing Blades
  const duel=isCol()||(G.arena&&G.arena.inside.has(c));
  if(shade&&vis&&duel&&mode!=='retreat'){if(d<330+foe.r)cast('Q',foe.x,foe.y);
    if(c.ranks.R&&edge(c,foe)<=500&&(fP<0.55||killable||(G.arena&&G.arena.inside.has(c))))cast('R',0,0);
    if(G.arena&&G.arena.inside.has(c)&&hpP<0.35&&c.dashCd<=0){const a=away(325);dashTo(a.x,a.y);}}
  // Viktor: poke with Bounty Round and kite at revolver range; grab the target in with Dragline, crash down from 75 Fury, then claw until the Fury runs dry
  if(vik&&vis&&mode!=='retreat'){const mon=vikMonster(c);
    if(!mon){
      if(d<980&&can('Q')){const p=predict(c,foe,2400,0.25);cast('Q',p.x,p.y);}
      // grab them in only when it pays: a kill, a transform about to land, or Kickback ready to blast them back out
      if(!c.arm&&d<ARM.range-20&&d>300&&!foeSafe&&(killable||c.res>=VIK_LEAP_FURY-15||(fP<0.4&&hpP>0.5&&can('RMB')))&&can('E')){const p=predict(c,foe,ARM.speed,0.12);cast('E',p.x,p.y);}
      if(c.res>=VIK_LEAP_FURY&&c.ranks.R&&d<580&&d>140&&(!foeSafe||fP<0.2)&&(killable||hpP>=fP-0.1||c.res>=92)){const p=predict(c,foe,1300,0.25);cast('R',p.x,p.y);}
      if(d<260&&c.res<c.maxRes&&can('RMB'))cast('RMB',foe.x,foe.y);
      else if(d<230&&c.res<c.maxRes&&c.dashCd<=0){const a=away(300);dashTo(a.x,a.y);}
      if(mode!=='farm'&&mode!=='tower'){if(myEdgeRange(foe))atk=foe;goal=d<c.range*0.6&&c.res<c.maxRes?away(220):d>c.range+foe.r?{x:foe.x,y:foe.y}:goal||{x:c.x,y:c.y};}}
    else{
      if(d<300&&can('Q'))cast('Q',foe.x,foe.y);
      if(d>c.range+70&&d<470&&can('E'))cast('E',foe.x,foe.y);
      else if(d>c.range+120&&d<520&&c.ranks.R&&can('R')&&(!foeSafe||fP<0.2)){const p=predict(c,foe,1300,0.12);cast('R',p.x,p.y);}
      if((d<230||c.res<14)&&can('RMB'))cast('RMB',foe.x,foe.y);
      if(d<900){goal={x:foe.x,y:foe.y};if(myEdgeRange(foe))atk=foe;}
      if(c.res<12&&hpP<fP)goal=away(300);}
    // only follow the target under their tower once they are below 20% health
    if(foeSafe&&(fP>=0.2||hpP<0.45)&&goal&&foeT.alive&&dist(goal,foeT)<foeT.range+c.r+60){goal={x:foeT.x-dir*(foeT.range+c.r+140),y:c.y};if(atk===foe&&dist(c,foeT)<foeT.range+c.r)atk=null;}}
  // Black Jack: coin them, double-tap, cash the loaded shot, and Jetstep to keep his distance; Royal Flush once they are committed
  if(bj&&vis&&mode!=='retreat'){
    if(!c.flush){
      if(d<620&&can('RMB')){const p=predict(c,foe,560,0.85);cast('RMB',p.x,p.y);}
      if(d<820&&can('Q')){const p=predict(c,foe,2600,0.12);cast('Q',p.x,p.y);}
      if(c.ranks.R&&d<620&&(killable||fP<0.5||(foe.slows.length&&d<450))&&(!foeSafe||fP<0.2)&&can('R'))cast('R',foe.x,foe.y);
      if(d<240&&c.chg.E>0&&can('E')){if(hpP>=fP-0.05&&!foeSafe){const a=angTo(c,foe.x,foe.y),l=Math.min(260,d+120);cast('E',c.x+Math.cos(a)*l,c.y+Math.sin(a)*l);}else{const a=away(260);cast('E',a.x,a.y);}}
      else if(killable&&d>c.range+50&&d<c.range+280&&c.chg.E>1&&can('E'))cast('E',foe.x,foe.y);}
    if(mode!=='farm'&&mode!=='tower'){if(myEdgeRange(foe))atk=foe;goal=d<c.range*0.65?away(220):d>c.range+foe.r?{x:foe.x,y:foe.y}:goal||{x:c.x,y:c.y};}
    if(c.flush){const a=c.flush.ang,side=Math.sin(angTo(c,foe.x,foe.y)-a);goal={x:c.x-Math.cos(a)*80+Math.cos(a+PI/2)*side*120,y:c.y-Math.sin(a)*80+Math.sin(a+PI/2)*side*120};}
    if(foeSafe&&(fP>=0.2||hpP<0.45)&&goal&&foeT.alive&&dist(goal,foeT)<foeT.range+c.r+60){goal={x:foeT.x-dir*(foeT.range+c.r+140),y:c.y};if(atk===foe&&dist(c,foeT)<foeT.range+c.r)atk=null;}}
  if(bj&&vis&&mode==='retreat'&&d<320&&c.chg.E>0&&can('E')){const a=away(260);cast('E',a.x,a.y);}
  if(vik&&vis&&mode==='retreat'&&!vikMonster(c)&&d<320&&can('RMB'))cast('RMB',foe.x,foe.y);
  // cornered with Fury to spare: Crash Down away from them and land uncaged, with the monster's extra health
  // (in the Colosseum there is nowhere to run, so crash onto them instead and fight on with the monster's health)
  if(vik&&vis&&!vikMonster(c)&&c.res>=VIK_LEAP_FURY&&c.ranks.R&&d<350&&hpP<0.45&&can('R')){const a=isCol()?{x:foe.x,y:foe.y}:away(560);cast('R',a.x,a.y);}
  if(shade&&vis&&mode!=='retreat'&&foe.crosscut&&foe.crosscut.src===c&&foe.crosscut.until>G.t&&edge(c,foe)<=c.range+80){atk=foe;goal={x:foe.x,y:foe.y};}
  if(c.spin){atk=null;if(vis&&d<700&&mode!=='retreat')goal={x:foe.x,y:foe.y};}
  // dodge overrides movement
  const dg=findDodge(c);
  if(dg){
    if(dg.urgent&&(hpP<0.6||mode==='allin'||mode==='trade'))dashTo(c.x+dg.x*300,c.y+dg.y*300);
    inp.mx=dg.x;inp.my=dg.y;atk=null;
  }else if(goal){
    const gp=clampWalk(goal.x,goal.y,c.r+10),l=hyp(gp.x-c.x,gp.y-c.y);
    if(l>20){const sv=steer(c,gp.x,gp.y);inp.mx=sv.x;inp.my=sv.y;}
  }
  if(atk&&edge(c,atk)<=c.range&&targetable(atk)){inp.attack=true;inp.attackTarget=atk;inp.ax=atk.x;inp.ay=atk.y;}
  else if(vis&&d<1200){inp.ax=foe.x;inp.ay=foe.y;}
  else{inp.ax=c.x+inp.mx*200+dir*10;inp.ay=c.y+inp.my*200;}
}

// ================= input =================
// The browser samples what the player does into a small frame each tick; the simulation applies frames.
// Single player applies its frame at once; online, frames travel to the other browser and both apply them on the same tick.
const keys={};const mouse={x:0,y:0,left:false,right:false,in:false};
const LOCAL_EV=[];  // actions since the last sample: casts, dashes, ranks, recall, orders, augment picks, ready
function pushEv(e){if(!G||G.over)return;LOCAL_EV.push(e);
  // the slot lights up the moment you press, even before the match applies the press
  if(e[0]==='c'){const s=slotEls[e[1]==='SPACE'?'DASH':e[1]];if(s){s.d.classList.remove('press');void s.d.offsetWidth;s.d.classList.add('press');}}}
// frame: [move x, move y (x1000), aim x, aim y (snapped to the hovered unit), ground x, ground y, flags (1 attack held, 2 point-and-click), hovered unit id, events?]
function sampleInput(c){
  const cl=classic();let mx=0,my=0;
  if(!cl){let sx=0,sy=0;if(keys.KeyW)sy-=1;if(keys.KeyS)sy+=1;if(keys.KeyA)sx-=1;if(keys.KeyD)sx+=1;
    // WASD moves in screen directions: convert the screen vector back onto the ground plane
    if(sx||sy){const v=sy/IK,wx=sx*CS-v*SN,wy=sx*SN+v*CS,l=hyp(wx,wy);mx=wx/l;my=wy/l;}}
  // holding right click keeps steering, like the classic clients
  else if(mouse.right&&c.alive&&G.t>=(mouse.rep||0)){mouse.rep=G.t+0.12;const mk=G.t>=(mouse.markT||0);if(mk)mouse.markT=G.t+0.3;issueOrder(false,mk);}
  let w=screenToWorld(mouse.x,mouse.y);const gw=w;
  G.hover=c.alive?findHover():null;if(G.hover)w={x:G.hover.x,y:G.hover.y};
  const f=[Math.round(mx*1000),Math.round(my*1000),Math.round(w.x),Math.round(w.y),Math.round(gw.x),Math.round(gw.y),(!cl&&mouse.left?1:0)|(cl?2:0),G.hover?G.hover.id:0];
  if(LOCAL_EV.length)f.push(LOCAL_EV.splice(0));
  return f;}
function unitById(id){if(!id)return null;for(const l of [G.champs,G.minions,G.towers,G.col?G.col.plants:[]])for(const u of l)if(u.id===id)return u;return null;}
// apply a frame to a champion; while a round is frozen only ranks, augment picks and ready count
function applyFrame(c,f,frozen){
  const inp=c.input;c.cancelWind=false;
  for(const e of (f&&f[8])||[]){const k=e[0];
    if(k==='r')rankUp(c,e[1]);
    else if(k==='ag'){if(G.col&&G.col.state==='prep'&&c.augOffer&&c.augOffer.some(a=>a.id===e[1]))c.augPick=e[1];}
    else if(k==='rd'){if(G.col&&G.col.state==='prep')c.prepReady=true;}
    else if(frozen||!c.alive)continue;
    else if(k==='c')c.pend={k:e[1],until:G.t+0.35};
    else if(k==='b'){const r=startRecall(c);if(r!=='ok'&&c===G.player)showReason(r);}
    else if(k==='o'){const t=unitById(e[4]);if(t&&t.alive&&targetable(t))c.order={kind:'attack',t};else if(!e[4])c.order={kind:e[1]?'amove':'move',x:e[2],y:e[3],best:1e9,stall:0};}
    else if(k==='s'&&c.wind){c.order=null;c.cancelWind=true;}
    else if(k==='s')c.order=null;}
  if(c.cancelWind&&!c.wind)c.cancelWind=false;
  if(frozen)return;
  if(!c.alive){c.order=null;c.pend=null;inp.attack=false;inp.attackTarget=null;inp.mx=inp.my=0;return;}
  if(!f){inp.mx=inp.my=0;inp.attack=false;inp.attackTarget=null;return;}
  if(f[6]&2){inp.mx=inp.my=0;inp.attack=false;inp.attackTarget=null;followOrder(c);}
  else{inp.mx=f[0]/1000;inp.my=f[1]/1000;inp.ax=f[2];inp.ay=f[3];
    const h=unitById(f[7]),hov=h&&h.alive&&targetable(h)?h:null;
    inp.attack=!!(f[6]&1);inp.attackTarget=hov&&edge(c,hov)<=c.range+15?hov:null;}
  if(c.pend){const p=c.pend,r=p.k==='SPACE'?tryDash(c,f[4],f[5]):tryCast(c,p.k,f[2],f[3]);
    if(r==='ok'||(r==='busy'&&G.t>p.until))c.pend=null;
    else if(r!=='busy'){if(c===G.player)showReason(r,p.k);c.pend=null;}}
}
// ---- classic point-and-click: right click walks or attacks, A + left click attack-moves, S stops ----
let amove=false;
function clickMark(x,y,col,r){G.fx.push({k:'click',x,y,col,r:r||34,t:0,dur:0.45});}
function issueOrder(am,mark){const p=G.player;if(!p.alive)return;amove=false;
  const h=findHover(),g=screenToWorld(mouse.x,mouse.y),w=clampWalk(g.x,g.y,p.r);
  let t=h;
  if(!t&&am){let bd=280;for(const u of enemiesOf(p.team)){if(!targetable(u))continue;const d=hyp(u.x-w.x,u.y-w.y)-u.r;if(d<bd){bd=d;t=u;}}}
  if(t){if(!(p.order&&p.order.t===t)||mark)clickMark(t.x,t.y,'#ff5d52',t.r+16);pushEv(['o',1,0,0,t.id]);return;}
  pushEv(['o',am?1:0,Math.round(w.x),Math.round(w.y),0]);if(mark)clickMark(w.x,w.y,am?'#ff5d52':'#7dffa0');
}
// walk to the ordered spot, chase the ordered target into range, or attack-move
function followOrder(c){
  const inp=c.input;let o=c.order,dest=null;
  if(o&&o.kind==='amove'){let best=null,bd=1e9;for(const u of enemiesOf(c.team)){if(!targetable(u))continue;const e=edge(c,u);if(e<=c.range+60&&e<bd){bd=e;best=u;}}
    if(best)o=c.order={kind:'attack',t:best};else dest=o;}
  if(o&&o.kind==='attack'){const t=o.t;if(!t.alive||!targetable(t))c.order=o=null;
    else if(edge(c,t)<=c.range){inp.attack=true;inp.attackTarget=t;inp.ax=t.x;inp.ay=t.y;}else dest=t;}
  else if(o&&o.kind==='move')dest=o;
  if(dest){const dx=dest.x-c.x,dy=dest.y-c.y,l=hyp(dx,dy);
    if(o.kind!=='attack'){if(l<o.best-2){o.best=l;o.stall=0;}else o.stall+=1/60;}
    if(o.kind!=='attack'&&(l<8||o.stall>0.6))c.order=null;else{const sv=steer(c,dest.x,dest.y);inp.mx=sv.x;inp.my=sv.y;inp.ax=dest.x;inp.ay=dest.y;}}
}
function findHover(){let best=null,bd=1e9;for(const u of attackables(G.player.team)){if(!targetable(u))continue;const p=P(u.x,u.y),h=heightOf(u)*SCALE,rw=(u.r+12)*SCALE;
  if(Math.abs(mouse.x-p.x)>rw||mouse.y>p.y+rw*IK+4||mouse.y<p.y-h-8)continue;const s=Math.abs(mouse.x-p.x)+Math.abs(mouse.y-(p.y-h/2))*0.4-(u.kind==='champ'?40:0);if(s<bd){bd=s;best=u;}}return best;}
const REASON={unlearned:k=>`Learn ${keyLabel(k)} first (Shift + ${classic()||k!=='RMB'?keyLabel(k):'right click'})`,cooldown:()=>'Ability on cooldown',axeaway:()=>'That axe is still out',noaxe:()=>'No grounded axe in range',noaxehand:()=>'No axe in hand',nofury:()=>`Crash Down needs ${VIK_LEAP_FURY} Fury`,uncaged:()=>'Already uncaged',norecall:()=>'There is no recall in the Colosseum',chainset:()=>'The chains are still setting',nolock:()=>'This page cannot capture the mouse here, so cursor speed stays at your system speed',recalling:()=>'Already recalling',recallx:()=>'Recall canceled',windup:()=>'Winding up',dashcd:()=>'Dash on cooldown',muted:()=>'Sound off (M)',unmuted:()=>'Sound on (M)',resource:()=>`Not enough ${G.player.def.resource.toLowerCase()}`,stunned:()=>'You are stunned',notarget:()=>'No enemy champion in range',dead:()=>''};
let toastT=0;
function showReason(r,k){const f=REASON[r];if(!f)return;const t=f(k);if(!t)return;const el=$('toast');el.textContent=t;el.classList.add('on');toastT=1.4;}
addEventListener('keydown',e=>{
  if(!G)return;
  if(e.code==='Escape'){if(performance.now()-lockLostAt<500)return;if(amove){amove=false;return;}if(!G.over)setPause(NET.live?!NET.overlay:!G.paused);return;}
  if(e.code==='KeyM'){SFX.init();SFX.muted=!SFX.muted;updateMuteBtn();showReason(SFX.muted?'muted':'unmuted');return;}
  if(G.paused||G.over||NET.overlay)return;
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)pushEv(['c','SPACE']);return;}
  if(e.code==='KeyY'){e.preventDefault();if(!e.repeat)toggleCam();return;}
  if(e.code.startsWith('Arrow')){e.preventDefault();keys[e.code]=true;return;}
  if(e.code==='KeyB'){e.preventDefault();if(!e.repeat)pushEv(['b']);return;}
  const map=classic()?{KeyQ:'Q',KeyW:'E',KeyE:'RMB',KeyR:'R'}:{KeyQ:'Q',KeyE:'E',KeyR:'R'};
  if(map[e.code]){e.preventDefault();if(e.repeat)return;
    pushEv([e.shiftKey?'r':'c',map[e.code]]);return;}
  if(classic()){
    if(e.code==='KeyS'){e.preventDefault();pushEv(['s']);amove=false;}
    if(e.code==='KeyA'){e.preventDefault();if(e.repeat)return;if(SET.amove==='key')issueOrder(true,true);else amove=true;}
    return;}
  if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){keys[e.code]=true;e.preventDefault();}
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.left=false;mouse.right=false;mouse.in=false;if(G&&!G.over&&!G.paused&&!NET.live)setPause(true);});
addEventListener('mousemove',e=>{
  if(isLocked()){const k=SET.sens/100;mouse.x=clamp(mouse.x+e.movementX*k,0,VW-1);mouse.y=clamp(mouse.y+e.movementY*k,0,VH-1);lockHover();}
  else{mouse.x=e.clientX;mouse.y=e.clientY;}mouse.in=true;});
// leaving the frame through an edge with the camera unlocked keeps pushing that edge, like a windowed RTS
document.documentElement.addEventListener('mouseleave',e=>{if(isLocked())return;mouse.x=clamp(e.clientX,0,VW-1);mouse.y=clamp(e.clientY,0,VH-1);mouse.in=camFree;});
addEventListener('contextmenu',e=>e.preventDefault());
const cv=$('game'),mctx=cv.getContext('2d'),buf=document.createElement('canvas'),bctx=buf.getContext('2d'),fbuf=document.createElement('canvas'),fctx=fbuf.getContext('2d');let ctx=mctx;
cv.addEventListener('mousedown',e=>{
  e.preventDefault();if(!G||G.paused||G.over||NET.overlay)return;
  if(isLocked()&&lockClick())return;
  tryLock();
  if(classic()){if(e.button===2){mouse.right=true;mouse.rep=G.t+0.12;mouse.markT=G.t+0.3;issueOrder(false,true);}else if(e.button===0&&amove)issueOrder(true,true);return;}
  if(e.button===0)mouse.left=true;
  if(e.button===2)pushEv([e.shiftKey?'r':'c','RMB']);
});
addEventListener('mouseup',e=>{if(e.button===0)mouse.left=false;if(e.button===2)mouse.right=false;});

// ================= camera & isometric projection =================
// Simulation stays in flat world coordinates; only drawing and input go through the projection.
// World +x (toward red) maps to screen up-right, so the lane runs diagonally like a mid lane.
let DPR=1,VW=0,VH=0,SCALE=1,PXd=3,RS=1,ART_K=0,SHX=0,SHY=0;const cam={x:W/2,y:MIDY};const SPR=new Map();
const IC=Math.SQRT1_2,IK=0.6,CLIFF_H=110,DROP_H=190;
// the camera's heading around the vertical axis (cos, sin): 45 degrees in the Colosseum, the bridge art's own angle on the lane
let CS=IC,SN=IC;
function camAngle(){const a=G&&G.mode==='col'?PI/4:LANE_ART.psi;CS=Math.cos(a);SN=Math.sin(a);}
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);VW=innerWidth;VH=innerHeight;cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR);SCALE=Math.min(VH/800,VW/1320);
  // world renders into a buffer where one pixel is PXd device pixels; sprites are baked at that scale
  PXd=Math.max(2,Math.round(2.7*SCALE*DPR));buf.width=fbuf.width=Math.ceil(cv.width/PXd);buf.height=fbuf.height=Math.ceil(cv.height/PXd);
  const k=SCALE*DPR/PXd;if(Math.abs(k-ART_K)>1e-6){ART_K=k;SPR.clear();if(G&&typeof queueBakes==='function')queueBakes();}}
addEventListener('resize',resize);resize();
function P(x,y,z){const dx=x-cam.x,dy=y-cam.y;return{x:VW/2+(dx*CS+dy*SN)*SCALE+SHX,y:VH*0.57+((dy*CS-dx*SN)*IK-(z||0))*SCALE+SHY};}
function screenToWorld(sx,sy){const u=(sx-VW/2)/SCALE,v=(sy-VH*0.57)/SCALE/IK;return{x:cam.x+u*CS-v*SN,y:cam.y+u*SN+v*CS};}
function groundT(lift){const k=RS*SCALE,a=k*CS,b=-k*SN*IK,c=k*SN,d=k*CS*IK;ctx.setTransform(a,b,c,d,RS*(VW/2+SHX)-(a*cam.x+c*cam.y),RS*(VH*0.57+SHY)-(b*cam.x+d*cam.y)-(lift||0)*k);}
function screenT(){ctx.setTransform(RS,0,0,RS,0,0);}
const projAng=a=>{const c=Math.cos(a),s=Math.sin(a);return Math.atan2((s*CS-c*SN)*IK,c*CS+s*SN);};
const HEIGHT={champ:92,melee:46,caster:48,super:76,tower:250,plant:60};
const heightOf=u=>u.kind==='champ'?(u.form==='monster'?160:HEIGHT.champ):u.kind==='tower'?HEIGHT.tower:HEIGHT[u.mtype];
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// ================= ground =================
let ground=null,topEdge=[],botEdge=[],plateauRocks=[];
const ROCK='#141d1a',ABYSS='#05080b';
function buildGround(){
  const g=document.createElement('canvas');g.width=W;g.height=H;const c=g.getContext('2d');const R=mulberry(7);
  c.fillStyle='#17231d';c.fillRect(0,0,W,H);
  for(let i=0;i<7000;i++){const x=R()*W,y=R()*H,r=4+R()*26;const k=R();c.fillStyle=k<0.5?`rgba(40,66,48,${0.12+R()*0.18})`:k<0.85?`rgba(14,24,18,${0.2+R()*0.2})`:`rgba(70,92,60,${0.08+R()*0.1})`;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  const top=[],bot=[];for(let x=0;x<=W;x+=80){top.push([x,440+Math.sin(x/310)*22+R()*26]);bot.push([x,860+Math.sin(x/270+1)*22-R()*26]);}
  c.fillStyle='#2a2d27';c.beginPath();c.moveTo(top[0][0],top[0][1]);for(const p of top)c.lineTo(p[0],p[1]);for(let i=bot.length-1;i>=0;i--)c.lineTo(bot[i][0],bot[i][1]);c.closePath();c.fill();
  c.save();c.clip();
  for(let i=0;i<4200;i++){const x=R()*W,y=380+R()*560,w=14+R()*26,h=10+R()*16;c.fillStyle=`rgba(${70+R()*30|0},${72+R()*28|0},${62+R()*22|0},${0.18+R()*0.25})`;c.beginPath();c.roundRect?c.roundRect(x,y,w,h,4):c.rect(x,y,w,h);c.fill();}
  for(let i=0;i<500;i++){c.strokeStyle='rgba(10,12,10,.35)';c.lineWidth=1+R()*2;c.beginPath();const x=R()*W,y=400+R()*500;c.moveTo(x,y);c.lineTo(x+rnd(-40,40),y+rnd(-20,20));c.stroke();}
  c.restore();
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=6;c.beginPath();for(const p of top)c.lineTo(p[0],p[1]);c.stroke();c.beginPath();for(const p of bot)c.lineTo(p[0],p[1]);c.stroke();
  for(const t of [BLUE,RED]){const f=FOUNT[t];const gr=c.createRadialGradient(f.x,f.y,40,f.x,f.y,820);gr.addColorStop(0,t?'rgba(120,40,36,.55)':'rgba(30,80,130,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(f.x-820,f.y-820,1640,1640);
    c.fillStyle='#262c2f';c.beginPath();c.arc(f.x,f.y,FOUNT_R,0,TAU);c.fill();
    c.strokeStyle=TEAMC[t];c.globalAlpha=0.55;c.lineWidth=6;c.beginPath();c.arc(f.x,f.y,FOUNT_R,0,TAU);c.stroke();c.lineWidth=2;c.beginPath();c.arc(f.x,f.y,FOUNT_R-26,0,TAU);c.stroke();
    for(let i=0;i<12;i++){const a=i/12*TAU;c.beginPath();c.moveTo(f.x+Math.cos(a)*(FOUNT_R-26),f.y+Math.sin(a)*(FOUNT_R-26));c.lineTo(f.x+Math.cos(a)*(FOUNT_R-70),f.y+Math.sin(a)*(FOUNT_R-70));c.stroke();}
    c.globalAlpha=1;
    const tx=TOWER_X[t];c.fillStyle='#2f3433';c.beginPath();c.arc(tx,MIDY,150,0,TAU);c.fill();c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=5;c.stroke();
    for(let i=0;i<8;i++){const a=i/8*TAU+0.2;c.fillStyle='#3a403e';c.beginPath();c.arc(tx+Math.cos(a)*118,MIDY+Math.sin(a)*118,16,0,TAU);c.fill();}}
  c.strokeStyle='rgba(200,190,150,.18)';c.lineWidth=4;c.beginPath();c.arc(W/2,MIDY,130,0,TAU);c.stroke();c.beginPath();c.arc(W/2,MIDY,90,0,TAU);c.stroke();
  for(let i=0;i<6;i++){const a=i/6*TAU;c.beginPath();c.moveTo(W/2+Math.cos(a)*90,MIDY+Math.sin(a)*90);c.lineTo(W/2+Math.cos(a+2.09)*90,MIDY+Math.sin(a+2.09)*90);c.stroke();}
  // edges: raised cliff along the top (low y), sheer drop along the bottom (high y)
  topEdge=[];botEdge=[];
  for(let x=-1600;x<=W+1600;x+=50){topEdge.push([x,LANE_TOP-(4+R()*24)]);botEdge.push([x,LANE_BOT+(4+R()*24)]);}
  c.fillStyle=ROCK;c.beginPath();c.moveTo(0,0);for(const p of topEdge)c.lineTo(p[0],p[1]);c.lineTo(W,0);c.closePath();c.fill();
  c.fillStyle=ABYSS;c.beginPath();c.moveTo(0,H);for(const p of botEdge)c.lineTo(p[0],p[1]);c.lineTo(W,H);c.closePath();c.fill();
  // grass fringe along the lane side of both edges
  for(let i=0;i<900;i++){const x=R()*W,top=R()<0.5,y=top?LANE_TOP+R()*40:LANE_BOT-R()*40;c.fillStyle=`rgba(${50+R()*30|0},${80+R()*30|0},${50+R()*20|0},${0.3+R()*0.3})`;c.beginPath();c.arc(x,y,3+R()*8,0,TAU);c.fill();}
  plateauRocks=[];
  for(let i=0;i<1400;i++){const x=-1600+R()*(W+3200),y=-1800+R()*(LANE_TOP-60+1800),r=12+R()*46;const pts=[];for(let k=0;k<7;k++){const a=k/7*TAU;pts.push([Math.cos(a)*r*(0.6+R()*0.5),Math.sin(a)*r*(0.6+R()*0.5)]);}
    const m=R();plateauRocks.push({x,y,pts,col:m<0.7?`rgba(${44+R()*20|0},${56+R()*18|0},${52+R()*14|0},${0.5+R()*0.4})`:`rgba(${46+R()*20|0},${84+R()*24|0},${52+R()*16|0},${0.35+R()*0.3})`});}
  ground=g;
}
function drawTerrain(){
  if(LANE_ART.img){drawLaneArt();return;}
  // abyss plane beyond the bottom ledge
  groundT(0);ctx.fillStyle=ABYSS;ctx.fillRect(-2500,LANE_BOT-60,W+5000,2600);
  ctx.fillStyle='#0f1613';ctx.fillRect(-2500,LANE_TOP-60,2500,LANE_BOT-LANE_TOP+120);ctx.fillRect(W,LANE_TOP-60,2500,LANE_BOT-LANE_TOP+120);
  if(ground)ctx.drawImage(ground,0,0);
  // mist in the abyss
  const t=performance.now()/1000;
  for(let i=0;i<10;i++){const x=cam.x-1800+((i*530+t*20)%3600),y=LANE_BOT+160+(i%3)*120;const gr=ctx.createRadialGradient(x,y,10,x,y,260);gr.addColorStop(0,'rgba(70,110,130,.10)');gr.addColorStop(1,'rgba(70,110,130,0)');ctx.fillStyle=gr;ctx.fillRect(x-260,y-260,520,520);}
  // drop face below the bottom edge
  screenT();
  const band=(z0,z1,col)=>{ctx.fillStyle=col;ctx.beginPath();let first=true;for(const p of botEdge){if(Math.abs(p[0]-cam.x)>2600)continue;const s=P(p[0],p[1],z0);if(first){ctx.moveTo(s.x,s.y);first=false;}else ctx.lineTo(s.x,s.y);}
    for(let i=botEdge.length-1;i>=0;i--){const p=botEdge[i];if(Math.abs(p[0]-cam.x)>2600)continue;const s=P(p[0],p[1],z1);ctx.lineTo(s.x,s.y);}ctx.closePath();ctx.fill();};
  band(0,-DROP_H*0.35,'#26302b');band(-DROP_H*0.35,-DROP_H*0.7,'#18201d');band(-DROP_H*0.7,-DROP_H,'#0c1210');
  ctx.strokeStyle='#3c4a43';ctx.lineWidth=Math.max(1.5,3*SCALE);ctx.beginPath();for(const p of botEdge){if(Math.abs(p[0]-cam.x)>2600)continue;const s=P(p[0],p[1],0);ctx.lineTo(s.x,s.y);}ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;
  for(let i=0;i<botEdge.length;i+=2){const p=botEdge[i];if(Math.abs(p[0]-cam.x)>2600)continue;const a=P(p[0],p[1],-6),b=P(p[0],p[1],-DROP_H*0.8);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
}
function drawCliff(){
  if(LANE_ART.img)return;
  // raised plateau along the top edge; drawn after ground decals so it occludes them
  screenT();
  ctx.fillStyle='#202b27';ctx.beginPath();let first=true;
  for(const p of topEdge){if(Math.abs(p[0]-cam.x)>2600)continue;const s=P(p[0],p[1],0);if(first){ctx.moveTo(s.x,s.y);first=false;}else ctx.lineTo(s.x,s.y);}
  for(let i=topEdge.length-1;i>=0;i--){const p=topEdge[i];if(Math.abs(p[0]-cam.x)>2600)continue;const s=P(p[0],p[1],CLIFF_H);ctx.lineTo(s.x,s.y);}
  ctx.closePath();ctx.fill();
  ctx.lineWidth=1;
  for(let i=0;i<topEdge.length-1;i++){const p=topEdge[i],q=topEdge[i+1];if(Math.abs(p[0]-cam.x)>2600)continue;
    const a=P(p[0],p[1],0),b=P(q[0],q[1],0),c=P(q[0],q[1],CLIFF_H),d=P(p[0],p[1],CLIFF_H);
    ctx.fillStyle=i%3===0?'rgba(0,0,0,.16)':i%3===1?'rgba(255,255,255,.03)':'rgba(0,0,0,.06)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.25)';ctx.beginPath();const m=P(p[0],p[1],CLIFF_H*0.45),n=P(q[0],q[1],CLIFF_H*(0.4+(i%4)*0.08));ctx.moveTo(m.x,m.y);ctx.lineTo(n.x,n.y);ctx.stroke();}
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();first=true;
  for(const p of topEdge){if(Math.abs(p[0]-cam.x)>2600)continue;const s=P(p[0],p[1],0);if(first){ctx.moveTo(s.x,s.y);first=false;}else ctx.lineTo(s.x,s.y);}
  for(let i=topEdge.length-1;i>=0;i--){const p=topEdge[i];if(Math.abs(p[0]-cam.x)>2600)continue;const s=P(p[0],p[1],14);ctx.lineTo(s.x,s.y);}
  ctx.closePath();ctx.fill();
  groundT(CLIFF_H);
  ctx.fillStyle=ROCK;ctx.beginPath();ctx.moveTo(-1600,-1900);for(const p of topEdge)ctx.lineTo(p[0],p[1]);ctx.lineTo(W+1600,-1900);ctx.closePath();ctx.fill();
  for(const r of plateauRocks){if(Math.abs(r.x-cam.x)>2600)continue;ctx.fillStyle=r.col;ctx.beginPath();ctx.moveTo(r.x+r.pts[0][0],r.y+r.pts[0][1]);for(const p of r.pts)ctx.lineTo(r.x+p[0],r.y+p[1]);ctx.closePath();ctx.fill();}
  ctx.strokeStyle='#40524b';ctx.lineWidth=7;ctx.beginPath();for(const p of topEdge){if(Math.abs(p[0]-cam.x)>2600)continue;ctx.lineTo(p[0],p[1]);}ctx.stroke();
}

// ================= pixel-art sprites =================
// Characters are small 3D puppets (balls, capsules, polygons) posed per animation frame, projected through the
// same isometric camera at low resolution, then hard-edged and outlined so they read as pixel art.
// Frames are baked lazily and cached per direction, animation and frame.
const DIRS=16,MDIRS=8;
function hexRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255];}
function tint(h,f){const [r,g,b]=hexRgb(h);const m=v=>Math.round(f>0?v+(255-v)*f:v*(1+f));return'#'+[m(r),m(g),m(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
const V=(f,s,z)=>({f,s,z});
const lerpV=(a,b,t)=>({f:a.f+(b.f-a.f)*t,s:a.s+(b.s-a.s)*t,z:a.z+(b.z-a.z)*t});
const addV=(a,b,m)=>({f:a.f+b.f*m,s:a.s+b.s*m,z:a.z+b.z*m});
const normV=a=>{const l=Math.hypot(a.f,a.s,a.z)||1;return{f:a.f/l,s:a.s/l,z:a.z/l};};
const crossV=(a,b)=>({f:a.s*b.z-a.z*b.s,s:a.z*b.f-a.f*b.z,z:a.f*b.s-a.s*b.f});
const lenV=a=>Math.hypot(a.f,a.s,a.z);
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
function kf(keys,t){if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++){if(t<=keys[i][0]){const [t0,a]=keys[i-1],[t1,b]=keys[i];const u=ease((t-t0)/(t1-t0));return typeof a==='number'?a+(b-a)*u:lerpV(a,b,u);}}return keys[keys.length-1][1];}
function mkRig(){const parts=[];return{parts,
  ball(c,r,col,hi){parts.push({t:'b',c,r,col,hi:hi!==false});},
  limb(a,b,r,col){parts.push({t:'l',a,b,r,col});},
  poly(pts,col,edge){parts.push({t:'p',pts,col,edge});},
  dot(c,col){parts.push({t:'d',c,col});}};}
function pixelize(c,outline){
  const g=c.getContext('2d'),w=c.width,h=c.height,im=g.getImageData(0,0,w,h),d=im.data,o=hexRgb(outline),src=new Uint8Array(w*h);
  for(let i=0;i<w*h;i++){const a=d[i*4+3];if(a>100){d[i*4+3]=255;src[i]=1;}else d[i*4+3]=0;}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(src[i])continue;
    if((x>0&&src[i-1])||(x<w-1&&src[i+1])||(y>0&&src[i-w])||(y<h-1&&src[i+w])){const j=i*4;d[j]=o[0];d[j+1]=o[1];d[j+2]=o[2];d[j+3]=255;}}
  g.putImageData(im,0,0);
}
function bake(rig,ang,k,box,outline,hi){
  const cw=Math.ceil((box.l+box.r)*k)+4,ch=Math.ceil((box.u+box.d)*k)+4,ax=Math.round(box.l*k)+2,ay=Math.round(box.u*k)+2;
  const c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d');
  const ca=Math.cos(ang),sa=Math.sin(ang);
  const pr=v=>{const wx=v.f*ca-v.s*sa,wy=v.f*sa+v.s*ca;return{x:ax+(wx+wy)*IC*k,y:ay+((wy-wx)*IC*IK-v.z)*k,d:wy-wx};};
  const items=rig.parts.map((p,i)=>{
    if(p.t==='b'||p.t==='d'){const q=pr(p.c);return{p,q,d:q.d+(p.t==='d'?0.6:0),i};}
    if(p.t==='l'){const a=pr(p.a),b=pr(p.b);return{p,a,b,d:(a.d+b.d)/2,i};}
    const pts=p.pts.map(pr);return{p,pts,d:pts.reduce((s,q)=>s+q.d,0)/pts.length,i};});
  items.sort((x,y)=>x.d-y.d||x.i-y.i);
  g.lineCap='round';g.lineJoin='round';
  for(const it of items){const p=it.p;
    if(hi&&p.t==='b'){const r=p.r*k,x=it.q.x,y=it.q.y;g.fillStyle=tint(p.col,-0.38);g.beginPath();g.arc(x,y,r,0,TAU);g.fill();
      g.fillStyle=p.col;g.beginPath();g.arc(x-r*0.14,y-r*0.14,r*0.84,0,TAU);g.fill();
      if(p.hi&&r>3){g.fillStyle=tint(p.col,0.22);g.beginPath();g.arc(x-r*0.42,y-r*0.42,r*0.3,0,TAU);g.fill();}}
    else if(hi&&p.t==='l'){const w=p.r*2*k,ox=-w*0.13,oy=-w*0.13;const ln=(dx,dy,lw,col)=>{g.strokeStyle=col;g.lineWidth=lw;g.beginPath();g.moveTo(it.a.x+dx,it.a.y+dy);g.lineTo(it.b.x+dx,it.b.y+dy);g.stroke();};
      ln(0,0,w,tint(p.col,-0.38));ln(ox,oy,w*0.68,p.col);if(w>4)ln(ox*2.1,oy*2.1,w*0.2,tint(p.col,0.24));}
    else if(hi&&p.t==='d'){g.fillStyle=p.col;g.fillRect(Math.round(it.q.x-1),Math.round(it.q.y-1),Math.max(1,Math.round(k*1.6)),Math.max(1,Math.round(k*1.2)));}
    else if(p.t==='b'){const r=Math.max(0.7,p.r*k);g.fillStyle=p.col;g.beginPath();g.arc(it.q.x,it.q.y,r,0,TAU);g.fill();
      if(p.hi&&r>1.8){g.fillStyle=tint(p.col,0.3);g.beginPath();g.arc(it.q.x-r*0.35,it.q.y-r*0.35,r*0.45,0,TAU);g.fill();}}
    else if(p.t==='d'){g.fillStyle=p.col;g.fillRect(Math.round(it.q.x-0.5),Math.round(it.q.y-0.5),1,1);}
    else if(p.t==='l'){const w=Math.max(1.2,p.r*2*k);g.strokeStyle=p.col;g.lineWidth=w;g.beginPath();g.moveTo(it.a.x,it.a.y);g.lineTo(it.b.x,it.b.y);g.stroke();
      if(w>2.6){g.strokeStyle=tint(p.col,0.28);g.lineWidth=Math.max(1,w*0.3);g.beginPath();g.moveTo(it.a.x-w*0.2,it.a.y-w*0.2);g.lineTo(it.b.x-w*0.2,it.b.y-w*0.2);g.stroke();}}
    else{g.fillStyle=p.col;g.beginPath();it.pts.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fill();
      if(hi){g.strokeStyle=tint(p.col,-0.35);g.lineWidth=1;g.stroke();}
      if(p.edge){g.strokeStyle=p.edge;g.lineWidth=hi?Math.max(1,k*0.8):1;g.beginPath();it.pts.slice(1,-1).forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.stroke();}}
  }
  pixelize(c,outline||'#120d10');
  return{c,ax,ay,hi:!!hi};
}
// ---- rig helpers ----
function legsAt(R,o,hipZ,sp,swL,swR,knL,knR,th,sh,lr,cLeg,cBoot,bootR){
  for(const [s,sw,kn] of [[1,swR,knR],[-1,swL,knL]]){
    const hip=V(o,s*sp,hipZ),knee=V(o+Math.sin(sw)*th,s*sp,hipZ-Math.cos(sw)*th),a2=sw-kn;
    const foot=V(knee.f+Math.sin(a2)*sh,s*sp,Math.max(2,knee.z-Math.cos(a2)*sh));
    R.limb(hip,knee,lr,cLeg);R.limb(knee,foot,lr*0.88,cBoot);if(bootR)R.ball(V(foot.f+2,foot.s,foot.z),bootR,cBoot);}
}
function armAt(R,sh,hand,s,r,col){const m=lerpV(sh,hand,0.5),el=V(m.f-3,m.s+s*5,m.z-4);R.limb(sh,el,r,col);R.limb(el,hand,r*0.9,col);}
function perpOf(w,pref){let b=crossV(w,pref);if(lenV(b)<0.3)b=crossV(w,V(0,0,1));if(lenV(b)<0.3)b=crossV(w,V(1,0,0));return normV(b);}
function axeAt(R,hand,w){
  R.limb(addV(hand,w,-7),addV(hand,w,30),2.3,'#6b4a2b');
  let b=perpOf(w,V(0,1,0));if(b.z<0)b={f:-b.f,s:-b.s,z:-b.z};const E=addV(hand,w,22);
  R.poly([addV(E,w,-4),addV(addV(E,w,-7),b,11),addV(addV(E,w,1),b,16),addV(addV(E,w,9),b,11),addV(E,w,6)],'#c3ccd4','#f1f5f8');
}
function bladeAt(R,hand,w,len){
  R.limb(addV(hand,w,-5),addV(hand,w,4),2.2,'#4a3a2a');const p=perpOf(w,V(0,0,1));
  R.poly([addV(addV(hand,w,4),p,3),addV(hand,w,len||34),addV(addV(hand,w,4),p,-3)],'#d4dde9','#ffffff');
}
// ---- Cora: barbarian (procedural fallback until her sheet loads) ----
function rigAria(anim,ph,side){
  const R=mkRig();
  let bob=0,lean=0,o=0,swL=0,swR=0,knL=0,knR=0,tilt=0,hide=false;
  const H={1:V(8,18,40),[-1]:V(8,-18,40)},Wd={1:V(0.7,0.3,-0.6),[-1]:V(0.7,-0.3,-0.6)};
  switch(anim){
    case'idle':bob=Math.sin(ph*TAU)*1.3;H[1]=V(8,18,40+bob);H[-1]=V(8,-18,40+bob);break;
    case'walk':{const a=Math.sin(ph*TAU);swL=a*0.6;swR=-a*0.6;knL=Math.max(0,Math.cos(ph*TAU));knR=Math.max(0,-Math.cos(ph*TAU));bob=Math.abs(Math.sin(ph*TAU))*3;
      H[1]=V(8-a*10,18,41+bob);H[-1]=V(8+a*10,-18,41+bob);break;}
    case'attack':{const s=side;
      H[s]=kf([[0,V(8,s*18,40)],[0.4,V(-10,s*12,90)],[0.55,V(30,s*2,50)],[0.72,V(24,-s*10,34)],[1,V(8,s*18,40)]],ph);
      Wd[s]=kf([[0,V(0.7,s*0.3,-0.6)],[0.4,V(-0.6,s*0.1,0.8)],[0.55,V(0.9,-s*0.15,-0.35)],[0.72,V(0.4,-s*0.45,-0.8)],[1,V(0.7,s*0.3,-0.6)]],ph);
      H[-s]=kf([[0,V(8,-s*18,40)],[0.4,V(16,-s*16,54)],[1,V(8,-s*18,40)]],ph);
      lean=kf([[0,0],[0.4,-7],[0.55,9],[0.72,7],[1,0]],ph);o=kf([[0,0],[0.4,-4],[0.55,10],[0.75,7],[1,0]],ph);
      const st=kf([[0,0],[0.4,-0.25],[0.55,0.55],[1,0]],ph);if(s>0){swR=st;swL=-st*0.5;}else{swL=st;swR=-st*0.5;}break;}
    case'throw':H[1]=kf([[0,V(8,18,40)],[0.45,V(-14,16,88)],[0.6,V(30,10,62)],[1,V(14,18,44)]],ph);
      Wd[1]=kf([[0,V(0.7,0.3,-0.6)],[0.45,V(-0.4,0.1,0.9)],[0.6,V(1,0,0.1)],[1,V(0.7,0.3,-0.6)]],ph);
      hide=ph>0.58&&ph<0.95;lean=kf([[0,0],[0.45,-6],[0.6,9],[1,0]],ph);o=kf([[0,0],[0.6,6],[1,0]],ph);swR=kf([[0,0],[0.6,0.4],[1,0]],ph);break;
    case'roar':{const r=kf([[0,0],[0.3,1],[0.85,1],[1,0.6]],ph);H[1]=lerpV(V(8,18,40),V(2,30,82),r);H[-1]=lerpV(V(8,-18,40),V(2,-30,82),r);
      Wd[1]=V(0,0.3+0.2*r,1.6*r-0.6);Wd[-1]=V(0,-0.3-0.2*r,1.6*r-0.6);tilt=r;lean=-5*r;swL=0.25*r;swR=-0.25*r;break;}
    case'swing':{const a=kf([[0,-1.6],[0.4,-2.4],[0.6,1.5],[1,1.9]],ph);
      for(const s of [1,-1]){const aa=a+(s>0?0.35:-0.35);H[s]=V(Math.cos(aa)*28,Math.sin(aa)*28,54);Wd[s]=V(Math.cos(aa),Math.sin(aa),-0.1);}
      lean=kf([[0,0],[0.4,-3],[0.6,7],[1,2]],ph);o=kf([[0,0],[0.6,7],[1,2]],ph);swR=kf([[0,0],[0.6,0.4],[1,0.1]],ph);swL=-swR*0.6;break;}
    case'spin':H[1]=V(0,32,56);H[-1]=V(0,-32,56);Wd[1]=V(0.4,1,0.05);Wd[-1]=V(-0.4,-1,0.05);swL=0.35;swR=-0.35;break;
    case'leap':knL=1.5;knR=1.3;swL=0.7;swR=0.5;H[1]=V(-6,14,92);H[-1]=V(-6,-14,92);Wd[1]=V(-0.3,0.2,1);Wd[-1]=V(-0.3,-0.2,1);break;
  }
  const hipZ=40+bob*0.5;
  legsAt(R,o,hipZ,8,swL,swR,knL,knR,19,19,6.2,'#5a4030','#4a3426',5.5);
  const waist=V(o+lean*0.3,0,49+bob),chest=V(o+lean*0.65,0,61+bob);
  R.limb(V(o,0,hipZ+2),V(o+lean*0.2,0,45+bob),15,'#6e2e22');
  R.limb(V(o+lean*0.2,0,45+bob),waist,15.3,'#3a2a1e');
  R.limb(waist,chest,13.5,'#d9a27c');
  R.limb(V(chest.f+9,9,59+bob),V(waist.f+10,-9,47+bob),2.2,'#3a2a1e');
  R.ball(V(waist.f+13,0,46+bob),3.2,'#c9a85a');
  const S={1:V(chest.f,14,61+bob),[-1]:V(chest.f,-14,61+bob)};
  R.ball(V(chest.f-3,0,64+bob),10,'#a3825e');R.ball(V(chest.f,12,63+bob),8.5,'#8a6a4a');R.ball(V(chest.f,-12,63+bob),8.5,'#8a6a4a');
  for(const s of [1,-1]){armAt(R,S[s],H[s],s,4.8,'#d9a27c');R.ball(H[s],3.6,'#3a2a1e',false);if(!(hide&&s===1))axeAt(R,H[s],normV(Wd[s]));}
  const hc=V(chest.f+1-tilt*3,0,74+bob+tilt*2);
  R.ball(V(hc.f-3,0,hc.z+1.5),10.5,'#c8562e');R.ball(hc,8.8,'#d9a27c');
  for(let i=0;i<3;i++)R.ball(V(hc.f-10-i*2,0,hc.z-5-i*6),4-i*0.5,'#a8441f');
  R.dot(addV(addV(hc,V(1,0,0),8.6),V(0,1,0),3.3),'#1e1410');R.dot(addV(addV(hc,V(1,0,0),8.6),V(0,1,0),-3.3),'#1e1410');
  R.dot(addV(addV(hc,V(1,0,0),8.4),V(0,0,-1),3.6),'#b82a2a');
  return R;
}
// ---- Shade: hooded assassin, human proportions (~7 heads), modeled on the reference sheet ----
function rigShade(anim,ph,side){
  const R=mkRig();
  const C={hood:'#1f1c23',hood2:'#2b2731',face:'#0e0c10',skin:'#c4916f',beard:'#3a2a22',leather:'#2e282c',strap:'#5c3b26',belt:'#4a2f1f',
    sash:'#7a2029',sash2:'#53151d',pants:'#26222a',wrap:'#3a3238',boot:'#2f2622',glove:'#1d1a1e',steel:'#c9d1d9',eye:'#e9dfcf'};
  let o=0,lean=2,twist=0,swL=0.04,swR=-0.04,knL=0.12,knR=0.12,drag=0,flap=0;
  const H={1:V(5,13,0),[-1]:V(5,-13,0)},Wd={1:V(0.75,0.25,-0.6),[-1]:V(0.75,-0.25,-0.6)};
  let handZ={1:-4,[-1]:-4};// hand heights are relative to the shoulder line, so crouches carry the arms down
  switch(anim){
    case'idle':{const b=Math.sin(ph*TAU);handZ[1]=handZ[-1]=-30+b*0.8;knL=knR=0.16;flap=b*0.4;break;}
    case'walk':{const a=ph*TAU,s1=Math.sin(a);
      swR=0.6*s1;swL=-0.6*s1;
      knR=0.1+1.25*Math.pow(Math.max(0,Math.cos(a)),1.5);knL=0.1+1.25*Math.pow(Math.max(0,-Math.cos(a)),1.5);
      H[1]=V(5-s1*13,13,0);H[-1]=V(5+s1*13,-13,0);handZ[1]=-30+Math.max(0,-s1)*5;handZ[-1]=-30+Math.max(0,s1)*5;
      Wd[1]=V(0.75-s1*0.35,0.25,-0.6);Wd[-1]=V(0.75+s1*0.35,-0.25,-0.6);
      twist=-s1*0.14;lean=5;drag=2+Math.abs(Math.cos(a))*2;flap=Math.sin(a*2);break;}
    case'attack':{const s=side;
      const hk=kf([[0,V(5,s*13,-30)],[0.4,V(-8,s*17,4)],[0.55,V(36,s*3,-10)],[0.72,V(28,-s*7,-20)],[1,V(5,s*13,-30)]],ph);
      H[s]=V(hk.f,hk.s,0);handZ[s]=hk.z;
      Wd[s]=kf([[0,V(0.75,s*0.25,-0.6)],[0.4,V(0.1,s*0.6,0.8)],[0.55,V(1,-s*0.15,-0.05)],[0.72,V(0.8,-s*0.45,-0.35)],[1,V(0.75,s*0.25,-0.6)]],ph);
      const ok=kf([[0,V(5,-s*13,-30)],[0.4,V(16,-s*9,-14)],[1,V(5,-s*13,-30)]],ph);H[-s]=V(ok.f,ok.s,0);handZ[-s]=ok.z;
      lean=kf([[0,2],[0.4,-6],[0.55,15],[0.72,11],[1,2]],ph);o=kf([[0,0],[0.4,-5],[0.55,15],[0.75,10],[1,0]],ph);
      twist=kf([[0,0],[0.4,-0.4*s],[0.55,0.35*s],[1,0]],ph);
      const st=kf([[0,0],[0.4,-0.2],[0.55,0.6],[1,0]],ph);if(s>0){swR=st;swL=-st*0.55;}else{swL=st;swR=-st*0.55;}
      knL=knR=kf([[0,0.15],[0.55,0.5],[1,0.15]],ph);drag=kf([[0,0],[0.55,6],[1,0]],ph);break;}
    case'throw':{const hk=kf([[0,V(5,13,-30)],[0.45,V(-12,15,10)],[0.6,V(34,8,-4)],[1,V(10,13,-28)]],ph);H[1]=V(hk.f,hk.s,0);handZ[1]=hk.z;handZ[-1]=-26;H[-1]=V(10,-12,0);
      Wd[1]=kf([[0,V(0.75,0.25,-0.6)],[0.45,V(-0.3,0.3,0.9)],[0.6,V(1,0,0)],[1,V(0.75,0.25,-0.6)]],ph);
      lean=kf([[0,2],[0.45,-6],[0.6,13],[1,2]],ph);o=kf([[0,0],[0.6,9],[1,0]],ph);twist=kf([[0,0],[0.45,-0.45],[0.6,0.4],[1,0]],ph);
      swR=kf([[0,0],[0.6,0.5],[1,0]],ph);swL=-swR*0.5;knL=knR=0.25;drag=kf([[0,0],[0.6,5],[1,0]],ph);break;}
    case'swing':{const a=kf([[0,-0.8],[0.35,-1.6],[0.75,4.4],[1,4.7]],ph),cr=kf([[0,0.2],[0.35,0.95],[0.75,0.95],[1,0.3]],ph);
      knL=knR=cr;swL=0.4*cr;swR=-0.3*cr;twist=a*0.12;lean=8*cr;flap=Math.sin(a);
      for(const s of [1,-1]){const aa=a+(s>0?0:PI);H[s]=V(Math.cos(aa)*34,Math.sin(aa)*34,0);handZ[s]=-14;Wd[s]=V(Math.cos(aa),Math.sin(aa),0);}break;}
    case'roar':{const r=kf([[0,0],[0.4,1],[1,1]],ph);knL=knR=0.2+1.1*r;swL=swR=0.5*r;lean=12*r;
      H[1]=lerpV(V(5,13,0),V(14,-5,0),r);H[-1]=lerpV(V(5,-13,0),V(14,5,0),r);handZ[1]=handZ[-1]=-30+20*r;
      Wd[1]=V(0.3,-0.6,0.75);Wd[-1]=V(0.3,0.6,0.75);break;}
  }
  // legs: solve hip height so the lowest foot rests on the ground
  const TH=23,SH=22,SP=7.2;
  const leg=(sw,kn)=>{const kz=-Math.cos(sw)*TH,kx=Math.sin(sw)*TH,a2=sw-kn;return{kz,kx,fz:kz-Math.cos(a2)*SH,fx:kx+Math.sin(a2)*SH,a2};};
  const lg={1:leg(swR,knR),[-1]:leg(swL,knL)};
  const hipZ=Math.max(-lg[1].fz,-lg[-1].fz)+3;
  for(const s of [1,-1]){const L=lg[s],hip=V(o,s*SP,hipZ),knee=V(o+L.kx,s*SP,hipZ+L.kz),ank=V(o+L.fx,s*SP,hipZ+L.fz);
    R.limb(hip,knee,6.6,C.pants);R.limb(knee,ank,5.4,C.pants);R.ball(knee,5.6,C.wrap);
    R.limb(lerpV(ank,knee,0.4),ank,6,C.boot);
    const lift=ank.z>5?Math.min(0.8,(ank.z-5)*0.05):0;R.limb(ank,V(ank.f+Math.cos(lift)*9,ank.s,ank.z-Math.sin(lift)*9+1),4.6,C.boot);}
  // torso with a little counter-twist at the shoulders
  const waist=V(o+lean*0.3,0,hipZ+11),chest=V(o+lean*0.7,0,hipZ+23),shZ=hipZ+28;
  const sh={};for(const s of [1,-1])sh[s]=V(chest.f-s*14*Math.sin(twist),s*14*Math.cos(twist),shZ);
  // back cape panel (behind the body)
  R.poly([V(chest.f-10,-13,shZ-1),V(chest.f-10,13,shZ-1),V(chest.f-14-drag,14,hipZ+6+flap),V(chest.f-14-drag,-14,hipZ+6-flap)],C.hood);
  R.limb(V(o,0,hipZ+2),waist,11,C.leather);
  R.limb(waist,chest,12.6,C.leather);
  R.limb(V(waist.f,0,hipZ+8),V(waist.f,0,hipZ+11),11.7,C.belt);R.ball(V(waist.f+11.3,0,hipZ+9.5),2.4,'#a98a52');
  // crossed straps, front and back
  for(const fb of [1,-1])for(const s of [1,-1])R.limb(V(chest.f+fb*11.6,s*10,shZ-2),V(waist.f+fb*11.2,-s*9,hipZ+12),1.7,C.strap);
  // shuriken on the belt
  const star=(c,r)=>{const pts=[];for(let i=0;i<8;i++){const a=i/8*TAU,rr=i%2?r*0.38:r;pts.push(V(c.f,c.s+Math.cos(a)*rr,c.z+Math.sin(a)*rr));}R.poly(pts,'#b9c2c9','#eef2f5');};
  star(V(waist.f+11.8,-6,hipZ+7),4.6);star(V(waist.f-11.8,5,hipZ+7),4.2);
  // tattered sash strips hanging from the belt
  [[0.5,C.sash],[-0.4,C.sash2],[2.6,C.sash],[3.5,C.sash2],[PI,C.sash]].forEach(([a,col],i)=>{
    const r=11.8,c0=V(waist.f+Math.cos(a)*r,Math.sin(a)*r,hipZ+8),tg=V(-Math.sin(a)*2.4,Math.cos(a)*2.4,0);
    const len=15+(i%2)*5,bot=V(c0.f-drag*0.8+Math.cos(a)*2,c0.s+flap*1.5*(i%2?1:-1),c0.z-len);
    R.poly([addV(c0,tg,1),addV(c0,tg,-1),addV(bot,tg,-0.6),V(bot.f,bot.s,bot.z-3),addV(bot,tg,0.6)],col);});
  // arms
  for(const s of [1,-1]){
    const hand=V(H[s].f+o*0.6,H[s].s,shZ+handZ[s]);const m=lerpV(sh[s],hand,0.5),el=V(m.f-4,m.s+s*4,m.z-5);
    R.ball(sh[s],7.4,C.hood2);R.limb(sh[s],el,4.8,C.leather);R.limb(el,hand,4.1,C.skin);R.limb(lerpV(el,hand,0.5),hand,4.7,C.glove);R.ball(hand,4.3,C.glove);
    // curved claw blade
    const w=normV(Wd[s]),p=perpOf(w,V(0,0,1)),outer=[],inner=[];
    for(let i=0;i<=5;i++){const t=i/5;outer.push(addV(addV(hand,w,3+29*t),p,s*(6*t*t+3.4*(1-t))));inner.push(addV(addV(hand,w,3+27*t),p,s*(6*t*t)));}
    R.poly([...outer,...inner.reverse()],C.steel,'#f4f7fa');}
  // cowl, hood and face
  R.ball(V(chest.f+0.5,0,shZ+3),10,C.hood2);
  const hc=V(chest.f+2,0,shZ+12);
  R.ball(V(hc.f-3,0,hc.z+1.5),9.6,C.hood);R.ball(hc,9.4,C.hood);
  R.poly([V(hc.f-5,-7,hc.z+5),V(hc.f-10,0,hc.z+12),V(hc.f-5,7,hc.z+5)],C.hood);
  R.ball(V(hc.f+4.8,0,hc.z-1),5.8,C.face,false);R.ball(V(hc.f+6.4,0,hc.z-4),3.3,C.skin,false);R.ball(V(hc.f+6.8,0,hc.z-6.4),2.7,C.beard,false);
  R.dot(V(hc.f+9.3,2.5,hc.z+0.3),C.eye);R.dot(V(hc.f+9.3,-2.5,hc.z+0.3),C.eye);
  return R;
}
// ---- minions ----
function rigMinion(type,team,anim,ph){
  const R=mkRig(),c=TEAMC[team],dk=TEAMD[team],lt=TEAML[team];
  let bob=0,o=0,swL=0,swR=0,knL=0,knR=0,lean=0;
  const sc=type==='super'?1.6:1;
  let H1=V(6,11,24),H2=V(6,-11,24),W1=V(0.8,0.1,-0.5);
  if(anim==='walk'){const a=Math.sin(ph*TAU);swL=a*0.6;swR=-a*0.6;knL=Math.max(0,Math.cos(ph*TAU))*0.9;knR=Math.max(0,-Math.cos(ph*TAU))*0.9;bob=Math.abs(Math.sin(ph*TAU))*2;H1=V(6-a*6,11,25+bob);H2=V(6+a*6,-11,25+bob);}
  else if(anim==='idle'){bob=Math.sin(ph*TAU);}
  else if(anim==='attack'){
    if(type==='caster'){H1=kf([[0,V(6,11,26)],[0.45,V(-4,12,34)],[0.55,V(20,6,30)],[1,V(6,11,26)]],ph);W1=kf([[0,V(0.2,0,1)],[0.45,V(-0.3,0,1)],[0.55,V(0.8,0,0.6)],[1,V(0.2,0,1)]],ph);o=kf([[0,0],[0.55,4],[1,0]],ph);}
    else{H1=kf([[0,V(6,11,24)],[0.4,V(-4,8,48)],[0.55,V(20,2,26)],[0.75,V(16,-4,18)],[1,V(6,11,24)]],ph);W1=kf([[0,V(0.8,0.1,-0.5)],[0.4,V(-0.5,0,0.85)],[0.55,V(0.9,-0.1,-0.4)],[0.75,V(0.4,-0.3,-0.85)],[1,V(0.8,0.1,-0.5)]],ph);
      if(type==='super')H2=lerpV(H1,V(H1.f,H1.s-12,H1.z),1);lean=kf([[0,0],[0.4,-4],[0.55,6],[1,0]],ph);o=kf([[0,0],[0.4,-2],[0.55,6],[1,0]],ph);}
  }
  const S=(v)=>V(v.f*sc,v.s*sc,v.z*sc);
  if(type==='caster'){
    const hip=26*sc;legsAt(R,o,hip-8,5,swL*0.5,swR*0.5,knL*0.5,knR*0.5,9,9,3.5,'#1b1f22','#1b1f22',0);
    R.poly([V(o-9,-9,4),V(o-9,9,4),V(o+9,9,4),V(o+9,-9,4),V(o+lean*0.5,0,34+bob)],dk);
    R.limb(V(o,0,18+bob),V(o+lean*0.5,0,30+bob),8,dk);
    const sh={1:V(o,8,30+bob),[-1]:V(o,-8,30+bob)};armAt(R,sh[1],H1,1,2.6,dk);armAt(R,sh[-1],H2,-1,2.6,dk);
    const w=normV(W1);R.limb(addV(H1,w,-16),addV(H1,w,20),1.8,'#8a6b45');R.ball(addV(H1,w,23),4,lt);
    const hc=V(o+1,0,40+bob);R.ball(hc,7,c);R.poly([V(hc.f-3,-6,hc.z+1),V(hc.f-5,0,hc.z+11),V(hc.f-3,6,hc.z+1)],dk);
    R.dot(addV(addV(hc,V(1,0,0),6.5),V(0,1,0),2.3),lt);R.dot(addV(addV(hc,V(1,0,0),6.5),V(0,1,0),-2.3),lt);
  }else{
    const hipZ=(type==='super'?26:15)+bob*0.4;
    legsAt(R,o,hipZ,(type==='super'?10:5),swL,swR,knL,knR,hipZ*0.52,hipZ*0.5,type==='super'?7:3.6,'#1b1f22','#2a2f33',type==='super'?6:3);
    const chest=V(o+lean*0.6,0,hipZ+(type==='super'?28:15)+bob);
    R.limb(V(o,0,hipZ+1),chest,type==='super'?19:8.5,dk);
    R.limb(V(chest.f+1,0,chest.z-(type==='super'?14:7)),V(chest.f+1,0,chest.z-(type==='super'?6:3)),type==='super'?19.5:9,c);
    const sw=type==='super'?18:9;const sh={1:V(chest.f,sw,chest.z),[-1]:V(chest.f,-sw,chest.z)};
    if(type==='super'){for(const s of [1,-1]){R.ball(sh[s],9,c);R.poly([V(sh[s].f-3,sh[s].s,sh[s].z+6),V(sh[s].f,sh[s].s*1.25,sh[s].z+20),V(sh[s].f+3,sh[s].s,sh[s].z+6)],lt);}}
    const h1=type==='super'?S(H1):H1,h2=type==='super'?S(H2):H2;
    armAt(R,sh[1],h1,1,type==='super'?5.5:2.8,dk);armAt(R,sh[-1],h2,-1,type==='super'?5.5:2.8,dk);
    const w=normV(W1);
    if(type==='super'){R.limb(addV(h1,w,-8),addV(h1,w,34),2.8,'#6b5a44');R.ball(addV(h1,w,38),9,'#9aa3aa');for(const d2 of [V(0,0,1),V(0,1,0),V(0,-1,0),V(1,0,0)])R.ball(addV(addV(h1,w,38),d2,9),3,'#d8dde1',false);}
    else{R.limb(addV(h1,w,-3),addV(h1,w,4),1.8,'#4a3a2a');R.poly([addV(addV(h1,w,4),perpOf(w,V(0,0,1)),2.2),addV(h1,w,22),addV(addV(h1,w,4),perpOf(w,V(0,0,1)),-2.2)],'#cfd6dc','#ffffff');
      R.ball(addV(h2,V(1,0,0),3),6.5,c);R.ball(addV(h2,V(1,0,0),4),2.4,lt,false);}
    const hc=V(chest.f+1,0,chest.z+(type==='super'?14:8));R.ball(hc,type==='super'?11:6.5,c);
    if(type==='super'){R.dot(addV(addV(hc,V(1,0,0),10.5),V(0,1,0),3.5),lt);R.dot(addV(addV(hc,V(1,0,0),10.5),V(0,1,0),-3.5),lt);}
    else{R.limb(addV(hc,V(1,0,0),5.5),addV(addV(hc,V(1,0,0),5.5),V(0,0,1),0.1),2.2,'#0d1114');}
  }
  return R;
}
const ANIM_N={idle:4,walk:8,attack:10,throw:8,swing:8,roar:6,spin:1,leap:1};
const CHAMP_BOX={l:100,r:100,u:150,d:50},MIN_BOX={l:60,r:60,u:90,d:35},SUPER_BOX={l:95,r:95,u:150,d:50};
function dirIdx(a,n){return((Math.round(a/(TAU/n))%n)+n)%n;}
function champPose(u){
  if(u.spin)return{anim:'spin',ph:0,dir:Math.floor(G.t*28)%DIRS};
  if(u.dash&&u.dash.leap)return{anim:'leap',ph:0};
  const ca=u.castAnim;if(ca&&G.t-ca.start<ca.W+0.3){const e=G.t-ca.start;return{anim:ca.kind,ph:e<ca.W?0.55*e/ca.W:Math.min(0.999,0.55+0.45*(e-ca.W)/0.3)};}
  const at=u.atk;if(at&&G.t-at.start<at.W+0.28){const e=G.t-at.start;return{anim:'attack',ph:e<at.W?0.55*e/at.W:Math.min(0.999,0.55+0.45*(e-at.W)/0.28),side:at.side};}
  if(hyp(u.vx,u.vy)>30)return{anim:'walk',ph:((u.walkD||0)/(u.key==='shade'?115:120))%1};
  return{anim:'idle',ph:(G.t*0.7)%1};
}
function champSprite(u,pose){
  if(u.key==='shade'&&SHEETS_READY)return shadeFrame(u);
  if(u.key==='cora'&&CORA_READY)return coraFrame(u);
  if(u.key==='viktor'&&VIK_READY)return viktorFrame(u);
  if(u.key==='blackjack'&&BJ_READY)return bjFrame(u);
  pose=pose||champPose(u);const hi=u.key==='shade',N=hi&&pose.anim==='walk'?10:ANIM_N[pose.anim]||1,fr=Math.min(N-1,Math.floor(pose.ph*N)),d=pose.dir!==undefined?pose.dir:dirIdx(u.facing,DIRS),sd=pose.side||1;
  const key=`${u.key}|${pose.anim}|${sd}|${d}|${fr}`;let s=SPR.get(key);
  if(!s){const rf=u.key==='cora'?rigAria:rigShade;s=hi?bake(rf(pose.anim,(fr+0.5)/N,sd),d*TAU/DIRS,SCALE*DPR,CHAMP_BOX,'#0a0809',true):bake(rf(pose.anim,(fr+0.5)/N,sd),d*TAU/DIRS,ART_K,CHAMP_BOX);SPR.set(key,s);}
  return s;
}
function minionPose(m){
  if(m.engaged&&m.lastAtk!==undefined){const e=G.t-m.lastAtk;if(e<0.25)return{anim:'attack',ph:0.55+0.45*e/0.25};if(m.atkCd<0.35)return{anim:'attack',ph:0.55*(1-m.atkCd/0.35)};}
  if(m.moving)return{anim:'walk',ph:((m.walkD||0)/80)%1};
  return{anim:'idle',ph:(G.t*0.6+m.id*0.13)%1};
}
function minionSprite(m){
  const pose=minionPose(m),N=pose.anim==='attack'?6:pose.anim==='walk'?6:2,fr=Math.min(N-1,Math.floor(pose.ph*N)),d=dirIdx(m.facing,MDIRS);
  const key=`m|${m.mtype}|${m.team}|${pose.anim}|${d}|${fr}`;let s=SPR.get(key);
  if(!s){s=bake(rigMinion(m.mtype,m.team,pose.anim,(fr+0.5)/N),d*TAU/MDIRS,ART_K,m.mtype==='super'?SUPER_BOX:MIN_BOX);SPR.set(key,s);}
  return s;
}
function towerSprite(team,alive){
  const key=`t|${team}|${alive}`;let s=SPR.get(key);if(s)return s;
  const k=ART_K,box={l:110,r:110,u:200,d:70};const cw=Math.ceil(220*k)+4,ch=Math.ceil(270*k)+4,ax=Math.round(110*k)+2,ay=Math.round(200*k)+2;
  const c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d');g.translate(ax,ay);g.scale(k,k);
  if(!alive){g.fillStyle='#2d3332';g.beginPath();g.ellipse(0,0,96,96*IK,0,0,TAU);g.fill();
    for(let i=0;i<11;i++){const a=i*0.9,r=20+(i*23)%60;g.fillStyle=i%2?'#4a5150':'#3a403f';g.beginPath();g.ellipse(Math.cos(a)*r,Math.sin(a)*r*IK-8,14+(i%3)*7,10+(i%3)*5,0,0,TAU);g.fill();}}
  else{
    g.fillStyle='#2f3534';g.beginPath();g.ellipse(0,0,92,92*IK,0,0,TAU);g.fill();g.fillRect(-92,-14,184,14);
    g.fillStyle='#4f5756';g.beginPath();g.ellipse(0,-14,92,92*IK,0,0,TAU);g.fill();
    g.fillStyle='#5d6665';g.beginPath();g.ellipse(-20,-22,50,50*IK,0,0,TAU);g.fill();
    g.strokeStyle=TEAMD[team];g.lineWidth=7;g.beginPath();g.ellipse(0,-14,66,66*IK,0,0,TAU);g.stroke();
    g.fillStyle='#3a4140';g.beginPath();g.moveTo(-36,-16);g.lineTo(36,-16);g.lineTo(25,-176);g.lineTo(-25,-176);g.closePath();g.fill();
    g.fillStyle='#6a7372';g.beginPath();g.moveTo(-10,-16);g.lineTo(20,-16);g.lineTo(14,-176);g.lineTo(-6,-176);g.closePath();g.fill();
    g.fillStyle='#2a302f';for(let y=-40;y>-170;y-=26)g.fillRect(-34+(-y-16)*0.07,y,68-(-y-16)*0.14,3);
    g.fillStyle=TEAMD[team];g.fillRect(-33,-64,66,10);g.fillRect(-28,-142,56,8);
    g.fillStyle=TEAMC[team];g.fillRect(-5,-130,10,60);
    g.fillStyle='#5d6564';g.beginPath();g.ellipse(0,-176,30,30*IK,0,0,TAU);g.fill();
    g.fillStyle='#7c8584';g.beginPath();g.ellipse(-6,-179,16,16*IK,0,0,TAU);g.fill();
  }
  pixelize(c,'#0d1112');s={c,ax,ay};SPR.set(key,s);return s;
}
function blit(s,x,y,alpha,flash){
  const ps=s.hi?(ctx===mctx?1:1/PXd):(ctx===mctx?PXd:1),bx=s.hi?Math.round(x*RS-s.ax*ps):(Math.round(x*RS/ps)-s.ax)*ps,by=s.hi?Math.round(y*RS-s.ay*ps):(Math.round(y*RS/ps)-s.ay)*ps,w=s.c.width*ps,h=s.c.height*ps;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha;ctx.drawImage(s.c,bx,by,w,h);
  if(flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,flash);ctx.drawImage(s.c,bx,by,w,h);ctx.drawImage(s.c,bx,by,w,h);}
  ctx.restore();
}
function kickOffset(u){if(!u.kick||G.t>u.kick.until)return[0,0];const f=(u.kick.until-G.t)/0.14,a=projAng(u.kick.ang);return[Math.cos(a)*5*f,Math.sin(a)*5*f];}
function drawAny(s,x,y,alpha,flash){if(s.sheet||s.S)drawSheet(s,x,y,alpha,flash);else blit(s,x,y,alpha,flash);}
// ---- Shade: hand-drawn sheets (8 directions x 6 frames each), aligned on a shared foot anchor ----
// Rows run clockwise on screen from facing the camera: S, SW, W, NW, N, NE, E, SE.
const SHADE_H=98,WALK_STRIDE=150;
const SHEETS={"walk":{cw:257,ch:162,ax:129,ay:147,h:139.5,img:null},"auto":{cw:252,ch:158,ax:126,ay:119,h:114.3,img:null},"q":{cw:271,ch:145,ax:134,ay:117,h:114.3,img:null},"rmb":{cw:256,ch:136,ax:120,ay:115,h:114.3,img:null},"e":{cw:270,ch:163,ax:132,ay:124,h:114.3,img:null},"r":{cw:148,ch:121,ax:75,ay:106,h:75,img:null}};
let SHEETS_READY=false;
(function(){let left=0;for(const [k,s] of Object.entries(SHEETS)){left++;const im=new Image();im.onload=()=>{s.img=im;if(--left===0){SHEETS_READY=true;onSheetsReady();}};im.src='assets/shade_'+k+'.webp';}})();
function onSheetsReady(){const cards=document.querySelectorAll('#cards canvas');if(cards[1])drawPortrait(cards[1],'shade',BLUE);if(G&&G.player.key==='shade')drawPortrait($('portC'),'shade',G.player.team);}
function shadeFrame(u){
  const fa=projAng(u.facing),row=((Math.round((fa-PI/2)/(PI/4))%8)+8)%8;
  if(u.dash&&u.dash.kind==='R'){const t=G.t-(u.rStart||0);return{sheet:'r',row,col:t<0.06?0:u.rCutAt>=u.rStart?2:1};}
  if(u.dash&&u.dash.kind==='E')return{sheet:'e',row,col:2};
  const ca=u.castAnim;
  if(ca){const t=G.t-ca.start,W=ca.W;
    if(ca.kind==='q'&&t<W+0.3)return{sheet:'q',row,col:t<W?(t<W*0.35?0:t<W*0.7?1:2):(t-W<0.1?3:t-W<0.2?4:5)};
    if(ca.kind==='rmb'&&t<W+0.3)return{sheet:'rmb',row,col:t<W?(t<W*0.5?1:2):(t-W<0.15?3:5)};
    if(ca.kind==='eArrive'&&t<0.3)return{sheet:'e',row,col:t<0.1?3:t<0.2?4:5};
    if(ca.kind==='rCut'&&t<W+0.46)return{sheet:'r',row,col:t<W?2:t-W<0.18?3:t-W<0.32?4:5};
  }
  const at=u.atk;
  if(at&&G.t-at.start<at.W+0.28){const t=G.t-at.start,W=at.W;
    if(at.cross)return{sheet:'auto',row,col:t<W?(t<W*0.5?1:2):(t-W<0.1?3:t-W<0.2?4:5)};
    return{sheet:'auto',row,col:t<W?(t<W*0.5?0:1):(t-W<0.14?2:5)};}
  if(hyp(u.vx,u.vy)>30)return{sheet:'walk',row,col:Math.floor(((u.walkD||0)/WALK_STRIDE)%1*6)};
  return{sheet:'auto',row,col:0};
}
// ---- Cora (Coralisse): hand-drawn walk sheet, 8 directions x 6 frames, aligned on a shared foot anchor ----
// Her sheet had no back-right view; that row is the back-left row mirrored with the axe colours swapped back.
// Basic attacks use her attack sheet (stance, wind-up, swing, strike, follow-through, recover; the bronze axe swings).
// Abilities animate the walk frames (lunge, lean, squash) until ability sheets exist.
const CORA_H=104,CORA_STRIDE=165;
const CORA_SHEET={cw:176,ch:164,ax:90,ay:147,h:123.6,img:null};
const CORA_AUTO={cw:191,ch:130,ax:99,ay:112,h:91.4,img:null};
let CORA_READY=false;
(function(){const im=new Image();im.onload=()=>{CORA_AUTO.img=im;};im.src='assets/cora_auto.webp';})();
(function(){const im=new Image();im.onload=()=>{CORA_SHEET.img=im;CORA_READY=true;const cards=document.querySelectorAll('#cards canvas');if(cards[0])drawPortrait(cards[0],'cora',BLUE);if(G&&G.player.key==='cora')drawPortrait($('portC'),'cora',G.player.team);};im.src='assets/cora_walk.webp';})();
function coraFrame(u){
  const fa=projAng(u.facing),fr={S:CORA_SHEET,H:CORA_H,row:((Math.round((fa-PI/2)/(PI/4))%8)+8)%8,col:0,ox:0,oy:0,rot:0,sx:1,sy:1,corr:u.def.resource==='Corruption'?u.res:0};
  const lunge=(b,d)=>{fr.ox=Math.cos(fa)*b*d;fr.oy=Math.sin(fa)*b*d*0.7;fr.rot=b*0.13*(Math.cos(fa)>=0?1:-1);fr.sy=1-Math.max(0,-b)*0.06;fr.sx=1+Math.max(0,-b)*0.03;};
  if(u.spin){fr.row=Math.floor(G.t*26)%8;fr.col=Math.floor(G.t*12)%6;fr.sy=0.96;return fr;}
  if(u.dash&&(u.dash.kind==='E'||u.dash.kind==='R')){lunge(1,10);fr.col=2;return fr;}
  if(u.dash&&u.dash.leap){const p=1-u.dash.t/u.dash.total;fr.col=2;fr.rot=(p-0.5)*0.25*(Math.cos(fa)>=0?1:-1);fr.sy=p<0.15||p>0.85?0.92:1.04;return fr;}
  const ca=u.castAnim;
  if(ca&&G.t-ca.start<ca.W+0.3){const t=G.t-ca.start,W=Math.max(ca.W,0.001),p=t<W?0.55*t/W:0.55+0.45*Math.min(1,(t-W)/0.3);
    if(ca.kind==='roar'){const r=kf([[0,0],[0.25,1],[0.8,1],[1,0]],p);fr.sy=1+0.09*r;fr.sx=1+0.05*r;fr.oy=-5*r;}
    else if(ca.kind==='slam'){const b=kf([[0,0],[0.45,-0.9],[0.55,0.9],[0.8,0.6],[1,0]],p);lunge(b,8);fr.sy=1-Math.max(0,b)*0.12;fr.sx=1+Math.max(0,b)*0.07;}
    else lunge(kf([[0,0],[0.4,-1],[0.55,1.2],[0.75,0.8],[1,0]],p),ca.kind==='swing'?18:13);
    return fr;}
  const at=u.atk;
  if(at&&G.t-at.start<at.W+0.28){const t=G.t-at.start,W=at.W,p=t<W?0.55*t/W:0.55+0.45*Math.min(1,(t-W)/0.28);
    if(CORA_AUTO.img){fr.S=CORA_AUTO;const e=t-W;fr.col=t<W?(t<W*0.25?0:t<W*0.7?1:2):(e<0.1?3:e<0.19?4:5);
      lunge(kf([[0,0],[0.4,-0.3],[0.55,0.5],[0.75,0.3],[1,0]],p),8);return fr;}
    lunge(kf([[0,0],[0.4,-1],[0.55,1.2],[0.75,0.8],[1,0]],p),15);fr.col=p<0.55?0:3;return fr;}
  if(hyp(u.vx,u.vy)>30){fr.col=Math.floor(((u.walkD||0)/CORA_STRIDE)%1*6);return fr;}
  fr.sy=1+Math.sin(G.t*2.2)*0.012;return fr;
}
// Corruption stages drawn onto the base-form frame: faint violet veins, then organic armor, then the mask at 100.
const corrC=document.createElement('canvas'),corrG=corrC.getContext('2d');
function corruptedCell(fr,S){
  const st=Math.min(5,Math.floor(fr.corr/20)),g=corrG;
  if(corrC.width!==S.cw||corrC.height!==S.ch){corrC.width=S.cw;corrC.height=S.ch;}
  g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,S.cw,S.ch);
  g.drawImage(S.img,fr.col*S.cw,fr.row*S.ch,S.cw,S.ch,0,0,S.cw,S.ch);
  g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(110,30,190,${0.05*st})`;g.fillRect(0,0,S.cw,S.ch);
  const R=mulberry(fr.row*97+fr.col*13+7);g.lineCap='round';
  for(let i=0;i<st*5;i++){let x=S.ax+(R()-0.5)*60,y=S.ay-R()*S.h*0.85;g.strokeStyle=R()<0.5?'#b46bff':'#7a2bd6';g.lineWidth=1+R()*(st>=3?1.6:0.8);g.globalAlpha=0.55+0.08*st;
    g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){x+=(R()-0.5)*16;y+=(R()-0.5)*16;g.lineTo(x,y);}g.stroke();}
  if(st>=3){g.globalAlpha=0.3+0.12*(st-3);g.fillStyle='#3b1460';for(let i=0;i<st*3;i++){g.beginPath();g.ellipse(S.ax+(R()-0.5)*44,S.ay-S.h*(0.25+R()*0.5),3+R()*6,2+R()*4,R()*3,0,TAU);g.fill();}}
  if(fr.corr>=100){const face={0:0,1:-5,2:-10,6:10,7:5}[fr.row];
    if(face!==undefined){const fx=S.ax+face,fy=S.ay-S.h*0.86;g.globalAlpha=0.92;g.fillStyle='#4a1670';g.beginPath();g.ellipse(fx,fy,8,7,0,0,TAU);g.fill();
      g.strokeStyle='#c27bff';g.lineWidth=1.2;g.beginPath();g.moveTo(fx-9,fy-2);g.quadraticCurveTo(fx,fy-12,fx+9,fy-2);g.stroke();g.fillStyle='#f0d6ff';g.fillRect(fx-4,fy-1,2,1.5);g.fillRect(fx+2,fy-1,2,1.5);}}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';return corrC;
}
function drawSheet(fr,x,y,alpha,flash){
  const S=fr.S||SHEETS[fr.sheet],k=SCALE*(fr.H||SHADE_H)/S.h*RS;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.translate(Math.round((x+(fr.ox||0)*SCALE)*RS),Math.round((y+(fr.oy||0)*SCALE)*RS));if(fr.rot)ctx.rotate(fr.rot);ctx.scale(k*(fr.sx||1),k*(fr.sy||1));ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const cc=fr.corr>=20?corruptedCell(fr,S):null;
  const draw=()=>cc?ctx.drawImage(cc,0,0,S.cw,S.ch,-S.ax,-S.ay,S.cw,S.ch):ctx.drawImage(S.img,fr.col*S.cw,fr.row*S.ch,S.cw,S.ch,-S.ax,-S.ay,S.cw,S.ch);
  ctx.globalAlpha=alpha;draw();
  if(flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,flash*0.7);draw();}
  // a colour wash over the sprite's own pixels (Viktor's red warning before he transforms)
  if(fr.tint&&fr.tint.a>0){const tc=tintCanvas(S.cw,S.ch),g=tc.getContext('2d');g.globalCompositeOperation='source-over';g.clearRect(0,0,S.cw,S.ch);
    g.drawImage(S.img,fr.col*S.cw,fr.row*S.ch,S.cw,S.ch,0,0,S.cw,S.ch);g.globalCompositeOperation='source-atop';g.fillStyle=fr.tint.col;g.fillRect(0,0,S.cw,S.ch);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=alpha*fr.tint.a;ctx.drawImage(tc,-S.ax,-S.ay);}
  ctx.restore();
}
let TINT_C=null;const tintCanvas=(w,h)=>{if(!TINT_C)TINT_C=document.createElement('canvas');if(TINT_C.width<w)TINT_C.width=w;if(TINT_C.height<h)TINT_C.height=h;return TINT_C;};
function footShadow(x,y,r,col){const p=P(x,y);ctx.fillStyle=col||'rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(p.x,p.y,r*SCALE,r*SCALE*IK,0,0,TAU);ctx.fill();}
function champVisible(u){if(!u.alive)return 0;const enemy=u.team!==G.player.team;if(u.hidden)return enemy?0:0.55;if(u.stealthT>0)return enemy?0:0.4;if(u.untargetT>0)return enemy?0:0.25;return 1;}
// ground pass: shadows and team rings sit on the pixel ground layer
function drawUnitGround(){
  screenT();
  for(const tw of G.towers){const p=P(tw.x,tw.y);ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(p.x+10*SCALE,p.y+4*SCALE,100*SCALE,100*SCALE*IK,0,0,TAU);ctx.fill();}
  for(const m of G.minions)if(m.alive||m.deadT<0.5)footShadow(m.x,m.y,m.r,'rgba(0,0,0,.32)');
  for(const u of G.champs){if(!champVisible(u))continue;footShadow(u.x,u.y,u.r+6);
    if(u.def.resource==='Corruption'&&u.res>=40){const p=P(u.x,u.y),gl=ctx.createRadialGradient(p.x,p.y,4,p.x,p.y,(u.r+40)*SCALE),a=(u.res/100)*(0.35+(u.res>=100?Math.sin(G.t*6)*0.15:0));gl.addColorStop(0,`rgba(170,80,255,${a})`);gl.addColorStop(1,'rgba(170,80,255,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.ellipse(p.x,p.y,(u.r+40)*SCALE,(u.r+40)*SCALE*IK,0,0,TAU);ctx.fill();}
    const p=P(u.x,u.y);ctx.strokeStyle=u===G.player?'#5fe08b':TEAMC[u.team];ctx.lineWidth=2/RS;ctx.beginPath();ctx.ellipse(p.x,p.y,(u.r+6)*SCALE,(u.r+6)*SCALE*IK,0,0,TAU);ctx.stroke();
    if(u.recall){const f=clamp((G.t-u.recall.start)/RECALL_T,0,1),R=(u.r+30)*SCALE;ctx.strokeStyle=TEAML[u.team];ctx.lineWidth=4/RS;ctx.globalAlpha=0.35;ctx.beginPath();ctx.ellipse(p.x,p.y,R,R*IK,0,0,TAU);ctx.stroke();
      ctx.globalAlpha=0.95;ctx.beginPath();ctx.ellipse(p.x,p.y,R,R*IK,0,-PI/2,-PI/2+TAU*f);ctx.stroke();ctx.globalAlpha=1;}}
}
function drawChamp(u,t){
  const alpha=champVisible(u);if(!alpha)return;
  const lz=u.dash&&u.dash.leap?Math.sin((1-u.dash.t/u.dash.total)*PI)*90:0;
  const q=P(u.x,u.y,lz),[kx,ky]=kickOffset(u);
  if(u.key==='viktor'&&u.cast&&u.uncaging&&G.t-u.uncaging<0.7){const k=(G.t-u.uncaging)/0.6,g=ctx.createRadialGradient(q.x,q.y-50*SCALE,4,q.x,q.y-50*SCALE,90*SCALE);g.addColorStop(0,`rgba(255,80,40,${0.5*k})`);g.addColorStop(1,'rgba(120,20,10,0)');ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(q.x-90*SCALE,q.y-140*SCALE,180*SCALE,180*SCALE);ctx.restore();}
  drawAny(champSprite(u),q.x+kx,q.y+ky,alpha,u.hitFlash*9);
  if(u.recall)drawRecallBeam(u,q.x,q.y,alpha);
}
// a column of team-coloured light that brightens over the channel, with motes rising through it
function drawRecallBeam(u,x,y,alpha){const f=clamp((G.t-u.recall.start)/RECALL_T,0,1),w=(u.r+14)*SCALE,h=190*SCALE,col=TEAML[u.team];
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*(0.18+0.4*f);
  // nested soft columns: wide and faint outside, narrow and bright in the core
  const g=ctx.createLinearGradient(0,y,0,y-h);g.addColorStop(0,col);g.addColorStop(0.6,col+'66');g.addColorStop(1,col+'00');ctx.fillStyle=g;
  const a0=ctx.globalAlpha;for(const [k,al] of [[1,0.25],[0.7,0.35],[0.42,0.5],[0.18,0.8]]){ctx.globalAlpha=a0*al;ctx.beginPath();ctx.ellipse(x,y-h*0.42,w*k,h*0.6,0,0,TAU);ctx.fill();}
  ctx.globalAlpha=a0;
  ctx.fillStyle=col;for(let i=0;i<10;i++){const ph=(G.t*(0.5+0.3*f)+i/10)%1,mx=x+Math.sin(i*2.4+G.t)*w*0.8,my=y-ph*h;ctx.globalAlpha=alpha*(1-ph)*(0.5+0.5*f);const sz=Math.max(2,Math.round(3*SCALE));ctx.fillRect(Math.round(mx),Math.round(my),sz,sz);}
  ctx.restore();}
function drawMinion(m,t){
  let a=1;if(!m.alive){a=1-m.deadT/0.5;if(a<=0)return;}
  const q=P(m.x,m.y),[kx,ky]=kickOffset(m);
  blit(minionSprite(m),q.x+kx,q.y+ky,a,m.hitFlash*9);
}
// ---- towers: hand-drawn turret in 8 aim directions (S, SW, W, NW, N, NE, E, SE), recoloured per team; column 8 is the ruin ----
const TOWER_SHEET={"cw": 416, "ch": 493, "ax": 212, "ay": 407, "bw": 312.5, "top": 405, "mz": [[0.0, -245.0], [-160.8, -193.0], [-209.2, -271.0], [-171.5, -311.0], [0.0, -299.0], [143.2, -354.0], [200.2, -274.0], [152.2, -189.0]]};TOWER_SHEET.img=null;
const TOWER_K=200/TOWER_SHEET.bw;  // the platform spans 200 world units
(function(){const im=new Image();im.onload=()=>{TOWER_SHEET.img=im;};im.src='assets/tower.webp';})();
const towerDir=tw=>((Math.round((projAng(tw.aim)-PI/2)/(PI/4))%8)+8)%8;
function towerMuzzle(tw){const m=TOWER_SHEET.mz[towerDir(tw)];return{x:m[0]*TOWER_K,z:-m[1]*TOWER_K};}
function drawTower(tw,t){
  if(TOWER_SHEET.img){const S=TOWER_SHEET,p=P(tw.x,tw.y),k=SCALE*TOWER_K*RS,col=tw.alive?towerDir(tw):8;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.translate(Math.round(p.x*RS),Math.round(p.y*RS));ctx.scale(k,k);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const draw=()=>ctx.drawImage(S.img,col*S.cw,tw.team*S.ch,S.cw,S.ch,-S.ax,-S.ay,S.cw,S.ch);draw();
    if(tw.hitFlash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,tw.hitFlash*4);draw();}
    ctx.restore();
    if(tw.alive){screenT();const c=P(tw.x,tw.y,178+Math.sin(t*2)*3),r=40*SCALE,g=ctx.createRadialGradient(c.x,c.y,2,c.x,c.y,r);g.addColorStop(0,TEAML[tw.team]+'aa');g.addColorStop(1,TEAMC[tw.team]+'00');
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.45+Math.sin(t*3)*0.15;ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y,r,0,TAU);ctx.fill();ctx.restore();}
    return;}
  screenT();const p=P(tw.x,tw.y);
  blit(towerSprite(tw.team,tw.alive),p.x,p.y,1,tw.hitFlash*6);
  if(!tw.alive)return;
  const cz=222+Math.sin(t*2)*6,c=P(tw.x,tw.y,cz),s=SCALE;
  const glow=ctx.createRadialGradient(c.x,c.y,2,c.x,c.y,80*s);glow.addColorStop(0,TEAML[tw.team]);glow.addColorStop(0.3,TEAMC[tw.team]+'aa');glow.addColorStop(1,TEAMC[tw.team]+'00');
  ctx.fillStyle=glow;ctx.globalAlpha=0.7+Math.sin(t*3)*0.15;ctx.beginPath();ctx.arc(c.x,c.y,80*s,0,TAU);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=TEAMC[tw.team];ctx.beginPath();ctx.moveTo(c.x,c.y-34*s);ctx.lineTo(c.x+17*s,c.y);ctx.lineTo(c.x,c.y+30*s);ctx.lineTo(c.x-17*s,c.y);ctx.closePath();ctx.fill();
  ctx.fillStyle=TEAML[tw.team];ctx.beginPath();ctx.moveTo(c.x,c.y-34*s);ctx.lineTo(c.x+7*s,c.y);ctx.lineTo(c.x,c.y+30*s);ctx.lineTo(c.x-5*s,c.y-2*s);ctx.closePath();ctx.fill();
}
function drawStatus(t){
  screenT();
  for(const u of G.champs){if(!champVisible(u)||u.stunT<=0)continue;ctx.fillStyle='#ffe98a';
    for(let i=0;i<3;i++){const a=t*6+i*TAU/3,s=P(u.x,u.y,112);ctx.fillRect(s.x+Math.cos(a)*18*SCALE-2,s.y+Math.sin(a)*6*SCALE-2,4,4);}}
}

const resCol=c=>c.def.resource==='Luck'?'#e8c06a':c.form==='monster'?'#ff4d2e':c.def.resource==='Corruption'?'#a855f7':c.def.resource==='Energy'?'#f0cf48':c.def.resource==='Fury'?'#ff8a4c':'#4a90ff';
function bar(x,y,w,h,p,col,bg){ctx.fillStyle=bg||'rgba(0,0,0,.75)';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle=col;ctx.fillRect(x,y,w*clamp(p,0,1),h);}
function crossIcon(x,y){ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(8,8);ctx.moveTo(8,-8);ctx.lineTo(-8,8);ctx.stroke();ctx.strokeStyle='#ff4d61';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
function quarryIcon(x,y){ctx.save();ctx.translate(x,y);ctx.rotate(G.t*2);ctx.strokeStyle='#ff4d61';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.moveTo(-12,0);ctx.lineTo(-4,0);ctx.moveTo(12,0);ctx.lineTo(4,0);ctx.moveTo(0,-12);ctx.lineTo(0,-4);ctx.moveTo(0,12);ctx.lineTo(0,4);ctx.stroke();ctx.restore();}
function markIcon(x,y,r){ctx.save();ctx.translate(x,y);ctx.rotate(G.t*4);ctx.strokeStyle='#b48cff';ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<4;i++){const a=i/4*TAU;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.stroke();ctx.restore();}
function drawBars(){
  const p=G.player;screenT();
  for(const m of G.minions){if(!m.alive)continue;const w=m.mtype==='super'?62:40,q=P(m.x,m.y,heightOf(m)+14);bar(q.x-w/2,q.y,w,4,m.hp/m.maxHp,m.team===p.team?'#5aa9e6':'#e0544a');
}
  for(const tw of G.towers){if(!tw.alive)continue;const q=P(tw.x,tw.y,HEIGHT.tower+26);bar(q.x-80,q.y,160,11,tw.hp/tw.maxHp,tw.team===p.team?'#5aa9e6':'#e0544a');
    ctx.font='700 13px Oxanium, sans-serif';ctx.fillStyle='#e8eef0';ctx.textAlign='center';ctx.fillText(n0(tw.hp),q.x,q.y-5);
    if(tw.team!==p.team&&backdoorMult(tw)<1){const b=P(tw.x,tw.y);ctx.fillStyle='#c8d4d8';ctx.font='600 12px Oxanium, sans-serif';ctx.fillText('Protected without your minions',b.x,b.y+80*SCALE);}}
  for(const c of G.champs){
    if(!c.alive)continue;if((c.stealthT>0||c.untargetT>0||c.hidden)&&c.team!==p.team)continue;
    const q=P(c.x,c.y,heightOf(c)+30),w=96,x=q.x-w/2+10,y=q.y;
    bar(x,y,w,11,c.hp/c.maxHp,c===p?'#45c46e':'#e0544a');
    ctx.fillStyle='rgba(0,0,0,.6)';for(let h=100;h<c.maxHp;h+=100){const xx=x+w*h/c.maxHp;ctx.fillRect(xx,y,h%1000===0?2:1,h%500===0?11:6);}
    bar(x,y+13,w,4,c.res/c.maxRes,resCol(c));
    ctx.fillStyle='#0d1417';ctx.fillRect(x-24,y-2,22,20);ctx.strokeStyle='#c9a85a';ctx.lineWidth=1;ctx.strokeRect(x-24,y-2,22,20);
    ctx.fillStyle='#e8c06a';ctx.font='700 13px Oxanium, sans-serif';ctx.textAlign='center';ctx.fillText(c.level,x-13,y+13);
    if(c.crosscut&&c.crosscut.until>G.t)crossIcon(q.x,y-20);
    if(G.champs.some(o=>shadeQuarry(o)===c||vikBounty(o)===c))quarryIcon(q.x+66,y+6);
    if(c.bleed){const bx=x+w+9,by=y+3;ctx.fillStyle='#d42a3a';ctx.beginPath();ctx.moveTo(bx,by-6);ctx.quadraticCurveTo(bx+6,by+2,bx,by+6);ctx.quadraticCurveTo(bx-6,by+2,bx,by-6);ctx.fill();}
    if(c.recall){const f=clamp((G.t-c.recall.start)/RECALL_T,0,1);bar(x,y+20,w,5,f,'#8fd8ff');
      ctx.fillStyle='#cfefff';ctx.font='600 12px Oxanium, sans-serif';ctx.textAlign='center';ctx.fillText(`Recall ${Math.max(0,c.recall.until-G.t).toFixed(1)}s`,x+w/2,y+38);}
  }
}
function projZ(p){
  if(p.kind==='towerShot'){const t=p.homing;const f=clamp((t?dist(p,t):0)/(p.d0||1),0,1);return 40+((p.mz?p.mz.z:230)-40)*f;}
  if(p.kind==='orb')return 34;
  if(p.kind==='arrowR')return 60;
  return 46;
}
function drawProj(p,t){
  const z=projZ(p),q=P(p.x,p.y,z),g0=P(p.x,p.y,0),a=projAng(p.ang),s=SCALE;
  if(p.mz&&p.homing){q.x+=p.mz.x*s*clamp(dist(p,p.homing)/(p.d0||1),0,1);}
  ctx.save();ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(g0.x,g0.y,(p.kind==='arrowR'?40:10)*s,(p.kind==='arrowR'?40:10)*s*IK,0,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(q.x,q.y);ctx.scale(s,s);ctx.rotate(a);
  switch(p.kind){
    case'arrow':ctx.strokeStyle='#f1e7cf';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(8,0);ctx.stroke();ctx.fillStyle='#dfe9ec';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(5,-4);ctx.lineTo(5,4);ctx.fill();break;
    case'slug':{ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(-90,0,14,0);g.addColorStop(0,'rgba(255,170,80,0)');g.addColorStop(1,'rgba(255,200,120,.75)');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-110,-10);ctx.quadraticCurveTo(0,-56,20,0);ctx.quadraticCurveTo(0,56,-110,10);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff3c8';ctx.beginPath();ctx.ellipse(0,0,18,15,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,230,170,.7)';ctx.lineWidth=3;for(const o of [-40,40]){ctx.beginPath();ctx.moveTo(-80,o*0.5);ctx.lineTo(-12,o);ctx.stroke();}
      ctx.globalCompositeOperation='source-over';break;}
    case'pellet':{ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,190,100,.45)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-44,0);ctx.lineTo(3,0);ctx.stroke();ctx.strokeStyle='rgba(255,235,180,.9)';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(3,0);ctx.stroke();ctx.fillStyle='#fff6d8';ctx.beginPath();ctx.arc(3,0,4.2,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over';break;}
    case'bjflush':{const X=BJ_FX.flush;if(X.img){const sc=1.1;ctx.globalCompositeOperation='lighter';ctx.drawImage(X.img,X.cw,0,X.cw,X.ch,-X.cw*sc,-X.ch*sc/2,X.cw*sc,X.ch*sc);ctx.globalCompositeOperation='source-over';}break;}
    case'bjshot':case'bjshotQ':{const I=BJ_SHOT.img,sc=p.kind==='bjshotQ'?0.44:0.34;if(I){const fi=Math.floor(t*14+(p.age||0)*20)%4;ctx.globalCompositeOperation='lighter';ctx.drawImage(I,fi*BJ_SHOT.cw,0,BJ_SHOT.cw,BJ_SHOT.ch,-BJ_SHOT.cw*sc,-BJ_SHOT.ch*sc/2,BJ_SHOT.cw*sc,BJ_SHOT.ch*sc);ctx.globalCompositeOperation='source-over';}break;}
    case'bullet':{ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,210,120,.55)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(4,0);ctx.stroke();ctx.strokeStyle='#fff3c8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(6,0);ctx.stroke();ctx.globalCompositeOperation='source-over';break;}
    case'tether':{ctx.fillStyle='#3a1a14';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-4,-9);ctx.lineTo(0,0);ctx.lineTo(-4,9);ctx.closePath();ctx.fill();ctx.strokeStyle='#d9574a';ctx.lineWidth=2;ctx.stroke();break;}
    case'arrowBig':ctx.strokeStyle='#9fe8ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(10,0);ctx.stroke();ctx.fillStyle='#e8fbff';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(6,-6);ctx.lineTo(6,6);ctx.fill();break;
    case'arrowQ':{const gr=ctx.createLinearGradient(-90,0,20,0);gr.addColorStop(0,'rgba(120,220,255,0)');gr.addColorStop(1,'rgba(160,235,255,.9)');ctx.fillStyle=gr;ctx.fillRect(-90,-7,110,14);ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(18,0);ctx.stroke();ctx.fillStyle='#e8fbff';ctx.beginPath();ctx.moveTo(26,0);ctx.lineTo(14,-8);ctx.lineTo(14,8);ctx.fill();break;}
    case'arrowR':{const gr=ctx.createLinearGradient(-260,0,40,0);gr.addColorStop(0,'rgba(120,220,255,0)');gr.addColorStop(1,'rgba(200,245,255,.95)');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(-260,-10);ctx.lineTo(30,-34);ctx.lineTo(60,0);ctx.lineTo(30,34);ctx.lineTo(-260,10);ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(70,0);ctx.lineTo(30,-18);ctx.lineTo(30,18);ctx.fill();break;}
    case'axeQ':case'axeW':ctx.rotate(t*24);axeShape(p.kind==='axeQ');break;
    case'axe':ctx.rotate(t*22);ctx.strokeStyle='#6b4a2b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(16,0);ctx.stroke();ctx.fillStyle='#d4dbe1';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(14,-16);ctx.quadraticCurveTo(26,-8,22,6);ctx.lineTo(14,3);ctx.closePath();ctx.fill();break;
    case'shuriken':ctx.scale(1,IK+0.15);ctx.rotate(t*25);ctx.fillStyle='#d9ccff';ctx.beginPath();for(let i=0;i<8;i++){const an=i/8*TAU,r=i%2?7:22;ctx.lineTo(Math.cos(an)*r,Math.sin(an)*r);}ctx.closePath();ctx.fill();ctx.fillStyle='#2b2238';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();break;
    case'orb':ctx.fillStyle=TEAMC[p.team]+'66';ctx.beginPath();ctx.arc(-6,0,10,0,TAU);ctx.fill();ctx.fillStyle=TEAML[p.team];ctx.beginPath();ctx.arc(0,0,7,0,TAU);ctx.fill();break;
    case'towerShot':ctx.fillStyle=TEAMC[p.team]+'55';ctx.beginPath();ctx.ellipse(-18,0,30,12,0,0,TAU);ctx.fill();ctx.fillStyle=TEAML[p.team];ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,6,0,TAU);ctx.fill();break;
  }
  ctx.restore();
}
function drawGroundFx(){
  groundT(0);
  // click markers: a ring closing on the point with four arrowheads sliding in
  for(const f of G.fx){if(f.k!=='click')continue;const k=f.t/f.dur,e=1-(1-k)*(1-k);ctx.globalAlpha=1-k*k;ctx.strokeStyle=f.col;ctx.fillStyle=f.col;ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1.2-0.55*e),0,TAU);ctx.stroke();
    for(let i=0;i<4;i++){const a=i*PI/2+PI/4,d=f.r*(1.7-1.15*e);ctx.save();ctx.translate(f.x+Math.cos(a)*d,f.y+Math.sin(a)*d);ctx.rotate(a+PI);
      ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-7,-10);ctx.lineTo(-2,0);ctx.lineTo(-7,10);ctx.closePath();ctx.fill();ctx.restore();}}
  ctx.globalAlpha=1;
  for(const f of G.fx){if(f.k!=='ring')continue;const k=f.t/f.dur;ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=5*(1-k)+2;ctx.beginPath();ctx.arc(f.x,f.y,f.r0+(f.r1-f.r0)*k,0,TAU);ctx.stroke();}
  ctx.globalAlpha=1;
}
function drawFx(){
  screenT();const s=SCALE;
  for(const f of G.fx){const k=f.t/f.dur;if(f.k==='ring'||f.k==='smear')continue;ctx.save();
    if(f.k==='bjspr'){const X=BJ_FX[f.set];if(X.img&&f.t>=0){const q=P(f.x,f.y,f.z||0),g=f.shrink?1-0.55*k:1,sc=f.sc*g*SCALE,w=X.cw*sc,h=X.ch*sc;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=f.shrink?Math.min(1,(1-k)*1.6):1-k;ctx.drawImage(X.img,f.fi*X.cw,0,X.cw,X.ch,q.x-w/2,q.y-h/2,w,h);}}
    else if(f.k==='spark'){const q=P(f.x,f.y,30+k*20);ctx.globalAlpha=1-k;ctx.fillStyle=f.col;const r=Math.max(1/RS,(3*(1-k)+1)*s);ctx.fillRect(q.x-r,q.y-r,r*2,r*2);}
    else if(f.k==='slash'){const q=P(f.x,f.y,40);ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=(6*(1-k)+2)*s;ctx.translate(q.x,q.y);ctx.scale(s,s);ctx.rotate(projAng(f.ang));ctx.beginPath();ctx.arc(-20,0,34,-0.9+k*0.4,0.9+k*0.4);ctx.stroke();}
    else if(f.k==='ghost'){const q=P(f.x,f.y);drawAny(f.spr,q.x,q.y,0.35*(1-k),0.6);}
    else if(f.k==='axefly'){const x=f.x0+(f.x1-f.x0)*k,y=f.y0+(f.y1-f.y0)*k,q=P(x,y,40+Math.sin(k*PI)*90);ctx.translate(q.x,q.y);ctx.scale(s,s);ctx.rotate(G.t*24);axeShape(f.key==='Q');}
    else if(f.k==='rock'){const tt=k*f.dur,z=Math.max(0,f.vz*tt-450*tt*tt),q=P(f.x,f.y,z),r=f.s*s;ctx.globalAlpha=k<0.8?1:(1-k)*5;ctx.translate(q.x,q.y);ctx.rotate(f.rot+k*6);ctx.fillStyle='#6f5f4e';ctx.beginPath();ctx.moveTo(-r,-r*0.4);ctx.lineTo(-r*0.2,-r);ctx.lineTo(r,-r*0.3);ctx.lineTo(r*0.6,r*0.8);ctx.lineTo(-r*0.7,r*0.6);ctx.closePath();ctx.fill();ctx.fillStyle='#9a8670';ctx.beginPath();ctx.moveTo(-r*0.6,-r*0.4);ctx.lineTo(-r*0.1,-r*0.85);ctx.lineTo(r*0.5,-r*0.3);ctx.closePath();ctx.fill();}
    else if(f.k==='flash'){const q=P(f.x,f.y,f.z),a=projAng(f.ang);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;ctx.translate(q.x,q.y);ctx.scale(s*f.s,s*f.s);ctx.rotate(a);
      ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(26,0);ctx.lineTo(0,7);ctx.lineTo(6,0);ctx.closePath();ctx.fill();ctx.fillStyle='#fff6dc';ctx.beginPath();ctx.arc(3,0,5,0,TAU);ctx.fill();}
    else if(f.k==='smoke'){const q=P(f.x,f.y,20+k*40);ctx.globalAlpha=0.5*(1-k);ctx.fillStyle=f.col||'#4a3d5c';ctx.beginPath();ctx.arc(q.x,q.y,f.r*(1+k)*s,0,TAU);ctx.fill();}
    else if(f.k==='impact'){const q=P(f.x,f.y,f.z),big=f.big?1.5:1;
      if(k<0.45){ctx.globalAlpha=1-k/0.45;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(q.x,q.y,(8+30*k)*s*big,0,TAU);ctx.fill();}
      ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=Math.max(1.5/RS,3*s*big*(1-k));
      for(const a of f.rays){const r0=(10+50*k)*s*big,r1=(22+70*k)*s*big;ctx.beginPath();ctx.moveTo(q.x+Math.cos(a)*r0,q.y+Math.sin(a)*r0*0.8);ctx.lineTo(q.x+Math.cos(a)*r1,q.y+Math.sin(a)*r1*0.8);ctx.stroke();}}
    ctx.restore();}
  ctx.globalAlpha=1;
}
// Weapon trails: an annular sector on a plane at weapon height, sweeping through the swing arc.
function drawSmears(){
  for(const f of G.fx){if(f.k!=='smear')continue;const p=f.t/f.dur;groundT(f.z);
    const span=f.span||2.0,a0=f.ang-f.side*span/2,a1=f.ang+f.side*span/2,hd=a0+(a1-a0)*Math.min(1,p*1.7),tl=a0+(a1-a0)*Math.max(0,p*1.7-0.75);
    const ccw=f.side<0;
    const band=(ri,ro,col,al)=>{ctx.globalAlpha=al;ctx.fillStyle=col;ctx.beginPath();ctx.arc(f.x,f.y,ro,tl,hd,ccw);ctx.arc(f.x,f.y,ri,hd,tl,!ccw);ctx.closePath();ctx.fill();};
    band(f.r0,f.r1,f.col,(1-p)*0.55*(f.alpha||1));band(f.r1-(f.r1-f.r0)*0.35,f.r1,'#ffffff',(1-p)*0.9*(f.alpha||1));
    ctx.globalAlpha=1;}
}
function drawTexts(){
  screenT();
  for(const t of G.texts){const k=t.t/t.dur,q=P(t.x,t.y,t.z+k*45);ctx.globalAlpha=k<0.7?1:1-(k-0.7)/0.3;const pop=k<0.12?1+(0.12-k)*4:1;
    ctx.font=`800 ${Math.round(t.size*pop)}px Oxanium, sans-serif`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText(t.txt,q.x+t.ox,q.y);ctx.fillStyle=t.col;ctx.fillText(t.txt,q.x+t.ox,q.y);}
  ctx.globalAlpha=1;
}
function axeShape(q){ctx.fillStyle=q?'rgba(255,170,70,.35)':'rgba(90,170,255,.35)';ctx.beginPath();ctx.arc(0,0,24,0,TAU);ctx.fill();
  ctx.strokeStyle='#5a3a22';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.stroke();
  ctx.fillStyle=q?'#d8a050':'#9fb6c8';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(14,-18);ctx.quadraticCurveTo(28,-8,24,8);ctx.lineTo(14,4);ctx.closePath();ctx.fill();
  ctx.strokeStyle=q?'#ffcf7a':'#7cd0ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(14,-18);ctx.quadraticCurveTo(28,-8,24,8);ctx.stroke();}
function drawRifts(){
  for(const f of G.rifts){const reach=Math.min(f.len,f.t*f.speed),fade=1-clamp((f.t-f.len/f.speed-0.9)/0.5,0,1);if(reach<4)continue;
    const R=mulberry(f.seed),px=-f.uy,py=f.ux,L=[],Rt=[];
    for(let s=0;s<=reach;s+=28){const w=f.half*(0.35+0.45*R())*Math.min(1,s/60+0.3),j=(R()-0.5)*22,cx=f.x0+f.ux*s+px*j,cy=f.y0+f.uy*s+py*j;L.push([cx+px*w,cy+py*w]);Rt.push([cx-px*w,cy-py*w]);}
    ctx.save();ctx.globalAlpha=fade;
    ctx.fillStyle='rgba(60,45,35,.55)';ctx.beginPath();ctx.moveTo(f.x0+px*f.half,f.y0+py*f.half);ctx.lineTo(f.x0+f.ux*reach+px*f.half,f.y0+f.uy*reach+py*f.half);ctx.lineTo(f.x0+f.ux*reach-px*f.half,f.y0+f.uy*reach-py*f.half);ctx.lineTo(f.x0-px*f.half,f.y0-py*f.half);ctx.closePath();ctx.fill();
    ctx.fillStyle='#140d0a';ctx.beginPath();L.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));for(let i=Rt.length-1;i>=0;i--)ctx.lineTo(Rt[i][0],Rt[i][1]);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,140,50,.75)';ctx.lineWidth=5;ctx.beginPath();L.forEach((q,i)=>{const m=[(q[0]+Rt[i][0])/2,(q[1]+Rt[i][1])/2];i?ctx.lineTo(m[0],m[1]):ctx.moveTo(m[0],m[1]);});ctx.stroke();
    ctx.strokeStyle='#5c4632';ctx.lineWidth=6;ctx.beginPath();L.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.beginPath();Rt.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();
    ctx.restore();}
}
function drawAxeGround(){
  groundT(0);drawRifts();const p=G.player;
  for(const c of G.champs){if(!c.axes)continue;
    for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.state!=='ground')continue;const f=clamp((ax.until-G.t)/AXE_LIFE,0,1),col=CORA_AXES[k].glow;
      ctx.fillStyle=k==='Q'?'rgba(255,160,60,.18)':'rgba(80,160,255,.18)';ctx.beginPath();ctx.arc(ax.x,ax.y,46,0,TAU);ctx.fill();
      ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.arc(ax.x,ax.y,46,-PI/2,-PI/2+TAU*f);ctx.stroke();
      if(c===p&&c.alive&&k===oldestOut(c)&&A1.Q.canRecast(c)&&!c.dash){ctx.save();ctx.strokeStyle='rgba(255,170,70,.10)';ctx.lineWidth=AXE_W*2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(ax.x,ax.y);ctx.stroke();
        ctx.setLineDash([18,14]);ctx.strokeStyle='rgba(255,190,110,.45)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax.x,ax.y);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.restore();}}
  }
  // arena floor: tinted disc, glowing rim and a timer arc that runs down
  const A=G.arena;
  if(A){const grow=Math.min(1,(G.t-A.start)/0.25),sn=A.snapped?Math.min(1,(G.t-A.snapT)/0.3):0,R=A.R*(0.7+0.3*grow)*(1-0.85*sn);
    ctx.globalAlpha=1-sn;ctx.fillStyle='rgba(110,30,190,.16)';ctx.beginPath();ctx.arc(A.x,A.y,R,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(122,43,214,.8)';ctx.lineWidth=14;ctx.stroke();ctx.strokeStyle='#e0b8ff';ctx.lineWidth=3;ctx.stroke();
    if(!A.snapped){const f=clamp((A.until-G.t)/ARENA_T,0,1);ctx.strokeStyle='rgba(255,225,255,.85)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(A.x,A.y,R-20,-PI/2,-PI/2+TAU*f);ctx.stroke();}
    ctx.globalAlpha=1;}
}
// the chain from her hand to the blue axe head: alternating flat and edge-on links with a cold glow
function drawCoin(k){const X=BJ_FX.coin;if(X.img){const now=G.t;let x=k.x,y=k.y,z=0,fi=1,sc=1.5;
    if(now<k.land){const f=clamp((now-k.t0)/(k.land-k.t0),0,1);x=k.x0+(k.x-k.x0)*f;y=k.y0+(k.y-k.y0)*f;z=50+Math.sin(f*PI)*130;fi=0;sc=1.3;}
    const q=P(x,y,z),w=X.cw*sc*SCALE,h=X.ch*sc*SCALE;ctx.save();ctx.globalCompositeOperation=fi?'lighter':'source-over';ctx.drawImage(X.img,fi*X.cw,0,X.cw,X.ch,q.x-w/2,q.y-h*(fi?0.62:0.5),w,h);ctx.restore();return;}
  const now=G.t;let x=k.x,y=k.y,z=10+Math.sin(now*7)*3;
  if(now<k.land){const f=clamp((now-k.t0)/(k.land-k.t0),0,1);x=k.x0+(k.x-k.x0)*f;y=k.y0+(k.y-k.y0)*f;z=50+Math.sin(f*PI)*130;}
  const q=P(x,y,z),s=SCALE;
  if(now>=k.land){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(q.x,q.y,1,q.x,q.y,26*s);g.addColorStop(0,'rgba(255,220,120,.7)');g.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,26*s,0,TAU);ctx.fill();ctx.restore();}
  ctx.save();ctx.translate(q.x,q.y);ctx.scale(Math.max(0.18,Math.abs(Math.cos(now*16)))*s,s);ctx.fillStyle='#ffd36b';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.strokeStyle='#8a6a1e';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff1c2';ctx.fillRect(-2,-5,3,6);ctx.restore();}
function drawHooks(){screenT();
  for(const c of G.champs)if(c.arm&&c.alive)drawArm(c,c.arm);
  for(const c of G.champs)if(c.coin)drawCoin(c.coin);
  for(const p of G.projs){if(p.kind!=='tether'||!p.src2)continue;const a=P(p.src2.x,p.src2.y,56),b=P(p.x,p.y,46);ctx.strokeStyle='#8a2a22';ctx.lineWidth=3*SCALE;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+8*SCALE,b.x,b.y);ctx.stroke();}
  for(const c of G.champs){const h=c.hook;if(!h||!c.alive)continue;
    const a=P(c.x,c.y,52),b=P(h.x,h.y,40),dx=b.x-a.x,dy=b.y-a.y,L=hyp(dx,dy),ang=Math.atan2(dy,dx),n=Math.max(2,Math.floor(L/(8*SCALE)));
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(80,160,255,.3)';ctx.lineWidth=6*SCALE;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
    ctx.lineWidth=1.8*SCALE;
    for(let i=0;i<n;i++){const t=(i+0.5)/n,x=a.x+dx*t,y=a.y+dy*t;ctx.strokeStyle=i%2?'#7e93a6':'#d3dee8';ctx.beginPath();
      if(i%2){ctx.moveTo(x-Math.cos(ang)*4*SCALE,y-Math.sin(ang)*4*SCALE);ctx.lineTo(x+Math.cos(ang)*4*SCALE,y+Math.sin(ang)*4*SCALE);}else ctx.ellipse(x,y,4.6*SCALE,2.4*SCALE,ang,0,TAU);ctx.stroke();}
    ctx.save();ctx.translate(b.x,b.y);ctx.scale(SCALE*1.15,SCALE*1.15);ctx.rotate(h.state==='out'?G.t*22:ang);axeShape(false);ctx.restore();}
}
// the chain fence: spikes rise around the ring with sagging chains between them, then collapse inward when it snaps
function drawArenaFence(){const A=G.arena;if(!A)return;screenT();
  const rise=1-Math.pow(1-Math.min(1,(G.t-A.start)/0.3),3),sn=A.snapped?Math.min(1,(G.t-A.snapT)/0.3):0,N=A.posts.length;
  const pts=A.posts.map(p=>{const rr=A.R*(1-0.85*sn),x=A.x+Math.cos(p.a)*rr,y=A.y+Math.sin(p.a)*rr,h=p.h*rise*(1-0.5*sn);return{b:P(x,y,0),t:P(x,y,h),m:P(x,y,h*0.6)};});
  ctx.save();ctx.globalAlpha=1-sn;
  for(let i=0;i<N;i++){const p=pts[i].m,q=pts[(i+1)%N].m,k=7;ctx.lineWidth=1.8*SCALE;
    for(let j=0;j<k;j++){const t=(j+0.5)/k,x=p.x+(q.x-p.x)*t,y=p.y+(q.y-p.y)*t+Math.sin(t*PI)*9*SCALE,ang=Math.atan2(q.y-p.y,q.x-p.x);
      ctx.strokeStyle=j%2?'#5b2a86':'#b98be6';ctx.beginPath();ctx.ellipse(x,y,(j%2?2:4)*SCALE,(j%2?1.2:2.2)*SCALE,ang,0,TAU);ctx.stroke();}}
  for(const p of pts){ctx.strokeStyle='#2a0f45';ctx.lineWidth=7*SCALE;ctx.beginPath();ctx.moveTo(p.b.x,p.b.y);ctx.lineTo(p.t.x,p.t.y);ctx.stroke();
    ctx.strokeStyle='#8a4bd0';ctx.lineWidth=3*SCALE;ctx.beginPath();ctx.moveTo(p.m.x,p.m.y);ctx.lineTo(p.t.x,p.t.y);ctx.stroke();
    ctx.fillStyle='#f0d6ff';ctx.beginPath();ctx.arc(p.t.x,p.t.y,2.2*SCALE,0,TAU);ctx.fill();}
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-sn)*(0.25+0.12*Math.sin(G.t*6));ctx.strokeStyle='#c27bff';ctx.lineWidth=4*SCALE;
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.m.x,p.m.y):ctx.moveTo(p.m.x,p.m.y));ctx.closePath();ctx.stroke();
  // on the snap, chains whip in from every spike to the prey
  if(A.snapped&&sn<1&&A.target.alive){const tq=P(A.target.x,A.target.y,40);ctx.globalAlpha=1-sn;ctx.strokeStyle='#e6c2ff';ctx.lineWidth=2.5*SCALE;
    for(const p of pts){ctx.beginPath();ctx.moveTo(p.m.x,p.m.y);ctx.lineTo(tq.x,tq.y);ctx.stroke();}}
  ctx.restore();}
function drawAxeUpright(t){
  screenT();
  for(const c of G.champs){if(!c.axes)continue;
    for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.state!=='ground')continue;const q=P(ax.x,ax.y,26+Math.sin(t*4+(k==='Q'?0:2))*3);
      ctx.save();ctx.translate(q.x,q.y);ctx.scale(SCALE*1.2,SCALE*1.2);ctx.rotate(-PI/2+0.35);axeShape(k==='Q');ctx.restore();}
    if(c===G.player&&A1.R.canRecast(c)){const q=P(c.x,c.y,150);ctx.font='700 14px Oxanium, sans-serif';ctx.textAlign='center';ctx.fillStyle='#e6c2ff';ctx.fillText('R: snap the chains',q.x,q.y);}}
}
function groundEllipse(x,y,r,col,lw,dash){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw;if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();}
let demoT=0;
function render(dt){
  camAngle();
  let tx,ty;
  if(G&&camFree){
    // unlocked: push the screen edge or use the arrow keys to pan, RTS style
    let sx=0,sy=0;const e=18;if(mouse.in){if(mouse.x<e)sx--;if(mouse.x>VW-e)sx++;if(mouse.y<e)sy--;if(mouse.y>VH-e)sy++;}
    if(keys.ArrowLeft)sx--;if(keys.ArrowRight)sx++;if(keys.ArrowUp)sy--;if(keys.ArrowDown)sy++;
    if(sx||sy){const sp=1100*SET.cam/100*dt,a=screenToWorld(VW/2,VH/2),b=screenToWorld(VW/2+sx*sp,VH/2+sy*sp);cam.x+=b.x-a.x;cam.y+=b.y-a.y;}}
  else{
    if(G){const p=G.player;const w=screenToWorld(mouse.x,mouse.y);const L={off:[0,0],low:[0.1,150],high:[0.2,260]}[SET.lead]||[0.1,150];let ox=(w.x-p.x)*L[0],oy=(w.y-p.y)*L[0];const l=hyp(ox,oy);if(l>L[1]){ox*=L[1]/l;oy*=L[1]/l;}if(classic()){ox=oy=0;}tx=p.x+ox;ty=p.y+oy;
      if(isCol()){const dx=tx-COL.cx,dy=ty-COL.cy,dd=hyp(dx,dy),m=COL.R-260;if(dd>m){tx=COL.cx+dx/dd*m;ty=COL.cy+dy/dd*m;}}else{tx=clamp(tx,650,W-650);ty=clamp(ty,MIDY-900,MIDY+1000);}}
    else{demoT+=dt;tx=W/2+Math.sin(demoT*0.08)*2200;ty=MIDY;}
    cam.x+=(tx-cam.x)*Math.min(1,dt*11);cam.y+=(ty-cam.y)*Math.min(1,dt*11);}
  if(camFree&&isCol()){const dx=cam.x-COL.cx,dy=cam.y-COL.cy,dd=hyp(dx,dy),m=COL.R+100;if(dd>m){cam.x=COL.cx+dx/dd*m;cam.y=COL.cy+dy/dd*m;}}
  else if(camFree||!G){cam.x=clamp(cam.x,camFree?300:650,camFree?W-300:W-650);cam.y=clamp(cam.y,camFree?MIDY-1000:MIDY-900,camFree?MIDY+1150:MIDY+1000);}  // the deck's alcoves reach well past its usual edges
  SHX=SHY=0;
  if(G&&G.shake&&G.shake.t>0){G.shake.t-=dt;const m=G.shake.mag*Math.max(0,G.shake.t/G.shake.dur);SHX=rnd(-m,m);SHY=rnd(-m,m);}
  // world pass: low-resolution buffer, upscaled with hard pixels
  ctx=bctx;RS=DPR/PXd;bctx.imageSmoothingEnabled=true;
  screenT();ctx.fillStyle='#0f1613';ctx.fillRect(0,0,VW,VH);
  if(isCol())drawColTerrain();else drawTerrain();
  const t=performance.now()/1000;
  groundT(0);
  if(!isCol())for(let i=0;i<2;i++){const f=FOUNT[i];ctx.save();ctx.globalAlpha=0.25+Math.sin(t*2)*0.08;ctx.fillStyle=TEAMC[i];ctx.beginPath();ctx.arc(f.x,f.y,FOUNT_R-30,0,TAU);ctx.fill();ctx.restore();}
  if(G){
    const p=G.player;
    for(const r of G.relics)if(r.active){ctx.fillStyle='rgba(80,255,150,.2)';ctx.beginPath();ctx.arc(r.x,r.y,40,0,TAU);ctx.fill();}
    const et=G.towers[1-p.team];
    if(et&&p.alive&&et.alive&&dist(p,et)<et.range+450)groundEllipse(et.x,et.y,et.range,et.target===p?'rgba(255,80,70,.85)':'rgba(255,90,80,.35)',et.target===p?9:6,[26,16]);
    if(p.alive)groundEllipse(p.x,p.y,p.range+p.r,'rgba(255,255,255,.14)',4);
    if(G.hover){const h=G.hover;groundEllipse(h.x,h.y,h.r+10,'rgba(255,90,80,.95)',6);}
    for(const c of G.champs){if(!c.alive)continue;
      // Scissor Blades telegraph: the cone and the crossing point
      if(c.cast&&c.castAnim&&c.castAnim.kind==='q'&&(c.team===p.team||targetable(c))){const a=c.cast.ang;ctx.fillStyle='rgba(255,90,110,.12)';ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.arc(c.x,c.y,340,a-0.75,a+0.75);ctx.closePath();ctx.fill();
        groundEllipse(c.x+Math.cos(a)*255,c.y+Math.sin(a)*255,75,'rgba(255,107,122,.85)',5);}
      const q=shadeQuarry(c);if(q)groundEllipse(q.x,q.y,q.r+22+Math.sin(G.t*8)*4,'rgba(255,77,97,.8)',5,[16,10]);
      if(c.coin&&G.t>=c.coin.land){const k=c.coin,f=clamp((G.t-k.land)/BJ_COIN.delay,0,1);groundEllipse(k.x,k.y,BJ_COIN.r,`rgba(255,211,107,${0.35+0.5*f})`,5,[14,10]);groundEllipse(k.x,k.y,20+(BJ_COIN.r-20)*(1-f),'rgba(127,233,255,.7)',4);}
      if(c.flush&&(c.team===p.team||targetable(c))){const a=c.flush.ang;ctx.fillStyle='rgba(255,211,107,.2)';ctx.strokeStyle='rgba(255,211,107,.75)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.arc(c.x,c.y,BJ_FLUSH.range,a-BJ_FLUSH.cone,a+BJ_FLUSH.cone);ctx.closePath();ctx.fill();ctx.stroke();}
      const bq=vikBounty(c);if(bq&&targetable(bq))groundEllipse(bq.x,bq.y,bq.r+24+Math.sin(G.t*7)*4,'rgba(255,150,70,.85)',5,[10,8]);}
    for(const tr of G.trails){const life=clamp((tr.until-G.t)/BJ_TRAIL.dur,0,1),fl=0.75+0.25*Math.sin(t*23+tr.t0*7);ctx.save();ctx.lineCap='round';
      ctx.strokeStyle=`rgba(40,150,220,${0.35*life})`;ctx.lineWidth=BJ_TRAIL.half*2.2;ctx.beginPath();ctx.moveTo(tr.x0,tr.y0);ctx.lineTo(tr.x1,tr.y1);ctx.stroke();
      ctx.strokeStyle=`rgba(127,233,255,${0.6*life*fl})`;ctx.lineWidth=BJ_TRAIL.half*1.1;ctx.stroke();ctx.strokeStyle=`rgba(230,252,255,${0.7*life*fl})`;ctx.lineWidth=BJ_TRAIL.half*0.35;ctx.stroke();ctx.restore();}
    if(isCol()){if(artReady())drawPortalPads(t);drawControlPoint(t);drawEventsGround(t);}
    drawGroundFx();drawUnitGround();drawAxeGround();
  }
  if(isCol()){drawColWalls(t);drawStormGround();}else drawCliff();
  if(G){
    screenT();
    for(const r of G.relics){if(!r.active)continue;const q=P(r.x,r.y,44+Math.sin(t*3)*6);ctx.save();ctx.translate(q.x,q.y);ctx.scale(SCALE,SCALE);
      ctx.fillStyle='#4fe08a';ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(14,0);ctx.lineTo(0,20);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();ctx.fillStyle='#d9ffe6';ctx.fillRect(-3,-9,6,18);ctx.fillRect(-9,-3,18,6);ctx.restore();}
  }
  // upscale the ground to the screen
  ctx=mctx;RS=DPR;mctx.setTransform(1,0,0,1,0,0);mctx.imageSmoothingEnabled=false;mctx.drawImage(buf,0,0,buf.width*PXd,buf.height*PXd);
  if(!G)return;
  // units straight onto the screen so hand-drawn sheets keep their detail; pixel sprites scale up on the same grid
  const list=[...G.towers,...G.minions,...G.champs,...(isCol()?[...COL_PROPS,...G.col.plants]:[])].sort((a,b)=>(a.y-a.x)-(b.y-b.x));
  for(const u of list){if(u.kind==='tower')drawTower(u,t);else if(u.kind==='minion')drawMinion(u,t);else if(u.kind==='ruin')drawRuin(u);else if(u.kind==='portal')drawPortal(u,t);else if(u.kind==='gate')drawGate(u,t);else if(u.kind==='tuft')drawTuft(u);else if(u.kind==='plant')drawPlant(u,t);else drawChamp(u,t);}
  // effects in their own pixel buffer on top
  ctx=fctx;RS=DPR/PXd;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,fbuf.width,fbuf.height);ctx.imageSmoothingEnabled=true;
  drawSmears();drawAxeUpright(t);screenT();for(const pr of G.projs)drawProj(pr,t);drawHooks();drawArenaFence();if(isCol()){drawBeads(t);drawPortalMotes(t);drawEventsFx(t);drawStormFx();}drawFx();drawStatus(t);
  ctx=mctx;RS=DPR;mctx.setTransform(1,0,0,1,0,0);mctx.imageSmoothingEnabled=false;mctx.drawImage(fbuf,0,0,fbuf.width*PXd,fbuf.height*PXd);
  const p=G.player;
  drawBars();drawTexts();
  screenT();
  if(!p.alive){ctx.fillStyle='rgba(20,10,12,.45)';ctx.fillRect(0,0,VW,VH);}
  // the cursor itself is drawn by updateCursor() on its own canvas above the HUD
}

// pixel hand cursor: '#' outline, '.' fill, space transparent; the hotspot is the index fingertip
const HAND=['     ##','    #..#','    #..#','    #..#','    #..###','    #..#..##','    #..#..#.##',' ## #..#..#.#.#','#..##.........#','#...#.........#',' #............#','  #...........#','  #..........#','   #.........#','   #........#','    #.......#','    #########'].map(r=>r.padEnd(15));
const handCache={};
function handSprite(hot){const key=hot?'h':'n';if(handCache[key])return handCache[key];
  const c=document.createElement('canvas'),w=15,h=HAND.length;c.width=w;c.height=h;const g=c.getContext('2d');
  const pal=hot?{o:'#2a0a08',f:'#ff8f80',hi:'#ffd2cb',sh:'#c8483c'}:{o:'#1b1209',f:'#f1dfb8',hi:'#fff8e6',sh:'#bf9c5e'};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=HAND[y][x];if(ch===' ')continue;
    g.fillStyle=ch==='#'?pal.o:HAND[y][x+1]==='#'?pal.sh:HAND[y][x-1]==='#'?pal.hi:pal.f;g.fillRect(x,y,1,1);}
  return handCache[key]=c;}
// ---- settings: controls, cursor and camera, remembered in this browser ----
const SET={scheme:'modern',cursor:'hand',amove:'click',sens:100,cam:100,lead:'low'};
try{Object.assign(SET,JSON.parse(localStorage.getItem('riftline.settings')||'{}'));}catch(e){}
const classic=()=>SET.scheme==='classic';
// slot convention for every champion: Q damage, the E slot movement (W in point-and-click), the RMB slot utility (E in point-and-click), R ultimate
const keyLabel=k=>classic()?({E:'W',RMB:'E'}[k]||k):k;
const keyName=k=>classic()?({E:'W',RMB:'E'}[k]||k):k==='RMB'?'Right click':k;
const kitItems=d=>`${d.passive?`<li><kbd>P</kbd><span>${d.passive.name} (passive)</span></li>`:''}${ABK.map(k=>`<li><kbd>${keyLabel(k)}</kbd><span>${d.ab[k].name}</span></li>`).join('')}<li><kbd>SPACE</kbd><span>${d.dash.name}</span></li>`;
const CTL_OPTS=[{k:'scheme',label:'Controls',seg:[['modern','WASD'],['classic','Point and click']]},{k:'amove',label:'Attack-move',seg:[['click','A + click'],['key','A only']]},
  {k:'cursor',label:'Cursor',seg:[['hand','Hand'],['cross','Crosshair']]},{k:'lead',label:'Camera lead',seg:[['off','Off'],['low','Low'],['high','High']]},{k:'sens',label:'Cursor speed',range:[30,150,5]},{k:'cam',label:'Camera speed',range:[30,200,10]}];
for(const id of ['menuCtl','pauseCtl'])$(id).innerHTML=CTL_OPTS.map(o=>o.seg?`<div class="opt"><label>${o.label}</label><div class="seg" data-set="${o.k}">${o.seg.map(([v,t])=>`<button type="button" data-v="${v}">${t}</button>`).join('')}</div></div>`
  :`<div class="opt"><label>${o.label}<output data-out="${o.k}"></output></label><input type="range" data-set="${o.k}" aria-label="${o.label}" min="${o.range[0]}" max="${o.range[1]}" step="${o.range[2]}"></div>`).join('');
function setSetting(k,v){SET[k]=v;try{localStorage.setItem('riftline.settings',JSON.stringify(SET));}catch(e){}syncSettingsUI();if(k==='scheme'||k==='amove')applySettings();}
function syncSettingsUI(){
  for(const el of document.querySelectorAll('.seg[data-set]'))for(const b of el.children)b.setAttribute('aria-pressed',String(b.dataset.v===SET[el.dataset.set]));
  for(const el of document.querySelectorAll('input[data-set]'))if(+el.value!==SET[el.dataset.set])el.value=SET[el.dataset.set];
  for(const el of document.querySelectorAll('output[data-out]'))el.textContent=SET[el.dataset.out]+'%';
  for(const el of document.querySelectorAll('input[data-set="sens"]')){let n=el.parentNode.querySelector('.na');if(!lockOK&&!n){n=document.createElement('div');n.className='na';n.textContent='This page is not allowed to capture the mouse here, so the system speed applies.';el.parentNode.appendChild(n);}}
}
function applySettings(){
  syncSettingsUI();
  const c=classic(),am=SET.amove==='key'?'<b>A</b> attack-move':'<b>A</b> + click attack-move';
  const rc=G&&isCol()?'':' · <b>B</b> recall';
  $('help').innerHTML=c?`<b>Right click</b> move or attack · ${am} · <b>S</b> stop · <b>Q W E R</b> abilities · <b>Space</b> dash${rc}<br><b>Shift + key</b> or <b>+</b> to level an ability · <b>Y</b> camera lock · <b>M</b> sound · <b>Esc</b> ${NET.live?'menu':'pause'}`
    :`<b>WASD</b> move · <b>Left click</b> attack · <b>Q E RMB R</b> abilities · <b>Space</b> dash${rc}<br><b>Shift + key</b> or <b>+</b> to level an ability · <b>Y</b> camera lock · <b>M</b> sound · <b>Esc</b> ${NET.live?'menu':'pause'}`;
  $('keysList').innerHTML=(c?[['Right click','Walk there, or attack what you click'],[SET.amove==='key'?'A':'A + left click','Attack-move'],['S','Stop'],['Q · W · E · R','Damage · movement · utility · ultimate, aimed at the cursor'],['Space','Dash (5s cooldown)'],['B','Recall to base (8s)'],['Y','Lock or unlock the camera'],['Shift + key','Spend ability point'],['Esc','Pause'],['M','Sound on or off']]
    :[['W A S D','Move'],['Mouse','Aim and face'],['Left click','Attack (hold to repeat)'],['Q · E · R','Damage · movement · ultimate'],['Right click','Utility ability'],['Space','Dash (5s cooldown)'],['B','Recall to base (8s)'],['Y','Lock or unlock the camera'],['Shift + key','Spend ability point'],['Esc','Pause'],['M','Sound on or off']]).map(([k,v])=>`<div><b>${k}</b>${v}</div>`).join('');
  $('pauseLede').textContent=c?`Right click the ground to walk there, or an enemy to attack it; you keep attacking until you give another order. ${SET.amove==='key'?'Press A to attack-move toward your cursor':'Press A then left click to attack-move'}, S to stop. Abilities fire toward your cursor. You keep moving while you attack, a little slower while each swing winds up.`
    :'Left click attacks the enemy under your cursor if it is in range. Otherwise you swing toward your cursor and hit the nearest enemy in front of you. You keep moving while you attack, a little slower while each swing winds up.';
  for(const b of document.querySelectorAll('#cards .card'))b.querySelector('ul').innerHTML=kitItems(CH[b.dataset.k]);
  for(const k in keys)keys[k]=false;amove=false;
  if(G){const order=ABK;for(const k of ABK){const sl=slotEls[k];if(!sl)continue;sl.d.style.order=1+order.indexOf(k);sl.d.querySelector('.key').textContent=keyLabel(k);}
    if(slotEls.DASH)slotEls.DASH.d.style.order=9;G.player.order=null;hudDirty=true;}
}
for(const el of document.querySelectorAll('.seg[data-set]'))for(const b of el.children)b.addEventListener('click',()=>setSetting(el.dataset.set,b.dataset.v));
for(const el of document.querySelectorAll('input[data-set]'))el.addEventListener('input',()=>setSetting(el.dataset.set,+el.value));
// ---- cursor speed: a page cannot change the system pointer speed, so any speed other than 100% captures the mouse (pointer lock) and steers a virtual cursor ----
let lockOK=true,lockWorked=false,lockLostAt=0,hovEl=null;
const isLocked=()=>document.pointerLockElement===cv;
function tryLock(){if(SET.sens===100||!lockOK||!G||G.paused||G.over||isLocked())return;try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
document.addEventListener('pointerlockchange',()=>{if(isLocked()){lockWorked=true;return;}lockLostAt=performance.now();if(hovEl){hovEl.dispatchEvent(new MouseEvent('mouseleave'));hovEl=null;}
  if(G&&!G.paused&&!G.over)setPause(true);});
document.addEventListener('pointerlockerror',()=>{if(!lockWorked){lockOK=false;syncSettingsUI();showReason('nolock');}});
// while captured, DOM hover and clicks are routed by hand to whatever sits under the virtual cursor
function lockHover(){const el=document.elementFromPoint(mouse.x,mouse.y),sl=el&&el.closest('.slot');if(sl!==hovEl){if(hovEl)hovEl.dispatchEvent(new MouseEvent('mouseleave'));hovEl=sl;if(sl)sl.dispatchEvent(new MouseEvent('mouseenter'));}}
function lockClick(){const el=document.elementFromPoint(mouse.x,mouse.y);if(!el||el===cv)return false;const b=el.closest('button');if(b){b.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}));b.click();}return true;}
// the game cursor is a small canvas above the HUD so it stays visible over panels and while the mouse is captured
const curC=$('cur'),curG=curC.getContext('2d');let curKey='',curHX=0,curHY=0;
function updateCursor(){const show=!!G&&!G.paused&&!G.over&&(mouse.in||isLocked());curC.style.display=show?'block':'none';if(!show)return;
  const hot=!!G.hover||(classic()&&amove),ring=classic()&&amove,key=SET.cursor+hot+ring+DPR;
  if(key!==curKey){curKey=key;const pad=Math.round(14*DPR);
    if(SET.cursor==='hand'){const s=Math.max(2,Math.round(1.6*DPR)),h=handSprite(hot);curC.width=h.width*s+pad*2;curC.height=h.height*s+pad*2;curG.imageSmoothingEnabled=false;curG.clearRect(0,0,curC.width,curC.height);
      curG.drawImage(h,pad,pad,h.width*s,h.height*s);curHX=pad+5.5*s;curHY=pad+0.5*s;}
    else{const n=Math.round(36*DPR);curC.width=curC.height=n;curHX=curHY=n/2;curG.clearRect(0,0,n,n);curG.strokeStyle=hot?'#ff6a5e':'#eaf2f2';curG.lineWidth=2*DPR;const c=n/2,d=DPR;
      curG.beginPath();curG.arc(c,c,9*d,0,TAU);curG.stroke();curG.beginPath();for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){curG.moveTo(c+ax*11*d,c+ay*11*d);curG.lineTo(c+ax*16*d,c+ay*16*d);}curG.stroke();}
    if(ring){curG.strokeStyle='#ff5d52';curG.lineWidth=2*DPR;curG.beginPath();curG.arc(curHX,curHY,12*DPR,0,TAU);curG.stroke();}
    curC.style.width=curC.width/DPR+'px';curC.style.height=curC.height/DPR+'px';}
  curC.style.transform=`translate(${mouse.x-curHX/DPR}px,${mouse.y-curHY/DPR}px)`;}
let camFree=false;
function toggleCam(){camFree=!camFree;const b=$('camBtn');b.setAttribute('aria-pressed',String(camFree));b.textContent=camFree?'Camera unlocked · Y':'Camera locked · Y';}
$('camBtn').addEventListener('click',()=>{toggleCam();$('camBtn').blur();});
$('readyBtn').addEventListener('click',()=>{if(G&&G.col&&G.col.state==='prep'&&!prepUi.sent){pushEv(['rd']);prepUi.sent=true;updatePrep();}$('readyBtn').blur();});

// ================= sound =================
// Small synthesized effects; nothing is loaded. Volume falls off with distance from the camera.
const SFX={ac:null,master:null,muted:false,nb:null,
  init(){if(this.ac)return;try{const AC=window.AudioContext||window.webkitAudioContext;this.ac=new AC();this.master=this.ac.createGain();this.master.gain.value=0.55;this.master.connect(this.ac.destination);}catch(e){this.ac=null;}},
  env(g,t0,a,d,peak){g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t0+a);g.gain.exponentialRampToValueAtTime(0.0001,t0+a+d);},
  noise(dur,freq,q,peak,to){const ac=this.ac;if(!this.nb){const b=ac.createBuffer(1,ac.sampleRate*0.5,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.nb=b;}
    const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),t0=ac.currentTime;s.buffer=this.nb;f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(freq,t0);if(to)f.frequency.exponentialRampToValueAtTime(to,t0+dur);
    this.env(g,t0,0.006,dur,peak);s.connect(f);f.connect(g);g.connect(this.master);s.start(t0);s.stop(t0+dur+0.05);},
  tone(f0,f1,dur,peak,type){const ac=this.ac,t0=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
    this.env(g,t0,0.004,dur,peak);o.connect(g);g.connect(this.master);o.start(t0);o.stop(t0+dur+0.05);},
  play(name,x,y,mult){
    if(!this.ac||this.muted||!G)return;if(this.ac.state==='suspended')this.ac.resume();
    const v=(x===undefined?1:clamp(1-hyp(x-cam.x,y-cam.y)/1700,0,1))*(mult===undefined?1:mult);if(v<0.03)return;
    try{switch(name){
      case'swing':this.noise(0.14,600,1.1,0.32*v,2800);break;
      case'hit':this.tone(180,55,0.13,0.45*v,'triangle');this.noise(0.07,1700,0.8,0.25*v);break;
      case'crit':this.tone(240,50,0.2,0.5*v,'square');this.noise(0.12,2400,0.7,0.3*v);break;
      case'tick':this.noise(0.05,1500,1,0.12*v);break;
      case'cast':this.tone(300,640,0.15,0.12*v,'sawtooth');this.noise(0.16,1200,2,0.14*v,400);break;
      case'dash':this.noise(0.22,400,1.4,0.22*v,1900);break;
      case'tower':this.tone(900,200,0.24,0.1*v,'sawtooth');break;
      case'towerHit':this.tone(130,40,0.22,0.5*v);this.noise(0.12,600,0.7,0.3*v);break;
      case'level':[523,659,784].forEach((f,i)=>setTimeout(()=>{try{this.tone(f,f*1.01,0.18,0.12*v,'triangle');}catch(e){}},i*80));break;
      case'death':this.tone(320,55,0.7,0.28*v,'sawtooth');break;
      case'quake':this.noise(0.55,140,0.7,0.45*v,60);this.tone(80,35,0.45,0.35*v);break;
    }}catch(e){}
  }
};
function shake(mag,dur){if(!G)return;if(!G.shake||G.shake.t<=0||mag>=G.shake.mag)G.shake={t:dur,dur,mag};}
function impact(t,col,big){G.fx.push({k:'impact',x:t.x,y:t.y,z:heightOf(t)*0.5,t:0,dur:0.2,col,big,rays:Array.from({length:6},(_,i)=>i/6*TAU+rnd(-0.3,0.3))});}

// ================= HUD =================
let hudDirty=true;const slotEls={};
function drawIcon(g,key,k,form){
  const S=g.canvas.width;g.setTransform(S/52,0,0,S/52,0,0);
  if(key==='viktor'){drawVikIcon(g,k,form);return;}
  if(key==='blackjack'){drawBJIcon(g,k);return;}
  const gr=g.createRadialGradient(26,22,4,26,26,40);
  if(key==='cora'){gr.addColorStop(0,'#5a3a2a');gr.addColorStop(1,'#140c0a');}else{gr.addColorStop(0,'#5a1f2b');gr.addColorStop(1,'#14080b');}
  g.fillStyle=gr;g.fillRect(0,0,52,52);g.lineCap='round';g.lineJoin='round';
  const L=key==='cora'?'#ffe2c4':'#ffe6ea',M=key==='cora'?'#ff9a52':'#ff6b7a';
  if(key==='cora'){
    const axe=(x,y,rot,col,edge)=>{g.save();g.translate(x,y);g.rotate(rot);g.strokeStyle='#6b4a2b';g.lineWidth=3.5;g.beginPath();g.moveTo(-14,0);g.lineTo(14,0);g.stroke();g.fillStyle=col;g.beginPath();g.moveTo(5,0);g.lineTo(10,-14);g.quadraticCurveTo(21,-7,18,6);g.lineTo(10,3);g.closePath();g.fill();g.strokeStyle=edge;g.lineWidth=2;g.beginPath();g.moveTo(10,-14);g.quadraticCurveTo(21,-7,18,6);g.stroke();g.restore();};
    if(k==='Q'){axe(28,22,-0.6,'#d8a050','#ffcf7a');g.strokeStyle='#ffb347';g.lineWidth=2;g.setLineDash([3,4]);g.beginPath();g.moveTo(6,46);g.quadraticCurveTo(10,28,22,26);g.stroke();g.setLineDash([]);g.strokeStyle='rgba(255,179,71,.7)';g.beginPath();g.ellipse(36,40,9,4,0,0,TAU);g.stroke();}
    if(k==='RMB'){g.fillStyle='#140d0a';g.beginPath();g.moveTo(6,46);g.lineTo(14,38);g.lineTo(20,40);g.lineTo(28,28);g.lineTo(34,30);g.lineTo(46,14);g.lineTo(44,22);g.lineTo(36,34);g.lineTo(30,34);g.lineTo(22,46);g.lineTo(14,44);g.closePath();g.fill();g.strokeStyle='#ff8c32';g.lineWidth=1.6;g.beginPath();g.moveTo(9,45);g.lineTo(18,41);g.lineTo(28,31);g.lineTo(40,22);g.stroke();g.fillStyle='#9a8670';for(const [x,y,r2] of [[20,30,3],[34,20,2.5],[40,36,3],[12,34,2]]){g.beginPath();g.arc(x,y,r2,0,TAU);g.fill();}axe(40,12,-2.2,'#d8a050','#ffcf7a');}
    if(k==='E'){g.lineWidth=1.6;for(let i=0;i<7;i++){const x=8+i*3.6,y=44-i*3.2;g.strokeStyle=i%2?'#7e93a6':'#d3dee8';g.beginPath();g.ellipse(x,y,i%2?1.2:3,i%2?3:1.6,-0.7,0,TAU);g.stroke();}axe(36,16,-0.7,'#9fb6c8','#7cd0ff');}
    if(k==='R'){g.fillStyle='rgba(122,43,214,.35)';g.beginPath();g.ellipse(26,30,20,12,0,0,TAU);g.fill();g.strokeStyle='#b98be6';g.lineWidth=2;g.setLineDash([3,2]);g.beginPath();g.ellipse(26,30,20,12,0,0,TAU);g.stroke();g.setLineDash([]);
      g.strokeStyle='#2a0f45';g.lineWidth=3;for(let i=0;i<8;i++){const a=i/8*TAU,x=26+Math.cos(a)*20,y=30+Math.sin(a)*12;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-9);g.stroke();}
      g.fillStyle='#f0d6ff';for(let i=0;i<8;i++){const a=i/8*TAU;g.beginPath();g.arc(26+Math.cos(a)*20,30+Math.sin(a)*12-9,1.6,0,TAU);g.fill();}axe(26,26,-1.57,'#d8a050','#ffcf7a');}
    if(k==='P'){const gr2=g.createRadialGradient(26,26,2,26,26,22);gr2.addColorStop(0,'#e9c2ff');gr2.addColorStop(1,'rgba(120,40,200,0)');g.fillStyle=gr2;g.fillRect(0,0,52,52);g.strokeStyle='#7a2bd6';g.lineWidth=2.5;for(const [a,b,c2,d2] of [[26,26,10,10],[26,26,44,14],[26,26,16,44],[26,26,40,42]]){g.beginPath();g.moveTo(a,b);g.quadraticCurveTo((a+c2)/2+5,(b+d2)/2-5,c2,d2);g.stroke();}}
    if(k==='DASH'){g.strokeStyle=M;g.lineWidth=3;g.setLineDash([4,4]);g.beginPath();g.moveTo(8,42);g.quadraticCurveTo(26,0,44,40);g.stroke();g.setLineDash([]);g.fillStyle=L;g.beginPath();g.moveTo(46,44);g.lineTo(36,38);g.lineTo(46,32);g.closePath();g.fill();g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(44,46,8,3,0,0,TAU);g.fill();}
  }else{
    const star=(x,y,r)=>{g.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU+0.3,rr=i%2?r*0.35:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();g.fill();};
    if(k==='Q'){g.strokeStyle=L;g.lineWidth=4;g.beginPath();g.arc(8,40,30,-1.25,-0.15);g.stroke();g.beginPath();g.arc(44,40,30,PI+0.15,PI+1.25);g.stroke();g.fillStyle='#ff4d61';star(26,16,8);}
    if(k==='RMB'){g.strokeStyle=M;g.lineWidth=1.5;for(const [x,y] of [[16,22],[28,14],[38,26]]){g.beginPath();g.moveTo(x-12,y+12);g.lineTo(x-3,y+3);g.stroke();}g.fillStyle=L;for(const [x,y] of [[16,22],[28,14],[38,26]])star(x,y,7);g.fillStyle='#ff4d61';g.beginPath();g.arc(40,40,3,0,TAU);g.fill();}
    if(k==='E'){g.fillStyle=M;g.globalAlpha=0.6;g.beginPath();g.arc(26,26,9,0,TAU);g.fill();g.globalAlpha=1;g.strokeStyle=L;g.lineWidth=3;g.beginPath();g.moveTo(6,42);g.lineTo(44,12);g.stroke();g.fillStyle=L;g.beginPath();g.moveTo(47,10);g.lineTo(36,13);g.lineTo(44,21);g.closePath();g.fill();}
    if(k==='DASH'){g.fillStyle=M;g.globalAlpha=0.35;g.beginPath();g.arc(14,30,9,0,TAU);g.fill();g.globalAlpha=0.6;g.beginPath();g.arc(24,26,9,0,TAU);g.fill();g.globalAlpha=1;g.fillStyle=L;g.beginPath();g.arc(38,22,9,0,TAU);g.fill();for(let i=0;i<5;i++){g.fillRect(30+i*4,36-i*3,2,2);}}
    if(k==='R'){g.lineCap='round';g.strokeStyle='#ff4d61';g.lineWidth=8;g.beginPath();g.moveTo(10,10);g.lineTo(42,42);g.moveTo(42,10);g.lineTo(10,42);g.stroke();g.strokeStyle='#fff3f4';g.lineWidth=3;g.stroke();}
    if(k==='P'){g.strokeStyle=L;g.lineWidth=3.5;g.beginPath();g.arc(4,44,32,-1.2,-0.25);g.stroke();g.beginPath();g.arc(48,44,32,PI+0.25,PI+1.2);g.stroke();g.strokeStyle='#ff4d61';g.lineWidth=3;g.beginPath();g.moveTo(20,30);g.lineTo(32,42);g.moveTo(32,30);g.lineTo(20,42);g.stroke();}
  }
}
// Viktor's icons change with his form
function drawVikIcon(g,k,form){const m=form==='monster',gr=g.createRadialGradient(26,22,4,26,26,40);gr.addColorStop(0,m?'#6a2414':'#4a3424');gr.addColorStop(1,'#120a08');g.fillStyle=gr;g.fillRect(0,0,52,52);
  g.lineCap='round';g.lineJoin='round';const L='#ffe6c8',M=m?'#ff6a3d':'#ffb36b';
  const claws=()=>{g.strokeStyle=M;g.lineWidth=3.5;for(let i=0;i<3;i++){g.beginPath();g.moveTo(12+i*9,10);g.quadraticCurveTo(22+i*9,26,14+i*9,44);g.stroke();}};
  if(k==='Q'){if(m)claws();else{g.strokeStyle=M;g.lineWidth=2.5;g.beginPath();g.arc(32,24,11,0,TAU);g.moveTo(32,8);g.lineTo(32,40);g.moveTo(16,24);g.lineTo(48,24);g.stroke();g.strokeStyle=L;g.lineWidth=3;g.beginPath();g.moveTo(4,40);g.lineTo(26,28);g.stroke();}}
  if(k==='RMB'){if(m){g.fillStyle=L;for(let i=0;i<8;i++){const a=i/8*TAU;g.save();g.translate(26+Math.cos(a)*14,26+Math.sin(a)*14);g.rotate(a);g.beginPath();g.moveTo(8,0);g.lineTo(-3,-4);g.lineTo(-3,4);g.closePath();g.fill();g.restore();}g.fillStyle=M;g.beginPath();g.arc(26,26,6,0,TAU);g.fill();}
    else{g.fillStyle='#4a3424';g.fillRect(4,30,20,7);g.fillStyle='#8a6a4a';g.fillRect(4,30,8,7);g.fillStyle=M;g.beginPath();g.moveTo(24,33);g.lineTo(48,18);g.lineTo(48,48);g.closePath();g.fill();
      g.fillStyle=L;for(const [x,y] of [[34,28],[40,34],[44,24],[38,40],[46,42]]){g.fillRect(x,y,2.5,2.5);}g.strokeStyle=L;g.lineWidth=2;g.beginPath();g.moveTo(16,44);g.lineTo(6,44);g.moveTo(10,40);g.lineTo(6,44);g.lineTo(10,48);g.stroke();}}
  if(k==='E'){if(m){g.strokeStyle=M;g.lineWidth=3;g.setLineDash([3,4]);g.beginPath();g.moveTo(6,44);g.quadraticCurveTo(24,0,44,38);g.stroke();g.setLineDash([]);g.fillStyle=L;g.beginPath();g.ellipse(44,42,9,3,0,0,TAU);g.fill();}
    else{g.strokeStyle='#b8473c';g.lineWidth=3;g.beginPath();g.moveTo(6,44);for(let i=1;i<=6;i++)g.lineTo(6+i*6,44-i*5+(i%2?3:-3));g.stroke();g.fillStyle=L;g.beginPath();g.moveTo(48,10);g.lineTo(38,12);g.lineTo(42,20);g.closePath();g.fill();}}
  if(k==='R'){g.fillStyle='#2a120c';g.beginPath();g.ellipse(26,30,14,16,0,0,TAU);g.fill();g.strokeStyle='#e8d2a8';g.lineWidth=4;g.beginPath();g.moveTo(14,22);g.quadraticCurveTo(6,10,12,4);g.moveTo(38,22);g.quadraticCurveTo(46,10,40,4);g.stroke();g.fillStyle=M;g.beginPath();g.arc(20,28,3,0,TAU);g.arc(32,28,3,0,TAU);g.fill();}
  if(k==='P'){g.fillStyle='#b81e1e';g.beginPath();g.moveTo(26,8);g.quadraticCurveTo(42,30,26,44);g.quadraticCurveTo(10,30,26,8);g.fill();g.fillStyle=M;g.beginPath();g.moveTo(26,22);g.quadraticCurveTo(33,32,26,40);g.quadraticCurveTo(19,32,26,22);g.fill();}
  if(k==='DASH'){g.strokeStyle=M;g.lineWidth=3;g.beginPath();g.arc(26,28,14,PI*0.9,PI*2.3);g.stroke();g.fillStyle=L;g.beginPath();g.moveTo(40,34);g.lineTo(34,26);g.lineTo(44,26);g.closePath();g.fill();}}
function refreshIcons(){const p=G&&G.player;if(!p)return;for(const k of [...ABK,'DASH']){const s2=slotEls[k];if(s2)drawIcon(s2.d.querySelector('canvas').getContext('2d'),p.key,k,p.form);}hudDirty=true;}
function drawPortrait(cvs,key,team){const g=cvs.getContext('2d');const S=cvs.width;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,S,S);
  const gr=g.createRadialGradient(S/2,S/2,4,S/2,S/2,S/2);gr.addColorStop(0,key==='cora'?'#5a2a1c':'#3a1820');gr.addColorStop(1,'#0b1215');g.fillStyle=gr;g.fillRect(0,0,S,S);
  if(key==='viktor'&&VIK_READY){const S2=VIK_SHEETS.human,f=S*0.95/S2.h;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    g.drawImage(S2.img,0,0,S2.cw,S2.ch,S/2-S2.ax*f,S*0.99-S2.ay*f,S2.cw*f,S2.ch*f);return;}
  if(key==='blackjack'&&BJ_READY){const S2=BJ_SHEETS.move,f=S*0.92/S2.h;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    g.drawImage(S2.img,0,0,S2.cw,S2.ch,S/2-S2.ax*f,S*0.97-S2.ay*f,S2.cw*f,S2.ch*f);return;}
  if(key==='cora'&&CORA_READY){const S2=CORA_SHEET,f=S*0.95/S2.h;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    g.drawImage(S2.img,0,0,S2.cw,S2.ch,S/2-S2.ax*f,S*0.99-S2.ay*f,S2.cw*f,S2.ch*f);return;}
  if(key==='shade'&&SHEETS_READY){const S2=SHEETS.auto,f=S*0.92/S2.h;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    g.drawImage(S2.img,0,0,S2.cw,S2.ch,S/2-S2.ax*f,S*0.97-S2.ay*f,S2.cw*f,S2.ch*f);return;}
  if(key==='shade'){const k=S*0.92/105,spr=bake(rigShade('idle',0.25,1),3*PI/4-0.35,k,CHAMP_BOX,'#0a0809',true);g.drawImage(spr.c,Math.round(S/2-spr.ax),Math.round(S*0.97-spr.ay));return;}
  const k=0.42,spr=bake((key==='cora'?rigAria:rigShade)('idle',0.25,1),3*PI/4-0.35,k,CHAMP_BOX),f=Math.max(1,Math.floor(S/(110*k)));
  g.imageSmoothingEnabled=false;g.drawImage(spr.c,Math.round(S/2-spr.ax*f),Math.round(S*0.93-spr.ay*f),spr.c.width*f,spr.c.height*f);}
function buildHud(){
  const p=G.player,el=$('slots');el.innerHTML='';
  if(p.def.passive){const d=document.createElement('div');d.className='slot pslot';d.innerHTML='<canvas width="84" height="84"></canvas><span class="key">P</span>';
    drawIcon(d.querySelector('canvas').getContext('2d'),p.key,'P');d.addEventListener('mouseenter',()=>showTip('P',d));d.addEventListener('mouseleave',()=>{$('tip').hidden=true;tipK=null;});el.appendChild(d);}
  for(const k of ABK){const a=p.def.ab[k];const d=document.createElement('div');d.className='slot';
    d.innerHTML=`<canvas width="108" height="108"></canvas><div class="cd"></div><span class="cdt"></span><span class="key">${keyLabel(k)}</span><span class="cost"></span><span class="chg"></span><div class="pips">${'<i></i>'.repeat(a.max)}</div><button type="button" class="up" hidden aria-label="Level up ${a.name}">+</button>`;
    drawIcon(d.querySelector('canvas').getContext('2d'),p.key,k,p.form);
    d.querySelector('.up').addEventListener('mousedown',e=>{e.stopPropagation();e.preventDefault();pushEv(['r',k]);});
    d.addEventListener('mouseenter',()=>showTip(k,d));d.addEventListener('mouseleave',()=>{$('tip').hidden=true;tipK=null;});
    el.appendChild(d);slotEls[k]={d,cd:d.querySelector('.cd'),cdt:d.querySelector('.cdt'),cost:d.querySelector('.cost'),chg:d.querySelector('.chg'),pips:[...d.querySelectorAll('.pips i')],up:d.querySelector('.up'),last:''};}
  {const d=document.createElement('div');d.className='slot dashslot';
    d.innerHTML=`<canvas width="108" height="108"></canvas><div class="cd"></div><span class="cdt"></span><span class="key">SPACE</span>`;
    drawIcon(d.querySelector('canvas').getContext('2d'),p.key,'DASH');
    d.addEventListener('mouseenter',()=>showTip('DASH',d));d.addEventListener('mouseleave',()=>{$('tip').hidden=true;tipK=null;});
    el.appendChild(d);slotEls.DASH={d,cd:d.querySelector('.cd'),cdt:d.querySelector('.cdt'),last:''};}
  drawPortrait($('portC'),p.key,p.team);
  $('resM').classList.toggle('energy',p.def.resource==='Energy');$('resM').classList.toggle('fury',p.def.resource==='Fury');$('resM').classList.toggle('corrupt',p.def.resource==='Corruption');$('resM').classList.toggle('luck',p.def.resource==='Luck');
  $('goal').textContent=G.mode==='col'?`Best of 3 · Round ${G.col.round}`:`First to ${G.killsToWin} kill${G.killsToWin>1?'s':''} or the tower`;
  $('feed').innerHTML='';
  applySettings();
}
let tipK=null,tipEl=null;
function showTip(k,el){tipK=k;tipEl=el;renderTip();}
function renderTip(){
  if(!tipK)return;const p=G.player,tip=$('tip');
  if(tipK==='DASH')tip.innerHTML=`<h4>${p.def.dash.name}</h4><div class="meta">Space · ${DASH_CD}s cooldown, not reduced by ability haste</div>${p.def.dash.desc}`;
  else if(tipK==='P')tip.innerHTML=`<h4>${p.def.passive.name}</h4><div class="meta">Passive</div>${p.def.passive.desc(p)}`;
  else{const a=p.def.ab[tipK],r=p.ranks[tipK],rr=Math.max(1,r);
  tip.innerHTML=`<h4>${a.name}</h4><div class="meta">${keyName(tipK)} · Rank ${r}/${a.max} · ${(a.cd[rr-1]*100/(100+p.ah)).toFixed(1)}s cooldown${a.cost[rr-1]?` · ${a.cost[rr-1]} ${p.def.resource.toLowerCase()}`:''}</div>${a.desc(p,rr,a)}${r===0?'<div class="meta" style="margin:6px 0 0">Not learned yet. Showing rank 1 values.</div>':''}`;}
  tip.hidden=false;const b=tipEl.getBoundingClientRect(),tb=tip.getBoundingClientRect();
  tip.style.left=clamp(b.left+b.width/2-tb.width/2,8,VW-tb.width-8)+'px';tip.style.top=(b.top-tb.height-34)+'px';
}
const fmtT=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
let hudAcc=0;
function hud(dt){
  if(!G)return;const p=G.player;
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on');}
  while(G.feedQ.length){const h=G.feedQ.shift();const d=document.createElement('div');d.className='fe';d.innerHTML=h;$('feed').prepend(d);setTimeout(()=>d.remove(),7000);while($('feed').children.length>5)$('feed').lastChild.remove();}
  for(const k of ABK){const s=slotEls[k];if(!s)continue;const a=p.def.ab[k],r=p.ranks[k];
    const cd=p.cds[k],tot=r?(vikMonster(p)&&a.mcd?a.mcd:a.cd)[r-1]*100/(100+p.ah):1,cost=r?a.cost[r-1]:a.cost[0];
    const rec=!!(a.canRecast&&a.canRecast(p)),av=a.avail?a.avail(p):true,chg=a.charges?(p.chg[k]??a.charges):a.ammo?a.ammo(p):null,out=chg!==null?chg<=0:cd>0;
    const st=`${r}|${cd>0?Math.ceil(cd*10):0}|${p.res<cost}|${canRank(p,k)}|${p.alive}|${rec}|${av}|${chg}`;
    if(st===s.last)continue;s.last=st;
    s.d.classList.toggle('locked',r===0);s.d.classList.toggle('nores',r>0&&!rec&&(p.res<cost||av!==true));s.d.classList.toggle('ready',r>0&&(rec||(av===true&&!out&&p.res>=cost)));
    s.d.classList.toggle('recast',rec);
    s.cd.style.background=cd>0&&!rec?`conic-gradient(rgba(0,0,0,${out?0.72:0.35}) ${cd/tot*360}deg, transparent 0)`:'none';
    s.cdt.textContent=rec||!out?'':cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';
    s.chg.textContent=chg!==null&&r>0?chg:'';
    s.cost.textContent=cost?cost:'';s.cost.style.color=resCol(p);
    s.pips.forEach((pi,i)=>pi.classList.toggle('on',i<r));
    s.up.hidden=!canRank(p,k);}
  {const s=slotEls.DASH,cd=p.dashCd,st=`${cd>0?Math.ceil(cd*10):0}|${p.alive}`;
    if(s&&st!==s.last){s.last=st;s.d.classList.toggle('ready',cd<=0);s.cd.style.background=cd>0?`conic-gradient(rgba(0,0,0,.72) ${cd/DASH_CD*360}deg, transparent 0)`:'none';s.cdt.textContent=cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';}}
  $('hpF').style.width=(p.hp/p.maxHp*100)+'%';$('hpT').textContent=`${n0(p.hp)} / ${n0(p.maxHp)}`;
  $('resF').style.width=(p.res/p.maxRes*100)+'%';$('resMark').hidden=!(p.key==='viktor'&&!vikMonster(p));$('resT').textContent=p.key==='blackjack'?(p.loaded?'Loaded · next shot fires both guns':'Land an ability to load both guns'):p.key==='viktor'?(vikMonster(p)?`Uncaged · ${n0(p.res)} Fury left`:`Fury ${n0(p.res)} / ${n0(p.maxRes)}`):p.def.resource==='Corruption'?`Corruption ${n0(p.res)} · +${corrStage(p)*3}% dealt · ${corrStage(p)*2}% life steal · +${corrStage(p)*2}% taken`:`${n0(p.res)} / ${n0(p.maxRes)}`;
  $('xpF').style.width=(p.level>=18?100:p.xp/XP_NEXT[p.level-1]*100)+'%';$('lvl').textContent=p.level;
  if(isCol()){$('sb').textContent=G.col.wins[BLUE];$('sr').textContent=G.col.wins[RED];$('clock').textContent=fmtT(G.col.t);}
  else{$('sb').textContent=G.score[BLUE];$('sr').textContent=G.score[RED];$('clock').textContent=fmtT(G.t);}
  const lh=$('lvlhint');if(p.points>0&&ABK.some(k=>canRank(p,k))){lh.hidden=false;lh.textContent=`${p.points} ability point${p.points>1?'s':''} · Shift + ${classic()?'Q / W / E / R':'Q / E / R / right click'}, or click +`;}else lh.hidden=true;
  $('death').hidden=p.alive||isCol();if(!p.alive)$('deathT').textContent=Math.ceil(p.respawnT);
  hudAcc+=dt;if(hudAcc<0.15&&!hudDirty)return;hudAcc=0;hudDirty=false;
  const ms=msOf(p);
  const rows=[['AD',n0(p.ad)],['AP',n0(p.ap)],['Armor',n0(p.armor)],['MR',n0(p.mr)],['Atk speed',asOf(p).toFixed(3)],['Crit',n0(p.crit*100)+'%'],['Move speed',n0(ms)],['Range',p.range],['Lethality',n0(p.lethality)],['Armor pen',n0(p.armorPenPct*100)+'%'],['Ability haste',n0(p.ah)],['HP regen',(p.hp5).toFixed(1)+'/5s']];
  $('stats').innerHTML=rows.map(r=>`<div class="s"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')+(p.augList&&p.augList.length?`<div class="s augrow"><span>Augments</span><b>${p.augList.map(id=>AUG[id].name).join(', ')}</b></div>`:'');
  if(isCol())updatePrep();
  if(isCol()){const C=G.col,cp=C.cp||{openAt:0};const st=C.t<COL.STORM_DELAY?`Storm in ${Math.ceil(COL.STORM_DELAY-C.t)}s`:C.storm&&C.storm.r>COL.STORM_MIN+1?'Storm closing':'Storm at full strength';
    $('waveinfo').textContent=`${C.t<cp.openAt?`Control point in ${Math.ceil(cp.openAt-C.t)}s`:'Control point open'} · ${st}`;}
  else{const nw=G.nextWave-G.t;const sup=(G.waveN+1)%3===0;$('waveinfo').textContent=`Wave ${G.waveN+1}${sup?' · super minion':''} in ${Math.ceil(nw)}s`;}
  if(tipK)renderTip();
  drawMini();
}
function drawMini(){
  const c=$('mini'),g=c.getContext('2d'),w=c.width,h=c.height,sx=w/W,sy=h/H;
  if(isCol()){drawColMini(g,w,h);return;}
  // top-down: the bridge deck, its brush and crystals, then towers, minions and champions
  const fx=x=>(x+400)/(W+800)*w,fy=y=>(y+500)/2400*h;
  g.clearRect(0,0,w,h);g.fillStyle='#7a6447';g.strokeStyle='#2a2118';g.lineWidth=1.5;g.beginPath();for(const [x,y] of LANE_POLY)g.lineTo(fx(x),fy(y));g.closePath();g.fill();g.stroke();
  g.fillStyle='#2f6a34';for(const b of LANE_BUSHES){g.beginPath();g.ellipse(fx(b.x),fy(b.y),b.r*w/(W+800),b.r*h/2400,0,0,TAU);g.fill();}
  for(const r of G.relics){g.fillStyle=r.active?'#7dffb0':'#3c5a40';g.fillRect(fx(r.x)-2.5,fy(r.y)-2.5,5,5);}
  for(const t of [BLUE,RED]){g.fillStyle=TEAMC[t]+'55';g.beginPath();g.arc(fx(FOUNT[t].x),fy(FOUNT[t].y),12,0,TAU);g.fill();const tw=G.towers[t];g.fillStyle=tw.alive?TEAMC[t]:'#555';g.fillRect(fx(tw.x)-6,fy(tw.y)-6,12,12);}
  for(const m of G.minions)if(m.alive){g.fillStyle=TEAMC[m.team];g.fillRect(fx(m.x)-2,fy(m.y)-2,m.mtype==='super'?6:4,m.mtype==='super'?6:4);}
  for(const ch of G.champs){if(!ch.alive)continue;if(ch.team!==G.player.team&&!targetable(ch))continue;g.fillStyle=TEAMC[ch.team];g.beginPath();g.arc(fx(ch.x),fy(ch.y),6,0,TAU);g.fill();if(ch===G.player){g.strokeStyle='#fff';g.lineWidth=2;g.stroke();}}
  const vw=2400;g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1.5;g.strokeRect(fx(cam.x-vw/2),1,vw*w/(W+800),h-2);
}

// ================= the lane: a bridge over the abyss, from the bridge art =================
// The camera turns to the art's own heading on this map, so the art is drawn exactly as painted, at one uniform scale: its deck runs along the world x axis,
// the platform glows sit on the fountains and the small emblems under the towers; mirrored copies pad it so the abyss runs past the screen edge.
const LANE_ART=(function(){const L=[201,625],R=[1611,152],psi=Math.atan((L[1]-R[1])/(R[0]-L[0])/IK);
  return{L,psi,cs:Math.cos(psi),sn:Math.sin(psi),sig:(FOUNT[1].x-FOUNT[0].x)*Math.cos(psi)/(R[0]-L[0]),off:[-44,-32],pad:600,res:2,img:null,src:null};})();
const laneArtW=(ix,iy)=>{const A=LANE_ART,u=A.sig*(ix-A.L[0]),v=A.sig*(iy-A.L[1])/IK;return{x:FOUNT[0].x+u*A.cs-v*A.sn+A.off[0],y:FOUNT[0].y+u*A.sn+v*A.cs+A.off[1]};};
(function(){const im=new Image();im.onload=()=>{const p=LANE_ART.pad*LANE_ART.res,c=document.createElement('canvas');c.width=im.width+2*p;c.height=im.height+2*p;const g=c.getContext('2d');
  for(const sx of [-1,0,1])for(const sy of [-1,0,1]){g.setTransform(sx?-1:1,0,0,sy?-1:1,p+(sx>0?2*im.width:0),p+(sy>0?2*im.height:0));g.drawImage(im,0,0);}
  LANE_ART.img=c;LANE_ART.src=im;for(const btn of document.querySelectorAll('#maps .mapcard[data-v="lane"]'))drawMapThumb(btn.querySelector('canvas'),'lane');};im.src='assets/lane.webp';})();
// the deck, traced on the art clockwise from the blue platform's far side along the foot of every wall, pillar and stair, so nothing that looks like stone can be walked on;
// brush planters line the walls and an alcove opens off each side of the middle
const LANE_POLY=[[60,640],[58,612],[70,582],[90,557],[130,533],[180,517],[240,511],[320,503],[355,490],[520,442],[600,404],[755,333],[762,338],[803,334],[803,292],[780,270],[777,248],[895,222],[904,228],[930,272],[946,276],[985,278],[1020,265],[1028,238],[1190,190],[1200,203],[1257,190],[1350,170],[1415,160],[1440,128],[1480,100],[1500,82],[1553,68],[1597,64],[1647,72],[1670,82],[1712,108],[1718,132],[1726,150],[1726,172],[1716,190],[1686,198],[1670,225],[1613,248],[1567,262],[1510,258],[1500,278],[1440,292],[1378,338],[1330,348],[1312,392],[1113,449],[1108,442],[1063,452],[1078,485],[1087,490],[1126,534],[970,580],[925,545],[922,510],[880,513],[875,535],[653,598],[648,582],[600,585],[597,596],[447,632],[395,640],[318,690],[300,688],[268,718],[180,722],[130,712],[95,688],[70,662]].map(([x,y])=>{const q=laneArtW(x,y);return[q.x,q.y];});
// brush: two patches per planter; standing in either hides you from anyone outside that planter
const LANE_BUSHES=[[628,398,140,0],[712,366,140,0],[1062,262,140,1],[1150,234,140,1],[708,566,140,2],[800,536,140,2],[1158,425,140,3],[1248,393,140,3]].map(([x,y,r,g])=>({...laneArtW(x,y),r,g}));
function laneInside(x,y){let ins=false;const N=LANE_POLY.length;
  for(let i=0,j=N-1;i<N;j=i++){const [xi,yi]=LANE_POLY[i],[xj,yj]=LANE_POLY[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)ins=!ins;}return ins;}
function laneEdge(x,y){let bd=1e18,bx=x,by=y;const N=LANE_POLY.length;
  for(let i=0,j=N-1;i<N;j=i++){const [ax,ay]=LANE_POLY[j],[cx2,cy2]=LANE_POLY[i],ex=cx2-ax,ey=cy2-ay;let t=((x-ax)*ex+(y-ay)*ey)/(ex*ex+ey*ey||1);t=t<0?0:t>1?1:t;
    const px=ax+ex*t,py=ay+ey*t,d=(x-px)*(x-px)+(y-py)*(y-py);if(d<bd){bd=d;bx=px;by=py;}}
  return{x:bx,y:by,d:Math.sqrt(bd)};}
// keep a unit of radius r on the deck: push it back along the nearest edge's inward side
function laneClamp(u,r){for(let k=0;k<2;k++){const ins=laneInside(u.x,u.y),q=laneEdge(u.x,u.y);if(ins&&q.d>=r)return;
  let nx=0,ny=MIDY>u.y?1:-1;if(q.d>1e-6){nx=(u.x-q.x)/q.d;ny=(u.y-q.y)/q.d;if(!ins){nx=-nx;ny=-ny;}}u.x=q.x+nx*r;u.y=q.y+ny*r;}}
function drawLaneArt(){const A=LANE_ART,p=A.pad;screenT();ctx.fillStyle='#1f3a63';ctx.fillRect(0,0,VW,VH);
  const o=laneArtW(-p,-p),u=laneArtW(1-p,-p),v=laneArtW(-p,1-p),O=P(o.x,o.y),U=P(u.x,u.y),V=P(v.x,v.y);
  ctx.save();ctx.transform(U.x-O.x,U.y-O.y,V.x-O.x,V.y-O.y,O.x,O.y);ctx.drawImage(A.img,0,0,A.img.width/A.res,A.img.height/A.res);ctx.restore();}

// ================= colosseum: a best-of-3 duel with gardens of brush and ruins, healing fruit, portals, a control point and a closing storm =================
// Prototype tuning, not validated balance.
const COL={cx:3200,cy:650,R:1060,WALL_H:130,PARAPET:30,STORM_DELAY:40,STORM_TIME:50,STORM_MIN:330,LEVELS:[6,11,16],PLANT_FIRST:12,PLANT_EVERY:30,
  CP_R:270,CP_OPEN:20,CP_TIME:4,CP_EVERY:35,PORTAL_OPEN:8,PORTAL_CD:12,PORTAL_R:44};
const colPt=(deg,r)=>{const a=deg*PI/180;return{a,x:COL.cx+Math.cos(a)*r,y:COL.cy+Math.sin(a)*r};};
// the painted arena: the art is the floor, and its pixels map onto the world (k art px per world unit across the screen, v extra squash down it)
const ARENA_ART={cx:628,cy:552,k:0.47,v:1.15,img:null};
(function(){const im=new Image();im.onload=()=>{ARENA_ART.img=im;for(const btn of document.querySelectorAll('#maps .mapcard[data-v="col"]'))drawMapThumb(btn.querySelector('canvas'),'col');};im.src='assets/arena.webp';})();
const artReady=()=>!!ARENA_ART.img;
const artW=(ix,iy)=>{const A=ARENA_ART,u=(ix-A.cx)/A.k/IC,w=(iy-A.cy)/(A.k*A.v*IK*IC);return{x:COL.cx+(u-w)/2,y:COL.cy+(u+w)/2};};
// layout read off the art: a gate at the top and bottom of the screen, a crystal fountain at each side, a garden of brush around ruined walls in each quarter,
// and the compass dial in the middle, which is the control point (screen up, right, down, left are world -45, 45, 135 and 225 degrees)
COL.alc=[];
COL.gardens=[[395,395],[862,395],[390,705],[866,705]].map(([x,y])=>{const q=artW(x,y);return{...q,a:Math.atan2(q.y-COL.cy,q.x-COL.cx)};});
// brush: two patches per garden; standing in any patch of a garden hides you from everyone outside that garden
COL.bushes=[[335,400,130,0],[420,328,100,0],[922,400,130,1],[838,328,100,1],[320,712,130,2],[400,762,105,2],[935,712,130,3],[858,764,105,3]].map(([x,y,r,g])=>({...artW(x,y),r,g}));
// the painted ruins block movement, shots and the chain hook
COL.rocks=[[440,392,62],[492,358,34],[388,432,52],[815,392,62],[765,362,34],[868,440,52],[372,684,64],[472,752,46],[400,632,30],[880,668,58],[800,752,52],[762,760,30]].map(([x,y,r],i)=>({...artW(x,y),r,v:i%2}));
// healing fruit where each garden opens onto the sand by the dial
COL.plantSpots=[[520,452],[738,452],[520,652],[738,652]].map(([x,y])=>artW(x,y));
COL.spawn=[225,45];  // degrees: blue starts on the left of the screen, red on the right
// portals at the two gates and the two fountains; each sends you to the opposite one, and a used pair rests before it works again
COL.portals=[[628,236,0],[628,838,0],[176,546,1],[1080,546,1]].map(([x,y,pair])=>{const q=artW(x,y);return{...q,pair,d:Math.atan2(q.y-COL.cy,q.x-COL.cx)*180/PI};});
// the wall's distance from the centre in every direction, from the edge of the painted floor (traced on the art, clockwise from the top gate)
const ARENA_EDGE=[[628,205],[665,206],[700,215],[760,218],[820,222],[870,230],[905,250],[950,274],[1000,305],[1040,340],[1060,380],[1072,420],[1082,455],[1100,495],[1114,545],[1100,592],[1095,630],[1092,670],[1080,705],[1050,760],[1015,795],[975,830],[930,855],[880,870],[840,878],[770,880],[700,882],[628,884],
  [556,882],[486,880],[414,878],[374,870],[324,855],[279,830],[239,795],[204,760],[174,705],[162,670],[159,630],[154,592],[140,545],[154,495],[172,455],[182,420],[194,380],[214,340],[254,305],[304,274],[349,250],[384,230],[434,222],[494,218],[554,215],[590,206]].map(([x,y])=>{const q=artW(x,y);return[q.x-COL.cx,q.y-COL.cy];});
COL.N=720;COL.rb=new Float32Array(COL.N);
for(let i=0;i<COL.N;i++){const th=i/COL.N*TAU,dx=Math.cos(th),dy=Math.sin(th);let r=COL.R;
  for(let j=0;j<ARENA_EDGE.length;j++){const [ax,ay]=ARENA_EDGE[j],[bx,by]=ARENA_EDGE[(j+1)%ARENA_EDGE.length],ex=bx-ax,ey=by-ay,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;
    const t=(ax*ey-ay*ex)/den,u=(ax*dy-ay*dx)/den;if(t>0&&u>=0&&u<=1){r=t;break;}}
  COL.rb[i]=r;}
COL.rbMax=Math.max(...COL.rb);
function colRB(th){let f=(((th%TAU)+TAU)%TAU)/TAU*COL.N;const i=Math.floor(f)%COL.N,j=(i+1)%COL.N;f-=Math.floor(f);return COL.rb[i]*(1-f)+COL.rb[j]*f;}
const isCol=()=>!!G&&G.mode==='col';
const colQuake=()=>G&&G.col&&G.col.quake&&G.col.quake.open?G.col.quake:null;
// keep a unit of radius r inside the walls, outside the ruins, and on its own side of an open earthquake fissure
function colClamp(u,r){
  let dx=u.x-COL.cx,dy=u.y-COL.cy,d=hyp(dx,dy);const lim=colRB(Math.atan2(dy,dx))-r;
  if(d>lim){u.x=COL.cx+dx/d*lim;u.y=COL.cy+dy/d*lim;}
  for(const o of COL.rocks){const ex=u.x-o.x,ey=u.y-o.y,e=hyp(ex,ey),m=o.r+r;if(e<m){if(e<0.01){u.x=o.x+m;continue;}u.x=o.x+ex/e*m;u.y=o.y+ey/e*m;}}
  const q=colQuake();if(q){const s2=(u.x-COL.cx)*q.nx+(u.y-COL.cy)*q.ny,m=q.half+r;if(Math.abs(s2)<m){const k=(s2>=0?1:-1)*m-s2;u.x+=q.nx*k;u.y+=q.ny*k;}}}
function clampWalk(x,y,r){const p={x,y};if(isCol())colClamp(p,r);else laneClamp(p,r);return p;}
function colBlocked(x,y){const dx=x-COL.cx,dy=y-COL.cy,d=hyp(dx,dy);if(d>colRB(Math.atan2(dy,dx)))return true;
  for(const o of COL.rocks)if(hyp(x-o.x,y-o.y)<o.r)return true;
  const q=colQuake();return !!q&&Math.abs(dx*q.nx+dy*q.ny)<q.half;}
const bushAt=(x,y)=>{for(const b of (isCol()?COL.bushes:LANE_BUSHES))if(hyp(x-b.x,y-b.y)<b.r)return b.g;return -1;};
// walk around ruins instead of into them: near one that blocks the way, slide along whichever tangent heads toward the goal
function steer(c,gx,gy){let vx=gx-c.x,vy=gy-c.y;const l=hyp(vx,vy)||1;vx/=l;vy/=l;
  if(!isCol())return{x:vx,y:vy};
  let best=null,bd=1e9;
  for(const o of COL.rocks){const ox=o.x-c.x,oy=o.y-c.y,od=hyp(ox,oy)||1,ahead=ox*vx+oy*vy,side=ox*vy-oy*vx;
    if(ahead>0&&ahead<l+o.r&&Math.abs(side)<o.r+c.r+12&&od<o.r+c.r+160&&od<bd){bd=od;best={o,ox,oy,od};}}
  if(best){const {o,ox,oy,od}=best;
    // go round the short way; with the goal straight across, each team defaults to a different way so two hunters meet instead of circling
    let da=Math.atan2(gy-o.y,gx-o.x)-Math.atan2(c.y-o.y,c.x-o.x);da=Math.atan2(Math.sin(da),Math.cos(da));
    const sg=Math.abs(da)>2.7?(c.team?1:-1):da>=0?1:-1;return{x:oy/od*sg,y:-ox/od*sg};}
  return{x:vx,y:vy};}
// brush: a champion in a bush is hidden from enemies outside it; standing close, sharing the bush or dealing damage gives them away
function updateVision(){
  for(const u of G.champs)u.bush=u.alive?bushAt(u.x,u.y):-1;
  for(const u of G.champs){let h=u.alive&&u.bush>=0&&!(u.revealT>G.t);
    if(h)for(const e of G.champs)if(e.team!==u.team&&e.alive&&(e.bush===u.bush||(dist(e,u)<170&&!hasAug(u,'shroud'))||shadeQuarry(e)===u||(vikBounty(e)===u&&e.bounty.reveal>G.t)))h=false;
    u.hidden=h;
    if(u.alive&&u.bush>=0&&u.prevBush<0&&hasAug(u,'shroud'))u.msBuff={until:G.t+1.5,pct:0.3};u.prevBush=u.bush;}}
const STORM_SRC={kind:'storm',team:-1,name:'The storm',alive:true};
const EVENT_SRC={kind:'env',team:-1,name:'The arena',alive:true};
const EVENT_NAMES={meteors:['Meteor Shower','Stones fall across the arena'],quake:['Earthquake','The arena splits in two'],lava:['Lava Flow','Molten pools burst from the sand']};
// capturing the dial unleashes one of three events; the champion who captured it is spared
function colEvent(owner){const C=G.col,k=['meteors','quake','lava'][(srand()*3)|0];C.event={kind:k,owner,next:G.t,until:G.t+6.5};
  banner(EVENT_NAMES[k][0],`${owner===G.player?'You captured the dial · you are spared':owner.name+' captured the dial · they are spared'}`,2);SFX.play('quake',COL.cx,COL.cy);SFX.play('tower',COL.cx,COL.cy,0.7);
  ring(COL.cx,COL.cy,20,COL.CP_R+60,TEAML[owner.team],0.6);
  if(k==='quake'){const a=srand()*PI;C.quake={nx:Math.cos(a),ny:Math.sin(a),half:40,open:false,openAt:G.t+1.2,until:G.t+9.2,seed:(srand()*1e9)|0,owner};}
  if(k==='lava'){const sr=C.storm?C.storm.r-60:COL.R-120;for(let n=0;n<7;n++){let x,y,tries=0;
      do{const a=srand()*TAU,dd=160+srand()*(sr-160);x=COL.cx+Math.cos(a)*dd;y=COL.cy+Math.sin(a)*dd;tries++;}while(tries<20&&(C.lava.some(l=>hyp(l.x-x,l.y-y)<260)||colBlocked(x,y)));
      C.lava.push({x,y,r:95+srand()*45,t0:G.t,t1:G.t+1,until:G.t+11,seed:srand()*6,owner});}}}
function colHazards(dt){const C=G.col,E=C.event;
  if(E&&E.kind==='meteors'&&G.t<E.until&&G.t>=E.next){E.next=G.t+0.3;const foe=G.champs.find(u=>u!==E.owner&&u.alive);let x,y;
    if(foe&&srand()<0.45){x=foe.x+srnd(-150,150);y=foe.y+srnd(-150,150);}else{const a=srand()*TAU,dd=Math.sqrt(srand())*(COL.R-120);x=COL.cx+Math.cos(a)*dd;y=COL.cy+Math.sin(a)*dd;}
    C.meteors.push({x,y,r:120,t0:G.t,t1:G.t+1,owner:E.owner});}
  for(let i=C.meteors.length-1;i>=0;i--){const m=C.meteors[i];if(G.t<m.t1)continue;C.meteors.splice(i,1);
    for(const u of G.champs)if(u.alive&&u!==m.owner&&hyp(u.x-m.x,u.y-m.y)<m.r+u.r){dealDamage(EVENT_SRC,u,60+u.maxHp*0.09,'true',{force:true});u.kick={until:G.t+0.16,ang:angTo(m,u.x,u.y)};}
    ring(m.x,m.y,10,m.r+30,'#ff8a3c',0.4);for(let n=0;n<6;n++)G.fx.push({k:'rock',x:m.x+rnd(-40,40),y:m.y+rnd(-40,40),t:0,dur:rnd(0.4,0.7),vz:rnd(160,300),s:rnd(5,11),rot:rnd(0,TAU)});
    G.fx.push({k:'smoke',x:m.x,y:m.y,t:0,dur:0.8,r:50,col:'#4a3022'});SFX.play('quake',m.x,m.y,0.5);if(dist(m,G.player)<500)shake(4,0.15);}
  const q=C.quake;
  if(q){if(!q.open&&G.t>=q.openAt){q.open=true;SFX.play('quake',COL.cx,COL.cy);shake(10,0.4);
      for(const u of G.champs)if(u.alive&&u!==q.owner&&Math.abs((u.x-COL.cx)*q.nx+(u.y-COL.cy)*q.ny)<q.half+u.r)dealDamage(EVENT_SRC,u,80+u.maxHp*0.08,'true',{force:true});
      for(const u of G.champs)if(u.alive)colClamp(u,u.r);}
    if(G.t>=q.until)C.quake=null;}
  C.lavaTick-=dt;if(C.lavaTick<=0){C.lavaTick=0.5;for(const l of C.lava){if(G.t<l.t1)continue;
    for(const u of G.champs)if(u.alive&&u!==l.owner&&hyp(u.x-l.x,u.y-l.y)<l.r){dealDamage(EVENT_SRC,u,u.maxHp*0.035,'true',{force:true});spark(u.x,u.y,'#ff8a3c',3);}}}
  C.lava=C.lava.filter(l=>G.t<l.until);}
// portals: step on a ready pad to come out at the opposite gate; that pair then rests so nobody can follow straight through
function colPortals(){const C=G.col;
  for(const c of G.champs){if(!c.alive||c.dash||c.cast)continue;
    for(const q of COL.portals){if(C.t<C.portalReady[q.pair]||hyp(c.x-q.x,c.y-q.y)>COL.PORTAL_R)continue;
      const dst=COL.portals.find(o=>o.pair===q.pair&&o!==q),dd=hyp(COL.cx-dst.x,COL.cy-dst.y)||1,ex={x:dst.x+(COL.cx-dst.x)/dd*120,y:dst.y+(COL.cy-dst.y)/dd*120};
      ring(c.x,c.y,10,90,'#7fe9ff',0.4);spark(c.x,c.y,'#7fe9ff',14);c.x=ex.x;c.y=ex.y;c.px=c.x;c.py=c.y;c.vx=c.vy=0;c.order=null;c.recall=null;
      ring(c.x,c.y,10,110,'#7fe9ff',0.5);spark(c.x,c.y,'#e6fbff',14);C.portalReady[q.pair]=C.t+COL.PORTAL_CD;SFX.play('dash',c.x,c.y);
      if(c===G.player){cam.x=c.x;cam.y=c.y;}break;}}}
// the control point opens a little into the round; standing on it alone fills it, sharing it stalls it
function colControl(dt){const C=G.col,cp=C.cp;if(C.t<cp.openAt)return;
  const ins=G.champs.filter(c=>c.alive&&hyp(c.x-COL.cx,c.y-COL.cy)<COL.CP_R);cp.contested=ins.length>1;
  if(ins.length===1){const c=ins[0];if(cp.team!==c.team){cp.team=c.team;cp.prog=0;}cp.prog+=dt;
    if(cp.prog>=COL.CP_TIME){colEvent(c);cp.prog=0;cp.team=null;cp.openAt=C.t+COL.CP_EVERY;}}
  else if(!ins.length){cp.prog=Math.max(0,cp.prog-dt*0.5);if(cp.prog===0)cp.team=null;}}
// augments: before each round both duelists take one of three; they stack for the rest of the match
const AUGS=[
  {id:'vamp',name:'Vampirism',desc:'Heal for 10% of all damage you deal.'},
  {id:'jugg',name:'Juggernaut',desc:'+20% maximum health.'},
  {id:'exec',name:'Executioner',desc:'Deal 20% more damage to champions below 40% health.'},
  {id:'swift',name:'Fleet Foot',desc:'+10% move speed. Your Space dash recharges in 3.5s.'},
  {id:'haste',name:'Quickened',desc:'+25 ability haste.'},
  {id:'fury',name:'Battle Fury',desc:'+35% attack speed.'},
  {id:'thorns',name:'Thornhide',desc:'Reflect 20% of the damage champions deal to you as true damage.'},
  {id:'wind',name:'Second Wind',desc:'Once per round, falling below 25% health heals you for 30% of your maximum health.'},
  {id:'brute',name:'Brute Force',desc:'Deal 12% more damage.'},
  {id:'hearty',name:'Glutton',desc:'Healing beads heal you 60% more.'},
  {id:'storm',name:'Stormborn',desc:'Take 60% less damage from the storm.'},
  {id:'shroud',name:'Shroud',desc:'Enemies must share your bush to see you, and entering one gives a burst of move speed.'}];
const AUG=Object.fromEntries(AUGS.map(a=>[a.id,a]));
const hasAug=(c,id)=>!!(c.aug&&c.aug[id]);
function addAug(c,id){c.aug=c.aug||{};c.augList=c.augList||[];if(c.aug[id])return;c.aug[id]=true;c.augList.push(id);computeStats(c,false);}
function offerAugs(c){const pool=AUGS.filter(a=>!hasAug(c,a.id)),out=[];while(out.length<3&&pool.length)out.push(pool.splice((srand()*pool.length)|0,1)[0]);return out;}
// round prep: each person picks an augment and spends ability points, then readies up (or the timer readies them); bots pick at once
let prepUi={sent:false};
function showPrep(){const C=G.col,p=G.player;$('prepTitle').textContent=`Round ${C.round} · Level ${p.level}`;
  $('prepSub').textContent=C.round===1?'Choose an augment and spend your ability points with Shift + key or the + buttons. Augments stack for the rest of the match.':'Choose another augment and spend your new ability points.';
  $('prepAugs').innerHTML=(p.augOffer||[]).map(a=>`<button type="button" class="aug" data-id="${a.id}" aria-pressed="false"><b>${a.name}</b><span>${a.desc}</span></button>`).join('');
  for(const b of $('prepAugs').children)b.addEventListener('click',()=>{if(prepUi.sent)return;pushEv(['ag',b.dataset.id]);for(const x of $('prepAugs').children)x.setAttribute('aria-pressed',String(x===b));$('readyBtn').disabled=false;});
  prepUi={sent:false};$('readyBtn').disabled=true;$('readyBtn').textContent='Ready';$('prep').hidden=false;updatePrep();}
function updatePrep(){const C=G.col;if(!C||C.state!=='prep')return;const p=G.player,o=NET.live?G.champs.find(c=>c!==p):null;
  $('prepPts').textContent=p.points>0?`${p.points} ability point${p.points>1?'s':''} to spend`:'Ability points spent';
  $('prepT').textContent=`Starts in ${Math.ceil(C.stateT)}s`+(o?(o.prepReady?' · your friend is ready':' · your friend is choosing'):'');
  if(prepUi.sent){$('readyBtn').disabled=true;$('readyBtn').textContent=NET.live?'Waiting for your friend':'Ready';}}
function prepEnd(){const C=G.col;
  for(const c of G.champs){if(!c.augOffer)continue;addAug(c,c.augPick||c.augOffer[(srand()*c.augOffer.length)|0].id);c.augOffer=null;c.augPick=null;c.prepReady=false;
    for(let i=0;i<8&&c.points>0;i++)botSkillPoints(c);c.order=null;c.pend=null;}
  const p=G.player;$('prep').hidden=true;hudDirty=true;
  C.state='count';C.stateT=4;C.lastN=null;banner(`Round ${C.round}`,`Level ${p.level} · ${C.wins[p.team]} – ${C.wins[1-p.team]}`,1.2);}
// healing plants: one basic attack splits a ripe plant into beads that heal whoever walks over them
function breakPlant(p,src){if(!p.alive)return;p.alive=false;p.ripeAt=G.col.t+COL.PLANT_EVERY;
  const base=angTo(src,p.x,p.y);SFX.play('hit',p.x,p.y,0.6);ring(p.x,p.y,8,70,'#9dffb0',0.35);spark(p.x,p.y,'#7dff9a',10);
  for(let i=0;i<3;i++){const a=base+(i-1)*0.9+srnd(-0.15,0.15),d=srnd(110,150),to=clampWalk(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,20);
    G.col.beads.push({x0:p.x,y0:p.y,x:to.x,y:to.y,t0:G.t,land:G.t+0.35});}}
// each round raises both duelists to the round's level; ranks carry over and the new points are theirs to spend
function colLevel(c,L){c.level=L;c.xp=0;c.points=L-(c.ranks.Q+c.ranks.E+c.ranks.RMB+c.ranks.R);c.chg={};computeStats(c,true);if(botCtl(c))for(let i=0;i<8&&c.points>0;i++)botSkillPoints(c);}
let bannerUntil=0;
function banner(title,sub,dur){const b=$('banner');b.querySelector('b').textContent=title;b.querySelector('span').textContent=sub||'';b.hidden=false;bannerUntil=performance.now()+(dur||1.5)*1000;}
function startRound(){const C=G.col;C.round++;C.state='count';C.stateT=4;C.lastN=null;C.t=0;C.storm=null;C.stormWarned=false;C.stormTick=0;C.beads=[];
  C.cp={openAt:COL.CP_OPEN,prog:0,team:null,contested:false};C.event=null;C.meteors=[];C.lava=[];C.quake=null;C.lavaTick=0;C.portalReady=[COL.PORTAL_OPEN,COL.PORTAL_OPEN];
  for(const p of C.plants){p.alive=false;p.ripeAt=COL.PLANT_FIRST;}
  G.projs=[];G.rifts=[];G.trails=[];G.arena=null;G.fx=[];G.texts=[];
  const L=COL.LEVELS[Math.min(C.round,3)-1];
  for(const c of G.champs){const a=COL.spawn[c.team]*PI/180;
    c.alive=true;resetKitState(c);colLevel(c,L);c.hp=c.maxHp;resetKitState(c);if(c.def.resource==='Energy')c.res=c.maxRes;
    c.x=COL.cx+Math.cos(a)*720;c.y=COL.cy+Math.sin(a)*720;c.facing=a+PI;c.input.ax=COL.cx;c.input.ay=COL.cy;
    c.cds={Q:0,E:0,RMB:0,R:0};c.dashCd=0;c.stunT=0;c.slows=[];c.stealthT=0;c.untargetT=0;c.atkCd=0;c.rootT=0;c.wind=c.cast=c.dash=null;c.empower=null;c.spin=null;c.asBuff=null;c.msBuff=null;
    c.windUsed=false;c.prevBush=-1;c.augList=c.augList||[];
    c.bleed=null;c.recall=null;c.order=null;c.hook=null;c.crosscut=null;c.shadeMark=null;c.eRecast=null;c.quarry=null;c.execBy=null;c.revealT=0;c.hidden=false;c.retreat=false;c.mem=null;c.lastChampHit=null;c.cleaveReady=null;c.vx=c.vy=0;c.atk=null;c.castAnim=null;}
  cam.x=G.player.x;cam.y=G.player.y;buildHud();hudDirty=true;
  if(G.champs[0].augList.length<C.round){
    for(const c of G.champs){if(botCtl(c)){const bo=offerAugs(c);addAug(c,bo[(srand()*bo.length)|0].id);}else{c.augOffer=offerAugs(c);c.augPick=null;c.prepReady=false;}}
    C.state='prep';C.stateT=30;if(G.champs.every(botCtl))prepEnd();else if(!botCtl(G.player))showPrep();}
  else banner(`Round ${C.round}`,`Level ${L} · ${C.wins[G.player.team]} – ${C.wins[1-G.player.team]}`,1.2);
}
// returns false while the round is frozen (countdown, or the pause after a death)
function colTick(dt){const C=G.col;
  if(C.state==='prep'){C.stateT-=dt;if(C.stateT<=0||G.champs.every(c=>botCtl(c)||c.prepReady))prepEnd();return false;}
  if(C.state==='count'){C.stateT-=dt;const n=Math.ceil(C.stateT);
    if(n!==C.lastN){C.lastN=n;if(n>=1&&n<=3){banner(String(n),'',0.9);SFX.play('tick');}}
    if(C.stateT<=0){C.state='fight';banner('Fight!','',0.9);SFX.play('level');}
    return false;}
  if(C.state==='over'){C.stateT-=dt;if(C.stateT<=0){if(C.done)endGame(C.done.team,'rounds');else startRound();}return false;}
  C.t+=dt;
  if(C.t>=COL.STORM_DELAY){const k=Math.min(1,(C.t-COL.STORM_DELAY)/COL.STORM_TIME),r0=COL.rbMax+60;C.storm={r:r0+(COL.STORM_MIN-r0)*k,since:C.t-COL.STORM_DELAY};
    if(!C.stormWarned){C.stormWarned=true;banner('The storm closes in','Stay inside the light',1.8);SFX.play('quake');}
    C.stormTick-=dt;if(C.stormTick<=0){C.stormTick=0.5;const pct=0.04+0.01*Math.floor(C.storm.since/10);
      for(const u of G.champs)if(u.alive&&hyp(u.x-COL.cx,u.y-COL.cy)>C.storm.r){dealDamage(STORM_SRC,u,u.maxHp*pct*0.5,'true',{force:true});spark(u.x,u.y,'#c9a0ff',4);}}}
  colPortals();colControl(dt);colHazards(dt);
  for(const p of C.plants)if(!p.alive&&C.t>=p.ripeAt){p.alive=true;p.bornT=G.t;ring(p.x,p.y,6,60,'#9dffb0',0.4);}
  for(let i=C.beads.length-1;i>=0;i--){const b=C.beads[i];if(G.t<b.land)continue;
    const c=G.champs.find(u=>u.alive&&hyp(u.x-b.x,u.y-b.y)<u.r+22);if(!c)continue;
    const h=Math.min(c.maxHp-c.hp,(40+c.maxHp*0.06)*(hasAug(c,'hearty')?1.6:1));c.hp+=h;C.beads.splice(i,1);spark(b.x,b.y,'#9dffb0',8);ring(b.x,b.y,6,50,'#7dff9a',0.3);SFX.play('tick',b.x,b.y);
    if(c===G.player&&h>=1)popText(c.x,c.y,'+'+n0(h),'#5fe08b',16,130);}
  return true;
}
function colDeath(){if(G.col.state==='fight')G.col.pendingEnd=true;}
// both deaths in one tick are a draw and the round is replayed
function colResolve(){const C=G.col;if(!C.pendingEnd)return;C.pendingEnd=false;
  const alive=G.champs.filter(c=>c.alive);
  if(alive.length===1){const w=alive[0].team,you=w===G.player.team;C.wins[w]++;
    if(C.wins[w]>=2)C.done={team:w};
    banner(you?'Round won':'Round lost',`${C.wins[G.player.team]} – ${C.wins[1-G.player.team]}`,2.6);SFX.play(you?'level':'death');}
  else{C.round--;banner('Draw','The round is replayed',2.6);}
  C.state='over';C.stateT=2.8;}

// ---- colosseum art ----
let colGround=null,COL_PROPS=null;
function buildColGround(){
  const ext=Math.ceil(COL.rbMax)+80,S=ext*2,g=document.createElement('canvas');g.width=S;g.height=S;const c=g.getContext('2d'),R=mulberry(11),o=ext;
  const W2=(x,y)=>[o+x-COL.cx,o+y-COL.cy];
  const outline=(dr)=>{c.beginPath();for(let i=0;i<COL.N;i+=2){const th=i/COL.N*TAU,r=COL.rb[i]+(dr||0);c.lineTo(o+Math.cos(th)*r,o+Math.sin(th)*r);}c.closePath();};
  c.fillStyle='#120d0b';c.fillRect(0,0,S,S);
  outline();c.fillStyle='#b48e5c';c.fill();
  c.save();outline();c.clip();
  // warm sand with grain and a few old stains
  for(let i=0;i<12000;i++){const x=R()*S,y=R()*S,r=3+R()*16,k=R();c.fillStyle=k<0.45?`rgba(120,88,52,${0.06+R()*0.1})`:k<0.85?`rgba(214,180,128,${0.05+R()*0.1})`:`rgba(80,56,34,${0.07+R()*0.1})`;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  for(let i=0;i<20;i++){const a=R()*TAU,d=250+R()*600,x=o+Math.cos(a)*d,y=o+Math.sin(a)*d;for(let j=0;j<5;j++){c.fillStyle=`rgba(${100+R()*30|0},${40+R()*16|0},${30+R()*10|0},${0.06+R()*0.08})`;c.beginPath();c.ellipse(x+rnd(-20,20),y+rnd(-12,12),6+R()*20,4+R()*10,R()*3,0,TAU);c.fill();}}
  // flagstone paths: a ring, and a cross running out to the four gates
  const flag=(draw)=>{c.save();draw();c.clip();c.fillStyle='#cdb592';c.fillRect(0,0,S,S);for(let n=0;n<2600;n++){const x=R()*S,y=R()*S;c.fillStyle=`rgba(${120+R()*40|0},${100+R()*30|0},${70+R()*20|0},${0.12+R()*0.12})`;c.fillRect(x,y,8+R()*30,6+R()*20);}c.restore();};
  flag(()=>{c.beginPath();c.arc(o,o,690,0,TAU);c.arc(o,o,610,0,TAU,true);});
  for(const d of [-45,45,135,225]){const a=d*PI/180,ux=Math.cos(a),uy=Math.sin(a),tx=-uy,ty=ux;
    flag(()=>{c.beginPath();c.moveTo(o+tx*58,o+ty*58);c.lineTo(o+tx*58+ux*COL.R,o+ty*58+uy*COL.R);c.lineTo(o-tx*58+ux*COL.R,o-ty*58+uy*COL.R);c.lineTo(o-tx*58,o-ty*58);c.closePath();});
    c.strokeStyle='rgba(70,52,34,.35)';c.lineWidth=3;for(let k=260;k<COL.R;k+=70){c.beginPath();c.moveTo(o+tx*58+ux*k,o+ty*58+uy*k);c.lineTo(o-tx*58+ux*k,o-ty*58+uy*k);c.stroke();}}
  c.strokeStyle='rgba(70,52,34,.4)';c.lineWidth=3;for(const r of [610,690]){c.beginPath();c.arc(o,o,r,0,TAU);c.stroke();}
  // gardens: grassy mounds that the brush and ruins sit in
  for(const gd of COL.gardens){const [gx,gy]=W2(gd.x,gd.y);const gr=c.createRadialGradient(gx,gy,20,gx,gy,215);gr.addColorStop(0,'#3e6a2c');gr.addColorStop(0.75,'#4d7a34');gr.addColorStop(1,'rgba(90,110,50,0)');c.fillStyle=gr;c.beginPath();c.arc(gx,gy,215,0,TAU);c.fill();
    for(let n=0;n<90;n++){const a=R()*TAU,rr=Math.sqrt(R())*190;c.fillStyle=`rgba(${30+R()*20|0},${70+R()*40|0},${26+R()*16|0},${0.4+R()*0.4})`;c.beginPath();c.arc(gx+Math.cos(a)*rr,gy+Math.sin(a)*rr,6+R()*14,0,TAU);c.fill();}}
  // the compass dial: the control point
  const cr=COL.CP_R;c.fillStyle='#6b5338';c.beginPath();c.arc(o,o,cr+28,0,TAU);c.fill();c.fillStyle='#8c6a42';c.beginPath();c.arc(o,o,cr,0,TAU);c.fill();
  c.strokeStyle='#4a3622';c.lineWidth=5;for(const r of [cr,cr*0.62,cr*0.3]){c.beginPath();c.arc(o,o,r,0,TAU);c.stroke();}
  const star=(n,r0,r1,rot,col)=>{c.fillStyle=col;c.beginPath();for(let k=0;k<n*2;k++){const a=rot+k*PI/n,r=k%2?r1:r0;c.lineTo(o+Math.cos(a)*r,o+Math.sin(a)*r);}c.closePath();c.fill();};
  star(8,cr*0.95,cr*0.36,PI/8,'#a8824e');star(4,cr*1.12,cr*0.3,-PI/4,'#c79a5a');
  c.strokeStyle='#5fd6e8';c.lineWidth=5;for(const d of [-45,45,135,225]){const a=d*PI/180;c.beginPath();c.moveTo(o+Math.cos(a)*cr*0.34,o+Math.sin(a)*cr*0.34);c.lineTo(o+Math.cos(a)*cr*1.08,o+Math.sin(a)*cr*1.08);c.stroke();}
  c.fillStyle='#7a5c38';c.beginPath();c.arc(o,o,cr*0.24,0,TAU);c.fill();c.strokeStyle='#4a3622';c.lineWidth=4;c.stroke();
  // fruit beds and spawn circles
  for(const q of COL.plantSpots){const [x,y]=W2(q.x,q.y);c.fillStyle='rgba(60,44,28,.55)';c.beginPath();c.arc(x,y,32,0,TAU);c.fill();c.strokeStyle='rgba(120,200,120,.35)';c.lineWidth=3;c.stroke();}
  for(const t of [BLUE,RED]){const sp=colPt(COL.spawn[t],720),[x,y]=W2(sp.x,sp.y);c.strokeStyle=TEAMC[t];c.globalAlpha=0.4;c.lineWidth=5;c.beginPath();c.arc(x,y,70,0,TAU);c.stroke();c.globalAlpha=1;}
  // worn stone border at the foot of the wall
  c.lineWidth=96;c.strokeStyle='#8a7458';outline();c.stroke();
  c.strokeStyle='rgba(50,38,26,.45)';c.lineWidth=3;for(let i=0;i<COL.N;i+=6){const th=i/COL.N*TAU,r=COL.rb[i];c.beginPath();c.moveTo(o+Math.cos(th)*(r-48),o+Math.sin(th)*(r-48));c.lineTo(o+Math.cos(th)*r,o+Math.sin(th)*r);c.stroke();}
  c.lineWidth=2;outline(-48);c.stroke();
  c.restore();
  c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=8;outline();c.stroke();
  colGround={c:g,ox:COL.cx-o,oy:COL.cy-o};
}
function buildColProps(){const R=mulberry(23);COL_PROPS=[];
  COL.bushes.forEach((b,i)=>{const n=Math.round(b.r/9);for(let j=0;j<n;j++){const a=R()*TAU,rr=Math.sqrt(R())*b.r*0.9,x=b.x+Math.cos(a)*rr,y=b.y+Math.sin(a)*rr;
    if(COL.rocks.some(o=>hyp(x-o.x,y-o.y)<o.r+8))continue;COL_PROPS.push({kind:'tuft',x,y,b:b.g,v:(R()*4)|0});}});
  for(const o of COL.rocks)COL_PROPS.push({kind:'ruin',x:o.x,y:o.y,r:o.r,v:o.v});
  COL.portals.forEach((q,i)=>COL_PROPS.push({kind:'portal',x:q.x,y:q.y,i}));
  for(const q of COL.portals){const g=colPt(q.d,COL.R+6);COL_PROPS.push({kind:'gate',x:g.x,y:g.y,d:q.d});}}
function drawColTerrain(){
  if(artReady()){screenT();const A=ARENA_ART,im=A.img,c=P(COL.cx,COL.cy),sx=SCALE/A.k,sy=SCALE/(A.k*A.v);
    ctx.fillStyle='#242830';ctx.fillRect(0,0,VW,VH);ctx.drawImage(im,c.x-A.cx*sx,c.y-A.cy*sy,im.width*sx,im.height*sy);return;}
  groundT(0);ctx.fillStyle='#0c0907';ctx.fillRect(COL.cx-4000,COL.cy-4000,8000,8000);
  if(!colGround)buildColGround();ctx.drawImage(colGround.c,colGround.ox,colGround.oy);
}
// walls: tall with tiered stands along the back of the bowl, a low parapet along the front so the floor stays visible
function drawColWalls(t){if(artReady())return;screenT();const N=COL.N,st=4,segs=[];
  const pt=(i,dr,z)=>{const th=(i%N)/N*TAU,r=COL.rb[i%N]+dr;return P(COL.cx+Math.cos(th)*r,COL.cy+Math.sin(th)*r,z);};
  const quad=(a,b,c,d)=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();};
  for(let i=0;i<N;i+=st){const th=(i+st/2)/N*TAU,f=Math.sin(th)-Math.cos(th),back=clamp((0.3-f)/0.6,0,1);
    const mx=COL.cx+Math.cos(th)*COL.rb[i],my=COL.cy+Math.sin(th)*COL.rb[i];segs.push({i,back,h:COL.PARAPET+(COL.WALL_H-COL.PARAPET)*back,depth:my-mx});}
  segs.sort((a,b)=>a.depth-b.depth);
  // stands, far tier first
  for(let tier=3;tier>=1;tier--)for(const s of segs){if(s.back<0.98)continue;const i=s.i,z=COL.WALL_H+tier*26,r0=(tier-1)*64,r1=tier*64;
    ctx.fillStyle='#2a211c';quad(pt(i,r0,z-26),pt(i+st,r0,z-26),pt(i+st,r0,z),pt(i,r0,z));
    ctx.fillStyle=tier%2?'#3b3029':'#352b25';quad(pt(i,r0,z),pt(i+st,r0,z),pt(i+st,r1,z),pt(i,r1,z));
    if(((i/st)*7+tier*3)%5<3){const q=pt(i+st/2,(r0+r1)/2,z+8),bob=Math.sin(t*3+i)*1.5*SCALE;ctx.fillStyle=['#a33a2e','#c9a25c','#5a6f8a','#7a5a40','#d8c8a8'][(i+tier)%5];ctx.fillRect(q.x-2.5*SCALE,q.y-6*SCALE+bob,5*SCALE,6*SCALE);
      ctx.fillStyle='#d9b38c';ctx.fillRect(q.x-1.8*SCALE,q.y-9*SCALE+bob,3.6*SCALE,3.4*SCALE);}}
  for(const s of segs){const i=s.i,h=s.h,a=pt(i,0,0),b=pt(i+st,0,0),c=pt(i+st,0,h),d=pt(i,0,h);
    ctx.fillStyle=s.back>0.5?((i/st)%3===0?'#4a3f37':(i/st)%3===1?'#51463d':'#463c34'):'#3a312a';quad(a,b,c,d);
    if(s.back>0.5){ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=Math.max(1,1.2*SCALE);for(const zz of [h*0.33,h*0.66]){const m=pt(i,0,zz),n=pt(i+st,0,zz);ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(n.x,n.y);ctx.stroke();}
      if((i/st)%9===4){const tp=pt(i+st/2,-2,h-8),bt=pt(i+st/2,-2,h-70),w=7*SCALE;ctx.fillStyle=(i/st)%18===4?'#8e1f27':'#2c4f7a';ctx.beginPath();ctx.moveTo(tp.x-w,tp.y);ctx.lineTo(tp.x+w,tp.y);ctx.lineTo(bt.x+w,bt.y);ctx.lineTo(bt.x,bt.y+5*SCALE);ctx.lineTo(bt.x-w,bt.y);ctx.closePath();ctx.fill();
        ctx.fillStyle='#d8b65a';ctx.fillRect(tp.x-w,tp.y,w*2,2*SCALE);}}
    ctx.strokeStyle=s.back>0.5?'#6d5f52':'#5a4d42';ctx.lineWidth=Math.max(1.5,2.4*SCALE);ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(c.x,c.y);ctx.stroke();}
}
// the storm: a bruised haze over everything outside the safe circle, with a bright moving rim
function drawStormGround(){const C=G.col;if(!C||!C.storm)return;groundT(0);const r=C.storm.r;
  ctx.save();ctx.beginPath();ctx.rect(COL.cx-4000,COL.cy-4000,8000,8000);ctx.arc(COL.cx,COL.cy,r,0,TAU,true);ctx.fillStyle='rgba(58,22,92,.5)';ctx.fill('evenodd');
  ctx.strokeStyle='rgba(205,150,255,.9)';ctx.lineWidth=10;ctx.setLineDash([60,30]);ctx.lineDashOffset=-G.t*80;ctx.beginPath();ctx.arc(COL.cx,COL.cy,r,0,TAU);ctx.stroke();
  ctx.setLineDash([12,18]);ctx.strokeStyle='rgba(205,150,255,.35)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(COL.cx,COL.cy,COL.STORM_MIN,0,TAU);ctx.stroke();ctx.restore();}
function drawStormFx(){const C=G.col;if(!C||!C.storm)return;screenT();const r=C.storm.r;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<70;i++){const a=i/70*TAU+G.t*(i%2?0.12:-0.09),rr=r+((i*37)%90),z=8+((i*53)%120),p=P(COL.cx+Math.cos(a)*rr,COL.cy+Math.sin(a)*rr,z),q=P(COL.cx+Math.cos(a+0.03)*rr,COL.cy+Math.sin(a+0.03)*rr,z);
    ctx.strokeStyle=`rgba(190,130,255,${0.18+0.12*Math.sin(G.t*4+i)})`;ctx.lineWidth=3*SCALE;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
  // a lightning fork somewhere on the rim every so often
  const k=Math.floor(G.t*1.6),ph=G.t*1.6-k;if(ph<0.18){const R2=mulberry(k*977+3),a=R2()*TAU;let x=COL.cx+Math.cos(a)*r,y=COL.cy+Math.sin(a)*r,z=240;
    ctx.strokeStyle=`rgba(235,210,255,${1-ph/0.18})`;ctx.lineWidth=2.5*SCALE;ctx.beginPath();let s=P(x,y,z);ctx.moveTo(s.x,s.y);
    while(z>0){z-=30+R2()*30;x+=(R2()-0.5)*40;y+=(R2()-0.5)*40;s=P(x,y,Math.max(0,z));ctx.lineTo(s.x,s.y);}ctx.stroke();}
  ctx.restore();}
// ruined masonry: a few stacked iso blocks, baked once per scale as a pixel sprite
function ruinSprite(v){const key='ruin|'+v;let s=SPR.get(key);if(s)return s;const k=ART_K,w=Math.ceil(150*k)+8,h=Math.ceil(170*k)+8,ax=Math.round(w/2),ay=Math.ceil(110*k)+4;
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),R=mulberry(91+v*13);
  const iso=(x,y,z)=>[ax+(x+y)*IC*k,ay+((y-x)*IC*IK-z)*k];
  const poly=(pts,col)=>{g.fillStyle=col;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();};
  const box=(x,y,sx,sy,z0,h0,tone)=>{const t=['#a59479','#8d7d65','#6f624f'].map((c0,i)=>tone?['#988a72','#7f725e','#625746'][i]:c0);
    const A=iso(x-sx,y-sy,z0),B=iso(x+sx,y-sy,z0),C=iso(x+sx,y+sy,z0),D=iso(x-sx,y+sy,z0),A2=iso(x-sx,y-sy,z0+h0),B2=iso(x+sx,y-sy,z0+h0),C2=iso(x+sx,y+sy,z0+h0),D2=iso(x-sx,y+sy,z0+h0);
    poly([D,C,C2,D2],t[1]);poly([C,B,B2,C2],t[2]);poly([A2,B2,C2,D2],t[0]);g.strokeStyle='rgba(40,32,24,.5)';g.lineWidth=Math.max(1,k);g.beginPath();g.moveTo(D2[0],D2[1]);g.lineTo(C2[0],C2[1]);g.lineTo(B2[0],B2[1]);g.stroke();};
  const blocks=v?[[0,-10,30,18,0,46,0],[-8,14,20,16,0,30,1],[4,-6,18,14,46,26,1]]:[[-14,0,22,36,0,58,0],[18,-10,18,18,0,34,1],[-12,2,18,26,58,22,1],[20,20,14,12,0,22,0]];
  blocks.sort((p,q)=>(p[1]-p[0])-(q[1]-q[0]));for(const b of blocks)box(...b);
  for(let n=0;n<7;n++){const p=iso((R()-0.5)*60,(R()-0.5)*60,R()*30);g.fillStyle=`rgba(${60+R()*30|0},${110+R()*40|0},${50+R()*20|0},.9)`;g.fillRect(p[0],p[1],(2+R()*3)*k,(2+R()*2)*k);}
  s={c,ax,ay};SPR.set(key,s);return s;}
function drawRuin(u){if(artReady())return;const p=P(u.x,u.y),pl=G.player;let a=1;
  if(pl.alive&&(pl.y-pl.x)<(u.y-u.x)&&dist(pl,u)<u.r+90)a=0.5;blit(ruinSprite(u.v),p.x,p.y,a,0);}
// portal: a stone basin with a floating crystal, bright when ready and dim while resting
function drawPortal(u,t){if(artReady())return;const q=COL.portals[u.i],C=G.col,ready=C&&C.t>=C.portalReady[q.pair],p=P(u.x,u.y),s=SCALE;
  ctx.save();ctx.fillStyle='#5b5246';ctx.beginPath();ctx.ellipse(p.x,p.y,40*s,40*s*IK,0,0,TAU);ctx.fill();ctx.fillStyle='#776b5c';ctx.beginPath();ctx.ellipse(p.x,p.y-8*s,36*s,36*s*IK,0,0,TAU);ctx.fill();
  ctx.fillStyle=ready?'#1a4f63':'#1d2a30';ctx.beginPath();ctx.ellipse(p.x,p.y-9*s,28*s,28*s*IK,0,0,TAU);ctx.fill();
  const bob=Math.sin(t*2.4+u.i)*4*s,cy=p.y-46*s+bob,d=11*s;
  if(ready){ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(p.x,cy,2,p.x,cy,46*s);g.addColorStop(0,'rgba(120,230,255,.75)');g.addColorStop(1,'rgba(60,180,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,cy,46*s,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over';}
  ctx.fillStyle=ready?'#7fe9ff':'#3d5a66';ctx.beginPath();ctx.moveTo(p.x,cy-d*1.7);ctx.lineTo(p.x+d,cy);ctx.lineTo(p.x,cy+d*1.4);ctx.lineTo(p.x-d,cy);ctx.closePath();ctx.fill();
  ctx.fillStyle=ready?'#e6fbff':'#5d7782';ctx.beginPath();ctx.moveTo(p.x,cy-d*1.7);ctx.lineTo(p.x+d*0.35,cy-d*0.2);ctx.lineTo(p.x-d*0.2,cy);ctx.closePath();ctx.fill();
  if(!ready&&C){const f=clamp((C.portalReady[q.pair]-C.t)/COL.PORTAL_CD,0,1);ctx.strokeStyle='rgba(127,233,255,.8)';ctx.lineWidth=3*s;ctx.beginPath();ctx.ellipse(p.x,p.y-9*s,32*s,32*s*IK,0,-PI/2,-PI/2+TAU*(1-f));ctx.stroke();}
  ctx.restore();}
// gate: two pillars and a spiked sun disc over an arch, set into the wall
function drawGate(u,t){if(artReady())return;const a=u.d*PI/180,tx=-Math.sin(a),ty=Math.cos(a),s=SCALE,H=COL.WALL_H+70;
  const pil=(o)=>{const b=P(u.x+tx*o,u.y+ty*o,0),top=P(u.x+tx*o,u.y+ty*o,H);ctx.fillStyle='#7a6a55';ctx.fillRect(b.x-13*s,top.y,26*s,b.y-top.y);ctx.fillStyle='#968369';ctx.fillRect(b.x-13*s,top.y,9*s,b.y-top.y);
    ctx.fillStyle='#5fd6e8';ctx.fillRect(b.x-2*s,top.y+26*s,4*s,40*s);const f=P(u.x+tx*o,u.y+ty*o,H+10);ctx.fillStyle='#ffb347';ctx.beginPath();ctx.arc(f.x,f.y-4*s,(5+Math.sin(t*9+o)*1.2)*s,0,TAU);ctx.fill();};
  const l=P(u.x-tx*70,u.y-ty*70,H-20),r=P(u.x+tx*70,u.y+ty*70,H-20),m=P(u.x,u.y,H+20);
  ctx.save();pil(-70);pil(70);ctx.strokeStyle='#6e5e4a';ctx.lineWidth=16*s;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.quadraticCurveTo(m.x,m.y-30*s,r.x,r.y);ctx.stroke();
  const sun=P(u.x,u.y,H+52);ctx.fillStyle='#a8743c';ctx.beginPath();for(let k=0;k<16;k++){const aa=k*PI/8,rr=k%2?14*s:26*s;ctx.lineTo(sun.x+Math.cos(aa)*rr,sun.y+Math.sin(aa)*rr);}ctx.closePath();ctx.fill();
  ctx.fillStyle='#d9a55a';ctx.beginPath();ctx.arc(sun.x,sun.y,10*s,0,TAU);ctx.fill();ctx.restore();}
// portal pads on the painted floor: a pool of light while the pair is ready; a dim dashed ring that refills while it rests
function drawPortalPads(t){const C=G.col;if(!C||!C.portalReady)return;groundT(0);
  for(const q of COL.portals){const ready=C.t>=C.portalReady[q.pair];ctx.save();
    const g=ctx.createRadialGradient(q.x,q.y,4,q.x,q.y,95);g.addColorStop(0,ready?`rgba(120,230,255,${0.45+0.15*Math.sin(t*3+q.pair)})`:'rgba(90,130,150,.14)');g.addColorStop(1,'rgba(60,180,255,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,95,0,TAU);ctx.fill();
    ctx.lineWidth=6;ctx.strokeStyle=ready?'rgba(160,240,255,.85)':'rgba(127,233,255,.25)';ctx.setLineDash(ready?[]:[10,10]);ctx.beginPath();ctx.arc(q.x,q.y,COL.PORTAL_R+8,0,TAU);ctx.stroke();ctx.setLineDash([]);
    if(!ready){const f=clamp((C.portalReady[q.pair]-C.t)/COL.PORTAL_CD,0,1);ctx.strokeStyle='rgba(127,233,255,.85)';ctx.lineWidth=8;ctx.beginPath();ctx.arc(q.x,q.y,COL.PORTAL_R+8,-PI/2,-PI/2+TAU*(1-f));ctx.stroke();}
    ctx.restore();}}
function drawPortalMotes(t){const C=G.col;if(!C||!C.portalReady||!artReady())return;screenT();ctx.save();ctx.globalCompositeOperation='lighter';
  for(const q of COL.portals){if(C.t<C.portalReady[q.pair])continue;
    for(let k=0;k<6;k++){const ph=(t*0.55+k/6)%1,a=k*2.1+t*0.7,p=P(q.x+Math.cos(a)*30,q.y+Math.sin(a)*30,ph*110);ctx.fillStyle=`rgba(180,245,255,${0.85*(1-ph)})`;ctx.fillRect(p.x-1.6*SCALE,p.y-1.6*SCALE,3.2*SCALE,3.2*SCALE);}}
  ctx.restore();}
// control point: a ring around the dial that fills with the capturer's colour; dim while it rests
function drawControlPoint(t){const C=G.col;if(!C)return;const cp=C.cp;groundT(0);
  const open=C.t>=cp.openAt,col=cp.team===undefined||cp.team===null?'#e8d7a8':TEAMC[cp.team];
  ctx.save();ctx.lineWidth=10;ctx.strokeStyle=open?`rgba(130,235,255,${0.55+0.25*Math.sin(t*4)})`:'rgba(120,100,80,.35)';ctx.setLineDash(open?[]:[18,16]);ctx.beginPath();ctx.arc(COL.cx,COL.cy,COL.CP_R+14,0,TAU);ctx.stroke();ctx.setLineDash([]);
  if(cp.prog>0){ctx.strokeStyle=col;ctx.lineWidth=16;ctx.beginPath();ctx.arc(COL.cx,COL.cy,COL.CP_R+14,-PI/2,-PI/2+TAU*cp.prog/COL.CP_TIME);ctx.stroke();}
  if(cp.contested){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=4;ctx.setLineDash([10,10]);ctx.lineDashOffset=-t*40;ctx.beginPath();ctx.arc(COL.cx,COL.cy,COL.CP_R+30,0,TAU);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();}
// environmental events: meteor targets and lava on the ground, the earthquake fissure as a chasm
function drawEventsGround(t){const C=G.col;if(!C)return;const E=C.event;groundT(0);
  for(const m of C.meteors){const k=clamp((G.t-m.t0)/(m.t1-m.t0),0,1);ctx.fillStyle=`rgba(255,80,40,${0.12+0.2*k})`;ctx.beginPath();ctx.arc(m.x,m.y,m.r*k,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(255,120,60,.9)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,TAU);ctx.stroke();}
  for(const l of C.lava){const k=G.t<l.t1?clamp((G.t-l.t0)/(l.t1-l.t0),0,1):1;
    if(G.t<l.t1){ctx.strokeStyle=`rgba(255,120,40,${0.4+0.4*k})`;ctx.lineWidth=4;for(let n=0;n<6;n++){const a=n/6*TAU+l.seed;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x+Math.cos(a)*l.r*k,l.y+Math.sin(a)*l.r*k);ctx.stroke();}continue;}
    const g=ctx.createRadialGradient(l.x,l.y,6,l.x,l.y,l.r);g.addColorStop(0,'#ffd36b');g.addColorStop(0.45,'#ff7a1e');g.addColorStop(0.85,'#b3260e');g.addColorStop(1,'#2a0d06');ctx.fillStyle=g;ctx.beginPath();ctx.arc(l.x,l.y,l.r,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,240,180,.8)';for(let n=0;n<4;n++){const a=t*0.8+n*1.7+l.seed,rr=l.r*0.5*Math.abs(Math.sin(t*1.3+n)),b=4+3*Math.sin(t*5+n);ctx.beginPath();ctx.arc(l.x+Math.cos(a)*rr,l.y+Math.sin(a)*rr,Math.max(1,b),0,TAU);ctx.fill();}}
  const q=C.quake;if(q){ctx.save();ctx.beginPath();ctx.arc(COL.cx,COL.cy,COL.R,0,TAU);ctx.clip();const L=COL.R+40,lx=-q.ny,ly=q.nx,x0=COL.cx-lx*L,y0=COL.cy-ly*L,x1=COL.cx+lx*L,y1=COL.cy+ly*L;
    if(!q.open){ctx.strokeStyle=`rgba(255,150,70,${0.5+0.4*Math.sin(t*20)})`;ctx.lineWidth=5;ctx.beginPath();const R2=mulberry(q.seed);ctx.moveTo(x0,y0);for(let k=1;k<=24;k++){const f=k/24,j2=(R2()-0.5)*40;ctx.lineTo(x0+(x1-x0)*f+q.nx*j2,y0+(y1-y0)*f+q.ny*j2);}ctx.stroke();}
    else{ctx.fillStyle='#0b0605';ctx.beginPath();const R2=mulberry(q.seed);const side=[],other=[];for(let k=0;k<=24;k++){const f=k/24,j2=(R2()-0.5)*24,cx2=x0+(x1-x0)*f,cy2=y0+(y1-y0)*f;side.push([cx2+q.nx*(q.half+j2),cy2+q.ny*(q.half+j2)]);other.push([cx2-q.nx*(q.half-j2),cy2-q.ny*(q.half-j2)]);}
      side.forEach((p2,k)=>k?ctx.lineTo(p2[0],p2[1]):ctx.moveTo(p2[0],p2[1]));for(let k=other.length-1;k>=0;k--)ctx.lineTo(other[k][0],other[k][1]);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(255,110,40,.85)';ctx.lineWidth=4;ctx.stroke();}ctx.restore();}}
function drawEventsFx(t){const C=G.col;if(!C)return;screenT();
  for(const m of C.meteors){const k=clamp((G.t-m.t0)/(m.t1-m.t0),0,1),z=520*(1-k),q=P(m.x+(1-k)*120,m.y-(1-k)*60,z),r=(14+8*k)*SCALE;
    ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(q.x,q.y,2,q.x,q.y,r*2.2);g.addColorStop(0,'rgba(255,230,160,.95)');g.addColorStop(0.4,'rgba(255,120,40,.8)');g.addColorStop(1,'rgba(200,40,10,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,r*2.2,0,TAU);ctx.fill();ctx.restore();
    ctx.fillStyle='#3a2418';ctx.beginPath();ctx.arc(q.x,q.y,r*0.7,0,TAU);ctx.fill();}}
function tuftSprite(v){const key='tuft|'+v;let s=SPR.get(key);if(s)return s;const k=ART_K,w=Math.ceil(76*k)+6,h=Math.ceil(64*k)+6,ax=Math.round(w/2),ay=h-3;
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),R=mulberry(31+v*7),cols=['#1d4527','#275a31','#33693a','#427a42','#4f8a48'];
  const blades=[];for(let i=0;i<11;i++)blades.push({bx:(R()-0.5)*50,h0:26+R()*30,lean:(R()-0.5)*20,wd:5+R()*6,col:cols[(R()*5)|0]});
  blades.sort((a,b)=>b.h0-a.h0);
  for(const b of blades){g.fillStyle=b.col;g.beginPath();g.moveTo(ax+(b.bx-b.wd)*k,ay);g.quadraticCurveTo(ax+(b.bx+b.lean*0.4)*k,ay-b.h0*0.65*k,ax+(b.bx+b.lean)*k,ay-b.h0*k);
    g.quadraticCurveTo(ax+(b.bx+b.lean*0.4+b.wd*0.4)*k,ay-b.h0*0.5*k,ax+(b.bx+b.wd)*k,ay);g.closePath();g.fill();}
  s={c,ax,ay};SPR.set(key,s);return s;}
function drawTuft(u){if(artReady())return;const p=P(u.x,u.y),pl=G.player;blit(tuftSprite(u.v),p.x,p.y,pl.alive&&pl.bush===u.b?0.42:1,0);}
// a healing plant: a sprout while it regrows, a heavy glowing pod when ripe
function plantSprite(ripe){const key='plant|'+ripe;let s=SPR.get(key);if(s)return s;const k=ART_K,w=Math.ceil(80*k)+6,h=Math.ceil(90*k)+6,ax=Math.round(w/2),ay=h-4;
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  const leaf=(x,y,len,ang,col)=>{g.save();g.translate(ax+x*k,ay+y*k);g.rotate(ang);g.fillStyle=col;g.beginPath();g.ellipse(len*0.5*k,0,len*0.5*k,len*0.2*k,0,0,TAU);g.fill();g.restore();};
  if(!ripe){leaf(0,-4,18,-2.0,'#3f7a3e');leaf(0,-4,16,-1.1,'#4f8f46');g.fillStyle='#2f5a2c';g.fillRect(ax-1.5*k,ay-12*k,3*k,12*k);}
  else{leaf(-4,-6,34,-2.6,'#2f6a34');leaf(4,-6,34,-0.5,'#3a7a3b');leaf(-2,-10,30,-2.1,'#4a8d45');leaf(2,-10,30,-1.0,'#559a4c');
    g.fillStyle='#2f5a2c';g.fillRect(ax-2*k,ay-40*k,4*k,36*k);
    const px=ax,py=ay-52*k,gr=g.createRadialGradient(px-5*k,py-6*k,2,px,py,20*k);gr.addColorStop(0,'#f6ffd8');gr.addColorStop(0.45,'#9fe36b');gr.addColorStop(1,'#3e8a3a');
    g.fillStyle=gr;g.beginPath();g.ellipse(px,py,16*k,19*k,0,0,TAU);g.fill();g.strokeStyle='rgba(30,70,30,.6)';g.lineWidth=Math.max(1,1.5*k);
    for(const o of [-7,0,7]){g.beginPath();g.ellipse(px+o*k,py,3*k,18*k,0,0,TAU);g.stroke();}}
  s={c,ax,ay};SPR.set(key,s);return s;}
function drawPlant(p,t){const q=P(p.x,p.y);blit(plantSprite(p.alive),q.x,q.y,1,p.hitFlash?p.hitFlash*6:0);
  if(p.alive){ctx.save();ctx.globalCompositeOperation='lighter';const g=P(p.x,p.y,52),r=(30+Math.sin(t*3)*4)*SCALE,gr=ctx.createRadialGradient(g.x,g.y,2,g.x,g.y,r);gr.addColorStop(0,'rgba(170,255,140,.35)');gr.addColorStop(1,'rgba(120,255,120,0)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(g.x,g.y,r,0,TAU);ctx.fill();ctx.restore();}}
function drawBeads(t){const C=G.col;screenT();
  for(const b of C.beads){const k=clamp((G.t-b.t0)/(b.land-b.t0),0,1),x=b.x0+(b.x-b.x0)*k,y=b.y0+(b.y-b.y0)*k,z=k<1?18+Math.sin(k*PI)*70:16+Math.sin(t*4+b.x)*4,q=P(x,y,z),r=7*SCALE;
    const sh=P(x,y,0);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(sh.x,sh.y,8*SCALE,8*SCALE*IK,0,0,TAU);ctx.fill();
    const gr=ctx.createRadialGradient(q.x-2*SCALE,q.y-2*SCALE,1,q.x,q.y,r*2.4);gr.addColorStop(0,'rgba(220,255,200,.95)');gr.addColorStop(0.35,'rgba(120,240,120,.8)');gr.addColorStop(1,'rgba(80,220,100,0)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(q.x,q.y,r*2.4,0,TAU);ctx.fill();ctx.fillStyle='#e9ffd8';ctx.beginPath();ctx.arc(q.x-2*SCALE,q.y-2*SCALE,2*SCALE,0,TAU);ctx.fill();}}
function drawColMini(g,w,h){const s=Math.min(w/(2*COL.rbMax+120),h/((2*COL.rbMax+120)*IK)),f=(x,y)=>[w/2+((x-COL.cx)+(y-COL.cy))*IC*s,h/2+((y-COL.cy)-(x-COL.cx))*IC*IK*s];
  g.clearRect(0,0,w,h);
  if(artReady()){const A=ARENA_ART,im=A.img,sx=s/A.k,sy=s/(A.k*A.v);g.imageSmoothingEnabled=true;g.drawImage(im,w/2-A.cx*sx,h/2-A.cy*sy,im.width*sx,im.height*sy);}
  else{g.fillStyle='#3a2f22';g.beginPath();for(let i=0;i<COL.N;i+=6){const th=i/COL.N*TAU,r=COL.rb[i],p=f(COL.cx+Math.cos(th)*r,COL.cy+Math.sin(th)*r);g.lineTo(p[0],p[1]);}g.closePath();g.fill();
    g.fillStyle='#2f6a34';for(const b of COL.bushes){const p=f(b.x,b.y);g.beginPath();g.ellipse(p[0],p[1],b.r*s,b.r*s*IK,0,0,TAU);g.fill();}
    g.fillStyle='#8d7d65';for(const o of COL.rocks){const p=f(o.x,o.y);g.fillRect(p[0]-2,p[1]-2,4,4);}}
  {const p=f(COL.cx,COL.cy);g.strokeStyle='#d9a55a';g.lineWidth=1.5;g.beginPath();g.ellipse(p[0],p[1],COL.CP_R*s,COL.CP_R*s*IK,0,0,TAU);g.stroke();}
  for(const q of COL.portals){const p=f(q.x,q.y),C2=G.col;g.fillStyle=C2.portalReady&&C2.t>=C2.portalReady[q.pair]?'#7fe9ff':'#3d5a66';g.fillRect(p[0]-2.5,p[1]-2.5,5,5);}
  const C=G.col;if(C.storm){g.strokeStyle='#c9a0ff';g.lineWidth=1.5;g.beginPath();for(let i=0;i<=48;i++){const a=i/48*TAU,p=f(COL.cx+Math.cos(a)*C.storm.r,COL.cy+Math.sin(a)*C.storm.r);g.lineTo(p[0],p[1]);}g.stroke();}
  for(const p of C.plants){const q=f(p.x,p.y);g.fillStyle=p.alive?'#9dffb0':'#3c5a40';g.fillRect(q[0]-2,q[1]-2,4,4);}
  for(const ch of G.champs){if(!ch.alive)continue;if(ch.team!==G.player.team&&!targetable(ch))continue;const q=f(ch.x,ch.y);g.fillStyle=TEAMC[ch.team];g.beginPath();g.arc(q[0],q[1],4.5,0,TAU);g.fill();if(ch===G.player){g.strokeStyle='#fff';g.lineWidth=1.5;g.stroke();}}
}

// small isometric previews for the map picker
function drawMapThumb(cv2,kind){const g=cv2.getContext('2d'),w=cv2.width,h=cv2.height;g.fillStyle='#0f1613';g.fillRect(0,0,w,h);
  const iso=(x,y)=>[w/2+(x+y)*0.62,h/2+(y-x)*0.62*IK];
  const shape=(pts,col)=>{g.fillStyle=col;g.beginPath();pts.forEach((p,i)=>{const q=iso(p[0],p[1]);i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);});g.closePath();g.fill();};
  if(kind==='lane'&&LANE_ART.src){const im=LANE_ART.src,r=LANE_ART.res,iw=im.width/r,ih=im.height/r,sc=Math.max(w/iw,h/ih)*1.12;g.imageSmoothingEnabled=true;g.drawImage(im,w/2-905*sc,h/2-410*sc,iw*sc,ih*sc);}
  else if(kind==='lane'){shape([[-150,-40],[150,-40],[150,40],[-150,40]],'#3a3d35');shape([[-150,-44],[150,-44],[150,-40],[-150,-40]],'#202b27');
    for(const [x,col] of [[-120,TEAMC[BLUE]],[120,TEAMC[RED]]]){const q=iso(x,0);g.fillStyle='#1a1f1e';g.fillRect(q[0]-5,q[1]-22,10,22);g.fillStyle=col;g.beginPath();g.arc(q[0],q[1]-24,5,0,TAU);g.fill();}
    for(let i=0;i<5;i++){const a=iso(-60+i*10,-10+(i%2)*14),b2=iso(60-i*10,10-(i%2)*14);g.fillStyle=TEAMC[BLUE];g.fillRect(a[0]-2,a[1]-4,4,4);g.fillStyle=TEAMC[RED];g.fillRect(b2[0]-2,b2[1]-4,4,4);}}
  else if(artReady()){const im=ARENA_ART.img,sc=Math.min(w/1000,h/900)*1.05;g.imageSmoothingEnabled=true;g.drawImage(im,w/2-628*sc,h/2-575*sc,im.width*sc,im.height*sc);}
  else{const ring=(r,col)=>{const pts=[];for(let i=0;i<40;i++){const a=i/40*TAU;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}shape(pts,col);};
    ring(110,'#2a211c');ring(96,'#7a6345');ring(30,'#5a4f45');
    g.fillStyle='#2f6a34';for(const a of [0,90,180,270,-45,135]){const q=iso(Math.cos(a*PI/180)*(a%90?55:90),Math.sin(a*PI/180)*(a%90?55:90));g.beginPath();g.ellipse(q[0],q[1],9,5,0,0,TAU);g.fill();}
    const c0=iso(0,0);g.fillStyle='#3a322d';g.fillRect(c0[0]-6,c0[1]-30,12,30);g.fillStyle='#ff4d61';g.beginPath();g.arc(c0[0],c0[1]-36,4,0,TAU);g.fill();
    g.strokeStyle='rgba(205,150,255,.8)';g.lineWidth=2;g.setLineDash([5,4]);g.beginPath();for(let i=0;i<=40;i++){const a=i/40*TAU,q=iso(Math.cos(a)*70,Math.sin(a)*70);i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);}g.stroke();g.setLineDash([]);}
}
// ================= online play =================
// Lockstep: both browsers run the same match from the same seed and apply the same input frames, so only inputs travel.
// Frames ride on each player's presence in the page's live room (no event topics, so anyone the page is shared with can join),
// as a sliding window of the newest ones so a dropped update loses nothing. Each frame applies NET_DELAY ticks after it is
// sampled, which hides the trip to the other browser; the delay follows the measured round trip (ack of a frame back to us).
// Outside claude.ai, two tabs of one browser can still play each other.
const NET_DELAY=6,NET_WINDOW=60,NET_CODE='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const NET={live:false,conn:null,role:null,side:0,code:'',kind:'',peerP:null,lastSeen:0,ready:false,status:'',
  match:null,started:0,cur:[null,null],frames:[new Map(),new Map()],myMax:0,recv:0,ack:0,dly:NET_DELAY,rtt:150,rttDev:20,sentAt:new Map(),pubMax:0,dlyT:0,waitT:0,hashes:new Map(),lastHash:null,desync:false,rematch:0,overlay:false,gone:false};
// the page's live room on claude.ai (asked for once, early, since an answer can take a few seconds)
let ROOM_P=null;const getRoom=()=>ROOM_P||(ROOM_P=(window.claude&&window.claude.use)?window.claude.use('room').catch(()=>null):null);
async function netOpen(code){
  let room=null;try{room=await getRoom();}catch(e){room=null;}
  if(room){
    try{const r=await room.join('riftline-'+code.toLowerCase());
      return{kind:'room',set:p=>{r.presence({rl:p}).catch(()=>{});},leave:()=>{r.leave().catch(()=>{});},
        peers:()=>r.peers().filter(x=>!x.sameTab&&x.presence&&x.presence.rl).map(x=>({id:x.peer,p:x.presence.rl}))};}catch(e){}
    // no named rooms here: share the page's own room, keyed by the match code
    try{return{kind:'room',set:p=>{room.presence({rl:p,rc:code}).catch(()=>{});},leave:()=>{room.presence({rl:null,rc:null}).catch(()=>{});},
      peers:()=>room.peers().filter(x=>!x.sameTab&&x.presence&&x.presence.rl&&x.presence.rc===code).map(x=>({id:x.peer,p:x.presence.rl}))};}catch(e){}}
  // fallback: other tabs of this browser
  const ch=new BroadcastChannel('riftline-'+code),me=Math.random().toString(36).slice(2),seen=new Map();let mine=null,sentAt=0;
  ch.onmessage=e=>{const m=e.data;if(!m||m.id===me)return;if(m.bye)seen.delete(m.id);else seen.set(m.id,{p:m.p,at:performance.now()});};
  const send=()=>{if(mine)ch.postMessage({id:me,p:mine});sentAt=performance.now();};
  return{kind:'local',set:p=>{mine=p;send();},leave:()=>{ch.postMessage({id:me,bye:1});ch.close();},
    peers:()=>{const now=performance.now();if(now-sentAt>800)send();const out=[];for(const [id,v] of seen)if(now-v.at<5000)out.push({id,p:v.p});return out;}};}
async function netBegin(role,code){netLeave();NET.role=role;NET.side=role==='h'?0:1;NET.code=code;NET.status='Connecting…';lobbyUi();
  const conn=await netOpen(code);if(NET.code!==code||NET.role!==role){conn.leave();return;}
  NET.conn=conn;NET.kind=conn.kind;NET.status=role==='h'?'Waiting for your friend to join':'Looking for the host';netPublish();lobbyUi();}
function netHost(){let c='';for(let i=0;i<4;i++)c+=NET_CODE[(Math.random()*NET_CODE.length)|0];netBegin('h',c);}
function netJoin(){const c=$('joinCode').value.trim().toUpperCase();if(!/^[A-Z0-9]{4,5}$/.test(c)){NET.status='Type the 4-letter code your friend sent';lobbyUi(true);return;}netBegin('g',c);}
function netLeave(){if(NET.conn)NET.conn.leave();Object.assign(NET,{live:false,conn:null,role:null,code:'',kind:'',peerP:null,ready:false,match:null,started:0,status:'',overlay:false,gone:false});lobbyUi();}
// what this browser tells the other one: its pick and ready flag; the host adds the map and, once both are ready, the match;
// during a match, the newest input frames, how far it has received the other's, and a checksum of the game state
function netPublish(){if(!NET.conn)return;
  const p={v:1,r:NET.role,c:pick,rd:NET.ready?1:0};
  if(NET.role==='h'){p.m=optMap;p.k=optKills;p.x=optXp;if(NET.match)p.st=NET.match;}
  if(NET.live&&G&&NET.match){p.g=NET.match.n;p.a=NET.recv;
    // from the oldest frame they still lack, so a long hiccup never strands them
    const mine=NET.frames[NET.side],t0=Math.max(NET.ack+1,NET_DELAY+1),f=[t0];
    for(let t=t0;t<=Math.min(NET.myMax,t0+NET_WINDOW-1);t++)f.push(mine.get(t));p.f=f;
    const now=performance.now();const last=t0+f.length-2;for(let t=NET.pubMax+1;t<=last;t++)NET.sentAt.set(t,now);NET.pubMax=Math.max(NET.pubMax,last);if(NET.lastHash)p.h=NET.lastHash;if(G.over)p.rm=NET.rematch;}
  while(p.f&&p.f.length>2&&JSON.stringify(p).length>3800)p.f.pop();  // presence holds 4 KiB
  NET.conn.set(p);}
function netPump(){if(!NET.conn)return;
  const q=(NET.conn.peers().find(x=>x.p&&x.p.v===1&&x.p.r!==NET.role)||{}).p;
  if(!q){if(NET.peerP&&performance.now()-NET.lastSeen>4000){NET.peerP=null;NET.ready=false;NET.status='Your friend left';if(NET.live&&G&&!G.over)NET.gone=true;lobbyUi();}return;}
  NET.lastSeen=performance.now();if(q===NET.peerP)return;
  const first=!NET.peerP;NET.peerP=q;
  if(first)NET.status=NET.role==='h'?'Your friend is here':'Connected to the host';
  if(NET.role==='g'&&!G){if(q.m&&q.m!==optMap)setMap(q.m);if(q.k)optKills=q.k;if(q.x)optXp=q.x;}
  if(NET.live&&G&&NET.match){
    // they left once they were in this match and no longer say so
    if(q.g!==NET.match.n){if(NET.peerIn&&!G.over)NET.gone=true;}
    else{NET.peerIn=true;NET.gone=false;
      if(q.f){const other=NET.frames[1-NET.side];for(let i=1;i<q.f.length;i++)if(!other.has(q.f[0]+i-1))other.set(q.f[0]+i-1,q.f[i]);
        while(other.has(NET.recv+1))NET.recv++;}
      if(q.a>NET.ack){const t0=NET.sentAt.get(q.a);if(t0!==undefined){const smp=performance.now()-t0;NET.rttDev=NET.rttDev*0.85+Math.abs(smp-NET.rtt)*0.15;NET.rtt=NET.rtt*0.85+smp*0.15;}for(const k of NET.sentAt.keys()){if(k<=q.a)NET.sentAt.delete(k);else break;}NET.ack=q.a;}
      if(q.h&&NET.hashes.has(q.h[0])&&NET.hashes.get(q.h[0])!==q.h[1])NET.desync=true;
      if(G.over&&NET.role==='h'&&NET.rematch===NET.match.n&&q.rm===NET.match.n)netCreate(q);}}
  // a new match from the host, or the host starting one now that both are ready
  if(NET.role==='g'&&q.st&&q.st.n>NET.started&&(!G||G.over||!NET.live))netStartMatch(q.st);
  if(NET.role==='h'&&!NET.live&&NET.ready&&q.rd)netCreate(q);
  lobbyUi();}
function netCreate(q){NET.match={n:NET.started+1,seed:(Math.random()*4294967296)>>>0,map:optMap,k:optKills,x:optXp,ch:[pick,q.c]};netStartMatch(NET.match);}
function netStartMatch(m){NET.match=m;NET.started=m.n;NET.live=true;NET.frames=[new Map(),new Map()];NET.myMax=NET_DELAY;NET.recv=NET_DELAY;NET.ack=0;NET.dly=NET_DELAY;NET.sentAt.clear();NET.pubMax=0;NET.dlyT=0;
  NET.hashes.clear();NET.lastHash=null;NET.desync=false;NET.waitT=0;NET.rematch=0;NET.ready=false;NET.gone=false;NET.peerIn=false;NET.overlay=false;
  if(NET.role==='g'){pick=m.ch[1];setMap(m.map);}SFX.init();newGame();netPublish();}
// one lockstep tick: both frames for it must be here; afterwards sample this player's frame for NET_DELAY ticks ahead
function netFrame(side,t){if(t<=NET_DELAY)return null;const f=NET.frames[side].get(t);return f===undefined?undefined:f;}
function netTry(){const t=(G.tickN||0)+1,a=netFrame(0,t),b=netFrame(1,t);if(a===undefined||b===undefined)return false;
  NET.cur=[a,b];tick(STEP);
  const T=G.tickN,mine=NET.frames[NET.side];
  // input delay: half the round trip, plus its usual wobble and a little spare
  if(T%60===0){const want=clamp(Math.ceil((NET.rtt/2+NET.rttDev+20)/(STEP*1000)),3,20);NET.dly+=Math.sign(want-NET.dly);}
  const target=T+NET.dly;
  if(target>NET.myMax){const f=sampleInput(G.player),plain=f.slice(0,8);for(let t=NET.myMax+1;t<target;t++)mine.set(t,plain);mine.set(target,f);NET.myMax=target;}
  for(const m of NET.frames)if(m.size>400)for(const k of m.keys()){if(k<T-200)m.delete(k);else break;}
  if(T%60===0){const h=netHash();NET.hashes.set(T,h);NET.lastHash=[T,h];if(NET.hashes.size>40)NET.hashes.delete(NET.hashes.keys().next().value);
    const q=NET.peerP;if(q&&q.h&&q.h[0]===T&&q.h[1]!==h)NET.desync=true;}
  return true;}
function netHash(){let h=G.tickN|0;const mix=v=>{h=Math.imul(h^(Math.round((v||0)*16)|0),16777619)>>>0;};
  for(const c of G.champs){mix(c.x);mix(c.y);mix(c.hp);mix(c.res);mix(c.level);mix(c.alive?1:0);}
  for(const m of G.minions){mix(m.x);mix(m.y);mix(m.hp);}for(const t of G.towers)mix(t.hp);
  if(G.col){mix(G.col.round);mix(G.col.wins[0]);mix(G.col.wins[1]);}mix(G.projs.length);return h;}
// ---- lobby and in-match status ----
function lobbyUi(err){const inL=!!NET.role,q=NET.peerP,host=NET.role==='h';
  $('onIdle').hidden=inL;$('onLobby').hidden=!inL;$('onHelp').hidden=inL;$('onCode').textContent=NET.code;
  $('onTag').textContent=inL?(NET.kind==='local'?(window.claude?'online play is not available in this view, so only tabs of this browser are linked':'linking tabs of this browser'):NET.kind==='room'?'online':''):'';
  $('onStatus').textContent=NET.status;if(err&&!inL)$('onTag').textContent=NET.status;
  const champ=k=>CH[k]?CH[k].name:'?';
  $('onPlayers').innerHTML=inL?`<div class="onp"><div><b>You</b><small>${champ(pick)} · ${host?'host, picks the map':'guest'}</small></div><span class="${NET.ready?'rd':'nr'}">${NET.ready?'Ready':'Picking'}</span></div>`+
    `<div class="onp"><div><b>Your friend</b><small>${q?champ(q.c)+(host?' · guest':' · host'):'not here yet'}</small></div><span class="${q&&q.rd?'rd':'nr'}">${q?(q.rd?'Ready':'Picking'):'Waiting'}</span></div>`:'';
  $('onReady').disabled=!q;$('onReady').textContent=NET.ready?'Not ready':'Ready';
  $('startBtn').hidden=inL;$('optFoe').closest('.opt').hidden=inL;
  for(const b of $('maps').children)b.setAttribute('aria-disabled',String(inL&&!host));
  for(const id of ['optKills','optXp'])for(const b of $(id).children)b.disabled=inL&&!host;}
function setMap(v){optMap=v;for(const x of $('maps').children)x.setAttribute('aria-pressed',String(x.dataset.v===v));
  for(const id of ['optKills','optXp'])$(id).closest('.opt').hidden=optMap==='col';$('startBtn').textContent=optMap==='col'?'Enter the Colosseum':'Enter the lane';}
function netHud(){const b=$('netBadge'),w=$('netWait');if(!NET.live||!G){b.hidden=true;w.hidden=true;return;}
  b.hidden=false;b.className=NET.desync?'bad':'';b.textContent=NET.desync?'Online · out of sync, finish this game and rematch':`Online · ${Math.round(NET.rtt)} ms`;
  const waiting=!G.over&&(NET.gone||NET.waitT>0.6);w.hidden=!waiting;
  if(waiting){$('netWaitT').textContent=NET.gone?'Your friend left the match':'Waiting for your friend…';
    $('netWaitS').textContent=NET.gone?'':NET.waitT>6?'Their game has not answered for a while. They may have switched tabs.':'';
    $('netWaitBtn').hidden=!(NET.gone||NET.waitT>6);}}
// ================= game flow =================
let pick='cora',optKills=3,optXp=1,optMap='lane',optFoe='random';
function newGame(){
  const M=NET.live?NET.match:null;
  UID=1;SIM_RNG=mulberry(M?M.seed:(Math.random()*4294967296)>>>0);
  G={mode:M?M.map:optMap,t:0,paused:false,over:null,overT:0,overShown:false,champs:[],minions:[],towers:[],projs:[],rifts:[],trails:[],fx:[],texts:[],feedQ:[],spawnQ:[],score:[0,0],waveN:0,nextWave:5,
     relics:RELIC_POS.map(p=>({x:p.x,y:p.y,r:30,active:false,at:45})),killsToWin:M?M.k:optKills,xpRate:M?M.x:optXp,hover:null,tickN:0};
  const others=Object.keys(CH).filter(k=>k!==pick),ks=M?M.ch:[pick,optFoe==='random'?others[(Math.random()*others.length)|0]:optFoe];
  // online both champions are people: the host plays blue, the guest red
  G.champs=[makeChamp(ks[0],BLUE,false),makeChamp(ks[1],RED,!M)];
  G.player=G.champs[M?NET.side:0];G.bot=G.champs.find(c=>c!==G.player);
  camAngle();
  if(G.mode==='col'){G.relics=[];G.nextWave=Infinity;G.col={round:0,wins:[0,0],state:'count',stateT:0,t:0,beads:[],
      plants:COL.plantSpots.map(q=>({id:UID++,kind:'plant',mtype:'plant',team:-1,x:q.x,y:q.y,r:26,alive:false,ripeAt:COL.PLANT_FIRST,hp:1,maxHp:1,armor:0,mr:0,hitFlash:0,slows:[],stunT:0}))};
    if(!COL_PROPS)buildColProps();}
  else G.towers=[makeTower(BLUE),makeTower(RED)];
  cam.x=G.player.x;cam.y=MIDY;LOCAL_EV.length=0;mouse.left=false;$('banner').hidden=true;$('prep').hidden=true;
  $('menu').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('tip').hidden=true;tipK=null;
  buildHud();hudDirty=true;queueBakes();applySettings();
  if(G.mode==='col'){startRound();feed('Best of 3 rounds. Break plants to heal.');}
  else feed('Welcome to the lane. Spend your first point with <span class="g">Shift + key</span> or the <span class="g">+</span> button.');
}
function setPause(v){if(!G)return;$('pauseTitle').textContent=NET.live?'Menu':'Paused';$('restartBtn').hidden=NET.live;$('menuBtn').textContent=NET.live?'Leave the match':'Champion select';
  if(NET.live){NET.overlay=v;v=false;$('pause').hidden=!NET.overlay;}else{G.paused=v;$('pause').hidden=!v;}if(v&&isLocked())document.exitPointerLock();if(!v&&document.activeElement)document.activeElement.blur();mouse.left=false;for(const k in keys)keys[k]=false;}
function showGameOver(){
  $('againBtn').textContent=NET.live?'Rematch':'Play again';$('againBtn').disabled=false;$('overMenuBtn').textContent=NET.live?'Back to the lobby':'Champion select';
  G.overShown=true;const win=G.over.team===G.player.team;const p=G.player,b=G.bot;
  $('overReason').textContent=G.over.reason==='rounds'?(win?`You won the duel ${G.col.wins[p.team]}–${G.col.wins[b.team]}`:`${b.name} won the duel ${G.col.wins[b.team]}–${G.col.wins[p.team]}`):G.over.reason==='tower'?(win?'You destroyed the enemy tower':'Your tower fell'):(win?`First to ${G.killsToWin} kill${G.killsToWin>1?'s':''}`:`${b.name} reached ${G.killsToWin} kill${G.killsToWin>1?'s':''}`);
  const t=$('overTitle');t.textContent=win?'Victory':'Defeat';t.className=win?'win':'loss';
  const row=c=>`<tr><td>${c.name}${c===p?' (you)':''}</td><td>${c.level}</td><td>${c.kills} / ${c.deaths}</td><td>${c.cs}</td><td>${n0(c.dmgDealt)}</td></tr>`;
  $('overTbl').innerHTML=`<tr><th>Champion</th><th>Level</th><th>K / D</th><th>CS</th><th>Champion damage</th></tr>${row(p)}${row(b)}<tr><td colspan="5" style="color:var(--dim)">Match time ${fmtT(G.t)}</td></tr>`;
  $('over').hidden=false;$('hud').hidden=true;$('tip').hidden=true;
}
function toMenu(){if(isLocked())document.exitPointerLock();G=null;if(NET.live){NET.live=false;NET.ready=false;NET.rematch=0;NET.overlay=false;NET.gone=false;lobbyUi();}$('banner').hidden=true;$('prep').hidden=true;$('hud').hidden=true;$('pause').hidden=true;$('over').hidden=true;$('menu').hidden=false;$('tip').hidden=true;}

// who drives a champion: the bot (or the test autopilot) or a person's input frames
const botCtl=c=>c.isBot||(c===G.player&&!!G.autoPlayer);
function tick(dt){
  for(const l of [G.champs,G.minions,G.projs])for(const u of l){u._ox=u.x;u._oy=u.y;}
  if(G.over){G.overT+=dt;updateFx(dt);if(G.overT>1.6&&!G.overShown)showGameOver();return;}
  G.t+=dt;
  G.tickN=(G.tickN||0)+1;
  const F=G.champs.map(c=>botCtl(c)?null:NET.live?NET.cur[c.team]:c===G.player?sampleInput(c):null);
  if(isCol()&&!colTick(dt)){G.champs.forEach((c,i)=>{if(!botCtl(c))applyFrame(c,F[i],true);c.vx*=0.7;c.vy*=0.7;c.input.attack=false;});updateFx(dt);return;}
  if(G.t>=G.nextWave){queueWave();G.nextWave+=WAVE_INT;}
  for(let i=G.spawnQ.length-1;i>=0;i--){const s=G.spawnQ[i];if(G.t>=s.t){G.minions.push(makeMinion(s.type,s.team,s.slot));G.spawnQ.splice(i,1);}}
  for(const r of G.relics){if(!r.active){if(G.t>=r.at){r.active=true;}continue;}
    for(const c of G.champs)if(c.alive&&dist(c,r)<r.r+c.r){r.active=false;r.at=G.t+40;c.hp=Math.min(c.maxHp,c.hp+90+c.maxHp*0.12);if(c.def.resource!=='Corruption'&&c.def.resource!=='Fury')c.res=Math.min(c.maxRes,c.res+c.maxRes*0.1);ring(r.x,r.y,10,90,'#4fe08a',0.5);if(c===G.player)popText(c.x,c.y,'+heal','#5fe08b',16,130);break;}}
  G.champs.forEach((c,i)=>{if(botCtl(c))botThink(c,dt);else applyFrame(c,F[i],false);});
  for(const c of G.champs){c.px=c.x;c.py=c.y;updateChamp(c,dt);}
  for(const m of G.minions)updateMinion(m,dt);
  for(const t of G.towers)updateTower(t,dt);
  updateProjs(dt);updateRifts(dt);updateTrails();updateBleeds();
  separate();updateArena();if(isCol()){for(const c of G.champs)colClamp(c,c.r);updateVision();colResolve();}else updateVision();
  for(const c of G.champs){const vx=(c.x-c.px)/dt,vy=(c.y-c.py)/dt;c.vx+=(clamp(vx,-600,600)-c.vx)*0.3;c.vy+=(clamp(vy,-600,600)-c.vy)*0.3;c.walkD=(c.walkD||0)+hyp(c.x-c.px,c.y-c.py);}
  G.minions=G.minions.filter(m=>m.alive||m.deadT<0.5);
  updateFx(dt);
}
let last=performance.now(),acc=0;const STEP=1/60;
// Drawing happens between two simulation steps: units are shown that fraction of the way from the last step to this one,
// so motion is smooth on any refresh rate. Online, your own champion is also drawn ahead by the moves you have made that
// the match has not applied yet, and eases back if the confirmed position differs.
const VIEW={pdx:0,pdy:0,keep:[]};
function predictOwn(p){
  if(!NET.live||!p.alive||p.dash||p.cast||p.stunT>0||p.rootT>0||p.recall)return null;
  const mine=NET.frames[NET.side],T0=G.tickN||0,n=Math.max(0,NET.myMax-T0);if(!n)return null;const step=msOf(p)*STEP;let ox=0,oy=0;
  if(!classic()){for(let t=T0+1;t<=NET.myMax;t++){const f=mine.get(t);if(f){ox+=f[0]/1000*step;oy+=f[1]/1000*step;}}}
  else{let dest=p.order&&p.order.kind!=='attack'?p.order:null;
    for(let t=T0+1;t<=NET.myMax;t++){const f=mine.get(t);if(!f||!f[8])continue;for(const e of f[8]){if(e[0]==='o')dest=e[4]?null:{x:e[2],y:e[3]};else if(e[0]==='s')dest=null;}}
    if(dest){const dx=dest.x-p.x,dy=dest.y-p.y,l=hyp(dx,dy);if(l>8){const m=Math.min(l,step*n);ox=dx/l*m;oy=dy/l*m;}}}
  const q=clampWalk(p.x+ox,p.y+oy,p.r);return{x:q.x-p.x,y:q.y-p.y};}
function viewBegin(alpha,dt){const k=1-alpha,keep=VIEW.keep;keep.length=0;
  for(const l of [G.champs,G.minions,G.projs])for(const u of l){if(u._ox===undefined)continue;const dx=u.x-u._ox,dy=u.y-u._oy;
    if(dx*dx+dy*dy>40000)continue;keep.push(u,u.x,u.y);u.x-=dx*k;u.y-=dy*k;}  // teleports (recall, portals, respawns) are not smoothed
  const p=G.player,pr=predictOwn(p),e=1-Math.exp(-dt*(pr?18:10));
  VIEW.pdx+=((pr?pr.x:0)-VIEW.pdx)*e;VIEW.pdy+=((pr?pr.y:0)-VIEW.pdy)*e;
  if(Math.abs(VIEW.pdx)+Math.abs(VIEW.pdy)>0.5&&hyp(VIEW.pdx,VIEW.pdy)<320){if(!keep.includes(p))keep.push(p,p.x,p.y);p.x+=VIEW.pdx;p.y+=VIEW.pdy;}
  for(const f of G.fx){f._t=f.t;f.t=Math.max(0,f.t-STEP*k);}}
function viewEnd(){const keep=VIEW.keep;for(let i=keep.length-3;i>=0;i-=3){const u=keep[i];u.x=keep[i+1];u.y=keep[i+2];}keep.length=0;for(const f of G.fx)if(f._t!==undefined)f.t=f._t;}
const BAKEQ=[];
function queueBakes(){BAKEQ.length=0;for(const u of G.champs){if(u.key!=='shade'||SHEETS_READY)continue;
  for(const [anim,n,sd] of [['walk',10,1],['idle',4,1],['attack',10,1],['attack',10,-1],['throw',8,1],['swing',8,1],['roar',6,1]])
    for(let d=0;d<DIRS;d++)for(let f=0;f<n;f++)BAKEQ.push(()=>champSprite(u,{anim,ph:(f+0.5)/n,side:sd,dir:d}));}}
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(0.1,(now-last)/1000);last=now;
  if(G){const t0=performance.now();while(BAKEQ.length&&performance.now()-t0<2)BAKEQ.shift()();}
  netPump();
  if(G&&NET.live&&!G.over){acc+=dt;let n=0;while(acc>=STEP&&n<8&&netTry()){acc-=STEP;n++;}
    if(acc>=STEP&&n===0)NET.waitT+=dt;else if(n)NET.waitT=0;if(acc>0.2)acc=0.2;G.hitStop=0;}
  else if(G&&!G.paused&&G.hitStop>0){G.hitStop-=dt;}
  else if(G&&!G.paused){acc+=dt;let n=0;while(acc>=STEP&&n<6){tick(STEP);acc-=STEP;n++;}if(n>=6)acc=0;}
  netPublish();netHud();
  const smooth=G&&!G.paused;if(smooth)viewBegin(clamp(acc/STEP,0,1),dt);
  try{render(dt);}finally{if(smooth)viewEnd();}
  if(G&&!G.overShown)hud(dt);updateCursor();
  if(bannerUntil&&performance.now()>bannerUntil){$('banner').hidden=true;bannerUntil=0;}
}

// ================= menu =================
function buildMenu(){
  const wrap=$('cards');wrap.innerHTML='';
  for(const key of ['cora','shade','viktor','blackjack']){const d=CH[key];const b=document.createElement('button');b.type='button';b.className='card';b.setAttribute('aria-pressed',String(key===pick));
    const dummy={ad:d.base.ad,maxHp:1,hp:1};
    b.innerHTML=`<canvas width="192" height="192"></canvas><div style="min-width:0"><div class="role">${d.role} · ${d.reach} · ${d.resource}</div><h3>${d.fullName||d.name}${d.fullName?` <span style="font-size:15px;font-weight:600;color:var(--dim)">“${d.name}”</span>`:''}</h3><p>${d.blurb}</p><ul>${kitItems(d)}</ul></div>`;b.dataset.k=key;
    drawPortrait(b.querySelector('canvas'),key,BLUE);
    b.addEventListener('click',()=>{pick=key;for(const x of wrap.children)x.setAttribute('aria-pressed',String(x===b));lobbyUi();});
    wrap.appendChild(b);}
  const seg=(id,set)=>{for(const btn of $(id).children)btn.addEventListener('click',()=>{for(const x of $(id).children)x.setAttribute('aria-pressed',String(x===btn));set(+btn.dataset.v);});};
  seg('optKills',v=>optKills=v);seg('optXp',v=>optXp=v);
  for(const btn of $('optFoe').children)btn.addEventListener('click',()=>{optFoe=btn.dataset.v;for(const x of $('optFoe').children)x.setAttribute('aria-pressed',String(x===btn));});
  for(const btn of $('maps').children){drawMapThumb(btn.querySelector('canvas'),btn.dataset.v);
    btn.addEventListener('click',()=>{if(NET.role==='g')return;setMap(btn.dataset.v);});}
  if(matchMedia('(pointer: coarse)').matches&&!matchMedia('(any-pointer: fine)').matches)$('touchNote').hidden=false;
  applySettings();
}
$('startBtn').addEventListener('click',()=>{SFX.init();newGame();});
$('hostBtn').addEventListener('click',()=>{SFX.init();netHost();});
$('joinBtn').addEventListener('click',()=>{SFX.init();netJoin();});
$('joinCode').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){SFX.init();netJoin();}});
$('onReady').addEventListener('click',()=>{NET.ready=!NET.ready;lobbyUi();});
$('onLeave').addEventListener('click',netLeave);
$('onCopy').addEventListener('click',()=>{try{navigator.clipboard.writeText(NET.code).then(()=>{$('onCopy').textContent='Copied';setTimeout(()=>$('onCopy').textContent='Copy code',1500);},()=>{});}catch(e){}});
$('netWaitBtn').addEventListener('click',toMenu);
$('resumeBtn').addEventListener('click',()=>setPause(false));
$('restartBtn').addEventListener('click',()=>{if(!NET.live)newGame();});
function updateMuteBtn(){$('muteBtn').textContent=SFX.muted?'Sound off':'Sound on';}
$('muteBtn').addEventListener('click',()=>{SFX.init();SFX.muted=!SFX.muted;updateMuteBtn();});
$('menuBtn').addEventListener('click',toMenu);
$('againBtn').addEventListener('click',()=>{if(!NET.live){newGame();return;}NET.rematch=NET.match.n;$('againBtn').textContent='Waiting for your friend…';$('againBtn').disabled=true;});
$('overMenuBtn').addEventListener('click',toMenu);
if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h);};
buildGround();buildMenu();
setTimeout(()=>{try{getRoom();}catch(e){}},0);
requestAnimationFrame(frame);
window.__riftline={get G(){return G;},newGame,tick};window.__spr=champSprite;window.__tc=tryCast;
})();
