import re
p='/home/user/riftline/index.html';s=open(p).read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:80],s.count(old))
    s=s.replace(old,new)
def between(a,b,new):
    global s
    i=s.index(a);j=s.index(b,i)
    s=s[:i]+new+s[j:]

# ---------- Aria definition ----------
between("  aria:{key:'aria'","  shade:{key:'shade'","""  aria:{key:'aria',name:'Aria',role:'Barbarian',reach:'Melee',resource:'Fury',r:32,ranged:false,
    blurb:'A dual-axe brawler. Builds Fury with every swing, heals off Cleave and spins through fights with Whirlwind.',
    base:{hp:640,hpG:109,hp5:8,hp5G:0.8,res:100,resG:0,rg5:10,rg5G:0,ad:66,adG:3.6,as:0.75,asG:3,armor:35,armorG:4.5,mr:32,mrG:2.05,ms:345,range:150,windup:0.25,proj:0},
    furyOnHit:8,
    dash:{name:'Leap',desc:'Leap up to 375 units toward the cursor. Enemies within 175 units of where you land are slowed by 25% for 1s.',
      cast(c,ax,ay){const ang=angTo(c,ax,ay),len=clamp(hyp(ax-c.x,ay-c.y),120,375);
        dash(c,ang,len,1100,{leap:true,onEnd:()=>{for(const u of enemiesOf(c.team))if(u.kind!=='tower'&&hittable(u)&&dist(c,u)<175+u.r)slow(u,0.25,1);ring(c.x,c.y,10,175,'#e8a25a',0.4);spark(c.x,c.y,'#c9b9a0',10);}});return true;}},
    ab:{}},
""")
rep("    blurb:'Mark targets with shurikens, dash through them, vanish into smoke and execute.',",
    "    blurb:'Mark targets with shurikens, blink in, slash through them, vanish into smoke and execute.',")
rep("""range:125,windup:0.25,proj:0},
    ab:{}}""","""range:125,windup:0.25,proj:0},
    dash:{name:'Shadow Step',desc:'Instantly blink up to 325 units toward the cursor. Does not break Smoke Veil.',
      cast(c,ax,ay){const ang=angTo(c,ax,ay),len=Math.min(325,hyp(ax-c.x,ay-c.y));ghost(c);spark(c.x,c.y,'#b48cff',8);
        c.x+=Math.cos(ang)*len;c.y+=Math.sin(ang)*len;clampUnit(c);c.facing=ang;ghost(c);spark(c.x,c.y,'#b48cff',8);return true;}},
    ab:{}}""")

# ---------- Aria abilities ----------
between("A1.Q={","S1.Q={","""A1.Q={name:'Axe Throw',max:5,cd:[9,8.5,8,7.5,7],cost:[20,20,20,20,20],range:900,
  dmg:(c,r)=>[60,95,130,165,200][r-1]+1.0*c.ad,
  desc:(c,r,a)=>`Hurl an axe 900 units. The first enemy hit takes <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (60/95/130/165/200 + 100% AD) and is slowed by 30% for 1.5s.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.2,ang,()=>{
    shoot(c,{ang,speed:1600,range:900,radius:32,pierce:false,kind:'axe',onHit:t=>{dealDamage(c,t,a.dmg(c,r),'phys',{});slow(t,0.3,1.5);spark(t.x,t.y,'#e0e6ea',8);}});});return true;}};
A1.E={name:'War Cry',max:5,cd:[14,13,12,11,10],cost:[30,30,30,30,30],range:400,
  as:r=>[30,40,50,60,70][r-1],
  desc:(c,r,a)=>`Roar to gain ${a.as(r)}% attack speed for 4s. Enemy champions within 400 units are slowed by 30% for 1.5s.`,
  cast(c,ax,ay,r,a){c.asBuff={until:G.t+4,pct:a.as(r)/100};for(const u of G.champs)if(u.team!==c.team&&hittable(u)&&dist(c,u)<400+u.r)slow(u,0.3,1.5);
    ring(c.x,c.y,20,400,'#ff9a52',0.5);ring(c.x,c.y,10,300,'#ffcf8a',0.35);return true;}};
A1.RMB={name:'Cleave',max:5,cd:[9,8,7,6,5],cost:[25,25,25,25,25],range:330,
  dmg:(c,r)=>[50,80,110,140,170][r-1]+1.0*c.ad,
  desc:(c,r,a)=>`After 0.2s, swing both axes in a wide arc in front of you (330 range), dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (50/80/110/140/170 + 100% AD) to every enemy hit. Heal for 30% of the damage dealt to champions and 10% of the damage dealt to minions.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.2,ang,()=>{let heal=0;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u))continue;if(dist(c,u)>330+u.r||angDiff(angTo(c,u.x,u.y),ang)>1.1)continue;
      const done=dealDamage(c,u,a.dmg(c,r),'phys',{});heal+=done*(u.kind==='champ'?0.3:0.1);}
    if(heal>0&&c.alive){c.hp=Math.min(c.maxHp,c.hp+heal);if(c===G.player)popText(c.x,c.y,'+'+n0(heal),'#5fe08b',15,120);}
    for(const o of [-0.6,0,0.6])slash(c.x+Math.cos(ang+o)*150,c.y+Math.sin(ang+o)*150,ang+o+PI/2,'#ffd2a0');});return true;}};
A1.R={name:'Whirlwind',max:3,cd:[100,85,70],cost:[0,0,0],range:260,
  tick:(c,r)=>[20,35,50][r-1]+0.25*c.ad,
  desc:(c,r,a)=>`Spin for 3s, hitting every enemy within 260 units 12 times for <span class="ph">${n0(a.tick(c,r))}</span> physical damage per hit (20/35/50 + 25% AD), <span class="ph">${n0(a.tick(c,r)*12)}</span> in total. You move 20% faster and can cast abilities, but cannot auto attack while spinning.`,
  cast(c,ax,ay,r,a){c.spin={until:G.t+3,next:G.t,dmg:a.tick(c,r)};return true;}};

""")
rep("Your next attack, Shadow Dash or Execution on them","Your next attack, Shadow Slash or Execution on them")
between("S1.E={","S1.RMB={","""S1.E={name:'Shadow Slash',max:5,cd:[9,8.5,8,7.5,7],cost:[40,40,40,40,40],range:290,
  dmg:(c,r)=>[60,90,120,150,180][r-1]+0.7*c.ad,
  desc:(c,r,a)=>`Spin your blades, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (60/90/120/150/180 + 70% AD) to every enemy within 290 units and detonating Shadow Shuriken marks. Champions hit are slowed by 30% for 1.5s, and hitting a champion refunds 25 energy.`,
  cast(c,ax,ay,r,a){let champ=false;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>290+u.r)continue;dealDamage(c,u,a.dmg(c,r),'phys',{det:true});if(u.kind==='champ'){champ=true;slow(u,0.3,1.5);}}
    if(champ)c.res=Math.min(c.maxRes,c.res+25);
    ring(c.x,c.y,30,290,'#b48cff',0.3);for(let i=0;i<6;i++){const an=i/6*TAU;slash(c.x+Math.cos(an)*170,c.y+Math.sin(an)*170,an+PI/2,'#d9c2ff');}return true;}};
""")

# ---------- champion state ----------
rep("stunT:0,slows:[],stealthT:0,stealthMs:0,stealthBonus:0,untargetT:0,empower:null,",
    "stunT:0,slows:[],stealthT:0,stealthMs:0,stealthBonus:0,untargetT:0,empower:null,dashCd:0,spin:null,asBuff:null,")
rep("function dash(c,ang,len,speed,o){o=o||{};c.dash={vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,t:len/speed,",
    "function dash(c,ang,len,speed,o){o=o||{};c.dash={vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,t:len/speed,total:len/speed,leap:!!o.leap,")
rep("  if(s>0){} ","",0) if False else None
# effective attack speed with War Cry
rep("function startAttack(c,target){","const asOf=c=>Math.min(2.5,c.as*(1+(c.asBuff&&c.asBuff.until>G.t?c.asBuff.pct:0)));\nfunction startAttack(c,target){")
rep("  const at=1/c.as,wu=at*c.def.base.windup;","  const at=1/asOf(c),wu=at*c.def.base.windup;")
rep("c.atkCd=Math.max(0,1/c.as-w.total);","c.atkCd=Math.max(0,1/asOf(c)-w.total);")
rep("const onHit=t=>{dealDamage(c,t,dmg+extra,'phys',{crit,det:true});};",
    "const onHit=t=>{dealDamage(c,t,dmg+extra,'phys',{crit,det:true});if(c.def.furyOnHit)c.res=Math.min(c.maxRes,c.res+c.def.furyOnHit);};")
rep("  if(ms>490)","  if(u.spin)ms*=1.2;\n  if(ms>490)")
# dash on space
rep("function tryCast(c,k,ax,ay){","""const DASH_CD=5; // flat: ability haste does not apply
function tryDash(c,ax,ay){
  if(!c.alive)return'dead';if(c.dashCd>0)return'dashcd';if(c.stunT>0)return'stunned';if(c.cast||c.dash)return'busy';
  c.wind=null;if(!c.def.dash.cast(c,ax,ay))return'notarget';c.dashCd=DASH_CD;return'ok';
}
function tryCast(c,k,ax,ay){""")
rep("  for(const k of ABK)c.cds[k]=Math.max(0,c.cds[k]-dt);\n",
"""  for(const k of ABK)c.cds[k]=Math.max(0,c.cds[k]-dt);
  c.dashCd=Math.max(0,c.dashCd-dt);
  if(c.spin){if(G.t>=c.spin.until)c.spin=null;else if(G.t>=c.spin.next){c.spin.next+=0.25;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>260+u.r)continue;dealDamage(c,u,c.spin.dmg,'phys',{});}
    ring(c.x,c.y,60,260,'rgba(255,190,130,.7)',0.25);if(!c.alive)return;}}
""")
rep("if(inp.attack&&c.atkCd<=0){startAttack","if(inp.attack&&c.atkCd<=0&&!c.spin){startAttack")
rep("t.deaths++;t.respawnT=6+t.level;t.wind=t.cast=t.dash=null;","t.deaths++;t.respawnT=6+t.level;t.wind=t.cast=t.dash=null;t.spin=null;t.asBuff=null;")
rep("c.empower=null;c.retreat=false;}","c.empower=null;c.retreat=false;c.spin=null;c.asBuff=null;c.dashCd=0;}")

# ---------- input ----------
rep("  if(G.paused||G.over)return;\n  const map={KeyQ:'Q',KeyE:'E',KeyR:'R'};",
    "  if(G.paused||G.over)return;\n  if(e.code==='Space'){e.preventDefault();if(!e.repeat)pending={k:'SPACE',until:G.t+0.35};return;}\n  const map={KeyQ:'Q',KeyE:'E',KeyR:'R'};")
rep("  let w=screenToWorld(mouse.x,mouse.y);\n","  let w=screenToWorld(mouse.x,mouse.y);const gw=w;\n")
rep("if(pending){const r=tryCast(c,pending.k,w.x,w.y);","if(pending){const r=pending.k==='SPACE'?tryDash(c,gw.x,gw.y):tryCast(c,pending.k,w.x,w.y);")
rep("cooldown:()=>'Ability on cooldown',","cooldown:()=>'Ability on cooldown',dashcd:()=>'Dash on cooldown',")

# ---------- bot ----------
rep("const danger=p.kind==='arrowR'?3:p.kind==='arrowQ'||p.kind==='shuriken'?2:1;","const danger=p.kind==='axe'||p.kind==='shuriken'?2:1;")
rep("if(c.key==='aria'){let r;if(r=has('Q'))d+=A.Q.dmg(c,r);if(r=has('RMB'))d+=A.RMB.dmg(c,r);if(r=has('R'))d+=A.R.dmg(c,r);if(r=has('E'))d+=A.E.bonus(c,r);d+=c.ad*3;}",
    "if(c.key==='aria'){let r;if(r=has('Q'))d+=A.Q.dmg(c,r);if(r=has('RMB'))d+=A.RMB.dmg(c,r);if(r=has('R'))d+=A.R.tick(c,r)*8;d+=c.ad*(has('E')?4:3);}")
i=s.index("function botThink(c,dt){");j=s.index("// ================= input =================")
s=s[:i]+open('/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/bot.js').read()+"\n"+s[j:]

# ---------- drawing ----------
i=s.index("  if(key==='aria'){\n    const pull=wind*12");j=s.index("  }else{\n    const blades=()=>")
s=s[:i]+open('/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/barb.js').read()+s[j:]
rep("  drawHero(ctx,u.key,u.team,projAng(u.facing),wind,t,hyp(u.vx,u.vy)>30);",
    "  const lz=u.dash&&u.dash.leap?Math.sin((1-u.dash.t/u.dash.total)*PI)*90:0;ctx.translate(0,-lz);\n  if(u.spin)wind=0.5;\n  drawHero(ctx,u.key,u.team,u.spin?t*18:projAng(u.facing),wind,t,hyp(u.vx,u.vy)>30);")
rep("    case'shuriken':","    case'axe':ctx.rotate(t*22);ctx.strokeStyle='#6b4a2b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(16,0);ctx.stroke();ctx.fillStyle='#d4dbe1';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(14,-16);ctx.quadraticCurveTo(26,-8,22,6);ctx.lineTo(14,3);ctx.closePath();ctx.fill();break;\n    case'shuriken':")
rep("bar(x,y+13,w,4,c.res/c.maxRes,c.def.resource==='Energy'?'#f0cf48':'#4a90ff');","bar(x,y+13,w,4,c.res/c.maxRes,resCol(c));")
rep("function bar(x,y,w,h,p,col,bg){","const resCol=c=>c.def.resource==='Energy'?'#f0cf48':c.def.resource==='Fury'?'#ff8a4c':'#4a90ff';\nfunction bar(x,y,w,h,p,col,bg){")

# ---------- icons ----------
i=s.index("  if(key==='aria'){\n    if(k==='Q'){g.strokeStyle=M;g.lineWidth=7");j=s.index("  }else{\n    if(k==='Q'){g.fillStyle=L;g.beginPath();for(let i=0;i<8;i++)")
s=s[:i]+"""  if(key==='aria'){
    if(k==='Q'){g.save();g.translate(26,26);g.rotate(-0.7);g.strokeStyle='#8a5a32';g.lineWidth=4;g.beginPath();g.moveTo(-18,0);g.lineTo(16,0);g.stroke();g.fillStyle=L;g.beginPath();g.moveTo(6,0);g.lineTo(12,-17);g.quadraticCurveTo(24,-8,20,7);g.lineTo(12,3);g.closePath();g.fill();g.restore();g.strokeStyle=M;g.lineWidth=2;g.globalAlpha=0.6;g.beginPath();g.arc(26,26,20,2.2,3.6);g.stroke();g.globalAlpha=1;}
    if(k==='E'){g.fillStyle=L;g.beginPath();g.arc(13,26,6,0,TAU);g.fill();g.strokeStyle=M;g.lineWidth=3;for(let i=0;i<3;i++){g.globalAlpha=1-i*0.25;g.beginPath();g.arc(13,26,12+i*9,-0.8,0.8);g.stroke();}g.globalAlpha=1;}
    if(k==='RMB'){g.strokeStyle=M;g.lineWidth=8;g.globalAlpha=0.45;g.beginPath();g.arc(16,30,24,-1.3,1.0);g.stroke();g.globalAlpha=1;g.strokeStyle=L;g.lineWidth=3;g.beginPath();g.arc(16,30,24,-1.3,1.0);g.stroke();}
    if(k==='R'){g.strokeStyle=L;g.lineWidth=3;g.beginPath();for(let i=0;i<60;i++){const a=i*0.22,r=2+i*0.33;g.lineTo(26+Math.cos(a)*r,26+Math.sin(a)*r);}g.stroke();g.fillStyle=M;for(let i=0;i<3;i++){const a=i/3*TAU;g.beginPath();g.arc(26+Math.cos(a)*19,26+Math.sin(a)*19,3.5,0,TAU);g.fill();}}
    if(k==='DASH'){g.strokeStyle=M;g.lineWidth=3;g.setLineDash([4,4]);g.beginPath();g.moveTo(8,42);g.quadraticCurveTo(26,0,44,40);g.stroke();g.setLineDash([]);g.fillStyle=L;g.beginPath();g.moveTo(46,44);g.lineTo(36,38);g.lineTo(46,32);g.closePath();g.fill();g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(44,46,8,3,0,0,TAU);g.fill();}
"""+s[j:]
rep("    if(k==='R'){g.strokeStyle=L;g.lineWidth=4;g.beginPath();g.moveTo(12,12);g.lineTo(40,40);",
    "    if(k==='DASH'){g.fillStyle=M;g.globalAlpha=0.35;g.beginPath();g.arc(14,30,9,0,TAU);g.fill();g.globalAlpha=0.6;g.beginPath();g.arc(24,26,9,0,TAU);g.fill();g.globalAlpha=1;g.fillStyle=L;g.beginPath();g.arc(38,22,9,0,TAU);g.fill();for(let i=0;i<5;i++){g.fillRect(30+i*4,36-i*3,2,2);}}\n    if(k==='R'){g.strokeStyle=L;g.lineWidth=4;g.beginPath();g.moveTo(12,12);g.lineTo(40,40);")
rep("if(key==='aria'){gr.addColorStop(0,'#2f7f95');gr.addColorStop(1,'#0c2229');}","if(key==='aria'){gr.addColorStop(0,'#8a3a22');gr.addColorStop(1,'#1f0e09');}")
rep("const L=key==='aria'?'#d9f6ff':'#e6d9ff',M=key==='aria'?'#7fd6ee':'#b48cff';","const L=key==='aria'?'#ffe2c4':'#e6d9ff',M=key==='aria'?'#ff9a52':'#b48cff';")
rep("gr.addColorStop(0,key==='aria'?'#24505c':'#2e2340')","gr.addColorStop(0,key==='aria'?'#5a2a1c':'#2e2340')")

# ---------- HUD ----------
rep("""  drawPortrait($('portC'),p.key,p.team);
  $('resM').classList.toggle('energy',p.def.resource==='Energy');""","""  {const d=document.createElement('div');d.className='slot dashslot';
    d.innerHTML=`<canvas width="108" height="108"></canvas><div class="cd"></div><span class="cdt"></span><span class="key">SPACE</span>`;
    drawIcon(d.querySelector('canvas').getContext('2d'),p.key,'DASH');
    d.addEventListener('mouseenter',()=>showTip('DASH',d));d.addEventListener('mouseleave',()=>{$('tip').hidden=true;tipK=null;});
    el.appendChild(d);slotEls.DASH={d,cd:d.querySelector('.cd'),cdt:d.querySelector('.cdt'),last:''};}
  drawPortrait($('portC'),p.key,p.team);
  $('resM').classList.toggle('energy',p.def.resource==='Energy');$('resM').classList.toggle('fury',p.def.resource==='Fury');""")
rep("""  if(!tipK)return;const p=G.player,a=p.def.ab[tipK],r=p.ranks[tipK],rr=Math.max(1,r);const tip=$('tip');
  tip.innerHTML=""","""  if(!tipK)return;const p=G.player,tip=$('tip');
  if(tipK==='DASH')tip.innerHTML=`<h4>${p.def.dash.name}</h4><div class="meta">Space · ${DASH_CD}s cooldown, not reduced by ability haste</div>${p.def.dash.desc}`;
  else{const a=p.def.ab[tipK],r=p.ranks[tipK],rr=Math.max(1,r);
  tip.innerHTML=""")
rep("""Showing rank 1 values.</div>':''}`;
  tip.hidden=false;""","""Showing rank 1 values.</div>':''}`;}
  tip.hidden=false;""")
rep("""    s.up.hidden=!canRank(p,k);}
""","""    s.up.hidden=!canRank(p,k);}
  {const s=slotEls.DASH,cd=p.dashCd,st=`${cd>0?Math.ceil(cd*10):0}|${p.alive}`;
    if(s&&st!==s.last){s.last=st;s.d.classList.toggle('ready',cd<=0);s.cd.style.background=cd>0?`conic-gradient(rgba(0,0,0,.72) ${cd/DASH_CD*360}deg, transparent 0)`:'none';s.cdt.textContent=cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';}}
""")
rep("s.cost.style.color=p.def.resource==='Energy'?'#f0cf48':'#7fb0ff';","s.cost.style.color=resCol(p);")
rep("['Atk speed',p.as.toFixed(3)]","['Atk speed',asOf(p).toFixed(3)]")
rep(".meter.res.energy i{background:linear-gradient(#ffe27a,#c9a21c)}",".meter.res.energy i{background:linear-gradient(#ffe27a,#c9a21c)}\n.meter.res.fury i{background:linear-gradient(#ff9d5c,#c4451c)}\n.slot.dashslot{margin-left:6px}")
rep(".card kbd{flex:none;min-width:34px;",".card kbd{flex:none;min-width:48px;")
rep("<ul>${ABK.map(k=>`<li><kbd>${k}</kbd><span>${d.ab[k].name}</span></li>`).join('')}</ul>","<ul>${ABK.map(k=>`<li><kbd>${k}</kbd><span>${d.ab[k].name}</span></li>`).join('')}<li><kbd>SPACE</kbd><span>${d.dash.name}</span></li></ul>")
rep("<b>Q E RMB R</b> abilities<br>","<b>Q E RMB R</b> abilities · <b>Space</b> dash<br>")
rep("<div><b>Right click</b>Fourth ability</div>","<div><b>Right click</b>Fourth ability</div>\n        <div><b>Space</b>Dash (5s cooldown)</div>")
rep("Otherwise the attack fires toward your cursor and hits the first enemy in its path.","Otherwise you swing toward your cursor and hit the nearest enemy in front of you.")
open(p,'w').write(s)
print('patched')
