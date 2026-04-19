import * as THREE from 'three';

const MAT = {
  building: new THREE.MeshLambertMaterial({ color: 0xdde3ed }),
  buildingDark: new THREE.MeshLambertMaterial({ color: 0xb8c2d4 }),
  buildingShadow: new THREE.MeshLambertMaterial({ color: 0x9aa5bb }),
  glass: new THREE.MeshLambertMaterial({ color: 0x7ab8d4, transparent: true, opacity: 0.7 }),
  glassDark: new THREE.MeshLambertMaterial({ color: 0x5a9ab0, transparent: true, opacity: 0.6 }),
  runway: new THREE.MeshLambertMaterial({ color: 0x1e2530 }),
  taxiway: new THREE.MeshLambertMaterial({ color: 0x242c38 }),
  ground: new THREE.MeshLambertMaterial({ color: 0x1a2e1e }),
  apron: new THREE.MeshLambertMaterial({ color: 0x2a3545 }),
  grass: new THREE.MeshLambertMaterial({ color: 0x1e3420 }),
  road: new THREE.MeshLambertMaterial({ color: 0x1c2028 }),
  yellow: new THREE.MeshLambertMaterial({ color: 0xf5a623 }),
  red: new THREE.MeshLambertMaterial({ color: 0xe74c3c }),
  jetbridge: new THREE.MeshLambertMaterial({ color: 0x8a9bb0 }),
  white: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  towerGlass: new THREE.MeshLambertMaterial({ color: 0x5ba3c0, transparent: true, opacity: 0.85 }),
  tree: new THREE.MeshLambertMaterial({ color: 0x2d5a27 }),
  treeTrunk: new THREE.MeshLambertMaterial({ color: 0x5c4033 }),
  parking: new THREE.MeshLambertMaterial({ color: 0x252d3a }),
  concrete: new THREE.MeshLambertMaterial({ color: 0x3a4452 }),
  asphalt: new THREE.MeshLambertMaterial({ color: 0x2a2e38 }),
  fence: new THREE.MeshLambertMaterial({ color: 0x2a3545, transparent: true, opacity: 0.5 }),
  roofDark: new THREE.MeshLambertMaterial({ color: 0xa0aab8 }),
};

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(rt: number, rb: number, h: number, segs: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildAirport(scene: THREE.Scene) {
  buildGround(scene);
  buildRunways(scene);
  buildTaxiways(scene);
  buildApron(scene);
  buildTerminalBuilding(scene);
  buildControlTower(scene);
  buildJetbridges(scene);
  buildCargoArea(scene);
  buildServiceArea(scene);
  buildRoads(scene);
  buildParkingLot(scene);
  buildTrees(scene);
  buildRunwayMarkings(scene);
  buildPerimeterFence(scene);
  buildLighting(scene);
  buildSecurityCheckpoints(scene);
  buildFuelDepot(scene);
  buildHangars(scene);
}

function buildGround(scene: THREE.Scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 800),
    MAT.grass
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const tarmac = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700),
    new THREE.MeshLambertMaterial({ color: 0x202a38 })
  );
  tarmac.rotation.x = -Math.PI / 2;
  tarmac.position.y = 0.01;
  scene.add(tarmac);
}

function buildRunways(scene: THREE.Scene) {
  const rw1 = box(15, 0.08, 280, MAT.runway, -30, 0.04, -20);
  scene.add(rw1);

  const rw2 = box(280, 0.08, 15, MAT.runway, 0, 0.04, -90);
  scene.add(rw2);

  const shoulder1a = box(6, 0.05, 280, MAT.taxiway, -48, 0.025, -20);
  const shoulder1b = box(6, 0.05, 280, MAT.taxiway, -12, 0.025, -20);
  scene.add(shoulder1a);
  scene.add(shoulder1b);

  const shoulder2a = box(280, 0.05, 6, MAT.taxiway, 0, 0.025, -78);
  const shoulder2b = box(280, 0.05, 6, MAT.taxiway, 0, 0.025, -102);
  scene.add(shoulder2a);
  scene.add(shoulder2b);

  for (let i = 0; i < 4; i++) {
    const stripe = box(1.5, 0.09, 20, MAT.yellow, -30, 0.045, -120 + i * 40);
    scene.add(stripe);
  }
}

function buildTaxiways(scene: THREE.Scene) {
  const tw = [
    box(8, 0.06, 80, MAT.taxiway, -8, 0.03, -15),
    box(70, 0.06, 8, MAT.taxiway, -20, 0.03, 8),
    box(8, 0.06, 60, MAT.taxiway, -8, 0.03, 35),
    box(40, 0.06, 8, MAT.taxiway, -28, 0.03, 55),
    box(8, 0.06, 50, MAT.taxiway, 15, 0.03, 5),
    box(8, 0.06, 40, MAT.taxiway, 28, 0.03, -10),
    box(60, 0.06, 8, MAT.taxiway, -10, 0.03, -65),
    box(8, 0.06, 35, MAT.taxiway, -50, 0.03, -45),
  ];
  tw.forEach(t => scene.add(t));

  for (let i = 0; i < tw.length; i++) {
    for (let j = 0; j < 4; j++) {
      const line = box(0.4, 0.07, 2, MAT.yellow, tw[i].position.x, 0.035, tw[i].position.z - 4 + j * 3);
      scene.add(line);
    }
  }
}

function buildApron(scene: THREE.Scene) {
  const apron = box(120, 0.1, 70, MAT.apron, 15, 0.05, 25);
  scene.add(apron);

  const apron2 = box(90, 0.1, 45, MAT.apron, -5, 0.05, -8);
  scene.add(apron2);

  for (let i = -5; i <= 5; i++) {
    const line = box(0.3, 0.11, 35, MAT.taxiway, i * 14 + 15, 0.055, 25);
    scene.add(line);
  }
}

function buildTerminalBuilding(scene: THREE.Scene) {
  const mainTerminal = box(85, 10, 28, MAT.building, 12, 5, 0);
  scene.add(mainTerminal);

  const mainRoof = box(87, 1, 30, MAT.roofDark, 12, 10.5, 0);
  scene.add(mainRoof);

  const roofDetail = box(85, 0.3, 28, new THREE.MeshLambertMaterial({ color: 0x8a94a8, emissive: 0x1a1a1a }), 12, 10.8, 0);
  scene.add(roofDetail);

  const glassStrip1 = box(85, 5, 2, MAT.glass, 12, 6, -13.5);
  scene.add(glassStrip1);

  const glassStrip2 = box(85, 5, 2, MAT.glass, 12, 6, 13.5);
  scene.add(glassStrip2);

  const glassStrip3 = box(2, 5, 24, MAT.glassDark, -33, 6, 0);
  scene.add(glassStrip3);

  const glassStrip4 = box(2, 5, 24, MAT.glassDark, 57, 6, 0);
  scene.add(glassStrip4);

  const northWing = box(35, 8, 22, MAT.building, -22, 4, -25);
  scene.add(northWing);

  const northWingRoof = box(37, 0.8, 24, MAT.roofDark, -22, 8.4, -25);
  scene.add(northWingRoof);

  const southConcourse = box(75, 6, 18, MAT.building, 8, 3, 38);
  scene.add(southConcourse);

  const southConcourseRoof = box(77, 0.7, 20, MAT.roofDark, 8, 6.35, 38);
  scene.add(southConcourseRoof);

  const connector = box(12, 6, 18, MAT.building, 12, 3, 28);
  scene.add(connector);

  const connectorRoof = box(14, 0.5, 20, MAT.roofDark, 12, 6.25, 28);
  scene.add(connectorRoof);

  const eastWing = box(25, 7, 16, MAT.building, 40, 3.5, 18);
  scene.add(eastWing);

  const eastWingRoof = box(27, 0.7, 18, MAT.roofDark, 40, 7.35, 18);
  scene.add(eastWingRoof);

  for (let i = 0; i < 18; i++) {
    const col = box(1.2, 10, 1.2, MAT.buildingDark, -38 + i * 5.5, 5, 10);
    scene.add(col);
  }

  for (let i = 0; i < 18; i++) {
    const col = box(1.2, 10, 1.2, MAT.buildingDark, -38 + i * 5.5, 5, -10);
    scene.add(col);
  }

  const curbRoad = box(85, 0.4, 12, MAT.asphalt, 12, 0.2, -20);
  scene.add(curbRoad);

  const curbSidewalk = box(85, 0.5, 6, MAT.concrete, 12, 0.25, -15);
  scene.add(curbSidewalk);

  const departureDeck = box(85, 0.6, 16, MAT.concrete, 12, 5.3, -18);
  scene.add(departureDeck);

  const luggage = box(1.5, 0.8, 1.5, new THREE.MeshLambertMaterial({ color: 0xffe066 }), 8, 2.5, 30);
  scene.add(luggage);

  const groundService = box(2, 0.6, 2, new THREE.MeshLambertMaterial({ color: 0xff8f3a }), 35, 0.3, 18);
  scene.add(groundService);
}

function buildControlTower(scene: THREE.Scene) {
  const base = box(6, 3, 6, MAT.buildingDark, -48, 1.5, -35);
  scene.add(base);

  const shaft = box(4.5, 28, 4.5, MAT.buildingDark, -48, 18, -35);
  scene.add(shaft);

  const shaftDetail = box(4.2, 28, 4.2, new THREE.MeshLambertMaterial({ color: 0xafbbc7 }), -48, 18, -35);
  scene.add(shaftDetail);

  const cab = box(9, 4.5, 9, MAT.towerGlass, -48, 33.25, -35);
  scene.add(cab);

  const cabFrame = box(9, 4.5, 9, new THREE.MeshLambertMaterial({ color: 0x3a4452, transparent: true, opacity: 0.3 }), -48, 33.25, -35);
  scene.add(cabFrame);

  const cabTop = box(10, 0.6, 10, MAT.roofDark, -48, 36.6, -35);
  scene.add(cabTop);

  const antenna = cyl(0.2, 0.2, 8, 4, MAT.asphalt, -48, 41, -35);
  scene.add(antenna);

  const light1 = cyl(0.4, 0.4, 0.6, 12, new THREE.MeshBasicMaterial({ color: 0xff2222 }), -48, 45.2, -35);
  const light2 = cyl(0.4, 0.4, 0.6, 12, new THREE.MeshBasicMaterial({ color: 0xff2222 }), -48, 44, -35);
  scene.add(light1);
  scene.add(light2);

  const platform = box(12, 0.5, 12, MAT.concrete, -48, 0.8, -35);
  scene.add(platform);
}

function buildJetbridges(scene: THREE.Scene) {
  const gates = [
    { x: -20, z: 30, rot: 0 }, { x: -8, z: 30, rot: 0 }, { x: 4, z: 30, rot: 0 },
    { x: 16, z: 30, rot: 0 }, { x: 28, z: 30, rot: 0 }, { x: 40, z: 30, rot: 0 },
    { x: -32, z: 20, rot: Math.PI / 2 }, { x: -32, z: 32, rot: Math.PI / 2 },
    { x: 52, z: 15, rot: Math.PI / 2 }, { x: 52, z: 28, rot: Math.PI / 2 },
    { x: 8, z: 50, rot: 0 }, { x: 20, z: 50, rot: 0 }, { x: 32, z: 50, rot: 0 },
  ];

  for (const g of gates) {
    const armLen = 12;
    const arm = box(1, 3.2, armLen, MAT.jetbridge, g.x, 4.2, g.z + armLen / 2 - 2);
    arm.rotation.y = g.rot;
    scene.add(arm);

    const end = box(4, 3.2, 2.5, MAT.jetbridge, g.x, 4.2, g.z + armLen - 2);
    end.rotation.y = g.rot;
    scene.add(end);

    const support = box(0.6, 5.5, 0.6, MAT.buildingDark, g.x, 2.75, g.z + armLen - 2);
    support.rotation.y = g.rot;
    scene.add(support);

    const connector = box(0.3, 0.4, armLen - 2, MAT.yellow, g.x, 4.8, g.z + armLen / 2);
    connector.rotation.y = g.rot;
    scene.add(connector);
  }
}

function buildCargoArea(scene: THREE.Scene) {
  const hangar1 = box(45, 14, 30, MAT.buildingDark, -75, 7, 0);
  scene.add(hangar1);

  const hangar1Roof = box(47, 1, 32, MAT.roofDark, -75, 14.5, 0);
  scene.add(hangar1Roof);

  const hangar2 = box(40, 12, 25, MAT.building, -75, 6, 38);
  scene.add(hangar2);

  const hangar2Roof = box(42, 0.9, 27, MAT.roofDark, -75, 12.45, 38);
  scene.add(hangar2Roof);

  for (let i = 0; i < 6; i++) {
    const door = box(6, 10, 0.5, MAT.asphalt, -82 + i * 7, 5, 15.5);
    scene.add(door);
  }

  const cargoApron = box(60, 0.1, 50, MAT.apron, -70, 0.05, 25);
  scene.add(cargoApron);

  const cargoBuilding = box(18, 8, 14, MAT.building, -80, 4, -20);
  scene.add(cargoBuilding);

  const cargoBuildingRoof = box(20, 0.6, 16, MAT.roofDark, -80, 8.3, -20);
  scene.add(cargoBuildingRoof);
}

function buildServiceArea(scene: THREE.Scene) {
  const maintenance = box(30, 9, 20, MAT.buildingDark, 70, 4.5, 5);
  scene.add(maintenance);

  const maintenanceRoof = box(32, 0.7, 22, MAT.roofDark, 70, 9.2, 5);
  scene.add(maintenanceRoof);

  const ops = box(16, 7, 12, MAT.building, 78, 3.5, -25);
  scene.add(ops);

  const opsRoof = box(18, 0.6, 14, MAT.roofDark, 78, 7.1, -25);
  scene.add(opsRoof);

  const fuel = box(12, 1, 8, new THREE.MeshLambertMaterial({ color: 0x4a4e58 }), 75, 0.5, -10);
  scene.add(fuel);
}

function buildRoads(scene: THREE.Scene) {
  const mainRoad = box(150, 0.2, 10, MAT.road, 15, 0.1, -40);
  scene.add(mainRoad);

  const entryRoad = box(10, 0.2, 40, MAT.road, -65, 0.1, -45);
  scene.add(entryRoad);

  const exitRoad = box(10, 0.2, 35, MAT.road, 85, 0.1, -35);
  scene.add(exitRoad);

  const circularRoad = box(90, 0.2, 10, MAT.road, 15, 0.1, -60);
  scene.add(circularRoad);

  const serviceRoad = box(80, 0.15, 6, MAT.asphalt, 10, 0.075, -75);
  scene.add(serviceRoad);

  for (let i = -3; i <= 3; i++) {
    const dash = box(4, 0.2, 0.4, MAT.white, i * 18 + 15, 0.1, -40);
    scene.add(dash);
  }
}

function buildParkingLot(scene: THREE.Scene) {
  const lot = box(70, 0.15, 60, MAT.parking, 75, 0.075, 35);
  scene.add(lot);

  const structure = box(30, 16, 20, MAT.buildingDark, 95, 8, -10);
  scene.add(structure);

  const structureRoof = box(32, 0.8, 22, MAT.roofDark, 95, 16.4, -10);
  scene.add(structureRoof);

  for (let i = 0; i < 5; i++) {
    const deck = box(30, 0.5, 20, MAT.concrete, 95, 3.25 + i * 3.2, -10);
    scene.add(deck);
  }

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      const spot = box(3, 0.15, 5, MAT.parking, 50 + col * 3.5, 0.075, 15 + row * 14);
      scene.add(spot);

      const line = box(0.15, 0.16, 5, MAT.road, 51.5 + col * 3.5, 0.08, 15 + row * 14);
      scene.add(line);
    }
  }
}

function buildTrees(scene: THREE.Scene) {
  const positions = [
    [70, 0, -65], [75, 0, -70], [80, 0, -60], [85, 0, -68],
    [-80, 0, -60], [-85, 0, -68], [-90, 0, -55], [-75, 0, -65],
    [-85, 0, 65], [-80, 0, 72], [-75, 0, 58],
    [85, 0, 65], [90, 0, 72], [80, 0, 58],
    [65, 0, 80], [70, 0, 85], [58, 0, 78],
    [-65, 0, 80], [-58, 0, 85], [-72, 0, 78],
    [95, 0, -15], [100, 0, 0], [98, 0, 15],
    [-95, 0, -15], [-100, 0, 5], [-98, 0, 20],
    [15, 0, 95], [25, 0, 98], [0, 0, 98],
    [30, 0, -65], [35, 0, -68], [22, 0, -70],
    [-30, 0, 75], [-25, 0, 80], [-35, 0, 78],
  ];

  for (const [x, , z] of positions) {
    const height = 5 + Math.random() * 4;
    const trunk = cyl(0.35, 0.5, height * 0.4, 6, MAT.treeTrunk, x, height * 0.2, z);
    scene.add(trunk);

    const crown = cyl(2.8, 0.3, height * 0.7, 8, MAT.tree, x, height * 0.7, z);
    scene.add(crown);

    const crown2 = cyl(2, 0.6, height * 0.5, 8, MAT.tree, x, height * 0.85, z);
    scene.add(crown2);

    const crown3 = cyl(1.2, 0.8, height * 0.3, 8, MAT.tree, x, height * 0.95, z);
    scene.add(crown3);
  }
}

function buildRunwayMarkings(scene: THREE.Scene) {
  for (let i = -12; i <= 12; i++) {
    const dash = box(1.8, 0.09, 5, MAT.white, -30, 0.045, i * 26);
    scene.add(dash);
  }

  for (let i = -7; i <= 7; i++) {
    const dash = box(5, 0.09, 1.8, MAT.white, i * 40, 0.045, -90);
    scene.add(dash);
  }

  const thr1 = box(12, 0.09, 2, MAT.white, -30, 0.045, -130);
  const thr2 = box(12, 0.09, 2, MAT.white, -30, 0.045, 130);
  scene.add(thr1);
  scene.add(thr2);

  const thr3 = box(2, 0.09, 12, MAT.white, -110, 0.045, -90);
  const thr4 = box(2, 0.09, 12, MAT.white, 110, 0.045, -90);
  scene.add(thr3);
  scene.add(thr4);

  const centerLine1 = box(0.3, 0.08, 280, MAT.yellow, -30, 0.04, -20);
  scene.add(centerLine1);

  const centerLine2 = box(280, 0.08, 0.3, MAT.yellow, 0, 0.04, -90);
  scene.add(centerLine2);
}

function buildPerimeterFence(scene: THREE.Scene) {
  const segments = [
    { w: 300, d: 0.8, x: 0, z: 110 },
    { w: 300, d: 0.8, x: 0, z: -110 },
    { w: 0.8, d: 220, x: 150, z: 0 },
    { w: 0.8, d: 220, x: -150, z: 0 },
  ];

  for (const s of segments) {
    const fence = box(s.w, 2.5, s.d, MAT.fence, s.x, 1.25, s.z);
    scene.add(fence);

    const fenceGate = box(s.w * 0.1, 2.5, s.d, new THREE.MeshLambertMaterial({ color: 0x1a1f2a, transparent: true, opacity: 0.4 }), s.x, 1.25, s.z);
    scene.add(fenceGate);
  }
}

function buildLighting(scene: THREE.Scene) {
  const positions = [
    { x: -35, z: -15 }, { x: 30, z: -15 }, { x: -35, z: 45 }, { x: 30, z: 45 },
    { x: -60, z: 0 }, { x: 75, z: 0 }, { x: -60, z: -65 }, { x: 75, z: -65 },
    { x: 0, z: -70 }, { x: 0, z: 70 },
  ];

  for (const p of positions) {
    const pole = cyl(0.3, 0.4, 12, 6, MAT.concrete, p.x, 6, p.z);
    scene.add(pole);

    const light = cyl(0.4, 0.4, 0.3, 8, new THREE.MeshBasicMaterial({ color: 0xffd700, emissive: 0xffa500 }), p.x, 12.2, p.z);
    scene.add(light);
  }
}

function buildSecurityCheckpoints(scene: THREE.Scene) {
  for (let i = 0; i < 4; i++) {
    const booth = box(3, 3.5, 2, MAT.building, -15 + i * 8, 1.75, 5);
    scene.add(booth);

    const window = box(2.8, 1.8, 0.3, MAT.glass, -15 + i * 8, 3.2, 5.85);
    scene.add(window);
  }
}

function buildFuelDepot(scene: THREE.Scene) {
  for (let i = 0; i < 3; i++) {
    const tank = cyl(2.5, 2.5, 3, 16, new THREE.MeshLambertMaterial({ color: 0xa8a0b0 }), 60, 1.5, -60 + i * 8);
    scene.add(tank);

    const top = cyl(2.3, 2.5, 0.4, 16, MAT.asphalt, 60, 3.2, -60 + i * 8);
    scene.add(top);
  }

  const fuelHouse = box(8, 4, 6, MAT.building, 58, 2, -48);
  scene.add(fuelHouse);

  const fuelHouseRoof = box(10, 0.5, 8, MAT.roofDark, 58, 4.25, -48);
  scene.add(fuelHouseRoof);
}

function buildHangars(scene: THREE.Scene) {
  const hangar3 = box(50, 13, 30, MAT.buildingDark, 50, 6.5, -50);
  scene.add(hangar3);

  const hangar3Roof = box(52, 1.2, 32, MAT.roofDark, 50, 13.1, -50);
  scene.add(hangar3Roof);

  for (let i = 0; i < 3; i++) {
    const door = box(8, 11, 0.6, MAT.asphalt, 30 + i * 10, 5.5, -35);
    scene.add(door);
  }
}
