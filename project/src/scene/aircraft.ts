import * as THREE from 'three';
import type { LiveAircraft } from '../data/flights';

export interface AircraftObject {
  group: THREE.Group;
  trail: THREE.Line;
  trailPositions: THREE.Vector3[];
  data: LiveAircraft;
  worldX: number;
  worldZ: number;
}

const SDQ_LAT = 18.4297;
const SDQ_LON = -69.6689;
const SCALE = 80;
const TRAIL_LEN = 35;

// ─── Materials ───────────────────────────────────────────────────────────────
const MAT_FUSELAGE  = new THREE.MeshStandardMaterial({ color: 0xeef2f8, roughness: 0.35, metalness: 0.2 });
const MAT_WING      = new THREE.MeshStandardMaterial({ color: 0xe8ecf4, roughness: 0.4, metalness: 0.15 });
const MAT_ENGINE    = new THREE.MeshStandardMaterial({ color: 0xc0c8d4, roughness: 0.5, metalness: 0.3 });
const MAT_INTAKE    = new THREE.MeshStandardMaterial({ color: 0x1a1e28, roughness: 0.6 });
const MAT_COCKPIT   = new THREE.MeshStandardMaterial({ color: 0x3a60a0, roughness: 0.3, metalness: 0.1 });
const MAT_WINDOW    = new THREE.MeshStandardMaterial({ color: 0x5088c0, transparent: true, opacity: 0.9, roughness: 0.1 });
const MAT_GEAR      = new THREE.MeshStandardMaterial({ color: 0x282830, roughness: 0.7 });
const MAT_NAV_RED   = new THREE.MeshBasicMaterial({ color: 0xff1010 });  // port light
const MAT_NAV_GREEN = new THREE.MeshBasicMaterial({ color: 0x10ff50 });  // starboard light
const MAT_STROBE    = new THREE.MeshBasicMaterial({ color: 0xffffff });  // belly/tail strobe

// ─── Helpers ─────────────────────────────────────────────────────────────────
function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; return m;
}
function cyl(rt: number, rb: number, h: number, s: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat);
  m.position.set(x, y, z); m.castShadow = true; return m;
}

// ─── Aircraft mesh ────────────────────────────────────────────────────────────
function buildAircraftMesh(): THREE.Group {
  const g = new THREE.Group();

  // Fuselage
  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 8.2, 14), MAT_FUSELAGE);
  fuse.rotation.z = Math.PI / 2; fuse.castShadow = true; g.add(fuse);

  // Nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 14), MAT_COCKPIT);
  nose.rotation.z = -Math.PI / 2; nose.position.x = 5.1; nose.castShadow = true; g.add(nose);

  // Cockpit window
  const cwin = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 8), MAT_WINDOW);
  cwin.rotation.z = -Math.PI / 2; cwin.position.set(5.9, 0.18, 0); g.add(cwin);

  // Tail cone
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.56, 2.4, 12), MAT_FUSELAGE);
  tail.rotation.z = Math.PI / 2; tail.position.x = -4.9; tail.castShadow = true; g.add(tail);

  // Wings (using extruded shape)
  const wShape = new THREE.Shape();
  wShape.moveTo(0, 0); wShape.lineTo(0.7, 5.5);
  wShape.quadraticCurveTo(-0.8, 5.8, -1.9, 5.2);
  wShape.lineTo(-3.2, 0); wShape.closePath();
  const wGeo = new THREE.ShapeGeometry(wShape);
  const wL = new THREE.Mesh(wGeo, MAT_WING);
  wL.rotation.x = -Math.PI / 2; wL.castShadow = true; g.add(wL);
  const wR = wL.clone(); wR.rotation.x = Math.PI / 2; g.add(wR);

  // Winglets
  const wlet = box(0.18, 1.7, 0.35, MAT_WING, 0.4, 0.4, -5.8);
  g.add(wlet); const wletR = wlet.clone(); wletR.position.z = 5.8; g.add(wletR);

  // Horizontal stabiliser
  const hShape = new THREE.Shape();
  hShape.moveTo(0, 0); hShape.lineTo(-0.3, 2.4);
  hShape.quadraticCurveTo(-1.0, 2.4, -1.5, 1.8);
  hShape.lineTo(-2.0, 0); hShape.closePath();
  const hGeo = new THREE.ShapeGeometry(hShape);
  const hL = new THREE.Mesh(hGeo, MAT_WING);
  hL.rotation.x = -Math.PI / 2; hL.position.set(-3.9, 0.2, 0); g.add(hL);
  const hR = hL.clone(); hR.rotation.x = Math.PI / 2; hR.position.set(-3.9, 0.2, 0); g.add(hR);

  // Vertical stabiliser
  const vShape = new THREE.Shape();
  vShape.moveTo(0, 0); vShape.lineTo(0, 3.2);
  vShape.quadraticCurveTo(-1.3, 3.4, -2.0, 2.4);
  vShape.lineTo(-2.5, 0); vShape.closePath();
  const vGeo = new THREE.ShapeGeometry(vShape);
  const vTail = new THREE.Mesh(vGeo, MAT_WING);
  vTail.rotation.y = -Math.PI / 2; vTail.position.set(-4.0, 0.8, 0); g.add(vTail);

  // Engines (×2)
  for (const side of [-1, 1]) {
    const pylon = box(0.65, 1.3, 1.9, MAT_ENGINE, 0.9, -0.25, side * 2.9);
    g.add(pylon);
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 2.9, 12), MAT_ENGINE);
    nacelle.rotation.z = Math.PI / 2; nacelle.position.set(0.55, -0.58, side * 2.9); nacelle.castShadow = true; g.add(nacelle);
    const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.45, 12), MAT_INTAKE);
    intake.rotation.z = Math.PI / 2; intake.position.set(1.92, -0.58, side * 2.9); g.add(intake);
    // Landing gear
    const gear = box(0.3, 0.9, 0.42, MAT_GEAR, -0.4, -1.3, side * 1.6);
    g.add(gear);
  }
  const noseGear = box(0.28, 1.05, 0.38, MAT_GEAR, 4.6, -1.35, 0); g.add(noseGear);

  // Cabin windows
  for (let i = 0; i < 7; i++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.36), MAT_WINDOW);
    w.position.set(1.6 + i * 0.95 - 2.5, 0.55, 0.74); w.rotation.y = -Math.PI / 2; g.add(w);
    const w2 = w.clone(); w2.position.z = -0.74; w2.rotation.y = Math.PI / 2; g.add(w2);
  }

  // Navigation lights — port (red), starboard (green), belly strobe
  const navL = cyl(0.25, 0.25, 0.3, 8, MAT_NAV_RED,   0.4, -0.05, -5.9);
  const navR = cyl(0.25, 0.25, 0.3, 8, MAT_NAV_GREEN,  0.4, -0.05,  5.9);
  const strobe = cyl(0.3, 0.3, 0.35, 8, MAT_STROBE, 0, -0.72, 0);
  g.add(navL); g.add(navR); g.add(strobe);

  g.scale.setScalar(0.92);
  return g;
}

// ─── Trail builder ────────────────────────────────────────────────────────────
function buildTrail(scene: THREE.Scene): THREE.Line {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(TRAIL_LEN * 3);
  const colors    = new Float32Array(TRAIL_LEN * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  scene.add(line);
  return line;
}

function updateTrail(obj: AircraftObject) {
  const pos = obj.group.position.clone();
  obj.trailPositions.push(pos);
  if (obj.trailPositions.length > TRAIL_LEN) obj.trailPositions.shift();

  const n = obj.trailPositions.length;
  const geo = obj.trail.geometry;
  const posArr = geo.attributes['position'].array as Float32Array;
  const colArr = geo.attributes['color'].array as Float32Array;

  for (let i = 0; i < TRAIL_LEN; i++) {
    if (i < n) {
      const p = obj.trailPositions[i];
      posArr[i * 3]     = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;
      const t = i / (n - 1);
      colArr[i * 3]     = t * 0.0;
      colArr[i * 3 + 1] = t * 0.88;
      colArr[i * 3 + 2] = t * 0.72;
    } else {
      posArr[i * 3] = posArr[i * 3 + 1] = posArr[i * 3 + 2] = 0;
      colArr[i * 3] = colArr[i * 3 + 1] = colArr[i * 3 + 2] = 0;
    }
  }
  geo.attributes['position'].needsUpdate = true;
  geo.attributes['color'].needsUpdate    = true;
}

// ─── Coordinate conversion ────────────────────────────────────────────────────
function latLonToWorld(lat: number, lon: number): { x: number; z: number } {
  const dlat = lat - SDQ_LAT;
  const dlon = lon - SDQ_LON;
  return {
    x: dlon * SCALE * Math.cos(SDQ_LAT * Math.PI / 180),
    z: -dlat * SCALE,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function createAircraftObjects(list: LiveAircraft[], scene: THREE.Scene): AircraftObject[] {
  const objs: AircraftObject[] = [];
  const limit = Math.min(list.length, 30);
  for (let i = 0; i < limit; i++) {
    const ac = list[i];
    const group = buildAircraftMesh();
    const { x, z } = latLonToWorld(ac.lat, ac.lon);
    const altY = ac.onGround ? 0.3 : Math.min(ac.altitude / 9500, 1) * 15 + 0.8;
    group.position.set(x, altY, z);
    group.rotation.y = ((270 - ac.heading) * Math.PI) / 180;
    const dist = Math.sqrt(x * x + z * z);
    group.scale.setScalar(ac.onGround ? 0.72 : Math.max(0.9, Math.min(2.4, dist / 22)));
    scene.add(group);

    const trail = buildTrail(scene);
    objs.push({ group, trail, trailPositions: [], data: ac, worldX: x, worldZ: z });
  }
  return objs;
}

export function updateAircraftPositions(objects: AircraftObject[], delta: number) {
  for (const obj of objects) {
    if (!obj.data.onGround) {
      const spd = (obj.data.velocity / 180) * delta * 0.5;
      const hr = (obj.data.heading * Math.PI) / 180;
      obj.worldX += Math.sin(hr) * spd;
      obj.worldZ -= Math.cos(hr) * spd;
      obj.group.position.x += (obj.worldX - obj.group.position.x) * 0.07;
      obj.group.position.z += (obj.worldZ - obj.group.position.z) * 0.07;
      const roll = Math.sin(obj.data.heading * Math.PI / 180) * 0.07;
      obj.group.rotation.z += (roll - obj.group.rotation.z) * 0.12;
    }
    obj.group.rotation.y = ((270 - obj.data.heading) * Math.PI) / 180;
    updateTrail(obj);
  }
}

export function removeAircraftObjects(objects: AircraftObject[], scene: THREE.Scene) {
  for (const obj of objects) {
    scene.remove(obj.group);
    scene.remove(obj.trail);
    obj.trail.geometry.dispose();
  }
}

export function addGroundAircraft(scene: THREE.Scene): THREE.Group[] {
  const positions = [
    { x: -55, z: -3, h: 0 }, { x: -44, z: -3, h: 0 }, { x: -33, z: -3, h: 0 },
    { x: -22, z: -3, h: 0 }, { x: -11, z: -3, h: 0 }, { x:   0, z: -3, h: 0 },
    { x:  11, z: -3, h: 0 }, { x: -54, z: 13, h: Math.PI },
    { x: -54, z: 24, h: Math.PI }, { x: -30, z: 62, h: Math.PI },
  ];
  return positions.map(p => {
    const g = buildAircraftMesh();
    g.position.set(p.x, 0.3, p.z); g.rotation.y = p.h; g.scale.setScalar(0.82);
    scene.add(g); return g;
  });
}

export function addGroundVehicles(scene: THREE.Scene) {
  const types = [
    { color: 0xf5a020 }, { color: 0x00c890 }, { color: 0x3a80d9 },
    { color: 0xe03020 }, { color: 0xff8030 }, { color: 0xffd020 },
  ];
  const spots = [
    [-8, 8], [5, 12], [18, 8], [-20, 18], [28, 12],
    [-62, -48], [-66, -42], [-58, -52], [22, 8],
  ];
  for (let i = 0; i < spots.length; i++) {
    const [x, z] = spots[i];
    const c = types[i % types.length].color;
    const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.5, 2.0), mat);
    body.position.set(x, 0.75, z); body.castShadow = true; scene.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.7), new THREE.MeshStandardMaterial({ color: 0xd0d8e4, roughness: 0.4 }));
    cab.position.set(x + 1.3, 1.6, z); cab.castShadow = true; scene.add(cab);
    for (const [wx, wz] of [[-0.9,-0.9],[-0.9,0.9],[0.9,-0.9],[0.9,0.9]]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.9 }));
      wh.rotation.z = Math.PI / 2; wh.position.set(x + wx, 0.38, z + wz); scene.add(wh);
    }
  }
}

