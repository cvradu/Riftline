const src=require('fs').readFileSync('/home/user/riftline/index.html','utf8');
const m=src.match(/const Math=\(\(\)=>\{[\s\S]*?return o;\}\)\(\);/)[0].replace('const Math=','const DM=');
eval(m+';globalThis.DM=DM;');
let worst={sin:0,cos:0,atan2:0,atan:0};
for(let i=0;i<200000;i++){const x=(Math.random()-0.5)*40,y=(Math.random()-0.5)*4000,z=(Math.random()-0.5)*4000;
  worst.sin=Math.max(worst.sin,Math.abs(DM.sin(x)-Math.sin(x)));worst.cos=Math.max(worst.cos,Math.abs(DM.cos(x)-Math.cos(x)));
  worst.atan2=Math.max(worst.atan2,Math.abs(DM.atan2(y,z)-Math.atan2(y,z)));worst.atan=Math.max(worst.atan,Math.abs(DM.atan(y/37)-Math.atan(y/37)));}
console.log('max abs error vs native',worst);
console.log('edge cases',DM.atan2(0,0),DM.atan2(1,0),DM.atan2(-1,0),DM.atan2(0,-1),DM.atan2(0,1),DM.sin(0),DM.cos(0),DM.sin(Math.PI/2),DM.hypot(3,4),DM.hypot(1,2,2),DM.PI,DM.max(1,5),DM.round(2.5),DM.random()<1);
let t=performance.now(),a=0;for(let i=0;i<2e6;i++)a+=DM.sin(i*0.001);const d1=performance.now()-t;t=performance.now();for(let i=0;i<2e6;i++)a+=Math.sin(i*0.001);console.log('2M sin: ours',d1.toFixed(0),'ms native',(performance.now()-t).toFixed(0),'ms');
