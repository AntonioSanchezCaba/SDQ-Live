import * as THREE from 'three';

// ─── Shared materials ───────────────────────────────────────────────────────
const M = {
  grass:       new THREE.MeshLambertMaterial({ color: 0x0b1a0e }),
  runway:      new THREE.MeshLambertMaterial({ color: 0x141b26 }),
  taxiway:     new THREE.MeshLambertMaterial({ color: 0x1a2232 }),
  apron:       new THREE.MeshLambertMaterial({ color: 0x1e2a3a }),
  concrete:    new THREE.MeshLambertMaterial({ color: 0x28303e }),
  asphalt:     new THREE.MeshLambertMaterial({ color: 0x131820 }),
  road:        new THREE.MeshLambertMaterial({ color: 0x0e1218 }),
  building:    new THREE.MeshLambertMaterial({ color: 0xc8d4e4 }),
  buildDark:   new THREE.MeshLambertMaterial({ color: 0x9aaabb }),
  buildMid:    new THREE.MeshLambertMaterial({ color: 0xb0bece }),
  roof:        new THREE.MeshLambertMaterial({ color: 0x7888a0 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x4888b0, transparent: true, opacity: 0.78,
    emissive: 0x1a3c60, emissiveIntensity: 0.6,
  }),
  glassLit: new THREE.MeshStandardMaterial({
    color: 0x80b0d0, transparent: true, opacity: 0.82,
    emissive: 0x4090c0, emissiveIntensity: 1.2,
  }),
  winLit: new THREE.MeshStandardMaterial({
    color: 0xffe8a0, emissive: 0xffc840, emissiveIntensity: 1.8,
  }),
  towerGlass: new THREE.MeshStandardMaterial({
    color: 0x40a0c0, transparent: true, opacity: 0.85,
    emissive: 0x204860, emissiveIntensity: 0.7,
  }),
  jetbridge:   new THREE.MeshLambertMaterial({ color: 0x7888a0 }),
  yellow:      new THREE.MeshLambertMaterial({ color: 0xe8c020 }),
  white:       new THREE.MeshLambertMaterial({ color: 0xd8e0f0 }),
  tree:        new THREE.MeshLambertMaterial({ color: 0x1a3c1c }),
  treeTrk:     new THREE.MeshLambertMaterial({ color: 0x332418 }),
  fence: new THREE.MeshLambertMaterial({ color: 0x283040, transparent: true, opacity: 0.55 }),
  parking:     new THREE.MeshLambertMaterial({ color: 0x181e2a }),
  // Lights — MeshBasicMaterial so they ignore scene lighting and bloom brightly
  lWhite: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  lAmber: new THREE.MeshBasicMaterial({ color: 0xff9020 }),
  lRed:   new THREE.MeshBasicMaterial({ color: 0xff2010 }),
  lBlue:  new THREE.MeshBasicMaterial({ color: 0x3070ff }),
  lGreen: new THREE.MeshBasicMaterial({ color: 0x20ff60 }),
  lTeal:  new THREE.MeshBasicMaterial({ color: 0x00e8c0 }),
};

// ─── Primitive helpers ──────────────────────────────────────────────────────
function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function cyl(rt: number, rb: number, h: number, s: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}

// ─── Animation data returned to app.ts ──────────────────────────────────────
export interface AirportAnimData {
  oceanMat: THREE.ShaderMaterial;
  beacon: THREE.Mesh;
  beaconAlt: THREE.Mesh;
  approachStrobes: THREE.Mesh[];
  runwayCenterLights: THREE.Mesh[];
}

export function updateAirportAnimations(d: AirportAnimData, t: number) {
  d.oceanMat.uniforms['u_time'].value = t;
  // Tower rotating beacon (green+white, ~26 rpm ≈ period 2.3 s)
  const bp = (t % 2.3) / 2.3;
  d.beacon.visible    = bp < 0.12 || (bp > 0.5 && bp < 0.62);
  d.beaconAlt.visible = bp > 0.25 && bp < 0.37;
  // Approach strobe lights sequencing
  for (let i = 0; i < d.approachStrobes.length; i++) {
    const phase = (t * 2.0 - i * 0.18) % 1.0;
    d.approachStrobes[i].visible = phase < 0.06;
  }
  // Runway centerline slow pulse
  const cp = Math.sin(t * 1.2) * 0.5 + 0.5;
  for (const l of d.runwayCenterLights) {
    (l.material as THREE.MeshBasicMaterial).opacity = 0.4 + cp * 0.6;
  }
}

// ─── Main entry point ────────────────────────────────────────────────────────
export function buildAirport(scene: THREE.Scene): AirportAnimData {
  const animData: AirportAnimData = {
    oceanMat: null!,
    beacon: null!,
    beaconAlt: null!,
    approachStrobes: [],
    runwayCenterLights: [],
  };

  buildGround(scene);
  buildOcean(scene, animData);
  buildRunways(scene);
  buildRunwayMarkings(scene);
  buildRunwayLights(scene, animData);
  buildTaxiways(scene);
  buildAprons(scene);
  buildTerminal(scene);
  buildControlTower(scene, animData);
  buildJetbridges(scene);
  buildCargoArea(scene);
  buildServiceArea(scene);
  buildFuelDepot(scene);
  buildHangars(scene);
  buildRoads(scene);
  buildParkingLot(scene);
  buildTrees(scene);
  buildPerimeterFence(scene);
  buildApronLighting(scene);

  return animData;
}

// ─── Ground ──────────────────────────────────────────────────────────────────
function buildGround(scene: THREE.Scene) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(1200, 900), M.grass);
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);

  const t = new THREE.Mesh(new THREE.PlaneGeometry(700, 600), new THREE.MeshLambertMaterial({ color: 0x18202e }));
  t.rotation.x = -Math.PI / 2; t.position.y = 0.02; scene.add(t);
}

// ─── Caribbean Sea (animated with ShaderMaterial) ────────────────────────────
function buildOcean(scene: THREE.Scene, anim: AirportAnimData) {
  const geo = new THREE.PlaneGeometry(1400, 700, 60, 30);
  const mat = new THREE.ShaderMaterial({
    uniforms: { u_time: { value: 0 } },
    vertexShader: `
      uniform float u_time;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.z += sin(p.x * 0.04 + u_time * 0.9) * 1.6
             + cos(p.y * 0.03 - u_time * 0.7) * 1.1
             + sin(p.x * 0.08 - p.y * 0.06 + u_time * 1.2) * 0.6;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float u_time;
      varying vec2 vUv;
      void main() {
        vec3 deep    = vec3(0.008, 0.055, 0.14);
        vec3 shallow = vec3(0.018, 0.11, 0.24);
        vec3 crest   = vec3(0.06,  0.20, 0.38);
        float w1 = sin(vUv.x * 12.0 + u_time * 0.7) * 0.5 + 0.5;
        float w2 = sin(vUv.y * 9.0  - u_time * 0.5) * 0.5 + 0.5;
        float wave = w1 * w2;
        vec3 col = mix(deep, shallow, wave * 0.65);
        col = mix(col, crest, pow(wave, 4.0) * 0.4);
        // Edge fade toward shore
        float shore = smoothstep(0.0, 0.18, vUv.y);
        float alpha = 0.88 * shore;
        gl_FragColor = vec4(col, alpha);
      }`,
    transparent: true,
    side: THREE.DoubleSide,
  });
  anim.oceanMat = mat;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -0.4, 430);
  scene.add(mesh);

  // Shoreline strip
  const shore = box(900, 0.15, 22, new THREE.MeshLambertMaterial({ color: 0x9a8a6a }), 0, 0.07, 195);
  scene.add(shore);
}

// ─── Runways ─────────────────────────────────────────────────────────────────
// SDQ has one main runway: 17/35 running roughly N–S at slight angle.
// We orient it along Z (neg = north / RWY35, pos = south / RWY17).
function buildRunways(scene: THREE.Scene) {
  // Main runway 17/35
  const rw = box(18, 0.09, 310, M.runway, 25, 0.045, -10);
  rw.rotation.y = 0.05; // Slight 3° eastward tilt
  scene.add(rw);

  // Blast-pads (overrun areas)
  scene.add(box(18, 0.05, 20, M.taxiway, 25, 0.025, -167));
  scene.add(box(18, 0.05, 20, M.taxiway, 25, 0.025,  148));

  // Shoulder strips
  scene.add(box(7, 0.06, 308, M.taxiway, 38, 0.03, -10));
  scene.add(box(7, 0.06, 308, M.taxiway, 12, 0.03, -10));
}

function buildRunwayMarkings(scene: THREE.Scene) {
  // Centerline dashes
  for (let i = -12; i <= 12; i++) {
    scene.add(box(1.5, 0.1, 6, M.white, 25, 0.05, i * 24 - 10));
  }
  // Threshold bars RWY35 (north end)
  for (let j = 0; j < 8; j++) {
    scene.add(box(1.6, 0.1, 9, M.white, 15 + j * 2.4, 0.05, -148));
  }
  // Threshold bars RWY17 (south end)
  for (let j = 0; j < 8; j++) {
    scene.add(box(1.6, 0.1, 9, M.white, 15 + j * 2.4, 0.05, 128));
  }
  // Aiming point marks
  for (let j = 0; j < 2; j++) {
    scene.add(box(3, 0.1, 22, M.white, 18 + j * 12, 0.05, -100));
    scene.add(box(3, 0.1, 22, M.white, 18 + j * 12, 0.05,  78));
  }
  // Runway designators (simple blocks representing "17" / "35")
  scene.add(box(10, 0.1, 1.2, M.yellow, 25, 0.05, -138));
  scene.add(box(10, 0.1, 1.2, M.yellow, 25, 0.05,  120));
}

// ─── Runway lights ────────────────────────────────────────────────────────────
function buildRunwayLights(scene: THREE.Scene, anim: AirportAnimData) {
  const lightSize = 0.45;
  // Threshold edge lights (green at approach end, red at departure)
  for (let j = -4; j <= 4; j++) {
    const g1 = cyl(lightSize, lightSize, 0.5, 6, M.lGreen, 16 + j * 2, 0.25, -155);
    const g2 = cyl(lightSize, lightSize, 0.5, 6, M.lGreen, 16 + j * 2, 0.25,  155);
    scene.add(g1); scene.add(g2);
  }
  // Runway edge lights (white)
  for (let i = -12; i <= 12; i++) {
    scene.add(cyl(lightSize, lightSize, 0.5, 6, M.lWhite, 14.5, 0.25, i * 24 - 10));
    scene.add(cyl(lightSize, lightSize, 0.5, 6, M.lWhite, 35.5, 0.25, i * 24 - 10));
  }
  // Centerline lights (white, pulsing — stored for animation)
  for (let i = -10; i <= 10; i++) {
    const cl = cyl(0.3, 0.3, 0.18, 6, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }), 25, 0.09, i * 28 - 10);
    scene.add(cl);
    anim.runwayCenterLights.push(cl);
  }
  // Approach lighting system (ALSF) — south approach
  for (let i = 1; i <= 8; i++) {
    const s = cyl(0.5, 0.5, 0.6, 6, M.lWhite, 25, 0.3, 150 + i * 18);
    s.visible = false;
    scene.add(s);
    anim.approachStrobes.push(s);
  }
  // Touchdown zone lights
  for (let i = 0; i < 3; i++) {
    for (let j = -2; j <= 2; j++) {
      scene.add(cyl(0.3, 0.3, 0.3, 6, M.lWhite, 17 + j * 4.5, 0.15, -125 + i * 20));
      scene.add(cyl(0.3, 0.3, 0.3, 6, M.lWhite, 17 + j * 4.5, 0.15,   90 - i * 20));
    }
  }
  // PAPI lights (4-bar, west of runway, south end)
  const papiColors = [M.lWhite, M.lWhite, M.lRed, M.lRed];
  for (let j = 0; j < 4; j++) {
    scene.add(cyl(0.55, 0.55, 0.4, 6, papiColors[j], 8, 0.2, 90 + j * 3));
  }
}

// ─── Taxiways ─────────────────────────────────────────────────────────────────
function buildTaxiways(scene: THREE.Scene) {
  // Parallel taxiway A (west of runway)
  scene.add(box(10, 0.07, 290, M.taxiway, 5, 0.035, -10));
  // Connector exits
  const exits = [-120, -70, -10, 50, 110];
  for (const z of exits) {
    scene.add(box(25, 0.07, 10, M.taxiway, 15, 0.035, z));
  }
  // Taxiway to terminal apron
  scene.add(box(50, 0.07, 10, M.taxiway, -20, 0.035, 0));
  scene.add(box(10, 0.07, 60, M.taxiway, -35, 0.035, 15));
  scene.add(box(10, 0.07, 60, M.taxiway, -35, 0.035, -25));
  // Cargo taxiway (north)
  scene.add(box(80, 0.07, 10, M.taxiway, -30, 0.035, -90));
  scene.add(box(10, 0.07, 40, M.taxiway, -65, 0.035, -72));

  // Taxiway centerline (yellow)
  for (let i = -12; i <= 12; i++) {
    scene.add(box(0.35, 0.08, 5, M.yellow, 5, 0.04, i * 22 - 10));
  }
  // Taxiway edge lights (blue)
  for (let i = -8; i <= 8; i++) {
    scene.add(cyl(0.28, 0.28, 0.4, 6, M.lBlue, -0.5, 0.2, i * 34 - 10));
    scene.add(cyl(0.28, 0.28, 0.4, 6, M.lBlue, 10.5, 0.2, i * 34 - 10));
  }
  // Hold-short position markings
  for (const z of exits) {
    for (let k = 0; k < 2; k++) {
      scene.add(box(0.5, 0.08, 10, M.yellow, 3 + k * 4, 0.04, z));
    }
  }
}

// ─── Aprons ───────────────────────────────────────────────────────────────────
function buildAprons(scene: THREE.Scene) {
  // Main gate apron
  scene.add(box(105, 0.12, 68, M.apron, -30, 0.06, 5));
  // North apron extension
  scene.add(box(70, 0.12, 40, M.apron, -20, 0.06, -48));
  // Cargo apron
  scene.add(box(65, 0.12, 55, M.apron, -72, 0.06, -60));
  // Remote stand apron
  scene.add(box(55, 0.12, 35, M.apron, 55, 0.06, 45));
  // Aircraft stand dividers
  for (let i = -5; i <= 5; i++) {
    scene.add(box(0.25, 0.13, 32, M.taxiway, i * 12 - 28, 0.065, 5));
  }
}

// ─── Terminal building (SDQ-style elongated hall with concourses) ─────────────
function buildTerminal(scene: THREE.Scene) {
  // Main hall — long, narrow, low building facing airside
  scene.add(box(94, 11, 32, M.building,     -27, 5.5,  -4));
  scene.add(box(96, 1.2, 34, M.roof,        -27, 11.6, -4));   // Flat roof
  scene.add(box(90, 0.4, 33, new THREE.MeshLambertMaterial({ color: 0x6888a0 }), -27, 12.1, -4));

  // Canopy overhang (airside glazing)
  scene.add(box(94, 8, 3.5, M.glass,        -27, 6, 11.5));
  scene.add(box(94, 8, 3.5, M.glassLit,     -27, 6,-20.5));

  // Roof fins (visual detail)
  for (let i = -8; i <= 8; i++) {
    scene.add(box(0.8, 2.5, 9, M.roof, i * 5.5 - 27, 13.0, -4));
  }

  // Illuminated windows — airside row
  for (let i = -10; i <= 10; i++) {
    scene.add(box(3.5, 3.5, 0.3, M.winLit, i * 5.0 - 27, 6.5, 12.4));
  }
  // Landside windows
  for (let i = -10; i <= 10; i++) {
    scene.add(box(3.5, 3.5, 0.3, M.winLit, i * 5.0 - 27, 6.5, -21.4));
  }

  // Concourse A (south pier)
  scene.add(box(16, 8, 60, M.buildMid,      -54, 4,  28));
  scene.add(box(18, 0.9, 62, M.roof,        -54, 8.45, 28));
  scene.add(box(16, 7, 3.5, M.glassLit,     -54, 4,  59));
  // Gates A side windows
  for (let i = 0; i < 6; i++) {
    scene.add(box(2.5, 3, 0.3, M.winLit, -47 - i * 3.5, 5, 59.4));
  }

  // Concourse B (north pier)
  scene.add(box(16, 8, 48, M.buildMid,      -10, 4, -38));
  scene.add(box(18, 0.9, 50, M.roof,        -10, 8.45, -38));
  scene.add(box(16, 7, 3.5, M.glassLit,     -10, 4, -63));

  // Departures upper deck / canopy road
  scene.add(box(94, 0.7, 14, M.concrete,    -27, 5.8, -24));
  scene.add(box(94, 0.4, 12, M.asphalt,     -27, 6.2, -24));

  // Ground-level road/curb
  scene.add(box(94, 0.5, 10, M.asphalt,     -27, 0.25, -34));
  scene.add(box(94, 0.6, 5,  M.concrete,    -27, 0.30, -30));

  // Structural columns
  for (let i = -8; i <= 8; i++) {
    scene.add(box(1.4, 11, 1.4, M.buildDark, i * 5.5 - 27, 5.5, -20.5));
    scene.add(box(1.4, 11, 1.4, M.buildDark, i * 5.5 - 27, 5.5,  11.5));
  }
}

// ─── Control Tower ────────────────────────────────────────────────────────────
function buildControlTower(scene: THREE.Scene, anim: AirportAnimData) {
  const tx = -62, tz = -28;
  // Base
  scene.add(box(7, 4, 7, M.buildDark, tx, 2, tz));
  // Shaft
  scene.add(box(5.5, 32, 5.5, M.buildMid,   tx, 20, tz));
  scene.add(box(5,   32, 5,   M.buildDark,   tx, 20, tz));
  // Equipment floor
  scene.add(box(7.5, 2.5, 7.5, M.building,   tx, 37.25, tz));
  // Cab (glazed)
  scene.add(box(10, 5, 10, M.towerGlass,     tx, 41.5, tz));
  scene.add(box(11, 0.7, 11, M.roof,         tx, 44.35, tz));
  // Antenna mast
  scene.add(cyl(0.18, 0.18, 10, 4, M.buildDark, tx, 50, tz));
  // Obstruction beacon (white + green, stored for animation)
  const bW = cyl(0.5, 0.5, 0.7, 8, M.lWhite, tx, 55.3, tz);
  const bG = cyl(0.5, 0.5, 0.7, 8, M.lGreen, tx, 55.3, tz);
  bW.visible = false; bG.visible = false;
  scene.add(bW); scene.add(bG);
  anim.beacon    = bW;
  anim.beaconAlt = bG;
  // Red obstruction lights on shaft
  scene.add(cyl(0.4, 0.4, 0.5, 8, M.lRed, tx, 29, tz));
  scene.add(cyl(0.4, 0.4, 0.5, 8, M.lRed, tx, 14, tz));
  // Platform
  scene.add(box(9, 0.6, 9, M.concrete, tx, 0.3, tz));
}

// ─── Jet bridges ─────────────────────────────────────────────────────────────
function buildJetbridges(scene: THREE.Scene) {
  const gates = [
    { x: -55, z: -3, r: 0 }, { x: -44, z: -3, r: 0 }, { x: -33, z: -3, r: 0 },
    { x: -22, z: -3, r: 0 }, { x: -11, z: -3, r: 0 }, { x:  0,  z: -3, r: 0 },
    { x:  11, z: -3, r: 0 }, { x: -54, z: 13, r: Math.PI },
    { x: -54, z: 24, r: Math.PI }, { x:  12, z: 13, r: Math.PI },
    { x: -54, z: 42, r: Math.PI/2 }, { x: -54, z: 54, r: Math.PI/2 },
  ];
  for (const g of gates) {
    const arm = box(1.2, 3.5, 14, M.jetbridge, g.x, 4.5, g.z + 7);
    arm.rotation.y = g.r; scene.add(arm);
    const hood = box(4, 3.5, 3, M.jetbridge, g.x, 4.5, g.z + 14);
    hood.rotation.y = g.r; scene.add(hood);
    const support = box(0.7, 7, 0.7, M.buildDark, g.x, 3.5, g.z + 12);
    scene.add(support);
    // Yellow guide stripe
    const stripe = box(0.35, 0.1, 13, M.yellow, g.x, 3.5 + 0.05, g.z + 6.5);
    stripe.rotation.y = g.r; scene.add(stripe);
  }
}

// ─── Cargo Area ───────────────────────────────────────────────────────────────
function buildCargoArea(scene: THREE.Scene) {
  // Main cargo warehouse
  scene.add(box(52, 14, 32, M.buildDark,   -75, 7, -58));
  scene.add(box(54, 1.2, 34, M.roof,       -75, 14.6, -58));
  // Cargo building 2
  scene.add(box(38, 11, 26, M.building,    -74, 5.5, -95));
  scene.add(box(40, 0.9, 28, M.roof,       -74, 11.45, -95));
  // Loading doors
  for (let i = 0; i < 7; i++) {
    scene.add(box(6.2, 10, 0.6, M.asphalt, -91 + i * 7.4, 5, -43));
  }
  // Cargo service building
  scene.add(box(18, 8, 14, M.building,     -88, 4, -30));
  scene.add(box(20, 0.7, 16, M.roof,       -88, 8.35, -30));
}

// ─── Maintenance & Service Area ──────────────────────────────────────────────
function buildServiceArea(scene: THREE.Scene) {
  scene.add(box(35, 10, 22, M.buildDark,  68, 5, -5));
  scene.add(box(37, 0.8, 24, M.roof,      68, 10.4, -5));
  scene.add(box(18, 8, 14, M.building,    80, 4, -32));
  scene.add(box(20, 0.6, 16, M.roof,      80, 8.3, -32));
  // Fire station
  scene.add(box(20, 7, 16, new THREE.MeshLambertMaterial({ color: 0xb83020 }), 68, 3.5, 32));
  scene.add(box(22, 0.7, 18, M.roof, 68, 7.35, 32));
  // Emergency vehicle lights
  scene.add(cyl(0.5, 0.5, 0.5, 8, M.lRed,  64, 7.7, 32));
  scene.add(cyl(0.5, 0.5, 0.5, 8, new THREE.MeshBasicMaterial({ color: 0x2060ff }), 72, 7.7, 32));
}

// ─── Fuel Depot ───────────────────────────────────────────────────────────────
function buildFuelDepot(scene: THREE.Scene) {
  for (let i = 0; i < 4; i++) {
    const tank = cyl(3, 3, 4, 16, new THREE.MeshLambertMaterial({ color: 0xa0a8b8 }), 62, 2, -55 + i * 9);
    scene.add(tank);
    scene.add(cyl(2.8, 3, 0.6, 16, M.buildDark, 62, 4.3, -55 + i * 9));
    // Tank safety ring
    scene.add(cyl(3.8, 3.8, 0.4, 16, new THREE.MeshLambertMaterial({ color: 0x707888, transparent: true, opacity: 0.6 }), 62, 0.2, -55 + i * 9));
  }
  scene.add(box(10, 5, 8, M.building,  66, 2.5, -35));
  scene.add(box(12, 0.6, 10, M.roof,  66, 5.3, -35));
  scene.add(cyl(0.4, 0.4, 0.5, 8, M.lAmber, 64, 5.6, -35));
  scene.add(cyl(0.4, 0.4, 0.5, 8, M.lAmber, 68, 5.6, -35));
}

// ─── Maintenance Hangars ──────────────────────────────────────────────────────
function buildHangars(scene: THREE.Scene) {
  // Large maintenance hangar
  scene.add(box(58, 16, 38, M.buildDark,  55, 8, -55));
  scene.add(box(60, 1.5, 40, M.roof,      55, 16.75, -55));
  // Hangar doors
  for (let i = 0; i < 4; i++) {
    scene.add(box(12.5, 14, 0.7, M.asphalt, 32 + i * 13, 7, -37));
  }
  // Small hangar
  scene.add(box(30, 11, 22, M.building,   52, 5.5, -90));
  scene.add(box(32, 0.9, 24, M.roof,      52, 11.45, -90));
}

// ─── Roads ───────────────────────────────────────────────────────────────────
function buildRoads(scene: THREE.Scene) {
  // Main airport access road
  scene.add(box(200, 0.22, 12, M.road, -20, 0.11, -58));
  // Loop road around terminal
  scene.add(box(12, 0.22, 80, M.road, -78, 0.11, -4));
  scene.add(box(12, 0.22, 80, M.road,  32, 0.11, -4));
  scene.add(box(100, 0.22, 12, M.road, -23, 0.11, -38));
  scene.add(box(100, 0.22, 12, M.road, -23, 0.11,  30));
  // Road markings
  for (let i = -7; i <= 7; i++) {
    scene.add(box(5, 0.23, 0.5, M.white, i * 16 - 20, 0.115, -58));
  }
  // Pedestrian crossings
  for (let j = 0; j < 8; j++) {
    scene.add(box(12, 0.23, 1, M.white, -27, 0.115, -33 + j * 2.5));
  }
}

// ─── Parking Lot & Structure ─────────────────────────────────────────────────
function buildParkingLot(scene: THREE.Scene) {
  scene.add(box(70, 0.18, 65, M.parking, 80, 0.09, 28));
  // Multi-level garage
  scene.add(box(36, 18, 22, M.buildDark, 98, 9, -18));
  scene.add(box(38, 0.9, 24, M.roof,     98, 18.45, -18));
  for (let i = 0; i < 5; i++) {
    scene.add(box(36, 0.6, 22, M.concrete, 98, 3.0 + i * 3.5, -18));
  }
  // Parking rows
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      scene.add(box(3.5, 0.18, 5.5, M.parking, 58 + col * 3.8, 0.09, 12 + row * 15));
      scene.add(box(0.18, 0.2, 5.5, M.road,    61.7 + col * 3.8, 0.1, 12 + row * 15));
    }
  }
}

// ─── Trees ───────────────────────────────────────────────────────────────────
function buildTrees(scene: THREE.Scene) {
  const spots = [
    [-95,-70],[-100,-80],[-88,-75],[-105,-65],
    [-95, 65],[-88, 72],[-100, 68],
    [ 95,-70],[100,-80],[ 88,-75],
    [ 95, 70],[100, 78],[ 90, 65],
    [ 20,-110],[28,-115],[12,-108],
    [-30,110],[-20,118],[-38,105],
    [120, 10],[125,-5],[118, 22],
    [-118, 10],[-122,-8],[-116, 25],
    [ 45,105],[52, 112],[38, 108],
    [-45,105],[-38,110],[-52, 98],
  ];
  for (const [x, z] of spots) {
    const h = 5.5 + Math.random() * 5;
    scene.add(cyl(0.4, 0.55, h * 0.35, 6, M.treeTrk, x, h * 0.175, z));
    scene.add(cyl(3.2, 0.4, h * 0.65, 8, M.tree, x, h * 0.6, z));
    scene.add(cyl(2.2, 0.6, h * 0.45, 8, M.tree, x, h * 0.78, z));
    scene.add(cyl(1.3, 0.8, h * 0.28, 8, M.tree, x, h * 0.92, z));
  }
}

// ─── Perimeter Fence ─────────────────────────────────────────────────────────
function buildPerimeterFence(scene: THREE.Scene) {
  const segs = [
    { w: 380, d: 0.8, x:  0, z: 140 },
    { w: 380, d: 0.8, x:  0, z:-135 },
    { w: 0.8, d: 278, x: 175, z:  2 },
    { w: 0.8, d: 278, x:-175, z:  2 },
  ];
  for (const s of segs) {
    scene.add(box(s.w, 2.8, s.d, M.fence, s.x, 1.4, s.z));
    // Fence posts
    const len = Math.max(s.w, s.d);
    const isWide = s.w > s.d;
    for (let i = -Math.floor(len / 16); i <= Math.floor(len / 16); i++) {
      const px = isWide ? s.x + i * 16 : s.x;
      const pz = isWide ? s.z : s.z + i * 16;
      scene.add(cyl(0.18, 0.18, 3.2, 4, M.buildDark, px, 1.6, pz));
    }
  }
}

// ─── Apron flood lighting ─────────────────────────────────────────────────────
function buildApronLighting(scene: THREE.Scene) {
  const poles = [
    [-60, 20], [-45, 20], [-15, 20], [0, 20],
    [-60,-40], [-45,-40], [-15,-40], [0,-40],
    [-30, 62], [10, 62],
    [65, -8], [65, 20],
  ];
  for (const [x, z] of poles) {
    scene.add(cyl(0.35, 0.45, 16, 6, M.buildDark, x, 8, z));
    // Light head
    scene.add(box(2.5, 0.7, 0.7, M.lAmber, x, 16.3, z));
    // Point light (subtle warm glow)
    const pt = new THREE.PointLight(0xffa060, 0.8, 45);
    pt.position.set(x, 16, z);
    scene.add(pt);
  }
  // Terminal facade uplighting
  for (let i = -8; i <= 8; i++) {
    const up = new THREE.PointLight(0x6090d0, 0.3, 20);
    up.position.set(i * 5.5 - 27, 0.5, -19);
    scene.add(up);
  }
}
