# r187 WebGPU Anti-Patterns

## Replacing WebGPURenderer with WebGLRenderer for fallback

NEVER switch rendering APIs solely because WebGPU is unavailable. WebGPURenderer
already falls back to WebGL 2. ALWAYS await `init()` and retain the node-material
pipeline. For a native-only operation, check `renderer.backend.isWebGPUBackend`.
Use `{ forceWebGL: true }` to exercise fallback in a browser.

## Importing nonexistent exports

NEVER import `WebGPU` from `three/webgpu`. If explicit availability probing is
needed, use the default export of `three/addons/capabilities/WebGPU.js`; a probe
does not replace awaiting renderer initialization or checking its selected backend.
NEVER import effect helpers such as bloom from `three/tsl`: use their display addons.
ALWAYS import graph helpers such as storage from `three/tsl`.

## Mixing rendering stacks

NEVER use WebGL EffectComposer, ShaderMaterial or onBeforeCompile with this
renderer. Use RenderPipeline and node materials. The deprecated PostProcessing
class has been renamed RenderPipeline; use the r187 name in new examples.

## Rendering or detecting KTX2 support before initialization

ALWAYS await `renderer.init()` before `render()`, `compute()`, or
`ktx2Loader.detectSupport(renderer)`. NEVER assume the initial backend survives
initialization: fallback can replace it.

## Applying output conversion twice

RenderPipeline transforms its output by default. NEVER wrap its output node in
renderOutput unless disabling the automatic transform deliberately. ALWAYS add
bloom's result to the original scene color. Its parameters are positional:
`bloom(sceneColor, 1.5, 0.4, 0.6)`, not an options object.

## Calling deprecated async dispatch methods

ALWAYS initialize once, then use `render()` and `compute()`. GPU readback remains
asynchronous; await `getArrayBufferAsync()`. NEVER execute the storage compute
recipe on the WebGL 2 fallback without a separate supported implementation.
