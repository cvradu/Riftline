SP='/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/'
p='/home/user/riftline/index.html';s=open(p).read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:110],s.count(old))
    s=s.replace(old,new)
i=s.index("// ---- Coralisse: thrown axes become dash destinations");j=s.index("\n",s.index("CH.cora.passive={name:'Corruption'"))
s=s[:i]+open(SP+'cora_kit2.js').read().rstrip('\n')+s[j:]
rep("    castKind:{Q:'swing',E:'e',RMB:'swing',R:'roar'},","    castKind:{Q:'swing',E:'slam',RMB:'swing',R:'roar'},")
# shoot returns its projectile so a flying axe can be recalled mid-air
rep("onHit:o.onHit,onEnd:o.onEnd,kind:o.kind,alive:true,age:0});\n}","onHit:o.onHit,onEnd:o.onEnd,kind:o.kind,alive:true,age:0});\n  return G.projs[G.projs.length-1];\n}")
# homing projectiles can sweep through enemies on the way (the recalled axe)
rep("""    if(p.homing){const t=p.homing;if(!t.alive){p.alive=false;continue;}
      const dx=t.x-p.x,dy=t.y-p.y,d=hyp(dx,dy),step=p.speed*dt;p.ang=Math.atan2(dy,dx);
      if(d<=step+t.r*0.4){p.alive=false;p.onHit(t,p);}else{p.x+=dx/d*step;p.y+=dy/d*step;}continue;}""",
"""    if(p.homing){const t=p.homing;if(!t.alive){p.alive=false;if(p.onLost)p.onLost();continue;}
      const dx=t.x-p.x,dy=t.y-p.y,d=hyp(dx,dy),step=p.speed*dt;p.ang=Math.atan2(dy,dx);
      const arrive=d<=step+t.r*0.4,nx=arrive?t.x:p.x+dx/d*step,ny=arrive?t.y:p.y+dy/d*step;
      if(p.sweep)for(const u of enemiesOf(p.team)){if(u.kind==='tower'||p.sweep.hit.has(u)||!hittable(u))continue;if(segDist(u.x,u.y,p.x,p.y,nx,ny).d<=u.r+p.sweep.radius){p.sweep.hit.add(u);p.sweep.onHit(u);}}
      p.x=nx;p.y=ny;if(arrive){p.alive=false;p.onHit(t,p);}continue;}""")
rep("projs:[],fx:[],","projs:[],rifts:[],fx:[],")
rep("  updateProjs(dt);","  updateProjs(dt);updateRifts(dt);")
# visuals: fissure on the ground, rocks and dust in the air, recall path preview
rep("      if(c===p&&c.alive&&!ax.r&&c.ranks.E&&c.chg.E>0&&dist(c,ax)<=700&&!c.dash){ctx.save();ctx.setLineDash([18,14]);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(ax.x,ax.y);ctx.stroke();ctx.restore();}}",
    "      if(c===p&&c.alive&&k==='Q'&&!ax.r&&!c.dash){ctx.save();ctx.strokeStyle='rgba(255,170,70,.10)';ctx.lineWidth=AXE_W*2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(ax.x,ax.y);ctx.stroke();\n        ctx.setLineDash([18,14]);ctx.strokeStyle='rgba(255,190,110,.45)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax.x,ax.y);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.restore();}}")
rep("function drawAxeGround(){\n  groundT(0);const p=G.player;","""function drawRifts(){
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
  groundT(0);drawRifts();const p=G.player;""")
rep("    else if(f.k==='smoke'){const q=P(f.x,f.y,20+k*40);ctx.globalAlpha=0.5*(1-k);ctx.fillStyle='#4a3d5c';",
    "    else if(f.k==='rock'){const tt=k*f.dur,z=Math.max(0,f.vz*tt-450*tt*tt),q=P(f.x,f.y,z),r=f.s*s;ctx.globalAlpha=k<0.8?1:(1-k)*5;ctx.translate(q.x,q.y);ctx.rotate(f.rot+k*6);ctx.fillStyle='#6f5f4e';ctx.beginPath();ctx.moveTo(-r,-r*0.4);ctx.lineTo(-r*0.2,-r);ctx.lineTo(r,-r*0.3);ctx.lineTo(r*0.6,r*0.8);ctx.lineTo(-r*0.7,r*0.6);ctx.closePath();ctx.fill();ctx.fillStyle='#9a8670';ctx.beginPath();ctx.moveTo(-r*0.6,-r*0.4);ctx.lineTo(-r*0.1,-r*0.85);ctx.lineTo(r*0.5,-r*0.3);ctx.closePath();ctx.fill();}\n    else if(f.k==='smoke'){const q=P(f.x,f.y,20+k*40);ctx.globalAlpha=0.5*(1-k);ctx.fillStyle=f.col||'#4a3d5c';")
rep("      case'death':this.tone(320,55,0.7,0.28*v,'sawtooth');break;","      case'death':this.tone(320,55,0.7,0.28*v,'sawtooth');break;\n      case'quake':this.noise(0.55,140,0.7,0.45*v,60);this.tone(80,35,0.45,0.35*v);break;")
rep("    if(ca.kind==='roar'){const r=kf([[0,0],[0.25,1],[0.8,1],[1,0]],p);fr.sy=1+0.09*r;fr.sx=1+0.05*r;fr.oy=-5*r;}",
    "    if(ca.kind==='roar'){const r=kf([[0,0],[0.25,1],[0.8,1],[1,0]],p);fr.sy=1+0.09*r;fr.sx=1+0.05*r;fr.oy=-5*r;}\n    else if(ca.kind==='slam'){const b=kf([[0,0],[0.45,-0.9],[0.55,0.9],[0.8,0.6],[1,0]],p);lunge(b,8);fr.sy=1-Math.max(0,b)*0.12;fr.sx=1+Math.max(0,b)*0.07;}")
# ---- bot ----
i=s.index("  const closeIn=()=>{if(aria&&c.axes){");j=s.index("return;}",i)+len("return;}")
s=s[:i]+"""  const closeIn=()=>{if(aria&&c.axes){const q=c.axes.Q;
      if((q.state==='ground'||q.state==='flying')&&!q.r){const qp=axePos(q);if(segDist(foe.x,foe.y,qp.x,qp.y,c.x,c.y).d<foe.r+AXE_W-10||(q.state==='ground'&&G.t>q.until-0.5))if(cast('Q',0,0))return;}
      if(d<660){const pr=predict(c,foe,2000,0.25);if(cast('E',pr.x,pr.y))return;}}"""+s[j:]
rep("      else{const k=groundedAxes(c).find(k=>dist(c.axes[k],foe)>d+150);if(k)cast('E',c.axes[k].x,c.axes[k].y);else if(can('RMB')&&c.chg.E>0){const a=away(700);cast('RMB',a.x,a.y);}else{const a=away(350);dashTo(a.x,a.y);}}",
    "      else{const a=away(350);dashTo(a.x,a.y);if(d<520){const pr=predict(c,foe,2000,0.25);cast('E',pr.x,pr.y);}}")
rep("if(c.ranks.E&&c.chg.E>0)d+=A.E.dmg(c,c.ranks.E)+A.Q.cleave(c,Math.max(1,c.ranks.Q));","if(r=has('E'))d+=A.E.dmg(c,r);if(c.ranks.Q&&c.axes.Q.state!=='hand')d+=A.Q.dmg(c,c.ranks.Q)+A.Q.cleave(c,c.ranks.Q);")
# ---- icon ----
i=s.index("    if(k==='E'){g.fillStyle='rgba(255,255,255,.2)';g.beginPath();g.ellipse(40,40");j=s.index("\n",i)
s=s[:i]+"    if(k==='E'){g.fillStyle='#140d0a';g.beginPath();g.moveTo(6,46);g.lineTo(14,38);g.lineTo(20,40);g.lineTo(28,28);g.lineTo(34,30);g.lineTo(46,14);g.lineTo(44,22);g.lineTo(36,34);g.lineTo(30,34);g.lineTo(22,46);g.lineTo(14,44);g.closePath();g.fill();g.strokeStyle='#ff8c32';g.lineWidth=1.6;g.beginPath();g.moveTo(9,45);g.lineTo(18,41);g.lineTo(28,31);g.lineTo(40,22);g.stroke();g.fillStyle='#9a8670';for(const [x,y,r2] of [[20,30,3],[34,20,2.5],[40,36,3],[12,34,2]]){g.beginPath();g.arc(x,y,r2,0,TAU);g.fill();}axe(40,12,-2.2,'#9fb6c8','#7cd0ff');}"+s[j:]
open(p,'w').write(s);print('ok')
