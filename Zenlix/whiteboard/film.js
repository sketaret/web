/* Zenlix portrait whiteboard film. Authored vector puppets; deterministic 25fps export. */
(() => {
'use strict';
const canvas=document.querySelector('#canvas'),g=canvas.getContext('2d');
const W=1080,H=1920,C={paper:'#fff',ink:'#162B42',orange:'#FF821C',pale:'#FFF2E7',grey:'#E9EDF0',muted:'#637184',skin:'#E8B28C',skinShade:'#D99B76',cream:'#F7F3EC',light:'#F4F6F7'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>1-(1-clamp(t))**3,smooth=t=>{t=clamp(t);return t*t*(3-2*t)},lerp=(a,b,t)=>a+(b-a)*t;
let config,logo=null,scenes=[],activeTime=0;
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
 const wob=Math.sin(t*2)*4;
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
function header(index,t){
 text('ZENLIX / SOLUTIONS',106,108,22,C.ink,800,'left','ltr');
 const labels=['كل رنّة… فرصة','العميل مش هيستنى','المتابعة بتفرق','التقييم للتطوير','فاكرين التفاصيل','الثقة بتتبني','كل مكالمة ليها قيمة'];
 text(labels[index],946,108,20,C.muted,400,'right');
 for(let i=0;i<7;i++)rr(108+i*28,1770,17,6,3,i===index?C.orange:C.grey,null);
 text('zenlix.org',946,1771,24,C.muted,700,'right','ltr');
}
function headline(index,t,{first=C.ink,second=C.orange,y=238,size=67}={}){const a=config.scenes[index].headline;appear(t,-.12,()=>text(a[0],540,y,size,first,800),{duration:.65,y:18});appear(t,.12,()=>text(a[1],540,y+96,size,second,800),{duration:.65,y:20});}
function restaurantInterior(t,p=1){
 line(126,1450,944,1450,C.ink,3,p);person(817,1373,.52,t,{kind:'customer',seated:true,pose:'typing',talk:true,look:-1,alpha:p});shape('M132 1268V579Q132 544 169 544H368V1114',null,C.grey,4,p);shape('M714 1221V549H901V1300',null,C.grey,4,p);line(168,690,365,690,C.grey,3,p);line(267,545,267,1135,C.grey,3,p);line(709,692,902,692,C.grey,3,p);
 for(const [x,y] of [[216,745],[822,690]]){line(x,491,x,y-68,C.muted,2,p);shape(`M${x-41} ${y}Q${x-35} ${y-68} ${x} ${y-68}Q${x+35} ${y-68} ${x+41} ${y}Z`,C.orange,C.ink,3,p);}
 at(811,1284,.75,()=>{ellipse(0,-90,130,25,C.paper,C.ink,3,p);line(-110,-87,-100,110,C.ink,3,p);line(110,-87,100,110,C.ink,3,p);plate(0,-100,.55,p);rr(84,-2,56,42,6,C.orange,C.ink,3,p);line(102,40,102,123,C.ink,3,p);line(144,40,144,123,C.ink,3,p);});plant(174,1450,.59,p);
}
function hook(t){
 headline(0,t);restaurantInterior(t,ease((t+.1)/1.1));plate(768,1445,.78,ease((t+.3)/.9));plate(919,1453,.42,ease((t+.1)/1.1));
 const ringAt=1.1,lossAt=2.4,surprised=t>ringAt;
 const ownerScale=1.42+(.055*Math.sin(t*.5));person(374,1452,ownerScale,t,{kind:'owner',pose:surprised?'open':'rest',mood:surprised?'surprise':'calm',look:1});
 const p=ease((t-ringAt)/.75);at(746,800,1,()=>{g.rotate((1-p)*-.28+Math.sin(t*19)*.018*(t<5));device(0,0,1.06*p,ease((t-ringAt)/.9),{missed:t>4,ring:t<4});},0,p);
 for(let i=0;i<3;i++){const progress=clamp((t-lossAt-i*.65)/2.5),x=lerp(765+i*34,1040+i*70,progress),y=lerp(1255+i*68,1120-i*80,progress);at(x,y,.61,()=>{if(i%2)bag(0,0,.65);else receipt(0,0,.7);},progress*.7,1-progress);}
 appear(t,4.5,()=>{rr(205,1524,669,89,15,C.pale,null);text('فرصة بتضيع… مع كل رنّة من غير رد',540,1570,31,C.ink,700);},{y:12});
 if(t>.7&&t<2.4){const p1=(t-.7)/1.7;ellipse(746,800,148+p1*38,286+p1*38,null,C.orange,3*(1-p1));}
}
function lostCustomer(t){
 headline(1,t,{size:61});
 const noAnswer=t>3.4,away=t>8.3,fade=ease((t-7.8)/1.2);
 person(325,1180,1.18,t,{kind:'customer',pose:'phone',mood:away?'calm':noAnswer?'upset':'calm',talk:t<3,look:1});
 device(758,851,.93,ease((t-.5)/.9),{missed:noAnswer,ring:!noAnswer||(t>5.3&&t<7.8)});
 if(t<8.4){appear(t,1.7,()=>badge(t<5.3?'المحاولة الأولى':'محاولة تانية',754,1212,275),{y:10});}
 at(513+fade*330,1325-fade*83,.69,()=>{receipt(0,0,1);bag(-156,17,.7);},fade*.26,1-fade);
 arrow('M287 1287C219 1553 774 1620 835 1439',ease((t-8.1)/1.6));
 appear(t,8.8,()=>restaurant(760,1500,.73,1,{rival:true}),{y:18});
 if(away){appear(t,9.4,()=>text('ممكن يختار غيرك',306,1537,34,C.ink,800),{y:10});}
}
function followUp(t){
 headline(2,t,{size:65});
 if(t<3.7){const p=ease(t/1.2);receipt(540,927,1.7,1,{faded:true});rr(338,693,404,480,20,null,C.orange,5,p);arrow('M156 1354C126 1086 119 672 349 661C513 653 725 645 905 642',ease(t/1.7));text('لسه تقدر تتواصل',540,1271,39,C.ink,700);if(t>1.8){g.save();g.globalAlpha=ease((t-1.8)/.5);if(logo){const w=685;g.drawImage(logo,540-w/2,485,w,w*logo.height/logo.width);}else{text('Zenlix Solutions',540,565,58,C.ink,800,'center','ltr');}g.restore();}}
 else{
 const local=t-3.7;appear(local,0,()=>{
 rr(122,568,820,540,23,C.paper,C.ink,3,ease(local/.9));
 text('المكالمات والمتابعة',891,617,35,C.ink,800,'right');line(154,659,910,659,C.grey,2);
 const data=[['مكالمة فائتة','مطلوب متابعة'],['عميل سابق','اتصال متابعة']];
 data.forEach((a,i)=>{const yy=739+i*130;ellipse(856,yy,31,31,C.pale,null);phoneIcon(856,yy,.47,C.orange);text(a[0],790,yy-15,29,C.ink,700,'right');text(a[1],790,yy+28,24,C.muted,400,'right');if(i===0&&t>6.2){rr(173,yy-27,223,65,12,C.orange,C.orange);text(t>8.6?'جارٍ التواصل':'اتصال متابعة',285,yy+5,25,C.ink,800);}});
 text('تصوّر توضيحي لرحلة المتابعة',888,1060,21,C.muted,400,'right');},{y:20});
 const call=t>8.6;deskAgent(287,1498,.77,t,'agent',{pose:call?'phone':'typing'});person(794,1611,.69,t,{kind:'customer',pose:call?'phone':'rest',mood:'calm',talk:call,look:-1});
 arrow('M414 1364C503 1213 638 1200 729 1325',ease((t-6.3)/1.4));
 if(call)appear(t,8.8,()=>{badge('فرصة تتفتح من جديد',543,1660,449,true);},{y:8});
 }
}
function team(t){
 headline(3,t,{size:65});
 const coaching=t>6.3,improved=t>10.2;
 if(t<5.8){[250,540,830].forEach((x,i)=>{appear(t,.5+i*.25,()=>{deskAgent(x,1150,.73,t,i===1?'agent':'operator');performance(x,643,254,['عمر','منى','كريم'][i],i===2?'محتاج دعم':'تواصل واضح',ease((t-1.3-i*.2)/.7),{improved:i!==2});},{y:20});});
 text('سرعة الرد  ·  جودة التعامل  ·  فهم الطلب',540,1532,31,C.ink,700);
 }else{
 appear(t,5.8,()=>{
 person(268,1535,1.25,t,{kind:'owner',pose:'coach',talk:true,look:1});
 deskAgent(797,1433,1.06,t,'operator',{mood:improved?'calm':'calm'});
 speech(455,572,482,245,()=>{text('ملاحظة للتطوير',693,626,34,C.ink,800);text('اسمع العميل للآخر',693,693,31,C.ink,700);text('وأكّد تفاصيل طلبه',693,750,30,C.muted,400);},ease((t-6.2)/.7));
 arrow('M429 1107C439 912 599 888 687 955',ease((t-7)/1.1));
 performance(756,840,339,'تطور الأداء',improved?'تحسّن بعد التدريب':'خطوة بخطوة',1,{improved});
 if(improved){check(506,1505,1.7,ease((t-10.2)/.5));text('تقييم يفيد… وتدريب يطوّر',540,1650,36,C.ink,800);}
 },{y:20});
 }
}
function profileCard(x,y,s,t,{saved=false,history=false,p=1}={}){
 at(x,y,s,()=>{
 rr(-291,-230,582,464,20,C.paper,C.ink,3,p);
 if(p>.75){ellipse(217,-159,37,37,C.pale,null);at(217,-74,.19,()=>head('customer',0));text('ملف العميل',147,-168,31,C.ink,800,'right');text('سجل التواصل',147,-121,23,C.muted,400,'right');line(-252,-78,252,-78,C.grey,2);
 rr(-252,-39,504,127,13,history?C.pale:C.light,null);notice(206,7,.51);text('ملاحظة على الطلب',165,-3,27,C.ink,700,'right');text(history?'الشكوى السابقة قدّامك':'تفاصيل الشكوى محفوظة',165,47,24,C.muted,400,'right');
 line(-211,124,-211,173,C.orange,3);ellipse(-211,119,6,6,C.orange,null);ellipse(-211,177,6,6,C.orange,null);text(history?'متابعة المكالمة الحالية':'تسجيل ومتابعة',201,149,26,C.ink,700,'right');if(saved)check(-159,149,.85);
 }
 });
}
function complaints(t){
 headline(4,t,{size:60});
 const saved=t>4.5,again=t>8.1,reassured=t>11.5;
 if(t<7.4){
 person(252,1353,1.09,t,{kind:'customer',pose:'phone',mood:'upset',talk:true,look:1});
 deskAgent(789,1249,.86,t,'agent',{pose:'typing'});
 appear(t,1.1,()=>profileCard(540,689,.91,t,{saved,p:ease((t-1.1)/.7)}),{y:18});
 arrow('M293 1016C363 939 477 911 568 915',ease((t-2)/1.2));
 if(saved)appear(t,4.7,()=>{badge('الشكوى مرتبطة بملف العميل',540,1543,654,true);},{y:12});
 }else{
 appear(t,7.4,()=>{
 badge('في المكالمة اللي بعدها',540,540,439);
 profileCard(540,845,1.0,t,{saved:true,history:true});
 person(265,1670,.97,t,{kind:'customer',pose:'phone',mood:reassured?'calm':'upset',talk:!reassured,look:1});
 deskAgent(792,1482,.84,t,'agent',{pose:'phone'});
 arrow('M523 1147C579 1245 676 1190 742 1251',ease((t-8.4)/1.1));
 if(reassured){speech(88,1082,350,91,()=>text('فاهمين مشكلتك',263,1128,28,C.ink,700),ease((t-11.4)/.7));heart(531,1442,.79,ease((t-12)/.6));text('من غير ما يعيد الحكاية',540,1712,35,C.ink,800);}
 },{y:18});
 }
}
function trust(t){
 headline(5,t,{size:70});
 const p=ease((t-.5)/1.3);heart(540,821,2.5,p);if(t>2.1){line(540,889,540,948,C.orange,4,ease((t-2.1)/.6));ellipse(540,1015,57,57,C.pale,C.orange,2,ease((t-2.3)/.6));at(540,1140,.28,()=>head('agent',t,'calm',true),0,ease((t-2.5)/.5));text('فريقك',540,1100,23,C.muted,700);}
 arrow('M404 847C254 820 186 1017 267 1131',ease((t-1.4)/1.4),C.orange,5);
 arrow('M675 847C834 840 904 1027 814 1134',ease((t-1.8)/1.4),C.orange,5);
 arrow('M338 1451C441 1558 659 1567 751 1453',ease((t-2.5)/1.4),C.orange,5);
 person(253,1516,1.03,t,{kind:'customer',pose:'rest',mood:'calm',look:1});
 person(830,1516,1.01,t,{kind:'owner',pose:'open',mood:'calm',look:-1});
 appear(t,2.7,()=>{restaurant(540,1282,.58);bag(545,1435,.49);},{y:15});
 if(t>4.6){const lp=ease((t-4.6)/.8);rr(190,565,700,137,18,C.paper,C.ink,3,lp);if(lp>.85){text('مكالمات   ·   فريقك   ·   متابعة العملاء',540,633,31,C.ink,700);}}
 appear(t,6.3,()=>text('ثقة النهارده… فرصة يرجع بكرة',540,1665,34,C.ink,800),{y:15});
}
function closing(t){
 if(t<2.6){for(let i=0;i<6;i++){const x=130+i*160,y=i%2?1350:550;const p=ease(t/1.8);arrow(`M${x} ${y}Q${lerp(x,540,.6)} ${y<900?820:1100} 540 960`,p,C.orange,4);}}
 const p=ease((t-1.2)/1.1);g.save();g.globalAlpha*=p;
 if(logo){const width=760,height=width*logo.height/logo.width;g.drawImage(logo,540-width/2,700-height/2,width,height);}
 else{text('Zenlix',540,729,134,C.ink,800,'center','ltr');text('SOLUTIONS',540,837,34,C.ink,700,'center','ltr');}
 g.restore();
 appear(t,2.2,()=>{text('كل مكالمة',540,1064,77,C.ink,800);text('ليها قيمة',540,1182,91,C.orange,800);},{y:20});
 appear(t,3.3,()=>{line(359,1333,721,1333,C.orange,5,ease((t-3.3)/.9));text('zenlix.org',540,1433,46,C.ink,700,'center','ltr');},{y:12});
}
const renderers=[hook,lostCustomer,followUp,team,complaints,trust,closing];
function render(time){if(!config)return 0;const t=clamp(time,0,config.duration-.001);activeTime=t;const i=scenes.findIndex(s=>t<s.end),local=t-scenes[i].start;g.resetTransform();g.globalAlpha=1;g.fillStyle=C.paper;g.fillRect(0,0,W,H);renderers[i](local);header(i,local);
 // A single continuous orange pen stroke joins every scene; no slide transition.
 if(i>0&&local<.48){const p=local/.48;g.save();g.globalAlpha=Math.sin(Math.PI*p)*.9;shape(`M-90 ${lerp(1740,-200,p)}Q520 ${lerp(1900,0,p)} 1180 ${lerp(1840,-100,p)}`,null,C.orange,16);g.restore();}
 return i;
}
async function load(){
 const r=await fetch('timeline.json');if(!r.ok)throw new Error('Missing timeline');config=await r.json();scenes=config.scenes;
 await Promise.all([document.fonts.load('800 70px Cairo','كل مكالمة ليها قيمة'),document.fonts.load('700 32px Cairo','فريقك'),document.fonts.load('400 25px Cairo','متابعة'),document.fonts.load('800 60px Cairo','Zenlix')]);
 const response=await fetch('assets/brand-status.json');if(!response.ok)throw new Error('Missing brand status');const brand=await response.json();
 if(brand.authenticLogoReady){logo=new Image();logo.src=brand.asset;await logo.decode();}
 Object.assign(window.WhiteboardFilm,{config,scenes,logoReady:!!logo});render(0);return true;
}
window.WhiteboardFilm={canvas,render,config:null,scenes,ready:null};window.WhiteboardFilm.ready=load();
})();
