# Brug de 24 Three.js-skills i Claude Code

Pakken målretter **Three.js r187 (`three@0.187.0`)**. Skills er instruktioner til
Claude Code; de installerer ikke Three.js eller andre afhængigheder i dit program.

## Installation i dit projekt

Klon skill-repoet uden for dit app-projekt, og kopiér de 24 individuelle skill-mapper
ind i projektets `.claude/skills/`. Dermed følger deres `references/`-filer med.
Hvis du allerede har samme skills installeret, tag en backup uden for
`.claude/skills/` først: kopieringen opdaterer filer med samme navn.

### macOS, Linux eller WSL

Erstat projektstien med din egen:

```bash
git clone https://github.com/qvisty/Three.js-Claude-Skill-Package.git "$HOME/threejs-skills-r187"
cd "/sti/til/dit-projekt"
mkdir -p .claude/skills

for skill_dir in "$HOME/threejs-skills-r187"/skills/source/*/*; do
  [ -f "$skill_dir/SKILL.md" ] || continue
  skill_name="$(basename "$skill_dir")"
  mkdir -p ".claude/skills/$skill_name"
  cp -R "$skill_dir/." ".claude/skills/$skill_name/"
done

find .claude/skills/threejs-* -maxdepth 1 -name SKILL.md | wc -l
```

Den sidste kommando skal vise **24**, hvis du kun har denne pakkes Three.js-skills.
Har du allerede klonet repoet, brug dets eksisterende sti i stedet for at klone igen.

### Windows PowerShell

Erstat projektstien med din egen:

```powershell
$skillRepo = Join-Path $HOME "threejs-skills-r187"
git clone https://github.com/qvisty/Three.js-Claude-Skill-Package.git $skillRepo
$projectDir = "C:\sti\til\dit-projekt"
$destination = Join-Path $projectDir ".claude\skills"
New-Item -ItemType Directory -Force -Path $destination | Out-Null

Get-ChildItem (Join-Path $skillRepo "skills\source") -Directory |
  Get-ChildItem -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName "SKILL.md") } |
  ForEach-Object {
    $target = Join-Path $destination $_.Name
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item (Join-Path $_.FullName "*") -Destination $target -Recurse -Force
  }

@(Get-ChildItem (Join-Path $destination "threejs-*\SKILL.md")).Count
```

Den sidste kommando skal vise **24**, med samme forbehold som ovenfor.

### Kontroller placeringen

Strukturen skal være sådan, uden en ekstra kategori-mappe mellem `skills` og skill-navnet:

```text
dit-projekt/
  .claude/
    skills/
      threejs-core-renderer/
        SKILL.md
        references/
          methods.md
          examples.md
          anti-patterns.md
      threejs-impl-lighting/
        SKILL.md
        references/
      ...
```

Kopiér kun skill-mapperne. Repoets egen `CLAUDE.md` beskriver vedligeholdelsen af
skill-pakken og skal ikke erstatte dit app-projekts `CLAUDE.md`.
Du behøver ikke installere skill-repoets npm-testværktøjer for at bruge instruktionerne.

## Aktivering i Claude Code

Åbn en ny Claude Code-session i dit app-projekt. Claude kan vælge skills ud fra
opgavens indhold og deres beskrivelser. Du kan også aktivere dem direkte:

```text
/threejs-core-renderer
```

Eller start en samlet sceneopgave:

```text
/threejs-agents-scene-builder Lav en lille Three.js r187-scene med orbit controls, PBR-materialer og skygger.
```

Hvis skill-navnet ikke dukker op, kontrollér at `SKILL.md` ligger direkte under
`.claude/skills/<skill-navn>/`, og at Claude Code er åbnet i det rigtige projekt.
Den eksplicitte kommando er en praktisk kontrol af installationen; automatisk
aktivering afhænger af opgaven og skillens beskrivelse.

## En passende startprompt

Kopiér [startprompten](CLAUDE-CODE-PROMPT-DA.md), og erstat linjen med dit projektmål.
Den beder Claude om at bruge skills, fastholde r187 og afprøve resultatet.

Hvis du vil fastholde baseline i senere sessioner, kan du tilføje dette til din
**egen** projekt-`CLAUDE.md`:

```text
Dette projekt bruger three@0.187.0 (r187).
Brug relevante Three.js-skills fra .claude/skills/.
Kontrollér API'er mod denne version. Opgrader ikke Three.js uden en særskilt opgave.
Rapportér, hvad der faktisk er testet, og hvilke integrationer der ikke er afprøvet.
```

## Afhængigheder i selve appen

Ved et nyt projekt kan Claude installere `three@0.187.0` i appen. Hvis du ønsker
React Three Fiber, er kombinationen af React/React DOM 19.2.0, Fiber 9.8.2 og Drei
10.7.9 afprøvet her. Et eksisterende projekts afhængigheder skal undersøges før ændringer.

Alle 24 skills målretter r187. Native WebGPU, XR-headsets, IFC, physics-motorer og
komplette eksterne asset-pipelines er ikke alle integrationstestet. En installeret
skill er vejledning, ikke en garanti for at enhver opskrift er fuldt verificeret.

## Senere opdateringer

Kør `git pull --ff-only` i din lokale kopi af skill-repoet og gentag kopieringen.
Skill-filerne i dit app-projekt opdaterer ikke sig selv fra GitHub.
