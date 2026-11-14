# r187 WebGPU API Reference

## Imports and initialization

```js
import { WebGPURenderer, MeshStandardNodeMaterial, StorageBufferAttribute, RenderPipeline } from 'three/webgpu';
import { Fn, storage, instanceIndex, vec3, uniform, pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
```

- `new WebGPURenderer({ antialias, alpha, forceWebGL })` selects WebGPU with automatic WebGL 2 fallback.
- `await renderer.init()` completes backend selection before rendering or loader capability detection.
- `renderer.backend.isWebGPUBackend` identifies native WebGPU after initialization.
- `renderer.setAnimationLoop(callback)` registers the frame loop; pass `null` on teardown.
- `renderer.render(scene, camera)` renders after initialization; `renderAsync` is deprecated.
- `renderer.compute(computeNode)` dispatches after initialization; `computeAsync` is deprecated.
- `renderer.getMaxAnisotropy()` replaces WebGLRenderer's capabilities lookup.
- `await renderer.getArrayBufferAsync(attribute)` reads GPU storage asynchronously.
- `renderer.dispose()` releases renderer resources; dispose owned scene resources separately.

## Node materials

Import node materials from `three/webgpu`; import graph operations from `three/tsl`.
Built-in surface materials are converted internally, while explicit node materials
expose `colorNode`, `positionNode`, `normalNode`, `opacityNode` and shader-stage overrides.
Physical material slots belong to MeshPhysicalNodeMaterial, not every NodeMaterial.

`node.toVar()` and `node.toConst()` are methods, not named module exports.
`uniform(value)` exposes `.value` for CPU updates. Use `Fn(() => { ... })()` to
construct a callable graph before `.compute(count)`. Use `instanceIndex` for a
linear element index; respect allocation bounds and dispatch size.

## RenderPipeline

```js
const pipeline = new RenderPipeline(renderer);
const color = pass(scene, camera).getTextureNode('output');
pipeline.outputNode = color.add(bloom(color, 1.5, 0.4, 0.6));
// Each frame:
pipeline.render();
// On teardown:
pipeline.dispose();
```

`bloom(input, strength, radius, threshold)` returns a bloom-only node: add it to
the original scene color. `fxaa(input)` comes from FXAANode.js. RenderPipeline
applies output conversion by default (`outputColorTransform = true`).
NEVER pass a scene/camera to `renderOutput`: it accepts a color node.

## Backend boundary

TSL and node materials run on either WebGPURenderer backend. Storage-buffer compute
requires native WebGPU in these recipes. ShaderMaterial, onBeforeCompile and the
WebGL EffectComposer are not the WebGPURenderer customization path.

For raw WebGLRenderer, node support requires the explicit WebGLNodesHandler addon
and has feature limits; NEVER assume interchangeable rendering pipelines.
