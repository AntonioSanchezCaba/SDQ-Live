import type { FlightRecord } from '../data/flights';

type Tab  = 'board' | 'track' | 'view';
type Mode = 'departure' | 'arrival';

export interface PanelState { tab: Tab; mode: Mode; selectedFlight: FlightRecord | null; }
let state: PanelState = { tab: 'board', mode: 'departure', selectedFlight: null };
let onTabChange:    (t: Tab)  => void = () => {};
let onModeChange:   (m: Mode) => void = () => {};
let onFlightSelect: (f: FlightRecord) => void = () => {};

export function buildPanel(app: HTMLElement) {
  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = `
    <div class="panel-header">
      <div class="brand">
        <div class="brand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2 3.3 6.7l4 3-2 2-4-1-1.5 1.5 3 2 2 3 1.5-1.5-1-4 2-2 3 4z"/>
          </svg>
        </div>
        <div>
          <div class="brand-name">SDQ LIVE</div>
          <div class="brand-sub">Las Américas Intl · MDSD</div>
        </div>
        <div class="live-badge"><span class="live-dot"></span>LIVE</div>
      </div>

      <div class="search-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="flight-search" type="text" placeholder="Search flight or destination…" />
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="board">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
          </svg>Board
        </button>
        <button class="tab" data-tab="track">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2 3.3 6.7l4 3-2 2-4-1-1.5 1.5 3 2 2 3 1.5-1.5-1-4 2-2 3 4z"/>
          </svg>Track
        </button>
        <button class="tab" data-tab="view">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z"/>
          </svg>3D View
        </button>
      </div>
    </div>

    <div class="panel-body" id="panel-body">
      <!-- Board tab content -->
      <div id="tab-board">
        <div id="featured-container"></div>
        <div class="toggle-row">
          <button class="tog active" data-mode="departure">Departures</button>
          <button class="tog" data-mode="arrival">Arrivals</button>
        </div>
        <div class="list-header">
          <span class="list-label" id="list-label">Live Departures · SDQ</span>
          <span class="refresh-indicator" id="refresh-indicator">Refreshing…</span>
        </div>
        <div class="flight-list" id="flight-list"></div>
        <div class="list-footer" id="list-footer"></div>
      </div>

      <!-- Track tab content -->
      <div id="tab-track" style="display:none">
        <div class="track-empty" id="track-content">
          <div class="track-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2 3.3 6.7l4 3-2 2-4-1-1.5 1.5 3 2 2 3 1.5-1.5-1-4 2-2 3 4z"/>
            </svg>
          </div>
          <p>Select a flight from the <strong>Board</strong> or click an aircraft in the 3D view to track it.</p>
        </div>
      </div>

      <!-- 3D View tab -->
      <div id="tab-view" style="display:none">
        <div class="view-shortcuts">
          <div class="shortcut-title">Camera Shortcuts</div>
          <button class="shortcut-btn" id="btn-overview">Overview</button>
          <button class="shortcut-btn" id="btn-tower">Control Tower</button>
          <button class="shortcut-btn" id="btn-runway">Runway 17/35</button>
          <button class="shortcut-btn" id="btn-terminal">Terminal Apron</button>
          <button class="shortcut-btn" id="btn-approach">South Approach</button>
        </div>
        <div class="view-info">
          <div class="vi-row"><span>Drag</span><span>Orbit camera</span></div>
          <div class="vi-row"><span>Scroll</span><span>Zoom in / out</span></div>
          <div class="vi-row"><span>Right-drag</span><span>Pan</span></div>
          <div class="vi-row"><span>Hover</span><span>Aircraft info</span></div>
          <div class="vi-row"><span>Click</span><span>Select & track</span></div>
        </div>
      </div>
    </div>`;
  app.appendChild(panel);

  wireTabButtons(panel);
  wireModeButtons(panel);
  wireViewButtons(panel);
  wireSearch(panel);
  updateGreeting();
  return panel;
}

function wireTabButtons(panel: HTMLElement) {
  panel.querySelectorAll<HTMLElement>('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset['tab'] as Tab;
      state.tab = tab;
      document.getElementById('tab-board')!.style.display = tab === 'board' ? '' : 'none';
      document.getElementById('tab-track')!.style.display = tab === 'track' ? '' : 'none';
      document.getElementById('tab-view')!.style.display  = tab === 'view'  ? '' : 'none';
      onTabChange(tab);
    });
  });
}

function wireModeButtons(panel: HTMLElement) {
  panel.querySelectorAll<HTMLElement>('.tog').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.tog').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset['mode'] as Mode;
      state.mode = mode;
      const lbl = document.getElementById('list-label');
      if (lbl) lbl.textContent = mode === 'departure' ? 'Live Departures · SDQ' : 'Live Arrivals · SDQ';
      onModeChange(mode);
    });
  });
}

function wireViewButtons(panel: HTMLElement) {
  const cams: Record<string, () => void> = {};
  panel.querySelectorAll<HTMLElement>('.shortcut-btn').forEach(btn => {
    btn.addEventListener('click', () => cams[btn.id]?.());
  });
  (panel as any)._cams = cams;
}

function wireSearch(panel: HTMLElement) {
  const input = panel.querySelector<HTMLInputElement>('#flight-search')!;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    panel.querySelectorAll<HTMLElement>('.flight-row').forEach(row => {
      const text = row.textContent?.toLowerCase() ?? '';
      row.style.display = (!q || text.includes(q)) ? '' : 'none';
    });
  });
}

function updateGreeting() {
  const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' })).getHours();
  const msg = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
  // Greeting is embedded in the brand sub-line, skip separate element
  const el = document.getElementById('greeting');
  if (el) el.textContent = msg;
}

// ─── Public render functions ──────────────────────────────────────────────────
export function renderFlightList(flights: FlightRecord[]) {
  const container = document.getElementById('flight-list');
  const footer = document.getElementById('list-footer');
  if (!container) return;

  const indicatorEl = document.getElementById('refresh-indicator');
  if (indicatorEl) {
    indicatorEl.textContent = 'Updated';
    setTimeout(() => { if (indicatorEl) indicatorEl.textContent = ''; }, 2000);
  }

  if (flights.length === 0) {
    container.innerHTML = `<div class="empty-list">No flights found</div>`;
    if (footer) footer.textContent = '';
    return;
  }

  const visible = flights.slice(0, 16);
  container.innerHTML = visible.map((f, i) => {
    const dest = state.mode === 'departure' ? f.destinationCity : f.originCity;
    const time = f.scheduledTime;
    const delay = f.delay > 0 ? `<span class="delay">+${f.delay}m</span>` : '';
    const statusClass = f.status;
    const statusIcon = { 'on-time': '●', delayed: '▲', departed: '↗', arrived: '↙', scheduled: '◆' }[f.status] ?? '◆';
    const selected = state.selectedFlight?.callsign === f.callsign ? ' selected' : '';
    return `
      <div class="flight-row${selected}" data-i="${i}">
        <div class="fr-time"><span class="fr-t">${time}</span>${delay}</div>
        <div class="fr-mid">
          <div class="fr-num">${f.flightNumber}</div>
          <div class="fr-dest">${dest}</div>
          <div class="fr-acft">${f.aircraftType}</div>
        </div>
        <div class="fr-right">
          <div class="fr-gate">${f.gate}</div>
          <div class="fr-status ${statusClass}">${statusIcon}</div>
        </div>
      </div>`;
  }).join('');

  if (footer) footer.textContent = `Showing ${visible.length} of ${flights.length} flights`;

  container.querySelectorAll<HTMLElement>('.flight-row').forEach((row, i) => {
    row.addEventListener('click', () => {
      state.selectedFlight = flights[i];
      onFlightSelect(flights[i]);
      renderFlightList(flights);
      renderFeaturedFlight(flights[i]);
      showTrackPane(flights[i]);
    });
  });
}

export function renderFeaturedFlight(f: FlightRecord) {
  const c = document.getElementById('featured-container');
  if (!c) return;
  const dep = f.type === 'departure';
  const orig = dep ? 'SDQ' : f.origin;
  const dest = dep ? f.destination : 'SDQ';
  const origCity = dep ? 'Santo Domingo' : f.originCity;
  const destCity = dep ? f.destinationCity : 'Santo Domingo';
  const statusLabel = {
    'on-time': '✓ ON TIME', delayed: `⚠ DELAYED +${f.delay}m`,
    departed: '↗ DEPARTED', arrived: '↙ ARRIVED', scheduled: '◆ SCHED',
  }[f.status] ?? f.status.toUpperCase();

  c.innerHTML = `
    <div class="feat-card">
      <div class="feat-top">
        <div class="feat-airline">${f.airline}</div>
        <div class="feat-num">${f.flightNumber}</div>
        <div class="feat-status ${f.status}">${statusLabel}</div>
      </div>
      <div class="feat-route">
        <div class="feat-airport">
          <div class="feat-code">${orig}</div>
          <div class="feat-city">${origCity}</div>
          <div class="feat-time">${f.scheduledTime}</div>
        </div>
        <div class="feat-line">
          <div class="feat-plane">✈</div>
          <div class="feat-dur">${f.flightDuration}</div>
        </div>
        <div class="feat-airport right">
          <div class="feat-code">${dest}</div>
          <div class="feat-city">${destCity}</div>
          <div class="feat-time">${f.estimatedTime}</div>
        </div>
      </div>
      <div class="feat-details">
        <div class="feat-detail"><span class="fd-lbl">Aircraft</span><span class="fd-val">${f.aircraftType}</span></div>
        <div class="feat-detail"><span class="fd-lbl">Gate</span><span class="fd-val">${f.gate}</span></div>
        <div class="feat-detail"><span class="fd-lbl">Terminal</span><span class="fd-val">${f.terminal}</span></div>
        <div class="feat-detail"><span class="fd-lbl">Duration</span><span class="fd-val">${f.flightDuration}</span></div>
      </div>
      ${f.delay > 0 ? `<div class="feat-warn">Delayed ${f.delay} min from scheduled time</div>` : ''}
    </div>`;
}

function showTrackPane(f: FlightRecord) {
  const el = document.getElementById('track-content');
  if (!el) return;
  el.innerHTML = `
    <div class="track-card">
      <div class="track-header">
        <span class="track-num">${f.flightNumber}</span>
        <span class="track-status ${f.status}">${f.status.toUpperCase().replace('-', ' ')}</span>
      </div>
      <div class="track-airline">${f.airline}</div>
      <div class="track-route">${f.originCity} → ${f.destinationCity}</div>
      <div class="track-stats">
        <div class="ts"><span class="ts-l">Dep</span><span class="ts-v">${f.scheduledTime}</span></div>
        <div class="ts"><span class="ts-l">Arr</span><span class="ts-v">${f.estimatedTime}</span></div>
        <div class="ts"><span class="ts-l">Gate</span><span class="ts-v">${f.gate}</span></div>
        <div class="ts"><span class="ts-l">A/C</span><span class="ts-v">${f.aircraftType}</span></div>
      </div>
      <div class="track-hint">Switch to the 3D view to watch this flight in the scene.</div>
    </div>`;
}

export function setCameraShortcuts(fns: Record<string, () => void>) {
  const panel = document.getElementById('panel') as any;
  if (panel?._cams) Object.assign(panel._cams, fns);
}

export function onTabChangeHandler(cb: (t: Tab) => void)  { onTabChange = cb; }
export function onModeChangeHandler(cb: (m: Mode) => void) { onModeChange = cb; }
export function onFlightSelectHandler(cb: (f: FlightRecord) => void) { onFlightSelect = cb; }
export function getState(): PanelState { return state; }
