// ================= colosseum: a best-of-3 duel with bushes, alcoves, a central obelisk, healing plants and a closing storm =================
// Prototype tuning, not validated balance.
const COL={cx:3200,cy:650,R:1000,obR:125,WALL_H:130,PARAPET:30,STORM_DELAY:40,STORM_TIME:50,STORM_MIN:330,LEVELS:[6,11,16],PLANT_FIRST:12,PLANT_EVERY:30};
const colPt=(deg,r)=>{const a=deg*PI/180;return{a,x:COL.cx+Math.cos(a)*r,y:COL.cy+Math.sin(a)*r};};
// four alcoves cut into the wall, each one choked with brush, and two more patches of brush on the open floor
COL.alc=[0,90,180,270].map(d=>({...colPt(d,COL.R+40),r:170}));
COL.bushes=[...COL.alc.map(a=>({...colPt(a.a*180/PI,COL.R+10),r:155})),colPt(-45,560),colPt(135,560)].map(b=>({x:b.x,y:b.y,r:b.r||125}));
// the healing plants sit on the line both spawns are equally far from: one by each wall and one at the obelisk's foot
COL.plantSpots=[colPt(-45,820),colPt(135,820),colPt(135,240)];
COL.spawn=[225,45];  // degrees: blue starts on the left of the screen, red on the right
// the wall's distance from the centre in every direction: the main circle, pushed out where an alcove opens
COL.N=720;COL.rb=new Float32Array(COL.N);
for(let i=0;i<COL.N;i++){const th=i/COL.N*TAU;let r=COL.R;
  for(const a of COL.alc){const D=COL.R+40,ph=th-a.a,s=D*Math.sin(ph),c=D*Math.cos(ph);if(c>0&&Math.abs(s)<a.r)r=Math.max(r,c+Math.sqrt(a.r*a.r-s*s));}COL.rb[i]=r;}
COL.rbMax=Math.max(...COL.rb);
function colRB(th){let f=(((th%TAU)+TAU)%TAU)/TAU*COL.N;const i=Math.floor(f)%COL.N,j=(i+1)%COL.N;f-=Math.floor(f);return COL.rb[i]*(1-f)+COL.rb[j]*f;}
const isCol=()=>!!G&&G.mode==='col';
function colClamp(u,r){
  let dx=u.x-COL.cx,dy=u.y-COL.cy,d=hyp(dx,dy);const lim=colRB(Math.atan2(dy,dx))-r;
  if(d>lim){u.x=COL.cx+dx/d*lim;u.y=COL.cy+dy/d*lim;dx=u.x-COL.cx;dy=u.y-COL.cy;d=lim;}
  const m=COL.obR+r;if(d<m){if(d<0.01){dx=1;dy=0;d=1;}u.x=COL.cx+dx/d*m;u.y=COL.cy+dy/d*m;}}
function clampWalk(x,y,r){if(isCol()){const p={x,y};colClamp(p,r);return p;}return{x:clamp(x,40+r,W-40-r),y:clamp(y,LANE_TOP+r,LANE_BOT-r)};}
function colBlocked(x,y){const dx=x-COL.cx,dy=y-COL.cy,d=hyp(dx,dy);return d<COL.obR||d>colRB(Math.atan2(dy,dx));}
const bushAt=(x,y)=>COL.bushes.findIndex(b=>hyp(x-b.x,y-b.y)<b.r);
// walk around the obelisk instead of into it: near it, slide along whichever tangent heads toward the goal
function steer(c,gx,gy){let vx=gx-c.x,vy=gy-c.y;const l=hyp(vx,vy)||1;vx/=l;vy/=l;
  if(!isCol())return{x:vx,y:vy};
  const ox=COL.cx-c.x,oy=COL.cy-c.y,od=hyp(ox,oy)||1,ahead=ox*vx+oy*vy,side=ox*vy-oy*vx;
  if(ahead>0&&ahead<l+COL.obR&&Math.abs(side)<COL.obR+c.r+14&&od<COL.obR+c.r+240){const s=side>=0?1:-1;return{x:oy/od*s,y:-ox/od*s};}
  return{x:vx,y:vy};}
// brush: a champion in a bush is hidden from enemies outside it; standing close, sharing the bush or dealing damage gives them away
function updateVision(){
  for(const u of G.champs)u.bush=u.alive?bushAt(u.x,u.y):-1;
  for(const u of G.champs){let h=u.alive&&u.bush>=0&&!(u.revealT>G.t);
    if(h)for(const e of G.champs)if(e.team!==u.team&&e.alive&&(e.bush===u.bush||dist(e,u)<170||shadeQuarry(e)===u))h=false;
    u.hidden=h;}}
const STORM_SRC={kind:'storm',team:-1,name:'The storm',alive:true};
// healing plants: one basic attack splits a ripe plant into beads that heal whoever walks over them
function breakPlant(p,src){if(!p.alive)return;p.alive=false;p.ripeAt=G.col.t+COL.PLANT_EVERY;
  const base=angTo(src,p.x,p.y);SFX.play('hit',p.x,p.y,0.6);ring(p.x,p.y,8,70,'#9dffb0',0.35);spark(p.x,p.y,'#7dff9a',10);
  for(let i=0;i<3;i++){const a=base+(i-1)*0.9+rnd(-0.15,0.15),d=rnd(110,150),to=clampWalk(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,20);
    G.col.beads.push({x0:p.x,y0:p.y,x:to.x,y:to.y,t0:G.t,land:G.t+0.35});}}
function colLevel(c,L){c.level=L;c.xp=0;c.points=L;c.ranks={Q:0,E:0,RMB:0,R:0};c.chg={};computeStats(c,true);for(let i=0;i<8&&c.points>0;i++)botSkillPoints(c);c.points=0;}
let bannerUntil=0;
function banner(title,sub,dur){const b=$('banner');b.querySelector('b').textContent=title;b.querySelector('span').textContent=sub||'';b.hidden=false;bannerUntil=performance.now()+(dur||1.5)*1000;}
function startRound(){const C=G.col;C.round++;C.state='count';C.stateT=4;C.lastN=null;C.t=0;C.storm=null;C.stormWarned=false;C.stormTick=0;C.beads=[];
  for(const p of C.plants){p.alive=false;p.ripeAt=COL.PLANT_FIRST;}
  G.projs=[];G.rifts=[];G.arena=null;G.fx=[];G.texts=[];
  const L=COL.LEVELS[Math.min(C.round,3)-1];
  for(const c of G.champs){const a=COL.spawn[c.team]*PI/180;
    c.alive=true;colLevel(c,L);c.hp=c.maxHp;resetKitState(c);if(c.def.resource!=='Corruption')c.res=c.maxRes;
    c.x=COL.cx+Math.cos(a)*720;c.y=COL.cy+Math.sin(a)*720;c.facing=a+PI;c.input.ax=COL.cx;c.input.ay=COL.cy;
    c.cds={Q:0,E:0,RMB:0,R:0};c.dashCd=0;c.stunT=0;c.slows=[];c.stealthT=0;c.untargetT=0;c.atkCd=0;c.rootT=0;c.wind=c.cast=c.dash=null;c.empower=null;c.spin=null;c.asBuff=null;c.msBuff=null;
    c.bleed=null;c.recall=null;c.order=null;c.hook=null;c.crosscut=null;c.shadeMark=null;c.eRecast=null;c.quarry=null;c.execBy=null;c.revealT=0;c.hidden=false;c.retreat=false;c.mem=null;c.lastChampHit=null;c.cleaveReady=null;c.vx=c.vy=0;c.atk=null;c.castAnim=null;}
  cam.x=G.player.x;cam.y=G.player.y;pending=null;buildHud();hudDirty=true;
  banner(`Round ${C.round}`,`Level ${L} · ${C.wins[G.player.team]} – ${C.wins[1-G.player.team]}`,1.2);
}
// returns false while the round is frozen (countdown, or the pause after a death)
function colTick(dt){const C=G.col;
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
  for(const p of C.plants)if(!p.alive&&C.t>=p.ripeAt){p.alive=true;p.bornT=G.t;ring(p.x,p.y,6,60,'#9dffb0',0.4);}
  for(let i=C.beads.length-1;i>=0;i--){const b=C.beads[i];if(G.t<b.land)continue;
    const c=G.champs.find(u=>u.alive&&hyp(u.x-b.x,u.y-b.y)<u.r+22);if(!c)continue;
    const h=Math.min(c.maxHp-c.hp,40+c.maxHp*0.06);c.hp+=h;C.beads.splice(i,1);spark(b.x,b.y,'#9dffb0',8);ring(b.x,b.y,6,50,'#7dff9a',0.3);SFX.play('tick',b.x,b.y);
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
  const outline=(dr)=>{c.beginPath();for(let i=0;i<COL.N;i+=2){const th=i/COL.N*TAU,r=COL.rb[i]+(dr||0);c.lineTo(o+Math.cos(th)*r,o+Math.sin(th)*r);}c.closePath();};
  c.fillStyle='#120d0b';c.fillRect(0,0,S,S);
  outline();c.fillStyle='#7a6345';c.fill();
  c.save();outline();c.clip();
  // sand: grain, raked rings, old blood
  for(let i=0;i<11000;i++){const x=R()*S,y=R()*S,r=3+R()*18,k=R();c.fillStyle=k<0.45?`rgba(60,45,30,${0.07+R()*0.13})`:k<0.85?`rgba(160,132,92,${0.05+R()*0.11})`:`rgba(40,28,20,${0.09+R()*0.12})`;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  c.strokeStyle='rgba(50,36,24,.22)';c.lineWidth=3;for(const r of [430,650,870]){c.beginPath();c.arc(o,o,r,0,TAU);c.stroke();}
  for(let i=0;i<34;i++){const a=R()*TAU,d=200+R()*700,x=o+Math.cos(a)*d,y=o+Math.sin(a)*d;for(let j=0;j<6;j++){c.fillStyle=`rgba(${80+R()*30|0},${18+R()*10|0},${16+R()*8|0},${0.08+R()*0.1})`;c.beginPath();c.ellipse(x+rnd(-20,20),y+rnd(-12,12),6+R()*22,4+R()*12,R()*3,0,TAU);c.fill();}}
  // alcove floors: worn flagstones
  for(const a of COL.alc){const ax=o+a.x-COL.cx,ay=o+a.y-COL.cy;c.fillStyle='#544a40';c.beginPath();c.arc(ax,ay,a.r,0,TAU);c.fill();
    c.strokeStyle='rgba(20,16,12,.45)';c.lineWidth=3;for(let gx=-a.r;gx<=a.r;gx+=44){c.beginPath();c.moveTo(ax+gx,ay-a.r);c.lineTo(ax+gx,ay+a.r);c.stroke();}
    for(let gy=-a.r;gy<=a.r;gy+=44){c.beginPath();c.moveTo(ax-a.r,ay+gy);c.lineTo(ax+a.r,ay+gy);c.stroke();}}
  // stone border just inside the wall
  c.lineWidth=96;c.strokeStyle='#5c5248';outline();c.stroke();
  c.strokeStyle='rgba(20,16,12,.5)';c.lineWidth=3;for(let i=0;i<COL.N;i+=6){const th=i/COL.N*TAU,r=COL.rb[i];c.beginPath();c.moveTo(o+Math.cos(th)*(r-48),o+Math.sin(th)*(r-48));c.lineTo(o+Math.cos(th)*r,o+Math.sin(th)*r);c.stroke();}
  c.lineWidth=2;outline(-48);c.stroke();
  // central plaza around the obelisk
  c.fillStyle='#5a4f45';c.beginPath();c.arc(o,o,300,0,TAU);c.fill();c.strokeStyle='rgba(20,16,12,.5)';c.lineWidth=3;
  for(const r of [160,215,260,300]){c.beginPath();c.arc(o,o,r,0,TAU);c.stroke();}
  for(let i=0;i<24;i++){const a=i/24*TAU;c.beginPath();c.moveTo(o+Math.cos(a)*160,o+Math.sin(a)*160);c.lineTo(o+Math.cos(a)*300,o+Math.sin(a)*300);c.stroke();}
  c.strokeStyle='rgba(150,30,40,.5)';c.lineWidth=5;c.beginPath();c.arc(o,o,188,0,TAU);c.stroke();
  for(let i=0;i<12;i++){const a=i/12*TAU;c.fillStyle='rgba(150,30,40,.45)';c.fillRect(o+Math.cos(a)*188-5,o+Math.sin(a)*188-5,10,10);}
  // brush roots and the plants' beds
  for(const b of COL.bushes)for(let i=0;i<70;i++){const a=R()*TAU,rr=Math.sqrt(R())*b.r;c.fillStyle=`rgba(${26+R()*18|0},${54+R()*30|0},${26+R()*14|0},${0.45+R()*0.35})`;c.beginPath();c.arc(o+b.x-COL.cx+Math.cos(a)*rr,o+b.y-COL.cy+Math.sin(a)*rr,8+R()*16,0,TAU);c.fill();}
  for(const p of COL.plantSpots){c.fillStyle='rgba(40,30,20,.55)';c.beginPath();c.arc(o+p.x-COL.cx,o+p.y-COL.cy,34,0,TAU);c.fill();c.strokeStyle='rgba(120,200,120,.35)';c.lineWidth=3;c.stroke();}
  // spawn circles
  for(const t of [BLUE,RED]){const s=colPt(COL.spawn[t],720);c.strokeStyle=TEAMC[t];c.globalAlpha=0.45;c.lineWidth=5;c.beginPath();c.arc(o+s.x-COL.cx,o+s.y-COL.cy,70,0,TAU);c.stroke();c.globalAlpha=1;}
  c.restore();
  c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=8;outline();c.stroke();
  colGround={c:g,ox:COL.cx-o,oy:COL.cy-o};
}
function buildColProps(){const R=mulberry(23);COL_PROPS=[{kind:'obelisk',x:COL.cx,y:COL.cy}];
  COL.bushes.forEach((b,i)=>{const n=Math.round(b.r/11);for(let j=0;j<n;j++){const a=R()*TAU,rr=Math.sqrt(R())*b.r*0.88;COL_PROPS.push({kind:'tuft',x:b.x+Math.cos(a)*rr,y:b.y+Math.sin(a)*rr,b:i,v:(R()*4)|0});}});}
function drawColTerrain(){
  groundT(0);ctx.fillStyle='#0c0907';ctx.fillRect(COL.cx-4000,COL.cy-4000,8000,8000);
  if(!colGround)buildColGround();ctx.drawImage(colGround.c,colGround.ox,colGround.oy);
}
// walls: tall with tiered stands along the back of the bowl, a low parapet along the front so the floor stays visible
function drawColWalls(t){screenT();const N=COL.N,st=4,segs=[];
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
// the Bloodstone Obelisk, baked once per scale as a pixel sprite; runes and the heart above it pulse live
function obeliskSprite(){let s=SPR.get('obelisk');if(s)return s;const k=ART_K,ext=190,top=330;
  const w=Math.ceil(2*ext*k)+8,h=Math.ceil((top+ext*0.5)*k)+8,ax=Math.round(w/2),ay=Math.ceil(top*k)+4,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  const iso=(dx,dy,z)=>[ax+(dx+dy)*IC*k,ay+((dy-dx)*IC*IK-z)*k];
  const poly=(pts,col)=>{g.fillStyle=col;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();};
  const lit=a=>clamp(0.5-0.5*(Math.cos(a)+Math.sin(a))/1.414,0,1);  // faces turned toward the upper left of the screen catch the light
  const tone=(l,dark,mid,light)=>l>0.66?light:l>0.33?mid:dark;
  const prism=(r0,r1,z0,z1,pal,apex)=>{const n=8,fs=[];
    for(let i=0;i<n;i++){const a0=i/n*TAU+PI/8,a1=(i+1)/n*TAU+PI/8,am=(a0+a1)/2,fy=Math.sin(am)-Math.cos(am);if(fy>0)fs.push({a0,a1,am,fy});}
    fs.sort((p,q)=>p.fy-q.fy);
    for(const f of fs){const col=tone(lit(f.am),...pal);
      if(apex!==undefined)poly([iso(Math.cos(f.a0)*r0,Math.sin(f.a0)*r0,z0),iso(Math.cos(f.a1)*r0,Math.sin(f.a1)*r0,z0),iso(0,0,apex)],col);
      else poly([iso(Math.cos(f.a0)*r0,Math.sin(f.a0)*r0,z0),iso(Math.cos(f.a1)*r0,Math.sin(f.a1)*r0,z0),iso(Math.cos(f.a1)*r1,Math.sin(f.a1)*r1,z1),iso(Math.cos(f.a0)*r1,Math.sin(f.a0)*r1,z1)],col);}
    if(apex===undefined){const top=[];for(let i=0;i<n;i++){const a=i/n*TAU+PI/8;top.push(iso(Math.cos(a)*r1,Math.sin(a)*r1,z1));}poly(top,pal[3]||pal[2]);}};
  prism(178,178,0,16,['#2f2822','#3b322b','#4a4037','#564b41']);
  prism(150,150,16,32,['#352d26','#43392f','#544838','#625545']);
  prism(100,80,32,250,['#2b2522','#3a322d','#4b4139']);
  prism(80,0,250,0,['#3d201f','#5a2a27','#6e3430'],300);
  // carved rune channels on the faces toward the camera
  for(let i=0;i<8;i++){const am=(i+0.5)/8*TAU+PI/8;if(Math.sin(am)-Math.cos(am)<=0.2)continue;const p0=iso(Math.cos(am)*99,Math.sin(am)*99,70),p1=iso(Math.cos(am)*84,Math.sin(am)*84,222);
    g.strokeStyle='#4a1016';g.lineWidth=Math.max(1,5*k);g.beginPath();g.moveTo(p0[0],p0[1]);g.lineTo(p1[0],p1[1]);g.stroke();}
  // cracks and chips
  const R=mulberry(5);g.strokeStyle='rgba(10,8,6,.55)';g.lineWidth=Math.max(1,1.5*k);
  for(let i=0;i<7;i++){const a=PI/4+(R()-0.5)*1.6,z=60+R()*170;let p=iso(Math.cos(a)*95,Math.sin(a)*95,z);g.beginPath();g.moveTo(p[0],p[1]);for(let j=0;j<3;j++){p=[p[0]+(R()-0.5)*10*k,p[1]+R()*14*k];g.lineTo(p[0],p[1]);}g.stroke();}
  s={c,ax,ay};SPR.set('obelisk',s);return s;}
function drawObelisk(t){const s=obeliskSprite(),p=P(COL.cx,COL.cy),pl=G.player;let a=1;
  // see-through when the player walks behind it
  if(pl.alive&&(pl.y-pl.x)<(COL.cy-COL.cx)){const q=P(pl.x,pl.y,50);if(Math.abs(q.x-p.x)<130*SCALE&&q.y<p.y&&q.y>p.y-340*SCALE)a=0.42;}
  blit(s,p.x,p.y,a,0);
  const pulse=0.5+0.5*Math.sin(t*2.4);ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle=`rgba(255,59,79,${a*(0.3+0.45*pulse)})`;ctx.lineWidth=3*SCALE;
  for(let i=0;i<8;i++){const am=(i+0.5)/8*TAU+PI/8;if(Math.sin(am)-Math.cos(am)<=0.2)continue;const p0=P(COL.cx+Math.cos(am)*99,COL.cy+Math.sin(am)*99,70),p1=P(COL.cx+Math.cos(am)*84,COL.cy+Math.sin(am)*84,222);ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();}
  const h=P(COL.cx,COL.cy,350+Math.sin(t*1.6)*8),gr=ctx.createRadialGradient(h.x,h.y,2,h.x,h.y,46*SCALE);gr.addColorStop(0,`rgba(255,90,100,${0.7*a})`);gr.addColorStop(1,'rgba(255,40,60,0)');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(h.x,h.y,46*SCALE,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#ff4d61';const d=12*SCALE;ctx.beginPath();ctx.moveTo(h.x,h.y-d*1.6);ctx.lineTo(h.x+d,h.y);ctx.lineTo(h.x,h.y+d*1.6);ctx.lineTo(h.x-d,h.y);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffd0d6';ctx.beginPath();ctx.moveTo(h.x,h.y-d*1.6);ctx.lineTo(h.x+d*0.35,h.y-d*0.2);ctx.lineTo(h.x-d*0.2,h.y);ctx.closePath();ctx.fill();ctx.restore();}
function tuftSprite(v){const key='tuft|'+v;let s=SPR.get(key);if(s)return s;const k=ART_K,w=Math.ceil(76*k)+6,h=Math.ceil(64*k)+6,ax=Math.round(w/2),ay=h-3;
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),R=mulberry(31+v*7),cols=['#1d4527','#275a31','#33693a','#427a42','#4f8a48'];
  const blades=[];for(let i=0;i<11;i++)blades.push({bx:(R()-0.5)*50,h0:26+R()*30,lean:(R()-0.5)*20,wd:5+R()*6,col:cols[(R()*5)|0]});
  blades.sort((a,b)=>b.h0-a.h0);
  for(const b of blades){g.fillStyle=b.col;g.beginPath();g.moveTo(ax+(b.bx-b.wd)*k,ay);g.quadraticCurveTo(ax+(b.bx+b.lean*0.4)*k,ay-b.h0*0.65*k,ax+(b.bx+b.lean)*k,ay-b.h0*k);
    g.quadraticCurveTo(ax+(b.bx+b.lean*0.4+b.wd*0.4)*k,ay-b.h0*0.5*k,ax+(b.bx+b.wd)*k,ay);g.closePath();g.fill();}
  s={c,ax,ay};SPR.set(key,s);return s;}
function drawTuft(u){const p=P(u.x,u.y),pl=G.player;blit(tuftSprite(u.v),p.x,p.y,pl.alive&&pl.bush===u.b?0.42:1,0);}
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
  g.clearRect(0,0,w,h);g.fillStyle='#3a2f22';g.beginPath();for(let i=0;i<COL.N;i+=6){const th=i/COL.N*TAU,r=COL.rb[i],p=f(COL.cx+Math.cos(th)*r,COL.cy+Math.sin(th)*r);g.lineTo(p[0],p[1]);}g.closePath();g.fill();
  g.fillStyle='#2f6a34';for(const b of COL.bushes){const p=f(b.x,b.y);g.beginPath();g.ellipse(p[0],p[1],b.r*s,b.r*s*IK,0,0,TAU);g.fill();}
  const C=G.col;if(C.storm){g.strokeStyle='#c9a0ff';g.lineWidth=1.5;g.beginPath();for(let i=0;i<=48;i++){const a=i/48*TAU,p=f(COL.cx+Math.cos(a)*C.storm.r,COL.cy+Math.sin(a)*C.storm.r);g.lineTo(p[0],p[1]);}g.stroke();}
  for(const p of C.plants){const q=f(p.x,p.y);g.fillStyle=p.alive?'#9dffb0':'#3c5a40';g.fillRect(q[0]-2,q[1]-2,4,4);}
  {const q=f(COL.cx,COL.cy);g.fillStyle='#ff4d61';g.fillRect(q[0]-3,q[1]-3,6,6);}
  for(const ch of G.champs){if(!ch.alive)continue;if(ch.team!==G.player.team&&!targetable(ch))continue;const q=f(ch.x,ch.y);g.fillStyle=TEAMC[ch.team];g.beginPath();g.arc(q[0],q[1],4.5,0,TAU);g.fill();if(ch===G.player){g.strokeStyle='#fff';g.lineWidth=1.5;g.stroke();}}
}
