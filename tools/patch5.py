SP='/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/'
p='/home/user/riftline/index.html';s=open(p).read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:90],s.count(old))
    s=s.replace(old,new)
A=open(SP+'pixelA.js').read().replace("const SPR=new Map();\n","")
B=open(SP+'pixelB.js').read()
i=s.index("// ================= drawing: figures =================");j=s.index("const resCol=")
s=s[:i]+A+"\n"+s[j:]
i=s.index("function drawFx(){");j=s.index("// ================= HUD =================")
s=s[:i]+B+"\n"+s[j:]
# canvases, scale and projection
rep("const cv=$('game'),ctx=cv.getContext('2d');","const cv=$('game'),mctx=cv.getContext('2d'),buf=document.createElement('canvas'),bctx=buf.getContext('2d');let ctx=mctx;")
rep("let DPR=1,VW=0,VH=0,SCALE=1;const cam={x:W/2,y:MIDY};","let DPR=1,VW=0,VH=0,SCALE=1,PXd=3,RS=1,ART_K=0,SHX=0,SHY=0;const cam={x:W/2,y:MIDY};const SPR=new Map();")
rep("SCALE=Math.min(VH/800,VW/1320);}","SCALE=Math.min(VH/800,VW/1320);\n  // world renders into a buffer where one pixel is PXd device pixels; sprites are baked at that scale\n  PXd=Math.max(2,Math.round(2.7*SCALE*DPR));buf.width=Math.ceil(cv.width/PXd);buf.height=Math.ceil(cv.height/PXd);\n  const k=SCALE*DPR/PXd;if(Math.abs(k-ART_K)>1e-6){ART_K=k;SPR.clear();}}")
rep("return{x:VW/2+(dx+dy)*IC*SCALE,y:VH*0.57+((dy-dx)*IC*IK-(z||0))*SCALE};}","return{x:VW/2+(dx+dy)*IC*SCALE+SHX,y:VH*0.57+((dy-dx)*IC*IK-(z||0))*SCALE+SHY};}")
rep("function groundT(lift){const k=DPR*SCALE,a=k*IC,b=-k*IC*IK,c=k*IC,d=k*IC*IK;ctx.setTransform(a,b,c,d,DPR*VW/2-(a*cam.x+c*cam.y),DPR*VH*0.57-(b*cam.x+d*cam.y)-(lift||0)*k);}",
    "function groundT(lift){const k=RS*SCALE,a=k*IC,b=-k*IC*IK,c=k*IC,d=k*IC*IK;ctx.setTransform(a,b,c,d,RS*(VW/2+SHX)-(a*cam.x+c*cam.y),RS*(VH*0.57+SHY)-(b*cam.x+d*cam.y)-(lift||0)*k);}")
rep("function screenT(){ctx.setTransform(DPR,0,0,DPR,0,0);}","function screenT(){ctx.setTransform(RS,0,0,RS,0,0);}")
# animation state + feel
rep("castKind:{","castKind:{",0)
rep("    furyOnHit:8,","    furyOnHit:8,castKind:{Q:'throw',E:'roar',RMB:'swing',R:'roar'},")
rep("    dash:{name:'Shadow Step'","    castKind:{Q:'throw',E:'swing',RMB:'roar',R:'swing'},\n    dash:{name:'Shadow Step'")
rep("c.wind={t:wu,total:wu,target,ang,ambush};","c.atkSide=-(c.atkSide||1);c.atk={start:G.t,W:wu,side:c.atkSide};\n  c.wind={t:wu,total:wu,target,ang,ambush,side:c.atkSide};")
rep("const onHit=t=>{dealDamage(c,t,dmg+extra,'phys',{crit,det:true});if(c.def.furyOnHit)c.res=Math.min(c.maxRes,c.res+c.def.furyOnHit);};",
"""const onHit=t=>{dealDamage(c,t,dmg+extra,'phys',{crit,det:true});if(c.def.furyOnHit)c.res=Math.min(c.maxRes,c.res+c.def.furyOnHit);
    t.kick={until:G.t+0.14,ang:angTo(c,t.x,t.y)};impact(t,c.key==='aria'?'#ffc27a':'#d9b8ff',crit||t.kind==='champ');
    SFX.play(crit?'crit':'hit',t.x,t.y,t.kind==='champ'?1:0.5);
    if(c===G.player||t===G.player){shake(t.kind==='champ'?4:2,0.12);if(t.kind==='champ')G.hitStop=0.05;}};""")
rep("    slash(c.x+Math.cos(w.ang)*(c.r+30),c.y+Math.sin(w.ang)*(c.r+30),w.ang+PI/2,w.ambush?'#e3d2ff':'#d8e2f0');",
    "    G.fx.push({k:'smear',x:c.x,y:c.y,z:48,ang:w.ang,side:w.side||1,col:w.ambush?'#c9a6ff':c.key==='aria'?'#ffb070':'#b48cff',r0:c.r*0.6,r1:c.r+c.range+18,span:2.1,t:0,dur:0.16});\n    SFX.play('swing',c.x,c.y,c===G.player?1:0.6);")
rep("c.wind=null;if(!c.def.dash.cast(c,ax,ay))return'notarget';c.dashCd=DASH_CD;return'ok';","c.wind=null;if(!c.def.dash.cast(c,ax,ay))return'notarget';c.dashCd=DASH_CD;SFX.play('dash',c.x,c.y);return'ok';")
rep("  c.cds[k]=a.cd[r-1]*100/(100+c.ah);c.res-=cost;","  c.cds[k]=a.cd[r-1]*100/(100+c.ah);c.res-=cost;\n  c.castAnim={start:G.t,W:c.cast?c.cast.total:0.08,kind:c.def.castKind[k]};SFX.play('cast',c.x,c.y,0.8);")
rep("if(c===G.player){popText(c.x,c.y,'Level '+c.level,'#e8c06a',20,140);hudDirty=true;}","if(c===G.player){popText(c.x,c.y,'Level '+c.level,'#e8c06a',20,140);hudDirty=true;SFX.play('level');}")
rep("    t.deaths++;","    t.deaths++;SFX.play('death',t.x,t.y);")
rep("u.moving=true;}","u.moving=true;u.walkD=(u.walkD||0)+s;}")
rep("  m.moving=false;\n","  m.moving=false;m.engaged=false;\n")
rep("if(e<=m.range){m.facing=angTo(m,t.x,t.y);","if(e<=m.range){m.facing=angTo(m,t.x,t.y);m.engaged=true;")
rep("if(m.atkCd<=0){m.atkCd=1/m.as;m.swing=0.2;","if(m.atkCd<=0){m.atkCd=1/m.as;m.swing=0.2;m.lastAtk=G.t;")
rep("        else dealDamage(m,t,m.ad,'phys');","        else{dealDamage(m,t,m.ad,'phys');t.kick={until:G.t+0.1,ang:m.facing};if(t===G.player)SFX.play('tick',t.x,t.y);\n          G.fx.push({k:'smear',x:m.x,y:m.y,z:m.mtype==='super'?40:24,ang:m.facing,side:m.id%2?1:-1,col:TEAML[m.team],r0:m.r*0.4,r1:m.r+m.range,span:1.6,t:0,dur:0.14,alpha:0.5});}")
rep("homing(t,tg,{speed:1300,kind:'towerShot',onHit:u=>dealDamage(t,u,dmg,'phys'),est:dmg});",
    "SFX.play('tower',t.x,t.y,0.6);homing(t,tg,{speed:1300,kind:'towerShot',onHit:u=>{dealDamage(t,u,dmg,'phys');impact(u,TEAML[t.team],true);SFX.play('towerHit',u.x,u.y);if(u===G.player)shake(6,0.2);},est:dmg});")
rep("c.vx+=(clamp(vx,-600,600)-c.vx)*0.3;c.vy+=(clamp(vy,-600,600)-c.vy)*0.3;}","c.vx+=(clamp(vx,-600,600)-c.vx)*0.3;c.vy+=(clamp(vy,-600,600)-c.vy)*0.3;c.walkD=(c.walkD||0)+hyp(c.x-c.px,c.y-c.py);}")
rep("if(G&&!G.paused){acc+=dt;","if(G&&!G.paused&&G.hitStop>0){G.hitStop-=dt;}\n  else if(G&&!G.paused){acc+=dt;")
rep("function ghost(c){G.fx.push({k:'ghost',x:c.x,y:c.y,ang:c.facing,key:c.key,team:c.team,t:0,dur:0.28});}","function ghost(c){G.fx.push({k:'ghost',x:c.x,y:c.y,spr:champSprite(c),t:0,dur:0.3});}")
# portrait from the pixel rig
i=s.index("function drawPortrait(cvs,key,team){");j=s.index("function buildHud(){")
s=s[:i]+"""function drawPortrait(cvs,key,team){const g=cvs.getContext('2d');const S=cvs.width;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,S,S);
  const gr=g.createRadialGradient(S/2,S/2,4,S/2,S/2,S/2);gr.addColorStop(0,key==='aria'?'#5a2a1c':'#2e2340');gr.addColorStop(1,'#0b1215');g.fillStyle=gr;g.fillRect(0,0,S,S);
  const k=0.42,spr=bake((key==='aria'?rigAria:rigShade)('idle',0.25,1),3*PI/4-0.35,k,CHAMP_BOX),f=Math.max(1,Math.floor(S/(110*k)));
  g.imageSmoothingEnabled=false;g.drawImage(spr.c,Math.round(S/2-spr.ax*f),Math.round(S*0.93-spr.ay*f),spr.c.width*f,spr.c.height*f);}
"""+s[j:]
# sound controls
rep("$('startBtn').addEventListener('click',newGame);","$('startBtn').addEventListener('click',()=>{SFX.init();newGame();});")
rep("$('restartBtn').addEventListener('click',newGame);","$('restartBtn').addEventListener('click',newGame);\nfunction updateMuteBtn(){$('muteBtn').textContent=SFX.muted?'Sound off':'Sound on';}\n$('muteBtn').addEventListener('click',()=>{SFX.init();SFX.muted=!SFX.muted;updateMuteBtn();});")
rep('<button type="button" class="ghost" id="restartBtn">Restart</button>','<button type="button" class="ghost" id="restartBtn">Restart</button><button type="button" class="ghost" id="muteBtn">Sound on</button>')
rep("  if(e.code==='Escape'){if(!G.over)setPause(!G.paused);return;}","  if(e.code==='Escape'){if(!G.over)setPause(!G.paused);return;}\n  if(e.code==='KeyM'){SFX.init();SFX.muted=!SFX.muted;updateMuteBtn();showReason(SFX.muted?'muted':'unmuted');return;}")
rep("dashcd:()=>'Dash on cooldown',","dashcd:()=>'Dash on cooldown',muted:()=>'Sound off (M)',unmuted:()=>'Sound on (M)',")
rep("· <b>Esc</b> pause</div>","· <b>M</b> sound · <b>Esc</b> pause</div>")
rep("<div><b>Esc</b>Pause</div>","<div><b>Esc</b>Pause</div>\n        <div><b>M</b>Sound on or off</div>")
open(p,'w').write(s)
print('ok')
