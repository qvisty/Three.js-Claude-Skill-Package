import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { build } from 'esbuild';
import { parseArgs } from 'node:util';
import { REVISION } from 'three';
const {values: options}=parseArgs({options:{case:{type:'string'},artifacts:{type:'string'}}});
const results=[];
const startedAt=new Date().toISOString();
if(options.artifacts)fs.mkdirSync(options.artifacts,{recursive:true});
const root=fileURLToPath(new URL('../',import.meta.url));
const firstBlock=f=>fs.readFileSync(path.join(root,f),'utf8').match(/```javascript\n([\s\S]*?)```/)[1];
const cases={
  webgl:firstBlock('skills/source/threejs-core/threejs-core-renderer/references/examples.md'),
  fallback:firstBlock('skills/source/threejs-impl/threejs-impl-webgpu/references/examples.md').replace('{ antialias: true }','{ antialias: true, forceWebGL: true }'),
};
const fiberExample=fs.readFileSync(path.join(root,'skills/source/threejs-impl/threejs-impl-react-three-fiber/references/examples.md'),'utf8').match(/```tsx\n([\s\S]*?)```/)[1];
const capture=`const gl = renderer.domElement.getContext('webgl2');
const pixel = new Uint8Array(4);
gl.readPixels(renderer.domElement.width/2,renderer.domElement.height/2,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
window.smokePixels = [...pixel];
window.smokeFrameSize = [renderer.domElement.width, renderer.domElement.height];
if(window.smokeCaptureRequested){
  window.smokeCapture = renderer.domElement.toDataURL('image/png');
  window.smokeCaptureRequested = false;
}`;
const fiberSource=fiberExample.replace('<Canvas camera=',`<Canvas onCreated={({gl: renderer,scene,camera})=>{
window.smoke={renderer,scene,camera};
const render=renderer.render.bind(renderer);
renderer.render=(...args)=>{const result=render(...args);${capture};return result;};
}} camera=`)+`\nimport {createRoot} from 'react-dom/client';\ncreateRoot(document.getElementById('root')).render(<App />);`;
cases.fiber=(await build({stdin:{contents:fiberSource,loader:'tsx',resolveDir:root},bundle:true,write:false,format:'esm',platform:'browser',jsx:'automatic'})).outputFiles[0].text;
if(options.case && !(options.case in cases))throw Error(`Unknown case: ${options.case}`);
const map={imports:{three:'/node_modules/three/build/three.module.js','three/webgpu':'/node_modules/three/build/three.webgpu.js','three/tsl':'/node_modules/three/build/three.tsl.js','three/addons/':'/node_modules/three/examples/jsm/'}};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 if(url.pathname==='/'){
  const name=url.searchParams.get('case');
  if(!(name in cases)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type','text/html');
  res.end(`<style>body{margin:0}#root{width:100vw;height:100vh}</style><div id="root"></div><script type="importmap">${JSON.stringify(map)}</script><script type="module" src="/entry.mjs?case=${name}"></script>`);return;
 }
 if(url.pathname==='/entry.mjs'){
  const name=url.searchParams.get('case');
  if(!(name in cases)){res.writeHead(404);res.end();return;}
  const code=name==='fiber'?cases.fiber:cases[name].replace(name==='webgl'?'renderer.render(scene, camera);':'pipeline.render();',call=>call+'\n'+capture)+'\nwindow.smoke={renderer,scene,camera};';
  res.setHeader('Content-Type','text/javascript');res.end(code);return;
 }
 const f=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!f.startsWith(root)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type','text/javascript');fs.createReadStream(f).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const name of Object.keys(cases)){
  if(options.case && options.case!==name)continue;
  const page=await browser.newPage({viewport:{width:320,height:240}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/?case=${name}`);
  await page.waitForFunction(()=>window.smoke && (window.smoke.renderer.info.render?.frame>2 || window.smoke.renderer.info.frame>2),{},{timeout:30000});
  await page.waitForFunction(()=>window.smokePixels);
  const pixels=await page.evaluate(()=>{
   if(window.smoke.renderer.backend?.isWebGPUBackend)throw Error('Expected WebGL 2 fallback');
   return window.smokePixels;
  });
  assert(pixels.slice(0,3).some(v=>v>0),`${name}: black center pixel ${pixels}`);
  const initialRotation=await page.evaluate(()=>window.smoke.scene.children.find(o=>o.isMesh).rotation.y);
  await page.waitForFunction(initial=>Math.abs(window.smoke.scene.children.find(o=>o.isMesh).rotation.y-initial)>0.01,initialRotation);
  const finalRotation=await page.evaluate(()=>window.smoke.scene.children.find(o=>o.isMesh).rotation.y);
  await page.setViewportSize({width:480,height:300});
  await page.waitForFunction(()=>window.smoke.renderer.domElement.width===480 && Math.abs(window.smoke.camera.aspect-1.6)<0.001);
  await page.waitForFunction(()=>window.smokeFrameSize?.[0]===480 && window.smokeFrameSize?.[1]===300);
  const releaseChecks=name==='webgl' && REVISION==='187'?await page.evaluate(async()=>{
    const {checkReleaseContracts}=await import('/scripts/renderer-release-checks.browser.mjs');
    return checkReleaseContracts(window.smoke.renderer);
  }):null;
  assert.deepEqual(errors,[],`${name}: browser errors`);
  const screenshot=options.artifacts?path.resolve(options.artifacts,`${name}.png`):null;
  if(screenshot){
    await page.evaluate(()=>{window.smokeCaptureRequested=true;});
    await page.waitForFunction(()=>window.smokeCapture);
    const data=await page.evaluate(()=>window.smokeCapture.split(',')[1]);
    fs.writeFileSync(screenshot,Buffer.from(data,'base64'));
  }
  results.push({case:name,status:'passed',revision:REVISION,pixels,initialRotation,finalRotation,resize:{width:480,height:300,aspect:1.6},releaseChecks,errors,screenshot});
  console.log(`PASS ${name} (r${REVISION}): documented scene renders nonblack pixels (${pixels}), changes mesh rotation and resizes without browser errors`);
  await page.close();
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
if(options.artifacts)fs.writeFileSync(path.join(options.artifacts,'results.json'),JSON.stringify({startedAt,completedAt:new Date().toISOString(),results},null,2)+'\n');
console.log('Native WebGPU, external assets, physics, IFC and XR are not exercised by these browser cases.');
