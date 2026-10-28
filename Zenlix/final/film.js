/* Zenlix V2: deterministic editorial animation; shared preview/export timebase. */
(() => {
  'use strict';
  const canvas=document.getElementById('canvas'),g=canvas.getContext('2d');
  const W=1920,H=1080,C={bg:'#101114',panel:'#1c1e23',ink:'#f7f5f1',muted:'#a5a6ad',line:'#34363e',orange:'#ff7900',red:'#ff5265',green:'#47d7a1'};
  const logo=new Image();logo.src='../assets/zenlix-logo.png';
  const clamp=(p,a=0,b=1)=>Math.min(b,Math.max(a,p)),ease=p=>1-(1-clamp(p))**3;
  const smooth=p=>{p=clamp(p);return p*p*(3-2*p);},mix=(a,b,p)=>a+(b-a)*p;
  let config,scenes=[],captions=[],audioStatus;
  function box(x,y,w,h,r=0,fill=C.panel,stroke=null,lw=1.5){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}}
  function txt(s,x,y,size=40,color=C.ink,weight=700,align='right',dir='rtl'){g.font=`${weight} ${size}px Cairo,sans-serif`;g.direction=dir;g.textAlign=align;g.textBaseline='middle';g.fillStyle=color;g.fillText(s,x,y);}
  function line(x,y,x2,y2,color=C.line,width=2){g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke();}
  function circle(x,y,r,fill,stroke,width=2){g.beginPath();g.arc(x,y,r,0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
  function reveal(t,d,fn,x=0,y=35){const p=ease(t/d);g.save();g.globalAlpha*=p;g.translate((1-p)*x,(1-p)*y);fn();g.restore();}
  function cue(kind,index,fallback){const item=config.motionCues.find(q=>q.kind===kind);return item?clamp(item.t-scenes[index].start,0,scenes[index].end-scenes[index].start):fallback;}
  function brand(x,y,w){g.drawImage(logo,x,y,w,w*logo.height/logo.width);}
  function glow(x,y,r,color='#ff79002b'){const grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(1,'#ff790000');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);}
  function orbit(x,y,rx,ry,t,alpha=.5){g.save();g.translate(x,y);g.rotate(-.12);g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.strokeStyle=`rgba(255,121,0,${alpha})`;g.lineWidth=2;g.shadowColor=C.orange;g.shadowBlur=13;g.stroke();const a=t*.95;circle(Math.cos(a)*rx,Math.sin(a)*ry,5,C.orange);g.restore();}
  function icon(kind,x,y,s=40,color=C.ink){g.save();g.translate(x,y);g.scale(s/48,s/48);g.strokeStyle=color;g.fillStyle=color;g.lineWidth=3;g.lineCap='round';g.lineJoin='round';
    if(kind==='phone'){g.beginPath();g.moveTo(-13,-20);g.lineTo(-21,-12);g.bezierCurveTo(-24,-3,-1,23,12,22);g.lineTo(20,13);g.lineTo(10,3);g.lineTo(3,10);g.bezierCurveTo(-3,7,-8,1,-10,-5);g.lineTo(-4,-11);g.closePath();g.stroke();}
    if(kind==='person'){circle(0,-11,10,null,color);g.beginPath();g.arc(0,24,20,Math.PI,0);g.stroke();}
    if(kind==='check'){g.beginPath();g.moveTo(-17,0);g.lineTo(-5,12);g.lineTo(20,-15);g.stroke();}
    if(kind==='close'){line(-13,-13,13,13,color,4);line(13,-13,-13,13,color,4);}
    if(kind==='clock'){circle(0,0,21,null,color);line(0,0,0,-12,color,3);line(0,0,11,6,color,3);}
    if(kind==='bag'){box(-21,-12,42,39,4,null,color);g.beginPath();g.arc(0,-12,10,Math.PI,0);g.stroke();line(-7,6,7,6,color,3);}
    if(kind==='play'){g.beginPath();g.moveTo(-8,-14);g.lineTo(15,0);g.lineTo(-8,14);g.closePath();g.fill();}
    if(kind==='star'){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?10:23;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.fill();}
    if(kind==='shop'){box(-24,-6,48,31,3,null,color);line(-28,-6,28,-6,color,3);g.beginPath();g.moveTo(-28,-6);g.lineTo(-22,-22);g.lineTo(22,-22);g.lineTo(28,-6);g.stroke();box(-7,8,14,17,1,null,color);}
    if(kind==='chart'){line(-23,23,23,23,color,3);[-14,0,14].forEach((v,i)=>line(v,20,v,8-i*14,color,7));}
    g.restore();
  }
  function arrow(x,y,end,p=1,color=C.orange){const to=mix(x,end,ease(p));line(x,y,to,y,color,3);if(p>.02){line(to-12,y-9,to,y,color,3);line(to-12,y+9,to,y,color,3);}}
  function meta(index,light=false){const color=light?'#72727b':C.muted;txt(`${String(index+1).padStart(2,'0')} / 08`,82,1040,18,color,400,'left','ltr');txt('zenlix.org',1838,1040,20,color,400,'right','ltr');}
  function base(t,index,{light=false,orange=false,hideBrand=false}={}){box(0,0,W,H,0,orange?C.orange:light?C.ink:C.bg);if(!light&&!orange)glow(1050,560,1000,'#ff790014');if(!hideBrand){if(light)box(75,28,225,77,10,C.bg);brand(82,32,208);}meta(index,light||orange);}
  function demo(light=false){box(80,867,214,37,5,light?'#e8e6e1':'#202126',light?'#d8d6d0':C.line);txt('واجهة وبيانات توضيحية',187,886,16,light?'#777770':C.muted,400,'center');}
  function wave(x,y,w,t,color=C.orange,height=35){for(let i=0;i<92;i++){const h=height*(.12+Math.abs(Math.sin(i*.73)*Math.cos(i*.27))*.88);line(x+i*w/92,y-h,x+i*w/92,y+h,i/92<(t*.12)%1?color:'#676b77',w<250?1.5:4);}}
  function phone(t){const rejected=t>=cue('cancel',0,1.65),p=ease((t-cue('rival',0,3.1))/.7),x=mix(465,360,p),shake=rejected?0:Math.sin(t*70)*1.3;g.save();g.translate(x+shake,505);g.rotate(mix(-.15,-.05,p));const z=1+.055*Math.sin(clamp(t/6)*Math.PI);g.scale(z,z);g.shadowColor='#000';g.shadowBlur=75;g.shadowOffsetY=28;
    const edge=g.createLinearGradient(-181,0,181,0);edge.addColorStop(0,'#d5c5b6');edge.addColorStop(.15,'#3e3b39');edge.addColorStop(.8,'#726052');edge.addColorStop(1,'#c3a288');box(-181,-354,362,708,51,edge);g.shadowBlur=0;g.shadowOffsetY=0;box(-174,-347,348,694,47,'#040506');const screen=g.createLinearGradient(-160,-330,160,330);screen.addColorStop(0,'#30343b');screen.addColorStop(1,'#0b0e13');box(-164,-337,328,674,40,screen);box(-66,-327,132,27,14,'#020304');txt('9:41',-130,-302,14,C.ink,700,'left','ltr');line(108,-302,126,-302,C.ink,3);
    circle(0,-164,49,'#ffffff0c','#ffffff1a');icon('person',0,-164,50);txt('عميل جديد',0,-71,31,C.ink,700,'center');txt(rejected?'المكالمة اترفضت':'مكالمة واردة',0,-17,21,rejected?C.red:C.muted,400,'center');txt('010 2345 6789',0,40,23,C.ink,400,'center','ltr');
    if(!rejected){for(let i=0;i<3;i++){const phase=(t*1.5+i/3)%1;circle(0,200,38+phase*48,null,`rgba(71,215,161,${(1-phase)*.35})`);}circle(0,200,39,C.green);icon('phone',0,200,34,'#101114');}
    else{circle(0,175,58,'#ff526514',C.red,3);icon('phone',-6,180,45,C.red);icon('close',35,135,22,C.red);txt('تم الإنهاء بواسطة الموظف',0,268,16,C.red,700,'center');}
    box(-56,321,112,4,2,'#ffffff77');g.restore();
  }
  function hook(t){base(t,0);orbit(420,620,470,150,t,.35);phone(t);
    const cancelAt=cue('cancel',0,1.65),rivalAt=cue('rival',0,3.1),phase=t<cancelAt?0:t<rivalAt?1:2,local=t-[0,cancelAt,rivalAt][phase];
    const x=1810;reveal(local+.08,.28,()=>{
      if(phase===0){txt('عميلك بيتصل.',x,353,121,C.ink,800);txt('أوردر ممكن يضيع.',x,510,76,C.muted,700);}
      if(phase===1){txt('وحد كنسل',x,347,123,C.ink,800);txt('عليه!',x,507,145,C.red,800);}
      if(phase===2){txt('هتلحقه…',x,337,117,C.ink,800);txt('ولا يروح لمنافسك؟',x,493,90,C.orange,800);}
    },0,26);
    if(phase===2){reveal(t-rivalAt-.3,.6,()=>{const yy=747;circle(1035,yy,46,C.panel,C.line);icon('person',1035,yy,39);arrow(1120,yy,1540,(t-rivalAt-.4)/1.3);circle(1655,yy,59,'#ff790014','#ff790050');icon('shop',1655,yy,50,C.orange);txt('مطعم منافس',1655,yy+103,23,C.muted,700,'center');});}
    if(t>cancelAt&&t<cancelAt+.39){const p=(t-cancelAt)/.39;g.save();g.globalAlpha=(1-p)*.8;line(100,820-p*50,840,190-p*50,C.red,7);g.restore();}
  }
  function brandScene(t){base(t,1,{orange:true,hideBrand:true});const p=ease(t/.8);g.save();g.translate(960,473);g.rotate((1-p)*.09);g.scale(.88+.12*p,.88+.12*p);g.shadowColor='#a83e0077';g.shadowBlur=65;g.shadowOffsetY=40;box(-600,-225,1200,450,36,C.bg,'#ffe5c299',2);g.shadowBlur=0;g.shadowOffsetY=0;brand(-500,-185,1000);g.restore();
    for(let i=0;i<4;i++){g.save();g.globalAlpha=.13;g.beginPath();g.ellipse(960,820+i*30,810+i*70,130+i*20,0,0,Math.PI*2);g.strokeStyle='#fff';g.lineWidth=2;g.stroke();g.restore();}
    reveal(t-.7,.6,()=>txt('كل مكالمة. قدّام عينك.',960,805,78,'#15120e',800,'center'));
  }
  function live(t){base(t,2);reveal(t+.15,.5,()=>{txt('اعرف مين.',1805,206,86,C.ink,800);txt('في نفس اللحظة.',1805,317,83,C.orange,800);},0,25);
    box(84,169,185,48,24,'#ff526517','#ff52653a');circle(233,193,6,C.red);txt('حدث مباشر',211,194,21,C.red,700);
    const cam=1+.018*Math.sin(t*.7);g.save();g.translate(1000,614);g.scale(cam,cam);g.translate(-1000,-614);
    reveal(t,.6,()=>{
      box(930,404,875,406,24,'#202229','#494b55');box(958,433,819,84,13,'#c92840');icon('phone',1714,475,36);txt('تم رفض المكالمة',1652,475,38,C.ink,800);
      txt('العميل: عميل جديد',1737,560,29,C.ink,700);txt('12:42:08',986,560,29,C.muted,400,'left','ltr');
      const focusAt=cue('employee-focus',2,3.3),focus=clamp((t-focusAt)/.8);box(963,614,810,151,14,'#17191f',focus?C.orange:C.line,focus?3:1.5);icon('person',1705,685,49,C.orange);txt('أحمد محمد',1627,669,45,C.ink,800);txt('الموظف الذي رفض المكالمة',1627,723,24,C.muted,400);
      if(focus>0){const progress=((t-focusAt)*.35)%1;line(990,779,990+740*progress,779,C.orange,2);}
    },85,0);
    const items=[['مكالمة واردة','12:42:00',C.green],['رفض بواسطة الموظف','12:42:08',C.red],['مطلوب متابعة','الآن',C.orange]];
    items.forEach(([label,time,color],i)=>reveal(t-.3-i*.35,.5,()=>{const yy=463+i*132;if(i<2)line(446,yy+16,446,yy+116,C.line,3);circle(446,yy,11,color);txt(label,850,yy-4,31,color,700);txt(time,850,yy+41,21,C.muted,400,'right',i<2?'ltr':'rtl');}));
    g.restore();
    reveal(t-cue('timeline-focus',2,6.7),.5,()=>{box(485,802,800,50,8,'#ff790014');txt('المكالمة + الموظف + التوقيت',885,828,25,C.orange,700,'center');});demo();
  }
  function customerCard(x,y,w,label,status,color,progress=1){box(x,y,w,150,18,'#202229','#43454f');circle(x+w-67,y+54,27,'#ffffff08',C.line);icon('person',x+w-67,y+54,26);txt(label,x+w-116,y+46,25,C.ink,700);txt(status,x+w-116,y+99,22,color,700);box(x+22,y+29,58,58,12,color+'15',color+'55');icon(color===C.green?'check':'phone',x+51,y+58,27,color);if(progress<1){g.save();g.globalAlpha=1-progress;line(x+20,y+134,x+w-20,y+134,color,2);g.restore();}}
  function recover(t){base(t,3);const switchAt=Math.max(2.8,cue('callback',3,4)-.5),resultAt=Math.max(switchAt+1.8,cue('contact-result',3,8.2)),p=ease((t-switchAt)/.8);
    txt(t<switchAt?'عملاء ماكملوش؟':'الحق عميلك',1808,207,90,C.ink,800);txt(t<switchAt?'لسه فيه فرصة.':'قبل المنافس.',1808,325,89,C.orange,800);
    if(t<switchAt+.8){g.save();g.globalAlpha=1-p;[['عميل 01','لم يتم الرد'],['عميل 02','مكالمة مرفوضة'],['عميل 03','انقطع الاتصال']].forEach(([n,s],i)=>reveal(t-.2-i*.2,.5,()=>customerCard(122+i*565,468,530,n,s,C.red),0,45));txt('قائمة واضحة للعملاء اللي محتاجين متابعة',960,738,37,C.muted,400,'center');g.restore();}
    if(t>=switchAt){g.save();g.globalAlpha=p;const yy=604,stages=[['phone','لم يتم الرد',C.red],['phone','اتصال متابعة',C.orange],['check','تم التواصل',C.green],['bag','فرصة أوردر جديد',C.orange]],shows=[switchAt,switchAt+.3,resultAt-.8,resultAt-.2];const xs=[249,725,1200,1675];xs.slice(0,-1).forEach((x,i)=>{line(x+90,yy,xs[i+1]-90,yy,C.line,2);arrow(x+90,yy,xs[i+1]-90,(t-shows[i+1])/.9,i===1?C.green:C.orange);});stages.forEach(([kind,label,color],i)=>{const show=ease((t-shows[i])/.6);g.save();g.globalAlpha*=show;const x=xs[i],z=1+.03*Math.sin(t*2+i);circle(x,yy,77*z,color+'10',color+'99',2);icon(kind,x,yy,54,color);txt(label,x,yy+139,29,color,700,'center');g.restore();});
      if(t>resultAt-.8){const px=mix(725,1200,ease((t-resultAt+.8)/1.2));circle(px,yy,9,C.green);}
      reveal(t-resultAt-.4,.6,()=>txt('افتح باب التواصل… قبل ما يقفل عندك.',960,832,31,C.muted,400,'center'));g.restore();}
    demo();
  }
  function quality(t){base(t,4,{light:true});const coaching=cue('coaching',4,4.5),progress=cue('progress',4,9),phase=t<coaching?0:t<progress?1:2,local=t-[0,coaching,progress][phase];
    txt('خدمة تقييم فريقك',1824,210,80,'#15161a',800);
    reveal(local+.1,.5,()=>{
      const words=[['قيّم.','كل مكالمة.'],['درّب.','على اللي ناقص.'],['طوّر.','للأحسن.']][phase];txt(words[0],654,437,132,C.orange,800);txt(words[1],654,588,73,'#15161a',800);
      box(780,333,1040,486,23,'#fff','#dfdcd6');
      if(phase===0){txt('تقييم جودة المكالمة',1776,379,35,'#24252b',800);for(let i=0;i<5;i++)icon('star',1740-i*51,446,33,C.orange);const labels=['سرعة الرد','أسلوب التعامل','فهم طلب العميل'];labels.forEach((s,i)=>{const yy=539+i*87;txt(s,1764,yy,27,'#55545c',700);box(825,yy+29,920,10,5,'#efede8');box(825,yy+29,920*[.78,.94,.84][i]*ease(local-.5-i*.25),10,5,C.orange);});}
      if(phase===1){txt('تقييم يتحوّل لتطوير',1776,379,35,'#24252b',800);box(820,437,960,105,12,'#eaf7ef');icon('check',1720,487,30,'#3a9a68');txt('نقطة قوة: أسلوب محترم مع العميل.',1660,488,30,'#327b56',700);box(820,569,960,105,12,'#fff0e1');icon('chart',1720,618,32,C.orange);txt('للتطوير: تأكيد الطلب قبل إنهاء المكالمة.',1660,619,29,'#9b4d08',700);reveal(local-.8,.6,()=>{box(1209,712,564,58,10,C.orange);txt('ملاحظات واضحة + تدريب موجّه',1491,741,27,'#21170f',800,'center');});}
      if(phase===2){txt('تطور أداء الموظف',1776,379,35,'#24252b',800);circle(1008,433,7,'#c6c4bf');txt('قبل التدريب',1031,433,20,'#77766f',400,'left');circle(1287,433,7,C.orange);txt('بعد التدريب',1310,433,20,'#77766f',400,'left');const xs=[1020,1330,1640],names=['وضوح الرد','التعامل','فهم الطلب'];xs.forEach((x,i)=>{const before=[.48,.64,.56][i],after=[.86,.92,.88][i],pp=ease(local/.9);box(x-57,713-180*before*pp,49,180*before*pp,5,'#cfcdc8');box(x+8,713-180*after*pp,49,180*after*pp,5,C.orange);txt(names[i],x,758,22,'#626169',700,'center');});line(877,714,1758,714,'#dfdcd6',2);}
    },phase===1?-30:0,phase===1?0:30);demo(true);
  }
  function toolMontage(t){base(t,5);const reporting=cue('reporting',5,3),assistant=cue('assistant',5,5.4),phase=t<reporting?0:t<assistant?1:2,local=t-[0,reporting,assistant][phase];
    const title=['اسمع التفاصيل.','شوف الصورة كاملة.','اسأل عن شغلك.'][phase];txt(title,1815,224,88,C.ink,800);
    reveal(local+.08,.4,()=>{
      box(170,376,1580,426,25,'#1b1d23','#454751');
      if(phase===0){txt('تسجيل المكالمة',1695,431,31,C.ink,700);circle(1625,585,54,'#ff790014','#ff790055');icon('play',1625,585,43,C.orange);wave(290,585,1180,local,C.orange,55);txt('00:28 / 03:12',1695,741,24,C.muted,400,'right','ltr');}
      if(phase===1){txt('الوارد والصادر والتقارير',1695,431,31,C.ink,700);for(let i=0;i<14;i++){const x=290+i*92,h=(80+Math.abs(Math.sin(i*.71))*150)*ease(local/.8);box(x,718-h,28,h,4,C.orange);box(x+32,718-h*.61,28,h*.61,4,'#6d707b');}line(275,721,1570,721,C.line);}
      if(phase===2){txt('مساعد Zenlix الذكي',1695,431,29,C.ink,700);box(700,485,999,73,13,'#303239');txt('مين أكتر موظف رد النهارده؟',1659,522,31,C.ink,700);reveal(local-.5,.45,()=>{brand(1450,592,170);txt('أحمد — 48 مكالمة مُجاب عنها اليوم.',1653,706,31,C.orange,700);});}
    },local<.4?80:0,0);demo();
  }
  function promise(t){base(t,6,{hideBrand:true});const stronger=cue('stronger',6,1),better=cue('better',6,2),phase=t<stronger?0:t<better?1:2,local=t-[0,stronger,better][phase],words=[['متابعة','أسرع.'],['فريق','أقوى.'],['خدمة','أحسن.']];
    g.save();g.globalAlpha=.15;for(let i=0;i<7;i++){const yy=220+i*105;line(50,yy,1800,yy-155,C.orange,2);}g.restore();
    reveal(local+.08,.25,()=>{const scale=1+.04*ease(local);g.save();g.translate(960,514);g.scale(scale,scale);txt(words[phase][0],0,-90,148,C.ink,800,'center');txt(words[phase][1],0,115,169,C.orange,800,'center');g.restore();},220,0);
  }
  function closing(t){base(t,7,{hideBrand:true});glow(960,590,850,'#ff790021');const p=ease(t/.9);orbit(960,568,750,154,t,.65);g.save();g.translate(960,425);g.scale(.88+.12*p,.88+.12*p);brand(-530,-166,1060);g.restore();reveal(t-.35,.7,()=>txt('كل مكالمة تحت السيطرة.',960,658,66,C.ink,800,'center'));reveal(t-.7,.7,()=>txt('Every Call, Under Control.',960,750,31,C.muted,400,'center','ltr'));reveal(t-1,.6,()=>txt('zenlix.org',960,862,47,C.orange,800,'center','ltr'));
  }
  const renderers=[hook,brandScene,live,recover,quality,toolMontage,promise,closing];
  function wrap(s,width,size){g.font=`400 ${size}px Cairo`;const result=[];let out='';for(const word of s.split(' ')){const trial=out?out+' '+word:word;if(out&&g.measureText(trial).width>width){result.push(out);out=word;}else out=trial;}if(out)result.push(out);return result;}
  function render(time,showCaptions=true){if(!config)return 0;const t=clamp(time,0,config.duration-.001),index=scenes.findIndex(s=>t<s.end),local=t-scenes[index].start;g.resetTransform();g.globalAlpha=1;g.clearRect(0,0,W,H);renderers[index](local);
    if(index>0&&local<.25){const p=ease(local/.25),edge=W*(1-p);g.beginPath();g.moveTo(0,0);g.lineTo(edge+180,0);g.lineTo(edge,H);g.lineTo(0,H);g.closePath();g.fillStyle=C.orange;g.fill();}
    if(showCaptions){const sub=captions.find(s=>t>=s.start&&t<s.end);if(sub){const lines=wrap(sub.text,1590,26),hh=lines.length*40+23;box(99,1003-hh,1722,hh,8,index===4?'#131417ee':'#090a0de8');lines.forEach((s,j)=>txt(s,960,1003-hh+31+j*40,26,'#f1f0ed',400,'center'));}}
    return index;
  }
  async function load(){const [data,status]=await Promise.all([fetch('timeline.json').then(r=>{if(!r.ok)throw new Error('Timeline missing');return r.json();}),fetch('assets/audio-status.json').then(r=>{if(!r.ok)throw new Error('Audio status missing');return r.json();}),logo.decode(),document.fonts.load('800 120px Cairo','مين كنسل على عميلك'),document.fonts.load('700 40px Cairo','Zenlix'),document.fonts.load('400 30px Cairo','مكالمة')]);config=data;scenes=data.scenes;audioStatus=status;captions=data.subtitles||[];Object.assign(window.ZenlixFilm,{scenes,config,voiceReady:status.voiceReady,audioUrl:status.audioUrl,colors:C});render(.05);return true;}
  window.ZenlixFilm={canvas,render,scenes,ready:null};window.ZenlixFilm.ready=load();
})();
