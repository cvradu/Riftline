// ---- Coralisse: a recallable bronze axe, a lodging blue axe, a ground-splitting E; Corruption trades durability for damage ----
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
function pickAxe(c,k){const ax=c.axes[k];ax.state='hand';spark(ax.x,ax.y,CORA_AXES[k].glow,6);}
function groundedAxes(c){return['Q','RMB'].filter(k=>c.axes[k].state==='ground'&&!c.axes[k].r);}
function updateAxes(c){
  if(!c.axes)return;
  for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.state!=='ground'||ax.r)continue;
    if(G.t>ax.until)returnAxe(c,k);
    else if(c.alive&&!c.dash&&G.t-ax.t0>0.5&&dist(c,ax)<c.r+30)pickAxe(c,k);}
  const s=c.rSeq;
  if(s&&s.state==='armed'&&G.t>s.until)endR(c);
}
function endR(c){const s=c.rSeq;if(!s)return;c.rSeq=null;for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.r){ax.r=false;if(ax.state==='ground')returnAxe(c,k);}}}
function throwAxe(c,k,ax_,ay_,o){
  const ang=angTo(c,ax_,ay_),len=clamp(hyp(ax_-c.x,ay_-c.y),150,o.range);
  const tx=clamp(c.x+Math.cos(ang)*len,60,W-60),ty=clamp(c.y+Math.sin(ang)*len,LANE_TOP+40,LANE_BOT-40),L=hyp(tx-c.x,ty-c.y);
  const tok={g:false},ax=c.axes[k];ax.state='flying';
  ax.proj=shoot(c,{ang:angTo(c,tx,ty),speed:o.speed,range:L,radius:o.radius,pierce:true,kind:CORA_AXES[k].kind,
    onHit:t=>{dealDamage(c,t,o.dmg,'phys',{});axeHit(c,tok,t);spark(t.x,t.y,CORA_AXES[k].glow,6);t.kick={until:G.t+0.12,ang};if(o.onHit)o.onHit(t);},
    onEnd:p=>{axeLand(c,k,tx,ty);if(o.onLand)o.onLand(tx,ty,tok);}});
}
// recall: the axe flies back from wherever it is, hitting everything along the way, and arms the cleave when caught
function recallAxe(c,k,dmg){
  const ax=c.axes[k],from=axePos(ax);stopFlight(ax);ax.state='returning';const tok={g:false},hit=new Set();
  G.projs.push({homing:c,x:from.x,y:from.y,speed:2100,team:c.team,src:c,kind:CORA_AXES[k].kind,alive:true,age:0,ang:0,
    sweep:{hit,radius:AXE_W,onHit:u=>{dealDamage(c,u,dmg,'phys',{});axeHit(c,tok,u);spark(u.x,u.y,CORA_AXES[k].glow,8);u.kick={until:G.t+0.12,ang:angTo(u,c.x,c.y)};}},
    onHit:()=>{ax.state='hand';ring(c.x,c.y,10,80,CORA_AXES[k].glow,0.35);
      c.cleaveReady={until:G.t+5,dmg:A1.Q.cleave(c,Math.max(1,c.ranks.Q))};if(c===G.player)popText(c.x,c.y,'Cleave ready','#ffb347',14,130);},
    onLost:()=>{ax.state='hand';}});
  SFX.play('dash',from.x,from.y,0.7);
}
A1.Q={name:"Mother's Wrath",max:5,cd:[9,8.5,8,7.5,7],cost:[0,0,0,0,0],range:825,axe:'Q',
  dmg:(c,r)=>[70,105,140,175,210][r-1]+0.8*c.ad, cleave:(c,r)=>[30,50,70,90,110][r-1]+0.5*c.ad,
  desc:(c,r,a)=>`Throw the bronze axe to a spot up to 825 units away. It cuts a wide path, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (70/105/140/175/210 + 80% AD) to everything it passes through, and slows enemies where it lands by 35% for 1s. <b>Recast</b> while it is out to summon it back: it flies to you, hitting everything on the way for the same damage. Catching it turns your next basic attack into a cleave for <span class="ph">${n0(a.cleave(c,r))}</span> bonus damage to everything in front of you. Left alone, it returns harmlessly after 4s.`,
  avail:c=>c.axes.Q.state==='hand'?true:'axeaway',
  canRecast:c=>{const ax=c.axes&&c.axes.Q;return!!ax&&!ax.r&&(ax.state==='ground'||ax.state==='flying');},
  recast(c){recallAxe(c,'Q',A1.Q.dmg(c,Math.max(1,c.ranks.Q)));c.castAnim={start:G.t,W:0.05,kind:'roar'};return true;},
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.18,ang,()=>{
    throwAxe(c,'Q',ax,ay,{range:825,speed:1500,radius:AXE_W,dmg:a.dmg(c,r),onLand:(x,y,tok)=>{
      for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||hyp(u.x-x,u.y-y)>160+u.r)continue;slow(u,0.35,1);}
      ring(x,y,20,160,'#ffb347',0.35);}});});return true;}};
A1.RMB={name:"Father's Ruin",max:5,cd:[10,9.5,9,8.5,8],cost:[0,0,0,0,0],range:900,axe:'RMB',
  dmg:(c,r)=>[60,95,130,165,200][r-1]+0.7*c.ad,
  desc:(c,r,a)=>`Hurl the blue axe in a fast straight line up to 900 units, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (60/95/130/165/200 + 70% AD) to everything it passes through before it lodges at the end. Walk over it to pick it up early; otherwise it returns after 4s.`,
  avail:c=>c.axes.RMB.state==='hand'?true:'axeaway',
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.12,ang,()=>{throwAxe(c,'RMB',ax,ay,{range:900,speed:2600,radius:AXE_W,dmg:a.dmg(c,r)});});return true;}};
A1.E={name:'Earthrend',max:5,cd:[11,10,9,8,7],cost:[0,0,0,0,0],range:700,
  dmg:(c,r)=>[70,105,140,175,210][r-1]+0.7*c.ad,
  desc:(c,r,a)=>`Drive an axe into the ground and rip it open in a straight line. After 0.25s a fissure tears 700 units ahead of you, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (70/105/140/175/210 + 70% AD) to every enemy it reaches and slowing them by 30% for 1.5s.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.25,ang,()=>{
    G.rifts.push({x0:c.x+Math.cos(ang)*c.r,y0:c.y+Math.sin(ang)*c.r,ux:Math.cos(ang),uy:Math.sin(ang),len:700,speed:2000,half:65,t:0,spawned:0,
      hit:new Set(),tok:{g:false},dmg:a.dmg(c,r),src:c,seed:(Math.random()*1e9)|0});
    SFX.play('quake',c.x,c.y);if(c===G.player)shake(5,0.25);});return true;}};
// the fissure travels outward, hitting each enemy once as it reaches them
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
A1.R={name:'The Hunger Between',max:3,cd:[110,95,80],cost:[0,0,0],range:430,
  seg:(c,r)=>[120,200,280][r-1]+0.8*c.ad,
  desc:(c,r,a)=>`Recall both axes, then throw them to two points forming a V in front of you. After a short wind-up, recast to dash to the first axe and then the second, dealing <span class="ph">${n0(a.seg(c,r))}</span> physical damage (120/200/280 + 80% AD) along each segment; enemies hit by both take half from the second. The first dash grants 40 Corruption. Stuns interrupt the sequence. Without a recast the axes return after 4s.`,
  canRecast:c=>!!(c.rSeq&&c.rSeq.state==='armed'&&G.t>=c.rSeq.readyAt),
  avail:c=>c.rSeq?'windup':true,
  recast(c){const s=c.rSeq;s.state='dash1';gainCorr(c,40);const r=s.rank,d=A1.R.seg(c,r),hit1=new Set(),hit2=new Set(),tok={g:false};
    const hitter=(set,mult)=>()=>{for(const u of enemiesOf(c.team)){if(u.kind==='tower'||set.has(u)||!hittable(u)||dist(c,u)>c.r+u.r+50)continue;set.add(u);
      const m=set===hit2&&hit1.has(u)?0.5:1;dealDamage(c,u,d*m,'phys',{force:true});axeHit(c,tok,u);impact(u,'#b46bff',true);u.kick={until:G.t+0.14,ang:c.facing};
      if(c===G.player||u===G.player){shake(5,0.15);G.hitStop=0.04;}}};
    const cancel=()=>{endR(c);};
    dash(c,angTo(c,s.p1.x,s.p1.y),Math.max(1,dist(c,s.p1)),2100,{kind:'R',interrupt:true,onCancel:cancel,onTick:hitter(hit1),onEnd:()=>{
      c.axes.Q.state='hand';c.axes.Q.r=false;ring(c.x,c.y,10,80,'#ffb347',0.3);s.state='dash2';
      dash(c,angTo(c,s.p2.x,s.p2.y),Math.max(1,dist(c,s.p2)),2100,{kind:'R',interrupt:true,onCancel:cancel,onTick:hitter(hit2),onEnd:()=>{
        c.axes.RMB.state='hand';c.axes.RMB.r=false;ring(c.x,c.y,10,110,'#b46bff',0.4);c.rSeq=null;}});}});
    return true;},
  cast(c,ax,ay,r,a){
    for(const k of ['Q','RMB']){const x=c.axes[k];stopFlight(x);if(x.state!=='hand'){x.state='hand';spark(c.x,c.y,CORA_AXES[k].glow,6);}}
    for(const p of G.projs)if(p.homing===c&&(p.kind==='axeQ'||p.kind==='axeW')){p.alive=false;}
    const ang=angTo(c,ax,ay),pt=o=>({x:clamp(c.x+Math.cos(ang+o)*430,60,W-60),y:clamp(c.y+Math.sin(ang+o)*430,LANE_TOP+40,LANE_BOT-40)});
    const p1=pt(-0.5),p2=pt(0.5);c.rSeq={state:'armed',p1,p2,readyAt:G.t+0.5,until:G.t+AXE_LIFE,rank:r};
    for(const [k,p] of [['Q',p1],['RMB',p2]]){const x=c.axes[k];x.state='ground';x.x=p.x;x.y=p.y;x.r=true;x.until=G.t+AXE_LIFE;x.t0=G.t;
      G.fx.push({k:'axefly',x0:c.x,y0:c.y,x1:p.x,y1:p.y,key:k,t:0,dur:0.25});}
    return true;}};
CH.cora.passive={name:'Corruption',desc:c=>{const st=corrStage(c);return`Corruption runs from 0 to 100. Each ability cast that hits a champion grants 10. Every 20 Corruption gives 5% more damage dealt and 3% more damage taken, up to +25% dealt and +15% taken. It starts decaying after 5s without dealing or taking champion damage. Now: ${n0(c.res||0)} (+${st*5}% dealt, +${st*3}% taken).`;}};
