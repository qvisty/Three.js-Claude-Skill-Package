# Three.js Skill Package — SOURCES

## Approved Documentation Sources

### Primary Sources
| Source | URL | Purpose | Last Verified |
|--------|-----|---------|---------------|
| Three.js Documentation | threejs.org/docs | Official API reference, guides, and manual | 2026-03-20 |
| Three.js Source Code | github.com/mrdoob/three.js | MIT license, authoritative API reference | 2026-03-20 |
| Three.js Examples | threejs.org/examples | Official examples with source code | 2026-03-20 |
| Three.js Migration Guide | threejs.org/docs/#manual/en/introduction/Migration-Guide | Breaking changes between versions | 2026-03-20 |

### Secondary Sources
| Source | URL | Purpose | Last Verified |
|--------|-----|---------|---------------|
| React Three Fiber Docs | docs.pmnd.rs/react-three-fiber | R3F API, hooks, canvas setup, events | 2026-03-20 |
| Drei Docs | docs.pmnd.rs/drei | Helper components and abstractions for R3F | 2026-03-20 |
| Three.js Fundamentals | threejs.org/manual | Tutorial-style guides for core concepts | 2026-03-20 |
| Three.js Discourse | discourse.threejs.org | Official community forum, expert Q&A | 2026-03-20 |
| Three.js Editor | threejs.org/editor | Browser-based scene editor for reverse engineering | 2026-03-20 |

### Ecosystem Sources
| Source | URL | Purpose | Last Verified |
|--------|-----|---------|---------------|
| Rapier Physics (dimforge) | rapier.rs | Physics engine used with Three.js/R3F | 2026-03-20 |
| react-three-rapier | github.com/pmndrs/react-three-rapier | R3F physics integration | 2026-03-20 |
| Cannon-es | github.com/pmndrs/cannon-es | Lightweight physics for Three.js | 2026-03-20 |
| postprocessing (vanruesc) | github.com/pmndrs/postprocessing | High-performance post-processing for Three.js | 2026-03-20 |
| @react-three/postprocessing | docs.pmnd.rs/react-postprocessing | R3F post-processing wrapper | 2026-03-20 |
| web-ifc / IFC.js | github.com/IFCjs/web-ifc-three | IFC/BIM model loading for Three.js | 2026-03-20 |
| Three.js WebGPU | github.com/mrdoob/three.js/tree/dev/src/renderers/webgpu | WebGPU renderer source | 2026-03-20 |
| TSL (Three Shading Language) | github.com/mrdoob/three.js/wiki/Three.js-Shading-Language | Node-based material system for WebGPU | 2026-03-20 |

### Anthropic Skills Ecosystem
| Source | URL | Purpose | Last Verified |
|--------|-----|---------|---------------|
| Claude Skills Hub | claude.com/skills | Official skill marketplace | 2026-03-20 |
| Complete Guide to Building Skills | resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf | Official guide: structure, frontmatter, patterns | 2026-03-20 |
| Anthropic Skills Repo | github.com/anthropics/skills | Official skills repo, example skills | 2026-03-20 |
| Claude Code Skills Docs | code.claude.com/docs/en/skills | Skill development details, progressive disclosure | 2026-03-20 |

### Community
| Source | URL | Purpose | Last Verified |
|--------|-----|---------|---------------|
| Three.js GitHub Issues | github.com/mrdoob/three.js/issues | Bug reports, feature discussions | 2026-03-20 |
| Stack Overflow [three.js] | stackoverflow.com/questions/tagged/three.js | Community Q&A | 2026-03-20 |
| r/threejs | reddit.com/r/threejs | Community showcase and discussion | 2026-03-20 |

## Source Rules
- ALWAYS prefer primary sources over secondary
- ALWAYS verify API patterns against the Three.js source code on GitHub
- NEVER rely on unofficial tutorials without cross-checking against official docs
- ALWAYS note the Three.js revision number (rXXX) when documenting version-specific behavior

## r186 Migration Sources (2026-11-14)

- Reference: qvisty/threejs-skills, commit `0e181866f095b5f06d005133876e926515390d95`.
- Target before migration: qvisty/Three.js-Claude-Skill-Package, commit `6c190f0db95d6e4b77d7843d181c6d3325c09d0e`.
- Authoritative published source: npm `three@0.186.1` (`src/core/Timer.js`,
  `src/renderers/webgl/`, `src/renderers/common/`, `src/materials/ShaderMaterial.js`,
  `examples/jsm/loaders/`, `examples/jsm/tsl/display/`).
- Published exports/peer contracts: Fiber 9.8.2, Drei 10.7.9; React 19.2.0.
- glTF Transform CLI 4.5.1 built-in help for weld, etc1s and uastc.
- New verification evidence: docs/validation/r186-migration.md.

These entries supersede older release assumptions in historical research.

## r187 Update Sources (2026-11-14)

- npm latest dist-tag: `three@0.187.0`; published gitHead
  `7e89746a687bb88271253698fa108b1dd59825d0`.
- [Official Migration Guide, 186 → 187](https://github.com/mrdoob/three.js/wiki/Migration-Guide#186--187).
  The guide also includes upcoming r188 material, which is outside this target.
- [Published r187 source](https://github.com/mrdoob/three.js/tree/7e89746a687bb88271253698fa108b1dd59825d0):
  PMREMGenerator, WebGLRenderer, MeshPhysicalMaterial, Light, Normal node accessors,
  StorageBufferNode, PixelationPassNode, VRButton/ARButton and WebXRManager.
- npm peer metadata for Fiber 9.8.2 and Drei 10.7.9 accepts three@0.187.0 and React 19.
- Current evidence: docs/validation/r187-migration.md. The sibling reference and
  the r186 report remain unchanged historical sources.
