# r187 WebGPU Examples

## Complete scene with automatic fallback and bloom

Install `three@0.187.0` and serve this ES module through a bundler or an import
map mapping `three`, `three/webgpu`, `three/tsl`, and `three/addons/` to the same release.

```javascript
import * as THREE from 'three/webgpu';
import { pass, color, mix, oscSine, time } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111318);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 4;
const material = new THREE.MeshStandardNodeMaterial({ emissive: 0xff6600, emissiveIntensity: 2 });
material.colorNode = mix(color(0xff6600), color(0x3366ff), oscSine(time));
const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), material);
scene.add(mesh, new THREE.AmbientLight(0xffffff, 1));

const pipeline = new THREE.RenderPipeline(renderer);
const sceneColor = pass(scene, camera).getTextureNode('output');
pipeline.outputNode = sceneColor.add(bloom(sceneColor, 1.5, 0.4, 0.6));
const timer = new THREE.Timer();
timer.connect(document);
renderer.setAnimationLoop(() => {
  timer.update();
  mesh.rotation.y += timer.getDelta();
  pipeline.render();
});

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);

function dispose() {
  renderer.setAnimationLoop(null);
  window.removeEventListener('resize', resize);
  timer.dispose();
  pipeline.dispose();
  mesh.geometry.dispose();
  material.dispose();
  mesh.dispose();
  renderer.dispose();
  renderer.domElement.remove();
}
// Call dispose() when the view unmounts.
```

## Native compute with an explicit fallback boundary

The renderer below is already initialized. This snippet produces a buffer for
subsequent GPU work; it does not itself display particles.

```javascript
import { StorageBufferAttribute } from 'three/webgpu';
import { Fn, storage, instanceIndex, vec3 } from 'three/tsl';

const count = 1024;
const attribute = new StorageBufferAttribute(count, 3);
const positions = storage(attribute, 'vec3', count);
const initialize = Fn(() => {
  positions.element(instanceIndex).assign(vec3(0, 1, 0));
})().compute(count);

if (renderer.backend.isWebGPUBackend) {
  renderer.compute(initialize);
  const result = await renderer.getArrayBufferAsync(attribute);
  console.log(new Float32Array(result));
} else {
  // Select a CPU implementation or disable the compute-dependent feature.
  console.log('Native WebGPU compute is unavailable');
}
```
