const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const R=window.__riftline;document.querySelector('.card[data-k="shade"]').click();document.querySelector('#optFoe button[data-v="viktor"]').click();document.querySelector('.mapcard[data-v="lane"]').click();R.newGame();const G=R.G;G.autoPlayer=true;
   const v=G.bot,s=G.player,out=[];let alive=true,grabs=0,lastArm=null,trans=0,lastForm='human';const modes={};
   for(let i=0;i<60*50&&!G.over;i++){R.tick(1/60);if(G.t>38&&i%20===0)out.push(`t=${G.t.toFixed(1)} V x ${v.x|0} y ${v.y|0} ${v.form||"human"} ${v.mode} hp ${v.hp|0} dash ${v.dash?v.dash.kind:"-"} in ${v.input.mx.toFixed(2)},${v.input.my.toFixed(2)} vis ${!!(s.alive&&!(s.stealthT>0)&&!s.hidden)} | S x ${s.x|0} y ${s.y|0} hidden ${s.hidden} stealth ${(s.stealthT||0).toFixed(1)} | tgt ${G.towers[0].target===v}`);modes[(v.form||'human')+':'+v.mode]=(modes[(v.form||'human')+':'+v.mode]||0)+1;
     if(v.arm&&!lastArm)grabs++;lastArm=v.arm;if(v.form==='monster'&&lastForm!=='monster'){trans++;out.push(`t=${G.t|0} transform (${v.uncaging&&G.t-v.uncaging<2?'R':'passive'}) hp ${v.hp|0}/${v.maxHp|0} dist to Shade ${Math.round(Math.hypot(v.x-s.x,v.y-s.y))} x ${v.x|0}`);}lastForm=v.form;
     if(alive&&!v.alive)out.push(`t=${G.t|0} DIED x ${v.x|0} form ${lastForm} mode ${v.mode} | shade hp ${s.hp|0}/${s.maxHp|0} lvl ${v.level} vs ${s.level} | red tower dist ${Math.round(Math.hypot(v.x-G.towers[0].x,v.y-G.towers[0].y))}`);alive=v.alive;}
   out.push(`grabs ${grabs}, transforms ${trans}, kills V ${v.kills} S ${s.kills}`);out.push(JSON.stringify(Object.fromEntries(Object.entries(modes).map(([k,n])=>[k,(n/60)|0]))));return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
