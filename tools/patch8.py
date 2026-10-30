p='/home/user/riftline/index.html';s=open(p).read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:110],s.count(old))
    s=s.replace(old,new)
# ---- sprite: dash pose, corruption stages ----
rep("const fa=projAng(u.facing),fr={S:CORA_SHEET,H:CORA_H,row:((Math.round((fa-PI/2)/(PI/4))%8)+8)%8,col:0,ox:0,oy:0,rot:0,sx:1,sy:1};",
    "const fa=projAng(u.facing),fr={S:CORA_SHEET,H:CORA_H,row:((Math.round((fa-PI/2)/(PI/4))%8)+8)%8,col:0,ox:0,oy:0,rot:0,sx:1,sy:1,corr:u.def.resource==='Corruption'?u.res:0};")
rep("  if(u.dash&&u.dash.leap){const p=1-u.dash.t","  if(u.dash&&(u.dash.kind==='E'||u.dash.kind==='R')){lunge(1,10);fr.col=2;return fr;}\n  if(u.dash&&u.dash.leap){const p=1-u.dash.t")
rep("  const draw=()=>ctx.drawImage(S.img,fr.col*S.cw,fr.row*S.ch,S.cw,S.ch,-S.ax,-S.ay,S.cw,S.ch);",
    "  const cc=fr.corr>=20?corruptedCell(fr,S):null;\n  const draw=()=>cc?ctx.drawImage(cc,0,0,S.cw,S.ch,-S.ax,-S.ay,S.cw,S.ch):ctx.drawImage(S.img,fr.col*S.cw,fr.row*S.ch,S.cw,S.ch,-S.ax,-S.ay,S.cw,S.ch);")
rep("function drawSheet(fr,x,y,alpha,flash){","""// Corruption stages drawn onto the base-form frame: faint violet veins, then organic armor, then the mask at 100.
const corrC=document.createElement('canvas'),corrG=corrC.getContext('2d');
function corruptedCell(fr,S){
  const st=Math.min(5,Math.floor(fr.corr/20)),g=corrG;
  if(corrC.width!==S.cw||corrC.height!==S.ch){corrC.width=S.cw;corrC.height=S.ch;}
  g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,S.cw,S.ch);
  g.drawImage(S.img,fr.col*S.cw,fr.row*S.ch,S.cw,S.ch,0,0,S.cw,S.ch);
  g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(110,30,190,${0.05*st})`;g.fillRect(0,0,S.cw,S.ch);
  const R=mulberry(fr.row*97+fr.col*13+7);g.lineCap='round';
  for(let i=0;i<st*5;i++){let x=S.ax+(R()-0.5)*60,y=S.ay-R()*S.h*0.85;g.strokeStyle=R()<0.5?'#b46bff':'#7a2bd6';g.lineWidth=1+R()*(st>=3?1.6:0.8);g.globalAlpha=0.55+0.08*st;
    g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){x+=(R()-0.5)*16;y+=(R()-0.5)*16;g.lineTo(x,y);}g.stroke();}
  if(st>=3){g.globalAlpha=0.3+0.12*(st-3);g.fillStyle='#3b1460';for(let i=0;i<st*3;i++){g.beginPath();g.ellipse(S.ax+(R()-0.5)*44,S.ay-S.h*(0.25+R()*0.5),3+R()*6,2+R()*4,R()*3,0,TAU);g.fill();}}
  if(fr.corr>=100){const face={0:0,1:-5,2:-10,6:10,7:5}[fr.row];
    if(face!==undefined){const fx=S.ax+face,fy=S.ay-S.h*0.86;g.globalAlpha=0.92;g.fillStyle='#4a1670';g.beginPath();g.ellipse(fx,fy,8,7,0,0,TAU);g.fill();
      g.strokeStyle='#c27bff';g.lineWidth=1.2;g.beginPath();g.moveTo(fx-9,fy-2);g.quadraticCurveTo(fx,fy-12,fx+9,fy-2);g.stroke();g.fillStyle='#f0d6ff';g.fillRect(fx-4,fy-1,2,1.5);g.fillRect(fx+2,fy-1,2,1.5);}}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';return corrC;
}
function drawSheet(fr,x,y,alpha,flash){""")
rep("  for(const u of G.champs){if(!champVisible(u))continue;footShadow(u.x,u.y,u.r+6);",
    "  for(const u of G.champs){if(!champVisible(u))continue;footShadow(u.x,u.y,u.r+6);\n    if(u.def.resource==='Corruption'&&u.res>=40){const p=P(u.x,u.y),gl=ctx.createRadialGradient(p.x,p.y,4,p.x,p.y,(u.r+40)*SCALE),a=(u.res/100)*(0.35+(u.res>=100?Math.sin(G.t*6)*0.15:0));gl.addColorStop(0,`rgba(170,80,255,${a})`);gl.addColorStop(1,'rgba(170,80,255,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.ellipse(p.x,p.y,(u.r+40)*SCALE,(u.r+40)*SCALE*IK,0,0,TAU);ctx.fill();}")
# ---- axes on the ground, R route, flying axes ----
axedraw = """function axeShape(q){ctx.fillStyle=q?'rgba(255,170,70,.35)':'rgba(90,170,255,.35)';ctx.beginPath();ctx.arc(0,0,24,0,TAU);ctx.fill();
  ctx.strokeStyle='#5a3a22';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.stroke();
  ctx.fillStyle=q?'#d8a050':'#9fb6c8';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(14,-18);ctx.quadraticCurveTo(28,-8,24,8);ctx.lineTo(14,4);ctx.closePath();ctx.fill();
  ctx.strokeStyle=q?'#ffcf7a':'#7cd0ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(14,-18);ctx.quadraticCurveTo(28,-8,24,8);ctx.stroke();}
function drawAxeGround(){
  const p=G.player;
  for(const c of G.champs){if(!c.axes)continue;
    for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.state!=='ground')continue;const f=clamp((ax.until-G.t)/AXE_LIFE,0,1),col=CORA_AXES[k].glow;
      ctx.fillStyle=k==='Q'?'rgba(255,160,60,.18)':'rgba(80,160,255,.18)';ctx.beginPath();ctx.arc(ax.x,ax.y,46,0,TAU);ctx.fill();
      ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.arc(ax.x,ax.y,46,-PI/2,-PI/2+TAU*f);ctx.stroke();
      if(c===p&&c.alive&&!ax.r&&c.ranks.E&&c.chg.E>0&&dist(c,ax)<=700&&!c.dash){ctx.save();ctx.setLineDash([18,14]);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(ax.x,ax.y);ctx.stroke();ctx.restore();}}
    const s=c.rSeq;
    if(s&&c.alive){ctx.save();ctx.setLineDash([22,12]);ctx.strokeStyle=s.state==='armed'&&G.t<s.readyAt?'rgba(190,110,255,.5)':'rgba(200,120,255,.9)';ctx.lineWidth=12;
      ctx.beginPath();ctx.moveTo(c.x,c.y);if(s.state==='armed'||s.state==='dash1')ctx.lineTo(s.p1.x,s.p1.y);ctx.lineTo(s.p2.x,s.p2.y);ctx.stroke();ctx.restore();
      for(const q of [s.p1,s.p2]){ctx.strokeStyle='rgba(200,120,255,.8)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(q.x,q.y,60,0,TAU);ctx.stroke();}}}
}
function drawAxeUpright(t){
  screenT();
  for(const c of G.champs){if(!c.axes)continue;
    for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.state!=='ground')continue;const q=P(ax.x,ax.y,26+Math.sin(t*4+(k==='Q'?0:2))*3);
      ctx.save();ctx.translate(q.x,q.y);ctx.scale(SCALE*1.2,SCALE*1.2);ctx.rotate(-PI/2+0.35);axeShape(k==='Q');ctx.restore();}
    if(c===G.player&&c.rSeq&&c.rSeq.state==='armed'){const q=P(c.x,c.y,150);ctx.font='700 14px Oxanium, sans-serif';ctx.textAlign='center';ctx.fillStyle=G.t>=c.rSeq.readyAt?'#e6c2ff':'#9c7bb8';ctx.fillText(G.t>=c.rSeq.readyAt?'Press R to dash':'Winding up',q.x,q.y);}}
}
"""
rep("function groundEllipse(",axedraw+"function groundEllipse(")
rep("    drawGroundFx();drawUnitGround();","    drawGroundFx();drawUnitGround();drawAxeGround();")
rep("  drawSmears();screenT();for(const pr of G.projs)drawProj(pr,t);drawFx();drawStatus(t);","  drawSmears();drawAxeUpright(t);screenT();for(const pr of G.projs)drawProj(pr,t);drawFx();drawStatus(t);")
rep("    case'axe':","    case'axeQ':case'axeW':ctx.rotate(t*24);axeShape(p.kind==='axeQ');break;\n    case'axe':")
rep("    else if(f.k==='smoke')","    else if(f.k==='axefly'){const x=f.x0+(f.x1-f.x0)*k,y=f.y0+(f.y1-f.y0)*k,q=P(x,y,40+Math.sin(k*PI)*90);ctx.translate(q.x,q.y);ctx.scale(s,s);ctx.rotate(t*24);axeShape(f.key==='Q');}\n    else if(f.k==='smoke')")
# ---- HUD ----
rep("<span class=\"cost\"></span><div class=\"pips\">","<span class=\"cost\"></span><span class=\"chg\"></span><div class=\"pips\">")
rep("cost:d.querySelector('.cost'),pips:","cost:d.querySelector('.cost'),chg:d.querySelector('.chg'),pips:")
rep("    const rec=!!(a.canRecast&&a.canRecast(p)),st=`${r}|${cd>0?Math.ceil(cd*10):0}|${p.res<cost}|${canRank(p,k)}|${p.alive}|${rec}`;",
    "    const rec=!!(a.canRecast&&a.canRecast(p)),av=a.avail?a.avail(p):true,chg=a.charges?(p.chg[k]??a.charges):null,out=chg!==null?chg<=0:cd>0;\n    const st=`${r}|${cd>0?Math.ceil(cd*10):0}|${p.res<cost}|${canRank(p,k)}|${p.alive}|${rec}|${av}|${chg}`;")
rep("s.d.classList.toggle('nores',r>0&&p.res<cost);s.d.classList.toggle('ready',r>0&&cd<=0&&p.res>=cost);",
    "s.d.classList.toggle('nores',r>0&&!rec&&(p.res<cost||av!==true));s.d.classList.toggle('ready',r>0&&(rec||(av===true&&!out&&p.res>=cost)));")
rep("    s.cd.style.background=cd>0&&!rec?`conic-gradient(rgba(0,0,0,.72) ${cd/tot*360}deg, transparent 0)`:'none';",
    "    s.cd.style.background=cd>0&&!rec?`conic-gradient(rgba(0,0,0,${out?0.72:0.35}) ${cd/tot*360}deg, transparent 0)`:'none';")
rep("    s.cdt.textContent=rec?'':cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';","    s.cdt.textContent=rec||!out?'':cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';\n    s.chg.textContent=chg!==null&&r>0?chg:'';")
rep("$('resT').textContent=`${n0(p.res)} / ${n0(p.maxRes)}`;","$('resT').textContent=p.def.resource==='Corruption'?`Corruption ${n0(p.res)} · +${corrStage(p)*5}% dealt · +${corrStage(p)*3}% taken`:`${n0(p.res)} / ${n0(p.maxRes)}`;")
rep("$('resM').classList.toggle('fury',p.def.resource==='Fury');","$('resM').classList.toggle('fury',p.def.resource==='Fury');$('resM').classList.toggle('corrupt',p.def.resource==='Corruption');")
rep(".meter.res.fury i{background:linear-gradient(#ff9d5c,#c4451c)}",".meter.res.fury i{background:linear-gradient(#ff9d5c,#c4451c)}\n.meter.res.corrupt i{background:linear-gradient(#c084fc,#6d28d9)}\n.slot .chg{position:absolute;right:2px;top:2px;font:800 11px/1.3 var(--display);background:rgba(0,0,0,.72);padding:0 4px;border-radius:2px}\n.slot .chg:empty{display:none}")
rep("const resCol=c=>c.def.resource==='Energy'?'#f0cf48':","const resCol=c=>c.def.resource==='Corruption'?'#a855f7':c.def.resource==='Energy'?'#f0cf48':")
# ---- icons for the new Cora kit ----
i=s.index("  if(key==='cora'){\n    if(k==='Q'){g.save();g.translate(26,26);g.rotate(-0.7);");j=s.index("    if(k==='DASH'){g.strokeStyle=M;g.lineWidth=3;g.setLineDash([4,4]);")
s=s[:i]+"""  if(key==='cora'){
    const axe=(x,y,rot,col,edge)=>{g.save();g.translate(x,y);g.rotate(rot);g.strokeStyle='#6b4a2b';g.lineWidth=3.5;g.beginPath();g.moveTo(-14,0);g.lineTo(14,0);g.stroke();g.fillStyle=col;g.beginPath();g.moveTo(5,0);g.lineTo(10,-14);g.quadraticCurveTo(21,-7,18,6);g.lineTo(10,3);g.closePath();g.fill();g.strokeStyle=edge;g.lineWidth=2;g.beginPath();g.moveTo(10,-14);g.quadraticCurveTo(21,-7,18,6);g.stroke();g.restore();};
    if(k==='Q'){axe(28,22,-0.6,'#d8a050','#ffcf7a');g.strokeStyle='#ffb347';g.lineWidth=2;g.setLineDash([3,4]);g.beginPath();g.moveTo(6,46);g.quadraticCurveTo(10,28,22,26);g.stroke();g.setLineDash([]);g.strokeStyle='rgba(255,179,71,.7)';g.beginPath();g.ellipse(36,40,9,4,0,0,TAU);g.stroke();}
    if(k==='RMB'){g.strokeStyle='#7cc8ff';g.lineWidth=2;for(let i=0;i<3;i++){g.beginPath();g.moveTo(4,30+i*5);g.lineTo(22,24+i*3);g.stroke();}axe(34,22,-0.3,'#9fb6c8','#7cd0ff');}
    if(k==='E'){g.fillStyle='rgba(255,255,255,.2)';g.beginPath();g.ellipse(40,40,9,4,0,0,TAU);g.fill();axe(40,30,-1.3,'#d8a050','#ffcf7a');g.strokeStyle=L;g.lineWidth=3;g.beginPath();g.moveTo(6,40);g.lineTo(28,34);g.stroke();g.fillStyle=L;g.beginPath();g.moveTo(32,33);g.lineTo(24,29);g.lineTo(25,38);g.closePath();g.fill();}
    if(k==='R'){g.strokeStyle='#c27bff';g.lineWidth=3;g.setLineDash([4,3]);g.beginPath();g.moveTo(26,46);g.lineTo(12,14);g.lineTo(42,16);g.stroke();g.setLineDash([]);axe(12,14,-1.2,'#d8a050','#ffcf7a');axe(42,16,-1.9,'#9fb6c8','#7cd0ff');}
    if(k==='P'){const gr2=g.createRadialGradient(26,26,2,26,26,22);gr2.addColorStop(0,'#e9c2ff');gr2.addColorStop(1,'rgba(120,40,200,0)');g.fillStyle=gr2;g.fillRect(0,0,52,52);g.strokeStyle='#7a2bd6';g.lineWidth=2.5;for(const [a,b,c2,d2] of [[26,26,10,10],[26,26,44,14],[26,26,16,44],[26,26,40,42]]){g.beginPath();g.moveTo(a,b);g.quadraticCurveTo((a+c2)/2+5,(b+d2)/2-5,c2,d2);g.stroke();}}
"""+s[j:]
rep("if(key==='cora'){gr.addColorStop(0,'#8a3a22');gr.addColorStop(1,'#1f0e09');}","if(key==='cora'){gr.addColorStop(0,'#5a3a2a');gr.addColorStop(1,'#140c0a');}")
open(p,'w').write(s);print('ok')
