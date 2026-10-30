// ---- Shade: hand-drawn sheets (8 directions x 6 frames each), aligned on a shared foot anchor ----
// Rows run clockwise on screen from facing the camera: S, SW, W, NW, N, NE, E, SE.
const SHADE_H=98,WALK_STRIDE=150;
const SHEETS={"walk":{cw:257,ch:162,ax:129,ay:147,h:139.5,img:null},"auto":{cw:252,ch:158,ax:126,ay:119,h:114.3,img:null},"q":{cw:271,ch:145,ax:134,ay:117,h:114.3,img:null},"rmb":{cw:256,ch:136,ax:120,ay:115,h:114.3,img:null},"e":{cw:270,ch:163,ax:132,ay:124,h:114.3,img:null}};
let SHEETS_READY=false;
(function(){let left=0;for(const [k,s] of Object.entries(SHEETS)){left++;const im=new Image();im.onload=()=>{s.img=im;if(--left===0){SHEETS_READY=true;onSheetsReady();}};im.src='assets/shade_'+k+'.webp';}})();
function onSheetsReady(){const cards=document.querySelectorAll('#cards canvas');if(cards[1])drawPortrait(cards[1],'shade',BLUE);if(G&&G.player.key==='shade')drawPortrait($('portC'),'shade',G.player.team);}
function shadeFrame(u){
  const fa=projAng(u.facing),row=((Math.round((fa-PI/2)/(PI/4))%8)+8)%8;
  if(u.dash&&(u.dash.kind==='E'||u.dash.kind==='R'))return{sheet:'e',row,col:2};
  const ca=u.castAnim;
  if(ca){const t=G.t-ca.start,W=ca.W;
    if(ca.kind==='q'&&t<W+0.3)return{sheet:'q',row,col:t<W?(t<W*0.35?0:t<W*0.7?1:2):(t-W<0.1?3:t-W<0.2?4:5)};
    if(ca.kind==='rmb'&&t<W+0.3)return{sheet:'rmb',row,col:t<W?(t<W*0.5?1:2):(t-W<0.15?3:5)};
    if(ca.kind==='eArrive'&&t<0.3)return{sheet:'e',row,col:t<0.1?3:t<0.2?4:5};
    if(ca.kind==='rCut'&&t<W+0.36)return{sheet:'auto',row,col:t<W?2:t-W<0.14?3:t-W<0.26?4:5};
  }
  const at=u.atk;
  if(at&&G.t-at.start<at.W+0.28){const t=G.t-at.start,W=at.W;
    if(at.cross)return{sheet:'auto',row,col:t<W?(t<W*0.5?1:2):(t-W<0.1?3:t-W<0.2?4:5)};
    return{sheet:'auto',row,col:t<W?(t<W*0.5?0:1):(t-W<0.14?2:5)};}
  if(hyp(u.vx,u.vy)>30)return{sheet:'walk',row,col:Math.floor(((u.walkD||0)/WALK_STRIDE)%1*6)};
  return{sheet:'auto',row,col:0};
}
function drawSheet(fr,x,y,alpha,flash){
  const S=SHEETS[fr.sheet],k=SCALE*SHADE_H/S.h*RS;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.translate(Math.round(x*RS),Math.round(y*RS));ctx.scale(k,k);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const draw=()=>ctx.drawImage(S.img,fr.col*S.cw,fr.row*S.ch,S.cw,S.ch,-S.ax,-S.ay,S.cw,S.ch);
  ctx.globalAlpha=alpha;draw();
  if(flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,flash*0.7);draw();}
  ctx.restore();
}
