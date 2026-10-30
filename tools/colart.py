p='/home/user/riftline/index.html';s=open(p).read()
def block(start,end_start):
    i=s.index(start);j=s.index(end_start,i);return i,j
# ---------- floor ----------
i,j=block("function buildColGround(){","function drawColTerrain(){")
s=s[:i]+r"""function buildColGround(){
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
    if(COL.rocks.some(o=>hyp(x-o.x,y-o.y)<o.r+8))continue;COL_PROPS.push({kind:'tuft',x,y,b:i,v:(R()*4)|0});}});
  for(const o of COL.rocks)COL_PROPS.push({kind:'ruin',x:o.x,y:o.y,r:o.r,v:o.v});
  COL.portals.forEach((q,i)=>COL_PROPS.push({kind:'portal',x:q.x,y:q.y,i}));
  for(const q of COL.portals){const g=colPt(q.d,COL.R+6);COL_PROPS.push({kind:'gate',x:g.x,y:g.y,d:q.d});}}
"""+s[j:]
# ---------- sprites: ruins, portals, gates; control point and event drawing ----------
i,j=block("function obeliskSprite(){","function tuftSprite(v){")
s=s[:i]+r"""// ruined masonry: a few stacked iso blocks, baked once per scale as a pixel sprite
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
function drawRuin(u){const p=P(u.x,u.y),pl=G.player;let a=1;
  if(pl.alive&&(pl.y-pl.x)<(u.y-u.x)&&dist(pl,u)<u.r+90)a=0.5;blit(ruinSprite(u.v),p.x,p.y,a,0);}
// portal: a stone basin with a floating crystal, bright when ready and dim while resting
function drawPortal(u,t){const q=COL.portals[u.i],C=G.col,ready=C&&C.t>=C.portalReady[q.pair],p=P(u.x,u.y),s=SCALE;
  ctx.save();ctx.fillStyle='#5b5246';ctx.beginPath();ctx.ellipse(p.x,p.y,40*s,40*s*IK,0,0,TAU);ctx.fill();ctx.fillStyle='#776b5c';ctx.beginPath();ctx.ellipse(p.x,p.y-8*s,36*s,36*s*IK,0,0,TAU);ctx.fill();
  ctx.fillStyle=ready?'#1a4f63':'#1d2a30';ctx.beginPath();ctx.ellipse(p.x,p.y-9*s,28*s,28*s*IK,0,0,TAU);ctx.fill();
  const bob=Math.sin(t*2.4+u.i)*4*s,cy=p.y-46*s+bob,d=11*s;
  if(ready){ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(p.x,cy,2,p.x,cy,46*s);g.addColorStop(0,'rgba(120,230,255,.75)');g.addColorStop(1,'rgba(60,180,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,cy,46*s,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over';}
  ctx.fillStyle=ready?'#7fe9ff':'#3d5a66';ctx.beginPath();ctx.moveTo(p.x,cy-d*1.7);ctx.lineTo(p.x+d,cy);ctx.lineTo(p.x,cy+d*1.4);ctx.lineTo(p.x-d,cy);ctx.closePath();ctx.fill();
  ctx.fillStyle=ready?'#e6fbff':'#5d7782';ctx.beginPath();ctx.moveTo(p.x,cy-d*1.7);ctx.lineTo(p.x+d*0.35,cy-d*0.2);ctx.lineTo(p.x-d*0.2,cy);ctx.closePath();ctx.fill();
  if(!ready&&C){const f=clamp((C.portalReady[q.pair]-C.t)/COL.PORTAL_CD,0,1);ctx.strokeStyle='rgba(127,233,255,.8)';ctx.lineWidth=3*s;ctx.beginPath();ctx.ellipse(p.x,p.y-9*s,32*s,32*s*IK,0,-PI/2,-PI/2+TAU*(1-f));ctx.stroke();}
  ctx.restore();}
// gate: two pillars and a spiked sun disc over an arch, set into the wall
function drawGate(u,t){const a=u.d*PI/180,tx=-Math.sin(a),ty=Math.cos(a),s=SCALE,H=COL.WALL_H+70;
  const pil=(o)=>{const b=P(u.x+tx*o,u.y+ty*o,0),top=P(u.x+tx*o,u.y+ty*o,H);ctx.fillStyle='#7a6a55';ctx.fillRect(b.x-13*s,top.y,26*s,b.y-top.y);ctx.fillStyle='#968369';ctx.fillRect(b.x-13*s,top.y,9*s,b.y-top.y);
    ctx.fillStyle='#5fd6e8';ctx.fillRect(b.x-2*s,top.y+26*s,4*s,40*s);const f=P(u.x+tx*o,u.y+ty*o,H+10);ctx.fillStyle='#ffb347';ctx.beginPath();ctx.arc(f.x,f.y-4*s,(5+Math.sin(t*9+o)*1.2)*s,0,TAU);ctx.fill();};
  const l=P(u.x-tx*70,u.y-ty*70,H-20),r=P(u.x+tx*70,u.y+ty*70,H-20),m=P(u.x,u.y,H+20);
  ctx.save();pil(-70);pil(70);ctx.strokeStyle='#6e5e4a';ctx.lineWidth=16*s;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.quadraticCurveTo(m.x,m.y-30*s,r.x,r.y);ctx.stroke();
  const sun=P(u.x,u.y,H+52);ctx.fillStyle='#a8743c';ctx.beginPath();for(let k=0;k<16;k++){const aa=k*PI/8,rr=k%2?14*s:26*s;ctx.lineTo(sun.x+Math.cos(aa)*rr,sun.y+Math.sin(aa)*rr);}ctx.closePath();ctx.fill();
  ctx.fillStyle='#d9a55a';ctx.beginPath();ctx.arc(sun.x,sun.y,10*s,0,TAU);ctx.fill();ctx.restore();}
// control point: a ring around the dial that fills with the capturer's colour; dim while it rests
function drawControlPoint(t){const C=G.col;if(!C)return;const cp=C.cp;groundT(0);
  const open=C.t>=cp.openAt,col=cp.team===undefined||cp.team===null?'#e8d7a8':TEAMC[cp.team];
  ctx.save();ctx.lineWidth=10;ctx.strokeStyle=open?`rgba(232,215,168,${0.45+0.25*Math.sin(t*4)})`:'rgba(120,100,80,.35)';ctx.setLineDash(open?[]:[18,16]);ctx.beginPath();ctx.arc(COL.cx,COL.cy,COL.CP_R+14,0,TAU);ctx.stroke();ctx.setLineDash([]);
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
  const q=C.quake;if(q){const L=COL.R+40,lx=-q.ny,ly=q.nx,x0=COL.cx-lx*L,y0=COL.cy-ly*L,x1=COL.cx+lx*L,y1=COL.cy+ly*L;
    if(!q.open){ctx.strokeStyle=`rgba(255,150,70,${0.5+0.4*Math.sin(t*20)})`;ctx.lineWidth=5;ctx.beginPath();const R2=mulberry(q.seed);ctx.moveTo(x0,y0);for(let k=1;k<=24;k++){const f=k/24,j2=(R2()-0.5)*40;ctx.lineTo(x0+(x1-x0)*f+q.nx*j2,y0+(y1-y0)*f+q.ny*j2);}ctx.stroke();}
    else{ctx.fillStyle='#0b0605';ctx.beginPath();const R2=mulberry(q.seed);const side=[],other=[];for(let k=0;k<=24;k++){const f=k/24,j2=(R2()-0.5)*24,cx2=x0+(x1-x0)*f,cy2=y0+(y1-y0)*f;side.push([cx2+q.nx*(q.half+j2),cy2+q.ny*(q.half+j2)]);other.push([cx2-q.nx*(q.half-j2),cy2-q.ny*(q.half-j2)]);}
      side.forEach((p2,k)=>k?ctx.lineTo(p2[0],p2[1]):ctx.moveTo(p2[0],p2[1]));for(let k=other.length-1;k>=0;k--)ctx.lineTo(other[k][0],other[k][1]);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(255,110,40,.85)';ctx.lineWidth=4;ctx.stroke();}}}
function drawEventsFx(t){const C=G.col;if(!C)return;screenT();
  for(const m of C.meteors){const k=clamp((G.t-m.t0)/(m.t1-m.t0),0,1),z=520*(1-k),q=P(m.x+(1-k)*120,m.y-(1-k)*60,z),r=(14+8*k)*SCALE;
    ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(q.x,q.y,2,q.x,q.y,r*2.2);g.addColorStop(0,'rgba(255,230,160,.95)');g.addColorStop(0.4,'rgba(255,120,40,.8)');g.addColorStop(1,'rgba(200,40,10,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,r*2.2,0,TAU);ctx.fill();ctx.restore();
    ctx.fillStyle='#3a2418';ctx.beginPath();ctx.arc(q.x,q.y,r*0.7,0,TAU);ctx.fill();}}
"""+s[j:]
# render list: draw the new props
a="else if(u.kind==='obelisk')drawObelisk(t);"
assert s.count(a)==1;s=s.replace(a,"else if(u.kind==='ruin')drawRuin(u);else if(u.kind==='portal')drawPortal(u,t);else if(u.kind==='gate')drawGate(u,t);")
s=s.replace("// ================= colosseum: a best-of-3 duel with bushes, alcoves, a central obelisk, healing plants and a closing storm =================",
 "// ================= colosseum: a best-of-3 duel with gardens of brush and ruins, healing fruit, portals, a control point and a closing storm =================",1)
s=s.replace("// stopped by a wall or the obelisk: it drops there","// stopped by a wall or a ruin: it drops there",1)
s=s.replace("// the fissure stops at walls and the obelisk","// the fissure stops at walls and ruins",1)
open(p,'w').write(s);print('ok')
