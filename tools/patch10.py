p='/home/user/riftline/index.html';s=open(p).read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count,(old[:110],s.count(old))
    s=s.replace(old,new)
def swap_block(start,end_marker,new):
    global s
    i=s.index(start);j=s.index(end_marker,i);s=s[:i]+new+s[j:]
# ---- two-axe juggling ----
rep("function pickAxe(c,k){const ax=c.axes[k];ax.state='hand';spark(ax.x,ax.y,CORA_AXES[k].glow,6);}",
"""// walking over a grounded axe picks it up with its cooldown reset
function pickAxe(c,k){const ax=c.axes[k];ax.state='hand';ax.readyAt=G.t;spark(ax.x,ax.y,CORA_AXES[k].glow,6);if(c===G.player)popText(c.x,c.y,'Axe ready','#ffcf7a',14,130);}
const axeReady=(c,k)=>c.axes[k].state==='hand'&&G.t>=(c.axes[k].readyAt||0);
const readyAxe=c=>axeReady(c,'Q')?'Q':axeReady(c,'RMB')?'RMB':null;
const axesInHand=c=>(c.axes.Q.state==='hand')+(c.axes.RMB.state==='hand');
// the next recall takes whichever axe was thrown first
function oldestOut(c){let best=null;for(const k of ['Q','RMB']){const ax=c.axes[k];if(ax.r||!(ax.state==='ground'||ax.state==='flying'))continue;if(!best||(ax.thrownAt||0)<(c.axes[best].thrownAt||0))best=k;}return best;}""")
rep("  const s=c.rSeq;\n  if(s&&s.state==='armed'&&G.t>s.until)endR(c);\n}",
"""  const s=c.rSeq;
  if(s&&s.state==='armed'&&G.t>s.until)endR(c);
  // Q's slot shows the soonest axe in hand to come off cooldown
  const hk=['Q','RMB'].filter(k=>c.axes[k].state==='hand'),pool=hk.length?hk:['Q','RMB'];
  c.cds.Q=readyAxe(c)?0:Math.max(0,Math.min(...pool.map(k=>(c.axes[k].readyAt||0)-G.t)));
}""")
rep("  const tok={g:false},ax=c.axes[k];ax.state='flying';","  const tok={g:false},ax=c.axes[k];ax.state='flying';ax.thrownAt=G.t;")
swap_block("A1.Q={name:\"Mother's Wrath\"","A1.RMB={name:'Earthrend'","""A1.Q={name:"Mother's Wrath",max:5,cd:[9,8.5,8,7.5,7],cost:[0,0,0,0,0],range:825,manualCd:true,
  dmg:(c,r)=>[70,105,140,175,210][r-1]+0.8*c.ad, cleave:(c,r)=>[30,50,70,90,110][r-1]+0.5*c.ad,
  desc:(c,r,a)=>`You carry two axes, each with its own ${(a.cd[r-1]*100/(100+c.ah)).toFixed(1)}s cooldown starting when it is thrown. Q throws a ready axe in hand (bronze first, then blue) to a spot up to 825 units away. In flight it cuts a wide path, dealing <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (70/105/140/175/210 + 80% AD) to everything it passes through, and slows enemies where it lands by 35% for 1s. It stays there for 4s as a Claim the Fallen destination.<br><br>With no ready axe in hand, Q <b>recalls</b> the axe you threw first: it flies back to you, hitting everything on the way for the same damage, and catching it makes your next basic attack cleave for <span class="ph">${n0(a.cleave(c,r))}</span> bonus damage. A recalled axe stays on cooldown; walk over a grounded axe instead to pick it up with its cooldown reset. You cannot basic attack with both axes out of your hands.`,
  ammo:c=>(axeReady(c,'Q')?1:0)+(axeReady(c,'RMB')?1:0),
  canRecast:c=>!!c.axes&&!readyAxe(c)&&!!oldestOut(c),
  recast(c){const k=oldestOut(c);recallAxe(c,k,A1.Q.dmg(c,Math.max(1,c.ranks.Q)));c.castAnim={start:G.t,W:0.05,kind:'roar'};return true;},
  cast(c,ax,ay,r,a){const k=readyAxe(c);if(!k){c.failWhy='cooldown';return false;}
    const ang=angTo(c,ax,ay),axe=c.axes[k];axe.readyAt=G.t+a.cd[r-1]*100/(100+c.ah);
    beginCast(c,0.18,ang,()=>{if(axe.state!=='hand')return;
      throwAxe(c,k,ax,ay,{range:825,speed:1500,radius:AXE_W,dmg:a.dmg(c,r),onLand:(x,y,tok)=>{
        for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||hyp(u.x-x,u.y-y)>160+u.r)continue;slow(u,0.35,1);}
        ring(x,y,20,160,CORA_AXES[k].col,0.35);}});});return true;}};
""")
swap_block("A1.E={name:'Claim the Fallen'","// the fissure travels outward,","""A1.E={name:'Claim the Fallen',max:5,cd:[12,11,10,9,8],cost:[0,0,0,0,0],range:850,charges:2,
  dmg:(c,r)=>[40,65,90,115,140][r-1]+0.5*c.ad,
  desc:(c,r,a)=>`Two charges. Dash to one of your grounded axes within 850 units (the one nearest your cursor), slashing everything along the way for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (40/65/90/115/140 + 50% AD), and catch it: +10 Corruption and your next basic attack cleaves. A caught axe keeps its cooldown. Each dash uses a charge; charges recharge one at a time. Stuns interrupt the dash. Unavailable with no grounded axe in range.`,
  avail:c=>{if(c.rSeq)return'busy';return groundedAxes(c).some(k=>dist(c,c.axes[k])<=850)?true:'noaxe';},
  cast(c,ax_,ay_,r,a){const ks=groundedAxes(c).filter(k=>dist(c,c.axes[k])<=850);if(!ks.length){c.failWhy='noaxe';return false;}
    const k=ks.reduce((b,x)=>hyp(c.axes[x].x-ax_,c.axes[x].y-ay_)<hyp(c.axes[b].x-ax_,c.axes[b].y-ay_)?x:b),axe=c.axes[k],col=CORA_AXES[k].glow;
    const ang=angTo(c,axe.x,axe.y),len=Math.max(1,dist(c,axe)),d=a.dmg(c,r),hit=new Set(),tok={g:false};
    dash(c,ang,len,1800,{kind:'E',claim:k,interrupt:true,onTick:()=>{for(const u of enemiesOf(c.team)){if(u.kind==='tower'||hit.has(u)||!hittable(u)||dist(c,u)>c.r+u.r+40)continue;
        hit.add(u);dealDamage(c,u,d,'phys',{});axeHit(c,tok,u);slash(u.x,u.y,ang+PI/2,col);u.kick={until:G.t+0.12,ang};}},
      onEnd:()=>{if(axe.state!=='ground')return;axe.state='hand';gainCorr(c,10);ring(c.x,c.y,10,90,col,0.35);
        c.cleaveReady={until:G.t+5,dmg:A1.Q.cleave(c,Math.max(1,c.ranks.Q))};if(c===G.player)popText(c.x,c.y,'Cleave ready','#ffb347',14,130);}});
    return true;}};
""")
rep("Each ability cast that hits a champion grants 10, and catching the bronze axe with Claim the Fallen grants 10.","Each ability cast that hits a champion grants 10, and catching an axe with Claim the Fallen grants 10.")
i=s.index("    blurb:'A dual-axe skirmisher. Throws a bronze axe that cuts a wide path");j=s.index("\n",i)
s=s[:i]+"    blurb:'A dual-axe skirmisher. Juggles two thrown axes that cut wide paths, dashes to them or summons them back through enemies, rips the ground open, and grows deadlier and more fragile as Corruption spreads.',"+s[j:]
# tryCast: Q manages its own per-axe cooldown
rep("if(a.charges){c.chg[k]--;if(c.cds[k]<=0)c.cds[k]=a.cd[r-1]*100/(100+c.ah);}else c.cds[k]=a.cd[r-1]*100/(100+c.ah);",
    "if(a.charges){c.chg[k]--;if(c.cds[k]<=0)c.cds[k]=a.cd[r-1]*100/(100+c.ah);}else if(!a.manualCd)c.cds[k]=a.cd[r-1]*100/(100+c.ah);")
# no axe in hand, no basic attacks
rep("function startAttack(c,target){\n","function startAttack(c,target){\n  if(c.axes&&axesInHand(c)===0){if(c===G.player&&G.t>(c.noAxeMsg||0)){showReason('noaxehand');c.noAxeMsg=G.t+1.2;}return;}\n")
rep("  if(c.axes&&c.axes.Q.state!=='hand'&&c.axes.RMB.state!=='hand')dmg*=0.6;\n","")
rep("noaxe:()=>'No grounded axe in range',","noaxe:()=>'No grounded axe in range',noaxehand:()=>'No axe in hand. Press Q to recall one',")
rep("Rs.d=0","Rs.d=0",0) if False else None
# reset per-axe cooldowns on respawn
rep("c.axes={Q:{state:'hand'},RMB:{state:'hand'}};","c.axes={Q:{state:'hand',readyAt:0},RMB:{state:'hand',readyAt:0}};")
# HUD: Q shows how many axes are ready to throw
rep("chg=a.charges?(p.chg[k]??a.charges):null,","chg=a.charges?(p.chg[k]??a.charges):a.ammo?a.ammo(p):null,")
# recall preview only for the axe the next Q press would bring back
rep("      if(c===p&&c.alive&&k==='Q'&&!ax.r&&!c.dash){","      if(c===p&&c.alive&&k===oldestOut(c)&&A1.Q.canRecast(c)&&!c.dash){")
# ---- bot ----
rep("if(d<760&&c.axes.Q.state==='hand'){","if(d<760&&readyAxe(c)){")
i=s.index("  const closeIn=()=>{if(aria&&c.axes){const q=c.axes.Q;");j=s.index("if(d<640){const pr=predict(c,foe,2000,0.25);if(cast('RMB',pr.x,pr.y))return;}}",i)
s=s[:i]+"""  const closeIn=()=>{if(aria&&c.axes){
      for(const k of groundedAxes(c)){const q=c.axes[k];if(G.t-q.t0<0.15)continue;const through=segDist(foe.x,foe.y,q.x,q.y,c.x,c.y).d<foe.r+AXE_W-10;
        if(dist(c,q)<=850&&(through||hyp(q.x-foe.x,q.y-foe.y)<260)&&cast('E',q.x,q.y))return;}
      const ok=oldestOut(c);
      if(ok&&A.Q.canRecast(c)){const q=c.axes[ok],qp=axePos(q),through=segDist(foe.x,foe.y,qp.x,qp.y,c.x,c.y).d<foe.r+AXE_W-10;
        if(((through&&q.state==='ground'&&!can('E'))||(q.state==='ground'&&G.t>q.until-0.5)||(axesInHand(c)===0&&edge(c,foe)<c.range+60))&&cast('Q',0,0))return;}
      """+s[j:]
rep("      else{const q=c.axes.Q;if(q.state==='ground'&&!q.r&&dist(q,foe)>d+150&&cast('E',q.x,q.y)){}else{const a=away(350);dashTo(a.x,a.y);}",
    "      else{const k=groundedAxes(c).find(k=>dist(c.axes[k],foe)>d+150&&dist(c,c.axes[k])<=850);if(k&&cast('E',c.axes[k].x,c.axes[k].y)){}else{const a=away(350);dashTo(a.x,a.y);}")
rep("if(c.key==='cora'){let r;if(c.axes.Q.state==='hand'&&(r=has('Q')))d+=A.Q.dmg(c,r);","if(c.key==='cora'){let r;if(c.ranks.Q)d+=A.Q.dmg(c,c.ranks.Q)*A.Q.ammo(c);")
open(p,'w').write(s);print('ok')
