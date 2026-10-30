// ---- Viktor: a ranged bounty hunter who builds Fury with precise shots, then uncages his grafted monster to finish the hunt up close ----
// Prototype tuning, not validated balance.
CH.viktor={key:'viktor',name:'Viktor',role:'Bounty Hunter',reach:'Ranged / Melee',resource:'Fury',r:31,ranged:true,
  blurb:'A ranged bounty hunter with monster grafts. Marks his bounty with a deliberate shot, builds Fury with every hit, drags himself in on a sinew tether, then uncages the monster to finish the hunt with claws before the Fury runs dry.',
  base:{hp:610,hpG:100,hp5:7,hp5G:0.7,res:100,resG:0,rg5:0,rg5G:0,ad:60,adG:3.3,as:0.7,asG:3,armor:28,armorG:4.4,mr:30,mrG:1.3,ms:335,range:550,windup:0.2,proj:2200},
  castKind:{Q:'shot',E:'shot',RMB:'guard',R:'roar'},
  dash:{name:"Hunter's Roll",desc:'Roll up to 300 units toward the cursor. Works in both forms.',
    cast(c,ax,ay){const ang=angTo(c,ax,ay),len=clamp(hyp(ax-c.x,ay-c.y),120,300);dash(c,ang,len,1250,{kind:'roll'});spark(c.x,c.y,'#c9a27a',6);return true;}},
  ab:{}};
const V1=CH.viktor.ab;
const VIK_MON={hp:[200,325,450],dur:[8,9,10],range:175};
const vikMonster=c=>c.form==='monster';
const vikCd=(c,a,r)=>(vikMonster(c)&&a.mcd?a.mcd:a.cd)[r-1]*100/(100+c.ah);
// Fury: shots and graft abilities build it (more against the bounty); none is gained while uncaged
function gainFury(c,n){if(c.key!=='viktor'||vikMonster(c)||!c.alive)return;const was=c.res;c.res=Math.min(c.maxRes,c.res+n);c.furyT=G.t;
  if(was<c.maxRes&&c.res>=c.maxRes&&c===G.player){popText(c.x,c.y,'Fury full · R to uncage','#ff8a4c',15,150);SFX.play('level',c.x,c.y,0.5);}}
const vikBounty=c=>c&&c.bounty&&c.bounty.until>G.t&&c.bounty.t.alive?c.bounty.t:null;
function setBounty(c,t){const fresh=vikBounty(c)!==t;c.bounty={t,until:G.t+6,reveal:G.t+3};if(fresh){ring(t.x,t.y,t.r,t.r+40,'#ff8a4c',0.35);if(c===G.player||t===G.player)popText(t.x,t.y,'Bounty','#ffb36b',15,150);}}
function vikShotHit(c,t){if(t.kind==='champ')gainFury(c,vikBounty(c)===t?14:8);else if(t.kind==='minion'||t.kind==='plant')gainFury(c,3);}
function vikTransform(c,r){if(!c.alive||vikMonster(c))return;c.form='monster';c.formRank=r;c.drain=c.maxRes/VIK_MON.dur[r-1];c.res=c.maxRes;
  computeStats(c,false);c.atk=null;c.atkCd=0;
  ring(c.x,c.y,10,220,'#ff5a2e',0.5);ring(c.x,c.y,10,140,'#3a0d08',0.6);for(let i=0;i<10;i++)G.fx.push({k:'rock',x:c.x+rnd(-40,40),y:c.y+rnd(-40,40),t:0,dur:rnd(0.5,0.8),vz:rnd(200,340),s:rnd(5,10),rot:rnd(0,TAU)});
  spark(c.x,c.y,'#ff8a4c',22);SFX.play('quake',c.x,c.y);SFX.play('death',c.x,c.y,0.5);if(c===G.player||dist(c,G.player)<900){shake(8,0.35);G.hitStop=0.06;}
  if(c===G.player)refreshIcons();}
function vikRevert(c){if(!vikMonster(c))return;c.form='human';c.res=0;computeStats(c,false);c.hp=Math.max(1,c.hp);c.atk=null;
  if(c.alive){ring(c.x,c.y,10,140,'#c9a27a',0.4);G.fx.push({k:'smoke',x:c.x,y:c.y,t:0,dur:0.9,r:60,col:'#3a2a22'});}
  if(c===G.player)refreshIcons();}
function updateViktor(c,dt){if(c.key!=='viktor')return;
  if(vikMonster(c)){c.res-=c.drain*dt;if(c.res<=0)vikRevert(c);}
  else if(G.t-(c.furyT||-99)>8)c.res=Math.max(0,c.res-6*dt);  // Fury cools off out of combat
  if(c.tether&&(c.tether.until<G.t||!c.tether.t.alive||dist(c,c.tether.t)>950||vikMonster(c)))c.tether=null;
  if(c.hide&&c.hide.until<G.t)c.hide=null;}
// Stolen Hide: damage arriving from the hardened side is reduced; blocking a champion feeds Fury
function hideReduce(t,src,a){const h=t.hide;if(!h||h.until<G.t||src.x===undefined)return a;
  if(angDiff(angTo(t,src.x,src.y),h.ang)>1.3)return a;
  if(src.kind==='champ'&&G.t>(h.nextFury||0)){h.nextFury=G.t+0.3;gainFury(t,15);}
  h.flash=G.t;spark(t.x+Math.cos(h.ang)*(t.r+20),t.y+Math.sin(h.ang)*(t.r+20),'#e8c7a0',4);return a*(1-h.red);}
V1.Q={name:'Bounty Round / Gut Ripper',max:5,cd:[9,8.5,8,7.5,7],mcd:[5,5,5,5,5],cost:[0,0,0,0,0],range:1000,manualCd:true,
  dmg:(c,r)=>[70,110,150,190,230][r-1]+0.9*c.ad, rip:(c,r)=>[60,95,130,165,200][r-1]+1.0*c.ad, ripBleed:(c,r)=>[40,60,80,100,120][r-1]+0.3*c.ad,
  desc:(c,r,a)=>`<b>${vikMonster(c)?'Gut Ripper (now)':'Bounty Round (now)'}</b><br><b>Human, Bounty Round:</b> after a 0.25s aim, fire a deliberate shot up to 1000 units that stops on the first enemy for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (70/110/150/190/230 + 90% AD). The first champion hit becomes your <b>bounty</b> for 6s: revealed for 3s, and your revolver hits on them build extra Fury. Grants 12 Fury on a champion. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.<br><br><b>Monster, Gut Ripper:</b> sweep your demonic arm through a short cone for <span class="ph">${n0(a.rip(c,r))}</span> physical damage (60/95/130/165/200 + 100% AD). Your bounty also bleeds for <span class="ph">${n0(a.ripBleed(c,r))}</span> over 2s. 5s cooldown.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);c.cds.Q=vikCd(c,a,r);
    if(vikMonster(c)){beginCast(c,0.15,ang,()=>{const b=vikBounty(c);
      for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>300+u.r||angDiff(angTo(c,u.x,u.y),ang)>0.85)continue;
        dealDamage(c,u,a.rip(c,r),'phys',{});if(u===b)bleed(u,c,a.ripBleed(c,r));u.kick={until:G.t+0.16,ang:angTo(c,u.x,u.y)};impact(u,'#ff6a3d',u.kind==='champ');}
      G.fx.push({k:'smear',x:c.x,y:c.y,z:46,ang,side:1,col:'#ff6a3d',r0:c.r*0.4,r1:300,span:1.7,t:0,dur:0.22});SFX.play('swing',c.x,c.y);});return true;}
    beginCast(c,0.25,ang,()=>{muzzle(c,ang,1.6);SFX.play('crit',c.x,c.y,0.6);
      shoot(c,{ang,speed:2600,range:1000,radius:20,pierce:false,kind:'bullet',onHit:t=>{dealDamage(c,t,a.dmg(c,r),'phys',{});impact(t,'#ffcf7a',t.kind==='champ');
        if(t.kind==='champ'){setBounty(c,t);gainFury(c,12);}}});});return true;}};
V1.RMB={name:'Stolen Hide / Molt',max:5,cd:[14,13,12,11,10],mcd:[12,11,10,9,8],cost:[0,0,0,0,0],range:0,manualCd:true,
  red:r=>[0.4,0.45,0.5,0.55,0.6][r-1], molt:(c,r)=>[60,95,130,165,200][r-1]+0.5*c.ad,
  desc:(c,r,a)=>`<b>${vikMonster(c)?'Molt (now)':'Stolen Hide (now)'}</b><br><b>Human, Stolen Hide:</b> harden your grafted side toward the cursor for 1.75s. Damage arriving from that side is reduced by ${n0(a.red(r)*100)}%, and each champion hit you block grants 15 Fury. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.<br><br><b>Monster, Molt:</b> shed the carapace in a burst, dealing <span class="ph">${n0(a.molt(c,r))}</span> physical damage (60/95/130/165/200 + 50% AD) to enemies within 270 units, slowing them by 40% for 1.5s, and gaining a burst of move speed. Use it to stick, or to get out before the Fury runs dry.`,
  cast(c,ax,ay,r,a){c.cds.RMB=vikCd(c,a,r);
    if(vikMonster(c)){for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>270+u.r)continue;dealDamage(c,u,a.molt(c,r),'phys',{});slow(u,0.4,1.5);u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};}
      c.msBuff={until:G.t+1.5,pct:0.5};ring(c.x,c.y,10,270,'#e8c7a0',0.35);
      for(let i=0;i<12;i++)G.fx.push({k:'rock',x:c.x+rnd(-30,30),y:c.y+rnd(-30,30),t:0,dur:rnd(0.4,0.7),vz:rnd(160,300),s:rnd(5,9),rot:rnd(0,TAU)});SFX.play('quake',c.x,c.y,0.6);return true;}
    c.hide={until:G.t+1.75,ang:angTo(c,ax,ay),red:a.red(r)};ring(c.x,c.y,c.r,c.r+40,'#e8c7a0',0.25);SFX.play('tower',c.x,c.y,0.4);return true;}};
V1.E={name:'Dragline / Run Them Down',max:5,cd:[14,13,12,11,10],mcd:[10,9.5,9,8.5,8],cost:[0,0,0,0,0],range:750,manualCd:true,
  dmg:(c,r)=>[50,80,110,140,170][r-1]+0.5*c.ad, leap:(c,r)=>[60,95,130,165,200][r-1]+0.6*c.ad,
  desc:(c,r,a)=>`<b>${vikMonster(c)?'Run Them Down (now)':'Dragline (now)'}</b><br><b>Human, Dragline:</b> launch a sinew tether up to 750 units. A champion it hits takes <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (50/80/110/140/170 + 50% AD), grants 12 Fury and stays tethered for 3s: recast to haul yourself up to 450 units toward them. ${n0(a.cd[r-1]*100/(100+c.ah))}s cooldown.<br><br><b>Monster, Run Them Down:</b> a short, heavy leap toward the cursor (up to 420 units). Landing deals <span class="ph">${n0(a.leap(c,r))}</span> physical damage (60/95/130/165/200 + 60% AD) around you, and your bounty is slowed by 50% for 1s if they are close. No resets: committing matters.`,
  canRecast:c=>!!(c.tether&&c.tether.until>G.t&&c.tether.t.alive&&!vikMonster(c)),
  recast(c){const t=c.tether.t;c.tether=null;const len=Math.min(450,dist(c,t)-c.r-t.r-40);
    if(len>20){dash(c,angTo(c,t.x,t.y),len,1800,{kind:'E',interrupt:true});SFX.play('dash',c.x,c.y);}return true;},
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);c.cds.E=vikCd(c,a,r);
    if(vikMonster(c)){const len=clamp(hyp(ax-c.x,ay-c.y),150,420),b=vikBounty(c);
      dash(c,ang,len,1150,{leap:true,kind:'leap',onEnd:()=>{for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>200+u.r)continue;dealDamage(c,u,a.leap(c,r),'phys',{});u.kick={until:G.t+0.16,ang:angTo(c,u.x,u.y)};}
        if(b&&dist(c,b)<260+b.r)slow(b,0.5,1);ring(c.x,c.y,10,200,'#ff6a3d',0.35);for(let i=0;i<8;i++)G.fx.push({k:'rock',x:c.x+rnd(-50,50),y:c.y+rnd(-50,50),t:0,dur:rnd(0.4,0.7),vz:rnd(150,280),s:rnd(5,10),rot:rnd(0,TAU)});
        SFX.play('quake',c.x,c.y,0.7);if(c===G.player||b===G.player)shake(6,0.2);}});return true;}
    beginCast(c,0.12,ang,()=>{const p=shoot(c,{ang,speed:1900,range:750,radius:24,pierce:false,kind:'tether',onHit:t=>{dealDamage(c,t,a.dmg(c,r),'phys',{});impact(t,'#d9574a',t.kind==='champ');
        if(t.kind==='champ'){c.tether={t,until:G.t+3};gainFury(c,12);if(c===G.player)popText(t.x,t.y,'Tethered · E to pull','#ff9a8a',14,140);}}});
      if(p)p.src2=c;SFX.play('swing',c.x,c.y);});return true;}};
V1.R={name:'Uncage',max:3,cd:[90,75,60],cost:[0,0,0],range:0,
  desc:(c,r,a)=>`Requires full Fury. Holster the revolver and, after a 0.6s wind-up that a stun can interrupt, transform. The monster gains <span class="ph">${VIK_MON.hp[r-1]}</span> maximum health, claw attacks (175 range, 20% more attack speed), 25 move speed and the monster forms of your abilities. Fury drains to empty over ${VIK_MON.dur[r-1]}s and cannot be gained while uncaged; when it runs out you revert. Transforming does not refresh cooldowns.`,
  avail:c=>vikMonster(c)?'uncaged':c.res>=c.maxRes-0.01?true:'nofury',
  cast(c,ax,ay,r,a){c.uncaging=G.t;beginCast(c,0.6,c.facing,()=>vikTransform(c,r));ring(c.x,c.y,c.r+40,c.r,'#ff5a2e',0.6);SFX.play('cast',c.x,c.y,0.9);return true;}};
CH.viktor.passive={name:'Something in the Blood',desc:c=>`Revolver hits and graft abilities build Fury: 8 per revolver hit on a champion (14 on your bounty), 3 on minions, 12 per ability hit, 15 per champion hit blocked by Stolen Hide. At full Fury you can Uncage. The monster cannot build Fury, and it drains away, so the window is limited. Out of combat for 8s, Fury slowly cools. Now: ${n0(c.res||0)} Fury${vikMonster(c)?' (uncaged)':''}.`};
// muzzle flash at the revolver: a little forward of him and at hand height
function muzzle(c,ang,big){const x=c.x+Math.cos(ang)*(c.r+18),y=c.y+Math.sin(ang)*(c.r+18);G.fx.push({k:'flash',x,y,z:58,ang,t:0,dur:0.09*(big||1),s:big||1});spark(x,y,'#ffd27a',big?6:3);}

// ---- Viktor's sheets: human and monster, 8 directions x 8 walk frames ----
const VIK_SHEETS={human:%HUMAN%,monster:%MONSTER%};VIK_SHEETS.human.img=VIK_SHEETS.monster.img=null;
const VIK_H={human:100,monster:126},VIK_STRIDE={human:150,monster:175};let VIK_READY=false;
(function(){let left=2;for(const k of ['human','monster']){const im=new Image();im.onload=()=>{VIK_SHEETS[k].img=im;if(--left===0){VIK_READY=true;
  for(const b of document.querySelectorAll('#cards .card'))if(b.dataset.k==='viktor')drawPortrait(b.querySelector('canvas'),'viktor',BLUE);if(G&&G.player.key==='viktor')drawPortrait($('portC'),'viktor',G.player.team);}};im.src=`assets/viktor_${k}.webp`;}})();
function viktorFrame(u){const m=vikMonster(u)?'monster':'human',S=VIK_SHEETS[m],fa=projAng(u.facing);
  const fr={S,H:VIK_H[m],row:((Math.round((fa-PI/2)/(PI/4))%8)+8)%8,col:0,ox:0,oy:0,rot:0,sx:1,sy:1};
  const lunge=(b,d)=>{fr.ox=Math.cos(fa)*b*d;fr.oy=Math.sin(fa)*b*d*0.7;fr.rot=b*0.1*(Math.cos(fa)>=0?1:-1);fr.sy=1-Math.max(0,-b)*0.05;fr.sx=1+Math.max(0,-b)*0.03;};
  if(u.dash){const p=1-u.dash.t/u.dash.total;fr.col=3;if(u.dash.leap){fr.rot=(p-0.5)*0.3*(Math.cos(fa)>=0?1:-1);fr.sy=p<0.15||p>0.85?0.9:1.05;}else if(u.dash.kind==='roll'){fr.sy=0.85;fr.sx=1.08;fr.rot=Math.sin(p*PI)*0.35*(Math.cos(fa)>=0?1:-1);}else lunge(0.8,10);return fr;}
  if(u.cast&&u.uncaging&&G.t-u.uncaging<0.7){const k=(G.t-u.uncaging)/0.6;fr.sx=1+0.06*k+Math.sin(G.t*60)*0.02*k;fr.sy=1-0.08*k;fr.ox=Math.sin(G.t*70)*2*k;return fr;}
  const ca=u.castAnim;
  if(ca&&G.t-ca.start<ca.W+0.25){const t=G.t-ca.start,W=Math.max(ca.W,0.001),p=t<W?0.55*t/W:0.55+0.45*Math.min(1,(t-W)/0.25);
    if(ca.kind==='guard'){fr.sy=0.94;fr.sx=1.04;}else if(m==='monster')lunge(kf([[0,0],[0.4,-1],[0.55,1.2],[0.8,0.6],[1,0]],p),14);else lunge(kf([[0,0],[0.5,0],[0.6,-0.9],[1,0]],p),8);
    return fr;}
  const at=u.atk;
  if(at&&G.t-at.start<at.W+0.25){const t=G.t-at.start,W=at.W,p=t<W?0.55*t/W:0.55+0.45*Math.min(1,(t-W)/0.25);
    if(m==='monster'){lunge(kf([[0,0],[0.4,-1],[0.55,1.2],[0.75,0.8],[1,0]],p),15);fr.col=p<0.55?1:5;}else lunge(kf([[0,0],[0.5,0],[0.6,-0.8],[1,0]],p),7);
    return fr;}
  if(hyp(u.vx,u.vy)>30){fr.col=Math.floor(((u.walkD||0)/VIK_STRIDE[m])%1*8);return fr;}
  fr.sy=1+Math.sin(G.t*2.2)*0.012;return fr;}
