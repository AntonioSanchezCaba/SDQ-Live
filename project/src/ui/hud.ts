import type { WeatherData } from '../data/weather';
import type { LiveAircraft } from '../data/flights';

// ─── Main HUD (top-right cards) ───────────────────────────────────────────────
export function buildHUD(app: HTMLElement) {
  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.innerHTML = `
    <div class="hud-card" id="hud-clock-card">
      <div class="hud-label">SDQ · MDSD</div>
      <div class="hud-airport">Las Américas</div>
      <div class="hud-sub">International Airport · Dominican Republic</div>
      <div class="hud-clock" id="hud-clock">--:--:--</div>
      <div class="hud-date"  id="hud-date">-- --- ---- · AST</div>
    </div>

    <div class="hud-card" id="hud-wx">
      <div class="hud-wx-header">
        <span class="hud-label">METAR · SDQ</span>
        <span class="hud-wx-updated" id="wx-updated"></span>
      </div>
      <div class="hud-wx-main">
        <span class="hud-wx-icon" id="wx-icon">🌤️</span>
        <div>
          <div class="hud-wx-temp" id="wx-temp">--°C</div>
          <div class="hud-wx-desc" id="wx-desc">Loading…</div>
        </div>
      </div>
      <div class="hud-wx-grid">
        <div class="wx-cell"><span class="wx-lbl">Wind</span><span class="wx-val" id="wx-wind">--</span></div>
        <div class="wx-cell"><span class="wx-lbl">Dir</span><span class="wx-val" id="wx-dir">--°</span></div>
        <div class="wx-cell"><span class="wx-lbl">RH</span><span class="wx-val" id="wx-rh">--%</span></div>
        <div class="wx-cell"><span class="wx-lbl">Vis</span><span class="wx-val" id="wx-vis">-- km</span></div>
      </div>
    </div>`;
  app.appendChild(hud);
  startClock();
}

function startClock() {
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function tick() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }));
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    const clk = document.getElementById('hud-clock');
    const dte = document.getElementById('hud-date');
    if (clk) clk.textContent = `${h}:${m}:${s}`;
    if (dte) dte.textContent = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()} · AST`;
  }
  tick(); setInterval(tick, 1000);
}

export function updateWeather(d: WeatherData) {
  const set = (id: string, v: string) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('wx-icon', d.icon);
  set('wx-temp', `${d.temperature}°C`);
  set('wx-desc', d.description);
  set('wx-wind', `${d.windspeed} km/h`);
  set('wx-dir',  `${d.winddirection}°`);
  set('wx-rh',   `${d.humidity}%`);
  set('wx-vis',  `${d.visibility} km`);
  const now = new Date();
  const up = document.getElementById('wx-updated');
  if (up) up.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

// ─── Hint bar ─────────────────────────────────────────────────────────────────
export function buildHint(app: HTMLElement) {
  const el = document.createElement('div');
  el.id = 'hint';
  el.innerHTML = `
    <span>Drag</span> orbit &nbsp;·&nbsp; <span>Scroll</span> zoom &nbsp;·&nbsp;
    <span>Click aircraft</span> to track`;
  app.appendChild(el);
}

// ─── Aircraft count badge ─────────────────────────────────────────────────────
export function buildAircraftBadge(app: HTMLElement) {
  const el = document.createElement('div');
  el.id = 'ac-badge';
  el.innerHTML = `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2 3.3 6.7l4 3-2 2-4-1-1.5 1.5 3 2 2 3 1.5-1.5-1-4 2-2 3 4z"/>
    </svg>
    <span id="ac-count">0 aircraft</span>`;
  app.appendChild(el);
}
export function updateAircraftCount(n: number) {
  const el = document.getElementById('ac-count');
  if (el) el.textContent = `${n} aircraft tracked`;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
export function buildTooltip(app: HTMLElement) {
  const el = document.createElement('div');
  el.id = 'tooltip';
  el.innerHTML = `<div id="tt-cs">--</div><div id="tt-info">--</div>`;
  app.appendChild(el);
}
export function showTooltip(x: number, y: number, callsign: string, info: string) {
  const el = document.getElementById('tooltip');
  if (!el) return;
  el.style.display = 'block';
  el.style.left = `${x + 14}px`;
  el.style.top  = `${y - 22}px`;
  const cs = document.getElementById('tt-cs');
  const inf = document.getElementById('tt-info');
  if (cs) cs.textContent = callsign || 'Unknown';
  if (inf) inf.innerHTML = info;
}
export function hideTooltip() {
  const el = document.getElementById('tooltip');
  if (el) el.style.display = 'none';
}

// ─── Mini radar (bottom-center) ───────────────────────────────────────────────
const RADAR_R = 90; // canvas radius in px

export function buildRadar(app: HTMLElement): HTMLCanvasElement {
  const wrap = document.createElement('div');
  wrap.id = 'radar-wrap';
  wrap.innerHTML = `
    <div class="radar-label">RADAR · SDQ</div>
    <canvas id="radar-canvas" width="${RADAR_R * 2}" height="${RADAR_R * 2}"></canvas>
    <div class="radar-range">±80 km</div>`;
  app.appendChild(wrap);
  drawRadarStatic();
  return document.getElementById('radar-canvas') as HTMLCanvasElement;
}

function drawRadarStatic() {
  const canvas = document.getElementById('radar-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const cx = RADAR_R, cy = RADAR_R;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // BG
  ctx.beginPath(); ctx.arc(cx, cy, RADAR_R - 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(3,8,18,0.92)'; ctx.fill();

  // Range rings
  for (const r of [RADAR_R * 0.25, RADAR_R * 0.5, RADAR_R * 0.75, RADAR_R - 2]) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,200,150,0.15)'; ctx.lineWidth = 0.8; ctx.stroke();
  }
  // Cross-hairs
  ctx.strokeStyle = 'rgba(0,200,150,0.12)'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(cx, 2); ctx.lineTo(cx, RADAR_R * 2 - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, cy); ctx.lineTo(RADAR_R * 2 - 2, cy); ctx.stroke();

  // Airport dot (center)
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#00e8c0'; ctx.fill();

  // Border
  ctx.beginPath(); ctx.arc(cx, cy, RADAR_R - 1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,200,150,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
}

export function updateRadar(canvas: HTMLCanvasElement, aircraft: LiveAircraft[], sweepAngle: number) {
  const ctx = canvas.getContext('2d')!;
  const cx = RADAR_R, cy = RADAR_R;
  const rangeKm = 80; // km radius shown

  // Redraw static elements
  drawRadarStatic();

  // Sweep line
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(sweepAngle);
  const sweep = ctx.createLinearGradient(0, 0, 0, -RADAR_R);
  sweep.addColorStop(0, 'rgba(0,232,192,0.5)');
  sweep.addColorStop(1, 'rgba(0,232,192,0)');
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -(RADAR_R - 2));
  ctx.strokeStyle = 'rgba(0,232,192,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Sweep trail
  for (let a = 0; a < Math.PI / 2; a += 0.04) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    const r = RADAR_R - 2;
    ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 - a, false);
    ctx.strokeStyle = `rgba(0,232,192,${0.03 - a * 0.04})`;
    ctx.lineWidth = 0.5; ctx.stroke();
  }
  ctx.restore();

  // Aircraft blips
  const SDQ_LAT = 18.4297, SDQ_LON = -69.6689;
  for (const ac of aircraft) {
    const dLat = ac.lat - SDQ_LAT;
    const dLon = ac.lon - SDQ_LON;
    const dxKm = dLon * 111.32 * Math.cos(SDQ_LAT * Math.PI / 180);
    const dyKm = dLat * 111.32;
    const dist = Math.sqrt(dxKm * dxKm + dyKm * dyKm);
    if (dist > rangeKm) continue;
    const px = cx + (dxKm / rangeKm) * (RADAR_R - 8);
    const py = cy - (dyKm / rangeKm) * (RADAR_R - 8);

    ctx.beginPath(); ctx.arc(px, py, ac.onGround ? 2 : 2.8, 0, Math.PI * 2);
    ctx.fillStyle = ac.onGround ? '#ffa030' : '#00e8c0'; ctx.fill();
    // Glow
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = ac.onGround ? 'rgba(255,160,48,0.15)' : 'rgba(0,232,192,0.15)'; ctx.fill();
  }
}

// ─── Loading screen ───────────────────────────────────────────────────────────
export function buildLoadingScreen(app: HTMLElement): HTMLElement {
  const el = document.createElement('div');
  el.id = 'loading';
  el.innerHTML = `
    <div class="ld-logo">SDQ LIVE</div>
    <div class="ld-airport">Las Américas International Airport</div>
    <div class="ld-bar"><div class="ld-progress"></div></div>
    <div class="ld-text">Initialising 3D scene…</div>`;
  app.appendChild(el);
  return el;
}
