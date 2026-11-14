# Brug de 24 Three.js-skills i Claude Code

Pakken målretter **Three.js r187 (`three@0.187.0`)**. Skills er instruktioner til
Claude Code; de installerer ikke Three.js eller andre afhængigheder i dit program.

## Installation i dit projekt

Du skal have **Node.js 20 eller nyere** og Git. Installationsscriptet bruger kun
Node.js' indbyggede funktioner: du behøver ikke køre `npm install` i skill-repoet.

Scriptet kopierer alle registrerede skills, deres referencer, eventuelle assets
og scripts samt licenser til dit projekts `.claude/skills/`. Det kontrollerer
kildematerialet før kopiering og verificerer filernes SHA-256-hashes bagefter.

### macOS, Linux eller WSL

Erstat projektstien med dit eksisterende app-projekt:

```bash
git clone https://github.com/qvisty/Three.js-Claude-Skill-Package.git "$HOME/threejs-skills-r187"
node "$HOME/threejs-skills-r187/scripts/install-claude-skills.mjs" --project "/sti/til/dit-projekt"
```

### Windows PowerShell

Samme script virker i PowerShell. Erstat projektstien med din egen:

```powershell
$skillRepo = Join-Path $HOME "threejs-skills-r187"
git clone https://github.com/qvisty/Three.js-Claude-Skill-Package.git $skillRepo
node (Join-Path $skillRepo "scripts\install-claude-skills.mjs") --project "C:\sti\til\dit-projekt"
```

Har du allerede klonet repoet, brug dets eksisterende sti i stedet for at klone igen.
Målprojektet skal findes på forhånd. Scriptet opretter `.claude/skills/` efter behov.

### Kontroller installationen

Kør samme kommando med `--check`. Den læser filerne uden at skrive til projektet:

```bash
node /sti/til/skill-repo/scripts/install-claude-skills.mjs --project "/sti/til/dit-projekt" --check
```

På Windows bruges tilsvarende sti til scriptet og projektet. Du kan også køre
følgende fra skill-repoets rod:

```bash
npm run skills:install -- --project "/sti/til/dit-projekt"
npm run skills:check -- --project "/sti/til/dit-projekt"
```

En vellykket kontrol bekræfter alle 24 skills og deres filer. Gentager du en
installation med uændrede filer, sker der ingen omskrivning eller ny backup.

Strukturen bliver:

```text
dit-projekt/
  .claude/
    threejs-skills-install.json
    skills/
      threejs-core-renderer/
        SKILL.md
        references/
        LICENSE
        THIRD_PARTY_NOTICES.md
      ... øvrige skills
```

Installationsregistreringen i `.claude/threejs-skills-install.json` gør det muligt
at skelne en tidligere installation fra lokale ændringer. Bevar den ved opdateringer.
Andre skills, appens `CLAUDE.md`, projektets afhængigheder og Claude Code-indstillinger
bliver ikke ændret. Scriptet følger ikke symbolske links i installationsmapperne;
brug almindelige mapper til denne installation.

Repoets egen `CLAUDE.md` beskriver vedligeholdelsen af skill-pakken og skal ikke
erstatte dit app-projekts `CLAUDE.md`. Scriptet kopierer den ikke.

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

Hent først ændringer i din lokale kopi af skill-repoet, og kør samme installer igen:

```bash
git -C "/sti/til/skill-repo" pull --ff-only
node /sti/til/skill-repo/scripts/install-claude-skills.mjs --project "/sti/til/dit-projekt"
```

Scriptet opdaterer uændrede, tidligere installerede skills og fjerner forældede
filer i disse mapper. Hvis en fremtidig pakke fjerner en skill, kan den tidligere
registrerede skill også fjernes. Andre skills røres ikke. Tidligere versioner af
udskiftede mapper gemmes i `.claude/threejs-skill-backups/`, uden for Claudes
skill-mappe, så backupkopier ikke bliver indlæst som ekstra skills.

Har du ændret en installeret fil eller tilføjet egne filer i en af pakkens mapper,
stopper hele opdateringen før ændringer i installationen. Du kan enten flytte dine
rettelser til egne skills eller udtrykkeligt vælge backup og udskiftning:

```bash
node /sti/til/skill-repo/scripts/install-claude-skills.mjs --project "/sti/til/dit-projekt" --force
```

`--force` gemmer de eksisterende mapper, inklusive dine egne filer, før de erstattes.
Scriptet viser backupstien. Det er ikke en sammenfletning af dine rettelser med de
nye skills. Hvis en udskiftning fejler, forsøger scriptet at gendanne installationen.

Har du installeret manuelt tidligere, kan matchende kopier overtages automatisk.
Afvigende versioner kræver `--force`, fordi scriptet ikke kender deres historik.

Der udføres ingen automatisk Git-pull, netværksadgang eller opgradering af appens
Three.js. Installerede skill-filer opdateres, når du selv kører kommandoerne ovenfor.
