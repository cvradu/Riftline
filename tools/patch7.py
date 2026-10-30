SP='/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/'
p='/home/user/riftline/index.html';s=open(p).read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:110],s.count(old))
    s=s.replace(old,new)
# ---- definition ----
rep("role:'Barbarian',reach:'Melee',resource:'Fury',r:32,","role:'Skirmisher',reach:'Melee',resource:'Corruption',r:32,")
i=s.index("    blurb:'A barbarian with a fire axe and a frost axe.");j=s.index("\n",i)
s=s[:i]+"    blurb:'A dual-axe skirmisher. Throws a bronze axe and a blue axe as dash destinations, claims them back through enemies, and grows deadlier and more fragile as Corruption spreads.',"+s[j:]
rep("res:100,resG:0,rg5:10,rg5G:0,ad:66,","res:100,resG:0,rg5:0,rg5G:0,ad:66,")
rep("    furyOnHit:8,castKind:{Q:'throw',E:'roar',RMB:'swing',R:'roar'},","    castKind:{Q:'swing',E:'e',RMB:'swing',R:'roar'},")
i=s.index("A1.Q={name:'Axe Throw'");j=s.index("// Passive: Crosscut.")
s=s[:i]+open(SP+'cora_kit.js').read()+"\n"+s[j:]
# ---- engine ----
rep("leap:!!o.leap,kind:o.kind,onTick:o.onTick,","leap:!!o.leap,kind:o.kind,claim:o.claim,interrupt:!!o.interrupt,onCancel:o.onCancel,onTick:o.onTick,")
rep("onHit:o.onHit,kind:o.kind,alive:true,age:0});\n}","onHit:o.onHit,onEnd:o.onEnd,kind:o.kind,alive:true,age:0});\n}")
rep("    if(p.traveled>=p.range||p.x<0||p.x>W)p.alive=false;}","    if(p.alive&&p.traveled>=p.range&&p.onEnd){p.alive=false;p.onEnd(p);}\n    if(p.traveled>=p.range||p.x<0||p.x>W)p.alive=false;}")
rep("function stun(u,dur){if(u.kind==='tower')return;u.stunT=Math.max(u.stunT,dur);if(u.kind==='champ'){u.wind=null;u.cast=null;}",
    "function stun(u,dur){if(u.kind==='tower')return;u.stunT=Math.max(u.stunT,dur);if(u.kind==='champ'){u.wind=null;u.cast=null;if(u.dash&&u.dash.interrupt){const d=u.dash;u.dash=null;if(d.onCancel)d.onCancel();}}")
rep("    if(t.kind==='champ'){t.lastChampHit={src,t:G.t};src.harm={victim:t,until:G.t+2};callForHelp(src,t);}}",
    "    if(t.kind==='champ'){t.lastChampHit={src,t:G.t};src.harm={victim:t,until:G.t+2};callForHelp(src,t);src.corrT=G.t;t.corrT=G.t;}}")
rep("  let a=amt;\n","  let a=amt;\n  if(src.def&&src.def.resource==='Corruption')a*=1+0.05*corrStage(src);\n  if(t.def&&t.def.resource==='Corruption')a*=1+0.03*corrStage(t);\n")
rep("    input:{mx:0,my:0,ax:0,ay:0,attack:false,attackTarget:null},vx:0,vy:0,px:0,py:0,bonus:zeroBonus(),hitFlash:0,windP:0};\n  computeStats(c,true);",
    "    input:{mx:0,my:0,ax:0,ay:0,attack:false,attackTarget:null},vx:0,vy:0,px:0,py:0,bonus:zeroBonus(),hitFlash:0,windP:0,chg:{}};\n  computeStats(c,true);resetKitState(c);")
rep("function computeStats(c,init){","function resetKitState(c){if(c.def.resource==='Corruption')c.res=0;if(c.key==='cora'){c.axes={Q:{state:'hand'},RMB:{state:'hand'}};c.rSeq=null;c.cleaveReady=null;}}\nfunction computeStats(c,init){")
rep("function respawn(c){c.alive=true;computeStats(c,true);","function respawn(c){c.alive=true;computeStats(c,true);resetKitState(c);")
rep("  for(const k of ABK)c.cds[k]=Math.max(0,c.cds[k]-dt);\n  c.dashCd=Math.max(0,c.dashCd-dt);\n",
"""  for(const k of ABK)c.cds[k]=Math.max(0,c.cds[k]-dt);
  c.dashCd=Math.max(0,c.dashCd-dt);
  for(const k of ABK){const a=c.def.ab[k];if(!a.charges||!c.ranks[k])continue;if(c.chg[k]===undefined)c.chg[k]=a.charges;
    if(c.chg[k]<a.charges&&c.cds[k]<=0){c.chg[k]++;if(c.chg[k]<a.charges)c.cds[k]=a.cd[c.ranks[k]-1]*100/(100+c.ah);}}
  updateAxes(c);
  if(c.def.resource==='Corruption'&&G.t-(c.corrT||-99)>5)c.res=Math.max(0,c.res-12*dt);
""")
rep("c.res=Math.min(c.maxRes,c.res+c.maxRes*0.1*dt);}","if(c.def.resource!=='Corruption')c.res=Math.min(c.maxRes,c.res+c.maxRes*0.1*dt);}")
rep("c.res=Math.min(c.maxRes,c.res+c.maxRes*0.1);","if(c.def.resource!=='Corruption')c.res=Math.min(c.maxRes,c.res+c.maxRes*0.1);")
# casting: availability, charges, failure reasons
rep("  if(c.cds[k]>0)return'cooldown';\n  if(c.stunT>0)return'stunned';\n  if(c.cast||c.dash)return'busy';\n  const cost=a.cost[r-1];",
    "  if(a.avail){const why=a.avail(c);if(why!==true)return why;}\n  if(a.charges?!(c.chg[k]>0):c.cds[k]>0)return'cooldown';\n  if(c.stunT>0)return'stunned';\n  if(c.cast||c.dash)return'busy';\n  const cost=a.cost[r-1];")
rep("  if(!a.cast(c,ax,ay,r,a)){c.stealthT=wasStealth;return'notarget';}\n  c.cds[k]=a.cd[r-1]*100/(100+c.ah);c.res-=cost;",
    "  if(!a.cast(c,ax,ay,r,a)){c.stealthT=wasStealth;const why=c.failWhy||'notarget';c.failWhy=null;return why;}\n  if(a.charges){c.chg[k]--;if(c.cds[k]<=0)c.cds[k]=a.cd[r-1]*100/(100+c.ah);}else c.cds[k]=a.cd[r-1]*100/(100+c.ah);\n  c.res-=cost;")
rep("cooldown:()=>'Ability on cooldown',","cooldown:()=>'Ability on cooldown',axeaway:()=>'That axe is still out',noaxe:()=>'No grounded axe in range',windup:()=>'Winding up',")
# basic attacks: weaker with both axes out, empowered cleave after catching the bronze axe, trail colour follows the axe in hand
rep("  c.atkSide=-(c.atkSide||1);c.atk=","  c.atkSide=-(c.atkSide||1);if(c.axes){const q=c.axes.Q.state==='hand',w=c.axes.RMB.state==='hand';if(q&&!w)c.atkSide=1;else if(w&&!q)c.atkSide=-1;}\n  c.atk=")
rep("  const crit=Math.random()<c.crit;let dmg=c.ad*(crit?c.critDmg:1),extra=0;","  const crit=Math.random()<c.crit;let dmg=c.ad*(crit?c.critDmg:1),extra=0;\n  if(c.axes&&c.axes.Q.state!=='hand'&&c.axes.RMB.state!=='hand')dmg*=0.6;")
rep("    t.kick={until:G.t+0.14,ang:angTo(c,t.x,t.y)};impact(",
"""    if(c.cleaveReady&&c.cleaveReady.until>G.t){const cd=c.cleaveReady.dmg;c.cleaveReady=null;
      for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>c.r+c.range+140+u.r||angDiff(angTo(c,u.x,u.y),c.facing)>0.95)continue;dealDamage(c,u,cd,'phys',{});u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};}
      G.fx.push({k:'smear',x:c.x,y:c.y,z:44,ang:c.facing,side:-(w.side||1),col:'#ffb347',r0:c.r*0.4,r1:c.r+c.range+150,span:2.4,t:0,dur:0.22});
      if(c===G.player||t===G.player)popText(t.x,t.y,'Cleave','#ffb347',14,140);}
    t.kick={until:G.t+0.14,ang:angTo(c,t.x,t.y)};impact(""")
# ---- bot ----
rep("  const can=k=>{const r=c.ranks[k];if(!r||c.cast||c.dash||c.stunT>0)return false;if(A[k].canRecast&&A[k].canRecast(c))return true;return c.cds[k]<=0&&c.res>=A[k].cost[r-1];};",
    "  const can=k=>{const r=c.ranks[k],a=A[k];if(!r||c.cast||c.dash||c.stunT>0)return false;if(a.canRecast&&a.canRecast(c))return true;if(a.avail&&a.avail(c)!==true)return false;if(a.charges)return c.chg[k]>0;return c.cds[k]<=0&&c.res>=a.cost[r-1];};")
rep("  const throwQ=()=>{if(!vis)return false;const k=aria?'Q':'RMB',sp=aria?1600:1800,rg=aria?880:820;if(d>rg)return false;const p=predict(c,foe,sp,0.2);return cast(k,p.x,p.y);};",
"""  const throwQ=()=>{if(!vis)return false;
    if(aria){if(d<860){const p=predict(c,foe,2600,0.12);if(cast('RMB',p.x,p.y))return true;}
      if(d<760){const p=predict(c,foe,1500,0.18),l=hyp(p.x-c.x,p.y-c.y)||1;return cast('Q',p.x+(p.x-c.x)/l*150,p.y+(p.y-c.y)/l*150);}return false;}
    if(d>820)return false;const p=predict(c,foe,1800,0.2);return cast('RMB',p.x,p.y);};""")
rep("  const closeIn=()=>{if(!aria){","  const closeIn=()=>{if(aria&&c.axes){const k=groundedAxes(c).find(k=>hyp(c.axes[k].x-foe.x,c.axes[k].y-foe.y)<260&&dist(c,c.axes[k])<=700);if(k&&cast('E',c.axes[k].x,c.axes[k].y))return;}\n    if(!aria){")
rep("    if(aria){if(d<380)cast('E',0,0);if(edge(c,foe)<=300)cast('RMB',foe.x,foe.y);}\n","    if(aria){}\n")
rep("      if(!aria){const a=away(300);if(!cast('E',a.x,a.y)){const b=away(350);dashTo(b.x,b.y);}}else{const a=away(350);dashTo(a.x,a.y);}",
    "      if(!aria){const a=away(300);if(!cast('E',a.x,a.y)){const b=away(350);dashTo(b.x,b.y);}}\n      else{const k=groundedAxes(c).find(k=>dist(c.axes[k],foe)>d+150);if(k)cast('E',c.axes[k].x,c.axes[k].y);else if(can('RMB')&&c.chg.E>0){const a=away(700);cast('RMB',a.x,a.y);}else{const a=away(350);dashTo(a.x,a.y);}}")
rep("      if(aria&&d<380)cast('E',0,0);\n","")
rep("    if(aria){if(c.ranks.R&&d<240)cast('R',0,0);}","    if(aria){if(c.ranks.R&&!c.rSeq&&d<420)cast('R',foe.x,foe.y);}")
rep("      if(aria&&c.ranks.R&&d<240&&fP<0.45)cast('R',0,0);","      if(aria&&c.ranks.R&&!c.rSeq&&d<420&&fP<0.45)cast('R',foe.x,foe.y);")
rep("  if(!aria&&vis&&mode!=='retreat'&&foe.crosscut","  if(aria&&c.rSeq&&A.R.canRecast(c))cast('R',0,0);\n  if(!aria&&vis&&mode!=='retreat'&&foe.crosscut")
rep("if(vis&&d<850&&c.res>(aria?60:150))throwQ();","if(vis&&d<850&&(aria||c.res>150))throwQ();")
i=s.index("  if(c.key==='cora'){let r;if(r=has('Q'))d+=A.Q.dmg(c,r);");j=s.index("\n",i)
s=s[:i]+"  if(c.key==='cora'){let r;if(c.axes.Q.state==='hand'&&(r=has('Q')))d+=A.Q.dmg(c,r);if(c.axes.RMB.state==='hand'&&(r=has('RMB')))d+=A.RMB.dmg(c,r);if(c.ranks.E&&c.chg.E>0)d+=A.E.dmg(c,c.ranks.E)+A.Q.cleave(c,Math.max(1,c.ranks.Q));if(r=has('R'))d+=A.R.seg(c,r)*1.5;d=(d+c.ad*3)*(1+0.05*corrStage(c));}"+s[j:]
open(p,'w').write(s);print('ok')
