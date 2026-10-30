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
  const TH=23,SH=22,SP=6.2;
  const leg=(sw,kn)=>{const kz=-Math.cos(sw)*TH,kx=Math.sin(sw)*TH,a2=sw-kn;return{kz,kx,fz:kz-Math.cos(a2)*SH,fx:kx+Math.sin(a2)*SH,a2};};
  const lg={1:leg(swR,knR),[-1]:leg(swL,knL)};
  const hipZ=Math.max(-lg[1].fz,-lg[-1].fz)+3;
  for(const s of [1,-1]){const L=lg[s],hip=V(o,s*SP,hipZ),knee=V(o+L.kx,s*SP,hipZ+L.kz),ank=V(o+L.fx,s*SP,hipZ+L.fz);
    R.limb(hip,knee,5.2,C.pants);R.limb(knee,ank,4.4,C.pants);R.ball(knee,4.6,C.wrap);
    R.limb(lerpV(ank,knee,0.38),ank,5,C.boot);
    const lift=ank.z>5?Math.min(0.8,(ank.z-5)*0.05):0;R.limb(ank,V(ank.f+Math.cos(lift)*9,ank.s,ank.z-Math.sin(lift)*9+1),3.8,C.boot);}
  // torso with a little counter-twist at the shoulders
  const waist=V(o+lean*0.3,0,hipZ+11),chest=V(o+lean*0.7,0,hipZ+23),shZ=hipZ+28;
  const sh={};for(const s of [1,-1])sh[s]=V(chest.f-s*12*Math.sin(twist),s*12*Math.cos(twist),shZ);
  // back cape panel (behind the body)
  R.poly([V(chest.f-8,-11,shZ-1),V(chest.f-8,11,shZ-1),V(chest.f-12-drag,12,hipZ+6+flap),V(chest.f-12-drag,-12,hipZ+6-flap)],C.hood);
  R.limb(V(o,0,hipZ+2),waist,9.2,C.leather);
  R.limb(waist,chest,10.6,C.leather);
  R.limb(V(waist.f,0,hipZ+8),V(waist.f,0,hipZ+11),9.9,C.belt);R.ball(V(waist.f+9.5,0,hipZ+9.5),2.2,'#a98a52');
  // crossed straps, front and back
  for(const fb of [1,-1])for(const s of [1,-1])R.limb(V(chest.f+fb*9.6,s*9,shZ-2),V(waist.f+fb*9.4,-s*8,hipZ+12),1.5,C.strap);
  // shuriken on the belt
  const star=(c,r)=>{const pts=[];for(let i=0;i<8;i++){const a=i/8*TAU,rr=i%2?r*0.38:r;pts.push(V(c.f,c.s+Math.cos(a)*rr,c.z+Math.sin(a)*rr));}R.poly(pts,'#b9c2c9','#eef2f5');};
  star(V(waist.f+9.8,-6,hipZ+7),4.4);star(V(waist.f-9.8,5,hipZ+7),4);
  // tattered sash strips hanging from the belt
  [[0.5,C.sash],[-0.4,C.sash2],[2.6,C.sash],[3.5,C.sash2],[PI,C.sash]].forEach(([a,col],i)=>{
    const r=10,c0=V(waist.f+Math.cos(a)*r,Math.sin(a)*r,hipZ+8),tg=V(-Math.sin(a)*2.4,Math.cos(a)*2.4,0);
    const len=15+(i%2)*5,bot=V(c0.f-drag*0.8+Math.cos(a)*2,c0.s+flap*1.5*(i%2?1:-1),c0.z-len);
    R.poly([addV(c0,tg,1),addV(c0,tg,-1),addV(bot,tg,-0.6),V(bot.f,bot.s,bot.z-3),addV(bot,tg,0.6)],col);});
  // arms
  for(const s of [1,-1]){
    const hand=V(H[s].f+o*0.6,H[s].s,shZ+handZ[s]);const m=lerpV(sh[s],hand,0.5),el=V(m.f-4,m.s+s*4,m.z-5);
    R.ball(sh[s],6.2,C.hood2);R.limb(sh[s],el,3.9,C.leather);R.limb(el,hand,3.4,C.skin);R.limb(lerpV(el,hand,0.5),hand,3.9,C.glove);R.ball(hand,3.7,C.glove);
    // curved claw blade
    const w=normV(Wd[s]),p=perpOf(w,V(0,0,1)),outer=[],inner=[];
    for(let i=0;i<=5;i++){const t=i/5;outer.push(addV(addV(hand,w,3+29*t),p,s*(6*t*t+3.4*(1-t))));inner.push(addV(addV(hand,w,3+27*t),p,s*(6*t*t)));}
    R.poly([...outer,...inner.reverse()],C.steel,'#f4f7fa');}
  // cowl, hood and face
  R.ball(V(chest.f+0.5,0,shZ+3),8.2,C.hood2);
  const hc=V(chest.f+2,0,shZ+12);
  R.ball(V(hc.f-3,0,hc.z+1.5),8.6,C.hood);R.ball(hc,8.5,C.hood);
  R.poly([V(hc.f-4,-6,hc.z+4),V(hc.f-10,0,hc.z+14),V(hc.f-4,6,hc.z+4)],C.hood);
  R.ball(V(hc.f+4.2,0,hc.z-1),5.2,C.face,false);R.ball(V(hc.f+5.6,0,hc.z-4),3,C.skin,false);R.ball(V(hc.f+6,0,hc.z-6),2.4,C.beard,false);
  R.dot(V(hc.f+8.4,2.3,hc.z+0.3),C.eye);R.dot(V(hc.f+8.4,-2.3,hc.z+0.3),C.eye);
  return R;
}
