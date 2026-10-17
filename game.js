
// ARCHITECTURE: CONFIG + LEVEL DATA -> entity classes (update/draw) -> fixed 60Hz update() -> render(); state machine drives canvas UI.
const CFG={grav:1900,run:235,jump:660,coyote:.1,buf:.1,cd:.35,fbSpeed:470,fbLife:1.2,charges:6,refill:4,brazierR:130,timer:150,hearts:3,inv:1.2,lightWin:3,lightWinSaved:5,detour:40,wrong:10,bossTime:[200,140],bossHP:4,hurdleCharges:3,step:1/60};
const cv=document.getElementById('c'),ctx=cv.getContext('2d'),lc=document.createElement('canvas');lc.width=960;lc.height=540;const lx=lc.getContext('2d');
const W=960,H=540,G=440,M=Math,R=M.random,K={l:0,r:0,j:0,f:0,jp:0};
// LEVEL DATA (3 levels: 0 = Ash Road + Dark Forest merged, 1 = Sky Battle, 2 = Valdrik's Castle). P platforms[x,y,w,h] A alt-route B blocks[x,y,w,h,kind,need] T torches[x,y,kind,tag] mn minions[x,y,x0,x1] z dark zones[x,w,torch] br braziers cp checkpoints hz hazards K strikes tr triggers
const LV=[
{n:"Ash Road to the Dark Forest",n2:"The Dark Forest",w:7000,
get th(){return S.ph?1:0},get dark(){return S.ph?.62:.2},vo:4,tm:270,fz:3200,mira:3330,amb:[[3040,G,2970,3095,1],[3085,G,3030,3099],[2760,G,2680,2840]],
story:["Ash fell on Shams's forge the night Qaher came.","Noor pressed an ember pendant into his hand: 'It glows while I live.'","The Shadow King's trail runs down the Ash Road, and into the Dark Forest beyond."],
hint:["Arrows/WASD move, Space jumps","J throws Ember Strike: burn webs and barricades","Stand at a brazier to refill flames. Stomp or burn shadows."],
hint2:["Dark zones make shadows faster: light the torches","Gate torches need fire from your Ember Strike","Beware: some choices cost more than flame."],
P:[[0,G,820,100],[930,G,700,100],[1740,G,1460,100],[1100,350,120,16],[1250,262,110,16],
 [3200,G,620,100],[3920,G,740,100],[4760,G,2240,100],[3600,350,110,16],[4100,350,120,16],[4250,262,110,16]],
A:[[5000,350,90,16],[5100,262,80,16],[5190,180,140,16],[5370,262,90,16],[5490,350,90,16]],
B:[[560,320,36,120,'web'],[1450,310,40,130,'wood'],[2500,310,40,130,'wood'],
 [4590,300,30,140,'gate',[2]],[5200,240,30,200,'gate',[7,8,9]],[6550,240,30,200,'gate','riddle']],
T:[[720,G,'t'],[3080,G,'t'],
 [4200,G,'t'],[3740,G,'t'],[4880,G,'l','l'],[4940,G,'l','l'],[5000,G,'l','l'],[5060,G,'t','g'],[5100,G,'t','g'],[5140,G,'t','g']],
z:[[3350,420,3],[3930,640,2]],
mn:[[350,G,250,520],[1000,G,980,1200],[2000,G,1850,2200],[2750,G,2650,2950],
 [3500,G,3400,3760],[4100,G,3960,4500],[4900,G,4840,4980],[5700,G,5600,5850],[6050,G,5900,6150],[6350,G,6250,6450]],
shs:[[1305,230,0],[4305,228,1]],
br:[200,1760,2600,3280,4000,5500,6350],
cp:[60,1760,2300,2880,3260,3980,4780,5500],
hz:[[2150,424,70,16]],
F:[[430,3.4,.5,1],[1230,3.2,1.5,1],[1900,3,.2,1],[2420,3.4,2,1],[2900,3,1,1],[5800,3.4,.8,1],[6450,3.2,2,1]],
tr:[[2880,'ambush'],[4780,'hurdle'],[6200,'riddle']],vil:[4890,4950,5010],
goal:{x:6920}},
{n:"Sky Battle",w:960,th:2,dark:0,sky:1,story:["The castle rises into the clouds under a blood-purple moon.","Shadow archers wait on floating steps across the sky.","Noor's pendant is dimmer. Hurry."],hint:["Arrows/WASD move. Mouse (or Q/E) aims","Hold Space, J or click to charge, release to shoot","Stay in your zone. Defeat 6 shadows in 2 waves"],P:[],cp:[60],shs:[[310,200,2]]},
{n:"Valdrik's Castle",w:4200,th:2,dark:.72,boss:1,ao:3240,av:[3300,3340,4150],story:["Qaher waits, a shadow among shadows.","He is only vulnerable while your fire lights the room.","Throw fire to reveal him. Then strike."],hint:["Throw fire to light the room and reveal Qaher","While he is lit, hit him with a fireball or your sword (F)","Jump the shadow bolts. Do not touch him while he is visible."],
P:[[0,G,900,100],[1000,G,800,100],[1900,G,900,100],[2900,G,1300,100],[1500,360,80,16],[1580,280,80,16],[1660,200,80,16],[2150,350,120,16]],
B:[[700,280,26,160,'wood'],[2450,280,34,160,'web']],T:[[250,G,'t'],[1250,G,'t'],[2300,G,'t']],
mn:[[400,G,350,450],[1350,G,1300,1400],[2250,G,2200,2300],[1100,G,1100,1200,1],[2050,G,2050,2150,1],[2600,G,2550,2650,1],[3050,G,3050,3150,1],[650,G,600,720,1],[1720,G,1680,1760],[2780,G,2740,2790,1]],
br:[100,1050,1950,2950,3300,4120],cp:[60,1020,1920,2920],hz:[[600,424,50,16],[1300,424,50,16],[2300,424,60,16],[2650,424,50,16]],tr:[[3320,'boss']],spots:[3420,3720,4020],K:[[820,3.8,1.2],[1450,3.6,.3],[2150,3.4,2.1],[2750,3.6,.7]]}];
// LEVEL 1 TRIMMING: stretches of the long level are cut out (obstacles inside them removed) so it is ~18% shorter; everything else keeps its original spacing, so difficulty per screen is unchanged.
(function(){const l=LV[0],C=[[1370,1620],[2230,2480],[3100,3200],[4440,4580],[5880,6120],[6600,6840]];
const g=x=>{let d=0;for(const[a,b]of C)d+=M.max(0,M.min(x,b)-a);return x-d},ins=x=>C.some(([a,b])=>x>a&&x<b);
const pt=a=>a.filter(r=>!ins(r[0])).map(r=>[g(r[0]),...r.slice(1)]);
const pf=a=>a.map(r=>[g(r[0]),r[1],g(r[0]+r[2])-g(r[0]),r[3],...r.slice(4)]).filter(r=>r[2]>0);
l.P=pf(l.P);l.A=pf(l.A);l.B=pf(l.B.filter(r=>!ins(r[0])));
l.T=l.T.map(r=>[g(r[0]),...r.slice(1)]);l.z=l.z.map(r=>[g(r[0]),g(r[0]+r[1])-g(r[0]),r[2]]);
const mn=a=>a.filter(r=>!ins(r[0])).map(r=>{const q=r.slice();q[0]=g(r[0]);q[2]=g(r[2]);q[3]=g(r[3]);return q});
l.mn=mn(l.mn);l.mn.forEach((m,i)=>{if(i%3==1)m[4]=1});l.amb=mn(l.amb);l.shs=l.shs.map(r=>[g(r[0]),r[1],r[2]]);
l.br=l.br.filter(x=>!ins(x)).map(g);l.cp=l.cp.filter(x=>!ins(x)).map(g);l.hz=pt(l.hz);l.F=pt(l.F);l.tr=l.tr.map(r=>[g(r[0]),r[1]]);l.vil=l.vil.map(g);
l.goal.x=g(l.goal.x);l.fz=g(l.fz);l.mira=g(l.mira);l.w=g(l.w);l.tm=M.round(l.tm*l.w/7000/5)*5})();
const PAL=[['#2b1a4a','#b5473a','#ffb347'],['#02100f','#0a3a3a','#0d2b33'],['#1c0626','#6a1a45','#2a0a24']];
let state='TITLE',L=0,lv=LV[0],S={cam:0,t:0,torches:[],mins:[],blocks:[],plats:[],alt:[],zones:[],fb:[],bolts:[],ch:6},P,sh=[0,0,0],villageSaved=false,easy=false,fade={a:0,d:0,cb:null},shake=0,ptc=[],si=0,ri=[],rw=[],ending='';
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y,cl=(v,a,b)=>M.max(a,M.min(b,v));
const maxHp=()=>CFG.hearts+(lv.boss&&villageSaved&&S.boss?1:0);
function em(x,y,n,c,sp,life,g,sz){for(let i=0;i<n&&ptc.length<500;i++){const a=R()*6.28,s=R()*sp;ptc.push({x,y,vx:M.cos(a)*s,vy:M.sin(a)*s-sp*.3,l:life*(.5+R()*.5),m:life,c,g,s:sz*(.5+R())})}}
function msg(t){S.msg={t,l:3.5}}
function go(cb){fade.d=1;fade.cb=cb}
// ENTITIES
class Pl{constructor(x){this.x=x;this.y=G-44;this.w=24;this.h=44;this.vx=this.vy=0;this.face=1;this.g=1;this.co=this.bf=this.cd=this.inv=this.an=0;this.hp=maxHp()}
up(dt){const a=K.r-K.l;this.vx=a*CFG.run+(this.sa>0?this.face*110*M.pow(this.sa/SW_ANIM,2):0);if(a)this.face=a;this.an+=dt*(a?1:.2);{const sp=(this.an*12/M.PI)|0;if(!a||!this.g)this.ls=sp;else if(sp!==this.ls){this.ls=sp;SFX.step()}}this.cd-=dt;this.inv-=dt;this.co-=dt;this.bf-=dt;
if(K.jp){this.bf=CFG.buf;K.jp=0}if(this.g)this.co=CFG.coyote;
if(this.bf>0&&this.co>0){this.vy=-CFG.jump;this.bf=0;this.co=0;this.g=0;SFX.jump()}
if(!K.j&&this.vy<-300)this.vy=-300;if((K.f||fq>0)&&this.cd<=0){fq=0;fire()}fq-=dt;this.sw=(this.sw||0)-dt;this.sa=(this.sa||0)-dt;swq-=dt;if((K.s||swq>0)&&this.sw<=0){swq=0;swing()}if(this.sa>SW_END&&this.sa<SW_START)swHit();
this.vy=M.min(this.vy+CFG.grav*dt,950);const so=solids();
this.x+=this.vx*dt;for(const s of so)if(ov(this,s)){if(this.vx>0)this.x=s.x-this.w;else if(this.vx<0)this.x=s.x+s.w}
const wg=this.g,fv=this.vy;this.y+=this.vy*dt;this.g=0;for(const s of so)if(ov(this,s)){if(this.vy>0){this.y=s.y-this.h;this.g=1}else this.y=s.y+s.h;this.vy=0}
if(this.g&&!wg&&fv>250){SFX.land();FX.rings.push({x:this.x+12,y:this.y+44,r:4,v:150,l:.3,m:.3,c:'#caa58a',w:2,sq:.25});em(this.x+12,this.y+44,10,'#8a6a50',70,.5,-20,2);shake=M.max(shake,fv>700?4:1.5)}else if(this.g&&M.abs(this.vx)>1&&R()<.2)em(this.x+12,this.y+44,1,'#8a6a50',25,.4,-15,2)}
draw(){const mv=M.abs(this.vx)>1&&this.g;let r=pend();if(!(r>=0))r=1;ctx.save();ctx.translate(this.x+12,this.y+44);ctx.scale(this.face,1);if(this.inv>0&&((this.inv*20)|0)%2)ctx.globalAlpha=.4;
ctx.translate(0,mv?-M.abs(M.sin(this.an*12))*3.2:0);ctx.rotate(mv?.05:(this.g?0:-.06));
KW={a:mv?1:0,p:this.an*12,air:this.g?0:1};drawKit(CHARACTERS.shams,-100*KS,-322*KS,KS,S.t||0,null);KW.a=0;KW.air=0; // Shams: Kael look
ctx.save();ctx.globalAlpha*=.4+.6*r;ctx.fillStyle='#ffb347';ctx.shadowColor='#ff8a1f';ctx.shadowBlur=10*r;ctx.beginPath();ctx.arc(0,-37,2.6,0,6.3);ctx.fill();ctx.restore();
if(this.cd>.15){ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.arc(8.6,-21,5,0,6.3);ctx.fill()}
if(this.sa>0){const q=1-this.sa/SW_ANIM,e=q*q*(3-2*q),A0=-2.1,A1=.55,a=A0+(A1-A0)*e,fa=this.sa<.08?this.sa/.08:1;ctx.save();ctx.lineCap='round';ctx.shadowColor='#9ad0ff';ctx.shadowBlur=14;
for(let k=0;k<6;k++){const t0=M.max(0,e-.05*(k+1)),t1=M.max(0,e-.05*k);ctx.globalAlpha=fa*(.55-k*.085);ctx.strokeStyle='#e8f4ff';ctx.lineWidth=7-k;ctx.beginPath();ctx.arc(10,-24,54,A0+(A1-A0)*t0,A0+(A1-A0)*t1);ctx.stroke()}
ctx.globalAlpha=fa;ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(12+M.cos(a)*14,-24+M.sin(a)*14);ctx.lineTo(12+M.cos(a)*62,-24+M.sin(a)*62);ctx.stroke();ctx.restore()}ctx.restore()}}
function pl(a,f){ctx.beginPath();a.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();if(f){ctx.fillStyle=f;ctx.fill()}}
function limb(x,y,l,a,w,c){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+M.sin(a)*l,y+M.cos(a)*l);ctx.stroke()}
class Minion{constructor(a){this.x=a[0];this.y=a[1];this.x0=a[2];this.x1=a[3];this.c=a[4];this.dir=1;this.st='patrol';this.hp=1;this.t=R()*9;this.dead=0;this.face=1}
get b(){return{x:this.x-15,y:this.y-36,w:30,h:36}}
kill(){this.dead=1;SFX.kill();FX.stop=.05;em(this.x,this.y-18,22,'#8a4cff',150,.8,-80,3);em(this.x,this.y-18,8,'#ffb347',120,.5,60,2)}
up(dt){this.t+=dt;const ls=near(this.x),z=S.zones.some(z=>z.on&&this.x>z.x&&this.x<z.x+z.w),d=P.x-this.x;
if(ls){this.st='retreat';this.hp-=dt*.7}else if(M.abs(d)<(z?440:260)&&M.abs(P.y+P.h-this.y)<110)this.st='chase';else this.st='patrol';
const sp=this.st=='chase'?(z?150:95):this.st=='retreat'?80:45;let dir;
if(this.st=='patrol'){if(this.x<this.x0)this.dir=1;if(this.x>this.x1)this.dir=-1;dir=this.dir}else if(this.st=='chase')dir=this.c?(M.abs(d)<200?-M.sign(d):M.abs(d)>300?M.sign(d):0):M.sign(d)||1;else dir=M.sign(this.x-ls.x)||1;
this.x=cl(this.x+dir*sp*dt,this.x0-80,this.x1+80);this.face=dir||this.face;if(this.c&&this.st=='chase'&&M.abs(d)<420&&(this.cd=(this.cd||1.2)-dt)<=0){this.cd=2.2;SFX.bolt();S.bolts.push({x:this.x,y:this.y-20,vx:M.sign(d)*180})}if(R()<.2)em(this.x,this.y-10,1,'#6a3cc0',30,.8,-30,2);
if(this.hp<=0)return this.kill();
if(ov(this.b,P)){if(P.vy>60&&P.y+P.h<this.y-18){this.kill();P.vy=-420}else hurt()}}
draw(){ctx.save();ctx.translate(this.x,this.y);const w=M.sin(this.t*6)*3;ctx.fillStyle='#1b0a2e';ctx.shadowColor='#7a3cff';ctx.shadowBlur=12;if(this.c){const k=this.st=='chase'?M.max(0,1-(this.cd||1.2)/.6):0;gl(0,-26,26+22*k,'190,120,255',.35+.5*k)}ctx.beginPath();ctx.moveTo(-15,0);ctx.bezierCurveTo(-20,-30,-10,-42,0,-42);ctx.bezierCurveTo(10,-42,20,-30,15,0);ctx.quadraticCurveTo(10+w,-8,6,0);ctx.quadraticCurveTo(2,-10-w,-2,0);ctx.quadraticCurveTo(-6,-8+w,-10,0);ctx.quadraticCurveTo(-13,-4,-15,0);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=this.st=='retreat'?'#ffb347':'#ffe36a';ctx.beginPath();ctx.ellipse(-5*this.face,-28,2.5,4,0,0,6.3);ctx.ellipse(5*this.face,-28,2.5,4,0,0,6.3);ctx.fill();ctx.restore()}}
class Fireball{constructor(x,y,d){this.x=x;this.y=y;this.vx=d*CFG.fbSpeed;this.l=CFG.fbLife;this.dead=0}
up(dt){this.x+=this.vx*dt;this.l-=dt;em(this.x,this.y,2,R()<.5?'#ffb347':'#ff5a1f',40,.4,20,3);if(this.l<=0)this.dead=1;const b={x:this.x-8,y:this.y-8,w:16,h:16};
for(const s of S.plats)if(ov(b,s))return this.hit();
for(const k of S.blocks)if(!k.dead&&ov(b,k)){if(k.k=='gate')return this.hit();k.dead=1;SFX.crack();FX.rings.push({x:k.x+k.w/2,y:k.y+k.h/2,r:6,v:260,l:.4,m:.4,c:'#ffb347',w:3});em(k.x+k.w/2,k.y+k.h/2,30,'#ff8a1f',160,.9,60,3);shake=6;return this.dead=1}
for(const t of S.torches)if(!t.lit&&!t.lock&&ov(b,{x:t.x-14,y:t.y-70,w:28,h:70})){t.lit=1;SFX.torch();em(t.x,t.y-60,26,'#ffd27a',120,.8,-20,3);if(t.tag)em(t.x,t.y-60,10,'#fff',90,.5,0,2);return this.dead=1}
for(const m of S.mins)if(!m.dead&&ov(b,m.b)){m.kill();return this.dead=1}
const v=S.boss;if(v&&!v.dead&&ov(b,{x:v.x-32,y:G-130,w:64,h:130})){if(this.str&&S.lit>0&&v.iv<=0)v.hit();else v.deflect();return this.dead=1}}
hit(){em(this.x,this.y,10,'#ffd27a',100,.4,50,2);this.dead=1}
draw(){const g=ctx.createRadialGradient(this.x,this.y,1,this.x,this.y,14);g.addColorStop(0,'#fff6c0');g.addColorStop(.4,'#ffa030');g.addColorStop(1,'rgba(255,80,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(this.x,this.y,14,0,6.3);ctx.fill();gl(this.x,this.y,38,'255,130,40',.35);gl(this.x-M.sign(this.vx)*16,this.y,22,'255,90,20',.25)}}
class Valdrik{constructor(){this.cpt=0;this.sp=LV[2].spots;this.si=1;this.x=this.sp[1];this.hp=CFG.bossHP;this.mx=CFG.bossHP;this.ph=1;this.a=0;this.tpT=2.2;this.bc=1.5;this.tel=0;this.sh=9;this.dead=0;this.dt=2.2;this.fl=0;this.t=0;this.iv=0;this.cc=0;this.bq=[];this.sc=3}
tele(){const px=P.x+12;let c=[];this.sp.forEach((x,i)=>{if(i!=this.si&&M.abs(x-px)>140)c.push(i)});if(!c.length){let b=0,d=-1;this.sp.forEach((x,i)=>{if(i!=this.si&&M.abs(x-px)>d){d=M.abs(x-px);b=i}});c=[b]}const n=c[R()*c.length|0];em(this.x,G-50,30,'#8a4cff',200,.9,-60,4);SFX.tele();this.si=n;this.x=this.sp[n];em(this.x,G-50,30,'#8a4cff',200,.9,-60,4)}
shoot(){const d=P.x+12<this.x?-1:1;SFX.bolt();S.bolts.push({x:this.x+d*20,y:G-32,vx:d*258})}
ring(c,r,v,w){FX.rings.push({x:this.x,y:G-4,r:r||10,v:v||420,l:.7,m:.7,c:c||'#c060ff',w:w||5,sq:.25})}
deflect(){em(this.x,G-60,10,'#fff',160,.3,0,2);SFX.clink();if(S.lit<=0&&!S.used.d){S.used.d=1;msg('Light the room first, then strike while it glows!')}}
chip(){if(this.iv>0||this.dead||this.cc>0)return;this.cc=.4;SFX.clink();if(!S.used.ch){S.used.ch=1;msg('Your blade wounds the shadow! Light him with fire for a full hit.')}this.dmg(.5,0)}
hit(){if(this.iv>0||this.dead)return;this.dmg(1,1)}
dmg(n,full){const op=this.ph;this.hp=M.max(0,this.hp-n);this.ph=this.hp>2.5?1:this.hp>1.5?2:3;this.fl=full?.5:.3;shake=M.max(shake,full?14:6);FX.stop=full?.12:.07;FX.flash=full?.5:.2;FX.fc='255,210,140';SFX.bossHit();em(this.x,G-60,full?40:18,full?'#ffb347':'#c9a0ff',full?260:170,.9,40,3);this.ring(full?'#ffd27a':'#c9a0ff',10,full?420:260,full?5:3);if(full)S.lit=0;
if(this.hp<=0){this.dead=1;S.lit=2.5;S.bolts=[];S.sp=[];S.mins.forEach(m=>m.kill());FX.slow=.25;FX.flash=1;FX.fc='255,255,255';SFX.bossDie();this.ring('#fff',10,600,8);this.ring('#c060ff',10,380,6);return}
if(this.ph>op){this.ring('#ff4a6a',10,520,6);FX.flash=.7;FX.fc='255,60,100';shake=16;msg(this.ph==2?'Qaher howls! He fires in bursts and calls the shadows!':'Qaher is enraged! Spears of shadow fall from above!');this.tele();this.summon(this.ph==3?2:1)}
else if(full)this.tele()}
summon(n){for(let i=0;i<n&&S.mins.length<4;i++){const x=cl(P.x+(R()<.5?-1:1)*(240+R()*160),3300,4140);S.mins.push(new Minion([x,G,x-50,x+50,this.ph==3?1:i%2]));em(x,G-30,24,'#8a4cff',160,.8,-60,3)}}
up(dt){this.t+=dt;this.fl-=dt;this.iv-=dt;
if(this.dead){this.dt-=dt;if(R()<.7)em(this.x+(R()-.5)*60,G-R()*120,2,'#c9a0ff',80,1,-50,3);if(R()<.12){FX.flash=.25;FX.fc='200,150,255'}if(this.dt<=0&&!S.end){S.end=1;endGame()}return}
this.cc-=dt;S.lit=M.max(0,S.lit-dt);const lit=S.lit>0;this.a+=((lit?1:0)-this.a)*M.min(1,dt*7.8);
if(!lit&&(this.tpT-=dt)<=0){this.tele();this.tpT=this.ph==3?1.7:2.2;if(this.ph>=2&&R()<.5)this.summon(1)}
if((this.bc-=dt)<=0){this.bc=(lit?1.2:1.5)*(this.ph==1?1:this.ph==2?.85:.7);this.shoot();this.bq=this.ph==2?[.3]:this.ph==3?[.28,.56]:[]}this.sh=this.bc;
if(this.bq.length){this.bq=this.bq.map(x=>x-dt);while(this.bq.length&&this.bq[0]<=0){this.bq.shift();this.shoot()}}
S.sp=S.sp||[];if(this.ph>=2&&(this.sc-=dt)<=0){this.sc=this.ph==3?2.3:4;S.sp.push({x:cl(P.x+12+(R()-.5)*90,3270,4180),y:-60,t:.9,vy:0})}
for(const q of S.sp){if(q.t>0){q.t-=dt}else{q.vy+=1800*dt;q.y+=q.vy*dt;if(ov(P,{x:q.x-9,y:q.y-50,w:18,h:66}))hurt();if(q.y>=G){q.dead=1;em(q.x,G,12,'#c060ff',130,.4,-20,2);FX.rings.push({x:q.x,y:G-4,r:6,v:220,l:.3,m:.3,c:'#c060ff',w:3,sq:.25});shake=M.max(shake,3)}}}S.sp=S.sp.filter(q=>!q.dead);
if(this.a>.3&&ov(P,{x:this.x-28,y:G-84,w:56,h:84}))hurt()}
draw(){const ph=this.ph,lit=S.lit>0||this.dead||this.iv>0,a=this.dead?1:M.max(.1,this.a),df=this.dead?M.max(0,this.dt/2.2):1,col=ph==3?'255,50,90':'150,60,255',c1=ph==3?'#ff4a6a':'#c060ff';
(S.sp||[]).forEach(q=>{ctx.save();if(q.t>0){ctx.globalAlpha=.3+.3*M.sin(S.t*30);ctx.strokeStyle='#c060ff';ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(q.x,0);ctx.lineTo(q.x,G);ctx.stroke();ctx.setLineDash([]);gl(q.x,G,30,'170,90,255',.5)}else{gl(q.x,q.y,26,'170,90,255',.5);pl([[q.x-7,q.y-50],[q.x+7,q.y-50],[q.x,q.y+16]],'#8a4cff')}ctx.restore()});
const rise=this.iv>0?M.min(1,(3.2-this.iv)/1.8):1;ctx.save();ctx.translate(this.x,G+(1-rise)*110);ctx.scale(1.2,1.2);
gl(0,-60,150+10*M.sin(this.t*4),col,(lit?.32:.12)*rise*df);
if(!lit){ctx.strokeStyle='rgba(180,120,255,.35)';ctx.lineWidth=2;ctx.setLineDash([8,10]);ctx.lineDashOffset=-this.t*30;ctx.beginPath();ctx.ellipse(0,-56,48,70,0,0,6.3);ctx.stroke();ctx.setLineDash([])}
if(this.tel){const k=1-this.slt/.9;ctx.strokeStyle=`rgba(255,140,60,${.3+.5*k})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-2,30+k*140,6+k*8,0,0,6.3);ctx.stroke();gl(0,-4,40+k*60,'255,120,40',.3*k)}
ctx.globalAlpha=a*df;const w=M.sin(this.t*3)*5;ctx.strokeStyle='#1a0830';ctx.lineWidth=7;ctx.lineCap='round';for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*8,-70);ctx.quadraticCurveTo(i*16+M.sin(this.t*2+i)*10,-30,i*20+M.sin(this.t*3+i*2)*12,4);ctx.stroke()}
ctx.fillStyle=this.fl>0?'#fff':'#12041f';ctx.beginPath();ctx.moveTo(-30,0);ctx.bezierCurveTo(-34+w,-60,-18,-96,0,-100);ctx.bezierCurveTo(18,-96,34-w,-60,30,0);ctx.quadraticCurveTo(15,-10,0,0);ctx.quadraticCurveTo(-15,-12,-30,0);ctx.fill();
pl([[-34,-86],[-54,-110],[-24,-98]],'#2a0e4a');pl([[34,-86],[54,-110],[24,-98]],'#2a0e4a');pl([[-16,-100],[-18,-132],[-8,-112],[-3,-140],[0,-114],[3,-140],[8,-112],[18,-132],[16,-100]],ph==3?'#5a1030':'#3a1466');
ctx.strokeStyle='#4a2a7a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,-104);ctx.quadraticCurveTo(-34,-118,-30,-144);ctx.moveTo(14,-104);ctx.quadraticCurveTo(34,-118,30,-144);ctx.stroke();
const up=this.tel?1:this.sh<.5?.7:0;ctx.strokeStyle='#1a0830';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-26,-70);ctx.lineTo(-44,-60-up*50);ctx.moveTo(26,-70);ctx.lineTo(44,-60-up*50);ctx.stroke();if(up){gl(-44,-62-up*50,18,col,.7);gl(44,-62-up*50,18,col,.7)}
ctx.globalAlpha=M.max(a,.85)*df;gl(0,-56,26+5*M.sin(this.t*5),col,.8);ctx.fillStyle=c1;ctx.beginPath();ctx.arc(0,-56,5+M.sin(this.t*5),0,6.3);ctx.fill();
if(ph==3){ctx.strokeStyle='rgba(255,70,100,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-10,-30);ctx.lineTo(-4,-50);ctx.lineTo(-14,-70);ctx.moveTo(12,-24);ctx.lineTo(6,-48);ctx.lineTo(16,-64);ctx.stroke()}
ctx.globalAlpha=M.max(a,.9)*df;ctx.fillStyle=ph==3?'#ff6a8a':'#d9a0ff';ctx.shadowColor=c1;ctx.shadowBlur=16;ctx.beginPath();ctx.ellipse(-6,-84,3,5,0,0,6.3);ctx.ellipse(6,-84,3,5,0,0,6.3);ctx.fill();ctx.shadowBlur=0;
for(let i=0;i<5;i++){const an=this.t*1.6+i*1.257;gl(M.cos(an)*60,-66+M.sin(an)*34,8,col,.7*df)}ctx.restore()}}
// HELPERS
const solids=()=>S.plats.concat(S.altOn?S.alt:[],S.blocks.filter(b=>!b.dead));
function lights(){const a=[];if(!(S.boss&&S.boss.dead))(lv.F||[]).forEach(f=>{const p=(S.t+f[2])%f[1];if(p<f[3]||p>f[1]-.9)a.push({x:f[0],y:G-50,r:p<f[3]?110:70})});S.torches.forEach(t=>{if(t.lit)a.push({x:t.x,y:t.y-50,r:t.k=='l'?150:130})});(lv.br||[]).forEach(x=>a.push({x,y:G-20,r:120}));return a}
function near(x){return lights().find(l=>M.abs(l.x-x)<130&&l.r>=120)}
const pend=()=>easy?1:cl(S.tl/(S.max||150),0,1);
function fire(){if(S.ch<=0){P.cd=.35;SFX.empty();return}S.ch--;SFX.fire();P.cd=CFG.cd;{const f=new Fireball(P.x+12+P.face*14,P.y+16,P.face);f.str=S.lit>0;S.fb.push(f)}em(P.x+12+P.face*16,P.y+16,8,'#ffb347',90,.4,0,2);if(lv.boss&&(!lv.ao||S.boss))S.lit=villageSaved?CFG.lightWinSaved:CFG.lightWin}
const SW_ANIM=.3,SW_START=.26,SW_END=.1;let swq=0,fq=0,swHits=null,swBossHit=0;
function swing(){P.sw=.32;P.sa=SW_ANIM;P.sface=P.face;swHits=new Set();swBossHit=0;SFX.sword();swHit()}
function swHit(){if(!P||!swHits)return;const f=P.face,hb={x:f>0?P.x+8:P.x+16-104,y:P.y-14,w:104,h:70};let hit=0;for(const m of S.mins)if(!m.dead&&!swHits.has(m)&&ov(hb,m.b)){swHits.add(m);m.kill();hit=1;em(m.x,m.y-18,8,'#e8f4ff',140,.3,0,2)}const v=S.boss;if(v&&!v.dead&&!swBossHit&&ov(hb,{x:v.x-50,y:G-130,w:100,h:130})){swBossHit=1;if(S.lit>0&&v.iv<=0){v.hit()}else v.chip()}for(const b of S.bolts)if(ov(hb,{x:b.x-17,y:b.y-8,w:34,h:16})){em(b.x,b.y,12,'#e8f4ff',150,.3,0,2);SFX.clink();b.x=-999;hit=1}if(hit)shake=M.max(shake,4)}
function hurt(){if(P.inv>0||state!='PLAYING')return;P.hp--;P.inv=CFG.inv;shake=12;SFX.hurt();FX.flash=.4;FX.fc='255,40,30';FX.stop=.06;P.vy=-300;em(P.x+12,P.y+20,16,'#ff5a1f',160,.6,60,3);if(P.hp<=0)die()}
let failWhy='hp',failBoss=false;
function die(){if(state!='PLAYING'||S.end)return;failWhy=(!easy&&!lv.sky&&S.tl<=0)?'time':'hp';failBoss=!!(lv.boss&&S.boss&&!S.boss.dead);state='DEAD';if(failBoss)go(()=>cine('fail',()=>{respawn(1);musLevel(L)}));SFX.die();em(P.x+12,P.y+20,40,'#ff8a1f',220,1,40,3)}
function respawn(full){if(lv.sky)skInit();if(S.bar){S.blocks=S.blocks.filter(b=>b!==S.bar);S.bar=null;S.boss=null;S.used.b=0;S.lit=0}P=new Pl(S.cx);S.fb=[];S.bolts=[];S.sp=[];if(full){S.tl=easy?S.max:M.max(S.ctl,40);state='PLAYING'}S.ch=S.hu?M.max(S.torches.filter(t=>!t.lit&&!t.lock&&t.tag).length,0):CFG.charges;P.hp=full?maxHp():P.hp}
function load(i){L=i;lv=LV[i];const m=a=>({x:a[0],y:a[1],w:a[2],h:a[3]});
S={plats:lv.P.map(m).concat([{x:-40,y:0,w:40,h:540},{x:lv.w,y:0,w:40,h:540}]),alt:(lv.A||[]).map(m),altOn:0,blocks:(lv.B||[]).map(a=>({...m(a),k:a[4],need:a[5],dead:0})),torches:(lv.T||[]).map(a=>({x:a[0],y:a[1],k:a[2],tag:a[3],lit:0,lock:0})),mins:(lv.mn||[]).map(a=>new Minion(a)),zones:(lv.z||[]).map(a=>({x:a[0],w:a[1],t:a[2],on:1})),fb:[],bolts:[],cam:0,t:0,lit:0,cx:lv.cp[0],hu:0,hd:0,riddle:0,used:{},sl:0,rb:0,msg:null,end:0,
ch:CFG.charges,ref:0,max:lv.boss&&!lv.ao?CFG.bossTime[villageSaved?1:0]:(lv.tm||CFG.timer)};S.tl=S.max;S.ctl=S.max;S.boss=lv.boss&&!lv.ao?new Valdrik():null;P=new Pl(S.cx);state='PLAYING';musLevel(i);FX.rings=[];FX.slow=1;FX.stop=0;FX.flash=0;K.l=K.r=K.j=K.f=K.jp=0;if(lv.sky)skInit()}
function endGame(){ending=villageSaved&&sh.every(x=>x)?'secret':'normal';go(()=>cine('burn',()=>cine('reunion',()=>{state='ENDING';ptc=[]})))}
// UPDATE
function update(dt){
if(fade.d){fade.a+=fade.d*dt*2.2;if(fade.a>=1&&fade.d==1){fade.a=1;fade.d=-1;fade.cb&&fade.cb()}if(fade.a<=0&&fade.d==-1){fade.a=0;fade.d=0}}
if(FX.stop>0&&state=='PLAYING'){FX.stop-=dt;shake*=.88;musUp(dt);return}FX.stop=0;FX.slow=M.min(1,FX.slow+dt*.5);dt*=FX.slow;FX.flash=M.max(0,FX.flash-dt*1.8);for(let i=FX.rings.length;i--;){const r=FX.rings[i];r.r+=r.v*dt;r.l-=dt;if(r.l<=0)FX.rings.splice(i,1)}
if(lv.boss&&state=='PLAYING'&&R()<.0025){FX.flash=.5;FX.fc='190,150,255';SFX.thunder()}
S.t+=dt;shake*=.88;musUp(dt);for(let i=ptc.length;i--;){const p=ptc[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;p.l-=dt;if(p.l<=0)ptc.splice(i,1)}
if(state=='CINE'){cineUp(dt);return}
if(state=='TITLE'||state=='STORY'||state=='ENDING'){if(R()<.5)ptc.push({x:R()*W,y:H+5,vx:(R()-.5)*20,vy:-30-R()*50,l:5,m:5,c:R()<.5?'#ffb347':'#ff6a2a',g:0,s:1+R()*2});return}
if(state!='PLAYING')return;
if(S.msg&&(S.msg.l-=dt)<=0)S.msg=null;if(lv.sky){skUp(dt);return}
if(!lv.sky&&R()<.35)ptc.push({x:S.cam+R()*W,y:-5,vx:-20-R()*20,vy:30+R()*40,l:6,m:6,c:['#d8b090','#9affd0','#c090ff'][lv.th],g:0,s:1+R()*1.5}); // drifting ash / spores / motes
if(!easy){S.tl-=dt;if(S.tl<=0){S.tl=0;return die()}}
P.up(dt);if(P.y>700){hurt();const h=P.hp;if(state=='PLAYING'){respawn(0);P.hp=h;P.inv=CFG.inv}}
S.cam+=((S.bar?S.bar.x:P.x+12+P.face*60-W/2)-S.cam)*M.min(1,dt*5);S.cam=cl(S.cam,S.cmin||0,M.max(0,lv.w-W));
// flame refill
const nb=!S.hu&&(lv.br||[]).some(x=>M.abs(P.x+12-x)<CFG.brazierR);if(nb&&S.ch<CFG.charges){S.ref+=dt;if(S.ref>=CFG.refill){S.ch++;S.ref=0;em(P.x+12,P.y+10,12,'#ffd27a',80,.6,-40,2)}}else S.ref=0;
S.torches.forEach(t=>{if(t.lit&&R()<.4)em(t.x,t.y-(t.k=='l'?55:62),1,'#ffb347',20,.8,-50,2)});(lv.br||[]).forEach(x=>{if(R()<.5)em(x,G-28,1,'#ff8a1f',25,.9,-60,2.5)});
S.fb.forEach(f=>f.up(dt));S.fb=S.fb.filter(f=>!f.dead);S.mins.forEach(m=>m.up(dt));S.mins=S.mins.filter(m=>!m.dead);
S.zones.forEach(z=>{if(z.on&&S.torches[z.t].lit){z.on=0;em(z.x+z.w/2,G-60,40,'#ffd27a',200,1,-20,3)}});
S.blocks.forEach(b=>{if(b.dead||b.k!='gate')return;if((Array.isArray(b.need)&&b.need.every(i=>S.torches[i].lit))||(b.need=='riddle'&&S.riddle)){b.dead=1;shake=8;em(b.x+15,b.y+b.h/2,40,'#ffd27a',200,1,40,3);msg('The way is open!')}});
// hurdle completion / softlock
if(S.hu){const need=S.torches.filter(t=>t.tag==(villageSaved?'l':'g'));if(need.every(t=>t.lit)){S.hu=0;S.hd=1;msg(villageSaved?'The villagers are saved! The gate stays shut: take the long way.':'The gate opens. Behind you, the village falls dark forever.')}
else if(S.ch<need.filter(t=>!t.lit).length&&!S.fb.length){S.sl+=dt;if(S.sl>1.5){S.sl=0;msg('The embers fade... try again.');respawn(1)}}else S.sl=0}
(lv.K||[]).forEach(k=>{const c=(S.t+k[2])%k[1];if(c>k[1]-.3&&M.abs(P.x+12-k[0])<22)hurt()});
(lv.hz||[]).forEach(h=>{if(ov(P,{x:h[0],y:h[1],w:h[2],h:h[3]}))hurt()});
if(!(S.boss&&S.boss.dead)){(lv.F||[]).forEach(f=>{const p=(S.t+f[2])%f[1];if(p<f[3]){if(!f.a){f.a=1;SFX.vent(M.abs(P.x-f[0]))}if(R()<.5)em(f[0]+(R()-.5)*20,G-R()*100,1,'#ffb347',30,.6,-90,2);if(p>.12&&ov(P,{x:f[0]-18,y:G-120,w:36,h:120}))hurt()}else f.a=0});if(lv.F&&!S.used.f&&lv.F.some(f=>M.abs(P.x-f[0])<320)){S.used.f=1;msg('Fire vents! When the glow dies down, dash through.')}}
if(S.boss)S.boss.up(dt);npcUp();if(!S.used.s&&S.mins.some(m=>M.abs(m.x-P.x-12)<110&&M.abs(m.y-P.y-44)<70)){S.used.s=1;msg('A shadow is close! Press F, Shift or click (or tap the sword button) to swing your sword.')}
S.bolts.forEach(b=>{b.x+=b.vx*dt;if(ov(P,{x:b.x-17,y:b.y-8,w:34,h:16})){hurt();b.x=-999}if(R()<.5)em(b.x,b.y,1,'#8a4cff',20,.5,0,3)});S.bolts=S.bolts.filter(b=>b.x>S.cam-60&&b.x<S.cam+W+60);
(lv.shs||[]).forEach(q=>{if(!sh[q[2]]&&M.hypot(P.x+12-q[0],P.y+20-q[1])<30){sh[q[2]]=1;SFX.shard();FX.flash=.3;FX.fc='120,240,255';em(q[0],q[1],40,'#7af0ff',200,1,0,3);msg('Ember shard found! ('+sh.filter(x=>x).length+'/3)')}});
lv.cp.forEach(c=>{if(P.x>c&&c>S.cx&&P.g){S.cx=c;S.ctl=S.tl;em(c,G-30,22,'#7af0ff',130,.9,-50,2.5);SFX.check();{const w=NW[(L*3+lv.cp.indexOf(c))%NW.length];msg(w)}}});
(lv.tr||[]).forEach(t=>{if(P.x<t[0])return;if(t[1]=='boss'&&!S.used.b&&state=='PLAYING'){S.used.b=1;S.boss=new Valdrik();S.bar={x:lv.ao,y:0,w:20,h:440,k:'gate',need:null,dead:0};S.blocks.push(S.bar);if(!easy)S.tl=M.max(S.tl,90)+(villageSaved?0:30);if(villageSaved){P.hp=maxHp();msg('The villagers come with lanterns!')}else msg('Valdrik awaits in the dark...')}if(t[1]=='ambush'&&!S.used.am&&state=='PLAYING'){S.used.am=1;lv.amb.forEach(a=>S.mins.push(new Minion(a)));shake=6;msg('Ambush! Shadows block the road to the forest!')}if(t[1]=='hurdle'&&!S.used.h&&P.g&&state=='PLAYING'){S.used.h=1;S.cx=t[0];S.ctl=S.tl;S.mins.forEach(m=>{if(!m.dead&&M.abs(m.x-P.x)<450){em(m.x,m.y-18,14,'#8a4cff',150,.6,-30,3);m.kill()}});K.l=K.r=K.j=K.f=K.jp=K.s=0;P.vx=0;state='CHOICE'}if(t[1]=='riddle'&&!S.riddle&&state=='PLAYING'){ri=[0,1,2].sort(()=>R()-.5);rw=[];state='RIDDLE'}});
if(lv.fz){const nph=P.x>lv.fz?1:0;if(nph!==S.ph){S.ph=nph;FX.flash=.5;FX.fc='6,4,16';if(nph&&!S.used.fo){S.used.fo=1;S.t0=S.t;musCue(48);msg('The Ash Road ends. The Dark Forest begins...')}}}
const g=lv.goal;if(g&&M.abs(P.x+12-g.x)<30&&(g.need==null||S.torches[g.need].lit)&&!S.end){S.end=1;SFX.win();go(()=>startStory(L+1))}}
let st=[0];
function startStory(i){load(i);state='STORY';si=0;ptc=[];st=[0]}
function choose(sv){villageSaved=sv;P.inv=2;P.vx=0;S.hu=1;S.torches.forEach(t=>{if((t.tag=='g'&&sv)||(t.tag=='l'&&!sv))t.lock=1});S.ch=CFG.hurdleCharges;if(sv){S.altOn=1;if(!easy)S.tl=M.max(S.tl-CFG.detour,8)}msg(sv?'Light the 3 lanterns!':'Light the 3 gate torches!');state='PLAYING'}
function answer(k){if(state!='RIDDLE'||rw.includes(k))return;if(k==0){S.riddle=1;state='PLAYING';msg('Correct! Time has hands, but cannot clap.')}else{rw.push(k);shake=10;if(!easy)S.tl=M.max(S.tl-CFG.wrong,3);msg('Wrong! -10 seconds of pendant time')}}
// UI BUTTONS (data) shared by draw and click
function btns(){const b=(x,y,w,h,t,f,s)=>({x,y,w,h,t,f,s});
if(state=='TITLE')return[b(370,330,220,56,'Start',()=>go(()=>cine('prologue',()=>startStory(0)))),b(370,400,220,44,'Easy mode: '+(easy?'ON':'OFF'),()=>easy=!easy)];
if(state=='DEAD')return failBoss?[]:[b(380,330,200,56,'Retry',()=>respawn(1))];
if(state=='ENDING')return[b(380,440,200,50,'Play again',()=>go(()=>{state='TITLE';sh=[0,0,0];villageSaved=false;lv=LV[0];S={cam:0,t:0,torches:[],mins:[],blocks:[],plats:[],alt:[],zones:[],fb:[],bolts:[],ch:6}}))];
if(state=='CHOICE')return[b(60,250,400,170,'A: RUSH ON',()=>choose(false),['Spend 3 flames on the gate torches.','Gate opens. The village falls into','permanent darkness. No time lost,','fewer light for the final fight.']),b(500,250,400,170,'B: SAVE THE VILLAGE',()=>choose(true),['Spend 3 flames on the lanterns.','Villagers saved. The gate stays shut:','a long detour costs ~40s of pendant','time. Allies will light the last fight.'])];
if(state=='RIDDLE')return ri.map((k,i)=>b(280,250+i*70,400,54,(i+1)+'.  '+['A clock','A king','A tower'][k],()=>answer(k),rw.includes(k)?1:0));return[]}
function click(x,y){const r=cv.getBoundingClientRect(),X=(x-r.left)*W/r.width,Y=(y-r.top)*H/r.height;for(const b of btns())if(X>b.x&&X<b.x+b.w&&Y>b.y&&Y<b.y+b.h){SFX.ui();return b.f()}if(state=='STORY')nextLine()}
function nextLine(){if(si<lv.story.length&&S.t-(st[si]||0)<lv.story[si].length/cps()){st[si]=-99;return}if(++si>=lv.story.length+1){go(()=>{state='PLAYING';ptc=[]})}else{st[si]=S.t}}
function cont(){if(state=='TITLE')go(()=>cine('prologue',()=>startStory(0)));else if(state=='STORY')nextLine();else if(state=='DEAD'){if(!failBoss)respawn(1)}else if(state=='PAUSED'||state=='MAP')state='PLAYING'}
// RENDER
function t_(s,x,y,sz,c,al,f){ctx.font=(f||'')+' '+sz+'px Georgia,serif';ctx.fillStyle=c;ctx.textAlign=al||'center';ctx.fillText(s,x,y)}
function bg(){if(lv.sky){skBg();return}const th=lv.th,c=PAL[th];let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,c[0]);g.addColorStop(.65,c[1]);g.addColorStop(1,c[2]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
if(th==0){g=ctx.createRadialGradient(680,380,10,680,380,200);g.addColorStop(0,'#ffe9a0');g.addColorStop(.3,'rgba(255,170,60,.8)');g.addColorStop(1,'rgba(255,100,40,0)');ctx.fillStyle=g;ctx.fillRect(400,150,560,400)}
if(th==2){g=ctx.createRadialGradient(700,160,20,700,160,150);g.addColorStop(0,'#ffe0e0');g.addColorStop(.7,'#d9a0c0');g.addColorStop(1,'rgba(200,80,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(700,160,150,0,6.3);ctx.fill();ctx.fillStyle='rgba(120,60,90,.25)';[[670,130,22],[730,190,16],[700,110,10]].forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,6.3);ctx.fill()})}
const cols=[['#3a2250','#2a1a3a','#1a0f24'],['#0b3033','#071f22','#030f12'],['#4a1a4a','#33102f','#1c0820']][th];
for(let i=0;i<3;i++){const f=[.12,.3,.55][i],off=S.cam*f,base=[330,380,430][i],amp=[70,55,40][i];ctx.fillStyle=cols[i];ctx.beginPath();ctx.moveTo(0,H);
for(let k=-1;k<=W/20+1;k++){const wx=((off/20|0)+k)*20,x=wx-off;let y=base-amp*(M.sin(wx*.006+i*2)+.6*M.sin(wx*.017+i));if(th==1)y-=((wx/20|0)&1)*amp*.5;if(th==2&&((wx/40|0)%5==0))y-=40+i*10;ctx.lineTo(x,y)}
ctx.lineTo(W,H);ctx.fill();
if(th==1&&i==1){ctx.globalCompositeOperation='lighter';for(let k=0;k<20;k++){const x=((k*173+S.t*8*(k%3+1)-S.cam*.8)%1040+1040)%1040-40,y=200+(k*47)%240+M.sin(S.t+k)*14,a=.4+.6*M.sin(S.t*2+k);ctx.fillStyle=`rgba(200,255,120,${a*.7})`;ctx.beginPath();ctx.arc(x,y,2.5,0,6.3);ctx.fill()}ctx.globalCompositeOperation='source-over'}}}
function world(){const gc=['#4a2a1e','#12322f','#2e1230'][lv.th],tc=['#b0652a','#2f8f7a','#8a2d5a'][lv.th],pp=S.plats.concat(S.altOn?S.alt:[]);
pp.forEach(p=>{if(p.x+p.w<S.cam-50||p.x>S.cam+W+50||p.x<0&&p.w<50||p.x>=lv.w||p.hid)return;ctx.fillStyle=gc;ctx.beginPath();ctx.moveTo(p.x,p.y+3);ctx.quadraticCurveTo(p.x+p.w/2,p.y-4,p.x+p.w,p.y+3);ctx.lineTo(p.x+p.w-3,p.y+p.h);ctx.lineTo(p.x+3,p.y+p.h);ctx.fill();ctx.strokeStyle=tc;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y+3);ctx.quadraticCurveTo(p.x+p.w/2,p.y-4,p.x+p.w,p.y+3);ctx.stroke();ctx.strokeStyle=tc;ctx.lineWidth=1.6;ctx.lineCap='round';ctx.beginPath();for(let x=M.max(p.x+8,S.cam-20);x<M.min(p.x+p.w-6,S.cam+W+20);x+=18){const sw=M.sin(S.t*1.6+x*.05)*2.5;ctx.moveTo(x,p.y+2);ctx.quadraticCurveTo(x+sw*.5,p.y-5,x+sw,p.y-8-(x%7))}ctx.stroke()});
(lv.hz||[]).forEach(h=>{for(let x=h[0];x<h[0]+h[2];x+=14)pl([[x,h[1]+16],[x+7,h[1]],[x+14,h[1]+16]],'#7a7aa0')});
(lv.K||[]).forEach(k=>{const c=(S.t+k[2])%k[1];if(c>k[1]-1.1){const a=c>k[1]-.3;ctx.save();ctx.translate(k[0],G);if(a){const g=ctx.createLinearGradient(0,-440,0,0);g.addColorStop(0,'rgba(80,0,160,0)');g.addColorStop(1,'rgba(160,80,255,.9)');ctx.fillStyle=g;pl([[-6,-440],[6,-440],[16,0],[-16,0]],g)}ctx.strokeStyle='rgba(180,100,255,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,24*(a?1:(c-k[1]+1.1)/.8),6,0,0,6.3);ctx.stroke();ctx.restore()}});
if(lv.vil)lv.vil.forEach((x,i)=>{const lit=S.torches[lv.vo+i].lit;ctx.save();ctx.translate(x+22,G);ctx.fillStyle=lit?'#c98a4a':'#2a1a30';ctx.beginPath();ctx.moveTo(-7,0);ctx.quadraticCurveTo(-8,-22,0,-26);ctx.quadraticCurveTo(8,-22,7,0);ctx.fill();ctx.beginPath();ctx.arc(0,-31,5,0,6.3);ctx.fill();if(lit)limb(5,-22,12,2.5+M.sin(S.t*6)*.4,3,'#c98a4a');ctx.restore()});
if(lv.boss&&villageSaved&&S.boss)(lv.av||[250,480,710]).forEach((x,i)=>{ctx.save();ctx.translate(x,G);ctx.fillStyle='#c98a4a';ctx.beginPath();ctx.moveTo(-8,0);ctx.quadraticCurveTo(-9,-24,0,-28);ctx.quadraticCurveTo(9,-24,8,0);ctx.fill();ctx.beginPath();ctx.arc(0,-34,6,0,6.3);ctx.fill();ctx.fillStyle='#ffd27a';ctx.shadowColor='#ffa030';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(12,-20,4,0,6.3);ctx.fill();ctx.restore()});
if(lv.boss&&S.boss){(lv.spots).forEach(x=>{ctx.fillStyle='rgba(90,30,160,.45)';ctx.beginPath();ctx.ellipse(x,G+2,40,7,0,0,6.3);ctx.fill()});ctx.save();ctx.translate(lv.ao||0,0);ctx.strokeStyle='#8a4cff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(915,G-50,20,0,6.3);ctx.stroke();pl([[905,G-30],[925,G-30],[920,G],[910,G]],'#3a2a50');ctx.fillStyle='rgba(255,180,90,'+(.15+.5*pend())+')';ctx.beginPath();ctx.arc(915,G-50,8,0,6.3);ctx.fill();ctx.restore()}
S.blocks.forEach(b=>{if(b.dead)return;ctx.save();ctx.translate(b.x,b.y);if(b.k=='web'){ctx.strokeStyle='rgba(230,230,240,.85)';ctx.lineWidth=1.5;const cx=b.w/2,cy=b.h/2;for(let i=0;i<8;i++){const a=i*.785;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+M.cos(a)*b.h/1.6,cy+M.sin(a)*b.h/1.6);ctx.stroke()}for(let r=14;r<b.h/2;r+=14){ctx.beginPath();for(let i=0;i<=8;i++){const a=i*.785,x=cx+M.cos(a)*r*.7,y=cy+M.sin(a)*r;i?ctx.quadraticCurveTo(cx+M.cos(a-.4)*r*.5,cy+M.sin(a-.4)*r*.8,x,y):ctx.moveTo(x,y)}ctx.stroke()}}
else if(b.k=='wood'){for(let y=0;y<b.h;y+=22)pl([[0,y+2],[b.w,y],[b.w+2,y+18],[-1,y+20]],y%44?'#6b4423':'#7d5230');ctx.strokeStyle='#3a2210';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.w/2,0);ctx.lineTo(b.w/2,b.h);ctx.stroke()}
else{const g=ctx.createLinearGradient(0,0,b.w,0);g.addColorStop(0,'#2a1a3a');g.addColorStop(1,'#4a2a5a');pl([[0,0],[b.w,4],[b.w,b.h],[0,b.h]],g);ctx.strokeStyle='#8a4cff';ctx.lineWidth=2;for(let y=20;y<b.h;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.quadraticCurveTo(b.w/2,y+8,b.w,y);ctx.stroke()}}ctx.restore()});
S.torches.forEach(t=>{ctx.save();ctx.translate(t.x,t.y);const dim=t.lock&&!t.lit;ctx.fillStyle=dim?'#2a2430':'#5a3a22';if(t.k=='l'){limb(0,0,-62,0,3,'#3a2a22');pl([[-9,-62],[9,-62],[12,-40],[0,-34],[-12,-40]],dim?'#242030':'#2a1a14');if(t.lit){const g=ctx.createRadialGradient(0,-50,2,0,-50,22);g.addColorStop(0,'#fff0b0');g.addColorStop(1,'rgba(255,150,40,.1)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-50,13,0,6.3);ctx.fill()}}
else{pl([[-3,0],[3,0],[2,-50],[-2,-50]],dim?'#2a2430':'#5a3a22');pl([[-10,-60],[10,-60],[5,-48],[-5,-48]],'#2a1a14');if(t.lit){const f=M.sin(S.t*14+t.x)*3;ctx.fillStyle='#ff8a1f';ctx.beginPath();ctx.moveTo(-7,-60);ctx.bezierCurveTo(-10,-72,-2,-76+f,0,-88+f);ctx.bezierCurveTo(4,-76,10,-72,7,-60);ctx.fill();ctx.fillStyle='#ffe27a';ctx.beginPath();ctx.moveTo(-3,-60);ctx.bezierCurveTo(-4,-68,0,-70,0,-76+f);ctx.bezierCurveTo(2,-70,5,-68,3,-60);ctx.fill()}}ctx.restore()});
(lv.br||[]).forEach(x=>{ctx.save();ctx.translate(x,G);pl([[-14,-26],[14,-26],[8,-14],[3,0],[-3,0],[-8,-14]],'#3a2a22');ctx.fillStyle='#ff8a1f';const f=M.sin(S.t*12+x)*3;ctx.beginPath();ctx.moveTo(-10,-26);ctx.bezierCurveTo(-14,-38,-3,-42+f,0,-54+f);ctx.bezierCurveTo(4,-42,14,-38,10,-26);ctx.fill();ctx.restore()});
const g=lv.goal;if(g){ctx.save();ctx.translate(g.x,G);if(g.map){const a=S.torches[g.need].lit?1:.06;ctx.globalAlpha=a;pl([[-16,-76],[14,-80],[18,-52],[-12,-48]],'#e6cfa0');ctx.strokeStyle='#9a2a1a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,-70);ctx.quadraticCurveTo(0,-58,10,-72);ctx.stroke();ctx.globalAlpha=1}
else{const gg=ctx.createRadialGradient(0,-50,5,0,-50,80);gg.addColorStop(0,'rgba(255,200,120,.7)');gg.addColorStop(1,'rgba(255,100,60,0)');ctx.fillStyle=gg;ctx.fillRect(-80,-130,160,130);ctx.strokeStyle='#8a4cff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(-34,-70);ctx.bezierCurveTo(-34,-120,34,-120,34,-70);ctx.lineTo(34,0);ctx.stroke()}ctx.restore()}
(lv.shs||[]).forEach(q=>{if(sh[q[2]])return;ctx.save();ctx.translate(q[0],q[1]+M.sin(S.t*3)*4);ctx.rotate(M.sin(S.t*2)*.3);ctx.shadowColor='#7af0ff';ctx.shadowBlur=14;pl([[0,-12],[8,0],[0,12],[-8,0]],'#9af6ff');ctx.fillStyle='#fff';if(((S.t*3)|0)%2)ctx.fillRect(-1,-14,2,6);ctx.restore()});
fireVents();npcs();S.mins.forEach(m=>m.draw());if(S.boss)S.boss.draw();S.bolts.forEach(b=>{const g=ctx.createRadialGradient(b.x,b.y,2,b.x,b.y,20);g.addColorStop(0,'#e0b0ff');g.addColorStop(1,'rgba(90,20,170,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(b.x,b.y,b.w?30:22,b.w?14:9,0,0,6.3);ctx.fill()});
FX.rings.forEach(r=>{ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=M.max(0,r.l/r.m);ctx.strokeStyle=r.c;ctx.lineWidth=r.w||4;ctx.beginPath();ctx.ellipse(r.x,r.y,r.r,r.r*(r.sq||1),0,0,6.3);ctx.stroke();ctx.restore()});
if(state!='DEAD')P.draw();S.fb.forEach(f=>f.draw());ctx.globalCompositeOperation='lighter';ptc.forEach(p=>{ctx.globalAlpha=M.max(0,p.l/p.m);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.3);ctx.fill()});ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
function fireVents(){if(S.boss&&S.boss.dead)return;(lv.F||[]).forEach(f=>{const p=(S.t+f[2])%f[1],x=f[0],warn=p>f[1]-.9,on=p<f[3],w=on?1:warn?(p-(f[1]-.9))/.9:0;ctx.save();ctx.translate(x,G);
pl([[-24,3],[24,3],[17,-9],[-17,-9]],'#1a1018');ctx.strokeStyle='#4a2a22';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,-9);ctx.lineTo(17,-9);ctx.stroke();
ctx.fillStyle=`rgba(255,${90+100*w|0},30,${.2+.8*w})`;ctx.fillRect(-12,-10,24,3);
if(warn||on){gl(0,-8,26+34*w,'255,110,30',.2+.4*w);if(warn&&!on&&R()<.3)em(x+(R()-.5)*16,G-12,1,'#ffb347',20,.4,-50,2)}
if(on){const h=M.min(1,p/.15)*(p>f[3]-.2?(f[3]-p)/.2:1)*125,fl=M.sin(S.t*30+x)*4;gl(0,-h/2,80,'255,120,30',.45);
ctx.fillStyle='#ff5a1f';ctx.beginPath();ctx.moveTo(-18,-9);ctx.bezierCurveTo(-26,-h*.4,-8+fl,-h*.7,0,-h);ctx.bezierCurveTo(8-fl,-h*.7,26,-h*.4,18,-9);ctx.fill();
ctx.fillStyle='#ffa030';ctx.beginPath();ctx.moveTo(-11,-9);ctx.bezierCurveTo(-15,-h*.4,-3+fl,-h*.6,0,-h*.85);ctx.bezierCurveTo(3-fl,-h*.6,15,-h*.4,11,-9);ctx.fill();
ctx.fillStyle='#fff2b0';ctx.beginPath();ctx.moveTo(-5,-9);ctx.quadraticCurveTo(0,-h*.7,5,-9);ctx.fill()}
ctx.restore()})}
function fog(){for(let i=0;i<4;i++){const x=((i*330-S.cam*.5+S.t*10*(i%2+1))%1400+1400)%1400-220;gl(x,455+i%2*20,230,['120,100,150','90,200,170','160,90,140'][lv.th],.06)}}
function hole(x,y,r){const g=lx.createRadialGradient(x,y,r*.1,x,y,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=g;lx.fillRect(x-r,y-r,r*2,r*2)}
function dark(){const cx=S.cam;lx.globalCompositeOperation='source-over';lx.clearRect(0,0,W,H);lx.fillStyle=`rgba(6,2,16,${lv.boss&&S.lit>0?.4:S.bar?.94:lv.dark})`;lx.fillRect(0,0,W,H);
lx.fillStyle='rgba(40,0,70,.35)';S.zones.forEach(z=>{if(z.on)lx.fillRect(z.x-cx,0,z.w,H)});lx.globalCompositeOperation='destination-out';
hole(P.x+12-cx,P.y+20,easy?170:70+100*pend());lights().forEach(l=>hole(l.x-cx,l.y,l.r));S.fb.forEach(f=>hole(f.x-cx,f.y,95));if(lv.boss&&villageSaved&&S.boss)(lv.av||[250,480,710]).forEach(x=>hole(x-cx,G-20,90));
if(lv.boss&&S.boss&&S.lit>0)hole(S.boss.x-cx,G-50,160);ctx.drawImage(lc,0,0)}
function heart(x,y,s,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y+4*s);ctx.bezierCurveTo(x-9*s,y-4*s,x-10*s,y+7*s,x,y+13*s);ctx.bezierCurveTo(x+10*s,y+7*s,x+9*s,y-4*s,x,y+4*s);ctx.fill()}
const MN=[[120,400,0,'Forge & Ash Road'],[310,290,LV[0].fz?LV[0].fz/LV[0].w/3:.17,'Dark Forest'],[500,370,1/3,'Sky Battle'],[690,250,2/3,"Valdrik's Castle"],[850,180,1,'Noor']];
function mapPos(p){for(let i=1;i<MN.length;i++)if(p<=MN[i][2]||i==MN.length-1){const a=MN[i-1],b=MN[i],k=cl((p-a[2])/(b[2]-a[2]),0,1);return[LP(a[0],b[0],k),LP(a[1],b[1],k)]}}
function toggleMap(){if(state=='PLAYING'){K.l=K.r=K.j=K.f=K.jp=K.s=0;state='MAP'}else if(state=='MAP')state='PLAYING'}
function mapUI(){const p=prog(),q=mapPos(p),t=S.t;ctx.fillStyle='rgba(6,2,14,.93)';ctx.fillRect(0,0,W,H);t_('The Road to Noor',W/2,58,38,'#ffb347','center','italic');
ctx.fillStyle='#1a1124';ctx.strokeStyle='#6a4a8a';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(60,80,840,370,16);ctx.fill();ctx.stroke();
ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(100,104,760,10);ctx.fillStyle='#ffb347';ctx.fillRect(100,104,760*p,10);t_('Journey '+M.round(p*100)+'%',W/2,138,15,'#ffd27a');
ctx.save();ctx.setLineDash([8,8]);ctx.strokeStyle='#4a3a5a';ctx.lineWidth=4;ctx.beginPath();MN.forEach((n,i)=>i?ctx.lineTo(n[0],n[1]):ctx.moveTo(n[0],n[1]));ctx.stroke();ctx.restore();
ctx.save();ctx.strokeStyle='#ffb347';ctx.lineWidth=5;ctx.shadowColor='#ff8a1f';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(MN[0][0],MN[0][1]);for(let i=1;i<MN.length;i++){if(p>=MN[i][2])ctx.lineTo(MN[i][0],MN[i][1]);else{ctx.lineTo(q[0],q[1]);break}}ctx.stroke();ctx.restore();
MN.forEach((n,i)=>{const done=p>=n[2]-.001,cur=p>=n[2]-.001&&(i==MN.length-1||p<MN[i+1][2]);ctx.fillStyle=done?'#ffb347':'#2a2030';ctx.strokeStyle=i==4?'#7af0ff':done?'#fff2c0':'#6a5a7a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(n[0],n[1],i==4?16:13,0,6.3);ctx.fill();ctx.stroke();if(i==4)gl(n[0],n[1],34+6*M.sin(t*3),'120,240,255',.5);if(cur&&i<4)gl(n[0],n[1],30,'255,190,90',.4);t_(n[3],n[0],n[1]+36,15,done?'#ffe9b0':'#9a8aaa')});
gl(q[0],q[1]-4,26+5*M.sin(t*4),'255,190,90',.8);ctx.fillStyle='#fff';ctx.strokeStyle='#ff8a1f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q[0],q[1]-4,7,0,6.3);ctx.fill();ctx.stroke();t_('Shams',q[0],q[1]-24,14,'#ffd27a');
const hp=lv.sky?M.ceil(SK.h.hp)+' / '+SKY_CFG.heroMaxHealth:null;if(!hp)for(let i=0;i<P.hp;i++)heart(90+i*26,478,1,'#e0343a');else t_('Life '+hp,150,492,16,'#ff8a8a');
t_('Ember shards: '+sh.filter(x=>x).length+'/3',330,492,16,'#9af6ff');t_(L<1?'Village: unknown':villageSaved?'Village: saved':'Village: lost',520,492,16,'#d8c8ff');t_(easy?'Pendant: easy mode':'Pendant: '+M.ceil(S.tl)+'s',730,492,16,'#ffd27a');
t_('Tab / N / Esc / tap: close map',W/2,524,13,'#888')}
function hud(){if(lv.sky){skHud();return}for(let i=0;i<P.hp;i++)heart(24+i*26,14,1,'#e0343a');
for(let i=0;i<CFG.charges;i++){const x=24+i*22,on=i<S.ch;ctx.fillStyle=on?'#ff9a2a':'#3a2a3a';ctx.beginPath();ctx.moveTo(x,50);ctx.bezierCurveTo(x-9,46,x-4,38,x,30);ctx.bezierCurveTo(x+2,38,x+9,44,x,50);ctx.fill();if(on){ctx.fillStyle='#ffe27a';ctx.beginPath();ctx.ellipse(x,45,2.5,4,0,0,6.3);ctx.fill()}}
if(S.ref>0){const bw=CFG.charges*22-8;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(24,56,bw,4);ctx.fillStyle='#ffd27a';ctx.fillRect(24,56,bw*S.ref/CFG.refill,4)}
const r=pend();ctx.save();ctx.shadowColor='#ff8a1f';ctx.shadowBlur=18*r;ctx.strokeStyle=`rgba(255,${120+110*r|0},60,${.25+.75*r})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(915,34,18,0,6.3);ctx.stroke();ctx.fillStyle=`rgba(255,200,100,${.2+.6*r})`;ctx.beginPath();ctx.arc(915,34,7,0,6.3);ctx.fill();ctx.restore();
ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(820,66,120,5);ctx.fillStyle='#ffb347';ctx.fillRect(820,66,120*r,5);t_(easy?'EASY':M.ceil(S.tl)+'s',880,92,13,'#ffd27a','center');ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(820,100,120,5);ctx.fillStyle='#9af6ff';ctx.fillRect(820,100,120*prog(),5);t_('Map: Tab / N',880,120,11,'#aaa','center');
{const tt=S.t-(S.t0||0),hh=S.ph?lv.hint2:lv.hint;if(tt<3.5){ctx.globalAlpha=M.min(1,3.5-tt);t_(S.ph?lv.n2:lv.n,W/2,110,34,'#ffd27a','center','italic');ctx.globalAlpha=1}
if(tt<7.5&&hh){const i=M.min(2,tt/2.5|0);t_(hh[i],W/2,H-30,18,'#fff','center')}}
if(S.msg){ctx.globalAlpha=M.min(1,S.msg.l);t_(S.msg.t,W/2,160,20,'#ffe9b0','center');ctx.globalAlpha=1}
if(S.boss&&!S.boss.dead){const b=S.boss,bw=360,x0=W/2-bw/2,sg=bw/b.mx;t_('QAHER, THE SHADOW KING',W/2,24,15,'#d9a0ff','center','italic');ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x0-2,32,bw+4,14);for(let i=0;i<b.mx;i++){ctx.fillStyle='#2a1a3a';ctx.fillRect(x0+i*sg+1,34,sg-2,10);const f=cl(b.hp-i,0,1);if(f>0){ctx.fillStyle=b.ph==3?'#ff4a6a':'#9a50ff';ctx.fillRect(x0+i*sg+1,34,(sg-2)*f,10)}}
ctx.fillStyle='rgba(255,210,120,.9)';ctx.fillRect(x0,49,bw*M.min(1,S.lit/(villageSaved?CFG.lightWinSaved:CFG.lightWin)),3);
if(b.iv>0){ctx.globalAlpha=M.min(1,b.iv);t_('QAHER, THE SHADOW KING',W/2,210,40,'#d9a0ff','center','bold italic');ctx.globalAlpha=1}}}
function storyUI(){const t=S.t,a=[1,.55,.3][L];ctx.fillStyle='rgba(8,2,16,.5)';ctx.fillRect(0,0,W,H);
ctx.fillStyle='#0b0612';ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,480);ctx.quadraticCurveTo(300,454,W,478);ctx.lineTo(W,H);ctx.fill();
ctx.save();ctx.globalAlpha=.92;drawKit(CHARACTERS.shams,130,478-322*.55,.55,t,null);ctx.restore();
gl(185,392,34+10*M.sin(t*(2+(1-a)*4)),'255,190,90',.15+.6*a);gl(790+M.sin(t)*10,340+M.sin(t*1.3)*14,44,'120,240,255',.3*a);
t_('Chapter '+['I','II','III'][L],W/2,84,16,'#c9a96e');t_(lv.n,W/2,126,38,'#ffb347','center','italic');
const wrapT=(l,w)=>{const ws=l.split(' '),o=[];let c='';for(const x of ws){const n=c?c+' '+x:x;if(ctx.measureText(n).width>w&&c){o.push(c);c=x}else c=n}o.push(c);return o};
ctx.font='21px Georgia,serif';const WL=lv.story.map(l=>wrapT(l,690)),LH=28,GAP=16,bh=WL.reduce((q,w)=>q+w.length*LH+GAP,0)+14;
ctx.fillStyle='rgba(10,4,22,.62)';ctx.strokeStyle='rgba(255,179,71,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(100,156,760,bh,16);ctx.fill();ctx.stroke();
let done=1,yy=192;lv.story.forEach((l,i)=>{const ls=WL[i];if(i>si){yy+=ls.length*LH+GAP;return}const ag=t-(st[i]||0);let rem=M.min(l.length,ag*cps()|0);if(rem<l.length)done=0;ctx.globalAlpha=M.min(1,ag*3);ctx.font='21px Georgia,serif';ctx.textAlign='left';ctx.fillStyle=/Noor/.test(l)?'#aef6ff':'#f0e4ff';ls.forEach((ln,j)=>{const w=ctx.measureText(ln).width;ctx.fillText(ln.slice(0,M.max(0,M.min(ln.length,rem))),W/2-w/2,yy+j*LH);rem-=ln.length+1});ctx.globalAlpha=1;ctx.textAlign='center';yy+=ls.length*LH+GAP});
if(done){ctx.globalAlpha=.5+.5*M.sin(t*4);t_('Enter / Space / tap to continue',W/2,H-30,16,'#c9b8e8');ctx.globalAlpha=1}}
function panel(t,sub){ctx.fillStyle='rgba(8,2,16,.78)';ctx.fillRect(0,0,W,H);t_(t,W/2,150,48,'#ffb347','center','italic');if(sub)t_(sub,W/2,200,18,'#d8c8ff')}
function button(b){ctx.save();ctx.fillStyle=b.s===1?'#2a2030':'#4a1f5a';ctx.strokeStyle=b.s===1?'#555':'#ffb347';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,14);ctx.fill();ctx.stroke();t_(b.t,b.x+b.w/2,b.y+(Array.isArray(b.s)?34:b.h/2+8),Array.isArray(b.s)?26:24,b.s===1?'#777':'#ffd27a');if(Array.isArray(b.s))b.s.forEach((l,i)=>t_(l,b.x+b.w/2,b.y+68+i*24,16,'#e8dcff'));ctx.restore()}
function noor(x,y){noorA(x,y,1,S.t||0,{})}
function render(){const k=cv.width/W;ctx.setTransform(k,0,0,k,0,0);ctx.clearRect(0,0,W,H);if(state=='CINE'){cineDraw();return}
ctx.save();const sk=RM?.2:1;ctx.translate(shake?(R()-.5)*shake*sk:0,shake?(R()-.5)*shake*sk:0);bg();ctx.save();ctx.translate(-S.cam,0);
if(state=='TITLE'||state=='STORY'||state=='ENDING'){ctx.restore();ctx.globalCompositeOperation='lighter';ptc.forEach(p=>{ctx.globalAlpha=M.max(0,p.l/p.m);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.3);ctx.fill()});ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
else if(lv.sky){skDraw();ctx.restore()}else{world();ctx.restore();fog();dark()}ctx.restore();
if(state=='DEAD'||state=='CHOICE'||state=='RIDDLE')hud();
if(state=='TITLE'){panel('Ashes of the Last Hour','Shams chases the Shadow King. Noor\'s pendant is fading.');btns().forEach(button);rehan(210,470,1,S.t,{});noorA(750,470,-1,S.t,{glow:1});gl(480,440,40+8*M.sin(S.t*3),'255,190,90',.6);t_('Enter / Space: begin   |   Arrows or WASD + Space,  J / Right-click: fire   F / Click / Shift: sword   |   M: music   P: pause',W/2,H-24,14,'#9a8ab8');P=P||new Pl(0)}
if(state=='STORY')storyUI();
if(state=='CHOICE'){panel('The Lantern Keeper\'s Choice','Emberfall: shadows swallowed the lanterns. You have exactly 3 flames and no brazier.');btns().forEach(button)}
if(state=='RIDDLE'){panel('The Gate Speaks','"I have hands but cannot clap."  (wrong answer: -10s)   Click or press 1 / 2 / 3');btns().forEach(button)}
if(state=='PAUSED'){panel('Paused','P / Esc / Enter / tap to resume   |   M music   |   Tab map')}
if(state=='MAP')mapUI();
if(state=='DEAD'){panel('The Embers Fade',failBoss?'Qaher\'s shadow closes in...':easy?'Rise again, blacksmith.':'Noor\'s light flickers...');btns().forEach(button)}
if(state=='ENDING'){const sec=ending=='secret';ctx.fillStyle='rgba(8,2,16,.72)';ctx.fillRect(0,0,W,H);t_(sec?'SECRET ENDING: Two Flames, One Light':'ENDING: The Flame Burns Again',W/2,90,34,sec?'#7af0ff':'#ffb347','center','italic');
(sec?['Noor\'s light joins Shams\'s fire and burns the curse away.','Qaher is freed too, a king remembered, not a shadow.']:['Qaher is defeated. Noor is saved.','The pendant blazes: the Flame burns again.']).forEach((l,i)=>t_(l,W/2,150+i*34,21,'#f0e4ff'));
const q=new Pl(0);q.x=W/2-60;q.y=G-44-90;q.ar=2.3;P=q;ctx.save();ctx.translate(0,90);P.draw();noorA(W/2+34,G,-1,S.t,{pose:'hug',glow:1});ctx.restore();
t_('Ember shards: '+sh.filter(x=>x).length+'/3'+(sh.every(x=>x)?'':'   (find all 3 and save the village for the secret ending)'),W/2,370,18,'#9af6ff');t_(easy?'Easy mode: no pendant timer':'Pendant time left: '+M.ceil(S.tl)+'s',W/2,400,18,'#ffd27a');t_('Village '+(villageSaved?'saved':'lost'),W/2,425,16,'#d8c8ff');btns().forEach(button)}
const v=ctx.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*.9);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
if(fade.a>0){ctx.fillStyle=`rgba(0,0,0,${fade.a})`;ctx.fillRect(0,0,W,H)}
if(FX.flash>0){ctx.fillStyle=`rgba(${FX.fc},${M.min(.8,FX.flash)})`;ctx.fillRect(0,0,W,H)}

if(state=='PLAYING'&&!lv.sky){if(P.inv>CFG.inv-.3){ctx.fillStyle=`rgba(255,40,30,${(P.inv-(CFG.inv-.3))*1.2})`;ctx.fillRect(0,0,W,H)}if(!easy&&pend()<.2){ctx.fillStyle=`rgba(120,0,20,${(.2-pend())*(.7+.3*M.sin(S.t*6))*1.5})`;ctx.fillRect(0,0,W,H)}}
ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if(state=='PLAYING'&&fade.a<.35)hud()}
// INPUT
const km={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'j',KeyW:'j',Space:'j',KeyJ:'f',KeyK:'s',KeyX:'s',KeyF:'s',ShiftLeft:'s',ShiftRight:'s'};
addEventListener('keydown',e=>{const k=km[e.code];if(k){if(k=='j'&&!K.j&&state=='PLAYING')K.jp=1;if(k=='s'&&!K.s&&state=='PLAYING'&&!lv.sky)swq=.15;K[k]=1;e.preventDefault()}if(e.code=='Enter'||(e.code=='Space'&&!e.repeat&&state!='PLAYING'&&state!='DEAD'))cont();
if(state=='RIDDLE'&&'123'.includes(e.key))answer(ri['123'.indexOf(e.key)]);if(state=='CHOICE'){if(e.key=='1'||e.code=='KeyA')choose(false);if(e.key=='2'||e.code=='KeyB')choose(true)}});
addEventListener('keyup',e=>{const k=km[e.code];if(k)K[k]=0});
const away=()=>{K.l=K.r=K.j=K.f=K.jp=K.s=0;if(state=='PLAYING')state='PAUSED'};addEventListener('blur',away);document.addEventListener('visibilitychange',()=>{if(document.hidden)away()});
if(typeof CanvasRenderingContext2D!='undefined'&&!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};
const RM=typeof matchMedia!='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
cv.addEventListener('pointerdown',e=>{if(state=='PAUSED'||state=='MAP'){state='PLAYING';return}if(state=='PLAYING'&&e.pointerType=='mouse'&&e.button==2&&!lv.sky){fq=.15;K.f=1;return}if(state=='PLAYING'&&e.pointerType=='mouse'&&e.button==0&&!lv.sky){swq=.15;return}click(e.clientX,e.clientY)});
document.getElementById('bmap').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();toggleMap()});
document.getElementById('bp').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(state=='PLAYING')state='PAUSED';else if(state=='PAUSED')state='PLAYING'});
[['bl','l'],['br','r'],['bj','j'],['bf','f'],['bs','s']].forEach(([id,k])=>{const el=document.getElementById(id);el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(k=='j')K.jp=1;if(k=='s')swq=.15;K[k]=1});['pointerup','pointerleave','pointercancel'].forEach(n=>el.addEventListener(n,()=>K[k]=0))});
if('ontouchstart'in window||navigator.maxTouchPoints>0)document.body.classList.add('touch');
function rs(){const vw=(window.visualViewport&&visualViewport.width)||innerWidth,vh=(window.visualViewport&&visualViewport.height)||innerHeight,s=M.min(vw/W,vh/H),d=M.min(2,devicePixelRatio||1),n=M.round(W*s*d);cv.style.width=W*s+'px';cv.style.height=H*s+'px';if(cv.width!=n){cv.width=n;cv.height=M.round(H*s*d)}}addEventListener('resize',rs);addEventListener('orientationchange',()=>setTimeout(rs,200));if(window.visualViewport)visualViewport.addEventListener('resize',rs);rs();
document.addEventListener('contextmenu',e=>e.preventDefault());addEventListener('pointerup',e=>{if(e.pointerType=='mouse'&&e.button==2&&!lv.sky)K.f=0});
const portraitMQ=matchMedia('(orientation: portrait) and (pointer: coarse)');(portraitMQ.addEventListener?portraitMQ.addEventListener.bind(portraitMQ,'change'):portraitMQ.addListener.bind(portraitMQ))(()=>{if(portraitMQ.matches)away();setTimeout(rs,100)});
let fsTried=0;addEventListener('pointerdown',e=>{if(fsTried||e.pointerType!='touch')return;fsTried=1;try{const el=document.documentElement;(el.requestFullscreen?el.requestFullscreen():Promise.reject()).then(()=>screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape')).catch(()=>{})}catch(_){}},{once:false});
// ===== V2: MUSIC DIRECTOR (song cue points picked from its loudness map; no lyrics are copied, only mood is used) =====
const MU={el:null,on:0,v:0,rate:1,seek:null,mute:0,duck:0,hold:0};
const E=(a,b,t)=>cl((t-a)/(b-a),0,1),LP=(a,b,k)=>a+(b-a)*k,sm=k=>k*k*(3-2*k);
function musStart(){if(MU.on||typeof MUS_SRC=='undefined')return;try{if(!MU.el){MU.el=new Audio(MUS_SRC);MU.el.volume=0}MU.on=1;MU.el.play().catch(()=>{MU.on=0})}catch(e){MU.on=0}}
function musCue(t){MU.seek=t}
function musLevel(i){const c=[null,88,138][i];if(c!=null)musCue(c)}
function musTarget(){if(MU.mute)return 0;const s=state,c=S.cine;
if(s=='TITLE')return .45;if(s=='STORY')return .28;if(s=='ENDING')return .62;if(s=='DEAD')return .05;if(s=='RIDDLE'||s=='CHOICE')return .07;if(s=='PAUSED'||s=='MAP')return .08;
if(s=='CINE'){const t=c.t;if(c.id=='prologue')return t>9&&t<16.5?.06:.4;if(c.id=='elder')return .3;if(c.id=='burn')return .5+.3*E(0,8,t);return .5+.45*E(12,18,t)}
if(lv.boss)return S.lit>0?.32:.1;
let v=.22;if(S.zones.some(z=>z.on&&P.x>z.x&&P.x<z.x+z.w))v=.11;if(near(P.x+12))v+=.1;return v*(.55+.45*pend())}
// story progress 0..1 (start of game -> final fight / reunion); drives tempo + loudness of the song
function prog(){if(state=='ENDING'||(state=='CINE'&&S.cine&&S.cine.id=='reunion'))return 1;if(state=='CINE'&&S.cine&&S.cine.id=='burn')return .85;if(state=='TITLE')return 0;const f=lv.sky?cl(SK.kills/(SK.total||9),0,1):cl((P?P.x:0)/lv.w,0,1);return cl((L+f)/3,0,1)}
function musUp(dt){const e=MU.el;if(!e||!MU.on)return;const pg=prog(),pk=pg*pg*(3-2*pg);let tv=musTarget()*(.7+.45*pk)*1.4,rate=.86+.18*pk;MU.duck=M.max(0,MU.duck-dt*1.8);tv*=1-.45*MU.duck;if(AU.c&&AU.c.currentTime<MU.hold)tv*=.2;
if(state=='PLAYING'&&!easy&&pend()<.33)rate*=.82+.18*pend()/.33;if(state=='DEAD')rate=.8;
if(MU.seek!=null){tv=0;if(MU.v<.03){try{e.currentTime=MU.seek}catch(x){}MU.seek=null;if(e.paused)e.play().catch(()=>{})}}
else if(state=='ENDING'||(state=='CINE'&&S.cine.id=='reunion')){if(e.ended||e.currentTime>191)MU.seek=RC+22}else if(e.currentTime>194)MU.seek=10;
MU.v+=(tv-MU.v)*M.min(1,dt*(tv<MU.v?4:1.5));MU.rate+=(rate-MU.rate)*dt*2;e.volume=cl(MU.v,0,1);e.playbackRate=cl(MU.rate,.5,2)}
['pointerdown','keydown','touchend','click'].forEach(n=>addEventListener(n,musStart));
addEventListener('keydown',e=>{if(e.code=='Tab'||e.code=='KeyN'){e.preventDefault();if(!e.repeat)toggleMap()}if(state=='MAP'&&(e.code=='KeyP'||e.code=='Escape')){state='PLAYING';return}if(e.code=='KeyM')MU.mute^=1;if(e.code=='KeyP'||e.code=='Escape'){if(state=='PLAYING')state='PAUSED';else if(state=='PAUSED')state='PLAYING'}});
document.getElementById('bm').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();MU.mute^=1;musStart()});
// ===== SOUND EFFECTS: your supplied clips (sfx.js), mixed against the background song =====
// Old synthesised effects, ambience loops and music-beat thumps were removed. Background music (music.js) is untouched.
const AU={c:null,m:null,b:{}};
function auInit(){if(AU.c){if(AU.c.state=='suspended')AU.c.resume();return}try{const A=window.AudioContext||window.webkitAudioContext,c=new A(),m=c.createGain();m.gain.value=.9;const cp=c.createDynamicsCompressor();cp.threshold.value=-12;cp.knee.value=10;cp.ratio.value=4;m.connect(cp);cp.connect(c.destination);AU.c=c;AU.m=m;sfxLoad()}catch(e){AU.c=null}}
function sfxLoad(){if(typeof SFX_SRC=='undefined')return;for(const k in SFX_SRC)try{const s=atob(SFX_SRC[k].split(',')[1]),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);const f=b=>{AU.b[k]=b},g=()=>{};const r=AU.c.decodeAudioData(u.buffer,f,g);if(r&&r.catch)r.catch(g)}catch(e){}}
['pointerdown','keydown','touchend'].forEach(n=>addEventListener(n,auInit));
// snd(name,{v:volume, r:pitch/rate, d:music-duck amount 0..1, p:pan, hold:keep music low for the whole clip})
function snd(n,o){o=o||{};if(!AU.c||MU.mute||!AU.b[n])return;const c=AU.c,s=c.createBufferSource(),g=c.createGain();s.buffer=AU.b[n];s.playbackRate.value=(o.r||1)*(1+(R()-.5)*(o.j==null?.07:o.j));g.gain.value=o.v==null?1:o.v;s.connect(g);if(o.p!=null&&c.createStereoPanner){const pn=c.createStereoPanner();pn.pan.value=cl(o.p,-1,1);g.connect(pn);pn.connect(AU.m)}else g.connect(AU.m);s.start();
if(o.d)MU.duck=M.max(MU.duck,o.d);if(o.hold)MU.hold=c.currentTime+s.buffer.duration/s.playbackRate.value;return s}
const SFXC={
jump:()=>{},
land:()=>{},
fire:()=>snd('blaster',{v:.6,d:.2}),
bolt:()=>snd('blaster',{v:.5,r:.72,d:.22}),
zbow:()=>snd('blaster',{v:.32,r:.7}),
bow:p=>snd('blaster',{v:.35+.3*p,r:.9+.5*p,d:.15}),
tele:()=>snd('blaster',{v:.28,r:1.9}),
torch:()=>snd('blaster',{v:.3,r:1.5}),
crack:()=>snd('sword',{v:.45,r:.7,d:.15}),
sword:()=>snd('sword',{v:.7,d:.25}),
clink:()=>snd('sword',{v:.55,r:1.3,d:.3}),
kill:()=>snd('sword',{v:.4,r:1.5,d:.1}),
hit:()=>snd('sword',{v:.35,r:1.7}),
hurt:()=>snd('sword',{v:.6,r:.7,d:.35}),
die:()=>snd('sword',{v:.8,r:.5,d:.6}),
bossHit:()=>snd('sword',{v:1,r:.8,d:.5}),
bossDie:()=>snd('defeat',{v:.95,hold:1})};
// any effect the game asks for that has no clip stays silent
const SFX=new Proxy(SFXC,{get:(t,k)=>t[k]||(()=>{})});
const FX={flash:0,fc:'255,255,255',stop:0,slow:1,rings:[]};
const cps=()=>42; // caption reading speed (chars/sec)
const RC=34;
// ===== NPCs and whispers =====
const NW=["Noor: 'The ember is warm... I am still here.'","Noor: 'Don't look back, Shams.'","Noor: 'Fire is light, not rage.'","Noor: 'I hear your hammer in my heart.'","Noor: 'Choose kindly, my love.'","Noor: 'Almost there. Keep burning.'"];
function npcs(){if(L==0)elder(lv.mira,G,1,S.t,1)}
function npcUp(){if(L==0&&!S.used.e&&M.abs(P.x-lv.mira)<110){S.used.e=1;msg("Mira: 'Feed the torches. The dark fears fire.'")}}
// ===== CHARACTERS =====
function rehan(x,y,f,t,o){o=o||{};const q=new Pl(0);q.x=x-12;q.y=y-44;q.face=f;q.an=t;q.vx=o.vx||0;q.g=o.air?0:1;q.ar=o.ar;q.cd=o.cd||0;q.draw()}
function noorA(x,y,f,t,o){o=o||{};ctx.save();ctx.translate(x,y);ctx.scale(f,1);ctx.globalAlpha=o.a==null?1:o.a;const wk=o.walk?M.abs(M.sin(t*9))*2.5:0,p=o.pose;ctx.translate(0,-wk);ctx.rotate(p=='reach'?-.08+M.sin(t*6)*.03:0);
KW={a:o.walk?1:0,p:t*9,air:0};drawKit(CHARACTERS.noor,-100*NS,-322*NS,NS,t,null);KW.a=0; // Noor: Lyra look from game-characters.html
ctx.restore();if(o.glow)gl(x+f*3,y-30,26+6*M.sin(t*4),'255,200,110',.7)}
function elder(x,y,f,t,lit){ctx.save();ctx.translate(x,y);ctx.scale(f,1);const b=M.sin(t*2);ctx.fillStyle='#4a3a5a';ctx.beginPath();ctx.moveTo(-12,0);ctx.bezierCurveTo(-18,-24,-14,-38,-4,-42+b);ctx.bezierCurveTo(8,-40,14,-24,13,0);ctx.fill();
ctx.fillStyle='#d9b08a';ctx.beginPath();ctx.arc(2,-48+b,7.5,0,6.3);ctx.fill();ctx.fillStyle='#e8e8f0';ctx.beginPath();ctx.arc(1,-50+b,8,3.1,6.3);ctx.fill();ctx.beginPath();ctx.moveTo(-6,-48);ctx.quadraticCurveTo(-12,-38,-8,-32);ctx.quadraticCurveTo(-5,-40,-2,-44);ctx.fill();
limb(-14,-6,-40,.12,3,'#6b4a2a');limb(8,-34,14,2.2,4,'#d9b08a');ctx.save();ctx.translate(22,-28);ctx.rotate(M.sin(t*2.2)*.15);limb(0,-6,6,0,1.5,'#333');pl([[-5,2],[5,2],[7,12],[0,16],[-7,12]],'#2a1a14');ctx.restore();ctx.restore();
if(lit)gl(x+f*22,y-18,40,'255,190,90',.6)}
function drawVal(x,y,t,a,gold,s){if(a<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.globalAlpha=a;const w=M.sin(t*3)*5;ctx.fillStyle=gold?'#e8c060':'#12041f';ctx.shadowColor=gold?'#ffd27a':'#6a2cc0';ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(-30,0);ctx.bezierCurveTo(-34+w,-60,-18,-96,0,-100);ctx.bezierCurveTo(18,-96,34-w,-60,30,0);ctx.quadraticCurveTo(15,-10,0,0);ctx.quadraticCurveTo(-15,-12,-30,0);ctx.fill();
pl([[-12,-100],[-10,-122],[-4,-106],[0,-128],[4,-106],[10,-122],[12,-100]],gold?'#fff0a0':'#3a1466');ctx.fillStyle=gold?'#fff':'#d9a0ff';ctx.beginPath();ctx.ellipse(-6,-84,3,5,0,0,6.3);ctx.ellipse(6,-84,3,5,0,0,6.3);ctx.fill();ctx.restore()}
// ===== SCENE HELPERS =====
function sky(a,b){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function gl(x,y,r,c,a){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${c},${a})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fill();ctx.restore()}
function moon(x,y,r){gl(x,y,r*3,'255,220,230',.35);ctx.fillStyle='#f4e6ee';ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fill();ctx.fillStyle='rgba(150,110,140,.3)';ctx.beginPath();ctx.arc(x-r*.3,y-r*.2,r*.22,0,6.3);ctx.arc(x+r*.35,y+r*.3,r*.15,0,6.3);ctx.fill()}
function hills(c,y,ph,amp){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=20)ctx.lineTo(x,y-amp*(M.sin(x*.006+ph)+.5*M.sin(x*.015+ph*2)));ctx.lineTo(W,H);ctx.fill()}
function ffl(t,n){for(let k=0;k<n;k++)gl((k*131+t*6*(k%3+1))%960,250+(k*53)%200+M.sin(t*1.3+k)*14,10,'200,255,120',.5+.5*M.sin(t*2+k))}
function flame(x,y,s,t){ctx.save();ctx.translate(x,y);ctx.scale(s,s);const f=M.sin(t*13+x)*4;ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,110,20,.85)';ctx.beginPath();ctx.moveTo(-12,0);ctx.bezierCurveTo(-18,-20,-4,-30+f,0,-50+f);ctx.bezierCurveTo(5,-30,18,-20,12,0);ctx.fill();ctx.fillStyle='rgba(255,230,120,.9)';ctx.beginPath();ctx.moveTo(-5,0);ctx.bezierCurveTo(-8,-12,0,-16,0,-28+f);ctx.bezierCurveTo(2,-16,8,-12,5,0);ctx.fill();ctx.restore()}
function castle(t,f){const T=[[500,210,70,4],[620,150,80,6],[750,200,64,7.5],[860,240,56,9]];pl([[470,450],[470,330],[560,320],[700,310],[900,300],[940,450]],'#1a0a1a');
T.forEach((a,i)=>{const x=a[0],y=a[1],w=a[2],k=E(a[3],a[3]+2.4,t),dy=k*k*(450-y+20);ctx.save();ctx.translate(x+w/2,450);ctx.rotate(k*(i%2?.12:-.12));ctx.translate(-w/2-x,-450+dy);pl([[x,450],[x,y],[x+w/2,y-44],[x+w,y],[x+w,450]],'#220d22');
for(let j=0;j<3;j++){const wy=y+30+j*55;if(wy<440){ctx.fillStyle=`rgba(255,${120+f*60|0},40,${.3+.7*f})`;ctx.beginPath();ctx.ellipse(x+w/2,wy,6,10,0,0,6.3);ctx.fill();if(f>.3&&k<.8)flame(x+w/2,wy+8,.5+f*.6,t+j)}}
if(f>.2&&k<.9)flame(x+w/2,y-30,.8+f,t+i);ctx.restore();if(k>0&&k<1&&R()<.6)em(x+w/2,430,1,'#aa6a5a',60,1.5,-30,8)});
if(f>.2)for(let x=500;x<920;x+=70)flame(x,330+((x/70)|0)%2*20,.6+f*.8,t)}
// ===== CUTSCENES =====
function sPro(t){sky('#0d0818','#3a1a2a');moon(780,120,38);hills('#1a1020',420,1,30);gl(140,380,200,'255,130,40',.5+.1*M.sin(t*9));pl([[60,450],[60,330],[140,280],[220,330],[220,450]],'#2a1a1a');ctx.fillStyle='#ff8a2a';ctx.beginPath();ctx.ellipse(140,400,34,26,0,0,6.3);ctx.fill();flame(140,420,.8,t);
pl([[300,420],[360,420],[352,432],[340,436],[340,450],[320,450],[320,436],[308,432]],'#3a3a48');ctx.fillStyle='#120a0e';ctx.fillRect(0,450,W,H-450);
let rx=380,ry=450,ro={};if(t<5)ro.ar=2.2+M.sin(t*8);if(t>=12){rx=LP(395,560,E(12,14.5,t));if(t<14.5)ro.vx=200}if(t>=14.5&&t<17.5){ro.air=1;ro.ar=2.8;ry=464}if(t>=17.5)ro.ar=3;
rehan(rx,ry,t<5?-1:1,t,ro);
if(t<16.5){let nx=t<5?LP(920,470,sm(E(.8,5,t))):470,ny=450,pose='idle';if(t>=12){const k=sm(E(12,15.5,t));nx=LP(470,780,k);ny=450-150*k;pose='reach'}noorA(nx,ny,-1,t,{walk:t<5,pose:pose,a:1-E(15.5,16.5,t)})}
if(t>5.5&&t<8.5){const k=E(6,8,t);gl(LP(450,395,k),LP(410,420,k),30+10*M.sin(t*8),'255,190,90',.9)}else if(t>=8.5)gl(rx+3,ry-30,24+8*M.sin(t*4)+8*E(17.5,20,t),'255,190,90',.9);
if(t>=17.5)gl(rx+30,ry-28,16,'255,150,40',.9);
const dk=E(8.5,11,t)*(1-E(17,19.5,t));if(dk>0){const g=ctx.createRadialGradient(480,300,120,480,300,620);g.addColorStop(0,'rgba(30,0,60,0)');g.addColorStop(1,`rgba(30,0,60,${.9*dk})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
drawVal(800,450,t,E(9,11.5,t)*(1-E(16,17.5,t)),0,1.5)}
function sFail(t){sky('#07030f','#2a0f22');moon(200,110,34);hills('#14081a',430,2,26);ctx.save();ctx.globalAlpha=1-.5*E(6,12,t);castle(0,.25);ctx.restore();ctx.fillStyle='#0c050f';ctx.fillRect(0,450,W,H-450);
const fall=sm(E(3,5.2,t)),r=1-E(1,9,t),vx=LP(900,650,E(0,6,t));gl(vx,380,220,'140,70,255',.4*E(0,5,t));
ctx.save();ctx.translate(300,450);ctx.rotate(-1.45*fall);ctx.translate(-300,-450);rehan(300,450,1,t,{});ctx.restore();
if(r>0){const fl=r>.25?1:.5+.5*M.sin(t*30);gl(LP(303,262,fall),LP(420,436,fall),(8+34*r)*fl,'255,190,90',.9*r)}
drawVal(vx,470,t,E(0,3,t),0,LP(1.1,2,E(2,10,t)));
const nA=.8*E(5,6.5,t)*(1-E(8.5,11,t));if(nA>0)noorA(LP(520,360,E(5,8,t)),450,-1,t,{a:nA,glow:1,pose:'reach'});
const g=ctx.createRadialGradient(W,H/2,60,W,H/2,W);g.addColorStop(0,`rgba(12,0,28,${.9*E(3,11,t)})`);g.addColorStop(1,'rgba(12,0,28,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
ctx.fillStyle=`rgba(0,0,0,${E(11,13.5,t)})`;ctx.fillRect(0,0,W,H);
if(t>11.5){ctx.globalAlpha=E(11.5,13,t)*(1-E(15,16,t));t_('THE EMBER IS COLD',W/2,250,40,'#c9a0ff','center','italic');ctx.globalAlpha=1}}
function sEld(t){sky('#04201f','#0e4a45');moon(160,110,26);for(let i=0;i<14;i++){const x=i*75-20;pl([[x,460],[x+30,230+(i*37)%60],[x+60,460]],i%2?'#05191a':'#041214')}hills('#030e0f',460,2,18);ctx.fillStyle='#050d0e';ctx.fillRect(0,450,W,H-450);ffl(t,18);
gl(620,420,E(7,10.5,t)*80+90,'255,190,90',.45);elder(640,450,-1,t,1);let rx=t<3?LP(-40,470,sm(E(0,3,t))):470;if(t>11)rx=LP(470,1000,sm(E(11,13,t)));rehan(rx,450,1,t,{vx:(t<3||t>11)?120:0})}
function sBurn(t){sky('#1a0620','#7a1f2a');moon(220,120,50);hills('#2a0f2a',430,3,25);const f=E(0,4,t);gl(700,330,360,'255,100,30',.35*f);castle(t,f);ctx.fillStyle='#140a14';ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,480);ctx.quadraticCurveTo(300,430,W,470);ctx.lineTo(W,H);ctx.fill();
rehan(170,462,1,t,{});gl(173,432,16+6*M.sin(t*3),'255,190,90',.8);const sec=ending=='secret';
if(t<9){const va=1-E(sec?5:2.5,sec?8:6,t),g=sec?E(2,5,t):0,vy=470-(sec?60*E(4,8,t):0);drawVal(560,vy,t,va*(1-g),0,1);drawVal(560,vy,t,va*g,1,1)}}
function sRe(t){const d=E(18,28,t);sky('#0b0820','#2a1030');ctx.globalAlpha=d;sky('#f09a7a','#ffe3b8');ctx.globalAlpha=1;ctx.save();ctx.globalAlpha=1-d*.6;moon(700,150,70);ctx.restore();if(d>0)gl(480,455,300*d,'255,190,120',.5*d);
hills('#1a0e24',400,4,20);ctx.save();ctx.translate(40,150);ctx.scale(.4,.4);castle(t+12,.6);ctx.restore();hills('#10081a',452,5,8);ctx.fillStyle='#10081a';ctx.fillRect(0,458,W,H-458);ffl(t,16);
let rx=170,ro={};if(t>=10){rx=LP(170,468,sm(E(10,15,t)));ro.vx=t<15?220:0}if(t>=15)ro.ar=2.3;
let nx=t<11?LP(900,640,E(3,11,t)):LP(640,520,sm(E(11,15,t)));
rehan(rx,455,1,t,ro);noorA(nx,455,-1,t,{walk:t>3&&t<15,pose:t>=15?'hug':'idle',a:E(3,4,t),glow:t>=15});
if(t>=15){const k=E(15,17,t);gl(rx+3,425,60+30*M.sin(t*3)+k*120,'255,200,100',.5+.4*k);ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const r=((t-15)*120+i*80)%240;ctx.strokeStyle=`rgba(255,210,120,${1-r/240})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(rx+30,430,r,0,6.3);ctx.stroke()}ctx.restore()}
if(ending=='secret'&&t>20)drawVal(LP(880,960,E(23,28,t)),455,t,.9*(1-E(24,28,t)),1,.9)}
const CN={prologue:{d:21,s:sPro,cap:()=>[[.5,4.5,"Night at the forge. Shams hammers by firelight."],[5,8.5,"Noor: \"Keep this ember close. It glows while I live.\""],[9,12,"But the Shadow King had come for her."],[12.5,16,"Noor: \"Shams... find me!\""],[17.5,20.8,"Shams: \"While this ember burns, I will not stop.\""]]},
fail:{d:16,s:sFail,cap:()=>[[.5,4,failWhy=='time'?'The pendant burns to its last spark. The hour is gone.':'The Shadow King\'s blow lands. Shams falls.'],[4.5,8,'Noor: "Shams... the ember... is going out..."'],[8.5,11.5,'The pendant that glowed while she lived goes dark.'],[12,15.5,'Qaher\'s shadow swallows the hour. But the forge-fire remembers... Rise again.']]},
elder:{d:13,s:sEld,cap:()=>[[.5,3,"Beyond the Ash Road, an old lantern-keeper waits."],[3.5,7,"Mira: \"The forest drinks light, blacksmith. Feed the torches.\""],[7.5,10.5,"Mira: \"And when you must choose, remember: lanterns are lives.\""],[11,12.8,"Shams nods and walks into the dark."]]},
burn:{d:11,s:sBurn,cap:()=>ending=='secret'?[[.5,4,"Qaher falls. Noor's light stirs in the embers."],[4.5,8,"Her light and Shams's fire burn the curse away. Qaher is free."],[8.5,10.8,"The castle of shadows burns to ash."]]:[[.5,4,"Qaher falls. His shadow breaks apart like ash."],[4.5,8,"The castle's dark halls collapse into flame."],[8.5,10.8,"The Shadow King's castle burns."]]},
reunion:{d:29,s:sRe,cap:()=>[[3,7,"Out of the smoke... a light he knows by heart."],[8,11.5,"Shams: \"Noor?!\""],[12,15.5,"The ember pendant blazes gold."],[16,21,"Noor: \"You never stopped.\"   Shams: \"I never could.\""],[21.5,28.5,ending=='secret'?"Dawn rises for them both, and for a king set free.":"Dawn rises over the ashes. The Flame burns again."]]}};
function cine(id,next){S.tl=S.tl||100;S.max=S.max||150;S.cine={id:id,t:0,next:next,h:[],done:0,ts:1};state='CINE';ptc=[];if(id=='prologue')musCue(0);if(id=='burn')musCue(165);if(id=='reunion')musCue(RC)}
function cineUp(dt){const c=S.cine,t=c.t+=dt*c.ts;const cp0=CN[c.id].cap().find(q=>t>=q[0]&&t<=q[1]);if(cp0&&c.sp!==cp0[2])c.sp=cp0[2];
if(c.id=='prologue'){if(t<5&&M.sin(t*8)>.9&&R()<.5)em(330,415,6,'#ffd27a',150,.5,300,2);if(t>9&&t<16.5&&R()<.7)em(800+R()*40-20,400,1,'#8a4cff',60,1,-60,3);if(t>=16&&!c.b){c.b=1;em(780,300,60,'#b070ff',260,1.2,-40,4)}}
if(c.id=='burn'){if(R()<.7)em(500+R()*420,300+R()*100,1,'#ff9a2a',30,2.5,-70,2.5);if(R()<.3)em(R()*W,H,1,'#ffb347',20,4,-60,2);if(t>2&&t<8&&R()<.8)em(560,420,2,ending=='secret'?'#ffe27a':'#999',50,1.5,ending=='secret'?-70:-25,2.5)}
if(c.id=='fail'&&t>8&&t<12.5&&R()<.6)em(300+R()*60,400,1,'#aef6ff',40,2,-60,2.5);
if(c.id=='reunion'){if(R()<.2)em(120+R()*60,360,1,'#ff9a2a',20,3,-50,2);if(t>15.5&&t<27&&(c.hs=(c.hs||0)+dt)>.3){c.hs=0;c.h.push({x:500+(R()-.5)*50,y:400,l:3.5,vx:(R()-.5)*30})}}
c.h.forEach(p=>{p.y-=40*dt;p.x+=p.vx*dt;p.l-=dt});c.h=c.h.filter(p=>p.l>0);
if(t>=CN[c.id].d&&!c.done){c.done=1;go(c.next)}}
function drawPtc(){ctx.globalCompositeOperation='lighter';ptc.forEach(p=>{ctx.globalAlpha=M.max(0,p.l/p.m);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.3);ctx.fill()});ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
function cineDraw(){const c=S.cine,t=c.t;ctx.save();{const z0=1+.05*E(0,CN[c.id].d,t);ctx.translate(480+M.sin(t*.4)*6,270);ctx.scale(z0,z0);ctx.translate(-480,-270)}if(c.id=='reunion'){const z=1+.12*sm(E(15,27,t));ctx.translate(500,380);ctx.scale(z,z);ctx.translate(-500,-380)}
CN[c.id].s(t);rays(t,c.id);drawPtc();c.h.forEach(p=>heart(p.x,p.y,1.1,`rgba(255,106,138,${M.min(1,p.l)})`));ctx.restore();
ctx.fillStyle='#000';ctx.fillRect(0,0,W,46);ctx.fillRect(0,H-70,W,70);const cp=CN[c.id].cap().find(q=>t>=q[0]&&t<=q[1]);if(cp){const tx=cp[2],sp=/^Noor:/.test(tx)?'n':/^Shams:/.test(tx)?'s':/^Mira:/.test(tx)?'m':'',col={n:'#aef6ff',s:'#ffd27a',m:'#d8c8ff','':'#ffe9c8'}[sp],ag=t-cp[0],nn=M.min(tx.length,ag*38|0);ctx.globalAlpha=M.min(1,ag*3,(cp[1]-t)*3);ctx.font='italic 21px Georgia,serif';const w=ctx.measureText(tx).width;if(sp=='n')gl(W/2-w/2-24,H-36,14+3*M.sin(t*8),'120,240,255',.8);ctx.textAlign='left';ctx.shadowColor=col;ctx.shadowBlur=sp=='n'?14:0;ctx.fillStyle=col;ctx.fillText(tx.slice(0,nn),W/2-w/2,H-30);ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.textAlign='center'}
t_('Enter / tap: skip',W-16,H-8,12,'#777','right');post()}
function rays(t,id){const col={prologue:'255,170,90',elder:'140,255,200',burn:'255,110,60',fail:'150,80,230',reunion:'255,210,140'}[id];ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<5;i++){const x=120+i*190+M.sin(t*.35+i)*40,a=.045+.02*M.sin(t*.8+i*2),g=ctx.createLinearGradient(x,0,x+80,H);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+60,0);ctx.lineTo(x+240,H);ctx.lineTo(x+120,H);ctx.fill()}ctx.restore();for(let i=0;i<24;i++)gl(((i*97+t*(8+i%5*4))%1000)-20,(i*61+M.sin(t*.7+i)*30+t*(3+i%3))%H,3+i%3*1.5,col,.4)}
function post(){const v=ctx.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*.9);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);if(fade.a>0){ctx.fillStyle=`rgba(0,0,0,${fade.a})`;ctx.fillRect(0,0,W,H)}}
const _cont=cont;cont=function(){if(state=='CINE'){if(S.cine.t>1&&!S.cine.done){S.cine.t=CN[S.cine.id].d}}else _cont()};
const _click=click;click=function(x,y){if(state=='CINE'){cont();return}_click(x,y)};

// ===== CHARACTER KIT (from game-characters.html): Shams uses the Kael look, Noor uses the Lyra look =====
const CHARACTERS={
shams:{name:'Shams',female:false,beard:true,cape:true,light:'lantern',colors:{skin:'#e0b08a',hair:'#3b2a20',armor:'#6b7585',metal:'#aab4c3',steel:'#dfe6ee',cloth:'#7a2e2e',cape:'#5a1f1f',pants:'#3a3340',accent:'#d4a84a',boot:'#3b2b22',eye:'#2a3a52',lip:'#b5654f'}},
noor:{name:'Noor',female:true,beard:false,cape:true,light:'orb',colors:{skin:'#f0c4a0',hair:'#7a3a1c',armor:'#3f5f5a',metal:'#c9b27a',steel:'#e8f0f5',cloth:'#2d4a47',cape:'#1f3a3a',pants:'#2b2b36',accent:'#e0b84a',boot:'#4a3326',eye:'#2e7d5b',lip:'#b04a5a'}}};
const KS=.18,NS=.17; // draw scale: kit units (200x340) -> game pixels
const kitCol=(c,k)=>c.colors[k]||k;
const kitRgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`};
// One shape list per character (same data as the kit). g = group tag so a level can hide the sword arm / light arm.
let KW={a:0,p:0,air:0};
function kitParts(c,t){t=t||0;const wl=KW.air?-20:KW.a*M.sin(KW.p)*30,wr=KW.air?16:-wl,RL={rot:[wl,90,166]},RR={rot:[wr,110,166]};const F=c.female,Q=[];let grp='';
const add=(d,f,o)=>Q.push({d,f,g:grp,...(o||{})});
const circ=(x,y,r)=>`M${x-r} ${y} a${r} ${r} 0 1 0 ${2*r} 0 a${r} ${r} 0 1 0 ${-2*r} 0Z`;
const ell=(x,y,rx,ry)=>`M${x-rx} ${y} a${rx} ${ry} 0 1 0 ${2*rx} 0 a${rx} ${ry} 0 1 0 ${-2*rx} 0Z`;
const sway=M.sin(t*2)*5,fl=1+M.sin(t*9)*.06+M.sin(t*5.3)*.04;
add(ell(100,326,44,7),'#000',{op:.35});
if(c.cape)add(F?'M72 80 L128 80 L140 238 Q100 252 60 238Z':'M68 78 L132 78 L146 262 Q100 276 54 262Z','cape');
if(F)add('M80 42 C74 18 126 18 120 42 L129 130 C120 140 110 130 112 112 L88 112 C90 130 80 140 71 130Z','hair');
add(F?'M84 168 L99 168 L98 270 L85 270Z':'M79 166 L99 166 L97 296 L79 296Z','pants',RL);
add(F?'M101 168 L116 168 L115 270 L102 270Z':'M101 166 L121 166 L121 296 L103 296Z','pants',RR);
add(F?'M83 258 L99 258 L99 312 L102 322 L78 322 L82 312Z':'M78 290 L98 290 L98 312 L101 322 L72 322 L76 310Z','boot',RL);
add(F?'M101 258 L117 258 L118 312 L122 322 L98 322 L101 312Z':'M102 290 L122 290 L124 310 L128 322 L99 322 L102 312Z','boot',RR);
add(F?'M83 258 L99 258':'M78 290 L98 290','none',{s:'accent',sw:2,...RL});
add(F?'M101 258 L117 258':'M102 290 L122 290','none',{s:'accent',sw:2,...RR});
add(F?'M76 158 L124 158 L136 210 L64 210Z':'M72 158 L128 158 L135 214 L65 214Z','cloth');
add('M100 158 L100 212','none',{s:'#000',sw:1,op:.3});
add(F?'M75 80 Q100 72 125 80 L120 124 L124 166 L76 166 L80 124Z':'M68 80 Q100 70 132 80 L128 166 L72 166Z','armor');
add(F?'M100 74 Q112 76 125 80 L120 124 L124 166 L100 166Z':'M100 73 Q116 74 132 80 L128 166 L100 166Z','#000',{op:.16});
add('M85 84 L100 102 L115 84','none',{s:'accent',sw:2});
add(F?'M76 156 L124 156 L124 166 L76 166Z':'M72 156 L128 156 L128 167 L72 167Z','accent');
add('M96 155 L104 155 L104 168 L96 168Z','metal');
add('M93 58 L107 58 L107 76 L93 76Z','skin');
add('M93 66 L107 66 L107 76 L93 76Z','#000',{op:.12});
add(circ(84,46,3.2),'skin');add(circ(116,46,3.2),'skin');
add('M84 44 C84 27 116 27 116 44 C116 58 108 65 100 65 C92 65 84 58 84 44Z','skin');
add('M100 28 C110 28 116 36 116 44 C116 58 108 65 100 65Z','#000',{op:.08});
add(F?'M83 46 C77 18 123 18 117 46 C115 36 108 30 97 30 C93 37 88 41 83 46Z':'M83 45 C78 20 122 20 117 45 C115 37 110 33 100 33 C90 33 85 37 83 45Z','hair');
if(c.beard&&!F)add('M85 52 C87 68 113 68 115 52 C111 60 89 60 85 52Z','hair');
add('M88 42 L96 41.5','none',{s:'hair',sw:1.8});
add('M104 41.5 L112 42','none',{s:'hair',sw:1.8});
add(circ(92.5,47,2.2),'eye');add(circ(107.5,47,2.2),'eye');
add('M100 48 L98.6 54 L101.4 54','none',{s:'#000',sw:.8,op:.3});
if(F)add('M96 58.5 Q100 61 104 58.5 Q100 59 96 58.5Z','lip',{s:'lip',sw:.8});
else add('M96.5 58.5 Q100 60 103.5 58.5','none',{s:'#000',sw:1,op:.5});
if(F)add('M84 37 Q100 31 116 37','none',{s:'accent',sw:2});
// sword arm (screen-left)
grp='sword';
const sleeve=F?'skin':'cloth';
add('M58 84 L74 88 L62 132 L47 127Z',sleeve);
add('M47 127 L62 132 L58 166 L45 162Z','skin');
add('M46 140 L60 144 L58 166 L45 162Z','metal');
const len=F?96:114,w=F?3:4.5,rs={rot:[-14,52,168]};
add(`M${52-w} 158 L${52+w} 158 L${52+w} ${158-len} L52 ${146-len} L${52-w} ${158-len}Z`,'steel',{s:'#000',sw:.6,...rs});
add(`M52 154 L52 ${166-len}`,'none',{s:'#fff',sw:1,op:.55,...rs});
add('M42 158 L62 158 L62 163 L42 163Z','accent',rs);
add('M50 163 L54 163 L54 176 L50 176Z','boot',rs);
add(circ(52,180,3.5),'accent',rs);
add(circ(52,168,6),'skin');
// light arm (screen-right)
grp='light';
add('M126 88 L142 84 L153 128 L139 133Z',sleeve);
add('M139 133 L153 128 L155 160 L142 163Z','skin');
add('M140 142 L154 138 L155 160 L142 163Z','metal');
let glow;
if(c.light=='orb'){const oy=148+M.sin(t*3)*3;
add(circ(148,oy,9),'#8defff',{s:'#d9fbff',sw:1.2});add(circ(145,oy-3,2.6),'#fff',{op:.85});glow=[148,oy,85*fl,'#7fe9ff',.55]}
else{const r={rot:[sway,148,172]};
add('M148 172 L148 188','none',{s:'metal',sw:1.4,...r});
add('M141 193 Q148 180 155 193','none',{s:'metal',sw:1.6,...r});
add('M140 193 L156 193 L153 198 L143 198Z','metal',r);
add('M142 198 L154 198 L154 220 L142 220Z','#ffd77a',{op:.85,...r});
add('M148 198 L148 220','none',{s:'#3a2a1a',sw:1,...r});
add('M141 220 L155 220 L155 225 L141 225Z','metal',r);
add('M148 202 Q143 210 148 217 Q153 210 148 202Z','#ff8f1f',r);
glow=[148+sway*.3,210,80*fl,'#ffb347',.6]}
add(circ(148,166,6),'skin');
grp='';
add(ell(65,87,F?9:12,F?7:9),'metal',{s:'accent',sw:1.2});
add(ell(135,87,F?9:12,F?7:9),'metal',{s:'accent',sw:1.2});
Q.push({glow,g:'light'});
return Q}
// draws a kit character with its feet-box top-left at x,y (kit units * s). skip(group) can hide the sword/light arms.
function drawKit(c,x,y,s,t,skip){const ga=ctx.globalAlpha;ctx.save();ctx.translate(x,y+M.sin(t*1.6)*1.2*s);ctx.scale(s,s);
for(const p of kitParts(c,t)){if(skip&&skip(p.g))continue;
if(p.glow){const gx=p.glow[0],gy=p.glow[1],r=p.glow[2],gc=p.glow[3],a=p.glow[4],g=ctx.createRadialGradient(gx,gy,0,gx,gy,r);g.addColorStop(0,kitRgba(gc,a));g.addColorStop(1,kitRgba(gc,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(gx,gy,r,0,7);ctx.fill();continue}
ctx.save();ctx.globalAlpha=ga*(p.op==null?1:p.op);
if(p.rot){ctx.translate(p.rot[1],p.rot[2]);ctx.rotate(p.rot[0]*M.PI/180);ctx.translate(-p.rot[1],-p.rot[2])}
const path=new Path2D(p.d);
if(p.f!='none'){ctx.fillStyle=kitCol(c,p.f);ctx.fill(path)}
if(p.s){ctx.strokeStyle=kitCol(c,p.s);ctx.lineWidth=p.sw||1;ctx.lineCap=ctx.lineJoin='round';ctx.stroke(path)}
ctx.restore()}
ctx.restore()}

// ===== LEVEL 3: SKY BATTLE (replaces the old castle level; tweak the numbers here) =====
const SKY_CFG={heroMaxHealth:140,zombieMaxHealth:50,heroArrowDamage:20,zombieArrowDamage:12,zombieShootCooldownMin:1.15,zombieShootCooldownMax:2.8,maxArrowSpeed:820,gravity:620,
waves:2,perWave:3,heroZone:.4,heroSpeed:230,chargeTime:1.1,minPower:.22,heroShotCd:.28,waveRefill:.18,bannerTime:2,winDelay:1.8,easyDmgMul:.6,easyCdMul:1.3};
const SKZ0=W*SKY_CFG.heroZone; // right edge of the hero zone (left 40%); zombies never go left of it
const SKK={up:0,dn:0,sp:0,aq:0,ae:0}; // Level 3 only keys (everything else reuses K)
const SK={bound:0,h:null,z:[],ar:[],fx:[],wave:1,kills:0,total:9,phase:'banner',bt:0,charging:0,pw:0,aim:-.55,mouse:0,um:0,mx:0,my:0,t:0,over:0,going:0,winT:0};
const SKAN=[[[540,300],[720,420],[860,240]],[[520,200],[700,330],[860,450]],[[560,440],[720,220],[870,340]]]; // zombie step anchors per wave
const SKCL=[];for(let i=0;i<18;i++)SKCL.push({x:R()*1360,y:30+R()*(H-60),s:.5+R()*1.1,v:5+R()*9,n:0});for(let i=0;i<7;i++)SKCL.push({x:R()*1360,y:60+R()*(H-120),s:1.3+R()*.9,v:22+R()*18,n:1});
function skBind(){if(SK.bound)return;SK.bound=1;addEventListener('keydown',skKD);addEventListener('keyup',skKU);addEventListener('blur',skBlur);cv.addEventListener('pointermove',skPM);cv.addEventListener('pointerdown',skPD);addEventListener('pointerup',skPU);addEventListener('pointercancel',skPU)}
function skUnbind(){if(!SK.bound)return;SK.bound=0;removeEventListener('keydown',skKD);removeEventListener('keyup',skKU);removeEventListener('blur',skBlur);cv.removeEventListener('pointermove',skPM);cv.removeEventListener('pointerdown',skPD);removeEventListener('pointerup',skPU);removeEventListener('pointercancel',skPU);skBlur()}
function skKD(e){if(!lv.sky)return;const c=e.code;if(c=='ArrowUp'||c=='KeyW')SKK.up=1;else if(c=='ArrowDown'||c=='KeyS'){SKK.dn=1;e.preventDefault()}else if(c=='Space')SKK.sp=1;else if(c=='KeyQ'){SKK.aq=1;SK.um=0}else if(c=='KeyE'){SKK.ae=1;SK.um=0}}
function skKU(e){const c=e.code;if(c=='ArrowUp'||c=='KeyW')SKK.up=0;else if(c=='ArrowDown'||c=='KeyS')SKK.dn=0;else if(c=='Space')SKK.sp=0;else if(c=='KeyQ')SKK.aq=0;else if(c=='KeyE')SKK.ae=0}
function skBlur(){Object.keys(SKK).forEach(k=>SKK[k]=0);SK.mouse=0;K.l=K.r=K.j=K.f=K.jp=0}
function skPos(e){const r=cv.getBoundingClientRect();SK.mx=(e.clientX-r.left)*W/r.width;SK.my=(e.clientY-r.top)*H/r.height;SK.um=1}
function skPM(e){if(lv.sky)skPos(e)}
function skPD(e){if(!lv.sky||state!='PLAYING'||SK.over)return;if(e.pointerType=='mouse'&&e.button!==0)return;skPos(e);SK.mouse=1}
function skPU(){SK.mouse=0}
function skInit(){const C=SKY_CFG;skBind();Object.keys(SKK).forEach(k=>SKK[k]=0);K.l=K.r=K.j=K.f=K.jp=0;
SK.h={x:150,y:400,hp:C.heroMaxHealth,cd:0,flash:0};SK.z=[];SK.ar=[];SK.fx=[];SK.wave=1;SK.kills=0;SK.total=C.waves*C.perWave;SK.phase='banner';SK.bt=C.bannerTime;
SK.charging=0;SK.pw=0;SK.aim=-.55;SK.mouse=0;SK.um=0;SK.t=0;SK.over=0;SK.going=0;SK.winT=0;S.msg=null;S.tl=S.max}
const skRnd=(a,b)=>a+R()*(b-a);
function skFx(x,y,txt,c){SK.fx.push({x,y,txt,c,l:.9,m:.9})}
function skSpawn(){const C=SKY_CFG;SK.ar=[];SK.z=SKAN[(SK.wave-1)%SKAN.length].map(a=>({ax:a[0],ay:a[1],x:a[0],y:a[1],f1:1.1+R()*.7,f2:.9+R()*.8,p1:R()*6.3,p2:R()*6.3,sx:10+R()*6,sy:6+R()*6,hp:C.zombieMaxHealth,hw:18,hh:62,sp:0,
cd:skRnd(C.zombieShootCooldownMin,C.zombieShootCooldownMax)*(easy?C.easyCdMul:1)+.6,shot:null,flash:0,dead:0,dt:0,t:R()*9}));
SK.z.forEach(z=>{em(z.x,z.y-30,18,'#8a4cff',120,.7,-40,3)})}
// zombie picks a random angle and a random power (loosely aimed at the hero, so some arrows fall short and some land near)
function skZShot(z){const C=SKY_CFG,h=SK.h,a=skRnd(20,48)*M.PI/180,ox=z.x-22,oy=z.y-34,dx=M.max(40,ox-h.x),rise=oy-(h.y-30),cs=M.cos(a),d=dx*M.tan(a)-rise;
let v=C.maxArrowSpeed;if(d>1)v=M.min(v,M.sqrt(C.gravity*dx*dx/(2*cs*cs*d)));v=cl(v*skRnd(.84,1.16),C.maxArrowSpeed*.3,C.maxArrowSpeed);return{a,v}}
function skZFire(z){SFX.zbow();const s=z.shot,dx=-M.cos(s.a),dy=-M.sin(s.a);SK.ar.push({x:z.x-22+dx*6,y:z.y-34+dy*6,vx:dx*s.v,vy:dy*s.v,o:'z',dead:0,age:0});em(z.x-24,z.y-34,5,'#b070ff',70,.3,0,2)}
function skHFire(){SFX.bow(SK.pw);const C=SKY_CFG,h=SK.h,a=SK.aim,v=C.maxArrowSpeed*(C.minPower+(1-C.minPower)*SK.pw),dx=M.cos(a),dy=M.sin(a);
SK.ar.push({x:h.x+6+dx*26,y:h.y-46+dy*26,vx:dx*v,vy:dy*v,o:'h',dead:0,age:0});em(h.x+6+dx*26,h.y-46+dy*26,6,'#ffb347',90,.3,0,2)}
function skHitZ(z,a){SFX.hit();FX.stop=.04;const C=SKY_CFG;a.dead=1;z.hp-=C.heroArrowDamage;z.flash=.15;skFx(z.x,z.y-76,'-'+C.heroArrowDamage,'#ffd27a');em(a.x,a.y,12,'#ffd27a',130,.4,50,2);
if(z.hp<=0){z.dead=1;z.dt=0;SK.kills++;em(z.x,z.y-30,26,'#8a4cff',160,.8,-80,3);em(z.x,z.y-30,8,'#ffb347',120,.5,60,2);shake=5}}
function skHitH(a){SFX.hurt();const C=SKY_CFG,h=SK.h,d=C.zombieArrowDamage*(easy?C.easyDmgMul:1);a.dead=1;h.hp=M.max(0,h.hp-d);h.flash=.18;skFx(h.x,h.y-76,'-'+M.round(d),'#ff6a6a');em(a.x,a.y,14,'#ff5a1f',150,.5,60,3);shake=7}
function skUp(dt){const C=SKY_CFG,h=SK.h;SK.t+=dt;K.jp=0;
// hero moves up/down/left/right inside the hero zone only
const ax=K.r-K.l,ay=((SKK.up||(K.j&&!SKK.sp))?-1:0)+(SKK.dn?1:0),mg=M.hypot(ax,ay);
if(mg>0){h.x+=ax/mg*C.heroSpeed*dt;h.y+=ay/mg*C.heroSpeed*dt}
h.x=cl(h.x,40,SKZ0-40);h.y=cl(h.y,135,H-45);h.flash=M.max(0,h.flash-dt);h.cd-=dt;
// aim: mouse position, or Q/E keys
const sx=h.x+6,sy=h.y-46;if(SKK.aq)SK.aim-=1.6*dt;if(SKK.ae)SK.aim+=1.6*dt;if(SK.um&&!SKK.aq&&!SKK.ae)SK.aim=M.atan2(SK.my-sy,M.max(SK.mx-sx,30));SK.aim=cl(SK.aim,-1.35,1.1);
// power charge: hold Space / J / mouse, release to fire
const want=SKK.sp||K.f||SK.mouse;
if(SK.over){SK.charging=0;SK.pw=0}
else if(want&&h.cd<=0){SK.charging=1;SK.pw=M.min(1,SK.pw+dt/C.chargeTime)}
else if(SK.charging&&!want){skHFire();SK.charging=0;SK.pw=0;h.cd=C.heroShotCd}
else if(!want){SK.charging=0;SK.pw=0}
// waves
if(SK.phase=='banner'){SK.bt-=dt;if(SK.bt<=0){SK.phase='fight';skSpawn()}}
for(const z of SK.z){z.t+=dt;if(z.dead){z.dt+=dt;continue}
z.sp=M.min(1,z.sp+dt/.6);z.flash=M.max(0,z.flash-dt);
z.x=cl(z.ax+M.sin(z.t*z.f1+z.p1)*z.sx,SKZ0+50,W-50);z.y=z.ay+M.sin(z.t*z.f2+z.p2)*z.sy; // sway on its own step, never left of the divider
if(!SK.over&&z.sp>=1){z.cd-=dt;if(z.cd<=.6&&!z.shot)z.shot=skZShot(z);if(z.cd<=0){skZFire(z);z.cd=skRnd(C.zombieShootCooldownMin,C.zombieShootCooldownMax)*(easy?C.easyCdMul:1);z.shot=null}}}
SK.z=SK.z.filter(z=>!(z.dead&&z.dt>=.9));
// arrows: gravity, swept hit test, cleanup
for(const a of SK.ar){a.age+=dt;const px=a.x,py=a.y;a.vy+=C.gravity*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;const n=M.max(1,M.ceil(M.hypot(a.x-px,a.y-py)/8));
for(let i=1;i<=n&&!a.dead;i++){const x=px+(a.x-px)*i/n,y=py+(a.y-py)*i/n;
if(a.o=='h'){for(const z of SK.z)if(!z.dead&&z.sp>.5&&x>z.x-z.hw&&x<z.x+z.hw&&y>z.y-z.hh&&y<z.y+4){skHitZ(z,a);break}}
else if(x>h.x-15&&x<h.x+15&&y>h.y-60&&y<h.y+2)skHitH(a)}
if(a.x<-80||a.x>W+80||a.y>H+80||a.y<-700||a.age>10)a.dead=1;
if(!a.dead&&R()<.5)em(a.x,a.y,1,a.o=='h'?'#ffb347':'#8a4cff',20,.3,0,2)}
SK.ar=SK.ar.filter(a=>!a.dead);
for(const f of SK.fx){f.l-=dt;f.y-=45*dt}SK.fx=SK.fx.filter(f=>f.l>0);
// ember shard (keeps the secret ending reachable)
(lv.shs||[]).forEach(q=>{if(!sh[q[2]]&&M.hypot(h.x-q[0],h.y-30-q[1])<34){sh[q[2]]=1;SFX.shard();FX.flash=.3;FX.fc='120,240,255';em(q[0],q[1],40,'#7af0ff',200,1,0,3);msg('Ember shard found! ('+sh.filter(x=>x).length+'/3)')}});
// pendant dims with the hero's health (reuses the pendant ring + music slow-down)
S.tl=S.max*h.hp/C.heroMaxHealth;
if(h.hp<=0&&!SK.over){die();return}
if(SK.phase=='fight'&&!SK.over&&!SK.z.length){
if(SK.kills>=SK.total){SK.over=1;SK.ar=[];S.end=1;SK.winT=C.winDelay;msg('The sky is clear! On to the Throne Room.')}
else{SK.wave++;const g=M.min(C.heroMaxHealth-h.hp,M.round(C.heroMaxHealth*C.waveRefill));h.hp+=g;if(g>0)skFx(h.x,h.y-76,'+'+g,'#7af09a');em(h.x,h.y-30,16,'#ffd27a',100,.7,-40,2);SK.ar=[];SK.phase='banner';SK.bt=C.bannerTime}}
if(SK.over&&!SK.going&&(SK.winT-=dt)<=0){SK.going=1;go(()=>{skUnbind();startStory(L+1)})}}
// ===== Level 3 drawing =====
function skCloud(x,y,s,a,c){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,64*s,16*s,0,0,6.3);[[-30,-10,22],[8,-18,28],[38,-6,20]].forEach(q=>{ctx.moveTo(x+q[0]*s+q[2]*s,y+q[1]*s);ctx.arc(x+q[0]*s,y+q[1]*s,q[2]*s,0,6.3)});ctx.fill();ctx.restore()}
function skBg(){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1c0626');g.addColorStop(.6,'#6a1a45');g.addColorStop(1,'#c25a78');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
g=ctx.createRadialGradient(700,160,20,700,160,150);g.addColorStop(0,'#ffe0e0');g.addColorStop(.7,'#d9a0c0');g.addColorStop(1,'rgba(200,80,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(700,160,150,0,6.3);ctx.fill();ctx.fillStyle='rgba(120,60,90,.25)';[[670,130,22],[730,190,16],[700,110,10]].forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,6.3);ctx.fill()});
for(let i=0;i<36;i++){const a=.25+.5*M.abs(M.sin(S.t*1.4+i));ctx.fillStyle=`rgba(255,230,240,${a*.6})`;ctx.fillRect((i*97)%W,(i*53)%250,2,2)}
SKCL.forEach(c=>{const x=((c.x-c.v*S.t)%1360+1360)%1360-200;c.n?skCloud(x,c.y,c.s,.2,'#f0b8d0'):skCloud(x,c.y,c.s,.3,'#8a4a80')})}
function skStep(x,y,w,a){ctx.save();ctx.globalAlpha*=a;const l=x-w/2,r=x+w/2;gl(x,y+30,w*.7,'138,76,255',.18);
ctx.fillStyle='#241028';ctx.beginPath();ctx.moveTo(l+4,y+10);ctx.lineTo(r-4,y+10);ctx.lineTo(x+w*.14,y+30);ctx.lineTo(x,y+44);ctx.lineTo(x-w*.16,y+28);ctx.fill();
ctx.fillStyle='#2e1230';ctx.beginPath();ctx.moveTo(l,y+3);ctx.quadraticCurveTo(x,y-4,r,y+3);ctx.lineTo(r-3,y+14);ctx.lineTo(l+3,y+14);ctx.fill();
ctx.strokeStyle='#8a2d5a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(l,y+3);ctx.quadraticCurveTo(x,y-4,r,y+3);ctx.stroke();
ctx.strokeStyle='rgba(138,76,255,.45)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-w*.2,y+16);ctx.lineTo(x-w*.1,y+26);ctx.moveTo(x+w*.12,y+17);ctx.lineTo(x+w*.06,y+30);ctx.stroke();ctx.restore()}
// bow centred at x,y pointing along angle a; pull 0..1 draws the string back. returns the nock point.
function skBow(x,y,a,pull,sz,wood,arrow,tip){const dx=M.cos(a),dy=M.sin(a),nx=-dy,ny=dx,L2=sz*1.25,t1=[x+nx*L2,y+ny*L2],t2=[x-nx*L2,y-ny*L2],nk=[x-dx*(pull*sz*.9+1),y-dy*(pull*sz*.9+1)];
ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
ctx.strokeStyle=wood;ctx.lineWidth=M.max(2,sz*.22);ctx.beginPath();ctx.moveTo(t1[0],t1[1]);ctx.quadraticCurveTo(x+dx*sz*1.1,y+dy*sz*1.1,t2[0],t2[1]);ctx.stroke();
ctx.strokeStyle='#e8dcff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(t1[0],t1[1]);ctx.lineTo(nk[0],nk[1]);ctx.lineTo(t2[0],t2[1]);ctx.stroke();
if(arrow){const e=[x+dx*4,y+dy*4];ctx.strokeStyle='#e6cfa0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(nk[0],nk[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();ctx.fillStyle=tip;ctx.beginPath();ctx.moveTo(e[0]+dx*5,e[1]+dy*5);ctx.lineTo(e[0]-dx*2+nx*3,e[1]-dy*2+ny*3);ctx.lineTo(e[0]-dx*2-nx*3,e[1]-dy*2-ny*3);ctx.fill()}
ctx.restore();return nk}
function skHeroDraw(){const h=SK.h,a=SK.aim,dx=M.cos(a),dy=M.sin(a),pull=SK.charging?.12+.88*SK.pw:.12;
skStep(h.x,h.y,76,1);ctx.save();ctx.translate(h.x,h.y);
drawKit(CHARACTERS.shams,-100*.2,-322*.2,.2,S.t,g=>g=='sword'||g=='light'); // Shams without sword/lantern: he holds a bow instead
let r=pend();if(!(r>=0))r=1;ctx.save();ctx.globalAlpha*=.4+.6*r;ctx.fillStyle='#ffb347';ctx.shadowColor='#ff8a1f';ctx.shadowBlur=10*r;ctx.beginPath();ctx.arc(0,-42,3,0,6.3);ctx.fill();ctx.restore();
const bx=6+dx*22,by=-46+dy*22,nk=skBow(bx,by,a,pull,15,'#6b4a2a',1,'#ffb347');
ctx.strokeStyle='#e0b08a';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(6,-46);ctx.lineTo(bx,by);ctx.moveTo(-6,-46);ctx.lineTo(nk[0],nk[1]);ctx.stroke();
if(h.flash>0)gl(0,-30,36,'255,90,90',h.flash*5);ctx.restore()}
function skZDraw(z){const al=z.dead?M.max(0,1-z.dt/.9):z.sp;if(al<=0)return;
ctx.save();ctx.translate(z.x,z.y+(z.dead?z.dt*z.dt*240:0));if(z.dead)ctx.rotate(z.dt*1.1);const sc=1.4*(.6+.4*(z.dead?1:z.sp));ctx.scale(sc,sc);ctx.globalAlpha=al;
Minion.prototype.draw.call({x:0,y:0,t:z.t,face:-1,st:'chase'}); // reuse the shadow minion drawing
const ang=z.shot?M.atan2(-M.sin(z.shot.a),-M.cos(z.shot.a)):M.PI+.5,pull=z.shot&&!z.dead?E(0,1,1-z.cd/.6):0;
ctx.strokeStyle='#1b0a2e';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,-26);ctx.lineTo(-16,-24);ctx.stroke();
const nk=skBow(-16,-24,ang,pull,12,'#6b4a2a',1,'#b070ff');ctx.strokeStyle='#1b0a2e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(6,-26);ctx.lineTo(nk[0],nk[1]);ctx.stroke();
if(z.flash>0)gl(0,-22,30,'255,255,255',z.flash*5);ctx.restore()}
function skArrowDraw(a){const g=a.o=='h';ctx.save();ctx.translate(a.x,a.y);ctx.rotate(M.atan2(a.vy,a.vx));gl(0,0,16,g?'255,150,40':'150,80,255',.5);
ctx.strokeStyle=g?'#f5d9a0':'#4a2a7a';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(0,0);ctx.stroke();
ctx.fillStyle=g?'#ffb347':'#b070ff';ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-3,-4);ctx.lineTo(-3,4);ctx.fill();
ctx.strokeStyle=g?'#ff8a1f':'#8a4cff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(-29,-4);ctx.moveTo(-24,0);ctx.lineTo(-29,4);ctx.stroke();ctx.restore()}
function skDraw(){const C=SKY_CFG,h=SK.h,x=SKZ0;
// divider between the hero zone and the zombie zone
let g=ctx.createLinearGradient(x-26,0,x+26,0);g.addColorStop(0,'rgba(200,160,255,0)');g.addColorStop(.5,'rgba(200,160,255,.16)');g.addColorStop(1,'rgba(200,160,255,0)');ctx.fillStyle=g;ctx.fillRect(x-26,0,52,H);
ctx.save();ctx.strokeStyle='rgba(230,200,255,.35)';ctx.lineWidth=2;ctx.setLineDash([10,12]);ctx.lineDashOffset=-S.t*20;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();ctx.restore();
for(let i=0;i<9;i++)gl(x+M.sin(S.t+i)*8,H-((i*61+S.t*20)%(H+40))+20,22,'230,200,255',.18);
(lv.shs||[]).forEach(q=>{if(sh[q[2]])return;ctx.save();ctx.translate(q[0],q[1]+M.sin(S.t*3)*4);ctx.rotate(M.sin(S.t*2)*.3);ctx.shadowColor='#7af0ff';ctx.shadowBlur=14;pl([[0,-12],[8,0],[0,12],[-8,0]],'#9af6ff');ctx.fillStyle='#fff';if(((S.t*3)|0)%2)ctx.fillRect(-1,-14,2,6);ctx.restore()});
SK.z.forEach(z=>{const al=z.dead?M.max(0,1-z.dt/.9):z.sp;skStep(z.x,z.y,96,al)});
SK.z.forEach(z=>{skZDraw(z);if(!z.dead&&z.sp>=1){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(z.x-22,z.y-80,44,6);ctx.fillStyle='#9a50ff';ctx.fillRect(z.x-22,z.y-80,44*M.max(0,z.hp)/C.zombieMaxHealth,6)}});
if(state!='DEAD')skHeroDraw();
// power bar + short trajectory preview while charging
if(SK.charging&&state!='DEAD'){const p=SK.pw,a=SK.aim,v=C.maxArrowSpeed*(C.minPower+(1-C.minPower)*p);let px=h.x+6+M.cos(a)*26,py=h.y-46+M.sin(a)*26,vx=M.cos(a)*v,vy=M.sin(a)*v;
for(let i=0;i<16;i++){vy+=C.gravity*.05;px+=vx*.05;py+=vy*.05;ctx.fillStyle=`rgba(255,226,122,${.8-i*.045})`;ctx.beginPath();ctx.arc(px,py,2.2,0,6.3);ctx.fill()}
ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(h.x-26,h.y-92,52,8);ctx.fillStyle=p<.5?'#9af08a':p<.85?'#ffd27a':'#ff6a2a';ctx.fillRect(h.x-25,h.y-91,50*p,6);t_(M.round(p*100)+'%',h.x,h.y-97,11,'#ffe9b0')}
SK.ar.forEach(skArrowDraw);if(SK.um&&state=='PLAYING'&&!SK.over){ctx.strokeStyle='rgba(255,226,122,.75)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(SK.mx,SK.my,8,0,6.3);ctx.moveTo(SK.mx-14,SK.my);ctx.lineTo(SK.mx-4,SK.my);ctx.moveTo(SK.mx+4,SK.my);ctx.lineTo(SK.mx+14,SK.my);ctx.stroke()}
SK.fx.forEach(f=>{ctx.globalAlpha=M.max(0,f.l/f.m);t_(f.txt,f.x,f.y,20,f.c,'center','bold');ctx.globalAlpha=1});
ctx.globalCompositeOperation='lighter';ptc.forEach(p=>{ctx.globalAlpha=M.max(0,p.l/p.m);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.3);ctx.fill()});ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
function skHud(){const C=SKY_CFG,h=SK.h,hp=h.hp/C.heroMaxHealth;
heart(24,14,1,'#e0343a');ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(44,16,220,14);ctx.fillStyle='#e0343a';ctx.fillRect(44,16,220*hp,14);ctx.strokeStyle='rgba(255,200,120,.6)';ctx.lineWidth=1.5;ctx.strokeRect(44,16,220,14);
t_(M.ceil(h.hp)+' / '+C.heroMaxHealth,154,27,12,'#fff');
t_('Wave '+SK.wave+'/'+C.waves,24,62,18,'#ffd27a','left');t_('Shadows defeated: '+SK.kills+'/'+SK.total,24,86,16,'#d8c8ff','left');
const r=pend();ctx.save();ctx.shadowColor='#ff8a1f';ctx.shadowBlur=18*r;ctx.strokeStyle=`rgba(255,${120+110*r|0},60,${.25+.75*r})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(915,34,18,0,6.3);ctx.stroke();ctx.fillStyle=`rgba(255,200,100,${.2+.6*r})`;ctx.beginPath();ctx.arc(915,34,7,0,6.3);ctx.fill();ctx.restore();
if(SK.t<3.5){ctx.globalAlpha=M.min(1,3.5-SK.t);t_(lv.n,W/2,110,34,'#ffd27a','center','italic');ctx.globalAlpha=1}
if(SK.t<9&&lv.hint){const i=M.min(2,SK.t/3|0);t_(lv.hint[i],W/2,H-30,18,'#fff','center')}
if(SK.phase=='banner'&&!SK.over){ctx.globalAlpha=M.min(1,SK.bt*2,(C.bannerTime-SK.bt)*3);t_('Wave '+SK.wave+'!',W/2,240,56,'#ffb347','center','italic');t_(SK.wave==1?'Defeat '+SK.total+' shadow archers':'Noor\'s light mends your wounds',W/2,282,20,'#d8c8ff');ctx.globalAlpha=1}
if(S.msg){ctx.globalAlpha=M.min(1,S.msg.l);t_(S.msg.t,W/2,160,20,'#ffe9b0','center');ctx.globalAlpha=1}}

// FIXED TIMESTEP LOOP
let last=performance.now(),acc=0;P=new Pl(0);
function frame(n){acc+=M.min(.25,(n-last)/1000);last=n;while(acc>=CFG.step){update(CFG.step);acc-=CFG.step}render();requestAnimationFrame(frame)}requestAnimationFrame(frame);
