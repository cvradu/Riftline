function drawFx(){
  screenT();const s=SCALE;
  for(const f of G.fx){const k=f.t/f.dur;if(f.k==='ring'||f.k==='smear')continue;ctx.save();
    if(f.k==='spark'){const q=P(f.x,f.y,30+k*20);ctx.globalAlpha=1-k;ctx.fillStyle=f.col;const r=Math.max(1/RS,(3*(1-k)+1)*s);ctx.fillRect(q.x-r,q.y-r,r*2,r*2);}
    else if(f.k==='slash'){const q=P(f.x,f.y,40);ctx.globalAlpha=1-k;ctx.strokeStyle=f.col;ctx.lineWidth=(6*(1-k)+2)*s;ctx.translate(q.x,q.y);ctx.scale(s,s);ctx.rotate(projAng(f.ang));ctx.beginPath();ctx.arc(-20,0,34,-0.9+k*0.4,0.9+k*0.4);ctx.stroke();}
    else if(f.k==='ghost'){const q=P(f.x,f.y);blit(f.spr,q.x,q.y,0.35*(1-k),0.6);}
    else if(f.k==='smoke'){const q=P(f.x,f.y,20+k*40);ctx.globalAlpha=0.5*(1-k);ctx.fillStyle='#4a3d5c';ctx.beginPath();ctx.arc(q.x,q.y,f.r*(1+k)*s,0,TAU);ctx.fill();}
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
function groundEllipse(x,y,r,col,lw,dash){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw;if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();}
let demoT=0;
function render(dt){
  let tx,ty;
  if(G){const p=G.player;const w=screenToWorld(mouse.x,mouse.y);let ox=(w.x-p.x)*0.2,oy=(w.y-p.y)*0.2;const l=hyp(ox,oy);if(l>260){ox*=260/l;oy*=260/l;}tx=p.x+ox;ty=p.y+oy;}
  else{demoT+=dt;tx=W/2+Math.sin(demoT*0.08)*2200;ty=MIDY;}
  cam.x+=(tx-cam.x)*Math.min(1,dt*7);cam.y+=(ty-cam.y)*Math.min(1,dt*7);
  cam.x=clamp(cam.x,650,W-650);cam.y=clamp(cam.y,LANE_TOP+260,LANE_BOT-260);
  SHX=SHY=0;
  if(G&&G.shake&&G.shake.t>0){G.shake.t-=dt;const m=G.shake.mag*Math.max(0,G.shake.t/G.shake.dur);SHX=rnd(-m,m);SHY=rnd(-m,m);}
  // world pass: low-resolution buffer, upscaled with hard pixels
  ctx=bctx;RS=DPR/PXd;bctx.imageSmoothingEnabled=true;
  screenT();ctx.fillStyle='#0f1613';ctx.fillRect(0,0,VW,VH);
  drawTerrain();
  const t=performance.now()/1000;
  groundT(0);
  for(let i=0;i<2;i++){const f=FOUNT[i];ctx.save();ctx.globalAlpha=0.25+Math.sin(t*2)*0.08;ctx.fillStyle=TEAMC[i];ctx.beginPath();ctx.arc(f.x,f.y,FOUNT_R-30,0,TAU);ctx.fill();ctx.restore();}
  if(G){
    const p=G.player;
    for(const r of G.relics)if(r.active){ctx.fillStyle='rgba(80,255,150,.2)';ctx.beginPath();ctx.arc(r.x,r.y,40,0,TAU);ctx.fill();}
    const et=G.towers[1-p.team];
    if(p.alive&&et.alive&&dist(p,et)<et.range+450)groundEllipse(et.x,et.y,et.range,et.target===p?'rgba(255,80,70,.85)':'rgba(255,90,80,.35)',et.target===p?9:6,[26,16]);
    if(p.alive)groundEllipse(p.x,p.y,p.range+p.r,'rgba(255,255,255,.14)',4);
    if(G.hover){const h=G.hover;groundEllipse(h.x,h.y,h.r+10,'rgba(255,90,80,.95)',6);}
    drawGroundFx();
  }
  drawCliff();
  if(G){
    screenT();
    for(const r of G.relics){if(!r.active)continue;const q=P(r.x,r.y,44+Math.sin(t*3)*6);ctx.save();ctx.translate(q.x,q.y);ctx.scale(SCALE,SCALE);
      ctx.fillStyle='#4fe08a';ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(14,0);ctx.lineTo(0,20);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();ctx.fillStyle='#d9ffe6';ctx.fillRect(-3,-9,6,18);ctx.fillRect(-9,-3,18,6);ctx.restore();}
    const list=[...G.towers,...G.minions,...G.champs].sort((a,b)=>(a.y-a.x)-(b.y-b.x));
    for(const u of list){if(u.kind==='tower')drawTower(u,t);else if(u.kind==='minion')drawMinion(u,t);else drawChamp(u,t);}
    drawSmears();
    screenT();for(const pr of G.projs)drawProj(pr,t);
    drawFx();
  }
  // upscale to the screen
  ctx=mctx;RS=DPR;mctx.setTransform(1,0,0,1,0,0);mctx.imageSmoothingEnabled=false;mctx.drawImage(buf,0,0,buf.width*PXd,buf.height*PXd);
  if(!G)return;
  const p=G.player;
  drawBars();drawTexts();
  screenT();
  if(!p.alive){ctx.fillStyle='rgba(20,10,12,.45)';ctx.fillRect(0,0,VW,VH);}
  const hot=!!G.hover;ctx.strokeStyle=hot?'#ff6a5e':'#eaf2f2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mouse.x,mouse.y,9,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.moveTo(mouse.x-16,mouse.y);ctx.lineTo(mouse.x-11,mouse.y);ctx.moveTo(mouse.x+11,mouse.y);ctx.lineTo(mouse.x+16,mouse.y);ctx.moveTo(mouse.x,mouse.y-16);ctx.lineTo(mouse.x,mouse.y-11);ctx.moveTo(mouse.x,mouse.y+11);ctx.lineTo(mouse.x,mouse.y+16);ctx.stroke();
}

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
    }}catch(e){}
  }
};
function shake(mag,dur){if(!G)return;if(!G.shake||G.shake.t<=0||mag>=G.shake.mag)G.shake={t:dur,dur,mag};}
function impact(t,col,big){G.fx.push({k:'impact',x:t.x,y:t.y,z:heightOf(t)*0.5,t:0,dur:0.2,col,big,rays:Array.from({length:6},(_,i)=>i/6*TAU+rnd(-0.3,0.3))});}
