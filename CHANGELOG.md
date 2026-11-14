# Changelog

All notable changes to the Three.js Skill Package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Target Three.js r187 (0.187.0), with React 19, Fiber 9.8.2 and Drei 10.7.9 retained.
- Review all 24 skills against r187 exports and the official migration guide.
- Document cubemap PMREM output, render-target viewport/scissor units, runtime
  primitives, TSL coercion/storage/light registration and the XR camera contract.
- Replace the deprecated iridescence thickness range with minimum/maximum fields.
- Correct a pre-existing XR session configuration API error found during review.
- Preserve r186 repairs to HDR loading, timing, PCF shadows, UV channels, imports,
  RenderPipeline, batching and glTF Transform recipes.

### Added
- Dependency-free Claude Code installer with per-file verification, read-only checks,
  safe repeatable updates, local-edit protection, backup and rollback support.
- Installer integration tests and documented macOS/Linux/WSL and PowerShell commands.
- Locked development dependencies and repeatable import/API/browser validation.
- r187 regression tests for target coordinates at DPR 2, PMREM generation and PBR
  rendering, iridescence serialization and numeric pixelation size.
- Browser case selection, real rotation assertions, resize-frame synchronization,
  and rendered-frame PNG/JSON artifacts; fixes blank image capture after resize.
- Separate historical r186 and current r187 migration/validation reports.

## [1.0.0] - 2026-03-20

### Added
- **24 deterministic skills** across 5 categories:
  - Core (4): scene-graph, renderer, math, raycaster
  - Syntax (5): geometries, materials, shaders, loaders, controls
  - Implementation (10): lighting, shadows, animation, post-processing, physics, react-three-fiber, drei, webgpu, ifc-viewer, audio, xr
  - Errors (2): performance, rendering
  - Agents (2): scene-builder, model-optimizer
- **96 reference files** (methods.md, examples.md, anti-patterns.md per skill)
- **27,627 words of research** across 7 research documents
- **Definitive masterplan** with per-skill agent prompts
- **Validation report**: 24/24 skills PASS all quality gates
- 11 architectural decisions (D-001 to D-011)
- 15 inherited lessons (L-001 to L-015)
- Approved source list with 20+ verified URLs
- Complete INDEX.md with skill catalog and dependency graph

### Research Documents
- b1-research-core.md (~4,000 words)
- b1-research-syntax.md (~5,700 words)
- b1-research-ecosystem.md (~4,800 words)
- vooronderzoek-threejs-core.md (6,299 words)
- vooronderzoek-threejs-geometry-materials.md (7,530 words)
- vooronderzoek-threejs-features.md (7,460 words)
- vooronderzoek-threejs-ecosystem.md (6,338 words)

## [0.1.0] - 2026-03-20

### Added
- Bootstrap workspace (B0): CLAUDE.md, ROADMAP.md, WAY_OF_WORK.md, REQUIREMENTS.md, DECISIONS.md, LESSONS.md, SOURCES.md, INDEX.md, CHANGELOG.md, OPEN-QUESTIONS.md, START-PROMPT.md
- Preliminary skill catalog: ~19 skills across 5 categories
- 4 architectural decisions (D-001 to D-004)
- 15 inherited lessons (L-001 to L-015)
- Approved source list with 20+ verified URLs
