// ================= camera & isometric projection =================
// Simulation stays in flat world coordinates; only drawing and input go through the projection.
// World +x (toward red) maps to screen up-right, so the lane runs diagonally like a mid lane.
let DPR=1,VW=0,VH=0,SCALE=1;const cam={x:W/2,y:MIDY};
const IC=Math.SQRT1_2,IK=0.6,CLIFF_H=110,DROP_H=190;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);VW=innerWidth;VH=innerHeight;cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR);SCALE=Math.min(VH/820,VW/1350);}
addEventListener('resize',resize);resize();
function P(x,y,z){const dx=x-cam.x,dy=y-cam.y;return{x:VW/2+(dx+dy)*IC*SCALE,y:VH/2+((dy-dx)*IC*IK-(z||0))*SCALE};}
function screenToWorld(sx,sy){const u=(sx-VW/2)/SCALE,v=(sy-VH/2)/SCALE/IK;return{x:cam.x+(u-v)/(2*IC),y:cam.y+(u+v)/(2*IC)};}
function groundT(lift){const k=DPR*SCALE,a=k*IC,b=-k*IC*IK,c=k*IC,d=k*IC*IK;ctx.setTransform(a,b,c,d,DPR*VW/2-(a*cam.x+c*cam.y),DPR*VH/2-(b*cam.x+d*cam.y)-(lift||0)*k);}
function screenT(){ctx.setTransform(DPR,0,0,DPR,0,0);}
const projAng=a=>{const c=Math.cos(a),s=Math.sin(a);return Math.atan2((s-c)*IK,c+s);};
const HEIGHT={champ:92,melee:46,caster:48,super:76,tower:250};
const heightOf=u=>u.kind==='champ'?HEIGHT.champ:u.kind==='tower'?HEIGHT.tower:HEIGHT[u.mtype];
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

// ================= drawing: figures =================
// Upright sprites drawn in screen space at the unit's feet. Units are world units; callers scale.
function drawHero(g,key,team,fa,wind,t,walk){
  const fx=Math.cos(fa),fy=Math.sin(fa),away=fy<-0.2,px=-fy,sw=walk?Math.sin(t*13):0;
  g.lineCap='round';g.lineJoin='round';
  if(key==='aria'){
    const pull=wind*12,hx=fx*20,hy=-42+fy*7;
    const bow=()=>{
      g.strokeStyle='#e0b996';g.lineWidth=4.5;g.beginPath();g.moveTo(px*10,-52);g.lineTo(hx,hy);g.moveTo(-px*10,-52);g.lineTo(hx-fx*(14+pull),hy-fy*(14+pull)*0.6);g.stroke();
      g.save();g.translate(hx,hy);g.rotate(fa);
      g.strokeStyle='#d8a24a';g.lineWidth=3.5;g.beginPath();g.arc(-8,0,25,-1.15,1.15);g.stroke();
      const bx=-8+25*Math.cos(1.15),by=25*Math.sin(1.15);
      g.strokeStyle='rgba(240,240,230,.9)';g.lineWidth=1.2;g.beginPath();g.moveTo(bx,-by);g.lineTo(bx-pull-6,0);g.lineTo(bx,by);g.stroke();
      if(wind>0){g.strokeStyle='#f3efe4';g.lineWidth=2;g.beginPath();g.moveTo(bx-pull-6,0);g.lineTo(28,0);g.stroke();g.fillStyle='#cfe8ef';g.beginPath();g.moveTo(33,0);g.lineTo(25,-4);g.lineTo(25,4);g.fill();}
      g.restore();};
    const cape=()=>{g.fillStyle='#173f4c';g.beginPath();g.moveTo(-14,-58);g.lineTo(14,-58);g.lineTo(17-fx*5,-14);g.lineTo(-17-fx*5,-14);g.closePath();g.fill();};
    const quiver=()=>{g.save();g.translate(-fx*9,-50);g.rotate(0.35*(fx>=0?-1:1));g.fillStyle='#6b4a2b';g.fillRect(-4,-14,8,24);g.strokeStyle='#e6dcc6';g.lineWidth=2;for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(i*2.5,-14);g.lineTo(i*3.5,-21);g.stroke();}g.restore();};
    if(away)bow();
    if(!away){cape();quiver();}
    g.fillStyle='#3a2c22';g.fillRect(-8+sw*3,-24,6,24);g.fillRect(2-sw*3,-24,6,24);
    g.fillStyle='#2e7d91';g.beginPath();g.moveTo(-13,-22);g.lineTo(13,-22);g.lineTo(11,-58);g.lineTo(-11,-58);g.closePath();g.fill();
    g.fillStyle='#3f97ad';g.beginPath();g.moveTo(-4+fx*3,-22);g.lineTo(6+fx*3,-22);g.lineTo(5+fx*3,-56);g.lineTo(-3+fx*3,-56);g.closePath();g.fill();
    g.fillStyle='#6b4a2b';g.fillRect(-12,-35,24,4);
    g.fillStyle='#2a6a7c';g.beginPath();g.arc(-11,-55,6,0,TAU);g.arc(11,-55,6,0,TAU);g.fill();
    if(away){cape();quiver();}
    g.fillStyle='#b98f4c';g.beginPath();g.ellipse(-fx*11,-67,6,4,0,0,TAU);g.fill();
    g.fillStyle='#e7c27a';g.beginPath();g.arc(0,-70,10.5,0,TAU);g.fill();
    if(!away){g.fillStyle='#e9c9a6';g.beginPath();g.arc(fx*3,-68,7.5,0,TAU);g.fill();g.fillStyle='#2a2020';g.beginPath();g.arc(fx*6+px*3,-69,1.4,0,TAU);g.arc(fx*6-px*3,-69,1.4,0,TAU);g.fill();}
    if(!away)bow();
  }else{
    const blades=()=>{for(const s of [-1,1]){const hx=fx*10+px*s*13,hy=-38+fy*5;
      g.strokeStyle='#2b2238';g.lineWidth=5;g.beginPath();g.moveTo(px*s*11,-52);g.lineTo(hx,hy);g.stroke();
      g.save();g.translate(hx,hy);g.rotate(fa+s*(0.35-wind*1.2));
      g.fillStyle='#4a3a2a';g.fillRect(-4,-2.5,8,5);g.fillStyle='#d4dde9';g.beginPath();g.moveTo(3,-3.5);g.lineTo(34,0);g.lineTo(3,3.5);g.closePath();g.fill();
      g.strokeStyle='rgba(180,140,255,.7)';g.lineWidth=1;g.beginPath();g.moveTo(5,0);g.lineTo(31,0);g.stroke();g.restore();}};
    const scarf=()=>{g.strokeStyle='#b8243b';g.lineWidth=5;g.beginPath();g.moveTo(0,-60);g.quadraticCurveTo(-fx*18,-58+Math.sin(t*9)*4,-fx*36,-52+Math.sin(t*9+1)*7);g.stroke();
      g.lineWidth=4;g.beginPath();g.moveTo(2,-60);g.quadraticCurveTo(-fx*14,-50+Math.sin(t*8)*4,-fx*30,-44+Math.sin(t*8+2)*6);g.stroke();};
    if(away)blades();
    if(!away)scarf();
    g.fillStyle='#120e17';g.fillRect(-8+sw*3,-24,6,24);g.fillRect(2-sw*3,-24,6,24);
    g.fillStyle='#1d1626';g.beginPath();g.moveTo(-12,-22);g.lineTo(12,-22);g.lineTo(13,-58);g.lineTo(-13,-58);g.closePath();g.fill();
    g.fillStyle='#3a2d4f';g.beginPath();g.ellipse(-12,-55,8,5,0.3,0,TAU);g.ellipse(12,-55,8,5,-0.3,0,TAU);g.fill();
    g.fillStyle='#2b2238';g.fillRect(-12,-36,24,4);
    if(away)scarf();
    g.fillStyle='#120e17';g.beginPath();g.arc(0,-70,10.5,0,TAU);g.fill();
    g.fillStyle='#2b2238';g.beginPath();g.moveTo(-10,-74);g.lineTo(0,-86);g.lineTo(10,-74);g.closePath();g.fill();
    if(!away){g.fillStyle='#c9a6ff';g.beginPath();g.arc(fx*5+px*3.2,-70,1.9,0,TAU);g.arc(fx*5-px*3.2,-70,1.9,0,TAU);g.fill();}
    if(!away)blades();
  }
  g.lineCap='butt';
}
function drawChamp(u,t){
  if(!u.alive)return;
  const enemy=u.team!==G.player.team;let alpha=1;
  if(u.stealthT>0){if(enemy)return;alpha=0.35;}
  if(u.untargetT>0){if(enemy)return;alpha=0.2;}
  const p=P(u.x,u.y),s=SCALE;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(p.x,p.y);ctx.scale(s,s);
  ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(0,0,u.r+6,(u.r+6)*IK,0,0,TAU);ctx.fill();
  ctx.strokeStyle=u===G.player?'#5fe08b':TEAMC[u.team];ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,u.r+6,(u.r+6)*IK,0,0,TAU);ctx.stroke();
  let wind=0;if(u.wind)wind=1-u.wind.t/u.wind.total;else if(u.cast)wind=1-u.cast.t/u.cast.total;
  drawHero(ctx,u.key,u.team,projAng(u.facing),wind,t,hyp(u.vx,u.vy)>30);
  if(u.hitFlash>0){ctx.globalAlpha=alpha*u.hitFlash*4;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,-45,16,40,0,0,TAU);ctx.fill();}
  ctx.restore();
  if(u.stunT>0){ctx.save();ctx.fillStyle='#ffe98a';for(let i=0;i<3;i++){const a=t*6+i*TAU/3,q=P(u.x,u.y,104);ctx.beginPath();ctx.arc(q.x+Math.cos(a)*18*s,q.y+Math.sin(a)*6*s,4*s,0,TAU);ctx.fill();}ctx.restore();}
}
function drawMinion(m,t){
  let a=1,sc=1;if(!m.alive){a=1-m.deadT/0.5;sc=1-m.deadT*0.6;if(a<=0)return;}
  const p=P(m.x,m.y),s=SCALE*sc;
  ctx.save();ctx.globalAlpha=a;ctx.translate(p.x,p.y);ctx.scale(s,s);
  ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(0,0,m.r,m.r*IK,0,0,TAU);ctx.fill();
  const fa=projAng(m.facing),fx=Math.cos(fa),fy=Math.sin(fa),away=fy<-0.2,px=-fy;
  const c=TEAMC[m.team],dk=TEAMD[m.team],lt=TEAML[m.team],sw=m.moving?Math.sin(t*14+m.id):0;
  const swing=m.swing>0?(m.swing/0.2):0;
  ctx.lineCap='round';
  if(m.mtype==='melee'){
    const weapon=()=>{const hx=fx*12,hy=-24+fy*4;ctx.save();ctx.translate(hx,hy);ctx.rotate(fa-0.9+swing*1.6);ctx.strokeStyle='#cfd6dc';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(20,0);ctx.stroke();ctx.restore();};
    if(away)weapon();
    ctx.fillStyle='#1b1f22';ctx.fillRect(-6+sw*2,-12,5,12);ctx.fillRect(1-sw*2,-12,5,12);
    ctx.fillStyle=dk;ctx.beginPath();ctx.roundRect(-11,-34,22,24,5);ctx.fill();
    ctx.fillStyle=c;ctx.fillRect(-7,-30,14,7);
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,-40,8,0,TAU);ctx.fill();
    if(!away){ctx.fillStyle='#0d1114';ctx.fillRect(fx*3-5,-42,10,3);}
    if(!away)weapon();
  }else if(m.mtype==='caster'){
    const sx=fx*11+px*8;
    const staff=()=>{ctx.strokeStyle='#8a6b45';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,-2);ctx.lineTo(sx,-50);ctx.stroke();ctx.fillStyle=lt;ctx.globalAlpha=a;ctx.beginPath();ctx.arc(sx,-53,5+swing*4,0,TAU);ctx.fill();};
    if(away)staff();
    ctx.fillStyle=dk;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.lineTo(7,-34);ctx.lineTo(-7,-34);ctx.closePath();ctx.fill();
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,-40,8,0,TAU);ctx.fill();
    if(!away){ctx.fillStyle=lt;ctx.beginPath();ctx.arc(fx*4+px*2.5,-40,1.5,0,TAU);ctx.arc(fx*4-px*2.5,-40,1.5,0,TAU);ctx.fill();}
    if(!away)staff();
  }else{
    const mace=()=>{const hx=fx*24,hy=-36+fy*6;ctx.save();ctx.translate(hx,hy);ctx.rotate(fa-1.0+swing*1.8);ctx.strokeStyle='#6b5a44';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(30,0);ctx.stroke();
      ctx.fillStyle='#c8ccd0';ctx.beginPath();for(let i=0;i<10;i++){const an=i/10*TAU,r=i%2?7:12;ctx.lineTo(36+Math.cos(an)*r,Math.sin(an)*r);}ctx.closePath();ctx.fill();ctx.restore();};
    if(away)mace();
    ctx.fillStyle='#1b1f22';ctx.fillRect(-16+sw*3,-18,11,18);ctx.fillRect(5-sw*3,-18,11,18);
    ctx.fillStyle=dk;ctx.beginPath();ctx.roundRect(-22,-62,44,46,10);ctx.fill();
    ctx.fillStyle=c;for(const s2 of [-1,1]){ctx.beginPath();ctx.moveTo(s2*14,-60);ctx.lineTo(s2*30,-74);ctx.lineTo(s2*24,-54);ctx.closePath();ctx.fill();}
    ctx.fillStyle=c;ctx.fillRect(-14,-52,28,10);
    ctx.beginPath();ctx.arc(0,-66,12,0,TAU);ctx.fill();
    if(!away){ctx.fillStyle=lt;ctx.beginPath();ctx.arc(fx*5+px*4,-67,2.4,0,TAU);ctx.arc(fx*5-px*4,-67,2.4,0,TAU);ctx.fill();}
    if(!away)mace();
  }
  if(m.hitFlash>0){ctx.globalAlpha=a*m.hitFlash*5;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,-heightOf(m)/2,m.r*0.7,heightOf(m)/2,0,0,TAU);ctx.fill();}
  ctx.restore();
}
function drawTower(tw,t){
  const p=P(tw.x,tw.y),s=SCALE;
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);
  if(!tw.alive){ctx.fillStyle='#2d3332';ctx.beginPath();ctx.ellipse(0,0,96,96*IK,0,0,TAU);ctx.fill();
    for(let i=0;i<11;i++){const a=i*0.9,r=20+(i*23)%60;ctx.fillStyle=i%2?'#4a5150':'#3a403f';ctx.beginPath();ctx.ellipse(Math.cos(a)*r,Math.sin(a)*r*IK-8,14+(i%3)*7,(10+(i%3)*5),0,0,TAU);ctx.fill();}
    ctx.restore();return;}
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(10,4,100,100*IK,0,0,TAU);ctx.fill();
  ctx.fillStyle='#2f3534';ctx.beginPath();ctx.ellipse(0,0,92,92*IK,0,0,TAU);ctx.fill();
  ctx.fillRect(-92,-14,184,14);
  ctx.fillStyle='#4f5756';ctx.beginPath();ctx.ellipse(0,-14,92,92*IK,0,0,TAU);ctx.fill();
  ctx.strokeStyle=TEAMD[tw.team];ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,-14,66,66*IK,0,0,TAU);ctx.stroke();
  const gr=ctx.createLinearGradient(-34,0,34,0);gr.addColorStop(0,'#3a4140');gr.addColorStop(0.55,'#6a7372');gr.addColorStop(1,'#454c4b');
  ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(-36,-16);ctx.lineTo(36,-16);ctx.lineTo(25,-176);ctx.lineTo(-25,-176);ctx.closePath();ctx.fill();
  ctx.fillStyle=TEAMD[tw.team];ctx.fillRect(-33,-62,66,9);ctx.fillRect(-28,-140,56,7);
  ctx.fillStyle=TEAMC[tw.team];ctx.globalAlpha=0.6+Math.sin(t*3)*0.2;ctx.fillRect(-4,-130,8,60);ctx.globalAlpha=1;
  ctx.fillStyle='#5d6564';ctx.beginPath();ctx.ellipse(0,-176,28,28*IK,0,0,TAU);ctx.fill();
  const cy=-222+Math.sin(t*2)*6;
  const glow=ctx.createRadialGradient(0,cy,4,0,cy,80);glow.addColorStop(0,TEAML[tw.team]);glow.addColorStop(0.3,TEAMC[tw.team]+'aa');glow.addColorStop(1,TEAMC[tw.team]+'00');
  ctx.fillStyle=glow;ctx.globalAlpha=0.75+Math.sin(t*3)*0.15;ctx.beginPath();ctx.arc(0,cy,80,0,TAU);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=TEAMC[tw.team];ctx.beginPath();ctx.moveTo(0,cy-34);ctx.lineTo(17,cy);ctx.lineTo(0,cy+30);ctx.lineTo(-17,cy);ctx.closePath();ctx.fill();
  ctx.fillStyle=TEAML[tw.team];ctx.beginPath();ctx.moveTo(0,cy-34);ctx.lineTo(7,cy);ctx.lineTo(0,cy+30);ctx.lineTo(-5,cy-2);ctx.closePath();ctx.fill();
  if(tw.hitFlash>0){ctx.globalAlpha=tw.hitFlash*3;ctx.fillStyle='#fff';ctx.fillRect(-36,-176,72,160);}
  ctx.restore();
}
function bar(x,y,w,h,p,col,bg){ctx.fillStyle=bg||'rgba(0,0,0,.75)';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle=col;ctx.fillRect(x,y,w*clamp(p,0,1),h);}
function markIcon(x,y,r){ctx.save();ctx.translate(x,y);ctx.rotate(G.t*4);ctx.strokeStyle='#b48cff';ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<4;i++){const a=i/4*TAU;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.stroke();ctx.restore();}
function drawBars(){
  const p=G.player;screenT();
  for(const m of G.minions){if(!m.alive)continue;const w=m.mtype==='super'?62:40,q=P(m.x,m.y,heightOf(m)+14);bar(q.x-w/2,q.y,w,4,m.hp/m.maxHp,m.team===p.team?'#5aa9e6':'#e0544a');
    if(m.shadeMark&&m.shadeMark.until>G.t)markIcon(q.x,q.y-12,7);}
  for(const tw of G.towers){if(!tw.alive)continue;const q=P(tw.x,tw.y,HEIGHT.tower+26);bar(q.x-80,q.y,160,11,tw.hp/tw.maxHp,tw.team===p.team?'#5aa9e6':'#e0544a');
    ctx.font='700 13px Oxanium, sans-serif';ctx.fillStyle='#e8eef0';ctx.textAlign='center';ctx.fillText(n0(tw.hp),q.x,q.y-5);
    if(tw.team!==p.team&&backdoorMult(tw)<1){const b=P(tw.x,tw.y);ctx.fillStyle='#c8d4d8';ctx.font='600 12px Oxanium, sans-serif';ctx.fillText('Protected without your minions',b.x,b.y+80*SCALE);}}
  for(const c of G.champs){
    if(!c.alive)continue;if((c.stealthT>0||c.untargetT>0)&&c.team!==p.team)continue;
    const q=P(c.x,c.y,HEIGHT.champ+30),w=96,x=q.x-w/2+10,y=q.y;
    bar(x,y,w,11,c.hp/c.maxHp,c===p?'#45c46e':'#e0544a');
    ctx.fillStyle='rgba(0,0,0,.6)';for(let h=100;h<c.maxHp;h+=100){const xx=x+w*h/c.maxHp;ctx.fillRect(xx,y,h%1000===0?2:1,h%500===0?11:6);}
    bar(x,y+13,w,4,c.res/c.maxRes,c.def.resource==='Energy'?'#f0cf48':'#4a90ff');
    ctx.fillStyle='#0d1417';ctx.fillRect(x-24,y-2,22,20);ctx.strokeStyle='#c9a85a';ctx.lineWidth=1;ctx.strokeRect(x-24,y-2,22,20);
    ctx.fillStyle='#e8c06a';ctx.font='700 13px Oxanium, sans-serif';ctx.textAlign='center';ctx.fillText(c.level,x-13,y+13);
    if(c.shadeMark&&c.shadeMark.until>G.t)markIcon(q.x,y-16,10);
  }
}
function projZ(p){
  if(p.kind==='towerShot'){const t=p.homing;const d=t?dist(p,t):0;return 40+190*clamp(d/(p.d0||1),0,1);}
  if(p.kind==='orb')return 34;
  if(p.kind==='arrowR')return 60;
  return 46;
}
function drawProj(p,t){
  const z=projZ(p),q=P(p.x,p.y,z),g0=P(p.x,p.y,0),a=projAng(p.ang),s=SCALE;
  ctx.save();ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(g0.x,g0.y,(p.kind==='arrowR'?40:10)*s,(p.kind==='arrowR'?40:10)*s*IK,0,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(q.x,q.y);ctx.scale(s,s);ctx.rotate(a);
  switch(p.kind){
    case'arrow':ctx.strokeStyle='#f1e7cf';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(8,0);ctx.stroke();ctx.fillStyle='#dfe9ec';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(5,-4);ctx.lineTo(5,4);ctx.fill();break;
    case'arrowBig':ctx.strokeStyle='#9fe8ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(10,0);ctx.stroke();ctx.fillStyle='#e8fbff';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(6,-6);ctx.lineTo(6,6);ctx.fill();break;
    case'arrowQ':{const gr=ctx.createLinearGradient(-90,0,20,0);gr.addColorStop(0,'rgba(120,220,255,0)');gr.addColorStop(1,'rgba(160,235,255,.9)');ctx.fillStyle=gr;ctx.fillRect(-90,-7,110,14);ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(18,0);ctx.stroke();ctx.fillStyle='#e8fbff';ctx.beginPath();ctx.moveTo(26,0);ctx.lineTo(14,-8);ctx.lineTo(14,8);ctx.fill();break;}
    case'arrowR':{const gr=ctx.createLinearGradient(-260,0,40,0);gr.addColorStop(0,'rgba(120,220,255,0)');gr.addColorStop(1,'rgba(200,245,255,.95)');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(-260,-10);ctx.lineTo(30,-34);ctx.lineTo(60,0);ctx.lineTo(30,34);ctx.lineTo(-260,10);ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(70,0);ctx.lineTo(30,-18);ctx.lineTo(30,18);ctx.fill();break;}
    case'shuriken':ctx.scale(1,IK+0.15);ctx.rotate(t*25);ctx.fillStyle='#d9ccff';ctx.beginPath();for(let i=0;i<8;i++){const an=i/8*TAU,r=i%2?7:22;ctx.lineTo(Math.cos(an)*r,Math.sin(an)*r);}ctx.closePath();ctx.fill();ctx.fillStyle='#2b2238';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();break;
    case'orb':ctx.fillStyle=TEAMC[p.team]+'66';ctx.beginPath();ctx.arc(-6,0,10,0,TAU);ctx.fill();ctx.fillStyle=TEAML[p.team];ctx.beginPath();ctx.arc(0,0,7,0,TAU);ctx.fill();break;
    case'towerShot':ctx.fillStyle=TEAMC[p.team]+'55';ctx.beginPath();ctx.ellipse(-18,0,30,12,0,0,TAU);ctx.fill();ctx.fillStyle=TEAML[p.team];ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,6,0,TAU);ctx.fill();break;
  }
  ctx.restore();
}
function drawGroundFx(){
  groundT(0);
  for(const f of G.fx){if(f.k!=='ring')continue;const k=f.t/f.dur;ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=5*(1-k)+2;ctx.beginPath();ctx.arc(f.x,f.y,f.r0+(f.r1-f.r0)*k,0,TAU);ctx.stroke();}
  ctx.globalAlpha=1;
}
function drawFx(){
  screenT();const s=SCALE;
  for(const f of G.fx){const k=f.t/f.dur;if(f.k==='ring')continue;ctx.save();
    if(f.k==='spark'){const q=P(f.x,f.y,30+k*20);ctx.globalAlpha=1-k;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(q.x,q.y,(3*(1-k)+1)*s,0,TAU);ctx.fill();}
    else if(f.k==='slash'){const q=P(f.x,f.y,40);ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=(5*(1-k)+1)*s;ctx.translate(q.x,q.y);ctx.scale(s,s);ctx.rotate(projAng(f.ang));ctx.beginPath();ctx.arc(-20,0,34,-0.9+k*0.4,0.9+k*0.4);ctx.stroke();}
    else if(f.k==='ghost'){const q=P(f.x,f.y);ctx.globalAlpha=0.35*(1-k);ctx.translate(q.x,q.y);ctx.scale(s,s);drawHero(ctx,f.key,f.team,projAng(f.ang),0,0,false);}
    else if(f.k==='smoke'){const q=P(f.x,f.y,20+k*40);ctx.globalAlpha=0.5*(1-k);ctx.fillStyle='#4a3d5c';ctx.beginPath();ctx.arc(q.x,q.y,f.r*(1+k)*s,0,TAU);ctx.fill();}
    ctx.restore();}
  for(const t of G.texts){const k=t.t/t.dur,q=P(t.x,t.y,t.z+k*45);ctx.globalAlpha=k<0.7?1:1-(k-0.7)/0.3;ctx.font=`800 ${t.size}px Oxanium, sans-serif`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(t.txt,q.x+t.ox,q.y);ctx.fillStyle=t.col;ctx.fillText(t.txt,q.x+t.ox,q.y);}
  ctx.globalAlpha=1;
}
function groundEllipse(x,y,r,col,lw,dash){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw;if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();}
let demoT=0;
function render(dt){
  screenT();ctx.fillStyle='#0f1613';ctx.fillRect(0,0,VW,VH);
  let tx,ty;
  if(G){const p=G.player;const w=screenToWorld(mouse.x,mouse.y);let ox=(w.x-p.x)*0.2,oy=(w.y-p.y)*0.2;const l=hyp(ox,oy);if(l>260){ox*=260/l;oy*=260/l;}tx=p.x+ox;ty=p.y+oy;}
  else{demoT+=dt;tx=W/2+Math.sin(demoT*0.08)*2200;ty=MIDY;}
  cam.x+=(tx-cam.x)*Math.min(1,dt*7);cam.y+=(ty-cam.y)*Math.min(1,dt*7);
  cam.x=clamp(cam.x,650,W-650);cam.y=clamp(cam.y,LANE_TOP+260,LANE_BOT-260);
  drawTerrain();
  const t=performance.now()/1000;
  groundT(0);
  for(let i=0;i<2;i++){const f=FOUNT[i];ctx.save();ctx.globalAlpha=0.25+Math.sin(t*2)*0.08;ctx.fillStyle=TEAMC[i];ctx.beginPath();ctx.arc(f.x,f.y,FOUNT_R-30,0,TAU);ctx.fill();ctx.restore();}
  if(G){
    const p=G.player;
    for(const r of G.relics)if(r.active){ctx.fillStyle='rgba(80,255,150,.2)';ctx.beginPath();ctx.arc(r.x,r.y,40,0,TAU);ctx.fill();}
    const et=G.towers[1-p.team];
    if(p.alive&&et.alive&&dist(p,et)<et.range+450)groundEllipse(et.x,et.y,et.range,et.target===p?'rgba(255,80,70,.85)':'rgba(255,90,80,.35)',et.target===p?7:4,[22,14]);
    if(p.alive)groundEllipse(p.x,p.y,p.range+p.r,'rgba(255,255,255,.12)',3);
    if(G.hover){const h=G.hover;groundEllipse(h.x,h.y,h.r+10,'rgba(255,90,80,.95)',4);}
    for(const c of G.champs){if(!c.alive)continue;
      if(c.empower&&c.empower.until>G.t)groundEllipse(c.x,c.y,c.r+16,'rgba(140,230,255,.7)',3,[8,8]);
      if(c.cast&&c.key==='aria'&&c.cast.total===0.5)groundEllipse(c.x,c.y,c.r+20+Math.sin(t*30)*4,'rgba(190,240,255,.6)',4);}
    drawGroundFx();
  }
  drawCliff();
  if(!G)return;
  const p=G.player;
  screenT();
  for(const r of G.relics){if(!r.active)continue;const q=P(r.x,r.y,44+Math.sin(t*3)*6);ctx.save();ctx.translate(q.x,q.y);ctx.scale(SCALE,SCALE);
    ctx.fillStyle='#4fe08a';ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(14,0);ctx.lineTo(0,20);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();ctx.fillStyle='#d9ffe6';ctx.fillRect(-3,-9,6,18);ctx.fillRect(-9,-3,18,6);ctx.restore();}
  const list=[...G.towers,...G.minions,...G.champs].sort((a,b)=>(a.y-a.x)-(b.y-b.x));
  for(const u of list){if(u.kind==='tower')drawTower(u,t);else if(u.kind==='minion')drawMinion(u,t);else drawChamp(u,t);}
  for(const pr of G.projs)drawProj(pr,t);
  drawFx();drawBars();
  screenT();
  if(!p.alive){ctx.fillStyle='rgba(20,10,12,.45)';ctx.fillRect(0,0,VW,VH);}
  const hot=!!G.hover;ctx.strokeStyle=hot?'#ff6a5e':'#eaf2f2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mouse.x,mouse.y,9,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.moveTo(mouse.x-16,mouse.y);ctx.lineTo(mouse.x-11,mouse.y);ctx.moveTo(mouse.x+11,mouse.y);ctx.lineTo(mouse.x+16,mouse.y);ctx.moveTo(mouse.x,mouse.y-16);ctx.lineTo(mouse.x,mouse.y-11);ctx.moveTo(mouse.x,mouse.y+11);ctx.lineTo(mouse.x,mouse.y+16);ctx.stroke();
}

