# threejs-impl-animation — Anti-Patterns

> What NOT to do with the Three.js Animation System. Every entry includes the mistake, why it fails, and the correct approach.

---

## Anti-Pattern 1: Forgetting mixer.update(delta) in the Render Loop

**WRONG:**

```js
const mixer = new THREE.AnimationMixer(model);
mixer.clipAction(clip).play();

function animate() {
  // Missing mixer.update(delta) -- animations will NEVER play
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
```

**WHY:** The mixer does NOT advance time automatically. Without `mixer.update(delta)`, all actions remain frozen at time 0.

**CORRECT:**

```js
const timer = new THREE.Timer();
timer.connect(document);
const mixer = new THREE.AnimationMixer(model);
mixer.clipAction(clip).play();

function animate() {
  timer.update();
  const delta = timer.getDelta();
  mixer.update(delta); // ALWAYS call every frame
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
```

---

## Anti-Pattern 2: Using a Fixed Delta Instead of Timer

**WRONG:**

```js
function animate() {
  mixer.update(1 / 60); // Assumes constant 60fps -- breaks on slow devices
  renderer.render(scene, camera);
}
```

**WHY:** Frame rates vary across devices and over time. A fixed delta causes animations to speed up or slow down unpredictably. On a 30fps device, animations play at half speed.

**CORRECT:**

```js
const timer = new THREE.Timer();
timer.connect(document);

function animate() {
  timer.update();
  const delta = timer.getDelta(); // Actual time between frames
  mixer.update(delta);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
```

---

## Anti-Pattern 3: Crossfading Without reset() on the Incoming Action

**WRONG:**

```js
function switchToWalk() {
  walkAction.crossFadeFrom(idleAction, 0.5, true);
  walkAction.play();
  // walkAction may still have stale time/weight from a previous play
}
```

**WHY:** If the walk action was previously played and stopped, its internal state (time, weight, timeScale) retains old values. The crossfade starts from the wrong position or weight, producing jerky transitions.

**CORRECT:**

```js
function switchToWalk() {
  walkAction.reset(); // ALWAYS reset before crossfading
  walkAction.setEffectiveTimeScale(1);
  walkAction.setEffectiveWeight(1);
  walkAction.crossFadeFrom(idleAction, 0.5, true);
  walkAction.play();
}
```

---

## Anti-Pattern 4: Using LoopOnce Without clampWhenFinished

**WRONG:**

```js
const action = mixer.clipAction(clip);
action.setLoop(THREE.LoopOnce, 1);
action.play();
// Animation snaps back to frame 0 after finishing
```

**WHY:** Without `clampWhenFinished = true`, the action resets to its initial state when it completes. The model visibly jumps back to the start pose, which looks broken for one-shot animations like door opens, attacks, or death animations.

**CORRECT:**

```js
const action = mixer.clipAction(clip);
action.setLoop(THREE.LoopOnce, 1);
action.clampWhenFinished = true; // ALWAYS set for LoopOnce
action.play();
```

---

## Anti-Pattern 5: Creating a New Mixer Every Frame

**WRONG:**

```js
// Shared standalone frame timer (create once, dispose on teardown).
const timer = new THREE.Timer();
timer.connect(document);
function animate() {
  timer.update();
  const mixer = new THREE.AnimationMixer(model); // New mixer every frame!
  mixer.clipAction(clip).play();
  mixer.update(timer.getDelta());
  renderer.render(scene, camera);
}
```

**WHY:** Creating a new mixer every frame discards all previous action state. Animations restart from frame 0 every frame, producing a frozen first-frame appearance. It also generates massive garbage collection pressure.

**CORRECT:**

```js
// Shared standalone frame timer (create once, dispose on teardown).
const timer = new THREE.Timer();
timer.connect(document);
const mixer = new THREE.AnimationMixer(model); // Create ONCE
const action = mixer.clipAction(clip);
action.play();

function animate() {
  timer.update();
  mixer.update(timer.getDelta());
  renderer.render(scene, camera);
}
```

---

## Anti-Pattern 6: Calling play() Every Frame

**WRONG:**

```js
// Shared standalone frame timer (create once, dispose on teardown).
const timer = new THREE.Timer();
timer.connect(document);
const action = mixer.clipAction(clip);

function animate() {
  timer.update();
  action.play(); // Called every frame -- unnecessary
  mixer.update(timer.getDelta());
  renderer.render(scene, camera);
}
```

**WHY:** `.play()` is an activation method, not an update method. While calling it on an already-playing action is harmless (it returns immediately), doing so every frame signals a fundamental misunderstanding of the API. It can also interfere with fading and crossfade transitions by re-activating an action that is being faded out.

**CORRECT:**

```js
// Shared standalone frame timer (create once, dispose on teardown).
const timer = new THREE.Timer();
timer.connect(document);
const action = mixer.clipAction(clip);
action.play(); // Call ONCE

function animate() {
  timer.update();
  mixer.update(timer.getDelta());
  renderer.render(scene, camera);
}
```

---

## Anti-Pattern 7: Instantiating AnimationAction Directly

**WRONG:**

```js
const action = new THREE.AnimationAction(mixer, clip); // NEVER do this
```

**WHY:** `AnimationAction` is designed to be created and cached by the mixer. Direct instantiation bypasses the mixer's internal action cache, leading to duplicate actions, broken crossfades, and memory leaks.

**CORRECT:**

```js
const action = mixer.clipAction(clip); // ALWAYS use mixer.clipAction()
```

---

## Anti-Pattern 8: Forgetting to Dispose the Mixer on Model Removal

**WRONG:**

```js
scene.remove(model);
// Mixer still holds references, continues to call update, leaks memory
```

**WHY:** The mixer retains internal references to the model and all its actions. If the model is removed from the scene but the mixer is not cleaned up, it continues to consume memory and CPU during `mixer.update()`.

**CORRECT:**

```js
mixer.stopAllAction();
mixer.uncacheRoot(model);
scene.remove(model);
mixer = null; // Allow garbage collection
```

---

## Anti-Pattern 9: Using Multiple Mixers for the Same Model

**WRONG:**

```js
const mixer1 = new THREE.AnimationMixer(model);
const mixer2 = new THREE.AnimationMixer(model);
mixer1.clipAction(walkClip).play();
mixer2.clipAction(idleClip).play();
```

**WHY:** Multiple mixers on the same root object cause conflicting property writes. Both mixers attempt to set the same bone transforms every frame, producing jittering, twitching, or completely broken animation. Crossfade and blending between clips on different mixers is impossible.

**CORRECT:**

```js
const mixer = new THREE.AnimationMixer(model); // ONE mixer per model
mixer.clipAction(walkClip).play();
mixer.clipAction(idleClip).play();
// Use weight and crossfade to blend between them
```

---

## Anti-Pattern 10: Animating material.opacity Without Setting transparent=true

**WRONG:**

```js
const track = new THREE.NumberKeyframeTrack(
  'Mesh.material.opacity',
  [0, 1],
  [1, 0]
);
// Opacity changes but object remains fully visible
```

**WHY:** Three.js materials require `material.transparent = true` for opacity values below 1 to have any visual effect. Without this flag, the material ignores the opacity property during rendering.

**CORRECT:**

```js
material.transparent = true; // MUST set before animating opacity

const track = new THREE.NumberKeyframeTrack(
  'Mesh.material.opacity',
  [0, 1],
  [1, 0]
);
```

---

## Anti-Pattern: Updating Timer More Than Once per Frame

**WRONG:** Call `timer.update()` separately before each animation mixer. The second update measures only the time since the first update.

**CORRECT:**
```js
// Shared standalone frame timer (create once, dispose on teardown).
const timer = new THREE.Timer();
timer.connect(document);
function animate() {
  timer.update();
  const delta = timer.getDelta();
  mixer1.update(delta);
  mixer2.update(delta);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
```

`Timer.getDelta()` is a stable read. It does not advance time like the deprecated `Clock.getDelta()`.
