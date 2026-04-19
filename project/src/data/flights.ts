export interface LiveAircraft {
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  velocity: number;
  onGround: boolean;
  originCountry: string;
}

export interface FlightRecord {
  callsign: string;
  flightNumber: string;
  airline: string;
  aircraftType: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  scheduledTime: string;
  estimatedTime: string;
  actualTime?: string;
  status: 'on-time' | 'delayed' | 'departed' | 'scheduled' | 'arrived';
  gate: string;
  terminal: string;
  type: 'departure' | 'arrival';
  delay: number;
  flightDuration: string;
}

const AIRLINE_MAP: Record<string, { name: string; prefix: string; icon: string }> = {
  AA: { name: 'American Airlines', prefix: 'AA', icon: '✈' },
  UA: { name: 'United Airlines', prefix: 'UA', icon: '✈' },
  DL: { name: 'Delta Air Lines', prefix: 'DL', icon: '✈' },
  B6: { name: 'JetBlue Airways', prefix: 'B6', icon: '✈' },
  CM: { name: 'Copa Airlines', prefix: 'CM', icon: '✈' },
  AM: { name: 'Aeromexico', prefix: 'AM', icon: '✈' },
  LA: { name: 'LATAM Airlines', prefix: 'LA', icon: '✈' },
  AV: { name: 'Avianca', prefix: 'AV', icon: '✈' },
  IB: { name: 'Iberia', prefix: 'IB', icon: '✈' },
  AC: { name: 'Air Canada', prefix: 'AC', icon: '✈' },
  BA: { name: 'British Airways', prefix: 'BA', icon: '✈' },
  NK: { name: 'Spirit Airlines', prefix: 'NK', icon: '✈' },
  WN: { name: 'Southwest Airlines', prefix: 'WN', icon: '✈' },
  F9: { name: 'Frontier Airlines', prefix: 'F9', icon: '✈' },
  SY: { name: 'Sun Country', prefix: 'SY', icon: '✈' },
  EK: { name: 'Emirates', prefix: 'EK', icon: '✈' },
};

const CITY_MAP: Record<string, string> = {
  MIA: 'Miami',
  JFK: 'New York JFK',
  EWR: 'Newark',
  ORD: 'Chicago',
  ATL: 'Atlanta',
  MCO: 'Orlando',
  LAX: 'Los Angeles',
  DFW: 'Dallas',
  BOS: 'Boston',
  YYZ: 'Toronto',
  YUL: 'Montreal',
  GRU: 'São Paulo',
  BOG: 'Bogotá',
  LIM: 'Lima',
  SCL: 'Santiago',
  PTY: 'Panama City',
  MEX: 'Mexico City',
  MAD: 'Madrid',
  LHR: 'London',
  CDG: 'Paris',
  AMS: 'Amsterdam',
  HAV: 'Havana',
  PUJ: 'Punta Cana',
  STI: 'Santiago, DR',
  POP: 'Puerto Plata',
  SJU: 'San Juan',
  BGI: 'Barbados',
  ANU: 'Antigua',
  KIN: 'Kingston',
  NAS: 'Nassau',
  MBJ: 'Montego Bay',
};

const AIRCRAFT_TYPES = ['B737', 'A320', 'A321', 'B757', 'B767', 'A330', 'B787', 'A380', 'E190', 'CRJ9'];

const AIRLINES_FLYING_SDQ = [
  { code: 'AA', flights: ['AA1234', 'AA567', 'AA2089', 'AA3401', 'AA4055', 'AA5201'] },
  { code: 'UA', flights: ['UA456', 'UA3209', 'UA901', 'UA2344'] },
  { code: 'DL', flights: ['DL678', 'DL2341', 'DL890'] },
  { code: 'B6', flights: ['B6891', 'B6234', 'B6567', 'B6112'] },
  { code: 'CM', flights: ['CM890', 'CM123', 'CM456'] },
  { code: 'IB', flights: ['IB6821', 'IB3344'] },
  { code: 'LA', flights: ['LA4578', 'LA2233'] },
  { code: 'AV', flights: ['AV234', 'AV567'] },
  { code: 'NK', flights: ['NK892', 'NK345', 'NK678'] },
  { code: 'AC', flights: ['AC1234', 'AC901'] },
];

const ROUTES: Array<{ dest: string; orig: string; duration: number }> = [
  { dest: 'MIA', orig: 'SDQ', duration: 65 },
  { dest: 'JFK', orig: 'SDQ', duration: 190 },
  { dest: 'ORD', orig: 'SDQ', duration: 240 },
  { dest: 'ATL', orig: 'SDQ', duration: 180 },
  { dest: 'MCO', orig: 'SDQ', duration: 140 },
  { dest: 'EWR', orig: 'SDQ', duration: 200 },
  { dest: 'BOS', orig: 'SDQ', duration: 220 },
  { dest: 'PTY', orig: 'SDQ', duration: 85 },
  { dest: 'MAD', orig: 'SDQ', duration: 540 },
  { dest: 'YYZ', orig: 'SDQ', duration: 300 },
  { dest: 'LAX', orig: 'SDQ', duration: 380 },
  { dest: 'DFW', orig: 'SDQ', duration: 260 },
  { dest: 'HAV', orig: 'SDQ', duration: 40 },
  { dest: 'SJU', orig: 'SDQ', duration: 60 },
  { dest: 'BGI', orig: 'SDQ', duration: 280 },
];

function randomGate(): string {
  const gates = ['A1','A2','A3','A4','A5','A6','A7','A8','B1','B2','B3','B4','B5','C1','C2','C3','C4'];
  return gates[Math.floor(Math.random() * gates.length)];
}

function randomStatus(): FlightRecord['status'] {
  const r = Math.random();
  if (r < 0.55) return 'on-time';
  if (r < 0.75) return 'delayed';
  if (r < 0.88) return 'departed';
  if (r < 0.95) return 'arrived';
  return 'scheduled';
}

function generateFlights(type: 'departure' | 'arrival'): FlightRecord[] {
  const now = new Date();
  const flights: FlightRecord[] = [];
  const hours = now.getHours();
  const mins = now.getMinutes();

  for (let i = -3; i < 12; i++) {
    const totalMins = hours * 60 + mins + i * 40 + Math.floor(Math.random() * 25) - 12;
    const h = Math.floor((totalMins % (24 * 60) + 24 * 60) % (24 * 60) / 60);
    const m = ((totalMins % 60) + 60) % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const airlineEntry = AIRLINES_FLYING_SDQ[Math.floor(Math.random() * AIRLINES_FLYING_SDQ.length)];
    const flightNum = airlineEntry.flights[Math.floor(Math.random() * airlineEntry.flights.length)];
    const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
    const airlineInfo = AIRLINE_MAP[airlineEntry.code] || { name: 'Airline', prefix: airlineEntry.code, icon: '✈' };
    const aircraftType = AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)];

    const status = i < -1 ? (Math.random() > 0.3 ? 'departed' : 'arrived') : randomStatus();
    const delay = status === 'delayed' ? Math.floor(Math.random() * 45) + 10 : 0;

    const delayMins = delay;
    const estimatedH = h + Math.floor((m + delayMins) / 60);
    const estimatedM = (m + delayMins) % 60;
    const estimatedTime = `${String(estimatedH % 24).padStart(2, '0')}:${String(estimatedM).padStart(2, '0')}`;

    const durationMins = route.duration;
    const durationH = Math.floor(durationMins / 60);
    const durationM = durationMins % 60;
    const durationStr = `${durationH}h ${durationM}m`;

    flights.push({
      callsign: flightNum.replace(/\s/g, ''),
      flightNumber: flightNum,
      airline: airlineInfo.name,
      aircraftType,
      origin: type === 'arrival' ? route.dest : 'SDQ',
      originCity: type === 'arrival' ? (CITY_MAP[route.dest] || route.dest) : 'Santo Domingo',
      destination: type === 'departure' ? route.dest : 'SDQ',
      destinationCity: type === 'departure' ? (CITY_MAP[route.dest] || route.dest) : 'Santo Domingo',
      scheduledTime: timeStr,
      estimatedTime,
      status,
      gate: randomGate(),
      terminal: 'T1',
      type,
      delay,
      flightDuration: durationStr,
    });
  }

  return flights.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

let cachedDepartures: FlightRecord[] = [];
let cachedArrivals: FlightRecord[] = [];
let lastFetch = 0;

export function getFlights(type: 'departure' | 'arrival'): FlightRecord[] {
  const now = Date.now();
  if (now - lastFetch > 60000) {
    cachedDepartures = generateFlights('departure');
    cachedArrivals = generateFlights('arrival');
    lastFetch = now;
  }
  return type === 'departure' ? cachedDepartures : cachedArrivals;
}

export async function fetchLiveAircraft(): Promise<LiveAircraft[]> {
  const lamin = 17.5, lomin = -71.0, lamax = 19.5, lomax = -68.0;
  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('OpenSky error');
    const json = await res.json();
    const states: LiveAircraft[] = [];
    for (const s of json.states || []) {
      if (s[5] == null || s[6] == null) continue;
      states.push({
        icao24: s[0] || '',
        callsign: (s[1] || '').trim(),
        lat: s[6],
        lon: s[5],
        altitude: s[7] || 0,
        heading: s[10] || 0,
        velocity: s[9] || 0,
        onGround: s[8] || false,
        originCountry: s[2] || '',
      });
    }
    return states;
  } catch {
    return generateMockAircraft();
  }
}

function generateMockAircraft(): LiveAircraft[] {
  const aircraft: LiveAircraft[] = [];
  const base = { lat: 18.4297, lon: -69.6689 };
  const count = 12 + Math.floor(Math.random() * 8);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = 0.15 + Math.random() * 1.5;
    const airlinePrefix = ['AAL', 'UAL', 'DAL', 'JBU', 'CMP', 'IBE', 'LAT', 'ACA', 'NK', 'SWR'][i % 10];
    aircraft.push({
      icao24: `mock${i}`,
      callsign: `${airlinePrefix}${100 + i * 47}`,
      lat: base.lat + Math.sin(angle) * dist,
      lon: base.lon + Math.cos(angle) * dist,
      altitude: 2000 + Math.random() * 8000,
      heading: (angle * 180 / Math.PI + 180 + Math.random() * 30 - 15) % 360,
      velocity: 180 + Math.random() * 420,
      onGround: dist < 0.08,
      originCountry: 'United States',
    });
  }
  return aircraft;
}
