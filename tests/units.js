// ---- Shade: hand-drawn sheet (8 directions x 6 walk frames), aligned so every cell shares one foot anchor ----
// Rows run clockwise on screen starting from facing the camera: S, SW, W, NW, N, NE, E, SE.
const SHADE_SHEET={src:'assets/shade.webp',cw:185,ch:155,ax:92,ay:144,h:130,img:null,ready:false};
(function(){const im=new Image();im.onload=()=>{SHADE_SHEET.img=im;SHADE_SHEET.ready=true;onSheetReady();};im.src=SHADE_SHEET.src;})();
function onSheetReady(){SPR.clear();const cards=document.querySelectorAll('#cards canvas');if(cards[1])drawPortrait(cards[1],'shade',BLUE);if(G&&G.player.key==='shade')drawPortrait($('portC'),'shade',G.player.team);}
function shadeFrame(u,pose){
  const fa=projAng(u.facing),dx=Math.cos(fa),dy=Math.sin(fa);
  let row=((Math.round((fa-PI/2)/(PI/4))%8)+8)%8,col=0,ox=0,oy=0,rot=0,sx=1,sy=1;
  switch(pose.anim){
    case'walk':col=Math.floor(pose.ph*6)%6;break;
    case'idle':sy=1+Math.sin(pose.ph*TAU)*0.02;sx=2-sy;break;
    case'attack':case'throw':{const p=pose.ph,b=kf([[0,0],[0.4,-1],[0.55,1.2],[0.75,0.8],[1,0]],p);
      ox=dx*b*14;oy=dy*b*10;rot=b*0.14*(dx>=0?1:-1);sy=1-Math.max(0,-b)*0.06;col=p>0.45&&p<0.8?3:0;break;}
    case'swing':{const p=pose.ph;row=(row+Math.floor(kf([[0,0],[0.35,0],[0.75,8],[1,8]],p)))%8;sy=0.93;sx=1.04;break;}
    case'roar':sy=kf([[0,1],[0.4,0.84],[1,0.84]],pose.ph);sx=2-sy;break;
  }
  return{sheet:true,row,col,ox,oy,rot,sx,sy};
}
function drawSheet(fr,x,y,alpha,flash){
  const S=SHADE_SHEET,k=SCALE*100/S.h*RS;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.translate(Math.round((x+fr.ox*SCALE)*RS),Math.round((y+fr.oy*SCALE)*RS));
  if(fr.rot)ctx.rotate(fr.rot);ctx.scale(k*fr.sx,k*fr.sy);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const draw=()=>ctx.drawImage(S.img,fr.col*S.cw,fr.row*S.ch,S.cw,S.ch,-S.ax,-S.ay,S.cw,S.ch);
  ctx.globalAlpha=alpha;draw();
  if(flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,flash*0.8);draw();}
  ctx.restore();
}
function drawAny(s,x,y,alpha,flash){if(s.sheet)drawSheet(s,x,y,alpha,flash);else blit(s,x,y,alpha,flash);}
function footShadow(x,y,r,col){const p=P(x,y);ctx.fillStyle=col||'rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(p.x,p.y,r*SCALE,r*SCALE*IK,0,0,TAU);ctx.fill();}
function champVisible(u){if(!u.alive)return 0;const enemy=u.team!==G.player.team;if(u.stealthT>0)return enemy?0:0.4;if(u.untargetT>0)return enemy?0:0.25;return 1;}
// ground pass: shadows and team rings sit on the pixel ground layer
function drawUnitGround(){
  screenT();
  for(const tw of G.towers){const p=P(tw.x,tw.y);ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(p.x+10*SCALE,p.y+4*SCALE,100*SCALE,100*SCALE*IK,0,0,TAU);ctx.fill();}
  for(const m of G.minions)if(m.alive||m.deadT<0.5)footShadow(m.x,m.y,m.r,'rgba(0,0,0,.32)');
  for(const u of G.champs){if(!champVisible(u))continue;footShadow(u.x,u.y,u.r+6);
    const p=P(u.x,u.y);ctx.strokeStyle=u===G.player?'#5fe08b':TEAMC[u.team];ctx.lineWidth=2/RS;ctx.beginPath();ctx.ellipse(p.x,p.y,(u.r+6)*SCALE,(u.r+6)*SCALE*IK,0,0,TAU);ctx.stroke();}
}
function drawChamp(u,t){
  const alpha=champVisible(u);if(!alpha)return;
  const lz=u.dash&&u.dash.leap?Math.sin((1-u.dash.t/u.dash.total)*PI)*90:0;
  const q=P(u.x,u.y,lz),[kx,ky]=kickOffset(u);
  drawAny(champSprite(u),q.x+kx,q.y+ky,alpha,u.hitFlash*9);
}
function drawMinion(m,t){
  let a=1;if(!m.alive){a=1-m.deadT/0.5;if(a<=0)return;}
  const q=P(m.x,m.y),[kx,ky]=kickOffset(m);
  blit(minionSprite(m),q.x+kx,q.y+ky,a,m.hitFlash*9);
}
function drawTower(tw,t){
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

