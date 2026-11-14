import * as THREE from 'three';

// These checks intentionally exercise the r187 contracts on a real GL context.
export function checkReleaseContracts(renderer) {
  const require = (condition, message) => { if (!condition) throw new Error(message); };
  require(THREE.REVISION === '187', 'Release checks require Three.js r187');
  require(typeof WeakRef === 'function' && typeof FinalizationRegistry === 'function', 'Required runtime primitives are missing');
  const gl = renderer.getContext();
  const saved = {
    target: renderer.getRenderTarget(), ratio: renderer.getPixelRatio(),
    viewport: renderer.getViewport(new THREE.Vector4()),
    scissor: renderer.getScissor(new THREE.Vector4()),
    scissorTest: renderer.getScissorTest(),
    clearColor: renderer.getClearColor(new THREE.Color()), clearAlpha: renderer.getClearAlpha(),
  };
  const target = new THREE.WebGLRenderTarget(16, 16);
  let pmrem, environmentTarget, geometry, material;
  try {
    renderer.setPixelRatio(2);
    renderer.setRenderTarget(target);
    renderer.setScissorTest(false);
    renderer.setClearColor(0x0000ff, 1); renderer.clear();
    renderer.setViewport(0, 0, 8, 16);
    renderer.setScissor(0, 0, 8, 16);
    renderer.setScissorTest(true);
    const viewport = Array.from(gl.getParameter(gl.VIEWPORT));
    const scissor = Array.from(gl.getParameter(gl.SCISSOR_BOX));
    require(viewport.join() === '0,0,8,16', 'Target viewport incorrectly multiplied by DPR');
    require(scissor.join() === '0,0,8,16', 'Target scissor incorrectly multiplied by DPR');
    renderer.setClearColor(0xff0000, 1); renderer.clear();
    const left = new Uint8Array(4), right = new Uint8Array(4);
    renderer.readRenderTargetPixels(target, 4, 8, 1, 1, left);
    renderer.readRenderTargetPixels(target, 12, 8, 1, 1, right);
    require(left[0] === 255 && left[2] === 0, 'Scissored target left half should be red');
    require(right[0] === 0 && right[2] === 255, 'Scissored target right half should remain blue');
    renderer.setRenderTarget(null);
    renderer.setViewport(0, 0, 10, 12); renderer.setScissor(0, 0, 10, 12);
    require(Array.from(gl.getParameter(gl.VIEWPORT)).join() === '0,0,20,24', 'Canvas viewport must scale CSS pixels by DPR');
    require(Array.from(gl.getParameter(gl.SCISSOR_BOX)).join() === '0,0,20,24', 'Canvas scissor must scale CSS pixels by DPR');
    renderer.setScissorTest(false);

    // Procedural source: tests PMREM filtering with no network or external HDR asset.
    const source = new THREE.Scene(); source.background = new THREE.Color(0.5, 0.5, 0.5);
    pmrem = new THREE.PMREMGenerator(renderer);
    environmentTarget = pmrem.fromScene(source, 0, 0.1, 10, { size: 256 });
    require(environmentTarget.isWebGLCubeRenderTarget === true, 'r187 PMREM must return a cube render target');
    require(environmentTarget.texture.isCubeTexture === true && environmentTarget.texture.isPMREMTexture === true, 'PMREM must provide a filtered cube texture');
    require(environmentTarget.texture.mapping === THREE.CubeReflectionMapping, 'PMREM should use cube reflection mapping');
    material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 1, roughness: 0.4,
      iridescence: 1, iridescenceThicknessMinimum: 120, iridescenceThicknessMaximum: 380,
    });
    geometry = new THREE.SphereGeometry(1, 16, 8);
    const scene = new THREE.Scene(); scene.environment = environmentTarget.texture;
    const mesh = new THREE.Mesh(geometry, material); scene.add(mesh);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10); camera.position.z = 3;
    renderer.setRenderTarget(target); renderer.setViewport(0, 0, 16, 16);
    renderer.setClearColor(0x000000, 1); renderer.render(scene, camera);
    const reflection = new Uint8Array(4);
    renderer.readRenderTargetPixels(target, 8, 8, 1, 1, reflection);
    require(reflection.slice(0, 3).some(v => v > 0), 'PMREM-lit physical material must render nonblack pixels');
    require(gl.getError() === gl.NO_ERROR, 'GL error during release-contract checks');
    return { revision: THREE.REVISION, targetViewport: viewport, targetScissor: scissor, left: [...left], right: [...right], canvasDpr: 2, pmremCube: true, physicalMaterialPixel: [...reflection] };
  } finally {
    renderer.setRenderTarget(saved.target); renderer.setPixelRatio(saved.ratio);
    renderer.setViewport(saved.viewport); renderer.setScissor(saved.scissor);
    renderer.setScissorTest(saved.scissorTest); renderer.setClearColor(saved.clearColor, saved.clearAlpha);
    target.dispose(); environmentTarget?.dispose(); pmrem?.dispose(); geometry?.dispose(); material?.dispose();
  }
}
