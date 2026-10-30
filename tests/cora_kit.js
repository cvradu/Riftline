// ---- Coralisse: thrown axes become dash destinations; Corruption trades durability for damage ----
// Prototype tuning, not validated balance.
const CORA_AXES={Q:{name:'bronze',col:'#ffb347',glow:'#ff9a3c',kind:'axeQ'},RMB:{name:'blue',col:'#7cc8ff',glow:'#4aa8ff',kind:'axeW'}};
const AXE_LIFE=4;
function gainCorr(c,n){if(c.def.resource!=='Corruption')return;c.res=Math.min(100,c.res+n);c.corrT=G.t;}
const corrStage=c=>Math.min(5,Math.floor((c.res||0)/20));
// one Corruption grant per cast, on the first champion that cast's axe hits
function axeHit(c,tok,t){if(t.kind==='champ'&&!tok.g){tok.g=true;gainCorr(c,10);}}
function axeLand(c,k,x,y){const ax=c.axes[k];ax.state='ground';ax.x=x;ax.y=y;ax.until=G.t+AXE_LIFE;ax.t0=G.t;ax.r=false;ring(x,y,10,60,CORA_AXES[k].glow,0.3);}
function returnAxe(c,k){const ax=c.axes[k];if(ax.state==='hand'||ax.state==='returning')return;
  if(!c.alive||ax.state==='flying'){ax.state='hand';return;}
  ax.state='returning';G.projs.push({homing:c,x:ax.x,y:ax.y,speed:1700,team:c.team,src:c,kind:CORA_AXES[k].kind,alive:true,age:0,ang:0,onHit:()=>{ax.state='hand';}});}
function pickAxe(c,k){const ax=c.axes[k];ax.state='hand';spark(ax.x,ax.y,CORA_AXES[k].glow,6);}
function groundedAxes(c){return['Q','RMB'].filter(k=>c.axes[k].state==='ground'&&!c.axes[k].r);}
function updateAxes(c){
  if(!c.axes)return;
  for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.state!=='ground'||ax.r)continue;
    if(c.dash&&c.dash.claim===k)continue;
    if(G.t>ax.until)returnAxe(c,k);
    else if(c.alive&&!c.dash&&G.t-ax.t0>0.5&&dist(c,ax)<c.r+30)pickAxe(c,k);}
  const s=c.rSeq;
  if(s&&s.state==='armed'&&G.t>s.until)endR(c);
}
function endR(c){const s=c.rSeq;if(!s)return;c.rSeq=null;for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.r){ax.r=false;if(ax.state==='ground')returnAxe(c,k);}}}
function throwAxe(c,k,ax_,ay_,o){
  const ang=angTo(c,ax_,ay_),len=clamp(hyp(ax_-c.x,ay_-c.y),150,o.range);
  const tx=clamp(c.x+Math.cos(ang)*len,60,W-60),ty=clamp(c.y+Math.sin(ang)*len,LANE_TOP+40,LANE_BOT-40),L=hyp(tx-c.x,ty-c.y);
  const tok={g:false};c.axes[k].state='flying';
  shoot(c,{ang:angTo(c,tx,ty),speed:o.speed,range:L,radius:o.radius,pierce:true,kind:CORA_AXES[k].kind,
    onHit:t=>{dealDamage(c,t,o.dmg,'phys',{});axeHit(c,tok,t);spark(t.x,t.y,CORA_AXES[k].glow,6);t.kick={until:G.t+0.12,ang};if(o.onHit)o.onHit(t);},
    onEnd:p=>{axeLand(c,k,tx,ty);if(o.onLand)o.onLand(tx,ty,tok);}});
}

A1.Q={name:"Mother's Wrath",max:5,cd:[9,8.5,8,7.5,7],cost:[0,0,0,0,0],range:825,axe:'Q',
  dmg:(c,r)=>[70,105,140,175,210][r-1]+0.8*c.ad, cleave:(c,r)=>[30,50,70,90,110][r-1]+0.5*c.ad,
  desc:(c,r,a)=>`Throw the bronze axe to a spot up to 825 units away, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (70/105/140/175/210 + 80% AD) to enemies along its path and slowing enemies where it lands by 35% for 1s. It stays there for 4s as a Claim the Fallen destination. Catching it with Claim the Fallen turns your next basic attack into a cleave for <span class="ph">${n0(a.cleave(c,r))}</span> bonus damage to everything in front of you.`,
  avail:c=>c.axes.Q.state==='hand'?true:'axeaway',
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.18,ang,()=>{
    throwAxe(c,'Q',ax,ay,{range:825,speed:1500,radius:40,dmg:a.dmg(c,r),onLand:(x,y,tok)=>{
      for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||hyp(u.x-x,u.y-y)>160+u.r)continue;slow(u,0.35,1);}
      ring(x,y,20,160,'#ffb347',0.35);}});});return true;}};
A1.RMB={name:"Father's Ruin",max:5,cd:[10,9.5,9,8.5,8],cost:[0,0,0,0,0],range:900,axe:'RMB',
  dmg:(c,r)=>[60,95,130,165,200][r-1]+0.7*c.ad,
  desc:(c,r,a)=>`Hurl the blue axe in a fast straight line up to 900 units, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (60/95/130/165/200 + 70% AD) to enemies along the way before it lodges at the end. It stays there for 4s as a second Claim the Fallen destination. Catching it with Claim the Fallen grants 40% move speed that fades over 1.5s.`,
  avail:c=>c.axes.RMB.state==='hand'?true:'axeaway',
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.12,ang,()=>{throwAxe(c,'RMB',ax,ay,{range:900,speed:2600,radius:30,dmg:a.dmg(c,r)});});return true;}};
A1.E={name:'Claim the Fallen',max:5,cd:[12,11,10,9,8],cost:[0,0,0,0,0],range:700,charges:2,
  dmg:(c,r)=>[40,65,90,115,140][r-1]+0.5*c.ad,
  desc:(c,r,a)=>`Two charges. Dash to one of your grounded axes within 700 units (the one nearest your cursor), slashing enemies along the way for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (40/65/90/115/140 + 50% AD), and catch it: +10 Corruption, plus the axe's catch bonus. Each dash uses a charge; charges recharge one at a time. Stuns interrupt the dash. Unavailable with no grounded axe.`,
  avail:c=>c.rSeq?'busy':groundedAxes(c).some(k=>dist(c,c.axes[k])<=700)?true:'noaxe',
  cast(c,ax,ay,r,a){
    const ks=groundedAxes(c).filter(k=>dist(c,c.axes[k])<=700);if(!ks.length){c.failWhy='noaxe';return false;}
    const k=ks.reduce((b,x)=>hyp(c.axes[x].x-ax,c.axes[x].y-ay)<hyp(c.axes[b].x-ax,c.axes[b].y-ay)?x:b);const axe=c.axes[k];
    const ang=angTo(c,axe.x,axe.y),len=Math.max(1,dist(c,axe)),d=a.dmg(c,r),hit=new Set(),tok={g:false};
    dash(c,ang,len,1800,{kind:'E',claim:k,interrupt:true,onTick:()=>{for(const u of enemiesOf(c.team)){if(u.kind==='tower'||hit.has(u)||!hittable(u)||dist(c,u)>c.r+u.r+40)continue;
        hit.add(u);dealDamage(c,u,d,'phys',{});axeHit(c,tok,u);slash(u.x,u.y,ang+PI/2,CORA_AXES[k].glow);u.kick={until:G.t+0.12,ang};}},
      onEnd:()=>{if(axe.state!=='ground')return;axe.state='hand';gainCorr(c,10);ring(c.x,c.y,10,90,CORA_AXES[k].glow,0.35);
        if(k==='Q'){c.cleaveReady={until:G.t+5,dmg:A1.Q.cleave(c,Math.max(1,c.ranks.Q))};if(c===G.player)popText(c.x,c.y,'Cleave ready','#ffb347',14,130);}
        else{c.msBuff={until:G.t+1.5,pct:0.4};if(c===G.player)popText(c.x,c.y,'Swift','#7cc8ff',14,130);}}});
    return true;}};
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
    for(const k of ['Q','RMB']){const x=c.axes[k];if(x.state!=='hand'){x.state='hand';spark(c.x,c.y,CORA_AXES[k].glow,6);}}
    const ang=angTo(c,ax,ay),pt=o=>({x:clamp(c.x+Math.cos(ang+o)*430,60,W-60),y:clamp(c.y+Math.sin(ang+o)*430,LANE_TOP+40,LANE_BOT-40)});
    const p1=pt(-0.5),p2=pt(0.5);c.rSeq={state:'armed',p1,p2,readyAt:G.t+0.5,until:G.t+AXE_LIFE,rank:r};
    for(const [k,p] of [['Q',p1],['RMB',p2]]){const x=c.axes[k];x.state='ground';x.x=p.x;x.y=p.y;x.r=true;x.until=G.t+AXE_LIFE;x.t0=G.t;
      G.fx.push({k:'axefly',x0:c.x,y0:c.y,x1:p.x,y1:p.y,key:k,t:0,dur:0.25});}
    return true;}};
CH.cora.passive={name:'Corruption',desc:c=>{const st=corrStage(c);return`Corruption runs from 0 to 100. Axe ability hits on champions grant 10 per cast, and catching an axe with Claim the Fallen grants 10. Every 20 Corruption gives 5% more damage dealt and 3% more damage taken, up to +25% dealt and +15% taken. It starts decaying after 5s without dealing or taking champion damage. Now: ${n0(c.res||0)} (+${st*5}% dealt, +${st*3}% taken).`;}};
