import * as THREE from 'three';
import type { LiveAircraft } from '../data/flights';

export interface AircraftObject {
  group: THREE.Group;
  data: LiveAircraft;
  targetLat: number;
  targetLon: number;
  worldX: number;
  worldZ: number;
}

const SDQ_LAT = 18.4297;
const SDQ_LON = -69.6689;
const SCALE = 80;

const FUSELAGE_MAT = new THREE.MeshLambertMaterial({ color: 0xf0f4f8 });
const FUSELAGE_LOWER = new THREE.MeshLambertMaterial({ color: 0xe8ecf2 });
const ENGINE_MAT = new THREE.MeshLambertMaterial({ color: 0xc8cdd4 });
const WING_MAT = new THREE.MeshLambertMaterial({ color: 0xe8ecf2 });
const WINDOW_MAT = new THREE.MeshLambertMaterial({ color: 0x5b8fb9 });
const TAIL_MAT = new THREE.MeshLambertMaterial({ color: 0xd8dce6 });
const COCKPIT_MAT = new THREE.MeshLambertMaterial({ color: 0x4a6fa5 });
const GEAR_MAT = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

function createAircraftMesh(): THREE.Group {
  const group = new THREE.Group();

  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.6, 8, 12),
    FUSELAGE_MAT
  );
  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  group.add(fuselage);

  const fuselageLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.55, 7.8, 12),
    FUSELAGE_LOWER
  );
  fuselageLower.rotation.z = Math.PI / 2;
  fuselageLower.position.y = -0.15;
  group.add(fuselageLower);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.68, 2.2, 12),
    COCKPIT_MAT
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 5;
  nose.castShadow = true;
  group.add(nose);

  const cockpitWindow = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.8, 8),
    WINDOW_MAT
  );
  cockpitWindow.rotation.z = -Math.PI / 2;
  cockpitWindow.position.set(5.8, 0.15, 0);
  group.add(cockpitWindow);

  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 2.2, 12),
    FUSELAGE_MAT
  );
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -4.8;
  tail.castShadow = true;
  group.add(tail);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(0.6, 5.2);
  wingShape.quadraticCurveTo(-1, 5.5, -1.8, 5);
  wingShape.lineTo(-3, 0);
  wingShape.closePath();

  const wingGeo = new THREE.ShapeGeometry(wingShape);
  const wingL = new THREE.Mesh(wingGeo, WING_MAT);
  wingL.rotation.x = -Math.PI / 2;
  wingL.position.set(0, 0, 0);
  wingL.castShadow = true;
  group.add(wingL);

  const wingR = wingL.clone();
  wingR.rotation.x = Math.PI / 2;
  wingR.position.set(0, 0, 0);
  group.add(wingR);

  const winglet = box(0.15, 1.5, 0.3, WING_MAT, 0.3, 0.3, -5.5);
  winglet.castShadow = true;
  group.add(winglet);

  const wingletR = winglet.clone();
  wingletR.position.z = 5.5;
  group.add(wingletR);

  const hTailShape = new THREE.Shape();
  hTailShape.moveTo(0, 0);
  hTailShape.lineTo(-0.35, 2.3);
  hTailShape.quadraticCurveTo(-1, 2.3, -1.4, 1.8);
  hTailShape.lineTo(-1.8, 0);
  hTailShape.closePath();

  const hTailGeo = new THREE.ShapeGeometry(hTailShape);
  const hTailL = new THREE.Mesh(hTailGeo, TAIL_MAT);
  hTailL.rotation.x = -Math.PI / 2;
  hTailL.position.set(-3.8, 0.15, 0);
  group.add(hTailL);

  const hTailR = hTailL.clone();
  hTailR.rotation.x = Math.PI / 2;
  hTailR.position.set(-3.8, 0.15, 0);
  group.add(hTailR);

  const vTailShape = new THREE.Shape();
  vTailShape.moveTo(0, 0);
  vTailShape.lineTo(0, 3);
  vTailShape.quadraticCurveTo(-1.2, 3.2, -1.8, 2.2);
  vTailShape.lineTo(-2.2, 0);
  vTailShape.closePath();

  const vTailGeo = new THREE.ShapeGeometry(vTailShape);
  const vTail = new THREE.Mesh(vTailGeo, TAIL_MAT);
  vTail.rotation.y = -Math.PI / 2;
  vTail.position.set(-3.8, 0.8, 0);
  group.add(vTail);

  for (let side of [-1, 1]) {
    const engPylon = box(0.6, 1.2, 1.8, ENGINE_MAT, 0.8, -0.2, side * 2.8);
    engPylon.castShadow = true;
    group.add(engPylon);

    const engNacelle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.4, 2.8, 10),
      ENGINE_MAT
    );
    engNacelle.rotation.z = Math.PI / 2;
    engNacelle.position.set(0.5, -0.55, side * 2.8);
    engNacelle.castShadow = true;
    group.add(engNacelle);

    const engIntake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.55, 0.4, 10),
      new THREE.MeshLambertMaterial({ color: 0x252a35 })
    );
    engIntake.rotation.z = Math.PI / 2;
    engIntake.position.set(1.8, -0.55, side * 2.8);
    engIntake.castShadow = true;
    group.add(engIntake);

    const engCore = cyl(0.25, 0.25, 2, 8, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }), 0.8, -0.55, side * 2.8);
    engCore.rotation.z = Math.PI / 2;
    group.add(engCore);

    const gear = box(0.3, 0.8, 0.4, GEAR_MAT, -0.5, -1.2, side * 1.5);
    gear.castShadow = true;
    group.add(gear);
  }

  const nosegear = box(0.25, 1, 0.35, GEAR_MAT, 4.5, -1.3, 0);
  nosegear.castShadow = true;
  group.add(nosegear);

  const centerTank = cyl(0.35, 0.35, 0.8, 6, new THREE.MeshLambertMaterial({ color: 0xc0c5cc }), 0, -0.3, 0);
  group.add(centerTank);

  for (let i = 0; i < 6; i++) {
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.35),
      WINDOW_MAT
    );
    win.position.set(1.5 + i * 0.95 - 1.8, 0.55, 0.72);
    win.rotation.y = -Math.PI / 2;
    group.add(win);

    if (i < 4) {
      const cabinWin = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.32),
        WINDOW_MAT
      );
      cabinWin.position.set(0.5 + i * 1 - 1.5, 0.48, -0.72);
      cabinWin.rotation.y = Math.PI / 2;
      group.add(cabinWin);
    }
  }

  const wingFold = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.1, 2.5),
    new THREE.MeshLambertMaterial({ color: 0xafbbc7 })
  );
  wingFold.position.set(-1.6, -0.15, 0);
  group.add(wingFold);

  group.scale.setScalar(0.95);
  return group;
}

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

function cyl(rt: number, rb: number, h: number, segs: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

function latLonToWorld(lat: number, lon: number): { x: number; z: number } {
  const dlat = lat - SDQ_LAT;
  const dlon = lon - SDQ_LON;
  const x = dlon * SCALE * Math.cos(SDQ_LAT * Math.PI / 180);
  const z = -dlat * SCALE;
  return { x, z };
}

export function createAircraftObjects(
  aircraftList: LiveAircraft[],
  scene: THREE.Scene
): AircraftObject[] {
  const objects: AircraftObject[] = [];
  const limit = Math.min(aircraftList.length, 25);

  for (let i = 0; i < limit; i++) {
    const ac = aircraftList[i];
    const group = createAircraftMesh();

    const { x, z } = latLonToWorld(ac.lat, ac.lon);
    const altitudeScale = ac.onGround ? 0.3 : Math.min(ac.altitude / 10000, 1) * 13 + 0.5;

    group.position.set(x, altitudeScale, z);
    group.rotation.y = ((270 - ac.heading) * Math.PI) / 180;

    if (ac.onGround) {
      group.scale.setScalar(0.75);
    } else {
      const dist = Math.sqrt(x * x + z * z);
      const scaleFactor = Math.max(0.85, Math.min(2.2, dist / 25));
      group.scale.setScalar(scaleFactor);
    }

    scene.add(group);
    objects.push({
      group,
      data: ac,
      targetLat: ac.lat,
      targetLon: ac.lon,
      worldX: x,
      worldZ: z,
    });
  }

  return objects;
}

export function updateAircraftPositions(objects: AircraftObject[], delta: number) {
  for (const obj of objects) {
    if (!obj.data.onGround) {
      const speed = (obj.data.velocity / 200) * delta * 0.45;
      const headingRad = (obj.data.heading * Math.PI) / 180;
      obj.worldX += Math.sin(headingRad) * speed;
      obj.worldZ -= Math.cos(headingRad) * speed;

      obj.group.position.x += (obj.worldX - obj.group.position.x) * 0.06;
      obj.group.position.z += (obj.worldZ - obj.group.position.z) * 0.06;

      const roll = Math.sin(obj.data.heading * Math.PI / 180) * 0.08;
      const pitch = Math.cos(obj.data.heading * Math.PI / 180) * 0.04;
      obj.group.rotation.z += (roll - obj.group.rotation.z) * 0.1;
      obj.group.rotation.x += (pitch - obj.group.rotation.x) * 0.1;
    }

    obj.group.rotation.y = ((270 - obj.data.heading) * Math.PI) / 180;
  }
}

export function addGroundAircraft(scene: THREE.Scene) {
  const gatePositions = [
    { x: -20, z: 35, heading: 0 },
    { x: -8, z: 35, heading: 0 },
    { x: 4, z: 35, heading: 0 },
    { x: 16, z: 35, heading: 0 },
    { x: 28, z: 35, heading: 0 },
    { x: 40, z: 35, heading: 0 },
    { x: -32, z: 25, heading: 90 },
    { x: -32, z: 38, heading: 90 },
    { x: 52, z: 20, heading: 90 },
    { x: 52, z: 33, heading: 90 },
  ];

  const groups: THREE.Group[] = [];
  for (const pos of gatePositions) {
    const group = createAircraftMesh();
    group.position.set(pos.x, 0.35, pos.z);
    group.rotation.y = (pos.heading * Math.PI) / 180;
    group.scale.setScalar(0.85);
    scene.add(group);
    groups.push(group);
  }
  return groups;
}

export function addGroundVehicles(scene: THREE.Scene) {
  const vehicleTypes = [
    { color: 0xf5a623, name: 'tug' },
    { color: 0x00c896, name: 'tug' },
    { color: 0x4a90d9, name: 'truck' },
    { color: 0xe74c3c, name: 'emergency' },
    { color: 0xff8f3a, name: 'tug' },
    { color: 0xffd700, name: 'catering' },
  ];

  const positions = [
    { x: -5, z: 25 }, { x: 10, z: 28 }, { x: 22, z: 24 },
    { x: -18, z: 32 }, { x: 32, z: 28 }, { x: -62, z: 35 },
    { x: -65, z: 30 }, { x: -60, z: 40 }, { x: 25, z: 15 },
  ];

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const vtype = vehicleTypes[i % vehicleTypes.length];
    const mat = new THREE.MeshLambertMaterial({ color: vtype.color });

    const bodyW = vtype.name === 'truck' ? 4.5 : 3.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, 1.4, 1.8), mat);
    body.position.set(p.x, 0.7, p.z);
    body.castShadow = true;
    scene.add(body);

    const cabH = vtype.name === 'truck' ? 1.2 : 0.9;
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, cabH, 1.6),
      new THREE.MeshLambertMaterial({ color: 0xd0d5dc })
    );
    cab.position.set(p.x + (bodyW * 0.35), 1.5, p.z);
    cab.castShadow = true;
    scene.add(cab);

    for (let w = 0; w < 4; w++) {
      const wheel = cyl(0.35, 0.35, 0.25, 8, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }), p.x - bodyW * 0.25 + w * bodyW * 0.2, 0.35, p.z + 0.8);
      scene.add(wheel);
    }

    if (vtype.name === 'catering') {
      const lift = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 1), new THREE.MeshLambertMaterial({ color: 0xb8bcc8 }));
      lift.position.set(p.x + 1.5, 1.25, p.z);
      scene.add(lift);
    }
  }
}
