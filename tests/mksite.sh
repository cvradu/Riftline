#!/bin/sh
# rebuild the test wrapper from the current game file
D=/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/site
cp /home/user/riftline/assets/*.webp $D/assets/
python3 - <<'PY'
src=open('/home/user/riftline/index.html').read()
if 'window.__riftline' not in src:
    src=src.replace("let last=performance.now()","window.__riftline={get G(){return G;},newGame,tick};window.__spr=champSprite;window.__tc=tryCast;window.__COL=COL;\nlet last=performance.now()",1)
if 'window.__COL' not in src:
    src=src.replace('window.__tc=tryCast;','window.__tc=tryCast;window.__COL=COL;window.__NET=NET;window.__P=P;window.__VIEW=VIEW;window.__VA=VIK_ARM;window.__laneOk=(x,y)=>laneInside(x,y)||laneEdge(x,y).d<3;',1)
if 'window.__LN' not in src:
    src=src.replace('window.__tc=tryCast;','window.__tc=tryCast;window.__K=killUnit;window.__noIntro=window.__noIntro!==false;window.__mk=makeChamp;window.__CH=CH;window.__dd=dealDamage;window.__sa=startAttack;window.__ms=msOf;window.__td=tryDash;window.__LN={LNAV,lnavBuild,laneClear,lnavPlan,laneSteer,clampWalk,laneInside,laneEdge,LANE_POLY,steer};',1)
open('/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/site/index.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+src+'</body></html>')
PY
python3 - <<'PZ'
d='/tmp/claude-0/-home-user/1acc1707-8631-5d55-91c1-3d0e194ab3a5/scratchpad/site/'
s=open(d+'index.html').read()
open(d+'zoom.html','w').write(s.replace('SCALE=Math.min(VH/800,VW/1320);','SCALE=Math.min(VH/800,VW/1320)*(window.__zoom||1);',1))
PZ
