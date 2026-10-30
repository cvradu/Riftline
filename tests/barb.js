  if(key==='aria'){
    const axes=()=>{for(const s of [-1,1]){const hx=fx*12+px*s*16,hy=-38+fy*5;
      g.strokeStyle='#d9a27c';g.lineWidth=6;g.beginPath();g.moveTo(px*s*14,-54);g.lineTo(hx,hy);g.stroke();
      g.save();g.translate(hx,hy);g.rotate(fa+s*(0.5-wind*1.4));
      g.strokeStyle='#6b4a2b';g.lineWidth=4;g.beginPath();g.moveTo(-6,0);g.lineTo(30,0);g.stroke();
      const o=s;g.fillStyle='#c9d1d8';g.beginPath();g.moveTo(20,0);g.lineTo(26,-15*o);g.quadraticCurveTo(38,-8*o,34,5*o);g.lineTo(26,3*o);g.closePath();g.fill();
      g.strokeStyle='#eef3f6';g.lineWidth=1.5;g.beginPath();g.moveTo(26,-15*o);g.quadraticCurveTo(38,-8*o,34,5*o);g.stroke();
      g.restore();}};
    const braid=()=>{g.fillStyle='#a8441f';for(let i=0;i<3;i++){g.beginPath();g.ellipse(-fx*(10+i*3),-64+i*7,4.5,4,0,0,TAU);g.fill();}};
    if(away)axes();
    if(!away)braid();
    g.fillStyle='#5a4030';g.fillRect(-10+sw*3,-24,8,24);g.fillRect(2-sw*3,-24,8,24);
    g.fillStyle='#8a6a4a';g.fillRect(-11+sw*3,-8,10,8);g.fillRect(1-sw*3,-8,10,8);
    g.fillStyle='#6e2e22';g.beginPath();g.moveTo(-15,-20);g.lineTo(15,-20);g.lineTo(17,-32);g.lineTo(-17,-32);g.closePath();g.fill();
    g.fillStyle='#d9a27c';g.beginPath();g.moveTo(-15,-30);g.lineTo(15,-30);g.lineTo(16,-58);g.lineTo(-16,-58);g.closePath();g.fill();
    g.fillStyle='#c48c66';g.fillRect(-1+fx*3,-54,2,20);
    g.strokeStyle='#3a2a1e';g.lineWidth=4;g.beginPath();g.moveTo(-14,-56);g.lineTo(14,-32);g.stroke();
    g.fillStyle='#3a2a1e';g.fillRect(-16,-34,32,5);g.fillStyle='#c9a85a';g.fillRect(-4,-35,8,7);
    g.fillStyle='#8a6a4a';g.beginPath();g.ellipse(0,-57,21,8,0,0,TAU);g.fill();
    g.fillStyle='#a3825e';for(let i=-2;i<=2;i++){g.beginPath();g.arc(i*8,-59,4,0,TAU);g.fill();}
    if(away)braid();
    g.fillStyle='#c8562e';g.beginPath();g.arc(0,-71,11.5,0,TAU);g.fill();
    if(!away){g.fillStyle='#d9a27c';g.beginPath();g.arc(fx*3,-68,8,0,TAU);g.fill();
      g.strokeStyle='#b82a2a';g.lineWidth=2;g.beginPath();g.moveTo(fx*3-px*7,-70);g.lineTo(fx*3+px*7,-70);g.stroke();
      g.fillStyle='#1e1410';g.beginPath();g.arc(fx*6+px*3,-70,1.5,0,TAU);g.arc(fx*6-px*3,-70,1.5,0,TAU);g.fill();}
    if(!away)axes();
