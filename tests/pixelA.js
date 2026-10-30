// ================= pixel-art sprites =================
// Characters are small 3D puppets (balls, capsules, polygons) posed per animation frame, projected through the
// same isometric camera at low resolution, then hard-edged and outlined so they read as pixel art.
// Frames are baked lazily and cached per direction, animation and frame.
const DIRS=16,MDIRS=8;
const SPR=new Map();
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
function bake(rig,ang,k,box,outline){
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
    if(p.t==='b'){const r=Math.max(0.7,p.r*k);g.fillStyle=p.col;g.beginPath();g.arc(it.q.x,it.q.y,r,0,TAU);g.fill();
      if(p.hi&&r>1.8){g.fillStyle=tint(p.col,0.3);g.beginPath();g.arc(it.q.x-r*0.35,it.q.y-r*0.35,r*0.45,0,TAU);g.fill();}}
    else if(p.t==='d'){g.fillStyle=p.col;g.fillRect(Math.round(it.q.x-0.5),Math.round(it.q.y-0.5),1,1);}
    else if(p.t==='l'){const w=Math.max(1.2,p.r*2*k);g.strokeStyle=p.col;g.lineWidth=w;g.beginPath();g.moveTo(it.a.x,it.a.y);g.lineTo(it.b.x,it.b.y);g.stroke();
      if(w>2.6){g.strokeStyle=tint(p.col,0.28);g.lineWidth=Math.max(1,w*0.3);g.beginPath();g.moveTo(it.a.x-w*0.2,it.a.y-w*0.2);g.lineTo(it.b.x-w*0.2,it.b.y-w*0.2);g.stroke();}}
    else{g.fillStyle=p.col;g.beginPath();it.pts.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fill();
      if(p.edge){g.strokeStyle=p.edge;g.lineWidth=1;g.beginPath();it.pts.slice(1,-1).forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.stroke();}}
  }
  pixelize(c,outline||'#120d10');
  return{c,ax,ay};
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
// ---- Aria: barbarian ----
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
// ---- Shade: assassin ----
function rigShade(anim,ph,side){
  const R=mkRig();
  let bob=0,lean=0,o=0,swL=0,swR=0,knL=0,knR=0,crouch=0,scarfPh=ph;
  const H={1:V(8,15,44),[-1]:V(8,-15,44)},Wd={1:V(0.85,0.15,-0.45),[-1]:V(0.85,-0.15,-0.45)};
  switch(anim){
    case'idle':bob=Math.sin(ph*TAU)*1.2;H[1]=V(8,15,44+bob);H[-1]=V(8,-15,44+bob);break;
    case'walk':{const a=Math.sin(ph*TAU);swL=a*0.65;swR=-a*0.65;knL=Math.max(0,Math.cos(ph*TAU))*1.1;knR=Math.max(0,-Math.cos(ph*TAU))*1.1;bob=Math.abs(Math.sin(ph*TAU))*2.5;
      H[1]=V(8-a*9,15,45+bob);H[-1]=V(8+a*9,-15,45+bob);lean=4;break;}
    case'attack':{const s=side;
      H[s]=kf([[0,V(8,s*15,44)],[0.4,V(-8,s*20,62)],[0.55,V(32,s*3,54)],[0.72,V(26,-s*4,48)],[1,V(8,s*15,44)]],ph);
      Wd[s]=kf([[0,V(0.85,s*0.15,-0.45)],[0.4,V(0.1,s*0.7,0.7)],[0.55,V(1,-s*0.15,0)],[0.72,V(0.85,-s*0.4,-0.3)],[1,V(0.85,s*0.15,-0.45)]],ph);
      H[-s]=kf([[0,V(8,-s*15,44)],[0.4,V(14,-s*12,54)],[1,V(8,-s*15,44)]],ph);
      lean=kf([[0,2],[0.4,-5],[0.55,12],[0.72,9],[1,2]],ph);o=kf([[0,0],[0.4,-4],[0.55,12],[0.75,8],[1,0]],ph);
      const st=kf([[0,0],[0.4,-0.3],[0.55,0.6],[1,0]],ph);if(s>0){swR=st;swL=-st*0.6;}else{swL=st;swR=-st*0.6;}crouch=kf([[0,0],[0.55,4],[1,0]],ph);break;}
    case'throw':H[1]=kf([[0,V(8,15,44)],[0.45,V(-10,18,70)],[0.6,V(30,8,58)],[1,V(14,15,46)]],ph);
      Wd[1]=kf([[0,V(0.85,0.15,-0.45)],[0.45,V(-0.3,0.3,0.9)],[0.6,V(1,0,0)],[1,V(0.85,0.15,-0.45)]],ph);
      lean=kf([[0,2],[0.45,-5],[0.6,10],[1,2]],ph);o=kf([[0,0],[0.6,6],[1,0]],ph);swR=kf([[0,0],[0.6,0.45],[1,0]],ph);break;
    case'swing':{const a=kf([[0,-0.8],[0.35,-1.6],[0.75,4.4],[1,4.7]],ph);crouch=kf([[0,0],[0.35,7],[0.75,7],[1,2]],ph);
      for(const s of [1,-1]){const aa=a+(s>0?0:PI);H[s]=V(Math.cos(aa)*30,Math.sin(aa)*30,48);Wd[s]=V(Math.cos(aa),Math.sin(aa),0);}
      knL=knR=0.6*crouch/7;swL=0.25;swR=-0.25;break;}
    case'roar':{const r=kf([[0,0],[0.4,1],[1,1]],ph);crouch=10*r;H[1]=lerpV(V(8,15,44),V(12,-4,58),r);H[-1]=lerpV(V(8,-15,44),V(12,4,58),r);
      Wd[1]=V(0.2,-0.6,0.7);Wd[-1]=V(0.2,0.6,0.7);knL=knR=0.9*r;swL=swR=0.3*r;break;}
  }
  const hipZ=40+bob*0.5-crouch;
  legsAt(R,o,hipZ,6.5,swL,swR,knL,knR,20,20,4.8,'#1d1626','#120e17',4);
  const waist=V(o+lean*0.3,0,49+bob-crouch),chest=V(o+lean*0.7,0,62+bob-crouch);
  R.limb(V(o,0,hipZ+2),waist,10,'#1d1626');R.limb(waist,chest,10.5,'#241b30');
  R.limb(V(waist.f,0,waist.z-2),V(waist.f,0,waist.z+1),11,'#2b2238');
  for(const s of [1,-1])R.ball(V(chest.f-1,s*11,62+bob-crouch),6,'#3a2d4f');
  const S={1:V(chest.f,12,61+bob-crouch),[-1]:V(chest.f,-12,61+bob-crouch)};
  for(const s of [1,-1]){armAt(R,S[s],H[s],s,3.8,'#1d1626');bladeAt(R,H[s],normV(Wd[s]),34);}
  for(let i=0;i<5;i++){const w=Math.sin(scarfPh*TAU*2+i*0.9)*(2+i*1.4);R.ball(V(chest.f-6-i*7,w,66+bob-crouch-i*2.5),4.6-i*0.5,i%2?'#a01f33':'#c4283f');}
  const hc=V(chest.f+1,0,74+bob-crouch);
  R.ball(hc,9.5,'#120e17');
  R.poly([V(hc.f-5,-8,hc.z+2),V(hc.f-9,0,hc.z+15),V(hc.f-5,8,hc.z+2)],'#1d1626');
  R.ball(V(hc.f+2,0,hc.z-3),6.5,'#2b2238',false);
  R.dot(addV(addV(hc,V(1,0,0),9),V(0,1,0),3.2),'#d9b8ff');R.dot(addV(addV(hc,V(1,0,0),9),V(0,1,0),-3.2),'#d9b8ff');
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
  if(hyp(u.vx,u.vy)>30)return{anim:'walk',ph:((u.walkD||0)/120)%1};
  return{anim:'idle',ph:(G.t*0.7)%1};
}
function champSprite(u,pose){
  pose=pose||champPose(u);const N=ANIM_N[pose.anim]||1,fr=Math.min(N-1,Math.floor(pose.ph*N)),d=pose.dir!==undefined?pose.dir:dirIdx(u.facing,DIRS),sd=pose.side||1;
  const key=`${u.key}|${pose.anim}|${sd}|${d}|${fr}`;let s=SPR.get(key);
  if(!s){const rf=u.key==='aria'?rigAria:rigShade;s=bake(rf(pose.anim,(fr+0.5)/N,sd),d*TAU/DIRS,ART_K,CHAMP_BOX);SPR.set(key,s);}
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
  const bx=Math.round(x*RS)-s.ax,by=Math.round(y*RS)-s.ay;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha;ctx.drawImage(s.c,bx,by);
  if(flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,flash);ctx.drawImage(s.c,bx,by);ctx.drawImage(s.c,bx,by);}
  ctx.restore();
}
function kickOffset(u){if(!u.kick||G.t>u.kick.until)return[0,0];const f=(u.kick.until-G.t)/0.14,a=projAng(u.kick.ang);return[Math.cos(a)*5*f,Math.sin(a)*5*f];}
function footShadow(x,y,r,col){const p=P(x,y);ctx.fillStyle=col||'rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(p.x,p.y,r*SCALE,r*SCALE*IK,0,0,TAU);ctx.fill();}
function drawChamp(u,t){
  if(!u.alive)return;
  const enemy=u.team!==G.player.team;let alpha=1;
  if(u.stealthT>0){if(enemy)return;alpha=0.4;}
  if(u.untargetT>0){if(enemy)return;alpha=0.25;}
  screenT();
  footShadow(u.x,u.y,u.r+6);
  const p=P(u.x,u.y);ctx.strokeStyle=u===G.player?'#5fe08b':TEAMC[u.team];ctx.lineWidth=2/RS;ctx.beginPath();ctx.ellipse(p.x,p.y,(u.r+6)*SCALE,(u.r+6)*SCALE*IK,0,0,TAU);ctx.stroke();
  const lz=u.dash&&u.dash.leap?Math.sin((1-u.dash.t/u.dash.total)*PI)*90:0;
  const q=P(u.x,u.y,lz),[kx,ky]=kickOffset(u);
  blit(champSprite(u),q.x+kx,q.y+ky,alpha,u.hitFlash*9);
  if(u.stunT>0){ctx.fillStyle='#ffe98a';for(let i=0;i<3;i++){const a=t*6+i*TAU/3,s=P(u.x,u.y,104);ctx.fillRect(s.x+Math.cos(a)*18*SCALE-2,s.y+Math.sin(a)*6*SCALE-2,4,4);}}
}
function drawMinion(m,t){
  let a=1;if(!m.alive){a=1-m.deadT/0.5;if(a<=0)return;}
  screenT();footShadow(m.x,m.y,m.r,'rgba(0,0,0,.32)');
  const q=P(m.x,m.y),[kx,ky]=kickOffset(m);
  blit(minionSprite(m),q.x+kx,q.y+ky,a,m.hitFlash*9);
}
function drawTower(tw,t){
  screenT();const p=P(tw.x,tw.y);
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(p.x+10*SCALE,p.y+4*SCALE,100*SCALE,100*SCALE*IK,0,0,TAU);ctx.fill();
  blit(towerSprite(tw.team,tw.alive),p.x,p.y,1,tw.hitFlash*6);
  if(!tw.alive)return;
  const cz=222+Math.sin(t*2)*6,c=P(tw.x,tw.y,cz),s=SCALE;
  const glow=ctx.createRadialGradient(c.x,c.y,2,c.x,c.y,80*s);glow.addColorStop(0,TEAML[tw.team]);glow.addColorStop(0.3,TEAMC[tw.team]+'aa');glow.addColorStop(1,TEAMC[tw.team]+'00');
  ctx.fillStyle=glow;ctx.globalAlpha=0.7+Math.sin(t*3)*0.15;ctx.beginPath();ctx.arc(c.x,c.y,80*s,0,TAU);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=TEAMC[tw.team];ctx.beginPath();ctx.moveTo(c.x,c.y-34*s);ctx.lineTo(c.x+17*s,c.y);ctx.lineTo(c.x,c.y+30*s);ctx.lineTo(c.x-17*s,c.y);ctx.closePath();ctx.fill();
  ctx.fillStyle=TEAML[tw.team];ctx.beginPath();ctx.moveTo(c.x,c.y-34*s);ctx.lineTo(c.x+7*s,c.y);ctx.lineTo(c.x,c.y+30*s);ctx.lineTo(c.x-5*s,c.y-2*s);ctx.closePath();ctx.fill();
}
