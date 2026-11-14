<p align="center">
  <img src="docs/social-preview.png" alt="24 Deterministic Skills for Three.js" width="100%">
</p>

# Three.js Claude Skill Package

> 24 deterministic skills for Three.js 3D web development with Claude Code.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-r187-black.svg)](https://threejs.org/)
[![Skills](https://img.shields.io/badge/Skills-24-blue.svg)]()

A comprehensive skill package that gives Claude deep knowledge of Three.js r187 (`three@0.187.0`), React Three Fiber, Drei, WebGPU, physics engines, and more. Every skill uses deterministic ALWAYS/NEVER language for consistent, reliable code generation.

## Validated release baseline

This revision targets **Three.js r187 (`three@0.187.0`)**, with React 19,
`@react-three/fiber@9.8.2` and `@react-three/drei@10.7.9`. It no longer promises
compatibility with every release from r160 onward. npm confirmed `0.187.0` as
the latest stable Three.js version on 2026-11-14.

The original r186 migration used `qvisty/threejs-skills` as a topic cross-check.
The r187 update follows the official migration guide and published r187 source;
the reference repository still targets r186. See the
[migration and validation report](docs/validation/r187-migration.md) for changes,
source revisions, coverage and remaining runtime limits. Historical research
documents retain their original version assumptions.

For maintainers:

```bash
npm ci
npm test
npm run test:browser # requires Chromium; default /usr/bin/chromium
```

Set `CHROMIUM_PATH` if Chromium is installed elsewhere. These dependencies are
for validation; consuming the Markdown skills does not require an npm install.
The browser check executes documented WebGL, WebGPURenderer fallback and React Three Fiber scenes.
It also checks r187 render-target coordinates, PMREM cubemaps and a PBR material.
To save rendered-frame images and JSON results outside the checkout:

```bash
npm run test:browser -- --artifacts /workspace/threejs-test-results/r187
npm run test:browser -- --case webgl --artifacts /workspace/threejs-test-results/renderer
```

The images are captured immediately after rendering, including after resize.
All 24 skills target r187; this does not certify every integration or code fragment.

## Installation in Claude Code

Use Node.js 20+ to install all 24 skills into an existing app project. No dependency
installation is needed in this repository:

```bash
git clone https://github.com/qvisty/Three.js-Claude-Skill-Package.git
node Three.js-Claude-Skill-Package/scripts/install-claude-skills.mjs --project "/path/to/your/app"
```

The installer copies the registered skills, references, assets and license notices
into `<project>/.claude/skills/` and verifies file hashes. Run it again after
`git pull --ff-only` to update. It preserves unrelated skills and stops before
replacing local edits. Use `--force` to back up and replace modified skill directories;
backups live outside Claude's discovery directory. `--check` verifies without writing.

From the skill repository you can also use:

```bash
npm run skills:install -- --project "/path/to/your/app"
npm run skills:check -- --project "/path/to/your/app"
```

See the [Danish installation and usage guide](docs/CLAUDE-CODE-DA.md) for Windows
PowerShell and macOS/Linux/WSL commands, updates and backup behavior. A
[copy-ready Danish starter prompt](docs/CLAUDE-CODE-PROMPT-DA.md) is included.

Start a new Claude Code session in your app project. Claude can select relevant
skills from your request; invoke `/threejs-core-renderer` to check discovery. The
installer does not copy this repository's maintenance CLAUDE.md or install app dependencies.

## Skills Overview

| Category | Count | Skills |
|----------|-------|--------|
| **Core** | 4 | Scene Graph, Renderer, Math, Raycaster |
| **Syntax** | 5 | Geometries, Materials, Shaders, Loaders, Controls |
| **Implementation** | 11 | Lighting, Shadows, Animation, Post-Processing, Physics, R3F, Drei, WebGPU, IFC, Audio, XR |
| **Errors** | 2 | Performance, Rendering |
| **Agents** | 2 | Scene Builder, Model Optimizer |

### Core Skills — Foundation

- **threejs-core-scene-graph** — Object3D hierarchy, traversal, layers, fog, coordinate conversion
- **threejs-core-renderer** — WebGLRenderer, tone mapping, color management, render targets
- **threejs-core-math** — Vector3, Matrix4, Quaternion, Euler, Color, MathUtils
- **threejs-core-raycaster** — Mouse picking, hover detection, InstancedMesh picking

### Syntax Skills — Building Blocks

- **threejs-syntax-geometries** — BufferGeometry, 21 built-in geometries, InstancedMesh
- **threejs-syntax-materials** — 15+ material types, PBR, textures, color space rules
- **threejs-syntax-shaders** — ShaderMaterial, GLSL, uniforms, ShaderChunk, onBeforeCompile
- **threejs-syntax-loaders** — GLTFLoader, DRACOLoader, KTX2Loader, TextureLoader
- **threejs-syntax-controls** — OrbitControls, MapControls, FlyControls, TransformControls

### Implementation Skills — Feature Recipes

- **threejs-impl-lighting** — 7 light types, IBL, PMREMGenerator, HDR environment maps
- **threejs-impl-shadows** — Shadow maps, bias tuning, artifact diagnosis
- **threejs-impl-animation** — AnimationMixer, crossfade, skeletal animation from GLTF
- **threejs-impl-post-processing** — EffectComposer, pmndrs/postprocessing, bloom, SSAO
- **threejs-impl-physics** — cannon-es and Rapier integration with sync patterns
- **threejs-impl-react-three-fiber** — R3F Canvas, hooks, JSX mapping, event system
- **threejs-impl-drei** — 150+ Drei helper components
- **threejs-impl-webgpu** — WebGPURenderer, TSL, node materials, compute shaders
- **threejs-impl-ifc-viewer** — IFC/BIM loading with web-ifc and @thatopen/components
- **threejs-impl-audio** — 3D spatial audio, AudioListener, PositionalAudio
- **threejs-impl-xr** — WebXR VR/AR, controllers, hand tracking, hit testing

### Error Skills — Debugging

- **threejs-errors-performance** — Memory leaks, dispose patterns, draw call optimization
- **threejs-errors-rendering** — Black screen, wrong colors, z-fighting, shadow artifacts

### Agent Skills — Orchestration

- **threejs-agents-scene-builder** — Decision trees for complete scene composition
- **threejs-agents-model-optimizer** — GLTF optimization pipeline (Draco, KTX2, LOD)

## Skill Quality

Every skill in this package meets strict quality requirements:

- **< 500 lines** per SKILL.md (average: 338 lines)
- **Deterministic language** — ALWAYS/NEVER, zero hedging words
- **English only** — Claude reads English, responds in any language
- **Complete references** — methods.md, examples.md, anti-patterns.md per skill
- **ES module imports** — Modern `import { X } from 'three'` syntax
- **Version-explicit** — Three.js r187 (`three@0.187.0`), React Three Fiber 9.8.2 / React 19
- **Self-contained** — Each skill works independently

## Technology Coverage

| Technology | Version | Skills |
|------------|---------|--------|
| Three.js | r187 (`three@0.187.0`) | All 24 skills |
| React Three Fiber | 9.8.2 | impl-react-three-fiber, impl-drei |
| Drei | 10.7.9 | impl-drei |
| WebGPU Renderer | r187, automatic WebGL 2 fallback | impl-webgpu |
| cannon-es | 0.20+ | impl-physics |
| Rapier | 0.12+ | impl-physics |
| @thatopen/components | v3.x | impl-ifc-viewer |
| WebXR | Latest | impl-xr |

## Project Structure

```
Three.js-Claude-Skill-Package/
├── skills/source/
│   ├── threejs-core/          (4 skills)
│   ├── threejs-syntax/        (5 skills)
│   ├── threejs-impl/          (11 skills)
│   ├── threejs-errors/        (2 skills)
│   └── threejs-agents/        (2 skills)
├── docs/
│   ├── masterplan/            (raw + definitive masterplan)
│   ├── research/              (7 research documents, 27,627 words)
│   └── validation/            (validation report)
├── CLAUDE.md                  (project configuration)
├── INDEX.md                   (complete skill catalog)
├── REQUIREMENTS.md            (quality guarantees)
├── ROADMAP.md                 (project status)
└── README.md                  (this file)
```

## Methodology

This package was built using the proven 7-phase research-first methodology:

1. **Raw Masterplan** — Technology landscape mapping
2. **Deep Research** — 27,627 words of vooronderzoek across 7 documents
3. **Masterplan Refinement** — 19 → 24 skills with atomic skill principle
4. **Skill Creation** — 8 parallel batches of 3 skills each
5. **Validation** — 24/24 skills PASS all quality gates
6. **Publication** — README, INDEX, CHANGELOG, GitHub release

## Related Packages

- [ERPNext Skill Package](https://github.com/OpenAEC-Foundation/ERPNext_Anthropic_Claude_Development_Skill_Package) (28 skills)
- [Blender-Bonsai Skill Package](https://github.com/OpenAEC-Foundation/Blender-Bonsai-ifcOpenshell-Sverchok-Claude-Skill-Package) (73 skills)
- [Tauri 2 Skill Package](https://github.com/OpenAEC-Foundation/Tauri-2-Claude-Skill-Package) (27 skills)

---

## Companion Skills: Cross-Technology Integration

> **[Cross-Tech AEC Integration Skills](https://github.com/OpenAEC-Foundation/Cross-Tech-AEC-Claude-Skill-Package)** — 15 skills for technology boundaries

| Skill | Boundary | What it adds |
|-------|----------|-------------|
| `crosstech-impl-ifc-to-threejs` | IFC ↔ Three.js | Loading IFC into Three.js, @thatopen/components, Fragments format |
| `crosstech-impl-bim-web-viewer` | BIM ↔ Web browser | End-to-end BIM viewer with Three.js |
| `crosstech-core-coordinate-systems` | BIM ↔ GIS | Y-up (Three.js) vs Z-up (IFC) axis handling |

## License

MIT — see [LICENSE](LICENSE) for details.

## Author

[OpenAEC Foundation](https://github.com/OpenAEC-Foundation)
