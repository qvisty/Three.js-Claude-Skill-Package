# Three.js r186 migration and validation

> Historical report. The current package targets r187; see [r187 migration](r187-migration.md).
> Commands below describe the r186 run and now execute the current baseline.

Date: 2026-11-14. Status: implemented locally; checks below executed. No release or remote push is implied.

## Supported baseline

| Package | Tested version |
| --- | --- |
| three | 0.186.1 (r186) |
| @react-three/fiber | 9.8.2 |
| @react-three/drei | 10.7.9 |
| react / react-dom | 19.2.0 |

The registry reported `three@0.187.0` as latest during this work. This migration deliberately targets the reference repository's r186 baseline. It does not claim r187 compatibility or backwards compatibility with every r160+ release.

The 24 atomic skills and their names remain intact. Skills are consumed as Markdown; the npm development dependencies support maintainers' validation only. Historical research and old validation reports remain historical evidence, not certification of this revision.

## Sources and method

- Comparison repository: `qvisty/threejs-skills`, commit `0e181866f095b5f06d005133876e926515390d95` (13 topic skills).
- Target before changes: `qvisty/Three.js-Claude-Skill-Package`, commit `6c190f0db95d6e4b77d7843d181c6d3325c09d0e`.
- API authority: installed, integrity-checked npm `three@0.186.1` source and exports; package metadata and exports for the pinned React ecosystem.
- Supplementary asset-tool verification: installed `@gltf-transform/cli@4.5.1` help for `weld`, `etc1s`, and `uastc`.

Reference guidance was checked against package source rather than treated as an API authority. The reference checkout is unchanged. The source repository's MIT attribution is retained in [third-party notices](../../THIRD_PARTY_NOTICES.md).

## Findings and repairs

| Area | Previous guidance | r186 guidance / repair |
| --- | --- | --- |
| Release contract | Unbounded r160+, R3F 8, React 18 | Explicit r186, Fiber 9.8.2, Drei 10.7.9 and React 19 |
| HDR environments | RGBELoader | HDRLoader and matching addon imports |
| Timing | Standalone Clock, getters advancing time | Timer connected to document; update once per frame; stable delta/elapsed reads |
| Framework timing | R3F owns a Clock | Preserve framework-owned clock; consume useFrame delta; do not advance it manually |
| Shadows | PCFSoftShadowMap, obsolete filter distinctions | PCFShadowMap; corrected PCF radius guidance; Canvas shadows="percentage" |
| AO / lightmaps | Mandatory duplicate uv2 | texture.channel defaults to uv; uv1 is channel 1 for a separate unwrap |
| Addons | Missing .js extensions and historical renderer paths | Documented three/addons paths; WebGPURenderer from three/webgpu |
| Geometry | Capsule length parameter; no concrete current batching recipe | Capsule height/heightSegments; addGeometry followed by addInstance |
| Custom shaders | output_fragment; injected uv2/tangent assumptions | opaque_fragment; explicit secondary attribute declarations; corrected GLSL version notes |
| WebGPU fallback | Import WebGPU from three/webgpu; switch renderer classes | Automatic WebGL 2 fallback; await init before backend inspection |
| WebGPU effects | Nonexistent imports; old PostProcessing class; options-object bloom | RenderPipeline, effect-specific display addons, positional bloom arguments |
| Output conversion | Ambiguous renderOutput use | Default RenderPipeline conversion once; add bloom to scene color |
| Compute | Helpers imported from renderer module; deprecated async calls | TSL graph helpers from three/tsl; invoke Fn graph; initialized renderer.compute; backend boundary |
| React 19 TypeScript | Global JSX namespace and missing useThree import | Fiber ThreeElements augmentation and corrected controls example |
| Asset pipeline | Unscoped CLI package; nonexistent ktx2 command; weld tolerance; missing encoder/simplifier | Pinned CLI package, etc1s/uastc, exact-vertex weld, explicit sharp/MeshoptSimplifier dependencies |

## Reference topic coverage

| Reference topic | Target skill areas reviewed / updated |
| --- | --- |
| fundamentals | core renderer, scene graph, math; disposal/timing guidance |
| geometry | syntax geometries, performance, model optimization |
| materials + textures | syntax materials, shaders, loading; UV-channel rules |
| lighting | implementation lighting and shadows; HDR and PCF changes |
| animation | animation, physics timing and controls |
| loaders | syntax loaders, scene graph examples, optimizer runtime loaders |
| shaders | syntax shaders and implementation WebGPU |
| postprocessing | implementation post-processing and WebGPU |
| interaction | raycaster and syntax controls |
| performance | error/performance and model optimizer |
| react-three-fiber | implementation R3F and Drei |
| asset-pipeline | agent model optimizer and loader configuration |

This crosswalk records migration coverage, not a claim that every behavior in every reference example was executed.

## Executed checks

`npm test` passed:

- All 24 skills meet checked frontmatter/name/description/line-count/reference-file requirements.
- All package skill registrations resolve.
- 96 active Markdown files scanned; 421 runtime import statements resolve against the installed release set. Type-only TypeScript imports are excluded from runtime export checks.
- Namespace exports in fenced JavaScript/JSX examples checked against three and three/webgpu.
- Deprecated standalone Clock, RGBELoader, PCFSoftShadowMap and PostProcessing recipes rejected in fenced JavaScript/JSX.
- 10 maintained WebGPU JavaScript blocks parse as ES modules.
- CPU smoke checks exercise Timer delta behavior and AnimationMixer movement, BatchedMesh geometry/instance creation and transforms, texture channel defaults, CapsuleGeometry parameters, HDR decoding from an inline Radiance fixture, glTF scene-transform parsing, and TSL compute/bloom graph construction.
- Referenced shader chunk names exist; illustrative chunk/chunk_name placeholders are excluded.

`npm run test:browser` passed in headless Chromium using software WebGL:

1. Documented core-renderer scene: frames produced, nonblack center pixel, camera/canvas resize, no page or console errors.
2. Documented WebGPU scene with `forceWebGL: true`: RenderPipeline + bloom + TSL material renders through WebGL 2 fallback; same checks pass.
3. Documented R3F scene bundled with the locked dependencies: React 19 + Fiber + Drei OrbitControls render, animate and resize; same checks pass.

Browser tests extract their scene code from the Markdown so changes to those examples affect the check. The test adds only state/pixel instrumentation, React mounting and the explicit fallback option. Chromium must be installed separately; set CHROMIUM_PATH when it is not at /usr/bin/chromium.

The runtime-import check can emit Three.js's CJS deprecation warning through a transitive dependency. This is distinguished from browser errors; all maintained application imports use ES modules.

## Limits and follow-on integration requirements

- Native WebGPU adapter rendering and GPU compute dispatch/readback have not been executed; graph construction and the WebGL 2 rendering fallback have been checked.
- Only the representative scenes listed above were browser-tested. Not every JavaScript, TypeScript, JSX, GLSL or WGSL fragment was compiled or run. API-signature fragments and intentional anti-patterns are not runnable applications.
- Full TypeScript type-checking is not part of the current validator; the R3F browser bundle strips TS types.
- External models, texture downloads and real Draco/KTX2 decoding were not exercised. HDR decoding and glTF parsing are covered only by tiny inline CPU fixtures. Imports alone do not certify those asset pipelines.
- KTX2 encoding requires KTX-Software/toktx. CLI help was checked; no encoder installation or encoding run is claimed.
- Physics engines, IFC/BIM libraries, spatial audio playback, XR hardware/session flows and third-party postprocessing packages need separate integration runs and compatible dependency pins.
- These checks do not certify visual parity, image quality or performance budgets across GPUs and browsers.

## Reproduce

From the target repository:

```bash
npm ci
npm test
npm run test:browser
```

Use the existing checkout in the isolated cloud task; do not create another worktree unless explicitly requested. The sibling reference repo is useful for review, but is not a runtime dependency of the validator or the published skills.
