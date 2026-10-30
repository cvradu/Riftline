const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.goto('file://'+process.cwd()+'/site/index.html');await pg.waitForTimeout(900);
 console.log(await pg.evaluate(()=>{const out=[];const strip=s=>s.replace(/<br>/g,' / ').replace(/<[^>]+>/g,'');
   for(const key of ['cora','shade','viktor','blackjack','marty']){let c;try{c=window.__mk(key,0,false);}catch(e){out.push(key+' makeChamp ERR '+e.message);continue;}
     c.level=6;const d=c.def;out.push(`## ${d.fullName||d.name} — ${d.role}, ${d.reach}, ${d.resource}`);
     try{out.push('P '+d.passive.name+': '+strip(d.passive.desc(c)));}catch(e){out.push('P ERR '+e.message);}
     for(const k of ['Q','E','RMB','R']){const a=d.ab[k];try{out.push(`${k} ${a.name} [cd ${a.cd.join('/')}]: `+strip(a.desc(c,1,a)));}catch(e){out.push(k+' ERR '+e.message);}}
     out.push('SPACE '+d.dash.name+': '+d.dash.desc);}
   return out.join('\n');}));
 console.log('errors',errs);await b.close();})();
