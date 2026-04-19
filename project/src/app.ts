import * as THREE from 'three';
import { createScene, startRenderLoop, type SceneContext } from './scene/setup';
import { buildAirport } from './scene/airport';
import {
  createAircraftObjects,
  updateAircraftPositions,
  addGroundAircraft,
  addGroundVehicles,
  type AircraftObject,
} from './scene/aircraft';
import { fetchLiveAircraft, getFlights } from './data/flights';
import { fetchWeather } from './data/weather';
import {
  buildPanel,
  renderFlightList,
  renderFeaturedFlight,
  onTabChangeHandler,
  onModeChangeHandler,
  onFlightSelectHandler,
  getState,
} from './ui/panel';
import {
  buildHUD,
  buildHint,
  buildAircraftBadge,
  buildTooltip,
  buildLoadingScreen,
  updateWeather,
  updateAircraftCount,
  showTooltip,
  hideTooltip,
} from './ui/hud';

export async function initApp() {
  const appEl = document.getElementById('app')!;

  const loadingEl = buildLoadingScreen(appEl);

  const canvasContainer = document.createElement('div');
  canvasContainer.id = 'canvas-container';
  appEl.appendChild(canvasContainer);

  buildPanel(appEl);
  buildHUD(appEl);
  buildHint(appEl);
  buildAircraftBadge(appEl);
  buildTooltip(appEl);

  const ctx = createScene(canvasContainer);

  buildAirport(ctx.scene);
  addGroundAircraft(ctx.scene);
  addGroundVehicles(ctx.scene);

  let liveAircraftObjects: AircraftObject[] = [];

  loadInitialFlights();

  setTimeout(() => {
    loadingEl.classList.add('hidden');
    setTimeout(() => loadingEl.remove(), 700);
  }, 1800);

  fetchWeather().then(w => updateWeather(w));
  setInterval(() => fetchWeather().then(w => updateWeather(w)), 5 * 60 * 1000);

  loadLiveAircraft(ctx);
  setInterval(() => loadLiveAircraft(ctx), 15 * 1000);

  setupMouseInteraction(ctx);

  onTabChangeHandler((tab) => {
    if (tab === 'view') {
      ctx.camera.position.set(60, 80, 120);
      ctx.controls.target.set(0, 0, 0);
    }
  });

  onModeChangeHandler((mode) => {
    const flights = getFlights(mode);
    renderFlightList(flights);
    if (flights.length > 0) renderFeaturedFlight(flights[0]);
  });

  onFlightSelectHandler((f) => {
    if (f.type === 'departure') {
      ctx.camera.position.set(20, 50, 60);
      ctx.controls.target.set(10, 0, 10);
    }
  });

  startRenderLoop(ctx, (delta) => {
    updateAircraftPositions(liveAircraftObjects, delta);
  });

  function loadInitialFlights() {
    const state = getState();
    const flights = getFlights(state.mode);
    renderFlightList(flights);
    if (flights.length > 0) {
      renderFeaturedFlight(flights[0]);
    }
  }

  async function loadLiveAircraft(sceneCtx: SceneContext) {
    try {
      const aircraft = await fetchLiveAircraft();
      updateAircraftCount(aircraft.length);

      liveAircraftObjects.forEach(o => sceneCtx.scene.remove(o.group));
      liveAircraftObjects = createAircraftObjects(aircraft, sceneCtx.scene);
    } catch {
      updateAircraftCount(0);
    }
  }

  function setupMouseInteraction(sceneCtx: SceneContext) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvas = sceneCtx.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, sceneCtx.camera);

      const meshes: THREE.Object3D[] = [];
      liveAircraftObjects.forEach(o => o.group.traverse(c => {
        if ((c as THREE.Mesh).isMesh) meshes.push(c);
      }));

      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0) {
        let parent: THREE.Object3D | null = hits[0].object;
        while (parent && !(parent as THREE.Group).isGroup) {
          parent = parent.parent;
        }
        if (parent) {
          const ac = liveAircraftObjects.find(o => o.group === parent);
          if (ac) {
            const altFt = Math.round(ac.data.altitude * 3.28084);
            const speedKt = Math.round(ac.data.velocity * 1.94384);
            showTooltip(
              e.clientX,
              e.clientY,
              ac.data.callsign || ac.data.icao24.toUpperCase(),
              `Alt: ${altFt.toLocaleString()} ft<br>Speed: ${speedKt} kts<br>Heading: ${Math.round(ac.data.heading)}°<br>Country: ${ac.data.originCountry}`
            );
            canvas.style.cursor = 'pointer';
            return;
          }
        }
      }

      hideTooltip();
      canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mouseleave', () => {
      hideTooltip();
    });
  }
}
