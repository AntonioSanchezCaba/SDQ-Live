import type { WeatherData } from '../data/weather';

export function buildHUD(app: HTMLElement): HTMLElement {
  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.innerHTML = `
    <div class="hud-card" id="hud-clock-card">
      <div class="hud-airport-label">SDQ · MDSD</div>
      <div class="hud-airport-name">Las Américas</div>
      <div class="hud-terminal">International Airport</div>
      <div class="hud-clock" id="hud-clock">--:--:--</div>
      <div class="hud-date" id="hud-date">--</div>
    </div>
    <div class="hud-card" id="hud-weather-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div class="hud-airport-label">WEATHER · SDQ</div>
        <div style="font-size:9px;color:#475569" id="weather-updated">Updating...</div>
      </div>
      <div class="weather-row">
        <span class="weather-icon" id="weather-icon">🌤️</span>
        <div>
          <div class="weather-temp" id="weather-temp">--°C</div>
          <div class="weather-desc" id="weather-desc">Loading...</div>
        </div>
      </div>
      <div class="weather-stats">
        <div class="weather-stat">
          <span class="stat-label">Wind</span>
          <span class="stat-value" id="weather-wind">-- km/h</span>
        </div>
        <div class="weather-stat">
          <span class="stat-label">Humidity</span>
          <span class="stat-value" id="weather-humidity">--%</span>
        </div>
        <div class="weather-stat">
          <span class="stat-label">Visibility</span>
          <span class="stat-value" id="weather-vis">-- km</span>
        </div>
        <div class="weather-stat">
          <span class="stat-label">Wind Dir</span>
          <span class="stat-value" id="weather-winddir">--°</span>
        </div>
      </div>
    </div>
  `;
  app.appendChild(hud);
  startClock();
  return hud;
}

function startClock() {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function tick() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }));
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');

    const clockEl = document.getElementById('hud-clock');
    const dateEl = document.getElementById('hud-date');
    if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;
    if (dateEl) {
      dateEl.textContent = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} · AST`;
    }
  }

  tick();
  setInterval(tick, 1000);
}

export function updateWeather(data: WeatherData) {
  const set = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('weather-icon', data.icon);
  set('weather-temp', `${data.temperature}°C`);
  set('weather-desc', data.description);
  set('weather-wind', `${data.windspeed} km/h`);
  set('weather-humidity', `${data.humidity}%`);
  set('weather-vis', `${data.visibility} km`);
  set('weather-winddir', `${data.winddirection}°`);

  const updatedEl = document.getElementById('weather-updated');
  const now = new Date();
  if (updatedEl) {
    updatedEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}

export function buildHint(app: HTMLElement) {
  const hint = document.createElement('div');
  hint.id = 'hint';
  hint.textContent = 'Drag to orbit · Scroll to zoom';
  app.appendChild(hint);
}

export function buildAircraftBadge(app: HTMLElement): HTMLElement {
  const badge = document.createElement('div');
  badge.className = 'aircraft-count-badge';
  badge.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2 3.3 6.7l4 3-2 2-4-1-1.5 1.5 3 2 2 3 1.5-1.5-1-4 2-2 3 4z"/>
    </svg>
    <span id="aircraft-count">0 aircraft</span>
  `;
  app.appendChild(badge);
  return badge;
}

export function updateAircraftCount(count: number) {
  const el = document.getElementById('aircraft-count');
  if (el) el.textContent = `${count} aircraft tracked`;
}

export function buildTooltip(app: HTMLElement): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.id = 'aircraft-tooltip';
  tooltip.innerHTML = `
    <div class="tooltip-callsign" id="tooltip-callsign">--</div>
    <div class="tooltip-info" id="tooltip-info">--</div>
  `;
  app.appendChild(tooltip);
  return tooltip;
}

export function showTooltip(x: number, y: number, callsign: string, info: string) {
  const tooltip = document.getElementById('aircraft-tooltip');
  if (!tooltip) return;
  tooltip.style.display = 'block';
  tooltip.style.left = `${x + 12}px`;
  tooltip.style.top = `${y - 20}px`;
  const csEl = document.getElementById('tooltip-callsign');
  const infoEl = document.getElementById('tooltip-info');
  if (csEl) csEl.textContent = callsign || 'Unknown';
  if (infoEl) infoEl.innerHTML = info;
}

export function hideTooltip() {
  const tooltip = document.getElementById('aircraft-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

export function buildLoadingScreen(app: HTMLElement): HTMLElement {
  const loading = document.createElement('div');
  loading.id = 'loading';
  loading.innerHTML = `
    <div class="loading-logo">SDQ LIVE</div>
    <div class="loading-bar"><div class="loading-progress"></div></div>
    <div class="loading-text">Loading Las Américas Airport...</div>
  `;
  app.appendChild(loading);
  return loading;
}
