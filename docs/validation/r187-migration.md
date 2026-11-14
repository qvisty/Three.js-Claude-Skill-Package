# Three.js r187 migration and validation

Date: 2026-11-14. Implemented locally; no Git push or environment publication is implied.

## Baseline and sources

The npm `latest` dist-tag was checked and resolves to **three@0.187.0**. The package
and lockfile now pin that version. React 19.2.0, Fiber 9.8.2 and Drei 10.7.9 are
retained: their published peer ranges accept this combination, and its documented
scene was rendered in Chromium.

Sources:

- [Official migration guide, 186 → 187](https://github.com/mrdoob/three.js/wiki/Migration-Guide#186--187).
- [Published source revision](https://github.com/mrdoob/three.js/tree/7e89746a687bb88271253698fa108b1dd59825d0), as reported by npm's gitHead.
- Installed r186/r187 export comparison for three, three/webgpu and three/tsl.
- Installed source for PMREMGenerator, WebGLRenderer, MeshPhysicalMaterial, Light,
  StorageBufferNode, Normal accessors, PixelationPassNode and WebXRManager/button helpers.

The sibling `threejs-skills` checkout remains unchanged and targets r186. It was
useful for the previous migration, but is not treated as an r187 source. The guide
also contains upcoming r188 material; none of that establishes a stable r188 release.
Historical research and the [r186 report](r186-migration.md) remain historical evidence.

## Release changes addressed

| r187 change | Update and evidence |
| --- | --- |
| PMREM uses cubemap mip levels; CubeUVReflectionMapping removed | Correct output types and lighting/material guidance; generate a PMREM cube in Chromium and render a physical material using it |
| Viewport/scissor scaling differs with a bound target | Document target pixels versus canvas CSS pixels; assert GL state and red/blue target pixel readback at DPR 2 |
| WeakRef and FinalizationRegistry required internally | Document runtime requirements and check their presence |
| Iridescence thickness range deprecated | Use minimum/maximum properties; verify clone/serialization and browser material rendering |
| TSL math coercion changes | Document explicit type/interface choices in shading and WebGPU skills |
| pixelationPass pixelSize is a Number | Document and exercise numeric pass construction |
| Custom light-node registration changes | Document CustomLight.registerNode(CustomLightNode); no custom-light GPU integration test claimed |
| Single-element struct storage remains an array | Document element(0).get('member'); no native GPU dispatch claimed |
| XR camera matrix derives from first eye | Document aggregate versus per-eye use; no headset/session test claimed |

The export comparison additionally found removed internal TSL helpers and transformed
normal accessors. No active examples import them; guidance uses the current shading
accessors. A pre-existing XR error was found during source review: session features
belong in VRButton/ARButton.createButton(renderer, sessionInit), not a nonexistent
renderer.xr.setSessionInit method. That guidance and the examples were corrected.

## Coverage for all 24 skills

All rows below have an explicit r187 compatibility declaration, checked skill structure,
resolved package registration and scanned active imports. "Review" is not an assertion
that every recipe or third-party integration was executed.

| Skill | Release review and focused evidence |
| --- | --- |
| threejs-core-scene-graph | No additional r187-specific snippet migration found; imports checked |
| threejs-core-renderer | Viewport/scissor and runtime contracts updated; browser scene, animation, resize and DPR regression checks |
| threejs-core-math | No additional r187-specific snippet migration found; imports checked |
| threejs-core-raycaster | No additional r187-specific snippet migration found; imports checked |
| threejs-syntax-geometries | Existing current geometry recipes retained; CapsuleGeometry/batching CPU smoke checks |
| threejs-syntax-materials | Iridescence properties and PMREM representation updated; serialization and browser PBR checks |
| threejs-syntax-shaders | TSL type/normal/storage/light guidance updated; imports and shader-chunk names checked |
| threejs-syntax-loaders | Current HDR/addon guidance retained; tiny HDR/glTF fixture parsing checked |
| threejs-syntax-controls | No additional r187-specific snippet migration found; imports checked |
| threejs-impl-lighting | PMREM return types and automatic environment filtering clarified; PMREM generation/rendering checked |
| threejs-impl-shadows | PCF recipe retained; core browser example exercises a shadow-casting light |
| threejs-impl-animation | Timer recipe retained; CPU mixer movement and browser rotation checked |
| threejs-impl-post-processing | RenderPipeline guidance retained; bloom pipeline rendered through WebGL 2 fallback |
| threejs-impl-physics | Three.js timing/imports reviewed; physics-engine integration not executed |
| threejs-impl-react-three-fiber | Peer metadata checked; React/Fiber/Drei scene renders, animates and resizes |
| threejs-impl-drei | Peer metadata checked; OrbitControls included in the R3F browser scene |
| threejs-impl-webgpu | TSL/renderer contracts updated; graph construction and rendering fallback checked, native GPU untested |
| threejs-impl-ifc-viewer | Three.js imports reviewed; BIM dependencies/model workflows untested |
| threejs-impl-audio | Three.js imports reviewed; spatial playback untested |
| threejs-impl-xr | Camera contract and session configuration corrected; XR device behavior untested |
| threejs-errors-performance | Existing batching/disposal guidance retained; imports and batching CPU checks |
| threejs-errors-rendering | Import/API diagnostics reviewed; representative browser scenes checked |
| threejs-agents-scene-builder | Environment setup corrected to allow automatic filtering; imports checked |
| threejs-agents-model-optimizer | Three.js import/decoder examples reviewed; glTF CLI/codec toolchains not rerun for this release |

## Executed validation

Before upgrading, the documented core-renderer example passed on r186: the cube
rendered, its rotation changed, resizing worked and Chromium reported no page or
console errors. The first image capture occurred between resize and the next draw
and was blank. Capture now occurs inside a rendered frame after post-resize frame
synchronization; the replacement image and the r187 images were visually inspected.

On r187:

- `npm test` passes for 24 skills, 96 Markdown files, 421 runtime imports and 10
  maintained WebGPU JavaScript blocks, with shader-chunk and selected CPU/API checks.
- Additional CPU checks verify r187, runtime primitives, iridescence clone/JSON
  minimum/maximum fields and numeric pixelation size. API-signature and intentional
  anti-pattern fragments are not treated as complete executable applications.
- `npm run test:browser` passes for documented WebGL, WebGPURenderer forced WebGL 2
  fallback, and React Three Fiber/Drei scenes. All assert real rotation changes,
  nonblack pixels, post-resize rendering and absence of page/console errors.
- The WebGL case also verifies target viewport/scissor `[0,0,8,16]` at DPR 2,
  red/blue pixel separation in a 16×16 target, canvas CSS-pixel scaling, cubemap
  PMREM generation and a nonblack PMREM-lit MeshPhysicalMaterial render.
- The complete environment install script reinstalls from the lockfile and runs
  both suites; repository dependency manifests are not rewritten by installation.

Recorded browser evidence is in [r187-browser-results.json](r187-browser-results.json).
Local PNG/JSON artifacts are generated under `/workspace/threejs-test-results/r187`.
They are outputs of this machine, not a guarantee of restoration in a separate task.

## Reproduce

```bash
cd /workspace/Three.js-Claude-Skill-Package
npm ci --include=dev
npm test
npm run test:browser -- --artifacts /workspace/threejs-test-results/r187
```

For one renderer example, add `--case webgl`. Set CHROMIUM_PATH if Chromium is not
at /usr/bin/chromium. The tests start and stop their own local HTTP server/browser.
The saved environment install/start instructions are updated for the generic
`scripts/validate-skills.mjs` entry point and the r187 baseline.

## Limits

These checks use software WebGL. They do not certify native WebGPU rendering or
compute dispatch, XR devices, IFC/BIM, physics engines, spatial audio, real external
HDR/glTF assets, Draco/KTX2 decoding/encoding or every third-party postprocessing
package. TSX is bundled rather than fully type-checked; not every shader or recipe
has been executed. Visual parity and performance across GPUs remain unmeasured.
The runtime import scan may emit a transitive dependency's Three.js CJS deprecation
warning; maintained application snippets use ES module imports.

All 24 skills now target r187. Full integration certification of all 24 is not claimed.
