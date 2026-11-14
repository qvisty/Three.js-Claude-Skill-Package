# Startprompt til Claude Code: Three.js r187

Kopiér teksten nedenfor ind i Claude Code i dit app-projekt. Erstat projektmålet.

```text
Projektmål: [Beskriv her, hvad du vil bygge, og hvilken interaktion du ønsker.]

Brug de installerede Three.js-skills i .claude/skills/. Start med
threejs-agents-scene-builder og threejs-core-renderer, og brug de øvrige skills,
når de er relevante for opgaven, fx materials, lighting, shadows, controls og loaders.

Baseline er three@0.187.0 (r187). Undersøg først projektets struktur, instruktioner,
package.json og lockfil. Bevar eksisterende funktionalitet. Implementér derefter
opgaven. Hvis projektet er tomt, opret en lille Vite-app med JavaScript og Three.js.
Hvis det allerede bruger React, behold den arkitektur; den afprøvede kombination
her er React/React DOM 19.2.0, Fiber 9.8.2 og Drei 10.7.9.

Brug WebGLRenderer som udgangspunkt. Brug WebGPURenderer/TSL, hvis mit mål kræver
det, og afvent da renderer.init(). Hold rendering og postprocessing til den valgte
renderers API. Brug r187-API'er: Timer i selvstændige loops, HDRLoader til HDR,
PCFShadowMap og de nye iridescenceThicknessMinimum/Maximum-felter, hvor relevant.
Lad R3F eje sin frame-loop, hvis projektet bruger det.

Giv en passende kameraopsætning og synlig belysning, gør canvas responsivt,
brug delta-baseret animation og ryd op i event listeners og ejede GPU-ressourcer.
Brug ikke eksterne modeller eller teksturer, medmindre opgaven kræver dem.

Kør projektets relevante build og tests. Afprøv scenen i en browser, hvis værktøjerne
er tilgængelige: den skal tegne synligt indhold, håndtere resize, reagere på den
ønskede interaktion og undgå browser-/shaderfejl. Hvis du gemmer et skærmbillede,
tag det efter en renderet frame, også efter resize. Hvis en testmulighed mangler,
fortæl præcist, hvad der blev og ikke blev testet.

Afslut kort med, hvad du har bygget, startkommandoen og testresultaterne.
Push, deploy eller publicér ikke uden min udtrykkelige instruktion.
```
