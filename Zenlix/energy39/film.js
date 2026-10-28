/* Zenlix Energy39: shared, original character/vector primitives. */
(() => {
'use strict';
const canvas=document.querySelector('#canvas'),g=canvas.getContext('2d');
const W=1080,H=1920,C={paper:'#fff',ink:'#18222C',navy:'#0B1420',orange:'#FF821C',pale:'#FFF2E7',grey:'#E8EDF2',muted:'#637184',skin:'#E8B28C',skinShade:'#D99B76',cream:'#F7F3EC',light:'#F4F6F7'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>1-(1-clamp(t))**3,smooth=t=>{t=clamp(t);return t*t*(3-2*t)},lerp=(a,b,t)=>a+(b-a)*t;
let config,assets,scenes=[],activeTime=0;const logos={},screens={};
const paths=new Map();
function shape(d,fill=C.paper,stroke=C.ink,width=4,p=1){
 if(p<=0)return;let cached=paths.get(d);if(!cached){const el=document.createElementNS('http://www.w3.org/2000/svg','path');el.setAttribute('d',d);cached={path:new Path2D(d),length:el.getTotalLength(),el};paths.set(d,cached);}
 g.save();g.lineCap='round';g.lineJoin='round';
 if(fill){g.fillStyle=fill;g.globalAlpha*=smooth((p-.25)/.6);g.fill(cached.path);g.restore();g.save();}
 if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';if(p<1){g.setLineDash([cached.length,cached.length]);g.lineDashOffset=cached.length*(1-p);}g.stroke(cached.path);if(p<1&&p>.02){const q=cached.el.getPointAtLength(cached.length*p);g.setLineDash([]);g.beginPath();g.arc(q.x,q.y,width*.85,0,Math.PI*2);g.fillStyle=C.orange;g.fill();}}
 g.restore();
}
function rr(x,y,w,h,r=15,fill=C.paper,stroke=C.ink,width=3,p=1){shape(`M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${y+r}Q${x} ${y} ${x+r} ${y}Z`,fill,stroke,width,p);}
function line(x,y,x2,y2,color=C.ink,width=3,p=1){shape(`M${x} ${y}L${x2} ${y2}`,null,color,width,p)}
function ellipse(x,y,rx,ry,fill=C.paper,stroke=C.ink,width=3,p=1){shape(`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0`,fill,stroke,width,p)}
function text(s,x,y,size=46,color=C.ink,weight=700,align='center',dir='rtl'){g.font=`${weight} ${size}px Cairo`;g.direction=dir;g.textAlign=align;g.textBaseline='middle';g.fillStyle=color;g.fillText(s,x,y);}
function at(x,y,s,fn,angle=0,alpha=1){g.save();g.translate(x,y);g.rotate(angle);g.scale(s,s);g.globalAlpha*=clamp(alpha);fn();g.restore();}
function appear(t,delay,fn,{duration=.7,x=0,y=35,scale=.97}={}){const p=ease((t-delay)/duration);if(!p)return;g.save();g.translate((1-p)*x,(1-p)*y);g.globalAlpha*=p;fn(p);g.restore();}
function arrow(d,p=1,color=C.orange,width=6){shape(d,null,color,width,p);if(p>.02){let c=paths.get(d);const a=c.el.getPointAtLength(c.length*clamp(p)),b=c.el.getPointAtLength(Math.max(0,c.length*clamp(p)-3)),ang=Math.atan2(a.y-b.y,a.x-b.x);at(a.x,a.y,1,()=>{line(-18,-10,0,0,color,width);line(-18,10,0,0,color,width)},ang);}}
function dashed(d,p=1,color=C.orange,width=4){const q=paths.get(d);if(!q){shape(d,null,null,0,1);}g.save();g.setLineDash([9,15]);g.lineDashOffset=-activeTime*15;const path=new Path2D(d);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke(path);g.restore();}
function badge(label,x,y,w=250,orange=false){rr(x-w/2,y-28,w,56,28,orange?C.orange:C.paper,orange?C.orange:C.grey,2);text(label,x,y,25,orange?C.ink:C.muted,700);}
function check(x,y,s=1,p=1){at(x,y,s,()=>shape('M-15 0L-3 12L20-16',null,C.orange,5,p));}
function heart(x,y,s=1,p=1){at(x,y,s,()=>shape('M0 18C-55-13-26-49 0-23C26-49 55-13 0 18Z',C.orange,C.orange,3,p));}
function phoneIcon(x,y,s=1,color=C.orange,p=1){at(x,y,s,()=>shape('M-17-26L-28-16Q-34-6-11 17Q11 38 22 27L31 17L17 3L8 10Q-2 8-12-6L-6-15Z',color,color,3,p));}
function speech(x,y,w,h,fn,p=1){rr(x,y,w,h,22,C.paper,C.ink,3,p);shape(`M${x+47} ${y+h}L${x+38} ${y+h+24}L${x+85} ${y+h}`,C.paper,C.ink,3,p);if(p>.9)fn();}
function notice(x,y,s=1,p=1){at(x,y,s,()=>{rr(-24,-25,48,50,10,C.orange,C.orange,2,p);line(0,-13,0,4,C.paper,5,p);ellipse(0,14,2,2,C.paper,null,0,p);});}
function plant(x,y,s=1,p=1){at(x,y,s,()=>{shape('M-36-66L-26 0H27L39-66Z',C.cream,C.ink,3,p);shape('M1-65Q7-150-8-210M1-94Q-62-142-47-177Q-2-158 1-117M-2-134Q42-193 58-170Q54-136 0-115M-2-169Q-31-209-21-225Q4-204-2-169',null,C.muted,4,p);});}
function plate(x,y,s=1,p=1){at(x,y,s,()=>{ellipse(0,12,106,26,C.paper,C.ink,3,p);ellipse(0,6,88,17,C.cream,C.ink,2,p);shape('M-70 4Q-75-36-38-36Q-34-67-6-45Q32-66 45-30Q73-24 70 4Z',C.orange,C.ink,3,p);for(let i=0;i<5;i++)shape(`M${-55+i*24} -8q10-24 21-3`,null,C.ink,2,p);shape('M-20-72Q-39-91-21-108M16-69Q3-89 19-105',null,C.muted,3,p);});}
function receipt(x,y,s=1,p=1,{faded=false,complaint=false}={}){at(x,y,s,()=>{shape('M-74-107H74V93L56 81L37 94L19 81L0 94L-19 81L-37 94L-56 81L-74 93Z',faded?C.pale:C.paper,C.ink,3,p);if(complaint){notice(0,-56,.65,p);}else{shape('M-25-39Q-24-64 0-64Q24-64 25-39Z',C.orange,C.ink,2,p);line(-33,-33,33,-33,C.ink,3,p);}line(-49,-5,49,-5,C.ink,3,p);line(-49,21,30,21,C.muted,3,p);line(-49,47,44,47,C.muted,3,p);});}
function bag(x,y,s=1,p=1){at(x,y,s,()=>{shape('M-59-44H59L69 77H-69Z',C.paper,C.ink,3,p);shape('M-26-43V-64Q-26-94 0-94Q26-94 26-64V-43',null,C.ink,3,p);phoneIcon(0,15,.65,C.orange,p);});}
function restaurant(x,y,s=1,p=1,{rival=false}={}){at(x,y,s,()=>{rr(-166,-170,332,227,5,C.paper,C.ink,3,p);rr(-180,-241,360,70,10,C.paper,C.ink,3,p);text(rival?'مطعم تاني':'مطعمك',0,-206,29,C.ink,800);shape('M-183-170H183L169-126Q147-103 123-126Q98-103 73-126Q49-103 24-126Q0-103-25-126Q-50-103-75-126Q-99-103-124-126Q-148-103-170-126Z',C.orange,C.ink,3,p);rr(-52,-92,104,149,4,C.paper,C.ink,3,p);rr(-140,-86,65,76,3,C.cream,C.ink,2,p);rr(76,-86,65,76,3,C.cream,C.ink,2,p);ellipse(28,-13,4,4,C.orange,null,0,p);line(-196,59,196,59,C.ink,3,p);});}
function device(x,y,s=1,p=1,{missed=false,answered=false,ring=false}={}){at(x,y,s,()=>{rr(-130,-248,260,496,35,C.paper,C.ink,5,p);rr(-115,-230,230,460,24,C.paper,C.ink,2,p);rr(-46,-218,92,12,6,C.ink,null,0,p);line(-34,215,34,215,C.ink,4,p);if(p>.7){ellipse(0,-96,43,43,C.pale,null);phoneIcon(0,-95,.8,missed?C.ink:C.orange);text(answered?'تم التواصل':missed?'لم يتم الرد':'مكالمة واردة',0,-7,25,C.ink,700);if(missed){line(-21,58,21,100,C.orange,5);line(21,58,-21,100,C.orange,5);}else if(answered){ellipse(0,81,30,30,C.pale,null);check(0,81,1);}else{ellipse(0,81,34,34,C.orange,null);phoneIcon(0,81,.6,C.paper);}if(ring){const phase=(activeTime*.8)%1;for(const side of [-1,1]){g.save();g.globalAlpha*=1-phase;shape(`M${side*155} -90Q${side*(197+phase*30)} -45 ${side*155} 0`,null,C.orange,5);shape(`M${side*178} -115Q${side*(244+phase*30)} -45 ${side*178} 27`,null,C.orange,4);g.restore();}}}});}
function monitor(x,y,s=1,p=1){at(x,y,s,()=>{rr(-121,-117,242,157,10,C.paper,C.ink,3,p);rr(-107,-103,214,128,5,C.light,null,0,p);shape('M-20 40V78H20V40M-61 82H61',C.paper,C.ink,3,p);line(-150,91,151,91,C.ink,4,p);});}
function hand(x,y,angle=0,s=1,point=false){at(x,y,s,()=>{shape(point?'M-13 8L-15-14Q-16-24-9-24Q-3-24-4-13L-4-33Q-4-39 2-38L7-16Q23-22 24-6Q26 11 13 18L-3 18Z':'M-15-2Q-23-21-17-25Q-12-28-7-14L-5-23Q-3-29 2-25L8-21Q13-25 17-19L22-12Q28-5 24 4L14 20L-2 18Z',C.skin,C.ink,2.5);},angle);}
function limb(points,color,width=31){const d=`M${points[0][0]} ${points[0][1]}Q${points[1][0]} ${points[1][1]} ${points[2][0]} ${points[2][1]}`;shape(d,null,C.ink,width+5);shape(d,null,color,width);}
function head(kind,t,mood='calm',talk=false,look=1){
 const hijab=kind==='agent',owner=kind==='owner',blink=((t+kind.length*.31)%4.6)>4.43;
 g.save();g.translate(0,-446);g.rotate((mood==='surprise'?-.1:Math.sin(t*.72)*.018)*look);
 if(hijab)shape('M-59-18Q-60-82-12-84Q42-85 58-37L69 94Q25 119-66 96L-62 8Z',C.ink,C.ink,3);
 ellipse(look*36,4,10,17,C.skin,C.ink,2.5);
 shape('M-38-30Q-39-65-3-65Q34-65 39-26L35 23Q29 54 5 61Q-24 58-35 33Z',C.skin,C.ink,3);
 if(hijab){shape('M-48-20Q-29-28-15-65Q13-70 37-37L44-7L49-40Q35-83-9-77Q-55-75-48-20Z',C.ink,C.ink,3);shape('M-42 18Q-47 63 3 82Q37 84 49 35L55 99Q2 110-55 88Z',C.ink,C.ink,3);}
 else if(owner){shape('M-40-9Q-58-45-31-61Q-21-87 12-72Q45-77 47-48Q55-19 36-3L29-31Q12-24-9-43Q-17-20-40-9Z',C.ink,C.ink,3);for(let i=0;i<4;i++)shape(`M${-35+i*11} -47Q${-17+i*8} -71 ${17+i*5} -58`,null,'#576777',1.8);}
 else{shape('M-41-10Q-60-23-48-43Q-51-64-30-64Q-14-85 1-72Q21-84 31-66Q56-65 48-41Q59-25 39-8L29-28Q4-19-13-32Q-22-20-41-10Z',C.ink,C.ink,3);for(let i=0;i<5;i++)shape(`M${-35+i*15} -48q7-13 14-1`,null,'#596775',1.7);}
 const eyes=[-15,17];for(const x of eyes){if(blink)line(x-6,-2,x+6,-2,C.ink,2);else{shape(`M${x-5} -3Q${x} ${mood==='surprise'?-13:-8} ${x+5} -3Q${x} 1 ${x-5} -3Z`,C.paper,C.ink,1.6);ellipse(x+look*1.2,-3,1.7,mood==='surprise'?3.2:2.4,C.ink,null);}}
 const brow=mood==='surprise'?-21:mood==='upset'?-12:-16;
 shape(`M-25 ${brow+2}Q-18 ${brow-4}-9 ${brow}M10 ${brow}Q18 ${brow-4} 25 ${brow+2}`,null,C.ink,2.5);
 shape('M1 2L-2 16L6 18',null,'#9D674F',2);
 if(owner){shape('M-13 27Q-5 19 1 25Q9 18 17 25Q13 34 2 30Q-7 35-13 27Z',C.ink,null);}
 const mouthY=owner?38:31;
 if(mood==='surprise')ellipse(1,mouthY,6,9,C.ink,C.ink,1);
 else if(mood==='upset')shape(`M-10 ${mouthY+4}Q1 ${mouthY-6} 13 ${mouthY+4}`,null,C.ink,2);
 else if(talk&&Math.sin(t*11)>.05)shape(`M-11 ${mouthY-2}Q2 ${mouthY+16} 14 ${mouthY-2}Z`,C.ink,C.ink,1);
 else shape(`M-11 ${mouthY-1}Q1 ${mouthY+9} 14 ${mouthY-2}`,null,C.ink,2.2);
 if(kind==='customer'){shape('M-26 29Q-20 53 4 55Q23 50 29 31',null,C.ink,4);}
 if(hijab||kind==='operator'){shape('M-49-12Q-50-66 0-69Q47-65 46-15',null,hijab?'#91A0AD':C.ink,4);rr(-52,-13,16,31,7,C.paper,C.ink,2);shape('M-44 15Q-41 46-9 45',null,C.ink,3);ellipse(-5,45,7,4,C.ink,null);}
 g.restore();
}
function person(x,y,s,t,{kind='owner',mood='calm',pose='rest',talk=false,look=1,seated=false,alpha=1}={}){
 at(x,y,s,()=>{
 const owner=kind==='owner',agent=kind==='agent',shirt=owner?C.ink:agent?C.orange:kind==='operator'?C.cream:C.cream;
 const breath=Math.sin(t*1.6)*1.5;
 g.translate(0,breath);
 if(!seated){shape('M-49-194L-7-188L-16-36L-45-18L-66-27Z',C.ink,C.ink,3);shape('M0-191L45-194L70-29L45-15L19-29Z',C.ink,C.ink,3);shape('M-66-31L-19-29L-11-7Q-36 3-83-3L-86-17Z',C.paper,C.ink,3);shape('M29-29L68-30L91-14Q97 0 55 0L27-5Z',C.paper,C.ink,3);line(-47,-162,-44,-48,'#576777',2);line(27,-164,49,-46,'#576777',2);}
 shape('M-17-398L17-398L23-364L-23-364Z',C.skin,C.ink,3);
 shape('M-66-365Q-46-382-22-382L0-361L23-382Q54-378 70-354L58-196Q3-178-62-198Z',shirt,C.ink,3.5);
 if(!agent){shape('M-25-382L-40-366L-20-345L0-361L21-344L39-367L23-382',shirt,C.ink,2.5);line(0,-350,0,-205,owner?'#7C8A97':'#C4C9CA',2);for(let i=0;i<3;i++)ellipse(10,-324+i*36,1.8,1.8,owner?C.paper:C.ink,null);}
 if(owner){shape('M-39-373L-29-373L-29-313H30V-373H40V-306L57-201L-59-199L-44-311Z',C.orange,C.ink,3);rr(-27,-267,55,43,4,C.orange,C.ink,2);ellipse(-35,-308,3,3,C.paper,C.ink,1);ellipse(35,-308,3,3,C.paper,C.ink,1);}
 if(pose==='phone'){
 limb([[-64,-351],[-119,-284],[-65,-245]],shirt);hand(-59,-237,-1,1);
 limb([[64,-352],[104,-290],[67,-416]],shirt);hand(66,-411,.1,.9);rr(45,-457,36,76,7,C.orange,C.ink,3);line(57,-446,71,-446,C.ink,2);
 }else if(pose==='point'||pose==='coach'){
 const wob=Math.sin(t*2)*9;
 limb([[-63,-351],[-117,-281],[-65,-257]],shirt);hand(-58,-252,-1,.9);
 limb([[65,-350],[115,-296],[149,-355+wob]],shirt);hand(155,-360+wob,.3,.95,true);
 }else if(pose==='open'){
 limb([[-65,-351],[-121,-270],[-155,-292]],shirt);hand(-157,-300,-.7,.9);
 limb([[65,-351],[114,-270],[153,-292]],shirt);hand(155,-300,.7,.9);
 }else if(pose==='typing'||seated){
 limb([[-65,-351],[-91,-262],[-24,-250]],shirt);hand(-15,-246,-1.4,.85);
 limb([[65,-351],[94,-259],[31,-247]],shirt);hand(26,-244,1.4,.85);
 }else{
 limb([[-63,-350],[-89,-277],[-79,-226]],shirt);hand(-77,-219,-.15,.85);
 limb([[65,-350],[93,-284],[60,-243]],shirt);hand(57,-237,1,.85);
 }
 head(kind,t,mood,talk,look);
 if(owner){line(-54,-204,52,-204,C.ink,2);shape('M-12-247L-12-216M-24-237H-2',null,'#E16611',1.6);}
 },0,alpha);
}
function deskAgent(x,y,s,t,kind='agent',{mood='calm',pose='typing',p=1}={}){
 at(x,y,s,()=>{rr(-115,-241,230,275,30,C.light,C.grey,3,p);person(0,133,1,t,{kind,seated:true,pose,mood,talk:true});monitor(60,-15,.84,p);line(-165,77,168,77,C.ink,4,p);line(-145,77,-145,223,C.ink,3,p);line(148,77,148,223,C.ink,3,p);rr(-130,34,29,44,4,C.paper,C.ink,2,p);shape('M-101 43Q-80 42-85 60Q-88 69-101 67',null,C.ink,2,p);});}
function frameLabel(label,x,y,small=false){text(label,x,y,small?22:28,C.muted,700);}
function performance(x,y,w,label,status,p=1,{improved=false}={}){
 at(x,y,1,()=>{rr(-w/2,0,w,184,16,C.paper,C.ink,3,p);if(p>.85){text(label,0,39,27,C.ink,800);line(-w/2+23,70,w/2-23,70,C.grey,2);text('جودة التعامل',w/2-24,98,20,C.muted,400,'right');for(let i=0;i<3;i++){const c=improved||i===0?C.orange:C.grey;ellipse(-w/2+29+i*29,98,8,8,c,null);}text(status,0,146,21,improved?C.ink:C.muted,700);}});
}

// Editorial graphics and camera moves. No random shake; every action has a timeline cue.
function bg(color){g.fillStyle=color;g.fillRect(0,0,W,H);}
function camera(x,y,z,fn){g.save();g.translate(540,960);g.scale(z,z);g.translate(-x,-y);fn();g.restore();}
function pen(d,p=1,width=6,color=C.orange){arrow(d,ease(p),color,width);}
function title(lines,y=240,size=76,color=C.ink,t=1){lines.forEach((s,i)=>{const p=ease((t-i*.09)/.4);g.save();g.globalAlpha*=p;g.translate(0,(1-p)*34);text(s,540,y+i*(size*1.42),size,color,800);g.restore();});}
function brand(x=105,y=122,w=216,dark=false,alpha=1){
 g.save();g.globalAlpha*=clamp(alpha);const img=dark?logos.dark:logos.light;
 if(img){g.drawImage(img,x,y-w*img.height/img.width/2,w,w*img.height/img.width);}
 else{text('Zenlix Solutions',x,y,27,dark?C.paper:C.ink,800,'left','ltr');}
 g.restore();
}
function label(s,x,y,w=250,dark=false){rr(x-w/2,y-30,w,60,30,dark?C.navy:C.paper,dark?'#314153':C.grey,2);text(s,x,y,26,dark?C.paper:C.ink,700);}
function roundFace(kind,x,y,s=1,t=0,mood='calm',dark=false){ellipse(x,y,80*s,80*s,dark?'#152637':C.pale,null);at(x,y+446*s*.7,s*.7,()=>head(kind,t,mood,true,1));}
function shadowCard(x,y,w,h,fn,{angle=0,z=1,tilt=0}={}){g.save();g.translate(x,y);g.rotate(angle);g.scale(z,z);g.transform(1,tilt,-.045,1,0,0);g.shadowColor='#07111D20';g.shadowBlur=35;g.shadowOffsetY=23;rr(-w/2,-h/2,w,h,25,C.paper,null);g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;fn(-w/2,-h/2,w,h);g.restore();}
function cursor(x,y,p=1){at(x,y,1,()=>{shape('M0 0L0 45L12 34L22 55L32 50L22 30L39 28Z',C.ink,C.paper,2);if(p>0&&p<1){ellipse(7,11,18+35*p,18+35*p,null,C.orange,4*(1-p));}});}
function actualScreen(name,x,y,w,h,t){
 const media=screens[name];if(!media)return false;
 const el=media.element,sw=el.videoWidth||el.naturalWidth,sh=el.videoHeight||el.naturalHeight;
 if(!sw||!sh)return false;
 const crop=media.spec.crop||{x:0,y:0,w:1,h:1};
 g.save();g.beginPath();g.roundRect(x,y,w,h,15);g.clip();g.fillStyle=C.paper;g.fillRect(x,y,w,h);g.drawImage(el,crop.x*sw,crop.y*sh,crop.w*sw,crop.h*sh,x,y,w,h);g.restore();return true;
}
function callPlate(x,y,w,h,t){
 if(actualScreen('missedCalls',x,y,w,h,t))return;
 text('المكالمات والمتابعة',x+w-36,y+49,36,C.ink,800,'right');line(x+30,y+93,x+w-30,y+93,C.grey,2);
 rr(x+28,y+124,w-56,133,16,C.pale,null);phoneIcon(x+w-79,y+188,.65,C.orange);text('مكالمة فائتة',x+w-131,y+168,33,C.ink,800,'right');text('تحتاج متابعة',x+w-131,y+213,25,C.muted,400,'right');
 rr(x+38,y+300,w-76,83,14,t>1.35?C.orange:C.light,null);text(t>1.35?'اتصال متابعة':'راجع المكالمة',x+w/2,y+343,32,C.ink,800);
 line(x+44,y+427,x+w-45,y+427,C.grey,3);line(x+44,y+452,x+w-180,y+452,C.grey,3);
}
function headset(x,y,s=1,p=1,color=C.orange){at(x,y,s,()=>{shape('M-131 61V-37C-131-186 131-186 131-37V61',null,color,15,p);rr(-151,19,47,115,20,C.paper,color,7,p);rr(104,19,47,115,20,C.paper,color,7,p);shape('M126 129Q130 206 19 195',null,color,9,p);rr(-11,184,55,21,10,color,color,2,p);});}
const morphCache={};
function morphShell(p,x=540,y=943,s=1){
 if(!morphCache.a){for(const [k,d] of Object.entries({a:'M-118-220H118Q146-220 146-192V192Q146 220 118 220H-118Q-146 220-146 192V-192Q-146-220-118-220Z',b:'M-148 102V-29C-148-224 148-224 148-29V102H111V-29C111-173-111-173-111-29V102Z'})){const el=document.createElementNS('http://www.w3.org/2000/svg','path');el.setAttribute('d',d);const l=el.getTotalLength();morphCache[k]=Array.from({length:100},(_,i)=>el.getPointAtLength(l*i/100));}}
 at(x,y,s,()=>{g.beginPath();morphCache.a.forEach((a,i)=>{const b=morphCache.b[i],xx=lerp(a.x,b.x,p),yy=lerp(a.y,b.y,p);i?g.lineTo(xx,yy):g.moveTo(xx,yy)});g.closePath();g.fillStyle=C.paper;g.fill();g.strokeStyle=C.ink;g.lineWidth=7;g.lineJoin='round';g.stroke();if(p>.55){rr(-162,39,55,105,22,C.orange,C.ink,4,ease((p-.55)/.45));rr(107,39,55,105,22,C.orange,C.ink,4,ease((p-.55)/.45));}});
}
function orderHook(t){
 const first=1.40625,freeze=3.28125,last=4.21875;
 if(t<first){bg(C.navy);brand(106,127,225,true);title(['رنّة من غير رد.'],300,80,C.paper,1);text('عميل بيحاول يوصل لمطعمك',540,421,36,'#AFBCC9',700);
 const push=lerp(1.45,1.68,ease(t/first));device(540,1004,push,.8+.2*ease(t/.3),{ring:t<.94,missed:t>=.94});
 const loss=ease((t-.56)/.82);at(811+loss*140,1371-loss*160,.58,()=>receipt(0,0,1),loss*.2,1-loss);
 if(t<.7){const p=t/.7;g.save();g.globalAlpha*=1-p;ellipse(540,1004,235+p*110,475+p*75,null,C.orange,5);g.restore();}
 }else if(t<freeze){const q=t-first;bg(C.paper);brand();title(['محدش بيرد.'],267,90,C.ink,q+.18);
 restaurant(817,1460,.62,ease(q/.5));person(320,1610,1.47,q,{kind:'owner',pose:'open',mood:'surprise'});
 device(764,937,1.14,1,{missed:true});receipt(739,1405,.78,1);plate(800,1570,.7,1);
 pen('M553 1215Q635 1170 688 1211',q/.7,5);
 }else if(t<last){bg(C.orange);brand();title(['أوردر ممكن','يضيع.'],298,102,C.ink,1);
 at(310,1400,1,()=>person(0,0,1.37,1.8,{kind:'owner',pose:'open',mood:'surprise'}));
 receipt(766,1121,1.76);shape('M659 1356L859 1356',null,C.ink,7);text('فرصة بيع',764,1447,38,C.ink,800);
 }else{const q=t-last;bg(C.navy);brand(106,127,225,true);title(['من غير ما تعرف.'],280,84,C.paper,1);
 const z=1.25+2.25*ease((q-1.95)/.82);camera(540,1010,z,()=>{receipt(540,1010,1.55);const vanish=ease(q/1.1);at(540+vanish*140,1412-vanish*40,.62,()=>bag(0,0,.8),0,1-vanish);});
 if(q<1.85){pen('M226 1250Q237 1081 321 1002',q/.75,5);text('المكالمة فاتت.',540,1579,39,C.paper,700);}
 }
}
function competitor(t){
 bg(C.paper);g.fillStyle=C.navy;g.fillRect(0,0,540,H);line(540,170,540,1730,C.orange,4);
 text('مطعمك',270,324,57,C.paper,800);text('مطعم تاني',810,324,57,C.ink,800);
 at(270,1442,.73,()=>{rr(-216,-395,432,490,21,C.paper,null);restaurant(0,-3,1);});restaurant(810,1442,.76,1,{rival:true});
 text('من غير رد',270,1510,31,'#C2CDD7',700);text('اختيار تاني',810,1510,31,C.ink,700);
 const pull=ease(t/.35),move=ease((t-.58)/1.75),x=lerp(lerp(540,270,pull),810,move),y=lerp(960,955,pull),s=lerp(5.425,1.13,pull);
 pen('M284 1039C477 1127 658 1118 802 1037',(t-.7)/1.55,6);
 receipt(x,y,s,1);
 if(t>.44){label('العميل مش هيستنى',540,588,450);}
}
function followUp(t){
 bg(C.orange);brand();title(['تابع الفرصة.'],266,91,C.ink,t+.3);
 if(t<1.875){const p=ease(t/1.2);const x=lerp(810,540,p),y=lerp(955,1020,p);receipt(x,y,lerp(1.13,1.5,p),1);pen('M811 1161Q535 1344 325 1145',t/.9,6,C.ink);if(t>1.1){rr(145,604,790,636,25,null,C.ink,4,ease((t-1.1)/.6));}}
 else{const q=t-1.875;const scale=.92+.08*ease(q/.7),tilt=Math.sin(q*.85)*.014;
 shadowCard(540,928,790,520,(x,y,w,h)=>callPlate(x,y,w,h,q),{angle:-.025*(1-ease(q/2)),z:scale,tilt});
 const button=ease((q-.92)/.5);if(q<1.58&&q>.7)cursor(711-button*142,1267-button*95,button);
 deskAgent(263,1550,.8,t,'agent',{pose:t>3.75?'phone':'typing'});person(808,1660,.78,t,{kind:'customer',pose:t>3.75?'phone':'rest',mood:'calm',talk:t>3.75,look:-1});
 pen('M412 1447Q543 1275 695 1444',(t-3.75)/.65,5,C.ink);if(t>4.65){label('فرصة تتفتح تاني',540,1680,425);}
 }
 if(t>5.625){const p=ease((t-5.625)/.375);g.save();g.globalAlpha*=p;rr(164,585,752,785,31,C.paper,null);morphShell(p*.7,540,943,1.03);g.restore();}
}
function qualityCard(x,y,w,name,status,progress=1){
 rr(x-w/2,y,w,182,19,C.paper,C.ink,3,progress);if(progress>.8){text(name,x,y+40,31,C.ink,800);text('الرد   ·   الجودة',x,y+86,23,C.muted,700);rr(x-w/2+25,y+116,w-50,40,20,status==='دعم وتدريب'?C.grey:C.pale,null);text(status,x,y+137,24,C.ink,700);}
}
function team(t){
 bg(C.paper);brand();title(['قيّم. درّب. طوّر.'],267,76,C.ink,t+.2);
 if(t<.52){morphShell(.7+.3*ease(t/.52),540,943,1.03);return;}
 if(t<2.8125){
 if(screens.teamQuality){shadowCard(540,779,790,398,(x,y,w,h)=>actualScreen('teamQuality',x,y,w,h,t),{angle:0,tilt:.015*Math.sin(t)});}
 [247,540,833].forEach((x,i)=>{appear(t,.48+i*.13,()=>{deskAgent(x,1375,.74,t,i===1?'agent':'operator');qualityCard(x,669,259,['عمر','منى','كريم'][i],i===2?'دعم وتدريب':'تواصل واضح',ease((t-.8-i*.12)/.45));},{duration:.45,y:33});});
 text('كل تقييم… فرصة للتطوير',540,1662,35,C.ink,800);
 }else{const q=t-2.8125;person(272,1587,1.4,t,{kind:'owner',pose:'coach',talk:true});deskAgent(815,1459,1.03,t,'operator',{mood:'calm'});
 speech(448,571,489,202,()=>{text('أكد تفاصيل الطلب',693,642,35,C.ink,800);text('ملاحظة واضحة… تدريب مفيد',693,708,25,C.muted,700);},ease(q/.38));
 pen('M439 1189Q456 905 745 946',q/.65,5);
 qualityCard(763,849,339,'جودة الخدمة',q>1.875?'تحسّن بعد التدريب':'تدريب موجّه',1);
 if(q>1.875){check(528,1490,1.7,ease((q-1.875)/.4));text('فريق أقوى.',540,1705,45,C.ink,800);}
 }
 if(t>5.625){const p=ease((t-5.625)/.375);rr(lerp(596,163,p),lerp(849,783,p),lerp(339,754,p),lerp(182,570,p),22,C.paper,C.ink,3);}
}
function crmRecord(x,y,w,h,t,history=false){
 if(history&&actualScreen('customerHistory',x,y,w,h,t))return;
 rr(x,y,w,h,23,C.paper,C.ink,3);roundFace('customer',x+w-88,y+81,.65,t);text('ملف العميل',x+w-164,y+63,38,C.ink,800,'right');text('سجل التواصل',x+w-164,y+112,27,C.muted,700,'right');line(x+34,y+161,x+w-34,y+161,C.grey,2);
 rr(x+35,y+195,w-70,191,17,C.pale,null);notice(x+w-85,y+251,.65);text('شكوى سابقة',x+w-139,y+239,34,C.ink,800,'right');text('ملاحظة على الطلب',x+w-139,y+296,29,C.ink,700,'right');text('التفاصيل محفوظة في ملف العميل',x+w-139,y+346,24,C.muted,400,'right');
 line(x+54,y+436,x+54,y+h-68,C.orange,4);ellipse(x+54,y+436,7,7,C.orange,null);text(history?'مراجعة الشكوى السابقة':'تواصل سابق',x+w-47,y+456,28,C.ink,700,'right');text(history?'الموظف يراجع ويفهم التفاصيل':'في انتظار المتابعة',x+w-47,y+512,25,C.muted,700,'right');
}
function crm(t){
 const again=2.34375,review=4.21875,reassure=7.03125;
 if(t<again){bg(C.navy);brand(106,127,225,true);title(['عميلك اشتكى','قبل كده؟'],277,81,C.paper,t+.2);
 const p=ease(t/.65);shadowCard(540,1068,820,620,(x,y,w,h)=>crmRecord(x,y,w,h,t,false),{z:.92+.08*p,angle:-.018*(1-p)});
 label('الشكوى مرتبطة بملفه',540,1530,525,true);
 }else if(t<review){const q=t-again;bg(C.paper);brand();title(['رجع يتصل.'],270,88,C.ink,1);
 person(277,1580,1.23,t,{kind:'customer',pose:'phone',mood:'upset',talk:true});deskAgent(812,1439,.95,t,'agent',{pose:'typing'});
 rr(358,600,572,192,19,C.light,C.ink,3);text('مكالمة من العميل',645,648,35,C.ink,800);rr(429,693,432,66,13,C.orange,null);text('فتح ملف العميل',645,728,31,C.ink,800);
 const click=ease(q/.46875);cursor(lerp(947,754,click),lerp(906,728,click),q<.8?clamp((q-.46)/.34):1);
 text('الموظف يفتح الملف',540,1690,35,C.ink,800);
 }else if(t<reassure){const q=t-review;bg(C.paper);brand();title(['راجع الشكوى.'],270,81,C.ink,1);
 shadowCard(540,1037,840,630,(x,y,w,h)=>crmRecord(x,y,w,h,t,true),{z:.94+.06*ease(q/.6),tilt:.012*Math.sin(q*.7)});
 pen('M187 1404Q466 1480 821 1400',q/.65,5);text('فاهم التفاصيل قبل ما يرد.',540,1570,39,C.ink,800);
 }else{const q=t-reassure;bg(C.pale);brand();title(['فاكرينه. فاهمينه.'],274,70,C.ink,1);
 deskAgent(271,1395,.97,t,'agent',{pose:'phone'});person(813,1530,1.02,t,{kind:'customer',pose:'phone',mood:'calm',talk:false,look:-1});
 pen('M423 1030C541 921 624 935 698 1045',q/.6,5);heart(552,1286,1.7,ease(q/.55));
 rr(145,1604,790,105,18,C.paper,null);text('من غير ما يعيد الحكاية.',540,1656,41,C.ink,800);
 }
}
function ecosystem(t){
 const mode=t<1.5?0:t<3?1:t<4.5?2:3;
 const backgrounds=[C.navy,C.orange,C.paper,C.navy];bg(backgrounds[mode]);brand(106,127,225,mode===0||mode===3);
 const local=t-[0,1.5,3,4.5][mode],p=ease(local/.35);
 if(mode<3){const white=mode===0,ink=white?C.paper:C.ink;const headlines=['متابعة فرصك.','فريق أقوى.','عناية بكل عميل.'];title([headlines[mode]],309,83,ink,local+.12);
 at(540,1052,.92+.08*p,()=>{if(mode===0){receipt(-114,35,1.72);phoneIcon(162,-70,2.6,C.orange);pen('M-39 171Q197 240 244 57',local/.6,7);}
 if(mode===1){headset(0,-106,1.8,1,C.ink);check(9,279,3,ease(local/.4));}
 if(mode===2){roundFace('customer',0,30,2.3,local);heart(172,190,1.7,1);}});
 }else{
 title(['فرصك. فريقك. عميلك.'],297,68,C.paper,1);
 const nodes=[[269,835,'فرصك'],[812,835,'فريقك'],[540,1360,'عميلك']];
 pen('M326 799Q532 681 754 799',local/.6,5);pen('M839 928Q841 1157 622 1318',(local-.2)/.6,5);pen('M456 1320Q240 1178 246 928',(local-.4)/.6,5);
 nodes.forEach(([x,y,s],i)=>{ellipse(x,y,112,112,'#142435','#334354',3);if(i===0){receipt(x,y,.66);}else if(i===1){headset(x,y-17,.47,1,C.orange);}else{heart(x,y,1.8,1);}text(s,x,y+174,37,C.paper,800);});
 }
}
function closing(t){
 bg(C.navy);const p=ease(t/.45),spoken=config.closingVoiceCues;
 for(let i=0;i<3;i++){const origin=[[269,835],[812,835],[540,1360]][i];const endX=lerp(origin[0],540,p),endY=lerp(origin[1],899,p);g.save();g.globalAlpha*=1-p;ellipse(endX,endY,112*(1-p)+10,112*(1-p)+10,null,C.orange,4);g.restore();}
 const img=logos.dark;g.save();g.globalAlpha*=spoken?ease((activeTime-spoken.brandAt)/.35):ease((t-.13)/.45);
 if(img){const w=817,h=w*img.height/img.width;g.shadowColor='#FF821C55';g.shadowBlur=26;g.drawImage(img,540-w/2,809-h/2,w,h);g.shadowBlur=0;}
 else{text('Zenlix',540,767,142,C.paper,800,'center','ltr');text('SOLUTIONS',540,883,38,C.paper,800,'center','ltr');}
 g.restore();
 const taglineTime=spoken?activeTime-spoken.taglineAt+.35:t,websiteTime=spoken?activeTime-spoken.websiteAt+.6:t;
 appear(taglineTime,.35,()=>text('كل مكالمة ليها قيمة',540,1110,64,C.paper,800),{duration:.4,y:12});
 shape('M321 1220Q540 1249 759 1220',null,C.orange,5,ease((taglineTime-.4)/.48));
 appear(websiteTime,.6,()=>text('zenlix.org',540,1333,46,C.orange,700,'center','ltr'),{duration:.35,y:10});
}
const renderers=[orderHook,competitor,followUp,team,crm,ecosystem,closing];
function sceneTime(scene,local){
 const points=scene.timeMap;if(!points)return local;
 for(let i=1;i<points.length;i++){const [a,ca]=points[i-1],[b,cb]=points[i];if(local<=b)return lerp(ca,cb,clamp((local-a)/(b-a)));}
 return points[points.length-1][1];
}
function render(time){if(!config)return 0;const t=clamp(time,0,config.duration-.001);activeTime=t;const i=scenes.findIndex(s=>t<s.end),local=sceneTime(scenes[i],t-scenes[i].start);g.resetTransform();g.globalAlpha=1;g.clearRect(0,0,W,H);renderers[i](local);return i;}
async function load(){const [cfg,manifest]=await Promise.all([fetch('timeline.json').then(r=>{if(!r.ok)throw new Error('Timeline missing');return r.json()}),fetch('assets/production-assets.json').then(r=>{if(!r.ok)throw new Error('Asset manifest missing');return r.json()})]);config=cfg;assets=manifest;scenes=cfg.scenes;
 await Promise.all([document.fonts.load('800 90px Cairo','كل مكالمة ليها قيمة'),document.fonts.load('700 36px Cairo','متابعة العملاء'),document.fonts.load('400 25px Cairo','تفاصيل'),document.fonts.load('800 60px Cairo','Zenlix')]);
 if(assets.logo.authenticReady){for(const [key,src] of [['light',assets.logo.lightBackground],['dark',assets.logo.darkBackground]]){if(!src)throw new Error('Original logo variant missing');const img=new Image();img.src=src;await img.decode();logos[key]=img;}}
 for(const [name,spec] of Object.entries(assets.screens)){if(!spec)continue;let element;if(spec.type==='video'){element=document.createElement('video');element.muted=true;element.preload='auto';element.src=spec.src;await new Promise((resolve,reject)=>{element.onloadeddata=resolve;element.onerror=reject});}else{element=new Image();element.src=spec.src;await element.decode();}screens[name]={element,spec};}
 Object.assign(window.EnergyFilm,{config,scenes,assets,originalLogoReady:!!logos.light&&!!logos.dark,realScreensReady:Object.keys(screens).length===3});render(0);return true;
}
async function prepare(t){await Promise.all(Object.entries(screens).filter(([,m])=>m.spec.type==='video').map(async([name,m])=>{const index={missedCalls:2,teamQuality:3,customerHistory:4}[name],start=scenes[index].start;const goal=clamp(t-start+(m.spec.inPoint||0),0,Math.max(0,m.element.duration-.05));if(Math.abs(m.element.currentTime-goal)>.015){await new Promise((resolve,reject)=>{m.element.addEventListener('seeked',resolve,{once:true});m.element.currentTime=goal;setTimeout(resolve,1000);});}}));}
window.EnergyFilm={canvas,render,prepare,config:null,scenes,ready:null};window.EnergyFilm.ready=load();
})();
