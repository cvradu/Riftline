// Passive: Crosscut. Ability hits mark enemy champions; the next basic attack on them consumes it.
function crossMark(c,t){if(!c.def.passive||t.kind!=='champ'||t.team===c.team||!t.alive)return;const fresh=!(t.crosscut&&t.crosscut.src===c&&t.crosscut.until>G.t);t.crosscut={src:c,until:G.t+3};if(fresh)ring(t.x,t.y,t.r,t.r+30,'#ff4d61',0.3);}
const crossDmg=c=>20+8*c.level+0.45*c.ad;
const shadeQuarry=c=>c.quarry&&c.quarry.until>G.t&&c.quarry.t.alive?c.quarry.t:null;
S1.Q={name:'Scissor Blades',max:5,cd:[8,7.5,7,6.5,6],cost:[45,45,45,45,45],range:340,
  dmg:(c,r)=>[60,95,130,165,200][r-1]+0.9*c.ad,
  desc:(c,r,a)=>`After a 0.24s wind-up, sweep both blades inward across a 340-unit cone for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (60/95/130/165/200 + 90% AD). Enemies where the tips cross, near the end of the cone, take <span class="ph">${n0(a.dmg(c,r)*1.5)}</span> instead, and landing that sweet spot cuts the remaining cooldown by 40%.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.24,ang,()=>{
    const d=a.dmg(c,r),sx=c.x+Math.cos(ang)*255,sy=c.y+Math.sin(ang)*255;let sweet=false;
    for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u))continue;
      if(dist(c,u)>340+u.r||angDiff(angTo(c,u.x,u.y),ang)>0.75)continue;
      const sw=hyp(u.x-sx,u.y-sy)<=75+u.r;dealDamage(c,u,sw?d*1.5:d,'phys',{});crossMark(c,u);u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};
      if(sw){sweet=true;impact(u,'#ff6b7a',true);}}
    if(sweet){c.cds.Q*=0.6;if(c===G.player)popText(c.x,c.y,'Sweet spot','#ff9aa6',14,130);}
    ring(sx,sy,10,85,sweet?'#ff6b7a':'#e6d9ff',0.25);});return true;}};
S1.RMB={name:"Hunter's Shurikens",max:5,cd:[10,9.5,9,8.5,8],cost:[50,50,50,50,50],range:850,
  dmg:(c,r)=>[45,70,95,120,145][r-1]+0.55*c.ad,
  desc:(c,r,a)=>`Throw three shurikens in a narrow fan (850 range). Each deals <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (45/70/95/120/145 + 55% AD) and slows by 20% for 1s; extra shurikens on the same target deal half. The first enemy champion hit is revealed as your quarry for 5s, and your next Slip Through aimed at them reaches 250 units further.`,
  cast(c,ax,ay,r,a){const ang=angTo(c,ax,ay);beginCast(c,0.2,ang,()=>{const d=a.dmg(c,r),hits=new Map();let first=true;
    for(const o of [-0.12,0,0.12])shoot(c,{ang:ang+o,speed:1800,range:850,radius:24,pierce:false,kind:'shuriken',onHit:t=>{
      const n=hits.get(t)||0;hits.set(t,n+1);dealDamage(c,t,n?d*0.5:d,'phys',{});slow(t,0.2,1);spark(t.x,t.y,'#ff8a96',6);crossMark(c,t);
      if(t.kind==='champ'&&first){first=false;c.quarry={t,until:G.t+5};if(c===G.player||t===G.player)popText(t.x,t.y,'Quarry','#ff6b7a',15,135);}}});});return true;}};
S1.E={name:'Slip Through',max:5,cd:[14,13,12,11,10],cost:[40,40,40,40,40],range:300,
  dmg:(c,r)=>[55,85,115,145,175][r-1]+0.6*c.ad,
  desc:(c,r,a)=>`Dash 300 units toward the cursor and slash enemies within 200 units of where you land for <span class="ph">${n0(a.dmg(c,r))}</span> physical damage (55/85/115/145/175 + 60% AD). Aimed at your quarry, the dash reaches 250 units further. Pass through your quarry and you can recast within 3s to dash 220 units in any direction.`,
  canRecast:c=>!!(c.eRecast&&c.eRecast.until>G.t),
  recast(c,ax,ay){c.eRecast=null;ghost(c);dash(c,angTo(c,ax,ay),220,1600,{kind:'E'});SFX.play('dash',c.x,c.y);return true;},
  cast(c,ax,ay,r,a){let ang=angTo(c,ax,ay),len=300;const q=shadeQuarry(c);
    if(q&&angDiff(angTo(c,q.x,q.y),ang)<0.6){ang=angTo(c,q.x,q.y);len=Math.min(550,dist(c,q)+c.r+q.r+60);}
    const d=a.dmg(c,r);let passed=false;ghost(c);
    dash(c,ang,Math.max(140,len),1500,{kind:'E',onTick:()=>{if(q&&!passed&&dist(c,q)<c.r+q.r+25)passed=true;},onEnd:()=>{
      for(const u of enemiesOf(c.team)){if(u.kind==='tower'||!hittable(u)||dist(c,u)>200+u.r)continue;dealDamage(c,u,d,'phys',{});crossMark(c,u);u.kick={until:G.t+0.14,ang:angTo(c,u.x,u.y)};}
      ring(c.x,c.y,20,200,'#e6d9ff',0.25);c.castAnim={start:G.t,W:0,kind:'eArrive'};
      if(passed){c.eRecast={until:G.t+3};if(c===G.player)popText(c.x,c.y,'Recast ready','#e6d9ff',14,130);}}});
    return true;}};
S1.R={name:'Closing Blades',max:3,cd:[100,85,70],cost:[0,0,0],range:500,
  cut:(c,r)=>[90,150,210][r-1]+0.6*c.ad, miss:r=>[0.2,0.25,0.3][r-1],
  desc:(c,r,a)=>`Lunge through an enemy champion within 500 units with two crossing cuts. The first deals <span class="ph">${n0(a.cut(c,r))}</span> physical damage (90/150/210 + 60% AD). The second deals the same plus ${[20,25,30][r-1]}% of their missing health. A takedown within 3s refreshes Slip Through.`,
  cast(c,ax,ay,r,a){const foe=G.champs.find(u=>u.team!==c.team);
    if(!foe||!foe.alive||!targetable(foe)||edge(c,foe)>500)return false;
    const ang=angTo(c,foe.x,foe.y),len=dist(c,foe)+foe.r+c.r+70;let first=false;foe.execBy={src:c,until:G.t+3};ghost(c);
    const cut1=()=>{first=true;if(!foe.alive)return;dealDamage(c,foe,a.cut(c,r),'phys',{force:true});crossMark(c,foe);impact(foe,'#ff4d61',true);foe.kick={until:G.t+0.14,ang};
      if(c===G.player||foe===G.player)shake(5,0.15);};
    dash(c,ang,len,1900,{kind:'R',onTick:()=>{if(!first&&dist(c,foe)<c.r+foe.r+30)cut1();},onEnd:()=>{if(!first)cut1();
      c.castAnim={start:G.t,W:0.12,kind:'rCut'};
      beginCast(c,0.12,ang+PI,()=>{if(foe.alive){dealDamage(c,foe,a.cut(c,r)+a.miss(r)*(foe.maxHp-foe.hp),'phys',{force:true});impact(foe,'#ff4d61',true);
        foe.kick={until:G.t+0.14,ang:ang+PI};if(c===G.player||foe===G.player){shake(7,0.2);G.hitStop=0.07;}}
        slash(foe.x,foe.y,ang+PI*0.25,'#ff4d61');slash(foe.x,foe.y,ang-PI*0.25,'#ff4d61');ring(foe.x,foe.y,10,120,'#ff4d61',0.4);});}});
    return true;}};
