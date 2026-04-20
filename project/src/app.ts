import * as THREE from 'three';
import { createScene, startRenderLoop, type SceneContext } from './scene/setup';
import { buildAirport, updateAirportAnimations, type AirportAnimData } from './scene/airport';
import {
  createAircraftObjects, updateAircraftPositions,
  removeAircraftObjects, addGroundAircraft, addGroundVehicles,
  type AircraftObject,
} from './scene/aircraft';
import { fetchLiveAircraft, getFlights, type LiveAircraft } from './data/flights';
import { fetchWeather } from './data/weather';
import {
  buildPanel, renderFlightList, renderFeaturedFlight,
  onTabChangeHandler, onModeChangeHandler, onFlightSelectHandler,
  getState, setCameraShortcuts,
} from './ui/panel';
import {
  buildHUD, buildHint, buildAircraftBadge, buildTooltip, buildLoadingScreen,
  buildRadar, updateWeather, updateAircraftCount, updateRadar,
  showTooltip, hideTooltip,
} from './ui/hud';

export async function initApp() {
  const appEl = document.getElementById('app')!;

  // Loading screen
  const loadingEl = buildLoadingScreen(appEl);

  // Canvas
  const canvasContainer = document.createElement('div');
  canvasContainer.id = 'canvas-container';
  appEl.appendChild(canvasContainer);

  // UI
  buildPanel(appEl);
  buildHUD(appEl);
  buildHint(appEl);
  buildAircraftBadge(appEl);
  buildTooltip(appEl);
  const radarCanvas = buildRadar(appEl);

  // Three.js scene
  const ctx = createScene(canvasContainer);
  const airportAnim: AirportAnimData = buildAirport(ctx.scene);
  addGroundAircraft(ctx.scene);
  addGroundVehicles(ctx.scene);

  let liveAircraft: LiveAircraft[] = [];
  let aircraftObjects: AircraftObject[] = [];
  let sweepAngle = 0;

  // Initial flight data
  refreshFlightList();

  // Hide loading after brief delay
  setTimeout(() => {
    loadingEl.classList.add('hidden');
    setTimeout(() => loadingEl.remove(), 800);
  }, 2200);

  // Weather
  fetchWeather().then(updateWeather);
  setInterval(() => fetchWeather().then(updateWeather), 5 * 60_000);

  // Live aircraft (15 s interval)
  await loadAircraft(ctx);
  setInterval(() => loadAircraft(ctx), 15_000);

  // Camera shortcuts
  setCameraShortcuts({
    'btn-overview':  () => flyCamera(ctx,  80, 90, 150,   0, 5, 0),
    'btn-tower':     () => flyCamera(ctx,  -45, 55, -15, -62, 42, -28),
    'btn-runway':    () => flyCamera(ctx,   25, 50, 130,  25,  0,  0),
    'btn-terminal':  () => flyCamera(ctx,  -27, 35,  45, -27,  5,  0),
    'btn-approach':  () => flyCamera(ctx,   25, 18, 220,  25,  0, 130),
  });

  // Event handlers
  onTabChangeHandler(tab => {
    if (tab === 'view') flyCamera(ctx, 80, 90, 150, 0, 5, 0);
  });
  onModeChangeHandler(mode => {
    const flights = getFlights(mode);
    renderFlightList(flights);
    if (flights.length) renderFeaturedFlight(flights[0]);
  });
  onFlightSelectHandler(f => {
    if (f.type === 'departure') flyCamera(ctx, -20, 50, 65, -27, 5, 0);
    else flyCamera(ctx, 25, 50, 130, 25, 0, 50);
  });

  // Mouse interaction
  setupMouseInteraction(ctx);

  // Render loop
  startRenderLoop(ctx, (delta, elapsed) => {
    updateAirportAnimations(airportAnim, elapsed);
    updateAircraftPositions(aircraftObjects, delta);
    // Radar sweep (1 rotation per 4 seconds)
    sweepAngle = (elapsed * Math.PI / 2) % (Math.PI * 2);
    updateRadar(radarCanvas, liveAircraft, sweepAngle);
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function refreshFlightList() {
    const { mode } = getState();
    const flights = getFlights(mode);
    renderFlightList(flights);
    if (flights.length) renderFeaturedFlight(flights[0]);
  }

  async function loadAircraft(sceneCtx: SceneContext) {
    try {
      const aircraft = await fetchLiveAircraft();
      liveAircraft = aircraft;
      updateAircraftCount(aircraft.length);
      removeAircraftObjects(aircraftObjects, sceneCtx.scene);
      aircraftObjects = createAircraftObjects(aircraft, sceneCtx.scene);
    } catch {
      updateAircraftCount(0);
    }
  }

  function setupMouseInteraction(sceneCtx: SceneContext) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvas = sceneCtx.renderer.domElement;

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, sceneCtx.camera);

      const meshes: THREE.Object3D[] = [];
      aircraftObjects.forEach(o => o.group.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c); }));
      const hits = raycaster.intersectObjects(meshes);

      if (hits.length) {
        let parent: THREE.Object3D | null = hits[0].object;
        while (parent && !(parent as THREE.Group).isGroup) parent = parent.parent;
        const ac = aircraftObjects.find(o => o.group === parent);
        if (ac) {
          const altFt  = Math.round(ac.data.altitude * 3.28084);
          const spdKts = Math.round(ac.data.velocity * 1.94384);
          showTooltip(
            e.clientX, e.clientY,
            ac.data.callsign || ac.data.icao24.toUpperCase(),
            `Alt: ${altFt.toLocaleString()} ft<br>Speed: ${spdKts} kts<br>` +
            `Hdg: ${Math.round(ac.data.heading)}°<br>` +
            `${ac.data.onGround ? 'On ground' : ac.data.originCountry}`,
          );
          canvas.style.cursor = 'pointer';
          return;
        }
      }
      hideTooltip();
      canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mouseleave', hideTooltip);

    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, sceneCtx.camera);

      const meshes: THREE.Object3D[] = [];
      aircraftObjects.forEach(o => o.group.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c); }));
      const hits = raycaster.intersectObjects(meshes);
      if (!hits.length) return;

      let parent: THREE.Object3D | null = hits[0].object;
      while (parent && !(parent as THREE.Group).isGroup) parent = parent.parent;
      const ac = aircraftObjects.find(o => o.group === parent);
      if (ac) flyToAircraft(sceneCtx, ac);
    });
  }

  function flyToAircraft(sceneCtx: SceneContext, ac: AircraftObject) {
    const tx = ac.worldX, ty = ac.group.position.y, tz = ac.worldZ;
    flyCamera(sceneCtx, tx + 20, ty + 22, tz + 30, tx, ty, tz);
  }

  function flyCamera(
    sceneCtx: SceneContext,
    cx: number, cy: number, cz: number,
    tx: number, ty: number, tz: number,
  ) {
    const startPos = sceneCtx.camera.position.clone();
    const startTgt = sceneCtx.controls.target.clone();
    const endPos   = new THREE.Vector3(cx, cy, cz);
    const endTgt   = new THREE.Vector3(tx, ty, tz);
    let t = 0;
    const dur = 1.4; // seconds
    const tick = () => {
      t += 0.016 / dur;
      if (t >= 1) { t = 1; }
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      sceneCtx.camera.position.lerpVectors(startPos, endPos, e);
      sceneCtx.controls.target.lerpVectors(startTgt, endTgt, e);
      sceneCtx.controls.update();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
