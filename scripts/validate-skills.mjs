import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { Parser } from 'acorn';
import jsx from 'acorn-jsx';
import * as THREE from 'three';
import * as GPU from 'three/webgpu';
import { Fn, storage, instanceIndex, vec3, pass } from 'three/tsl';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pixelationPass } from 'three/addons/tsl/display/PixelationPassNode.js';
// Type-only TypeScript imports are excluded from runtime-export checks.
const root = fileURLToPath(new URL('../', import.meta.url));
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const files = walk(path.join(root,'skills')).filter(p => p.endsWith('.md'));
const parser = Parser.extend(jsx());
let imports = 0, skills = 0, parsed = 0;
const failures = [];
const names = new Set();
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
for (const f of files) {
  const text = fs.readFileSync(f,'utf8');
  const label = path.relative(root,f);
  if (path.basename(f) === 'SKILL.md') {
    skills++;
    const fm = parseYaml(text.split('---')[1]);
    assert.match(fm.name,/^threejs-[a-z0-9-]+$/);
    assert(fm.name.length<=64 && fm.description.length<=1024, label);
    assert(!names.has(fm.name),label); names.add(fm.name);
    assert(text.split('\n').length<500,label+' exceeds skill line limit');
    for (const ref of ['methods.md','examples.md','anti-patterns.md']) assert(fs.existsSync(path.join(path.dirname(f),'references',ref)),label);
    assert.match(fm.compatibility, /r187/, label+' has stale compatibility');
  }
  // Check all imports, including imports in API reference fragments and anti-patterns.
  // A bounded named-import pattern must not span another closing brace or code fence.
  const re = /import\s+(\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]((?:three(?:\/[^'"]*)?|@react-three\/fiber|@react-three\/drei|react))['"]/g;
  for (const m of text.matchAll(re)) {
    imports++;
    try {
      const mod = await import(m[2]);
      if (m[1].startsWith('{')) {
        for (const name of m[1].slice(1,-1).replace(/\/\/[^\n]*/g,'').split(',').map(s=>s.trim().split(/\s+as\s+/)[0]).filter(name=>name && !name.startsWith('type '))) assert(name in mod, `missing ${name} in ${m[2]}`);
      } else if (!m[1].startsWith('*')) assert('default' in mod,`missing default in ${m[2]}`);
    } catch (e) { failures.push(`${label}: ${e.message}`); }
  }
  for (const include of text.matchAll(/#include\s*<([a-zA-Z0-9_]+)>/g)) {
    if (!['chunk','chunk_name'].includes(include[1]) && !(include[1] in THREE.ShaderChunk)) failures.push(`${label}: missing shader chunk ${include[1]}`);
  }
  for (const m of text.matchAll(/```(?:js|javascript|jsx)\n([\s\S]*?)```/g)) {
    const code = m[1];
    // API fragments and intentionally incorrect examples are not whole modules.
    // Syntax is enforced for complete, newly maintained WebGPU examples.
    if (label.includes('threejs-impl-webgpu/') && !label.endsWith('anti-patterns.md')) {
      try { parser.parse(code,{ecmaVersion:'latest',sourceType:'module'}); parsed++; }
      catch (e) { failures.push(`${label}: syntax: ${e.message}`); }
    }
    const ns = [...code.matchAll(/import\s+\*\s+as\s+(\w+)\s+from\s+['"](three(?:\/webgpu)?)['"]/g)];
    for (const [,alias,spec] of ns) {
      const mod = spec==='three' ? THREE : GPU;
      for (const use of code.matchAll(new RegExp('\\b'+alias+'\\.(\\w+)','g'))) {
        if (!(use[1] in mod)) failures.push(`${label}: missing ${spec} namespace export ${use[1]}`);
      }
    }
    if (!label.includes('react-three-fiber') && !label.includes('threejs-impl-drei')) {
      if (/new\s+(?:THREE\.)?Clock\(/.test(code)) failures.push(`${label}: deprecated standalone Clock construction`);
    }
    if (/PCFSoftShadowMap|RGBELoader|new PostProcessing\(/.test(code)) failures.push(`${label}: deprecated recipe`);
    if (/iridescenceThicknessRange|CubeUVReflectionMapping|\.setSessionInit\(/.test(code)) failures.push(`${label}: obsolete r187 recipe`);
  }
}
for (const e of pkg.agents.skills) assert(names.has(e.name) && fs.existsSync(path.join(root,e.path,'SKILL.md')),e.name);
assert.equal(skills,24);
assert.equal(THREE.REVISION,'187');
assert.equal(pkg.devDependencies.three,'0.187.0');
assert.equal(typeof WeakRef,'function'); assert.equal(typeof FinalizationRegistry,'function');
assert(!('CubeUVReflectionMapping' in THREE));
const physical=new THREE.MeshPhysicalMaterial({iridescence:1,iridescenceThicknessMinimum:120,iridescenceThicknessMaximum:380});
const physicalClone=physical.clone();
assert.equal(physicalClone.iridescenceThicknessMinimum,120);
assert.equal(physicalClone.iridescenceThicknessMaximum,380);
const physicalJSON=physical.toJSON();
assert.equal(physicalJSON.iridescenceThicknessMinimum,120);
assert.equal(physicalJSON.iridescenceThicknessMaximum,380);
const pixelated=pixelationPass(new THREE.Scene(),new THREE.PerspectiveCamera(),6);
assert.equal(pixelated.pixelSize,6); assert.equal(typeof pixelated.pixelSize,'number');
pixelated.dispose(); physical.dispose(); physicalClone.dispose();
// Exercise changed CPU API contracts instead of checking symbol presence alone.
const timer = new THREE.Timer();
const start = performance.now(); timer.update(start); timer.update(start+250);
assert(Math.abs(timer.getDelta()-0.25)<1e-6);
assert.equal(timer.getDelta(),timer.getDelta());
const mesh = new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
const mixer = new THREE.AnimationMixer(mesh);
mixer.clipAction(new THREE.AnimationClip('move',1,[new THREE.NumberKeyframeTrack('.position[x]',[0,1],[0,4])])).play();
mixer.update(timer.getDelta()); assert.equal(mesh.position.x,1);
const batch = new THREE.BatchedMesh(2,48,72,new THREE.MeshBasicMaterial());
const geometryId=batch.addGeometry(new THREE.BoxGeometry());
const instanceId=batch.addInstance(geometryId);
const transform=new THREE.Matrix4().makeTranslation(2,0,0); batch.setMatrixAt(instanceId,transform);
assert.deepEqual(batch.getMatrixAt(instanceId,new THREE.Matrix4()).elements,transform.elements);
assert.equal(new THREE.Texture().channel,0);
assert.equal(new THREE.CapsuleGeometry(1,2).parameters.height,2);
const header = new TextEncoder().encode('#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 1 +X 1\n');
const radiance = new Uint8Array(header.length+4); radiance.set(header); radiance.set([128,64,32,129],header.length);
const hdr = new HDRLoader().setDataType(THREE.FloatType).parse(radiance.buffer);
assert.equal(hdr.width,1); assert.equal(hdr.height,1); assert.equal(hdr.data.length,4);
assert(Math.abs(hdr.data[0]-256/255)<1e-6);
const gltf = await new GLTFLoader().parseAsync(JSON.stringify({asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'fixture',translation:[1,2,3]}]}),'');
assert.deepEqual(gltf.scene.getObjectByName('fixture').position.toArray(),[1,2,3]);
const attribute=new GPU.StorageBufferAttribute(4,3);
const buffer=storage(attribute,'vec3',4);
const compute=Fn(()=>buffer.element(instanceIndex).assign(vec3(0,1,0)))().compute(4);
assert(compute.isComputeNode);
const sceneColor=pass(new THREE.Scene(),new THREE.PerspectiveCamera()).getTextureNode('output');
assert(sceneColor.add(bloom(sceneColor,1.5,0.4,0.6)).isNode);
mesh.geometry.dispose(); mesh.material.dispose(); mesh.dispose(); batch.dispose(); timer.dispose();
if(failures.length) { console.error([...new Set(failures)].join('\n')); process.exit(1); }
console.log(`PASS: ${skills} skills, ${files.length} Markdown files, ${imports} imports, ${parsed} WebGPU JavaScript blocks; Timer/animation, batching, UV, geometry, HDR/glTF parsing, iridescence/pixelation and TSL graph smoke checks.`);
console.log('Scope: import/API/CPU checks; run npm run test:browser for rendering. External physics, IFC, XR and asset toolchains are not runtime-certified by this check.');
