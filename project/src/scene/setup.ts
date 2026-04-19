import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  container: HTMLElement;
}

export function createScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0f1a);
  scene.fog = new THREE.Fog(0x0a0f1a, 200, 600);

  const width = container.clientWidth;
  const height = container.clientHeight;
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(60, 80, 120);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.minDistance = 30;
  controls.maxDistance = 400;
  controls.target.set(0, 0, 0);
  controls.update();

  setupLighting(scene);

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  return { scene, camera, renderer, controls, container };
}

function setupLighting(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0x1a2540, 1.8);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff5e0, 2.2);
  sun.position.set(80, 120, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 500;
  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x4080ff, 0.5);
  fill.position.set(-60, 40, -80);
  scene.add(fill);

  const hemi = new THREE.HemisphereLight(0x1a3050, 0x0d1520, 0.6);
  scene.add(hemi);
}

export function startRenderLoop(ctx: SceneContext, onFrame: (delta: number) => void) {
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    ctx.controls.update();
    onFrame(delta);
    ctx.renderer.render(ctx.scene, ctx.camera);
  }
  animate();
}
