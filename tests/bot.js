function botThink(c,dt){
  const inp=c.input;inp.mx=0;inp.my=0;inp.attack=false;inp.attackTarget=null;
  if(!c.alive)return;
  botSkillPoints(c);
  const foe=G.champs.find(u=>u!==c),A=c.def.ab,aria=c.key==='aria';
  const vis=foe.alive&&targetable(foe);
  if(vis)c.mem={x:foe.x,y:foe.y,t:G.t};
  const dir=c.team===BLUE?1:-1,myT=G.towers[c.team],foeT=G.towers[1-c.team];
  const hpP=c.hp/c.maxHp,fP=foe.hp/foe.maxHp,d=vis?dist(c,foe):1e9;
  c.strafeT=(c.strafeT||0)-dt;if(c.strafeT<=0){c.strafeT=rnd(0.35,0.9);c.strafe=Math.random()<0.5?-1:1;}
  const can=k=>{const r=c.ranks[k];return r&&c.cds[k]<=0&&c.res>=A[k].cost[r-1]&&!c.cast&&!c.dash&&c.stunT<=0;};
  const cast=(k,x,y)=>{if(G.t<(c.nextCast||0)||!can(k))return false;if(tryCast(c,k,x,y)==='ok'){c.nextCast=G.t+0.2;return true;}return false;};
  const dashTo=(x,y)=>{if(G.t<(c.nextCast||0)||c.dashCd>0||c.cast||c.dash||c.stunT>0)return false;if(tryDash(c,x,y)==='ok'){c.nextCast=G.t+0.2;return true;}return false;};
  const away=(len)=>{const fx=vis?foe.x:c.x+dir*100,fy=vis?foe.y:c.y;let vx=c.x-fx,vy=c.y-fy;const l=hyp(vx,vy)||1;vx=vx/l-dir*0.9;vy=vy/l;const l2=hyp(vx,vy)||1;return{x:c.x+vx/l2*len,y:clamp(c.y+vy/l2*len,LANE_TOP+60,LANE_BOT-60)};};
  if(hpP<0.3)c.retreat=true;if(c.retreat&&hpP>0.85)c.retreat=false;
  const burst=vis?estBurst(c,foe):0,killable=vis&&burst>=foe.hp;
  const foeSafe=vis&&foeT.alive&&dist(foe,foeT)<=foeT.range+150;
  const tanked=foeT.target&&foeT.target.kind==='minion';
  const diveOk=!foeSafe||(tanked&&hpP>0.55&&burst>=foe.hp*1.25);
  const towerOnMe=foeT.alive&&foeT.target===c;
  const reach=c.range+c.r+foe.r;
  let mode='farm';
  if(c.retreat&&!(killable&&d<450))mode='retreat';
  else if(towerOnMe&&!(killable&&d<300))mode='tower';
  else if(killable&&d<900&&diveOk)mode='allin';
  else if(vis&&d<700&&hpP>=fP-0.08&&!foeSafe)mode='trade';
  c.mode=mode;
  let goal=null,atk=null;
  const myEdgeRange=u=>edge(c,u)<=c.range;
  const crowd=G.minions.filter(m=>m.alive&&m.team!==c.team&&dist(m,c)<AGGRO_R).length;
  const throwQ=()=>{if(!vis)return false;const sp=aria?1600:1750,rg=aria?880:900;if(d>rg)return false;const p=predict(c,foe,sp,aria?0.2:0.12);return cast('Q',p.x,p.y);};
  const closeIn=()=>{if(d>reach+70&&d<(aria?400:350))dashTo(foe.x,foe.y);};
  const melee=()=>{
    if(aria){if(d<380)cast('E',0,0);if(edge(c,foe)<=300)cast('RMB',foe.x,foe.y);}
    else{if(d<c.r+foe.r+280)cast('E',0,0);}
  };
  if(mode==='retreat'){
    const rel=G.relics.find(r=>r.active&&dist(c,r)<900&&(r.x-c.x)*dir<200);
    goal=rel?{x:rel.x,y:rel.y}:{x:FOUNT[c.team].x,y:MIDY};
    if(vis&&d<450){
      if(!(!aria&&cast('RMB',0,0))){const a=away(350);dashTo(a.x,a.y);}
      if(aria&&d<380)cast('E',0,0);
    }
  }else if(mode==='tower'){
    goal={x:foeT.x-dir*(foeT.range+c.r+180),y:c.y};
  }else if(mode==='allin'){
    closeIn();throwQ();melee();
    if(aria){if(c.ranks.R&&d<240)cast('R',0,0);}
    else{if(c.ranks.R&&edge(c,foe)<=650)cast('R',0,0);if(d>500&&c.dashCd>0)cast('RMB',0,0);}
    if(myEdgeRange(foe))atk=foe;
    goal={x:foe.x,y:foe.y};
  }else if(mode==='trade'){
    throwQ();
    if(crowd<3||hpP>fP+0.2){
      const marked=foe.shadeMark&&foe.shadeMark.until>G.t;
      if(aria||marked)melee();
      if(aria&&c.ranks.R&&d<240&&fP<0.45)cast('R',0,0);
      if(myEdgeRange(foe))atk=foe;
      const pa=angTo(c,foe.x,foe.y);
      goal=myEdgeRange(foe)||hpP>fP+0.15?{x:foe.x,y:foe.y}:d<reach+120?away(200):{x:c.x-Math.sin(pa)*c.strafe*140,y:c.y+Math.cos(pa)*c.strafe*140};
    }else goal=away(220);
  }
  if(mode==='farm'){
    const em=G.minions.filter(m=>m.alive&&m.team!==c.team&&dist(m,c)<1400);
    const am=G.minions.filter(m=>m.alive&&m.team===c.team);
    const wu=1/asOf(c)*c.def.base.windup;
    let lh=null;
    for(const m of em){if(edge(c,m)>c.range+30)continue;
      const dmg=c.ad*physMult(c,m),inc=incoming(m,wu,c.team);if(m.hp-inc<=dmg&&(!lh||m.hp<lh.hp))lh=m;}
    const foeAround=vis&&d<1300;
    if(lh)atk=lh;
    else if(em.length){
      const push=em.filter(m=>myEdgeRange(m)&&m.hp-incoming(m,1.2,c.team)>c.ad*2.2).sort((a,b)=>a.hp-b.hp)[0];
      if(push&&!foeAround)atk=push;
      if(vis&&myEdgeRange(foe)&&crowd<3&&!em.some(m=>m.hp<c.ad*1.6&&myEdgeRange(m)))atk=foe;
    }
    if(!em.some(m=>dist(m,foeT)<foeT.range+100)&&foeT.alive&&myEdgeRange(foeT)&&am.some(m=>dist(m,foeT)<foeT.range))atk=atk||foeT;
    if(vis&&d<850&&c.res>(aria?60:150))throwQ();
    let gx;
    if(em.length){const near=em.reduce((a,b)=>dist(a,c)<dist(b,c)?a:b);const ref=lh||near;gx=ref.x-dir*(c.r+ref.r+c.range*0.6);}
    else if(am.length){const front=am.reduce((a,b)=>(a.x-b.x)*dir>0?a:b);gx=front.x-dir*90;
      if(am.some(m=>dist(m,foeT)<foeT.range)&&foeT.alive)gx=foeT.x-dir*(foeT.r+c.range*0.8);}
    else gx=myT.x+dir*260;
    const limit=foeT.alive?foeT.x-dir*(foeT.range+c.r+60):(dir>0?W:0);
    const towerOk=tanked&&am.filter(m=>dist(m,foeT)<foeT.range).length>=2;
    if(!towerOk&&(gx-limit)*dir>0)gx=limit;
    if(vis){const threat=hpP<fP+0.05?320:0;if(d<threat&&(gx-(foe.x-dir*threat))*dir>0)gx=foe.x-dir*threat;}
    if(!vis&&c.mem&&G.t-c.mem.t<2&&dist(c,c.mem)<700)gx=c.x-dir*150;
    goal={x:gx,y:MIDY+c.strafe*110+Math.sin(G.t*0.7+c.id)*60};
  }
  if(c.spin){atk=null;if(vis&&d<700&&mode!=='retreat')goal={x:foe.x,y:foe.y};}
  // dodge overrides movement
  const dg=findDodge(c);
  if(dg){
    if(dg.urgent&&(hpP<0.6||mode==='allin'||mode==='trade'))dashTo(c.x+dg.x*300,c.y+dg.y*300);
    inp.mx=dg.x;inp.my=dg.y;atk=null;
  }else if(goal){
    const gy=clamp(goal.y,LANE_TOP+c.r+10,LANE_BOT-c.r-10);const vx=goal.x-c.x,vy=gy-c.y,l=hyp(vx,vy);
    if(l>20){inp.mx=vx/l;inp.my=vy/l;}
  }
  if(atk&&edge(c,atk)<=c.range&&targetable(atk)){inp.attack=true;inp.attackTarget=atk;inp.ax=atk.x;inp.ay=atk.y;}
  else if(vis&&d<1200){inp.ax=foe.x;inp.ay=foe.y;}
  else{inp.ax=c.x+inp.mx*200+dir*10;inp.ay=c.y+inp.my*200;}
}
