---
name: threejs-impl-webgpu
description: >
  Use when using the Three.js WebGPU renderer, node-based materials,
  TSL (Three Shading Language), or compute shaders. Prevents the common
  mistake of not checking browser support, missing async init, or using
  GLSL with WebGPU. Covers WebGPURenderer, node materials, TSL,
  compute shaders, WebGL fallback, migration guide.
  Keywords: WebGPU, WebGPURenderer, TSL, Three Shading Language, node material, compute shader, WGSL, MeshStandardNodeMaterial, next-gen rendering, modern GPU, WebGPU setup.
license: MIT
compatibility: "Designed for Claude Code. Targets Three.js r187 (three@0.187.0). Native WebGPU requires an available adapter and a secure context; WebGL 2 fallback is automatic."
metadata:
  author: OpenAEC-Foundation
  version: "1.2"
---

# threejs-impl-webgpu

> Targets Three.js r187 (`three@0.187.0`). Pin this revision: TSL and renderer APIs change between releases.

## Quick Reference

### WebGPURenderer Setup

```javascript
import * as THREE from 'three/webgpu';

const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init(); // MUST await before first render
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);
```

**ALWAYS** call `await renderer.init()` before the first `renderer.render()` call.
**ALWAYS** use `renderer.setAnimationLoop(callback)` instead of `requestAnimationFrame`.
**NEVER** call `renderer.render()` before `init()` resolves — this throws a runtime error.

### Backend Selection and Fallback

WebGPURenderer automatically falls back to WebGL 2 when WebGPU is unavailable.
ALWAYS await initialization before checking the selected backend. Browser version
alone does not establish adapter availability; WebGPU requires a secure context.

```javascript
import { WebGPURenderer } from 'three/webgpu';

const renderer = new WebGPURenderer({ antialias: true });
await renderer.init();
const hasNativeWebGPU = renderer.backend.isWebGPUBackend === true;
// Use { forceWebGL: true } to exercise the WebGL 2 fallback explicitly.
```

NEVER replace the renderer with WebGLRenderer just to obtain fallback: its
material and post-processing APIs differ. Native-only features require a backend
check, not a browser-name check.

### Critical Warnings

**NEVER** write raw GLSL or WGSL strings — ALWAYS use TSL functions. WebGPU compiles TSL to WGSL automatically. GLSL is NOT supported by the WebGPU backend.

**NEVER** use `ShaderMaterial` with WebGPURenderer — use `NodeMaterial` with TSL instead.

**NEVER** use `requestAnimationFrame` with WebGPURenderer — ALWAYS use `renderer.setAnimationLoop()`.

**NEVER** use `EffectComposer` (three/examples) with WebGPURenderer — use the `RenderPipeline` class with TSL nodes instead.

---

## Node Materials

Built-in surface materials have node-based equivalents. Classic materials auto-convert when used with WebGPURenderer, but node materials provide full TSL customization.

### Material Mapping

| Classic Material | Node Material |
|-----------------|---------------|
| `MeshBasicMaterial` | `MeshBasicNodeMaterial` |
| `MeshStandardMaterial` | `MeshStandardNodeMaterial` |
| `MeshPhysicalMaterial` | `MeshPhysicalNodeMaterial` |
| `MeshPhongMaterial` | `MeshPhongNodeMaterial` |
| `MeshLambertMaterial` | `MeshLambertNodeMaterial` |
| `LineBasicMaterial` | `LineBasicNodeMaterial` |
| `LineDashedMaterial` | `LineDashedNodeMaterial` |
| `PointsMaterial` | `PointsNodeMaterial` |
| `SpriteMaterial` | `SpriteNodeMaterial` |

**ALWAYS** import node materials from `'three/webgpu'`, not from `'three'`.

### NodeMaterial Input Properties

All properties accept TSL node values. All are optional and override defaults.

**Common inputs (all node materials):**

| Property | TSL Type | Purpose |
|----------|----------|---------|
| `.colorNode` | `vec4` | Base color |
| `.opacityNode` | `float` | Opacity |
| `.normalNode` | `vec3` | Normal map replacement |
| `.emissiveNode` | `color` | Emissive output |
| `.positionNode` | `vec3` | Vertex displacement |
| `.fragmentNode` | `vec4` | Full fragment shader replacement |
| `.vertexNode` | `vec4` | Full vertex shader replacement |
| `.outputNode` | `vec4` | Final output override |
| `.aoNode` | `float` | Ambient occlusion |
| `.alphaTestNode` | `float` | Alpha test threshold |
| `.depthNode` | `float` | Custom depth |
| `.castShadowNode` | `vec4` | Shadow casting override |

**Standard/Physical inputs:**

| Property | TSL Type | Purpose |
|----------|----------|---------|
| `.metalnessNode` | `float` | Metalness |
| `.roughnessNode` | `float` | Roughness |
| `.envNode` | `color` | Environment map |
| `.lightsNode` | — | Lighting model override |

**Physical-only inputs:** `.clearcoatNode`, `.clearcoatRoughnessNode`, `.clearcoatNormalNode`, `.sheenNode`, `.iridescenceNode`, `.iridescenceIORNode`, `.iridescenceThicknessNode`, `.specularIntensityNode`, `.specularColorNode`, `.iorNode`, `.transmissionNode`, `.thicknessNode`, `.attenuationDistanceNode`, `.attenuationColorNode`, `.dispersionNode`, `.anisotropyNode`.

---

## TSL (Three Shading Language)

TSL is a JavaScript-based node graph system that compiles to GLSL (WebGL2) and WGSL (WebGPU). It replaces raw shader strings entirely.

### Type System

| Category | Functions |
|----------|-----------|
| Scalars | `float()`, `int()`, `uint()`, `bool()` |
| Vectors | `vec2()`, `vec3()`, `vec4()`, `ivec2()`, `ivec3()`, `ivec4()`, `uvec2()`, `uvec3()`, `uvec4()` |
| Matrices | `mat2()`, `mat3()`, `mat4()` |
| Color | `color()` |
| Conversion | `.toFloat()`, `.toVec3()`, `.toColor()` |

### Variables and Uniforms

| Function | Purpose |
|----------|---------|
| `uniform(value)` | GPU-side dynamic value |
| `node.toVar()` | Reusable shader variable |
| `node.toConst()` | Inline constant |
| `varying(node)` | Vertex-to-fragment interpolation |
| `vertexStage(node)` | Force computation in vertex shader |
| `attribute(name, type)` | Access buffer attributes |

Uniforms support callbacks: `.onRenderUpdate(fn)`, `.onFrameUpdate(fn)`, `.onObjectUpdate(fn)`.

### Operators

All operators are chainable on TSL nodes:

- **Arithmetic:** `.add()`, `.sub()`, `.mul()`, `.div()`, `.mod()`
- **Comparison:** `.equal()`, `.notEqual()`, `.lessThan()`, `.greaterThan()`, `.lessThanEqual()`, `.greaterThanEqual()`
- **Logical:** `.and()`, `.or()`, `.not()`, `.xor()`
- **Assignment:** `.assign()`, `.addAssign()`, `.subAssign()`, `.mulAssign()`, `.divAssign()`
- **Bitwise:** `.bitAnd()`, `.bitOr()`, `.bitXor()`, `.shiftLeft()`, `.shiftRight()`

### Geometry Nodes

| Category | Nodes |
|----------|-------|
| Position | `positionGeometry`, `positionLocal`, `positionWorld`, `positionView`, `positionWorldDirection`, `positionViewDirection` |
| Normal | `normalGeometry`, `normalLocal`, `normalView`, `normalWorld` |
| Tangent | `tangentGeometry`, `tangentLocal`, `tangentView`, `tangentWorld` |
| UV | `uv(index)` |
| Screen | `screenUV`, `screenCoordinate`, `screenSize` |
| Viewport | `viewportUV`, `viewportCoordinate`, `viewportSize` |

### Camera and Model Nodes

- **Camera:** `cameraNear`, `cameraFar`, `cameraPosition`, `cameraProjectionMatrix`, `cameraViewMatrix`, `cameraWorldMatrix`, `cameraNormalMatrix`
- **Model:** `modelViewMatrix`, `modelNormalMatrix`, `modelWorldMatrix`, `modelPosition`, `modelScale`, `modelDirection`

### Animation Nodes

| Node | Purpose |
|------|---------|
| `time` | Elapsed seconds since start |
| `deltaTime` | Frame delta in seconds |
| `oscSine(timer)` | Sine oscillator (0-1) |
| `oscSquare(timer)` | Square wave oscillator |
| `oscTriangle(timer)` | Triangle wave oscillator |
| `oscSawtooth(timer)` | Sawtooth oscillator |

### Texture Operations

| Function | Purpose |
|----------|---------|
| `texture(tex, uv, level)` | Sample with interpolation |
| `textureLoad(tex, uv, level)` | Sample without interpolation |
| `textureStore(tex, uv, value)` | Write to storage texture |
| `textureSize(tex, level)` | Get texture dimensions |
| `cubeTexture(tex, uvw, level)` | Sample cube map |
| `triplanarTexture(texX, texY, texZ, scale, position, normal)` | Triplanar mapping |

### Control Flow

**ALWAYS** use capital `If` — lowercase `if` is JavaScript, not TSL.

```javascript
If(condition, () => {
  // true branch
}).ElseIf(otherCondition, () => {
  // else-if branch
}).Else(() => {
  // false branch
});
```

- `select(condition, trueVal, falseVal)` — ternary operator
- `Loop(count, ({ i }) => { })` — GPU loop, supports `Break()`, `Continue()`
- `Switch(value).Case(val, fn).Default(fn)` — no fallthrough
- `Discard()` — discard fragment
- `Return()` — early return

### Function Definition

```javascript
const myFn = Fn(([param1, param2]) => {
  return param1.add(param2);
});
// Call: myFn(nodeA, nodeB)
```

---

## Compute Shaders

WebGPU enables general-purpose GPU compute via TSL. Compute shaders are NOT available in WebGL fallback mode.

### Setup

```javascript
import { StorageBufferAttribute } from 'three/webgpu';
import { Fn, storage, instanceIndex, vec3 } from 'three/tsl';

const count = 1024;
const positions = storage(new StorageBufferAttribute(count, 3), 'vec3', count);
const computeNode = Fn(() => {
  positions.element(instanceIndex).assign(vec3(0, 1, 0));
})().compute(count);
// renderer.init() has already completed.
if (renderer.backend.isWebGPUBackend) renderer.compute(computeNode);
```

ALWAYS initialize first, then dispatch with `renderer.compute()`.
`computeAsync()` is deprecated; initialize once and use `compute()`. General storage-buffer compute requires
the native WebGPU backend; provide a CPU path or disable the feature on fallback.

### Storage and Atomics

- **Storage:** `storage(attribute, type, count)`, `storageTexture(texture)`
- **Atomics:** `atomicAdd()`, `atomicSub()`, `atomicMax()`, `atomicMin()`, `atomicAnd()`, `atomicOr()`, `atomicXor()`, `atomicStore()`, `atomicLoad()`
- **Barriers:** `workgroupBarrier()`, `storageBarrier()`, `textureBarrier()`
- **Built-in IDs:** `workgroupId`, `localId`, `globalId`, `numWorkgroups`, `subgroupSize`

---

## WebGPU Post-Processing

**NEVER** use the WebGL `EffectComposer` with WebGPURenderer. Use the `RenderPipeline` class instead.

```javascript
import { RenderPipeline } from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

const pipeline = new RenderPipeline(renderer);
const scenePass = pass(scene, camera);
const sceneColor = scenePass.getTextureNode('output');
pipeline.outputNode = sceneColor.add(bloom(sceneColor, 1.5, 0.4, 0.6));
renderer.setAnimationLoop(() => pipeline.render());
```

RenderPipeline performs output tone mapping and color-space conversion by default.
NEVER also wrap its output in `renderOutput()` unless `outputColorTransform` is
disabled deliberately. Bloom takes positional strength/radius/threshold arguments.

### Effect Imports

ALWAYS import effect helpers from their addons, not from `three/tsl`:
`BloomNode.js`, `FXAANode.js`, `SMAANode.js`, `GaussianBlurNode.js`,
`GTAONode.js`, `SSRNode.js`, and `SSGINode.js` live under `three/addons/tsl/display/`.
Core graph helpers such as `pass`, `uniform`, and `vec3` come from `three/tsl`.

### Color Operations

`luminance()`, `saturation()`, `vibrance()`, `hue()`, `posterize()`, `grayscale()`

### Blend Modes

`blendBurn()`, `blendDodge()`, `blendOverlay()`, `blendScreen()`, `blendColor()`

---

## WebGL to WebGPU Migration

| Step | Action |
|------|--------|
| 1 | Replace `import * as THREE from 'three'` with `import * as THREE from 'three/webgpu'` |
| 2 | Replace `new WebGLRenderer()` with `new WebGPURenderer()` and add `await renderer.init()` |
| 3 | Replace classic materials with NodeMaterial equivalents (or keep classic — they auto-convert) |
| 4 | Replace `EffectComposer` with `RenderPipeline` class and TSL post-processing nodes |
| 5 | Replace raw GLSL `ShaderMaterial` with TSL-based `NodeMaterial` |
| 6 | Replace `requestAnimationFrame` with `renderer.setAnimationLoop()` |

**ALWAYS** make the entry point `async` when using WebGPURenderer — `renderer.init()` returns a Promise.

---

## r187 TSL Compatibility

Math operands and parameters now coerce to a broader common type. ALWAYS use
explicit scalar/vector construction or component selection when shader interfaces
require a fixed shape. `pixelationPass` takes a JavaScript Number for pixelSize,
not a node. Struct storage is always an array: access element(0) before get('member')
for a single-element struct buffer. Custom WebGPU lights register with
CustomLight.registerNode(CustomLightNode), not renderer.library.addLight().

The former transformedNormalView/World and transformedClearcoatNormalView TSL
exports are absent in r187. Use normalView, normalWorld or clearcoatNormalView
for those shading accessors. NEVER import internal *Intent helpers.

## Reference Links

- [references/methods.md](references/methods.md) — API signatures for WebGPURenderer, NodeMaterial, TSL, compute
- [references/examples.md](references/examples.md) — Working code examples for WebGPU scenes
- [references/anti-patterns.md](references/anti-patterns.md) — Common mistakes and how to avoid them

### Official Sources

- https://threejs.org/docs/
- https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language
- https://threejs.org/examples/?q=webgpu
