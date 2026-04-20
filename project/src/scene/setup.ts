import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  composer: EffectComposer;
  container: HTMLElement;
  clock: THREE.Clock;
}

export function createScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03060f);
  scene.fog = new THREE.FogExp2(0x03060f, 0.00055);

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 2500);
  camera.position.set(80, 90, 150);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.minDistance = 18;
  controls.maxDistance = 750;
  controls.target.set(0, 5, 0);
  controls.update();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 1.4, 0.55, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  setupLighting(scene);
  buildStarfield(scene);

  const clock = new THREE.Clock();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
  });

  return { scene, camera, renderer, controls, composer, container, clock };
}

function setupLighting(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0x07102a, 1.6));

  const moon = new THREE.DirectionalLight(0x8eaed0, 1.5);
  moon.position.set(130, 200, 90);
  moon.castShadow = true;
  moon.shadow.mapSize.set(4096, 4096);
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 900;
  moon.shadow.camera.left = -320;
  moon.shadow.camera.right = 320;
  moon.shadow.camera.top = 320;
  moon.shadow.camera.bottom = -320;
  moon.shadow.bias = -0.0004;
  scene.add(moon);

  const fill = new THREE.DirectionalLight(0x152850, 0.5);
  fill.position.set(-90, 70, -100);
  scene.add(fill);

  scene.add(new THREE.HemisphereLight(0x0a2050, 0x040b14, 0.9));
}

function buildStarfield(scene: THREE.Scene) {
  const count = 5000;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(1 - Math.random() * 1.3);
    const r = 1000 + Math.random() * 100;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 30;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.7, transparent: true, opacity: 0.88, sizeAttenuation: false,
  })));

  // Bright stars that bloom
  const bpos = new Float32Array(40 * 3);
  for (let i = 0; i < 40; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.45;
    const r = 950;
    bpos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    bpos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 60;
    bpos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const bgeo = new THREE.BufferGeometry();
  bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
  scene.add(new THREE.Points(bgeo, new THREE.PointsMaterial({
    color: 0xaaccff, size: 2.2, transparent: true, opacity: 1.0, sizeAttenuation: false,
  })));
}

export function startRenderLoop(ctx: SceneContext, onFrame: (delta: number, elapsed: number) => void) {
  function animate() {
    requestAnimationFrame(animate);
    const delta = ctx.clock.getDelta();
    const elapsed = ctx.clock.getElapsedTime();
    ctx.controls.update();
    onFrame(delta, elapsed);
    ctx.composer.render();
  }
  animate();
}
