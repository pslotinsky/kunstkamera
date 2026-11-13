/* Flame front, textured char and final ash fade. The hand is a separate layer. */
function animatePaperBurn(paper) {
  return new Promise(resolve=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){resolve();return;}
    const canvas=document.createElement('canvas');
    canvas.className='burn-canvas';canvas.width=1085;canvas.height=890;
    paper.appendChild(canvas);paper.classList.add('burning');
    const ctx=canvas.getContext('2d');
    if(!ctx){resolve();return;}
    const mask=new Image();mask.src='assets/paper.webp';
    const texture=document.createElement('canvas');texture.width=128;texture.height=128;
    const t=texture.getContext('2d');
    t.fillStyle='#3b332d';t.fillRect(0,0,128,128);
    // Deterministic fine ash grain; no pure-black rectangle.
    for(let i=0;i<2200;i++){
      const x=(i*73)%128,y=(i*47+Math.floor(i/128)*13)%128;
      t.fillStyle=i%3===0?'rgba(177,159,132,.20)':'rgba(21,17,15,.25)';
      t.fillRect(x,y,i%5===0?3:1,1);
    }
    const pattern=ctx.createPattern(texture,'repeat');
    let start;
    const duration=2100;
    function frame(now){
      if(!paper.isConnected){resolve();return;}
      start??=now;
      const progress=Math.min(1,(now-start)/duration);
      const burn=Math.min(1,progress/.68);
      const front=910-burn*960;
      const time=(now-start)/1000;
      const edge=x=>front+Math.sin(x*.029+time*6)*12+Math.sin(x*.097-time*9)*6;
      ctx.clearRect(0,0,1085,890);
      ctx.beginPath();ctx.moveTo(0,890);
      for(let x=0;x<=760;x+=5)ctx.lineTo(x,edge(x));
      ctx.lineTo(760,890);ctx.closePath();
      ctx.fillStyle=pattern;ctx.fill();
      // Mask char to the full paper silhouette, including the area under the thumb.
      if(mask.complete&&mask.naturalWidth){
        ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0,1085,890);
        ctx.globalCompositeOperation='source-over';
      }
      if(burn<1){
        ctx.save();
        const heat=ctx.createLinearGradient(0,front-60,0,front+24);
        heat.addColorStop(0,'rgba(244,110,22,0)');
        heat.addColorStop(.4,'rgba(255,158,38,.35)');
        heat.addColorStop(.74,'rgba(255,204,91,.95)');
        heat.addColorStop(.9,'rgba(235,90,17,.9)');
        heat.addColorStop(1,'rgba(99,43,20,0)');
        ctx.beginPath();ctx.moveTo(45,edge(45)+20);
        for(let x=45;x<746;x+=5){
          const tongue=Math.max(0,Math.sin(x*.13+time*16))*32;
          ctx.lineTo(x,edge(x)-tongue-12);
        }
        ctx.lineTo(746,front+28);ctx.lineTo(45,front+28);ctx.closePath();
        ctx.fillStyle=heat;ctx.shadowColor='#ff7828';ctx.shadowBlur=12;ctx.fill();
        ctx.shadowBlur=0;
        ctx.beginPath();
        for(let x=45;x<746;x+=5){if(x===45)ctx.moveTo(x,edge(x));else ctx.lineTo(x,edge(x));}
        ctx.strokeStyle='#dc8b3c';ctx.lineWidth=2;ctx.stroke();
        for(let i=0;i<16;i++){
          const x=45+(i*47+time*19)%690,y=edge(x)-((time*53+i*17)%95);
          ctx.fillStyle='rgba(239,150,61,.65)';ctx.fillRect(x,y,1.5,2.5);
        }
        ctx.restore();
      }
      // Keep the char visible briefly before the whole sheet disintegrates.
      paper.style.opacity=progress>.83?String((1-progress)/.17):'1';
      if(progress<1)requestAnimationFrame(frame);else resolve();
    }
    // Decode before starting so the alpha mask is available on the first frame.
    mask.decode().catch(()=>{}).then(()=>requestAnimationFrame(frame));
  });
}
