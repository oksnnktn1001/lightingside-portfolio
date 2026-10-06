const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const canvas=$('#stage'),ctx=canvas.getContext('2d');
const looks=['CALM CAUSTICS','DEEP CURRENT','PARTICLE FIELD','FOAM VEINS','SPECTRAL TIDE','INK IN WATER','SONAR RINGS','STORM CELLS','BIOLUMINESCENCE','DATA OCEAN','VORTEX FLOW','MIST SHEETS','GLASS WAVES','ABYSS PULSE','WHITE HORIZON'];
const cues=[
 {name:'PRE-SHOW',pan:0,tilt:-38,beam:10,dimmer:20,mix:0,particles:8,audio:0,speed:18,depth:40,a:11,b:0},
 {name:'CALM WATER',pan:0,tilt:-18,beam:18,dimmer:72,mix:25,particles:35,audio:20,speed:45,depth:55,a:0,b:1},
 {name:'RISING TIDE',pan:22,tilt:-8,beam:13,dimmer:84,mix:54,particles:48,audio:45,speed:62,depth:70,a:1,b:4},
 {name:'PARTICLE RISE',pan:-28,tilt:8,beam:7,dimmer:90,mix:70,particles:92,audio:64,speed:58,depth:76,a:2,b:8},
 {name:'STORM',pan:38,tilt:18,beam:26,dimmer:100,mix:84,particles:78,audio:88,speed:91,depth:92,a:7,b:10},
 {name:'FINALE',pan:0,tilt:28,beam:8,dimmer:100,mix:48,particles:100,audio:72,speed:74,depth:88,a:8,b:14}
];
const state={cue:1,group:'all',selected:new Set(),pan:0,tilt:-18,beam:18,dimmer:72,mix:25,particles:35,audio:20,speed:45,depth:55,lookA:0,lookB:1,playing:false,movement:true,blackout:false,pulse:0,yaw:-.48,pitch:.17,zoom:1};
looks.forEach((n,i)=>{['lookA','lookB'].forEach(id=>{$('#'+id).add(new Option(`${String(i+1).padStart(2,'0')} / ${n}`,i))})});
$('#lookA').value=state.lookA;$('#lookB').value=state.lookB;
cues.forEach((c,i)=>{let b=document.createElement('button');b.textContent=`0${i+1} ${c.name}`;b.className=i===1?'active':'';b.onclick=()=>applyCue(i);$('#cueGrid').append(b)});
for(let i=0;i<12;i++){let b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0');b.dataset.i=i;b.onclick=()=>{state.group='single';state.selected.has(i)?state.selected.delete(i):state.selected.add(i);updateUI()};$('#fixtureRow').append(b)}
const controls=['pan','tilt','beam','dimmer','mix','particles','audio','speed','depth'];
controls.forEach(id=>$('#'+id).addEventListener('input',e=>{state[id]=+e.target.value;updateUI(false)}));
$('#lookA').onchange=e=>state.lookA=+e.target.value;$('#lookB').onchange=e=>state.lookB=+e.target.value;
$$('#fixtureGroups button').forEach(b=>b.onclick=()=>{state.group=b.dataset.group;state.selected.clear();updateUI()});
$('#pulseBtn').onclick=()=>{state.pulse=1;$('#pulseBtn').classList.add('pulsing');setTimeout(()=>$('#pulseBtn').classList.remove('pulsing'),180)};
$('#blackoutBtn').onclick=()=>{state.blackout=!state.blackout;$('#blackoutBtn').style.color=state.blackout?'#ff668b':''};
$('#movementBtn').onclick=()=>{state.movement=!state.movement;$('#movementBtn').classList.toggle('active',state.movement);$('#movementBtn').textContent=state.movement?'MOVEMENT ON':'MOVEMENT OFF'};
$('#playBtn').onclick=()=>{state.playing=!state.playing;$('#playBtn').textContent=state.playing?'Ⅱ PAUSE SHOW':'▶ AUTO SHOW';$('#playBtn').classList.toggle('playing',state.playing);autoStart=performance.now()-state.cue*9000};
$('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('#closeHelp').onclick=()=>$('#helpDialog').close();
function applyCue(i){state.cue=i;let c=cues[i];controls.forEach(k=>state[k]=c[k]);state.lookA=c.a;state.lookB=c.b;updateUI();}
function updateUI(sync=true){controls.forEach(id=>{if(sync)$('#'+id).value=state[id];let suffix=id==='pan'||id==='tilt'?'°':'%';$('#'+id+'Out').textContent=Math.round(state[id])+suffix});$('#lookA').value=state.lookA;$('#lookB').value=state.lookB;$$('#cueGrid button').forEach((b,i)=>b.classList.toggle('active',i===state.cue));$$('#fixtureGroups button').forEach(b=>b.classList.toggle('active',b.dataset.group===state.group));$$('#fixtureRow button').forEach((b,i)=>b.classList.toggle('active',state.selected.has(i)));$('#sceneName').textContent=`0${state.cue+1} / ${cues[state.cue].name}`;let n=state.group==='all'?13:state.group==='ceiling'?4:state.group==='framer'?1:state.group==='single'?state.selected.size:6;$('#fixtureCount').textContent=`${n} ACTIVE`}
updateUI();

let W,H,dpr=1,last=performance.now(),fps=60,frames=0,fpsAt=last,drag=false,px=0,py=0,autoStart=last;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
canvas.onpointerdown=e=>{drag=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(!drag)return;state.yaw+=(e.clientX-px)*.006;state.pitch=Math.max(-.15,Math.min(.62,state.pitch+(e.clientY-py)*.004));px=e.clientX;py=e.clientY};canvas.onpointerup=()=>drag=false;canvas.onwheel=e=>{e.preventDefault();state.zoom=Math.max(.65,Math.min(1.8,state.zoom*Math.exp(-e.deltaY*.001)))},{passive:false};
function proj(x,y,z){let cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);let X=x*cy-z*sy,Z=x*sy+z*cy,Y=y;let Y2=Y*cp-Z*sp,Z2=Y*sp+Z*cp+15;let s=Math.min(W,H)*.72*state.zoom/Z2;return [W*.48+X*s,H*.54-Y2*s,s,Z2]}
function line3(points,color,width=1,alpha=1){ctx.beginPath();points.forEach((p,i)=>{let q=proj(...p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.stroke();ctx.globalAlpha=1}
function poly3(points,fill,stroke,alpha=1){ctx.beginPath();points.forEach((p,i)=>{let q=proj(...p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.closePath();ctx.globalAlpha=alpha;if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}ctx.globalAlpha=1}
function noise(x,t,look){return Math.sin(x*1.7+t)+.5*Math.sin(x*3.9-t*1.3+look)+.22*Math.cos(x*8.1+t*.7)}
function surface(z,side,t,look,mix){let cols=26,rows=12;for(let r=0;r<rows;r++){let yy=.3+r*.38;ctx.beginPath();for(let i=0;i<=cols;i++){let u=i/cols,x=side==='back'?-6+12*u:side==='left'?-6:6;let zz=side==='back'?z:-5+10*u;let n=noise(u*5+r*.18,t*(.3+state.speed/100),look);let q=proj(x+(side==='back'?0:n*.035*state.depth/100),yy+n*.13*(.2+mix),zz+(side==='back'?n*.035*state.depth/100:0));i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}let hue=178+look*8+Math.sin(t*.2)*12;ctx.strokeStyle=`hsla(${hue},85%,${50+r*1.5}%,${.12+.045*mix})`;ctx.lineWidth=.7+(r%4===0?1:0);ctx.stroke()}}
function beam(a,b,color,width,intensity){
  let A=proj(...a),B=proj(...b),dx=B[0]-A[0],dy=B[1]-A[1],len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len,ny=dx/len;
  let endW=Math.max(8,width*1.8),hot=Math.min(1,intensity);
  ctx.save();ctx.globalCompositeOperation='lighter';
  let cone=ctx.createLinearGradient(A[0],A[1],B[0],B[1]);cone.addColorStop(0,color.replace('1)',`${.55*hot})`));cone.addColorStop(.4,color.replace('1)',`${.25*hot})`));cone.addColorStop(1,color.replace('1)',`${.04*hot})`));
  ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(A[0]-nx*2,A[1]-ny*2);ctx.lineTo(B[0]-nx*endW,B[1]-ny*endW);ctx.lineTo(B[0]+nx*endW,B[1]+ny*endW);ctx.lineTo(A[0]+nx*2,A[1]+ny*2);ctx.closePath();ctx.fill();
  let core=ctx.createLinearGradient(A[0],A[1],B[0],B[1]);core.addColorStop(0,color.replace('1)',`${.98*hot})`));core.addColorStop(.7,color.replace('1)',`${.62*hot})`));core.addColorStop(1,color.replace('1)',`${.15*hot})`));ctx.strokeStyle=core;ctx.lineCap='round';ctx.lineWidth=Math.max(1.7,width*.18);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();
  let flare=ctx.createRadialGradient(A[0],A[1],0,A[0],A[1],11+width*.4);flare.addColorStop(0,color.replace('1)',`${hot})`));flare.addColorStop(1,color.replace('1)','0)'));ctx.fillStyle=flare;ctx.beginPath();ctx.arc(A[0],A[1],11+width*.4,0,7);ctx.fill();ctx.restore();
}
function activeFixture(i){if(state.group==='all')return true;if(state.group==='left')return i<6;if(state.group==='right')return i>=6;if(state.group==='ceiling')return false;if(state.group==='framer')return false;if(state.group==='single')return state.selected.has(i);return true}
function draw(t){ctx.clearRect(0,0,W,H);let bg=ctx.createRadialGradient(W*.48,H*.45,10,W*.48,H*.48,Math.max(W,H)*.7);bg.addColorStop(0,'#10222a');bg.addColorStop(.55,'#071015');bg.addColorStop(1,'#020405');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  let mix=state.mix/100,pulse=state.pulse;state.pulse*=.93;let audio=(.5+.5*Math.sin(t*4.1)+.22*Math.sin(t*9.7))*state.audio/100+pulse;
  if(state.playing){let s=(performance.now()-autoStart)/1000,ci=Math.floor(s/9)%cues.length;if(ci!==state.cue)applyCue(ci);$('#timecode').textContent=new Date(s*1000).toISOString().slice(14,22)}
  poly3([[-6,0,-5],[6,0,-5],[6,0,5],[-6,0,5]],'#091014','#25343a');
  for(let i=-6;i<=6;i++)line3([[i,0,-5],[i,0,5]],'#193039',.5,.45);for(let j=-5;j<=5;j++)line3([[-6,0,j],[6,0,j]],'#193039',.5,.45);
  poly3([[-6,0,-5],[-6,4.7,-5],[6,4.7,-5],[6,0,-5]],'#07151b','#31505b',.9);poly3([[-6,0,-5],[-6,4.7,-5],[-6,4.7,5],[-6,0,5]],'#061117','#27414b',.82);poly3([[6,0,-5],[6,4.7,-5],[6,4.7,5],[6,0,5]],'#061117','#27414b',.82);
  if(!state.blackout){surface(-4.97,'back',t,state.lookA,1-mix);surface(0,'left',t+.7,state.lookB,mix);surface(0,'right',t+1.3,state.lookB+2,mix)}
  // fabric ribbons
  for(let k=-2;k<=2;k++){let pts=[];for(let i=0;i<=28;i++){let z=-4.4+i*.32,y=4.05+.22*Math.sin(i*.45+t*(.6+state.speed/150)+k);pts.push([k*1.15,y,z])}line3(pts,'rgba(160,185,194,1)',1.2,.28)}
  // columns and fixtures
  let fixtures=[],columnFaces=[];for(let side of [-1,1])for(let j=0;j<6;j++){let x=side*4.15,z=-3.7+j*1.48;let front=[[x-.38,0,z-.38],[x+.38,0,z-.38],[x+.38,3.65,z-.38],[x-.38,3.65,z-.38]];poly3(front,'#11191c','#354249');poly3([[x+side*.38,0,z-.38],[x+side*.38,0,z+.38],[x+side*.38,3.65,z+.38],[x+side*.38,3.65,z-.38]],'#0a1013','#29353a');fixtures.push({x,z,side});columnFaces.push(front)}
  let dim=(state.blackout?0:state.dimmer/100),pan=state.pan*Math.PI/180,tilt=state.tilt*Math.PI/180;
  fixtures.forEach((f,i)=>{
    let o=[f.x-f.side*.48,3.18,f.z],phase=t*(.38+state.speed/155)+i*.72;
    let motion=state.movement?1:0,p=pan+Math.sin(phase)*.48*motion,ti=tilt+Math.sin(phase*.73+i)*.22*motion;
    let target=[f.x-f.side*(3.7+Math.sin(p)*2.3),Math.max(.18,1.45+Math.sin(ti)*3.5),f.z+Math.cos(p)*4.8];
    let q=proj(...o),mount=proj(o[0]+f.side*.25,o[1],o[2]);ctx.strokeStyle=activeFixture(i)?'#ffcf83':'#465057';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(mount[0],mount[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.fillStyle=activeFixture(i)?'#fff0c7':'#465057';ctx.beginPath();ctx.arc(q[0],q[1],Math.max(3,q[2]*.1),0,7);ctx.fill();
    if(activeFixture(i)&&dim>0)beam(o,target,'rgba(255,174,64,1)',6+state.beam*.36,dim);
  });
  // One distant framing fixture: its shutters land only on the concrete columns.
  if((state.group==='all'||state.group==='framer')&&dim>0){
    let framer=[0,4.05,4.55],fq=proj(...framer),scan=state.movement?Math.sin(t*.34)*.32:0,aimY=Math.max(.65,Math.min(3.15,1.85+state.tilt/34+scan));
    ctx.save();ctx.globalCompositeOperation='lighter';
    columnFaces.forEach((face,i)=>{let f=fixtures[i],bias=state.pan/90;let target=[f.x-f.side*.42+bias*.45,aimY,f.z-.38];poly3(face,'rgba(191,235,255,1)',null,.07+dim*.17);beam(framer,target,'rgba(190,235,255,1)',3+state.beam*.13,dim*.42)});
    ctx.restore();
    ctx.fillStyle='#dff8ff';ctx.beginPath();ctx.arc(fq[0],fq[1],8,0,7);ctx.fill();ctx.strokeStyle='#8fc9d8';ctx.lineWidth=4;ctx.strokeRect(fq[0]-11,fq[1]-7,22,14);
  }
  // ceiling spots through fabric
  if((state.group==='all'||state.group==='ceiling')&&dim>0)for(let i=-1.5;i<=1.5;i++){let sw=state.movement?Math.sin(t*.55+i)*1.25:0;beam([i*1.7,4.65,-3.8],[i*.8+sw,.1,1.4+Math.cos(t*.4+i)],'rgba(176,126,255,1)',7+state.beam*.3,dim*.8)}
  // particles
  if(!state.blackout){let n=Math.floor(15+state.particles*1.15);for(let i=0;i<n;i++){let seed=i*97.13,x=Math.sin(seed)*5.5,z=-4.5+((seed*.713+t*(.2+state.speed/80))%9),y=.3+((seed*.317+t*(.25+audio*.35))%3.8);let q=proj(x,y,z);let a=(.12+state.particles/220)*(1+.5*audio);ctx.fillStyle=`rgba(102,239,255,${Math.min(.85,a)})`;ctx.fillRect(q[0],q[1],1.2+(i%4===0?1.4:0),1.2+(i%4===0?1.4:0))}}
  ctx.fillStyle='rgba(3,7,9,.22)';ctx.fillRect(0,0,W,H);
  state.pulse=Math.max(0,state.pulse);
  frames++;if(performance.now()-fpsAt>800){fps=Math.round(frames*1000/(performance.now()-fpsAt));frames=0;fpsAt=performance.now();$('#fps').textContent=`${fps} FPS`}requestAnimationFrame(ms=>draw(ms/1000))}
requestAnimationFrame(ms=>draw(ms/1000));

