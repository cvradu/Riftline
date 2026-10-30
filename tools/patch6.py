SP='/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/'
p='/home/user/riftline/index.html';s=open(p).read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:100],s.count(old))
    s=s.replace(old,new)
# ---- definition + kit ----
rep("    blurb:'Mark targets with shurikens, blink in, slash through them, vanish into smoke and execute.',",
    "    blurb:'A dual-blade hunter. Marks prey with shurikens, slips through them, and punishes every ability hit with a crossing double strike.',\n    passive:{name:'Crosscut',desc:c=>`Hitting an enemy champion with an ability marks them for 3s. Your next basic attack against them strikes with both blades, consuming the mark for <span class=\"ph\">${n0(crossDmg(c))}</span> bonus physical damage (20 + 8 per level + 45% AD) and 30% decaying move speed for 1.5s. Each ability cast applies one mark per target.`},")
rep("    castKind:{Q:'throw',E:'swing',RMB:'roar',R:'swing'},","    castKind:{Q:'q',E:'e',RMB:'rmb',R:'r'},")
rep("desc:'Instantly blink up to 325 units toward the cursor. Does not break Smoke Veil.',","desc:'Instantly blink up to 325 units toward the cursor.',")
i=s.index("S1.Q={name:'Shadow Shuriken'");j=s.index("// ================= units =================")
s=s[:i]+open(SP+'kit.js').read()+"\n"+s[j:]
# ---- engine hooks ----
rep("total:len/speed,leap:!!o.leap,","total:len/speed,leap:!!o.leap,kind:o.kind,")
rep("  if(u.spin)ms*=1.2;\n","  if(u.spin)ms*=1.2;\n  if(u.msBuff&&u.msBuff.until>G.t)ms*=1+u.msBuff.pct*(u.msBuff.until-G.t)/1.5;\n")
rep("c.atk={start:G.t,W:wu,side:c.atkSide};","c.atk={start:G.t,W:wu,side:c.atkSide,cross:!!(target&&target.crosscut&&target.crosscut.src===c&&target.crosscut.until>G.t)};")
rep("  const onHit=t=>{dealDamage(c,t,dmg+extra,'phys',{crit,det:true});if(c.def.furyOnHit)c.res=Math.min(c.maxRes,c.res+c.def.furyOnHit);\n",
"""  const onHit=t=>{dealDamage(c,t,dmg+extra,'phys',{crit,det:true});if(c.def.furyOnHit)c.res=Math.min(c.maxRes,c.res+c.def.furyOnHit);
    if(t.crosscut&&t.crosscut.src===c&&t.crosscut.until>G.t){t.crosscut=null;dealDamage(c,t,crossDmg(c),'phys',{});c.msBuff={until:G.t+1.5,pct:0.3};if(c.atk)c.atk.cross=true;
      slash(t.x,t.y,c.facing+PI*0.25,'#ff4d61');slash(t.x,t.y,c.facing-PI*0.25,'#ff4d61');if(c===G.player||t===G.player)popText(t.x,t.y,'Crosscut','#ff6b7a',14,140);}
""")
rep("    G.fx.push({k:'smear',x:c.x,y:c.y,z:48,","    if(!(c.key==='shade'&&SHEETS_READY))G.fx.push({k:'smear',x:c.x,y:c.y,z:48,")
rep("  if(r<1)return'unlearned';\n","  if(r<1)return'unlearned';\n  if(a.canRecast&&a.canRecast(c)){if(c.stunT>0)return'stunned';if(c.cast||c.dash)return'busy';c.wind=null;a.recast(c,ax,ay);return'ok';}\n")
rep("if(t.execBy&&t.execBy.until>G.t){t.execBy.src.cds.R=0;popText(t.execBy.src.x,t.execBy.src.y,'Execution reset','#d9c2ff',16,140);}",
    "if(t.execBy&&t.execBy.until>G.t){const sx=t.execBy.src;sx.cds.E=0;sx.eRecast=null;popText(sx.x,sx.y,'Slip Through refreshed','#ff9aa6',15,140);}")
rep("t.stunT=0;t.shadeMark=null;","t.stunT=0;t.shadeMark=null;t.crosscut=null;t.eRecast=null;t.msBuff=null;")
# ---- bot ----
rep("  const can=k=>{const r=c.ranks[k];return r&&c.cds[k]<=0&&c.res>=A[k].cost[r-1]&&!c.cast&&!c.dash&&c.stunT<=0;};",
    "  const can=k=>{const r=c.ranks[k];if(!r||c.cast||c.dash||c.stunT>0)return false;if(A[k].canRecast&&A[k].canRecast(c))return true;return c.cds[k]<=0&&c.res>=A[k].cost[r-1];};")
rep("  const throwQ=()=>{if(!vis)return false;const sp=aria?1600:1750,rg=aria?880:900;if(d>rg)return false;const p=predict(c,foe,sp,aria?0.2:0.12);return cast('Q',p.x,p.y);};\n  const closeIn=()=>{if(d>reach+70&&d<(aria?400:350))dashTo(foe.x,foe.y);};",
    "  const throwQ=()=>{if(!vis)return false;const k=aria?'Q':'RMB',sp=aria?1600:1800,rg=aria?880:820;if(d>rg)return false;const p=predict(c,foe,sp,0.2);return cast(k,p.x,p.y);};\n  const closeIn=()=>{if(!aria){const er=(shadeQuarry(c)===foe?550:300)+c.r;if(d>reach+40&&d<er&&cast('E',foe.x,foe.y))return;}if(d>reach+70&&d<(aria?400:350))dashTo(foe.x,foe.y);};")
rep("    else{if(d<c.r+foe.r+280)cast('E',0,0);}","    else{if(d>reach-30&&d<330+foe.r)cast('Q',foe.x,foe.y);}")
rep("      if(!(!aria&&cast('RMB',0,0))){const a=away(350);dashTo(a.x,a.y);}","      if(!aria){const a=away(300);if(!cast('E',a.x,a.y)){const b=away(350);dashTo(b.x,b.y);}}else{const a=away(350);dashTo(a.x,a.y);}")
rep("    else{if(c.ranks.R&&edge(c,foe)<=650)cast('R',0,0);if(d>500&&c.dashCd>0)cast('RMB',0,0);}",
    "    else{if(c.ranks.R&&edge(c,foe)<=500)cast('R',0,0);if(A.E.canRecast(c)&&hpP<0.35){const a=away(220);cast('E',a.x,a.y);}}")
rep("      const marked=foe.shadeMark&&foe.shadeMark.until>G.t;","      const marked=foe.crosscut&&foe.crosscut.src===c&&foe.crosscut.until>G.t;")
rep("  if(c.spin){atk=null;","  if(!aria&&vis&&mode!=='retreat'&&foe.crosscut&&foe.crosscut.src===c&&foe.crosscut.until>G.t&&edge(c,foe)<=c.range+80){atk=foe;goal={x:foe.x,y:foe.y};}\n  if(c.spin){atk=null;")
i=s.index("  else{let r;if(r=has('Q'))d+=A.Q.dmg(c,r)*0.9+A.Q.mark(c,r);");j=s.index("\n",i)
s=s[:i]+"  else{let r;if(r=has('Q'))d+=A.Q.dmg(c,r)*1.2;if(r=has('RMB'))d+=A.RMB.dmg(c,r)*1.3;if(r=has('E'))d+=A.E.dmg(c,r);if(r=has('R'))d+=A.R.cut(c,r)*2+A.R.miss(r)*(f.maxHp-f.hp+A.R.cut(c,r));d+=crossDmg(c)+c.ad*2.5;}"+s[j:]
# ---- sprites ----
rep("function drawAny(s,x,y,alpha,flash){blit(s,x,y,alpha,flash);}","function drawAny(s,x,y,alpha,flash){if(s.sheet)drawSheet(s,x,y,alpha,flash);else blit(s,x,y,alpha,flash);}")
rep("function champSprite(u,pose){\n  pose=pose||champPose(u);","function champSprite(u,pose){\n  if(u.key==='shade'&&SHEETS_READY)return shadeFrame(u);\n  pose=pose||champPose(u);")
rep("function footShadow(",open(SP+'sheets.js').read()+"function footShadow(")
rep("function queueBakes(){BAKEQ.length=0;for(const u of G.champs){if(u.key!=='shade')continue;","function queueBakes(){BAKEQ.length=0;for(const u of G.champs){if(u.key!=='shade'||SHEETS_READY)continue;")
rep("  if(key==='shade'){const k=S*0.92/105,","  if(key==='shade'&&SHEETS_READY){const S2=SHEETS.auto,f=S*0.92/S2.h;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';\n    g.drawImage(S2.img,0,0,S2.cw,S2.ch,S/2-S2.ax*f,S*0.97-S2.ay*f,S2.cw*f,S2.ch*f);return;}\n  if(key==='shade'){const k=S*0.92/105,")
rep("gr.addColorStop(0,key==='aria'?'#5a2a1c':'#2e2340')","gr.addColorStop(0,key==='aria'?'#5a2a1c':'#3a1820')")
# ---- markers ----
rep("    if(m.shadeMark&&m.shadeMark.until>G.t)markIcon(q.x,q.y-12,7);}","}")
rep("    if(c.shadeMark&&c.shadeMark.until>G.t)markIcon(q.x,y-16,10);","    if(c.crosscut&&c.crosscut.until>G.t)crossIcon(q.x,y-20);\n    if(G.champs.some(o=>shadeQuarry(o)===c))quarryIcon(q.x+66,y+6);")
rep("function markIcon(","function crossIcon(x,y){ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(8,8);ctx.moveTo(8,-8);ctx.lineTo(-8,8);ctx.stroke();ctx.strokeStyle='#ff4d61';ctx.lineWidth=3;ctx.stroke();ctx.restore();}\nfunction quarryIcon(x,y){ctx.save();ctx.translate(x,y);ctx.rotate(G.t*2);ctx.strokeStyle='#ff4d61';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.moveTo(-12,0);ctx.lineTo(-4,0);ctx.moveTo(12,0);ctx.lineTo(4,0);ctx.moveTo(0,-12);ctx.lineTo(0,-4);ctx.moveTo(0,12);ctx.lineTo(0,4);ctx.stroke();ctx.restore();}\nfunction markIcon(")
rep("    if(G.hover){const h=G.hover;groundEllipse(h.x,h.y,h.r+10,'rgba(255,90,80,.95)',6);}",
"""    if(G.hover){const h=G.hover;groundEllipse(h.x,h.y,h.r+10,'rgba(255,90,80,.95)',6);}
    for(const c of G.champs){if(!c.alive)continue;
      // Scissor Blades telegraph: the cone and the crossing point
      if(c.cast&&c.castAnim&&c.castAnim.kind==='q'&&(c.team===p.team||targetable(c))){const a=c.cast.ang;ctx.fillStyle='rgba(255,90,110,.12)';ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.arc(c.x,c.y,340,a-0.75,a+0.75);ctx.closePath();ctx.fill();
        groundEllipse(c.x+Math.cos(a)*255,c.y+Math.sin(a)*255,75,'rgba(255,107,122,.85)',5);}
      const q=shadeQuarry(c);if(q)groundEllipse(q.x,q.y,q.r+22+Math.sin(G.t*8)*4,'rgba(255,77,97,.8)',5,[16,10]);}""")
# ---- HUD ----
rep("  const p=G.player,el=$('slots');el.innerHTML='';\n","""  const p=G.player,el=$('slots');el.innerHTML='';
  if(p.def.passive){const d=document.createElement('div');d.className='slot pslot';d.innerHTML='<canvas width="84" height="84"></canvas><span class="key">P</span>';
    drawIcon(d.querySelector('canvas').getContext('2d'),p.key,'P');d.addEventListener('mouseenter',()=>showTip('P',d));d.addEventListener('mouseleave',()=>{$('tip').hidden=true;tipK=null;});el.appendChild(d);}
""")
rep("  if(tipK==='DASH')tip.innerHTML=`<h4>${p.def.dash.name}</h4><div class=\"meta\">Space · ${DASH_CD}s cooldown, not reduced by ability haste</div>${p.def.dash.desc}`;\n",
    "  if(tipK==='DASH')tip.innerHTML=`<h4>${p.def.dash.name}</h4><div class=\"meta\">Space · ${DASH_CD}s cooldown, not reduced by ability haste</div>${p.def.dash.desc}`;\n  else if(tipK==='P')tip.innerHTML=`<h4>${p.def.passive.name}</h4><div class=\"meta\">Passive</div>${p.def.passive.desc(p)}`;\n")
rep("    const st=`${r}|${cd>0?Math.ceil(cd*10):0}|${p.res<cost}|${canRank(p,k)}|${p.alive}`;","    const rec=!!(a.canRecast&&a.canRecast(p)),st=`${r}|${cd>0?Math.ceil(cd*10):0}|${p.res<cost}|${canRank(p,k)}|${p.alive}|${rec}`;")
rep("    s.cd.style.background=cd>0?`conic-gradient(rgba(0,0,0,.72) ${cd/tot*360}deg, transparent 0)`:'none';\n    s.cdt.textContent=cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';",
    "    s.d.classList.toggle('recast',rec);\n    s.cd.style.background=cd>0&&!rec?`conic-gradient(rgba(0,0,0,.72) ${cd/tot*360}deg, transparent 0)`:'none';\n    s.cdt.textContent=rec?'':cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';")
rep(".slot.dashslot{margin-left:6px}",".slot.dashslot{margin-left:6px}\n.slot.pslot{width:42px;height:42px;align-self:center;margin-right:2px}\n.slot.pslot canvas{width:40px;height:40px}\n.slot.recast{border-color:#ff8a96;box-shadow:0 0 12px rgba(255,90,110,.85)}")
rep("<ul>${ABK.map(k=>`<li><kbd>${k}</kbd><span>${d.ab[k].name}</span></li>`).join('')}","<ul>${d.passive?`<li><kbd>P</kbd><span>${d.passive.name} (passive)</span></li>`:''}${ABK.map(k=>`<li><kbd>${k}</kbd><span>${d.ab[k].name}</span></li>`).join('')}")
# ---- icons ----
i=s.index("  }else{\n    if(k==='Q'){g.fillStyle=L;g.beginPath();for(let i=0;i<8;i++)");j=s.index("\n  }\n}\nfunction drawPortrait")
s=s[:i]+"""  }else{
    const star=(x,y,r)=>{g.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU+0.3,rr=i%2?r*0.35:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();g.fill();};
    if(k==='Q'){g.strokeStyle=L;g.lineWidth=4;g.beginPath();g.arc(8,40,30,-1.25,-0.15);g.stroke();g.beginPath();g.arc(44,40,30,PI+0.15,PI+1.25);g.stroke();g.fillStyle='#ff4d61';star(26,16,8);}
    if(k==='RMB'){g.strokeStyle=M;g.lineWidth=1.5;for(const [x,y] of [[16,22],[28,14],[38,26]]){g.beginPath();g.moveTo(x-12,y+12);g.lineTo(x-3,y+3);g.stroke();}g.fillStyle=L;for(const [x,y] of [[16,22],[28,14],[38,26]])star(x,y,7);g.fillStyle='#ff4d61';g.beginPath();g.arc(40,40,3,0,TAU);g.fill();}
    if(k==='E'){g.fillStyle=M;g.globalAlpha=0.6;g.beginPath();g.arc(26,26,9,0,TAU);g.fill();g.globalAlpha=1;g.strokeStyle=L;g.lineWidth=3;g.beginPath();g.moveTo(6,42);g.lineTo(44,12);g.stroke();g.fillStyle=L;g.beginPath();g.moveTo(47,10);g.lineTo(36,13);g.lineTo(44,21);g.closePath();g.fill();}
    if(k==='DASH'){g.fillStyle=M;g.globalAlpha=0.35;g.beginPath();g.arc(14,30,9,0,TAU);g.fill();g.globalAlpha=0.6;g.beginPath();g.arc(24,26,9,0,TAU);g.fill();g.globalAlpha=1;g.fillStyle=L;g.beginPath();g.arc(38,22,9,0,TAU);g.fill();for(let i=0;i<5;i++){g.fillRect(30+i*4,36-i*3,2,2);}}
    if(k==='R'){g.lineCap='round';g.strokeStyle='#ff4d61';g.lineWidth=8;g.beginPath();g.moveTo(10,10);g.lineTo(42,42);g.moveTo(42,10);g.lineTo(10,42);g.stroke();g.strokeStyle='#fff3f4';g.lineWidth=3;g.stroke();}
    if(k==='P'){g.strokeStyle=L;g.lineWidth=3.5;g.beginPath();g.arc(4,44,32,-1.2,-0.25);g.stroke();g.beginPath();g.arc(48,44,32,PI+0.25,PI+1.2);g.stroke();g.strokeStyle='#ff4d61';g.lineWidth=3;g.beginPath();g.moveTo(20,30);g.lineTo(32,42);g.moveTo(32,30);g.lineTo(20,42);g.stroke();}"""+s[j:]
rep("if(key==='aria'){gr.addColorStop(0,'#8a3a22');gr.addColorStop(1,'#1f0e09');}else{gr.addColorStop(0,'#4a3768');gr.addColorStop(1,'#120c1a');}",
    "if(key==='aria'){gr.addColorStop(0,'#8a3a22');gr.addColorStop(1,'#1f0e09');}else{gr.addColorStop(0,'#5a1f2b');gr.addColorStop(1,'#14080b');}")
rep("const L=key==='aria'?'#ffe2c4':'#e6d9ff',M=key==='aria'?'#ff9a52':'#b48cff';","const L=key==='aria'?'#ffe2c4':'#ffe6ea',M=key==='aria'?'#ff9a52':'#ff6b7a';")
open(p,'w').write(s);print('ok')
