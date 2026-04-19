import type { FlightRecord } from '../data/flights';

type TabType = 'board' | 'track' | 'view';
type ModeType = 'departure' | 'arrival';

export interface PanelState {
  tab: TabType;
  mode: ModeType;
  selectedFlight: FlightRecord | null;
}

let state: PanelState = {
  tab: 'board',
  mode: 'departure',
  selectedFlight: null,
};

let onTabChange: (tab: TabType) => void = () => {};
let onModeChange: (mode: ModeType) => void = () => {};
let onFlightSelect: (f: FlightRecord) => void = () => {};

export function buildPanel(app: HTMLElement): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = `
    <div class="panel-header">
      <div class="brand">
        <div class="brand-logo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2 3.3 6.7l4 3-2 2-4-1-1.5 1.5 3 2 2 3 1.5-1.5-1-4 2-2 3 4z"/>
          </svg>
        </div>
        <span class="brand-name">SDQ Live</span>
      </div>
      <div class="greeting" id="greeting">Good morning</div>
      <div class="airport-name">Las Américas International Airport · MDSD</div>
      <div class="search-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Track a flight (AA1234) or search..." id="flight-search" />
      </div>
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="board">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
          </svg>
          Live Board
        </button>
        <button class="tab-btn" data-tab="track">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2 3.3 6.7l4 3-2 2-4-1-1.5 1.5 3 2 2 3 1.5-1.5-1-4 2-2 3 4z"/>
          </svg>
          Track Flight
        </button>
        <button class="tab-btn" data-tab="view">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z"/>
          </svg>
          Airport View
        </button>
      </div>
    </div>
    <div class="panel-scroll" id="panel-scroll">
      <div id="featured-flight-container"></div>
      <div class="mode-toggle">
        <button class="mode-btn active" data-mode="departure">Departures</button>
        <button class="mode-btn" data-mode="arrival">Arrivals</button>
      </div>
      <div class="section-header">
        <span class="section-title" id="section-title">Live Departures · SDQ</span>
        <span class="live-indicator">
          <span class="live-dot"></span>
          LIVE
        </span>
      </div>
      <div class="flight-list" id="flight-list"></div>
      <div class="flight-count" id="flight-count">Loading flights...</div>
    </div>
  `;
  app.appendChild(panel);

  setupTabHandlers(panel);
  setupModeHandlers(panel);
  updateGreeting();

  return panel;
}

function setupTabHandlers(panel: HTMLElement) {
  panel.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = (btn as HTMLElement).dataset.tab as TabType;
      state.tab = tab;
      onTabChange(tab);
    });
  });
}

function setupModeHandlers(panel: HTMLElement) {
  panel.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = (btn as HTMLElement).dataset.mode as ModeType;
      state.mode = mode;
      const titleEl = document.getElementById('section-title');
      if (titleEl) {
        titleEl.textContent = mode === 'departure' ? 'Live Departures · SDQ' : 'Live Arrivals · SDQ';
      }
      onModeChange(mode);
    });
  });
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17 && hour < 21) greeting = 'Good evening';
  else if (hour >= 21 || hour < 5) greeting = 'Good night';
  const el = document.getElementById('greeting');
  if (el) el.textContent = greeting;
}

export function renderFlightList(flights: FlightRecord[]) {
  const container = document.getElementById('flight-list');
  const countEl = document.getElementById('flight-count');

  if (!container) return;

  if (flights.length === 0) {
    container.innerHTML = `<div style="padding:20px;text-align:center;color:#475569;font-size:12px;">No flights found</div>`;
    if (countEl) countEl.textContent = '0 flights';
    return;
  }

  const displayFlights = flights.slice(0, 15);

  container.innerHTML = displayFlights.map((f, i) => {
    const delayText = f.delay > 0 ? ` +${f.delay}m` : '';
    const isDelayed = f.status === 'delayed';
    const isDeparted = f.status === 'departed' || f.status === 'arrived';

    return `
      <div class="flight-row ${state.selectedFlight?.callsign === f.callsign ? 'selected' : ''}" data-index="${i}">
        <div class="fl-left">
          <div class="fl-time">${f.scheduledTime}${isDelayed ? `<span class="fl-delay">${delayText}</span>` : ''}</div>
          <div class="fl-number">${f.flightNumber}</div>
        </div>
        <div class="fl-middle">
          <div class="fl-dest">${state.mode === 'departure' ? f.destinationCity : f.originCity}</div>
          <div class="fl-aircraft">${f.aircraftType}</div>
        </div>
        <div class="fl-right">
          <div class="fl-gate">${f.gate}</div>
          <span class="fl-status ${f.status}">${f.status === 'on-time' ? '✓' : f.status === 'delayed' ? '⚠' : f.status === 'departed' ? '↗' : f.status === 'arrived' ? '↙' : '◆'}</span>
        </div>
      </div>
    `;
  }).join('');

  if (countEl) {
    const displayCount = Math.min(displayFlights.length, flights.length);
    countEl.textContent = `Showing ${displayCount} of ${flights.length} flights`;
  }

  container.querySelectorAll('.flight-row').forEach((row, i) => {
    row.addEventListener('click', () => {
      state.selectedFlight = flights[i];
      onFlightSelect(flights[i]);
      renderFlightList(flights);
      renderFeaturedFlight(flights[i]);
    });
  });
}

export function renderFeaturedFlight(f: FlightRecord) {
  const container = document.getElementById('featured-flight-container');
  if (!container) return;

  const isDep = f.type === 'departure';
  const durationStr = f.flightDuration;

  container.innerHTML = `
    <div class="featured-flight">
      <div class="flight-card-header">
        <div>
          <span class="airline-badge">${f.airline}</span>
          <span class="flight-code">${f.flightNumber}</span>
        </div>
        <span class="status-badge ${f.status}">${
          f.status === 'on-time' ? '✓ ON TIME' :
          f.status === 'delayed' ? `⚠ DELAYED +${f.delay}m` :
          f.status === 'departed' ? '↗ DEPARTED' :
          f.status === 'arrived' ? '↙ ARRIVED' :
          '◆ SCHEDULED'
        }</span>
      </div>
      <div class="flight-route">
        <div class="route-endpoint">
          <div class="airport-code">${isDep ? 'SDQ' : f.origin}</div>
          <div class="airport-city">${isDep ? 'Santo Domingo' : f.originCity}</div>
          <div class="flight-time">${f.scheduledTime}</div>
        </div>
        <div class="route-divider">
          <div class="route-line"></div>
          <div class="route-duration">${durationStr}</div>
        </div>
        <div class="route-endpoint end">
          <div class="airport-code">${isDep ? f.destination : 'SDQ'}</div>
          <div class="airport-city">${isDep ? f.destinationCity : 'Santo Domingo'}</div>
          <div class="flight-time">${f.estimatedTime}</div>
        </div>
      </div>
      <div class="flight-card-details">
        <div class="detail-group">
          <div class="detail-item">
            <span class="detail-label">Aircraft Type</span>
            <span class="detail-value">${f.aircraftType}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Gate</span>
            <span class="detail-value">${f.gate}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Terminal</span>
            <span class="detail-value">${f.terminal}</span>
          </div>
        </div>
      </div>
      ${f.delay > 0 ? `<div class="flight-warning">Delayed by ${f.delay} minutes from scheduled departure</div>` : ''}
    </div>
  `;
}

export function onTabChangeHandler(cb: (tab: TabType) => void) {
  onTabChange = cb;
}

export function onModeChangeHandler(cb: (mode: ModeType) => void) {
  onModeChange = cb;
}

export function onFlightSelectHandler(cb: (f: FlightRecord) => void) {
  onFlightSelect = cb;
}

export function getState(): PanelState {
  return state;
}
