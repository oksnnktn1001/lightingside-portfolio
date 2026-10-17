const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
for (const reduced of [false, true]) {
  const documentEvents = {}, windowEvents = {}, pointerEvents = {};
  const frames = new Map();
  let nextFrame = 0, draws = 0;
  const context = new Proxy({}, { get: (_, name) => name === 'fillText' ? () => draws++ : () => {} });
  const section = {getBoundingClientRect: () => ({top:0,bottom:200,left:0,width:300,height:200}),addEventListener:(name,fn)=>pointerEvents[name]=fn};
  const canvas = {getContext:()=>context,closest:()=>section,getBoundingClientRect:()=>({width:300,height:200})};
  const document = {hidden:false,addEventListener:(name,fn)=>documentEvents[name]=fn,querySelector:selector=>selector==='[data-type-wave]'?canvas:null,querySelectorAll:()=>[]};
  const window = {innerHeight:800,devicePixelRatio:1,matchMedia:()=>({matches:reduced}),addEventListener:(name,fn)=>windowEvents[name]=fn,requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame},cancelAnimationFrame:id=>frames.delete(id)};
  class Observer { constructor(fn){this.fn=fn} observe(target){this.fn([{isIntersecting:true,target}],this)} }
  window.IntersectionObserver = Observer;
  vm.runInNewContext(source, {document,window,IntersectionObserver:Observer});
  documentEvents.DOMContentLoaded();
  assert.ok(draws>0,'Canvas has an initial frame');
  if (reduced) {
    const before = draws;
    pointerEvents.pointermove({clientX:100,clientY:80});
    assert.ok(draws>before,'Reduced-motion still responds to deliberate pointer input');
    assert.equal(frames.size,0,'Reduced-motion does not run an ambient loop');
  } else {
    assert.equal(frames.size,1);
    windowEvents.pagehide();
    assert.equal(frames.size,0,'Leaving cancels animation');
    windowEvents.pageshow();
    assert.equal(frames.size,1,'Returning from browser cache restarts animation');
    document.hidden=true;
    const [id,fn]=frames.entries().next().value;frames.delete(id);fn(100);
    assert.equal(frames.size,0,'Hidden page stops requesting frames');
    document.hidden=false;documentEvents.visibilitychange();
    assert.equal(frames.size,1,'Visible page resumes animation');
  }
}
console.log('PASS: wave initialization, reduced-motion interaction, history return, visibility lifecycle');
