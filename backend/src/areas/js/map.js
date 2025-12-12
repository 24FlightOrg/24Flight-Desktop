const imageWidth = 14453;
const imageHeight = 13800;

const imageBounds = [
  [0, 0],
  [imageHeight, imageWidth]
];

const mapMinZoom = 0;
const mapMaxZoom = 5;

const mapMaxResolution = 2.0;
const mapMinResolution = Math.pow(2, mapMaxZoom) * mapMaxResolution;

const mapExtent = [0, imageHeight, imageWidth, 0];
const tileExtent = [0, imageHeight, imageWidth, 0];

const crs = L.CRS.Simple;

crs.transformation = new L.Transformation(1, -tileExtent[0], -1, tileExtent[3] + imageHeight);
crs.scale = function (zoom) {
  return Math.pow(2, zoom) / mapMinResolution;
};
crs.zoom = function (scale) {
  return Math.log(scale * mapMinResolution) / Math.LN2;
};

const map = L.map('map', {
  crs: crs,
  minZoom: mapMinZoom,
  maxZoom: mapMaxZoom,
  zoomSnap: 0.25,
  attributionControl: false,
  zoomControl: false
});

const tileLayer = L.tileLayer('https://prod.24flight.org/ptfs/regular/{z}/{x}/{y}.png', {
  minZoom: mapMinZoom,
  maxZoom: mapMaxZoom,
  tileSize: L.point(256, 512),
  noWrap: true,
  tms: false,
  nativeZooms: [1, 2, 3, 4, 5]
}).addTo(map);

map.fitBounds([
  crs.unproject(L.point(mapExtent[2], mapExtent[3])),
  crs.unproject(L.point(mapExtent[0], mapExtent[1]))
]);

map.setView(crs.unproject(L.point(imageWidth / 2, imageHeight / 2)), 2);

const airspaceImageBounds = [[0, 0], [imageHeight, imageWidth]];

let waypointsEnabled = true;
let waypointMarkers = [];
let airportMarkers = [];
let selectedAircraftCallsign = null;
// Currently opened airport sidebar ICAO (or null)
let selectedAirportCode = null;
let iconurl = null;
let iconcss = null;

// Global window management system
let currentMaxZIndex = 2000;

function bringWindowToFront(windowElement) {
  currentMaxZIndex += 1;
  windowElement.style.zIndex = currentMaxZIndex;
}

// Window state management utilities
function saveWindowState(windowName, windowElement) {
  if (!windowElement) return;
  
  const state = {
    left: parseInt(windowElement.style.left) || 0,
    top: parseInt(windowElement.style.top) || 0,
    width: parseInt(windowElement.style.width) || 400,
    height: parseInt(windowElement.style.height) || 300
  };
  
  localStorage.setItem(`${windowName}WindowState`, JSON.stringify(state));
}

function loadWindowState(windowName, windowElement, defaultState = {}) {
  if (!windowElement) return defaultState;
  
  try {
    const saved = localStorage.getItem(`${windowName}WindowState`);
    if (saved) {
      const state = JSON.parse(saved);
      // Validate that the values are reasonable
      if (state.left >= 0 && state.top >= 0 && state.width > 0 && state.height > 0) {
        return state;
      }
    }
  } catch (e) {
    console.warn(`Failed to load window state for ${windowName}:`, e);
  }
  
  return defaultState;
}

function applyWindowState(windowElement, state) {
  if (!windowElement || !state) return;
  
  windowElement.style.left = `${state.left}px`;
  windowElement.style.top = `${state.top}px`;
  windowElement.style.width = `${state.width}px`;
  windowElement.style.height = `${state.height}px`;
}

class NotificationManager {
    constructor(containerId = 'notification-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Notification container not found.');
        }
    }

    show(message, duration = 5000) {
        if (!this.container) return;

        const notification = document.createElement('div');
        notification.className = 'notification';

        const messageElement = document.createElement('span');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '&times;';
        
        const removeNotification = () => {
            notification.style.animation = 'fadeOut 0.3s ease-in forwards';
            notification.addEventListener('animationend', () => {
                notification.remove();
            });
        };

        closeButton.onclick = removeNotification;

        notification.appendChild(messageElement);
        notification.appendChild(closeButton);

        this.container.appendChild(notification);

        const timeoutId = setTimeout(() => {
            if (document.body.contains(notification)) {
                removeNotification();
            }
        }, duration);

        notification.addEventListener('mouseenter', () => clearTimeout(timeoutId));
    }
}

let notifier;

let wsRequestId = 0;
const wsPending = new Map();

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

let ws;
if (isLocalhost) {
  ws = new WebSocket(`ws://localhost:8081`);
} else {
  ws = new WebSocket(`wss://24flight.org/ws`);
}

//this.ws = new WebSocket(`ws://localhost:8081`);

const ptfsBounds = {
  top_left: { x: -49222.1, y: -45890.8 },
  bottom_right: { x: 47132.9, y: 46139.2 }
};

const flightPlans = new Map();

// Global storage populated from backend websocket messages
// controllersData: object keyed by controller id or sector name
// atisData: array of ATIS entries
let controllersData = {};
let atisData = [];

const ptfsCenter = {
  x: (ptfsBounds.top_left.x + ptfsBounds.bottom_right.x) / 2,
  y: (ptfsBounds.top_left.y + ptfsBounds.bottom_right.y) / 2
};

const ptfsWidth = ptfsBounds.bottom_right.x - ptfsBounds.top_left.x;
const ptfsHeight = ptfsBounds.bottom_right.y - ptfsBounds.top_left.y;

const scaleX = imageWidth / ptfsWidth;
const scaleY = imageHeight / ptfsHeight;
const scale = Math.min(scaleX, scaleY);

function apiPositionToLatLng(apiX, apiY) {
  const offsetY = 8;
  const adjustedY = apiY - offsetY;
  const dx = apiX - ptfsCenter.x;
  const dy = adjustedY - ptfsCenter.y;
  const mapX = (imageWidth / 2) + dx * scale;
  const mapY = (imageHeight / 2) - dy * scale;
  return [mapY, mapX];
}

function waypointPositionToLatLng(px, py) {
  return [imageHeight - py, px];
}

const aircraftMarkers = new Map();
const aircraftUpdateIntervals = new Map();
const aircraftTrailLayers = new Map();
const aircraftTrailVisible = new Map();

const tileLayerGroup = L.layerGroup().addTo(map);
const loadedTiles = new Set();

document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('showAirspaces') === 'true') {
    const zoomOutFactor = 1.25;
    const southWestPx = [
      imageBounds[0][0] - (imageHeight * (zoomOutFactor - 1) / 2),
      imageBounds[0][1] - (imageWidth * (zoomOutFactor - 1) / 2)
    ];
    const northEastPx = [
      imageBounds[1][0] + (imageHeight * (zoomOutFactor - 1) / 2),
      imageBounds[1][1] + (imageWidth * (zoomOutFactor - 1) / 2)
    ];

    const southWest = crs.unproject(L.point(southWestPx[1], southWestPx[0])); // [lng, lat]
    const northEast = crs.unproject(L.point(northEastPx[1], northEastPx[0]));

    const expandedBounds = [southWest, northEast];
    map.createPane('airspaceboundaries');
    map.getPane('airspaceboundaries').style.zIndex = 500;

    L.imageOverlay("/unified/images/map/boundaries.png", expandedBounds, {
      pane: 'airspaceboundaries',
      opacity: 0.7
    }).addTo(map);
  }
});

map.on("click", () => {
  document.getElementById("flight-sidebar").classList.add("hidden");
  document.getElementById("aircraft-sidebar").classList.add("hidden");
  hideAirportSidebar();
  selectedAircraftCallsign = null;
  
  // Clear the sidebar update interval
  if (window.sidebarUpdateInterval) {
    clearInterval(window.sidebarUpdateInterval);
    window.sidebarUpdateInterval = null;
  }
  
  for (const [callsign, polyline] of aircraftTrailLayers.entries()) {
    if (map.hasLayer(polyline)) {
      map.removeLayer(polyline);
    }
    aircraftTrailVisible.set(callsign, false);
  }
});

function getVerticalSpeedArrow(vs) {
    if (typeof vs !== 'number') return '';
    if (vs > 100) return '▲';
    if (vs < -100) return '▼';
    return '';
}

function formatFlightPlans(planArray) {
  return planArray.reduce((acc, currentPlan) => {
    if (currentPlan.robloxName) {
      acc[currentPlan.robloxName] = currentPlan;
    }
    return acc;
  }, {});
}

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.requestId && wsPending.has(msg.requestId)) {
    wsPending.get(msg.requestId)(msg);
    wsPending.delete(msg.requestId);
    return;
  }

  switch (msg.type) {
    case 'acft':
      if (msg.payload) {
        handleAircraftUpdate(msg.payload);
      }
      break;

    case 'eventacft':
      if (msg.payload) {
        // ur supposed to handle the event stuff but eh its event who really cares rn?
      }
      break;

    case 'flightplans':
      if (msg.payload && Array.isArray(msg.payload)) {
        const formattedPlans = formatFlightPlans(msg.payload);
        updateFlightPlans(formattedPlans);
      }
      break;

    case 'eventflightplans':
      if (msg.payload && Array.isArray(msg.payload)) {
        const formattedPlans = formatFlightPlans(msg.payload);
        //supposed to update fpl here but this is event remember smart one
      }
      break;

    case 'controllers':
      if (msg.payload) {
        // Store controllers payload for use across the frontend
        try {
          controllersData = msg.payload || {};
        } catch (e) {
          console.warn('Failed to set controllersData from websocket payload', e);
          controllersData = {};
        }
      }
      break;

    case 'atis':
      if (msg.payload) {
        // Store ATIS list (expecting an array)
        try {
          atisData = Array.isArray(msg.payload) ? msg.payload : [];
        } catch (e) {
          console.warn('Failed to set atisData from websocket payload', e);
          atisData = [];
        }
      }
      break;

    case 'notification':
      if (msg.payload && msg.duration) {
        if (localStorage.getItem('enableNotifications') == 'false') break;
        notifier.show(msg.payload, msg.duration || 5000);
      }
      break;

    default:
      console.log("cooked websocket:", msg);
      break;
  }
};

ws.onclose = () => {
  notifier.show("Connection lost. Please refresh the page.", 10000000000000);
};

ws.onerror = (err) => {
  notifier.show("Connection error. Please refresh the page.", 100000000000000);
}

function wsSend(type, data) {
  return new Promise((resolve) => {
    const requestId = ++wsRequestId;
    wsPending.set(requestId, resolve);
    ws.send(JSON.stringify({ type, requestId, ...data }));
  });
}

async function fetchAircraftPath(callsign) {
  const msg = await wsSend("getAircraftPath", { callsign });
  if (!msg.ok) {
    console.error(`Failed to fetch path for ${callsign}:`, msg.error);
    return null;
  }
  return msg.points.map(p => apiPositionToLatLng(p.x, p.y));
}

async function getOrInitAircraftPath(callsign) {
  let path = await fetchAircraftPath(callsign);
  if (!path) {
    path = [];
  }
  return path;
}

function offsetLatLng(lat, lng, pxDown) {
    const point = map.latLngToLayerPoint([lat, lng]);
    const offsetPoint = L.point(point.x, point.y + pxDown);
    return map.layerPointToLatLng(offsetPoint);
}

async function handleAircraftUpdate(aircraft) {
  window.lastAircraftData = aircraft;

  const firstAircraft = Object.values(aircraft)[0];
  let windText = "Wind data unavailable";
  if (firstAircraft?.wind && /^\d{1,3}\/\d{1,3}$/.test(firstAircraft.wind)) {
    const [dir, spd] = firstAircraft.wind.split("/").map(Number);
    windText = `${dir}° @ ${spd}kts`;
  }
  document.getElementById("wind-info").textContent = windText;

  await plotAircraft(aircraft);
  await updateVisibleAircraftTrails();

  const sidebar = document.getElementById("flight-sidebar");
  if (selectedAircraftCallsign && !sidebar.classList.contains("hidden")) {
    const aircraftData = aircraft[selectedAircraftCallsign];
    const flightPlan = flightPlans.get(aircraftData?.playerName);
    await updateSidebarData(selectedAircraftCallsign, aircraftData, flightPlan);
  }

  if (vnasManager) {
    vnasManager.updateAircraftData();
  }

  if (flightPlanManager) {
    flightPlanManager.updateAircraftData();
  }

  const aircraftSidebar = document.getElementById("aircraft-sidebar");
  if (aircraftSidebar && !aircraftSidebar.classList.contains("hidden")) {
    aircraftSidebarManager.updateAircraftData(aircraft);
  }
}

/**
 * Show the airport sidebar and adjust the map layout.
 * Centralizes all show/hide behavior so that map class toggles and
 * Leaflet invalidateSize() are always applied.
 * @param {string} code ICAO code or identifier
 * @param {string} name Display name for the airport
 */
function showAirportSidebar(code, name) {
  const sidebar = document.getElementById('airport-sidebar');
  // Hide other sidebars consistently
  try { document.getElementById('flight-sidebar')?.classList.add('hidden'); } catch (e) {}
  try { document.getElementById('aircraft-sidebar')?.classList.add('hidden'); } catch (e) {}
  for (const [callsign, polyline] of aircraftTrailLayers.entries()) {
    if (map.hasLayer(polyline)) {
      map.removeLayer(polyline);
    }
    aircraftTrailVisible.set(callsign, false);
  }

  try {
    if (window.sidebarUpdateInterval) {
      clearInterval(window.sidebarUpdateInterval);
      window.sidebarUpdateInterval = null;
    }
  } catch (e) {}
  selectedAircraftCallsign = null;

  selectedAirportCode = code;
  if (sidebar) {
    sidebar.style.left = '';
    sidebar.style.right = '';
    sidebar.classList.remove('hidden');
  }

  try { updateAirportSidebarData(code, name); } catch (e) { console.warn('Failed to update airport sidebar', e); }
}

function hideAirportSidebar() {
  const sidebar = document.getElementById('airport-sidebar');
  if (sidebar) sidebar.classList.add('hidden');
  selectedAirportCode = null;
}

function updateFlightPlans(plans) {
  flightPlans.clear();
  for (const [robloxName, plan] of Object.entries(plans)) {
    flightPlans.set(robloxName, plan);
  }
  
  if (flightPlanManager) {
    flightPlanManager.updateAircraftData();
  }
}

async function updateVisibleAircraftTrails() {
  for (const [callsign, visible] of aircraftTrailVisible.entries()) {
    if (visible) {
      const polyline = aircraftTrailLayers.get(callsign);
      if (polyline) {
        const newPath = await fetchAircraftPath(callsign);
        if (newPath && newPath.length) {
          polyline.setLatLngs(newPath);
        }
      }
    }
  }
}

const sidebarElements = {
  routeLabel: document.getElementById("route-label"),
  callsign: document.getElementById("callsign"),
  aircraftType: document.getElementById("aircraft-type"),
  Route: document.getElementById("Route"),
  FlightLevel: document.getElementById("FlightLevel"),
  FlightRules: document.getElementById("FlightRules"),
  aircraftImage: document.getElementById("aircraft-image"),
  aircraftTypeFull: document.getElementById("aircraft-type-full"),
  Pilot: document.getElementById("Pilot"),
  altitude: document.getElementById("altitude"),
  verticalSpeed: document.getElementById("vertical speed"),
  coordinates: document.getElementById("coordinates"),
  speed: document.getElementById("speed"),
  groundSpeed: document.getElementById("groundspeed"),
  FIRUIR: document.getElementById("FIR-UIR"),
  track: document.getElementById("track"),
  Radar: document.getElementById("Radar"),
};

async function updateSidebarData(callsign, ac, flightPlan) {
  if (!ac) return;

  if (flightPlan) {
    sidebarElements.routeLabel.textContent = `${flightPlan.departing} → ${flightPlan.arriving}`;
    sidebarElements.callsign.textContent = flightPlan.callsign || "N/A";
    sidebarElements.aircraftType.textContent = flightPlan.aircraft || "N/A";
    sidebarElements.Route.textContent = flightPlan.route || "N/A";
    sidebarElements.FlightLevel.textContent = flightPlan.flightlevel ? `FL${flightPlan.flightlevel}` : "N/A";
    sidebarElements.FlightRules.textContent = flightPlan.flightrules || "N/A";
  } else {
    sidebarElements.routeLabel.textContent = "NO FLIGHT PLAN";
    sidebarElements.callsign.textContent = callsign || "N/A";
    sidebarElements.aircraftType.textContent = ac.aircraftType || "N/A";
    sidebarElements.Route.textContent = "N/A";
    sidebarElements.FlightLevel.textContent = "N/A";
    sidebarElements.FlightRules.textContent = "N/A";
  }

  sidebarElements.aircraftImage.src = "/unified/images/plane/vulcanlong.png";
  sidebarElements.aircraftTypeFull.textContent = ac.aircraftType || "N/A";
  sidebarElements.Pilot.textContent = ac.playerName || "N/A";
  sidebarElements.altitude.textContent = ac.altitude ? `${ac.altitude} ft` : "0 ft";
  sidebarElements.verticalSpeed.textContent = ac.verticalSpeed ? `${ac.verticalSpeed} ft/min` : "0 ft/min";
  sidebarElements.coordinates.textContent = ac.position?.x !== undefined && ac.position?.y !== undefined
    ? `(${ac.position.x}, ${ac.position.y})` : "(?, ?)";
  sidebarElements.speed.textContent = ac.speed ? `${ac.speed} kt` : "0 kt";
  sidebarElements.groundSpeed.textContent = ac.groundSpeed ? `${ac.groundSpeed} kt` : "0 kt";
  sidebarElements.FIRUIR.textContent = apiPositionToLatLng(ac.position.x, ac.position.y) || "N/A";
  sidebarElements.track.textContent = `${ac.heading || 0}°`;
  sidebarElements.Radar.textContent = ac.playerName || "N/A";
}

/**
 * Count departures and arrivals for a given airport ICAO.
 * @param {string} airportCode
 * @returns {{departures:number,arrivals:number}}
 */

function countAirportTraffic(airportCode) {
  const result = { departures: 0, arrivals: 0 };
  if (!airportCode) return result;
  try {
    // Count only currently spawned aircraft that have flight plans.
    // We iterate over the latest aircraft data (window.lastAircraftData) and check
    // whether each aircraft has an associated flight plan in the flightPlans Map.
    const aircraftData = window.lastAircraftData || {};
    const code = String(airportCode || '').toUpperCase();
    for (const ac of Object.values(aircraftData)) {
      if (!ac) continue;
      try {
        const plan = flightPlans.get(ac.playerName);
        if (!plan) continue;
        if (String(plan.departing || '').toUpperCase() === code) result.departures++;
        if (String(plan.arriving || '').toUpperCase() === code) result.arrivals++;
      } catch (e) {
        // ignore malformed entries
      }
    }
  } catch (e) {
    console.warn('countAirportTraffic error', e);
  }
  return result;
}

/**
 * Populate the airport sidebar with ATIS, controllers and traffic counts.
 * @param {string} airportCode
 * @param {string} airportName
 */

function updateAirportSidebarData(airportCode, airportName) {
  const nameEl = document.getElementById('airport-name');
  const codeEl = document.getElementById('airport-code');
  const atisEl = document.getElementById('airport-atis');
  const controllersEl = document.getElementById('airport-controllers');
  const depEl = document.getElementById('airport-departures');
  const arrEl = document.getElementById('airport-arrivals');

  if (nameEl) nameEl.textContent = airportName || airportCode || 'Unknown Airport';
  if (codeEl) codeEl.textContent = airportCode || '';

  // Traffic counts
  const counts = countAirportTraffic(airportCode);
  if (depEl) depEl.textContent = String(counts.departures);
  if (arrEl) arrEl.textContent = String(counts.arrivals);

  // ATIS lookup (try a few common property names) and beautify output
  try {
    if (atisEl) atisEl.innerHTML = '';
    const codeU = String(airportCode || '').toUpperCase();
    const appendNoAtis = () => {
      if (atisEl) {
        const span = document.createElement('div');
        span.textContent = 'No ATIS available';
        atisEl.appendChild(span);
      }
    };

    let matches = [];

    // If atisData is an array, try exact field matches first
    if (Array.isArray(atisData)) {
      matches = atisData.filter(a => a && (
        String(a.icao || a.code || a.ident || a.station || a.airport || '').toUpperCase() === codeU
      ));

      // If none found, try substring search across the serialized object
      if (matches.length === 0) {
        matches = atisData.filter(a => {
          try {
            return JSON.stringify(a).toUpperCase().includes(codeU);
          } catch (e) {
            return false;
          }
        });
      }
    } else if (atisData && typeof atisData === 'object') {
      // If atisData is an object keyed by airport codes or similar
      const direct = atisData[codeU] || atisData[codeU.toLowerCase()] || atisData[airportCode];
      if (direct) {
        matches = [direct];
      } else {
        // Search values for potential matches
        matches = Object.values(atisData).filter(a => {
          try {
            return JSON.stringify(a).toUpperCase().includes(codeU);
          } catch (e) {
            return false;
          }
        });
      }
    } else if (typeof atisData === 'string') {
      if (atisData.toUpperCase().includes(codeU)) matches = [atisData];
    }

    if (matches.length === 0) {
      appendNoAtis();
      // Clear editor placeholder when no ATIS
      try {
        const ph = document.getElementById('atis-editor-placeholder');
        if (ph) ph.textContent = '(none)';
      } catch (e) {}
    } else {
      // Fill the Editor placeholder with the editor from the first match if present
      try {
        const first = matches[0];
        let editorVal = first && (first.editor || first.edited_by || first.editor_name || first.author || first.by || first.owner);
        // Try nested places
        if (!editorVal && first && first.message && typeof first.message === 'object') {
          editorVal = first.message.editor || first.message.author || null;
        }
        const ph = document.getElementById('atis-editor-placeholder');
        if (ph) ph.textContent = editorVal ? String(editorVal) : '(none)';
      } catch (e) {
        // ignore
      }

      // Render all matches
      matches.forEach(m => {
        const block = beautifyAtis(m);
        if (atisEl) atisEl.appendChild(block);
      });
    }
  } catch (e) {
    console.warn('updateAirportSidebarData: atis lookup failed', e);
    if (atisEl) atisEl.textContent = 'N/A';
  }

  // Controllers
  if (controllersEl) controllersEl.innerHTML = '';
  try {
    const controllersList = Array.isArray(controllersData) ? controllersData : Object.values(controllersData || {});
    let foundAny = false;
    const code = String(airportCode || '').toUpperCase();
    for (const ctrl of controllersList) {
      if (!ctrl) continue;
      // Skip claimable positions where holder is null/undefined
      if (ctrl.holder == null) continue;

      // Primary airport code comes from ctrl.airport; fallback to ctrl.facility for compatibility
      const facilityRaw = String(ctrl.airport || ctrl.facility || '').toUpperCase();
      if (!facilityRaw) continue;

      let match = false;
      // If facility looks like an ICAO (3-5 alnum chars), compare equality
      if (/^[A-Z0-9]{3,5}$/.test(facilityRaw)) {
        match = facilityRaw === code;
      } else if (facilityRaw.includes('-') || facilityRaw.includes(' ') || facilityRaw.includes('/')) {
        // Composite sector strings: allow includes
        match = facilityRaw.includes(code);
      } else {
        // Fallback to equality
        match = facilityRaw === code;
      }

      if (match) {
        foundAny = true;
        const div = document.createElement('div');
        div.className = 'controller-item';
        // ctrl.holder contains the username; ctrl.position is a simple string like 'CTR', 'TWR', or 'GND'
        const holder = String(ctrl.holder || 'Controller');
        const position = String(ctrl.position || '');
        const label = `${holder} - ${position}`;
        div.textContent = label;
        controllersEl.appendChild(div);
      }
    }
    if (!foundAny && controllersEl) {
      controllersEl.textContent = 'No controllers online';
    }
  } catch (e) {
    console.warn('updateAirportSidebarData: controllers render failed', e);
    if (controllersEl) controllersEl.textContent = 'No controllers online';
  }
}

/**
 * Create a DOM fragment that displays ATIS information in a readable format.
 * Accepts either a string or an object payload and handles common fields.
 */
function beautifyAtis(found) {
  const container = document.createElement('div');
  container.className = 'atis-block';

  // Helper to create rows
  const addRow = (label, value) => {
    const row = document.createElement('div');
    row.style.marginBottom = '6px';
    const strong = document.createElement('strong');
    strong.textContent = label + ': ';
    strong.style.marginRight = '6px';
    row.appendChild(strong);
    const span = document.createElement('span');
    span.textContent = value;
    row.appendChild(span);
    container.appendChild(row);
  };

  // If it's a plain string, split into lines
  if (typeof found === 'string') {
    found.split('\n').forEach(line => {
      const p = document.createElement('div');
      p.textContent = line.trim();
      container.appendChild(p);
    });
    return container;
  }

  // Helper: try to discover an array of lines in common shapes
  const extractLinesArray = (obj) => {
    if (!obj || typeof obj !== 'object') return null;

    // Common direct keys
    const directKeys = ['lines', 'message_lines', 'text_lines', 'body_lines', 'lines_array', 'atis_lines'];
    for (const k of directKeys) {
      if (Array.isArray(obj[k])) return obj[k];
      if (typeof obj[k] === 'string') return String(obj[k]).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    }

    // If atis text is an array
    if (Array.isArray(obj.atis)) return obj.atis;
    if (Array.isArray(obj.text)) return obj.text;
    if (Array.isArray(obj.message)) return obj.message;

    // Nested shapes: check common nested containers
    const nestedPaths = ['message', 'body', 'data', 'payload'];
    for (const p of nestedPaths) {
      const nested = obj[p];
      if (!nested) continue;
      if (Array.isArray(nested)) return nested;
      if (typeof nested === 'string') return String(nested).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (nested && typeof nested === 'object') {
        for (const k of directKeys) {
          if (Array.isArray(nested[k])) return nested[k];
          if (typeof nested[k] === 'string') return String(nested[k]).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        }
      }
    }

    // Heuristic: find first array-of-strings anywhere at first level
    for (const v of Object.values(obj)) {
      if (Array.isArray(v) && v.every(x => typeof x === 'string')) return v;
    }

    return null;
  };

  // Common fields to surface (if present)
  const freq = found.frequency || found.freq || found.frequency_hz || found.freq_mhz;
  const atisText = found.text || found.atis || found.atistext || found.message || (typeof found.body === 'string' ? found.body : null) || null;
  const linesArray = extractLinesArray(found);
  const time = found.time || found.updated || found.timestamp || found.issued;
  const altimeter = found.altimeter || found.qnh || found.pressure;
  const wind = found.wind || found.wind_dir || found.wind_info;
  const visibility = found.visibility || found.vis;
  const temp = found.temperature || found.temp;
  const runways = found.runways || found.rwys || found.runway || found.rwy;

  if (freq) addRow('Frequency', String(freq));
  if (time) addRow('Time', String(time));
  if (altimeter) addRow('Altimeter', String(altimeter));
  if (wind) addRow('Wind', String(wind));
  if (visibility) addRow('Visibility', String(visibility));
  if (temp) addRow('Temperature', String(temp));
  if (runways) addRow('Runways', Array.isArray(runways) ? runways.join(', ') : String(runways));

  if (linesArray && linesArray.length > 0) {
    const msgWrap = document.createElement('div');
    msgWrap.style.marginTop = '8px';
    linesArray.forEach(line => {
      const p = document.createElement('div');
      p.textContent = String(line).trim();
      msgWrap.appendChild(p);
    });
    container.appendChild(msgWrap);
  } else if (atisText) {
    // Break message into paragraphs for readability
    const lines = String(atisText).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const msgWrap = document.createElement('div');
    msgWrap.style.marginTop = '8px';
    lines.forEach(line => {
      const p = document.createElement('div');
      p.textContent = line;
      msgWrap.appendChild(p);
    });
    container.appendChild(msgWrap);
  } else {
    // If no recognizable fields, show a pretty-printed JSON fallback
    const pre = document.createElement('pre');
    pre.style.whiteSpace = 'pre-wrap';
    try {
      pre.textContent = JSON.stringify(found, null, 2);
    } catch (e) {
      pre.textContent = String(found);
    }
    container.appendChild(pre);
  }

  return container;
}

async function plotAircraft(data) {
  const callsigns = Object.keys(data);
  const activeSet = new Set(callsigns);

  for (const oldCallsign of aircraftMarkers.keys()) {
    if (!activeSet.has(oldCallsign)) {
      map.removeLayer(aircraftMarkers.get(oldCallsign));
      aircraftMarkers.delete(oldCallsign);
      
      if (aircraftUpdateIntervals.has(oldCallsign)) {
        clearInterval(aircraftUpdateIntervals.get(oldCallsign));
        aircraftUpdateIntervals.delete(oldCallsign);
      }
      
      if (aircraftTrailLayers.has(oldCallsign)) {
        map.removeLayer(aircraftTrailLayers.get(oldCallsign));
        aircraftTrailLayers.delete(oldCallsign);
      }
      aircraftTrailVisible.delete(oldCallsign);
    }
  }

  for (const callsign of callsigns) {
    const ac = data[callsign];
    if (!ac.position) continue;
    const [lat, lng] = apiPositionToLatLng(ac.position.x, ac.position.y);
    const heading = ac.heading || 0;

    if (aircraftMarkers.has(callsign)) {
      const marker = aircraftMarkers.get(callsign);
      marker.setLatLng([lat, lng]);
      const iconImg = marker.getElement()?.querySelector("img");
      if (iconImg) iconImg.style.transform = `rotate(${heading}deg)`;
    } else {
      const icon = L.divIcon({
        className: "aircraft-icon",
        html: `<img src="/unified/icons/aircraft/default/testaircraft.png" style="width:32px; height:32px; transform: rotate(${heading}deg);" alt="aircraft">`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);

      let airlineName = '';
      if (ac.airline) airlineName = ac.airline;
      else if (ac.callsign) {
        const match = ac.callsign.match(/^([A-Za-z\s]+)[- ]?\d+/);
        if (match) airlineName = match[1].trim();
      }
      let labelCallsign = ac.callsign || callsign || '';
      let radio = '';
      const prefixMatch = (callsign || '').match(/^(\D+)[- ]*\d+/);
      if (prefixMatch) {
        const norm = s => s.replace(/[-\s]+/g, '').trim().toLowerCase();
        const prefix = norm(prefixMatch[1]);
        const airlineEntry = Object.entries(AIRLINE_MAP).find(([_, v]) => norm(v.ingame || '') === prefix);
        if (airlineEntry) {
          const airlineInfo = airlineEntry[1];
          radio = airlineInfo.radio || '';
          const sepAndNum = (callsign || '').slice(prefixMatch[1].length);
          labelCallsign = airlineInfo.icao + sepAndNum;
        }
      }
      const shortType = aircraftNames[ac.type || ac.aircraftType] || ac.type || ac.aircraftType || '?';
      const currentFL = ac.altitude ? String(Math.round(ac.altitude / 100)).padStart(3, '0') : '???';

      marker.on("click", async (e) => {
        L.DomEvent.stopPropagation(e);
        const sidebar = document.getElementById("flight-sidebar");
        const flightPlan = flightPlans.get(ac.playerName);
        
        if (selectedAircraftCallsign === callsign && !sidebar.classList.contains("hidden")) {
          sidebar.classList.add("hidden");
          selectedAircraftCallsign = null;
          
          if (window.sidebarUpdateInterval) {
            clearInterval(window.sidebarUpdateInterval);
            window.sidebarUpdateInterval = null;
          }
          
          const polyline = aircraftTrailLayers.get(callsign);
          if (polyline && map.hasLayer(polyline)) {
            map.removeLayer(polyline);
          }
          aircraftTrailVisible.set(callsign, false);
          
          return;
        }
        
        selectedAircraftCallsign = callsign;
        sidebar.classList.remove("hidden");
        sidebar.style.left = "150px";
        sidebar.style.right = "auto";
        hideAirportSidebar();
        try { document.getElementById('aircraft-sidebar')?.classList.add('hidden'); } catch(e){}

        await updateSidebarData(callsign, ac, flightPlan);

        if (window.sidebarUpdateInterval) clearInterval(window.sidebarUpdateInterval);

        window.sidebarUpdateInterval = setInterval(() => {
          const aircraftData = window.lastAircraftData?.[callsign];
          const flightPlan = flightPlans.get(aircraftData?.playerName);
          updateSidebarData(callsign, aircraftData, flightPlan);
        }, 1500);

        // Hide all other aircraft trails first
        for (const [otherCallsign, polyline] of aircraftTrailLayers.entries()) {
          if (otherCallsign !== callsign && map.hasLayer(polyline)) {
            map.removeLayer(polyline);
            aircraftTrailVisible.set(otherCallsign, false);
          }
        }

        // Show trail for the selected aircraft
        const path = await fetchAircraftPath(callsign);
        console.log("Fetched path for trail:", path);
        if (path && path.length > 0) {
          const polyline = L.polyline(path, {
            color: 'yellow',
            weight: 3,
            opacity: 0.7,
            smoothFactor: 1
          }).addTo(map);
          aircraftTrailLayers.set(callsign, polyline);
          aircraftTrailVisible.set(callsign, true);
        }
      });

      aircraftTrailVisible.set(callsign, false);
      aircraftMarkers.set(callsign, marker);
    }

    await getOrInitAircraftPath(callsign);
    const path = await fetchAircraftPath(callsign);
    const lastPos = path[path.length - 1];
    if (!lastPos || lastPos[0] !== lat || lastPos[1] !== lng) path.push([lat, lng]);
  }
}

function updateUTCClock() {
  const now = new Date();
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
  const utcSeconds = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById("utc-time").textContent = `${utcHours}:${utcMinutes}:${utcSeconds} UTC`;
}

setInterval(updateUTCClock, 1000);

renderFixes(Fixes);

function hideWaypointMarkers() {
  waypointMarkers.forEach(marker => map.removeLayer(marker));
  waypointMarkers = [];
}

function renderFixes(list) {
  if (localStorage.getItem("showWaypoints") == 'false') return;
  list.forEach(({ name, px, py, size, type }) => {
    iconurl = null;
    iconurl = null;
    const [lat, lng] = waypointPositionToLatLng(px, py);
    //waypoint
    if (type == "waypoint") {
      iconurl = "/unified/icons/map/Fix.RNAVFlyOver.png"
      iconcss = "waypoint-black"
      //airport
      //airport w/ service and tower. basic airport
    } else if (type == "aprt.serv.twr") {
      iconurl = "/unified/icons/map/1Airport.Serv.Tower.png";
      iconcss = "blue-label";
      //seabase
    } else if (type == "aprt.seabase") {
      iconurl = "/unified/icons/map/2Airport.Seabase.png";
      iconcss = "pink-label";
      //private airport w/ a tower
    } else if (type == "aprt.priv.twr") {
      iconurl = "/unified/icons/map/3Airport.Private.Tower.png";
      iconcss = "blue-label";
      //normal airport
    } else if (type == "aprt") {
      iconurl = "/unified/icons/map/4Airport.png";
      iconcss = "pink-label";
      //military w/ tower
    } else if (type == "aprt.mltry.twr") {
      iconurl = "/unified/icons/map/5Airport.Military.Tower.png";
      iconcss = "blue-label";
      //military airport
    } else if (type == "aprt.mltry") {
      iconurl = "/unified/icons/map/6Airport.Military.png";
      iconcss = "pink-label";
      //airport service
    } else if (type == "aprt.serv") {
      iconurl = "/unified/icons/map/7Airport.Service.png";
      iconcss = "pink-label";
      //private airport
    } else if (type == "aprt.priv") {
      iconurl = "/unified/icons/map/8Airport.Private.png";
      iconcss = "pink-label";
      //airport w/ a tower
    } else if (type == "aprt.twr") {
      iconurl = "/unified/icons/map/9Airport.Tower.png";
      iconcss = "blue-label";
    }
    //extras
    else if (type == "aprt.twr.icon") {
      iconurl = "/unified/icons/map/icons/10Twr.png";
      iconcss = "twr-icon-icon";
    }
      const icon = L.divIcon({
      className: "waypoint-icon",
      html: `
        <div class="fix-wrapper" style="width:${size}px; height:${size}px;">
          <div class="${iconcss}">${name}</div>
          <img src="${iconurl}" style="width:${size}px; height:${size}px;" alt="fix">
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
    if (type == "waypoint") {
        waypointMarkers.push(marker);
    }

    const towerTypes = ["aprt", "aprt.twr", "aprt.serv", "aprt.serv.twr", "aprt.priv", "aprt.priv.twr", "aprt.mltry", "aprt.mltry.twr"];
    if (towerTypes.includes(type)) {
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const sidebar = document.getElementById('airport-sidebar');
        // If same airport clicked while visible, toggle hide via helper
        if (selectedAirportCode === name && sidebar && !sidebar.classList.contains('hidden')) {
          hideAirportSidebar();
          return;
        }
        try { document.getElementById('flight-sidebar')?.classList.add('hidden'); } catch(e){}
        try { document.getElementById('aircraft-sidebar')?.classList.add('hidden'); } catch(e){}
        try {
          if (window.sidebarUpdateInterval) {
            clearInterval(window.sidebarUpdateInterval);
            window.sidebarUpdateInterval = null;
          }
        } catch (e) {}
        selectedAircraftCallsign = null;

        showAirportSidebar(name, name);
      });
    }
  });
}

/*let aircraftTab = document.getElementById('aircraft-tab');

// Aircraft tab click handler
if (aircraftTab) {
  aircraftTab.addEventListener('click', () => {
    // Check if the aircraft tab is already active (using tab-active class)
    if (aircraftTab.classList.contains('tab-active')) {
      // Hide the aircraft sidebar and remove active class
      aircraftSidebarManager.hide();
      aircraftTab.classList.remove('tab-active');
    }
    else if (aircraftTab.classList.contains('active')) {
      aircraftTab.classList.remove('active');
      hideAirportMarkers();
    }
    else {
      // Hide all other sidebars except aircraft-sidebar
      document.getElementById('flight-sidebar')?.classList.add('hidden');
      document.getElementById('settings-sidebar')?.classList.add('hidden');

      // Show aircraft-sidebar
      aircraftSidebarManager.show();

      // Highlight aircraft tab
      // Remove active class from all tabs
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('tab-active'));
      aircraftTab.classList.add('tab-active');

      // Render aircraft data if available
      if (window.lastAircraftData) {
        renderAircraftSidebar(window.lastAircraftData);
      }
    }
  });
}*/

const toggleWaypointsElement = document.getElementById("toggle-waypoints");
if (toggleWaypointsElement) {
  toggleWaypointsElement.addEventListener("change", (e) => {
    waypointsEnabled = e.target.checked;
    if (waypointsEnabled) {
      renderFixes(Fixes);
    } else {
      hideWaypointMarkers();
    }
  });
}

function getSidStarWaypoints(sidStarName) {
  const sidStar = SIDS_STARS.find(s => s.name === sidStarName);
  if (!sidStar) return [];
  return sidStar.waypoints.map(wp => {
    const base = Waypoints.find(w => w.name === wp.name);
    return base ? { ...base, ...wp } : null;
  }).filter(Boolean);
}

function renderSidStarRoute(sidStarName, options = {}) {
  const waypoints = getSidStarWaypoints(sidStarName);
  if (waypoints.length < 2) return null;
  const latLngs = waypoints.map(wp => waypointPositionToLatLng(wp.px, wp.py));
  const polyline = L.polyline(latLngs, {
    color: options.color || 'orange',
    weight: options.weight || 3,
    dashArray: options.dashArray || '8,8',
    opacity: options.opacity || 0.8
  }).addTo(map);

  for (let i = 0; i < waypoints.length - 1; i++) {
    const wpA = waypoints[i];
    const wpB = waypoints[i + 1];
    const midLat = (waypointPositionToLatLng(wpA.px, wpA.py)[0] + waypointPositionToLatLng(wpB.px, wpB.py)[0]) / 2;
    const midLng = (waypointPositionToLatLng(wpA.px, wpA.py)[1] + waypointPositionToLatLng(wpB.px, wpB.py)[1]) / 2;
    const label = L.popup({
      closeButton: false,
      autoClose: false,
      className: "sidstar-leg-popup"
    })
      .setLatLng([midLat, midLng])
      .setContent(`
  Alt: ${formatConstraint(wpB.altitude, "ft")}<br>
  Spd: ${formatConstraint(wpB.speed, "kt")}<br>
  Hdng: ${wpB.heading ?? "—"}°
`)
      .addTo(map);
  }
  return polyline;
}

let wHeld = false;
let startPoint = null;
let tempLine = null;
let infoLabel = null;

function calculatePixelDistance(p1, p2) {
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateStuds(p1, p2) {
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  return pixelDistance * 6.6675;
}

function calculateDistanceNauticalMiles(p1, p2) {
  return calculateStuds(p1, p2) / 3307.14286;
}

function calculateDistanceMeters(p1, p2) {
  return calculateStuds(p1, p2) * 0.56;
}

function calculateAngle(p1, p2) {
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;
  let angleDeg = (Math.atan2(dx, dy) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  return angleDeg.toFixed(1);
}

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "w") {
    wHeld = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key.toLowerCase() === "w") {
    wHeld = false;
    if (tempLine) {
      map.removeLayer(tempLine);
      tempLine = null;
    }
    if (infoLabel) {
      map.removeLayer(infoLabel);
      infoLabel = null;
    }
    startPoint = null;
  }
});

map.on("click", (e) => {
  if (!wHeld) return;
  startPoint = e.latlng;
});

map.on("mousemove", (e) => {
  if (!wHeld || !startPoint) return;

  const endPoint = e.latlng;
  const points = [startPoint, endPoint];

  if (tempLine) {
    tempLine.setLatLngs(points);
  } else {
    tempLine = L.polyline(points, {
      color: 'red',
      weight: 2,
      opacity: 0.8,
      dashArray: "53.571428571428576,53.571428571428576"
    }).addTo(map);
  }

  const studs = calculateStuds(startPoint, endPoint).toFixed(2);
  const nmi = calculateDistanceNauticalMiles(startPoint, endPoint).toFixed(2);
  const meters = calculateDistanceMeters(startPoint, endPoint).toFixed(2);
  const angle = calculateAngle(startPoint, endPoint);

  const content = `🧭 ${angle}°<br>🪜 ${studs} studs<br>📏 ${nmi} NMi<br>📐 ${meters} m`;

  if (infoLabel) {
    infoLabel.setLatLng(endPoint);
    infoLabel.setContent(content);
  } else {
    infoLabel = L.popup({
      closeButton: false,
      autoClose: false,
      className: "line-info-popup"
    })
      .setLatLng(endPoint)
      .setContent(content)
      .addTo(map);
  }
});

document.querySelectorAll('.section-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const section = button.parentElement;
    const isOpen = section.classList.contains('active');

    document.querySelectorAll('.section').forEach(s => {
      s.classList.remove('active');
      s.querySelector('.section-toggle').classList.remove('open');
    });

    if (!isOpen) {
      section.classList.add('active');
      button.classList.add('open');
    }
  });
});

/**
 * Manages all functionality for a floating, multi-tab notepad.
 */
class NotepadManager {
  constructor(notifier) {
    this.notifier = notifier;
    this.notepadWindow = document.getElementById("notepad-window");
    this.notepadTab = document.getElementById("notepad-tab");
    this.closeButton = document.getElementById("close-notepad");
    this.popoutButton = document.getElementById("popout-notepad");
    this.notepadHeader = document.getElementById("notepad-header");
    this.notepadContent = document.getElementById("notepad-content");
    this.textbox = document.getElementById("textbox");
    this.resizeHandles = document.querySelectorAll("#notepad-window .resize-handle");

    this.tabBar = null;
    this.timestampLabel = null;

    this.tabs = {};
    this.activeTabId = null;

    this.isDragging = false;
    this.isResizing = false;
    this.initialDragX = 0;
    this.initialDragY = 0;

    this.init();
  }

  init() {
    if (!this.notepadWindow || !this.notepadTab) {
      console.error("Notepad initialization failed: Core elements not found.");
      return;
    }

    this.injectDynamicElements();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.loadStateFromStorage();
    this.renderAllTabs();
    this.activateTab(this.activeTabId);
    this.updateNotepadVisibility(false);

    window.addEventListener("message", (event) => {
      if (event.data === "notepad-alive") {
        console.log("Popup notepad is active");
      }
    });

    // Load and apply window state
    const defaultState = { left: 150, top: 0, width: 400, height: 400 };
    const windowState = loadWindowState('notepad', this.notepadWindow, defaultState);
    applyWindowState(this.notepadWindow, windowState);
  }

  injectDynamicElements() {
    this.tabBar = document.createElement("div");
    this.tabBar.id = "notepad-tab-bar";
    this.notepadWindow.insertBefore(this.tabBar, this.notepadContent);

    this.timestampLabel = document.createElement("div");
    this.timestampLabel.className = "timestamp-label";
    this.notepadWindow.appendChild(this.timestampLabel);
  }

  setupEventListeners() {
    this.notepadTab.addEventListener("click", () => this.updateNotepadVisibility(true));
    this.closeButton.addEventListener("click", () => this.updateNotepadVisibility());
    if (this.popoutButton) {
      this.popoutButton.addEventListener("click", () => this.openNotepadInNewWindow());
    }

    this.setupDragging();
    this.setupResizing();

    // Bring window to front when clicked
    this.notepadWindow.addEventListener("mousedown", () => {
      bringWindowToFront(this.notepadWindow);
    });

    this.textbox.addEventListener("input", () => this.handleTextInput());
    this.textbox.addEventListener("keyup", (e) => this.handleInlineReplacements(e));
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaKey = isMac ? e.metaKey : e.ctrlKey;

      if (metaKey && e.altKey) {
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          this.createNewTab();
          if (this.notepadWindow.classList.contains('hidden')) {
            this.updateNotepadVisibility(true);
          }
        }

        if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          if (this.activeTabId) {
            this.closeTab(this.activeTabId);
          }
        }
      }
    });
  }

  openNotepadInNewWindow() {
    const newWin = window.open("notepad.html", "_blank", "width=600,height=500");

    if (!newWin) return;

    const currentTabData = {
      [this.activeTabId]: this.tabs[this.activeTabId]
    };

    const syncData = () => {
      try {
        newWin.localStorage.setItem("notepadTabs", JSON.stringify(currentTabData));
        newWin.localStorage.setItem("notepadActiveTab", this.activeTabId);
        newWin.localStorage.setItem("notepadVisible", "true");
      } catch (e) {
        console.warn("Sync failed:", e);
      }
    };

    const interval = setInterval(() => {
      if (newWin.document && newWin.document.readyState === "complete") {
        syncData();
        clearInterval(interval);
      }
    }, 100);

    this.updateNotepadVisibility(false);
  }

  loadStateFromStorage() {
    try {
      const savedTabs = JSON.parse(localStorage.getItem("notepadTabs") || "{}");
      const savedActiveTabId = localStorage.getItem("notepadActiveTab");

      this.tabs = savedTabs;
      this.activeTabId = savedActiveTabId;

      if (Object.keys(this.tabs).length === 0) {
        this.createNewTab();
      }

      if (!this.activeTabId || !this.tabs[this.activeTabId]) {
        this.activeTabId = Object.keys(this.tabs)[0];
      }
    } catch (error) {
      console.warn('Failed to load notepad state from localStorage:', error);
      this.tabs = {};
      this.createNewTab();
    }
  }

  saveTabsToStorage() {
    try {
      localStorage.setItem("notepadTabs", JSON.stringify(this.tabs));
      localStorage.setItem("notepadActiveTab", this.activeTabId);
    } catch (error) {
      console.warn('Failed to save notepad state to localStorage:', error);
    }
  }

  renderAllTabs() {
    this.tabBar.innerHTML = "";

    const tabIds = Object.keys(this.tabs);
    tabIds.forEach((tabId, index) => {
      const tabWrapper = document.createElement("div");
      tabWrapper.className = "tab-button-wrapper";

      const tabButton = document.createElement("button");
      tabButton.textContent = `Note ${index + 1}`;
      tabButton.dataset.tabId = tabId;
      tabButton.className = "tab-button";
      if (tabId === this.activeTabId) {
        tabButton.classList.add("active-tab");
      }
      tabButton.addEventListener("click", () => this.activateTab(tabId));

      const closeButton = document.createElement("span");
      closeButton.textContent = "×";
      closeButton.className = "close-tab";
      closeButton.title = "Close this note";
      closeButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeTab(tabId);
      });

      tabWrapper.appendChild(tabButton);
      tabWrapper.appendChild(closeButton);
      this.tabBar.appendChild(tabWrapper);
    });

    if (tabIds.length < 10) {
      const newTabButton = document.createElement("button");
      newTabButton.textContent = "+";
      newTabButton.title = "New Note";
      newTabButton.className = "new-tab-button";
      newTabButton.addEventListener("click", () => this.createNewTab());
      this.tabBar.appendChild(newTabButton);
    }
  }

  activateTab(tabId) {
    if (!tabId || !this.tabs[tabId]) return;

    if (this.activeTabId && this.tabs[this.activeTabId]) {
      this.tabs[this.activeTabId].content = this.textbox.value;
      this.tabs[this.activeTabId].timestamp = new Date().toISOString();
    }

    this.activeTabId = tabId;

    const tabData = this.tabs[tabId];
    this.textbox.value = tabData.content || "";
    this.updateTimestamp(tabData.timestamp);
    this.renderAllTabs();
    this.saveTabsToStorage();
  }

  closeTab(tabId) {
    if (!this.tabs[tabId]) return;

    delete this.tabs[tabId];

    if (this.activeTabId === tabId) {
      const remaining = Object.keys(this.tabs);
      this.activeTabId = remaining.length ? remaining[0] : null;
    }

    if (!this.activeTabId) this.createNewTab();

    this.renderAllTabs();
    this.activateTab(this.activeTabId);
    this.saveTabsToStorage();
  }

  createNewTab() {
    if (Object.keys(this.tabs).length >= 10) {
      notifier.show("Maximum of 10 notes allowed.");
      return;
    }

    const newTabId = `note-${Date.now()}`;
    this.tabs[newTabId] = {
      content: "",
      timestamp: null
    };
    this.activeTabId = newTabId;
    this.activateTab(newTabId);
  }

  handleTextInput() {
    const now = new Date().toISOString();
    if (this.tabs[this.activeTabId]) {
      this.tabs[this.activeTabId].content = this.textbox.value;
      this.tabs[this.activeTabId].timestamp = now;
      this.updateTimestamp(now);
      this.saveTabsToStorage();
    }
  }

  handleInlineReplacements(event) {
    if (event.key !== ' ') return;

    const cursorPos = this.textbox.selectionStart;
    const textBeforeCursor = this.textbox.value.substring(0, cursorPos);

    const replacements = {
      '* ': '• ',
      '- ': '• ',
      '> ': '» ',
    };

    for (const [key, value] of Object.entries(replacements)) {
      if (textBeforeCursor.endsWith(key)) {
        const newTextBefore = textBeforeCursor.slice(0, -key.length) + value;
        this.textbox.value = newTextBefore + this.textbox.value.substring(cursorPos);
        this.textbox.selectionStart = this.textbox.selectionEnd = newTextBefore.length;

        this.handleTextInput();
        break;
      }
    }
  }

  updateNotepadVisibility(toggle = true) {
    let shouldBeVisible = !(this.notepadWindow.classList.contains("hidden"));
    if (toggle) {
      shouldBeVisible = !shouldBeVisible;
    } else {
      shouldBeVisible = localStorage.getItem("notepadVisible") === "true";
    }

    this.notepadWindow.classList.toggle("hidden", !shouldBeVisible);
    this.notepadTab.classList.toggle("tab-active", shouldBeVisible);
    localStorage.setItem("notepadVisible", shouldBeVisible);

    if (shouldBeVisible) {
      this.textbox.style.display = "block";
      this.textbox.focus();
    }
  }

  hideNotepad() {
    this.notepadWindow.classList.add("hidden");
    this.notepadTab.classList.remove("tab-active");
    localStorage.setItem("notepadVisible", "false");
  }

  updateTimestamp(isoTimestamp) {
    if (!this.timestampLabel) return;
    if (!isoTimestamp) {
      this.timestampLabel.textContent = "Last saved: never";
      return;
    }
    const savedDate = new Date(isoTimestamp);
    const timeString = savedDate.toLocaleTimeString() + " " + savedDate.toLocaleDateString();
    this.timestampLabel.textContent = `Last saved: ${timeString}`;
  }

  setupDragging() {
    this.notepadHeader.addEventListener("mousedown", (e) => {
      if (e.target.tagName === 'BUTTON') return;
      this.isDragging = true;
      this.initialDragX = e.clientX - this.notepadWindow.offsetLeft;
      this.initialDragY = e.clientY - this.notepadWindow.offsetTop;
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        let newLeft = e.clientX - this.initialDragX;
        let newTop = e.clientY - this.initialDragY;

        const sidebarWidth = 150;
        newLeft = Math.max(sidebarWidth, Math.min(newLeft, window.innerWidth - this.notepadWindow.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - this.notepadWindow.offsetHeight));

        this.notepadWindow.style.left = `${newLeft}px`;
        this.notepadWindow.style.top = `${newTop}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      if (this.isDragging) {
        saveWindowState('notepad', this.notepadWindow);
      }
      this.isDragging = false;
      document.body.style.userSelect = "auto";
    });
  }

  setupResizing() {
    this.resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isResizing = true;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = this.notepadWindow.offsetWidth;
        const startHeight = this.notepadWindow.offsetHeight;
        const startLeft = this.notepadWindow.offsetLeft;
        const startTop = this.notepadWindow.offsetTop;

        const minWidth = 300;
        const minHeight = 200;
        const sidebarWidth = 150;

        const doResize = (moveEvent) => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          if (handle.classList.contains('right')) {
            this.notepadWindow.style.width = `${Math.max(minWidth, startWidth + dx)}px`;
          } else if (handle.classList.contains('left')) {
            const newWidth = Math.max(minWidth, startWidth - dx);
            const potentialLeft = startLeft + (startWidth - newWidth);
            this.notepadWindow.style.left = `${Math.max(sidebarWidth, potentialLeft)}px`;
            this.notepadWindow.style.width = `${newWidth}px`;
          } else if (handle.classList.contains('bottom')) {
            this.notepadWindow.style.height = `${Math.max(minHeight, startHeight + dy)}px`;
          } else if (handle.classList.contains('top')) {
            const newHeight = Math.max(minHeight, startHeight - dy);
            this.notepadWindow.style.height = `${newHeight}px`;
            this.notepadWindow.style.top = `${startTop + (startHeight - newHeight)}px`;
          } else if (handle.classList.contains('bottom-right')) {
            this.notepadWindow.style.width = `${Math.max(minWidth, startWidth + dx)}px`;
            this.notepadWindow.style.height = `${Math.max(minHeight, startHeight + dy)}px`;
          } else if (handle.classList.contains('bottom-left')) {
            const newWidth = Math.max(minWidth, startWidth - dx);
            const potentialLeft = startLeft + (startWidth - newWidth);
            this.notepadWindow.style.left = `${Math.max(sidebarWidth, potentialLeft)}px`;
            this.notepadWindow.style.width = `${newWidth}px`;
            this.notepadWindow.style.height = `${Math.max(minHeight, startHeight + dy)}px`;
          } else if (handle.classList.contains('top-right')) {
            this.notepadWindow.style.width = `${Math.max(minWidth, startWidth + dx)}px`;
            const newHeight = Math.max(minHeight, startHeight - dy);
            this.notepadWindow.style.height = `${newHeight}px`;
            this.notepadWindow.style.top = `${startTop + (startHeight - newHeight)}px`;
          } else if (handle.classList.contains('top-left')) {
            const newWidth = Math.max(minWidth, startWidth - dx);
            const potentialLeft = startLeft + (startWidth - newWidth);
            this.notepadWindow.style.left = `${Math.max(sidebarWidth, potentialLeft)}px`;
            this.notepadWindow.style.width = `${newWidth}px`;
            const newHeight = Math.max(minHeight, startHeight - dy);
            this.notepadWindow.style.height = `${newHeight}px`;
            this.notepadWindow.style.top = `${startTop + (startHeight - newHeight)}px`;
          }
        };

        const stopResize = () => {
          document.removeEventListener('mousemove', doResize);
          document.removeEventListener('mouseup', stopResize);
          this.isResizing = false;
          saveWindowState('notepad', this.notepadWindow);
        };

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });
    });
  }
}

/**
 * Manages all functionality for a floating VNAS window.
 */
class VNASManager {
  constructor(notifier) {
    this.notifier = notifier;
    this.vnasWindow = document.getElementById("vnas-window");
    this.vnasTab = document.getElementById("vnas-tab");
    this.closeButton = document.getElementById("close-vnas");
    this.popoutButton = document.getElementById("popout-vnas");
    this.vnasHeader = document.getElementById("vnas-header");
    this.vnasContent = document.getElementById("vnas-content");
    this.textbox = document.getElementById("vnas-textbox");
    this.resizeHandles = document.querySelectorAll("#vnas-window .resize-handle");

    this.isDragging = false;
    this.isResizing = false;
    this.initialDragX = 0;
    this.initialDragY = 0;

    // VNAS profile settings
    this.maxDistance = 10; // Maximum distance in nautical miles
    this.maxAltitude = 8000; // Maximum altitude in feet at the top
    this.profileData = []; // Array of {distance, altitude} points
    this.manualWaypoints = []; // Array of manually added waypoints

    this.init();
  }

  init() {
    if (!this.vnasWindow || !this.vnasTab) {
      console.error("VNAS initialization failed: Core elements not found.");
      return;
    }

    this.setupEventListeners();
    this.loadStateFromStorage();
    this.initializeDimensions();
  }

  initializeDimensions() {
    // Load and apply window state
    const defaultState = { left: 180, top: 50, width: 450, height: 400 };
    const windowState = loadWindowState('vnas', this.vnasWindow, defaultState);
    applyWindowState(this.vnasWindow, windowState);
    
    // Create VNAS profile canvas and controls
    this.createVNASProfile();
  }

  createVNASProfile() {
    // Clear existing content and create new structure
    this.vnasContent.style.margin = '0';
    this.vnasContent.style.padding = '0';
    this.vnasContent.style.width = '100%';
    this.vnasContent.style.height = '100%';
    
    this.vnasContent.innerHTML = `
      <div style="display: flex; height: 100%; width: 100%; margin: 0; padding: 0; box-sizing: border-box;">
        <div class="vnas-profile-container" style="position: relative; flex: 1; background: #1a1a1a; min-width: 0; overflow: hidden;">
          <canvas id="vnas-canvas" style="display: block;"></canvas>
        </div>
        <div class="vnas-controls" style="flex: 0 0 auto; width: 100px; padding: 4px; background: #2a2a2a; border-left: 1px solid #444; display: flex; flex-direction: column; gap: 6px;">
          <div style="color: white; font-size: 10px;">
            <div style="margin-bottom: 4px;">
              <label style="display: block; margin-bottom: 1px; font-size: 10px;">Max Alt:</label>
              <input type="number" id="max-altitude-input" min="1000" max="99999" step="1000" value="8000" style="width: 45px; padding: 2px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 1px; font-size: 10px;">
              <span style="font-size: 9px; color: #888;">ft</span>
            </div>
            <div style="margin-bottom: 6px;">
              <label style="display: block; margin-bottom: 1px; font-size: 10px;">Max Dist:</label>
              <input type="number" id="max-distance" min="1" max="500" value="10" style="width: 40px; padding: 2px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 1px; font-size: 10px;">
              <span style="font-size: 9px; color: #888;">NM</span>
            </div>
          </div>
          <div style="border-top: 1px solid #444; padding-top: 8px; color: white; font-size: 10px;">
            <div style="margin-bottom: 3px;">
              <label style="display: block; margin-bottom: 1px; font-size: 10px;">Distance:</label>
              <input type="number" id="manual-distance" placeholder="0" min="0" max="999" style="width: 40px; padding: 2px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 1px; font-size: 10px;">
              <span style="font-size: 9px; color: #888;">NM</span>
            </div>
            <div style="margin-bottom: 4px;">
              <label style="display: block; margin-bottom: 1px; font-size: 10px;">Altitude:</label>
              <input type="number" id="manual-altitude" placeholder="0" min="0" max="99999" style="width: 45px; padding: 2px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 1px; font-size: 10px;">
              <span style="font-size: 9px; color: #888;">ft</span>
            </div>
            <div style="display: flex; gap: 1px; margin-bottom: 4px;">
              <button id="add-waypoint" style="padding: 2px 4px; background: #4a90e2; color: white; border: none; border-radius: 1px; cursor: pointer; font-size: 8px;">Add</button>
              <button id="clear-waypoints" style="padding: 2px 4px; background: #e24a4a; color: white; border: none; border-radius: 1px; cursor: pointer; font-size: 8px;">Clear</button>
            </div>
            <div id="point-info" style="color: #aaa; font-size: 9px; word-wrap: break-word;"></div>
          </div>
        </div>
      </div>
    `;
    
    this.canvas = document.getElementById('vnas-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.setupVNASControls();
    
    // Initial sizing with delay to ensure layout is complete
    setTimeout(() => {
      this.resizeCanvas();
      this.drawProfile();
    }, 10);
    
    // Add resize observer to handle dynamic resizing
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        // Use requestAnimationFrame for smooth resizing
        requestAnimationFrame(() => {
          this.resizeCanvas();
          this.drawProfile();
        });
      });
      this.resizeObserver.observe(this.vnasContent);
      this.resizeObserver.observe(this.vnasWindow);
      this.resizeObserver.observe(this.canvas.parentElement);
    }
    
    // Also listen for window resize events as backup
    window.addEventListener('resize', () => {
      if (!this.vnasWindow.classList.contains('hidden')) {
        setTimeout(() => {
          this.resizeCanvas();
          this.drawProfile();
        }, 100);
      }
    });
  }

  setupVNASControls() {
    const maxAltitudeInput = document.getElementById('max-altitude-input');
    const maxDistance = document.getElementById('max-distance');
    const manualDistance = document.getElementById('manual-distance');
    const manualAltitude = document.getElementById('manual-altitude');
    const addWaypointButton = document.getElementById('add-waypoint');
    const clearWaypointsButton = document.getElementById('clear-waypoints');
    const pointInfo = document.getElementById('point-info');

    maxAltitudeInput.addEventListener('input', (e) => {
      this.maxAltitude = parseInt(e.target.value) || 45000;
      this.drawProfile();
    });

    maxDistance.addEventListener('input', (e) => {
      this.maxDistance = parseInt(e.target.value);
      this.drawProfile();
    });

    // Manual waypoint input handlers
    const updatePointInfo = () => {
      const dist = parseFloat(manualDistance.value) || 0;
      const alt = parseFloat(manualAltitude.value) || 0;
      pointInfo.textContent = `Point: ${dist}NM @ ${alt}ft`;
    };

    manualDistance.addEventListener('input', updatePointInfo);
    manualAltitude.addEventListener('input', updatePointInfo);

    addWaypointButton.addEventListener('click', () => {
      const distance = parseFloat(manualDistance.value);
      const altitude = parseFloat(manualAltitude.value);
      
      if (!isNaN(distance) && !isNaN(altitude) && distance >= 0 && altitude >= 0) {
        this.manualWaypoints.push({ distance, altitude });
        this.drawProfile();
        
        // Clear inputs after adding
        manualDistance.value = '';
        manualAltitude.value = '';
        pointInfo.textContent = `Added: ${distance}NM @ ${altitude}ft (Total: ${this.manualWaypoints.length} points)`;
        
        this.notifier.show(`Added waypoint at ${distance}NM, ${altitude}ft`, 'success');
      } else {
        this.notifier.show('Please enter valid distance and altitude values', 'error');
      }
    });

    clearWaypointsButton.addEventListener('click', () => {
      this.manualWaypoints = [];
      this.drawProfile();
      pointInfo.textContent = 'All waypoints cleared';
      this.notifier.show('All waypoints cleared', 'info');
    });

    // Allow Enter key to add waypoint
    manualDistance.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addWaypointButton.click();
    });
    
    manualAltitude.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addWaypointButton.click();
    });
  }

  setupEventListeners() {
    this.vnasTab.addEventListener("click", () => this.updateVNASVisibility(true));
    
    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => this.hideVNAS());
    }

    if (this.popoutButton) {
      this.popoutButton.addEventListener("click", () => this.openVNASInNewWindow());
    }

    this.textbox.addEventListener("input", () => this.saveStateToStorage());
    this.textbox.addEventListener("blur", () => this.saveStateToStorage());

    // Bring window to front when clicked
    this.vnasWindow.addEventListener("mousedown", () => {
      bringWindowToFront(this.vnasWindow);
    });

    this.setupDragAndResize();
  }

  setupDragAndResize() {
    // Dragging functionality
    this.vnasHeader.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.initialDragX = e.clientX - this.vnasWindow.offsetLeft;
      this.initialDragY = e.clientY - this.vnasWindow.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        let newLeft = e.clientX - this.initialDragX;
        let newTop = e.clientY - this.initialDragY;

        const sidebarWidth = 150;
        newLeft = Math.max(sidebarWidth, Math.min(newLeft, window.innerWidth - this.vnasWindow.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - this.vnasWindow.offsetHeight));

        this.vnasWindow.style.left = `${newLeft}px`;
        this.vnasWindow.style.top = `${newTop}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        saveWindowState('vnas', this.vnasWindow);
      }
      this.isDragging = false;
    });

    // Resizing functionality
    this.resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.isResizing = true;
        const rect = this.vnasWindow.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(document.defaultView.getComputedStyle(this.vnasWindow).width, 10);
        const startHeight = parseInt(document.defaultView.getComputedStyle(this.vnasWindow).height, 10);
        const startLeft = rect.left;
        const startTop = rect.top;

        const doResize = (e) => {
          if (!this.isResizing) return;
          
          const newWidth = startWidth + (e.clientX - startX);
          const newHeight = startHeight + (e.clientY - startY);
          
          this.vnasWindow.style.width = Math.max(350, newWidth) + 'px';
          this.vnasWindow.style.height = Math.max(300, newHeight) + 'px';
          
          // Resize canvas when window is resized
          if (this.canvas) {
            this.resizeCanvas();
            this.drawProfile();
          }
        };

        const stopResize = () => {
          this.isResizing = false;
          saveWindowState('vnas', this.vnasWindow);
        };

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });
    });
  }

  resizeCanvas() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    
    // Get the available space from the container directly
    const containerRect = container.getBoundingClientRect();
    const canvasWidth = containerRect.width;
    const canvasHeight = containerRect.height;
    
    // Set canvas internal resolution to match container
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    
    // Set CSS dimensions to match exactly
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
  }

  drawProfile() {
    if (!this.canvas || !this.ctx) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw grid and axes
    this.drawGrid(width, height);
    
    // Draw aircraft position if available
    this.drawAircraftPosition(width, height);
    
    // Draw flight path if available
    this.drawFlightPath(width, height);
    
    // Draw manual waypoints
    this.drawManualWaypoints(width, height);
  }

  drawManualWaypoints(width, height) {
    if (this.manualWaypoints.length === 0) return;

    // Draw waypoint markers
    this.ctx.fillStyle = '#ff6b35';
    this.ctx.strokeStyle = '#ff6b35';
    this.ctx.lineWidth = 2;
    this.ctx.font = '10px monospace';

    this.manualWaypoints.forEach((waypoint, index) => {
      if (!this.plotArea) return;
      
      const displayMaxDistance = this.maxDistance * 1.1;
      const displayMaxAltitude = this.maxAltitude * 1.1;
      
      const x = this.plotArea.left + (waypoint.distance / displayMaxDistance) * this.plotArea.width;
      const y = this.plotArea.bottom - (Math.max(0, waypoint.altitude) / displayMaxAltitude) * this.plotArea.height;

      if (x >= this.plotArea.left && x <= this.plotArea.right && 
          y >= this.plotArea.top && y <= this.plotArea.bottom && 
          waypoint.altitude <= this.maxAltitude) {
        // Draw waypoint marker (diamond shape)
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillRect(-4, -4, 8, 8);
        this.ctx.strokeRect(-4, -4, 8, 8);
        this.ctx.restore();

        // Draw waypoint label
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`WP${index + 1}`, x + 6, y - 6);
        this.ctx.fillText(`${waypoint.distance}NM`, x + 6, y + 4);
        this.ctx.fillText(`${waypoint.altitude}ft`, x + 6, y + 14);

        // Draw reference lines
        this.ctx.strokeStyle = '#ff6b3540';
        this.ctx.setLineDash([1, 3]);
        
        // Vertical line to distance axis
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, this.plotArea.bottom);
        this.ctx.stroke();
        
        // Horizontal line to altitude axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.plotArea.left, y);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = '#ff6b35';
        this.ctx.strokeStyle = '#ff6b35';
      }
    });

    // Connect waypoints with a path if there are multiple
    if (this.manualWaypoints.length > 1) {
      this.ctx.strokeStyle = '#ff6b35';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([3, 3]);
      
      this.ctx.beginPath();
      let firstPoint = true;
      
      this.manualWaypoints
        .slice()
        .sort((a, b) => a.distance - b.distance)
        .forEach((waypoint) => {
          const displayMaxDistance = this.maxDistance * 1.1;
          const displayMaxAltitude = this.maxAltitude * 1.1;
          
          const x = this.plotArea.left + (waypoint.distance / displayMaxDistance) * this.plotArea.width;
          const y = this.plotArea.bottom - (Math.max(0, waypoint.altitude) / displayMaxAltitude) * this.plotArea.height;
          
          if (x >= this.plotArea.left && x <= this.plotArea.right && 
              y >= this.plotArea.top && y <= this.plotArea.bottom && 
              waypoint.altitude <= this.maxAltitude) {
            if (firstPoint) {
              this.ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              this.ctx.lineTo(x, y);
            }
          }
        });
      
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  drawGrid(width, height) {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = '#888';
    
    // Add padding for labels - reserve space at edges
    const leftPadding = 50;
    const bottomPadding = 20;
    const topPadding = 15;
    const rightPadding = 30;
    
    const plotWidth = width - leftPadding - rightPadding;
    const plotHeight = height - bottomPadding - topPadding;
    
    // Vertical grid lines (distance) - extend slightly beyond max
    const displayMaxDistance = this.maxDistance * 1.1; // 10% extra
    const distanceStep = this.maxDistance / 10;
    for (let i = 0; i <= 11; i++) { // One extra line
      const distance = i * distanceStep;
      const x = leftPadding + (distance / displayMaxDistance) * plotWidth;
      
      if (x <= width - rightPadding) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, topPadding);
        this.ctx.lineTo(x, height - bottomPadding);
        this.ctx.stroke();
        
        // Distance labels (only show clean increments)
        if (distance <= this.maxDistance) {
          this.ctx.fillText(distance.toFixed(0) + 'NM', x - 10, height - 5);
        }
      }
    }
    
    // Horizontal grid lines (altitude) - extend slightly beyond max
    let altitudeStep;
    if (this.maxAltitude <= 5000) {
      altitudeStep = 500;
    } else if (this.maxAltitude <= 15000) {
      altitudeStep = 1000;
    } else {
      altitudeStep = 2000;
    }
    
    const displayMaxAltitude = this.maxAltitude * 1.1; // 10% extra
    const numLines = Math.ceil(displayMaxAltitude / altitudeStep);
    
    for (let i = 0; i <= numLines; i++) {
      const altitude = i * altitudeStep;
      const y = height - bottomPadding - (altitude / displayMaxAltitude) * plotHeight;
      
      if (y >= topPadding && altitude <= displayMaxAltitude) {
        this.ctx.beginPath();
        this.ctx.moveTo(leftPadding, y);
        this.ctx.lineTo(width - rightPadding, y);
        this.ctx.stroke();
        
        // Altitude labels (only show clean increments, avoid overlap at bottom)
        if (altitude <= this.maxAltitude) {
          if (altitude === 0) {
            // Position 0ft label slightly above the axis to avoid overlap
            this.ctx.fillText('0ft', 5, y - 8);
          } else {
            this.ctx.fillText(altitude.toFixed(0) + 'ft', 5, y - 2);
          }
        }
      }
    }
    
    // Axes - draw within the padded area
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;
    
    // X-axis (0 altitude)
    this.ctx.beginPath();
    this.ctx.moveTo(leftPadding, height - bottomPadding);
    this.ctx.lineTo(width - rightPadding, height - bottomPadding);
    this.ctx.stroke();
    
    // Y-axis (distance 0)
    this.ctx.beginPath();
    this.ctx.moveTo(leftPadding, topPadding);
    this.ctx.lineTo(leftPadding, height - bottomPadding);
    this.ctx.stroke();
    
    // Store padding values for use in other drawing functions
    this.plotArea = {
      left: leftPadding,
      right: width - rightPadding,
      top: topPadding,
      bottom: height - bottomPadding,
      width: plotWidth,
      height: plotHeight
    };
  }



  drawAircraftPosition(width, height) {
    if (!selectedAircraftCallsign || !window.lastAircraftData || !this.plotArea) return;
    
    const aircraft = window.lastAircraftData[selectedAircraftCallsign];
    if (!aircraft || !aircraft.altitude || aircraft.altitude < 0) return;
    
    // For now, place aircraft at a sample distance - this could be calculated from actual position
    const aircraftDistance = this.maxDistance * 0.3; // 30% across the display
    const aircraftAltitude = Math.max(0, aircraft.altitude); // Prevent negative altitude
    
    const displayMaxDistance = this.maxDistance * 1.1;
    const displayMaxAltitude = this.maxAltitude * 1.1;
    
    const x = this.plotArea.left + (aircraftDistance / displayMaxDistance) * this.plotArea.width;
    const y = this.plotArea.bottom - (aircraftAltitude / displayMaxAltitude) * this.plotArea.height;
    
    if (x >= this.plotArea.left && x <= this.plotArea.right && 
        y >= this.plotArea.top && y <= this.plotArea.bottom && 
        aircraftAltitude <= this.maxAltitude) {
      
      // Draw aircraft symbol
      this.ctx.fillStyle = '#00ff00';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Draw aircraft info
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '11px monospace';
      this.ctx.fillText(`${selectedAircraftCallsign}`, x + 8, y - 5);
      this.ctx.fillText(`${aircraftAltitude}ft`, x + 8, y + 8);
      
      // Draw altitude line
      this.ctx.strokeStyle = '#00ff0080';
      this.ctx.setLineDash([2, 2]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.plotArea.left, y);
      this.ctx.lineTo(this.plotArea.right, y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  drawFlightPath(width, height) {
    // This could be enhanced to show planned flight path from flight plan data
    if (!selectedAircraftCallsign || !window.lastAircraftData) return;
    
    const aircraft = window.lastAircraftData[selectedAircraftCallsign];
    if (!aircraft) return;
    
    // Sample flight path - could be derived from flight plan waypoints
    this.ctx.strokeStyle = '#ffaa00';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    // Sample planned descent/climb path
    this.ctx.moveTo(0, height * 0.7);
    this.ctx.lineTo(width * 0.3, height * 0.5);
    this.ctx.lineTo(width * 0.7, height * 0.3);
    this.ctx.lineTo(width, height * 0.8);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }



  openVNASInNewWindow() {
    const vnasContent = this.textbox.value;
    const newWin = window.open('/24Pilot/vnas', 'VNASWindow', 'width=800,height=600');
    
    if (newWin) {
      newWin.addEventListener('load', () => {
        newWin.localStorage.setItem("vnasContent", vnasContent);
        if (newWin.document.getElementById('vnas-textbox')) {
          newWin.document.getElementById('vnas-textbox').value = vnasContent;
        }
      });
      this.hideVNAS();
    }
  }

  loadStateFromStorage() {
    try {
      const savedContent = localStorage.getItem("vnasContent") || "";
      const isVisible = localStorage.getItem("vnasVisible") === "true";
      
      this.textbox.value = savedContent;
      
      if (isVisible) {
        this.updateVNASVisibility(true);
      }
    } catch (error) {
      console.warn('Failed to load VNAS state from localStorage:', error);
      this.textbox.value = "";
    }
  }

  saveStateToStorage() {
    try {
      localStorage.setItem("vnasContent", this.textbox.value);
    } catch (error) {
      console.warn('Failed to save VNAS content to localStorage:', error);
    }
  }

  updateVNASVisibility(forceVisible = false) {
    let shouldBeVisible = forceVisible || this.vnasWindow.classList.contains("hidden");
    
    localStorage.setItem("vnasVisible", shouldBeVisible.toString());
    
    this.vnasWindow.classList.toggle("hidden", !shouldBeVisible);
    this.vnasTab.classList.toggle("tab-active", shouldBeVisible);
    
    if (shouldBeVisible) {
      // Resize canvas and redraw when becoming visible with multiple attempts
      setTimeout(() => {
        if (this.canvas) {
          this.resizeCanvas();
          this.drawProfile();
        }
      }, 50);
      
      setTimeout(() => {
        if (this.canvas) {
          this.resizeCanvas();
          this.drawProfile();
        }
      }, 200);
    }
  }

  // Method to update VNAS display when aircraft data changes
  updateAircraftData() {
    if (!this.vnasWindow.classList.contains("hidden") && this.canvas) {
      this.drawProfile();
    }
  }

  hideVNAS() {
    this.vnasWindow.classList.add("hidden");
    this.vnasTab.classList.remove("tab-active");
    localStorage.setItem("vnasVisible", "false");
  }
}

/**
 * Manages all functionality for a floating FlightPlan window.
 */
class FlightPlanManager {
  constructor(notifier) {
    this.notifier = notifier;
    this.flightplanWindow = document.getElementById("flightplan-window");
    this.flightplanTab = document.getElementById("flightplan-tab");
    this.closeButton = document.getElementById("close-flightplan");
    this.popoutButton = document.getElementById("popout-flightplan");
    this.flightplanHeader = document.getElementById("flightplan-header");
    this.flightplanContent = document.getElementById("flightplan-content");
    this.resizeHandles = document.querySelectorAll("#flightplan-window .resize-handle");

    this.isDragging = false;
    this.isResizing = false;
    this.initialDragX = 0;
    this.initialDragY = 0;

    this.init();
  }

  init() {
    if (!this.flightplanWindow || !this.flightplanTab) {
      console.error("FlightPlan initialization failed: Core elements not found.");
      return;
    }

    this.setupEventListeners();
    this.loadStateFromStorage();
    this.initializeDimensions();
    this.createFlightPlanInterface();
  }

  initializeDimensions() {
    // Load and apply window state
    const defaultState = { left: 200, top: 100, width: 500, height: 600 };
    const windowState = loadWindowState('flightplan', this.flightplanWindow, defaultState);
    applyWindowState(this.flightplanWindow, windowState);
  }

  createFlightPlanInterface() {
    this.flightplanContent.innerHTML = `
      <div class="flightplan-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <label>In-Game Callsign:</label>
            <select id="fp-ingamecallsign">
              <option value="">Select Aircraft...</option>
            </select>
          </div>
          <div>
            <label>Callsign:</label>
            <input type="text" id="fp-callsign">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <label>Aircraft:</label>
            <select id="fp-aircraft">
              <option value="">Select Aircraft...</option>
            </select>
          </div>
          <div>
            <label>Flight Rules:</label>
            <select id="fp-flightrules">
              <option value="">Select Rules...</option>
              <option value="IFR">IFR</option>
              <option value="VFR">VFR</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <label>Departing (ICAO):</label>
            <select id="fp-departing">
              <option value="">Select Departure...</option>
            </select>
          </div>
          <div>
            <label>Arriving (ICAO):</label>
            <select id="fp-arriving">
              <option value="">Select Arrival...</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <label>Flight Level:</label>
            <input type="text" id="fp-flightlevel">
          </div>
          <div>
            <label>In-Game Name:</label>
            <select id="fp-ingamename">
              <option value="">Select Player...</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <label>Route (Optional):</label>
          <textarea id="fp-route" rows="3"></textarea>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
          <button id="fp-export">Export Flight Plan</button>
          <button id="fp-clear">Clear Form</button>
        </div>

        <div id="fp-status">
          Ready to create flight plan...
        </div>
        
        <div id="fp-export-output" style="margin-top: 15px; padding: 10px; background: #2a2a2a; border-radius: 4px; font-family: monospace; font-size: 11px; color: #4a90e2; border: 1px solid #444; display: none; position: relative;">
          <div id="fp-export-text" style="margin-bottom: 8px; word-break: break-all;">
            <!-- Export command will appear here -->
          </div>
          <button id="fp-quick-copy" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; background: #4a90e2; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Quick Copy</button>
        </div>
      </div>
    `;

    this.populateDropdowns();
    this.setupFlightPlanControls();
  }

  populateDropdowns() {
    this.populateAircraftDropdowns();
    this.populateAirportDropdowns();
  }

  populateAircraftDropdowns() {
    const ingamecallsignSelect = document.getElementById('fp-ingamecallsign');
    const aircraftSelect = document.getElementById('fp-aircraft');
    const ingamenameSelect = document.getElementById('fp-ingamename');
    
    // Store current values to preserve them
    const currentIngameCallsign = ingamecallsignSelect.value;
    const currentAircraft = aircraftSelect.value;
    const currentIngameName = ingamenameSelect.value;
    
    // Clear existing options
    ingamecallsignSelect.innerHTML = '<option value="">Select Aircraft...</option>';
    aircraftSelect.innerHTML = '<option value="">Select Aircraft...</option>';
    ingamenameSelect.innerHTML = '<option value="">Select Player...</option>';
    
    // Collect unique values
    const aircraftTypes = new Map(); // Store both ICAO and full name
    const playerNames = new Set();
    
    if (window.lastAircraftData) {
      for (const [callsign, aircraft] of Object.entries(window.lastAircraftData)) {
        const option = document.createElement('option');
        option.value = callsign;
        option.textContent = `${callsign} (${aircraft.playerName || 'Unknown'})`;
        ingamecallsignSelect.appendChild(option);
        
        // Collect unique aircraft types and player names (from all aircraft)
        if (aircraft.aircraftType) {
          // Store both ICAO code and full name for aircraft
          const fullName = this.getAircraftFullName(aircraft.aircraftType);
          aircraftTypes.set(aircraft.aircraftType, fullName);
        }
        if (aircraft.playerName) playerNames.add(aircraft.playerName);
      }
    }
    
    // Also collect from flight plans for aircraft types
    if (flightPlans && flightPlans.size > 0) {
      for (const [playerName, flightPlan] of flightPlans.entries()) {
        if (flightPlan.aircraft) {
          const fullName = this.getAircraftFullName(flightPlan.aircraft);
        }
        if (playerName) playerNames.add(playerName);
      }
    }
    
    // Populate aircraft dropdown with full names but store ICAO codes
    Array.from(aircraftTypes.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([icao, fullName]) => {
        const option = document.createElement('option');
        option.value = icao; // Store ICAO for export
        option.textContent = fullName; // Display full name
        aircraftSelect.appendChild(option);
      });
    
    // Populate player name dropdown
    Array.from(playerNames).sort().forEach(playerName => {
      const option = document.createElement('option');
      option.value = playerName;
      option.textContent = playerName;
      ingamenameSelect.appendChild(option);
    });
    
    // Restore previous values if they still exist
    if (currentIngameCallsign && Array.from(ingamecallsignSelect.options).find(opt => opt.value === currentIngameCallsign)) {
      ingamecallsignSelect.value = currentIngameCallsign;
    }
    if (currentAircraft && Array.from(aircraftSelect.options).find(opt => opt.value === currentAircraft)) {
      aircraftSelect.value = currentAircraft;
    }
    if (currentIngameName && Array.from(ingamenameSelect.options).find(opt => opt.value === currentIngameName)) {
      ingamenameSelect.value = currentIngameName;
    }
  }

  populateAirportDropdowns() {
    const departingSelect = document.getElementById('fp-departing');
    const arrivingSelect = document.getElementById('fp-arriving');
    
    // Store current selections
    const currentDeparting = departingSelect.value;
    const currentArriving = arrivingSelect.value;
    
    // Clear dropdowns
    departingSelect.innerHTML = '<option value="">Select Departure...</option>';
    arrivingSelect.innerHTML = '<option value="">Select Arrival...</option>';
    
    // Define all airports by island with correct names
    // TODO: Add roadbases and remove seabases/carriers as needed
    // noinspection JSNonASCIINames
      const airportsByIsland = {
      'Rockford': [
        { icao: 'Greater Rockford', name: 'Greater Rockford (IRFD)' },
        { icao: 'Mellor', name: 'Mellor Intl. (IMLR)' },
        { icao: 'Boltic Airfield', name: 'Boltic Airfield (IBLT)' },
        { icao: 'Airbase Garry', name: 'Airbase Garry (IGAR)' },
        { icao: 'Training Centre', name: 'Training Centre (ITRC)' }
      ],
      'Sauthamptona': [
        { icao: 'Sauthemptona', name: 'Sauthamptona Airport (ISAU)' }
      ],
      'Grindavik': [
        { icao: 'Grindavik', name: 'Grindavik Airport (IGRV)' },
      ],
      'Saint Barthélemy': [
        { icao: 'Saint Barthélemy', name: 'Saint Barthélemy (IBTH)' },
        { icao: 'Skopelos', name: 'Skopelos Airfield (ISKP)' }
      ],
      'Cyprus': [
        { icao: 'Henstridge Airfield', name: 'Henstridge (IHEN)' },
        { icao: 'Larnaca', name: 'Larnaca Intl. (ILAR)' },
        { icao: 'Barra', name: 'Barra (IBAR)' },
        { icao: 'Paphos', name: 'Paphos Intl. (IPAP)' },
        { icao: 'McConnell AFB', name: 'McConnell AFB (IIAB)' }
      ],
      'Izolirani': [
        { icao: 'Izolirani', name: 'Izolirani Intl. (IZOL)' },
        { icao: 'Al Najaf', name: 'Al Najaf (IJAF)' },
      ],
      'Perth': [
        { icao: 'Perth', name: 'Perth Intl. (IPPH)' },
        { icao: 'Lukla', name: 'Lukla (ILKL)' },
      ],
      'Orenji': [
        { icao: 'Tokyo', name: 'Tokyo Intl. (ITKO)' },
        { icao: 'Saba', name: 'Saba (IDCS)' },
        { icao: 'Bird Island Airfield', name: 'Bird Island Airfield (IBRD)' }
      ]
    };

    const allAirports = [];
    Object.values(airportsByIsland).forEach(airports => {
      allAirports.push(...airports);
    });
    
    Object.entries(airportsByIsland).forEach(([island, airports]) => {
      if (airports.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = island;
        
        airports.sort((a, b) => a.name.localeCompare(b.name)).forEach(airport => {
          const option = document.createElement('option');
          option.value = airport.icao;
          option.textContent = `${airport.name}`;
          optgroup.appendChild(option);
        });
        
        departingSelect.appendChild(optgroup);
      }
    });

    this.airportsByIsland = airportsByIsland;
    this.allAirports = allAirports;

    this.updateArrivingDropdown();

    if (currentDeparting && Array.from(departingSelect.options).find(opt => opt.value === currentDeparting)) {
      departingSelect.value = currentDeparting;
    }
    if (currentArriving && Array.from(arrivingSelect.options).find(opt => opt.value === currentArriving)) {
      arrivingSelect.value = currentArriving;
    }
  }

  updateArrivingDropdown() {
    const arrivingSelect = document.getElementById('fp-arriving');
    const departingSelect = document.getElementById('fp-departing');
    const flightRulesSelect = document.getElementById('fp-flightrules');
    
    const currentArriving = arrivingSelect.value;
    arrivingSelect.innerHTML = '<option value="">Select Arrival...</option>';
    
    if (!this.airportsByIsland) return;
    
    // If VFR and departure is selected, show only same island
    if (flightRulesSelect.value === 'VFR' && departingSelect.value) {
      const departingIsland = this.findAirportIsland(departingSelect.value);
      if (departingIsland && this.airportsByIsland[departingIsland]) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = departingIsland;
        
        this.airportsByIsland[departingIsland]
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(airport => {
            const option = document.createElement('option');
            option.value = airport.icao;
            option.textContent = `${airport.name} (${airport.icao})`;
            optgroup.appendChild(option);
          });
        
        arrivingSelect.appendChild(optgroup);
      }
    } else {
      // IFR or no departure selected - show all islands
      Object.entries(this.airportsByIsland).forEach(([island, airports]) => {
        if (airports.length > 0) {
          const optgroup = document.createElement('optgroup');
          optgroup.label = island;
          
          airports.sort((a, b) => a.name.localeCompare(b.name)).forEach(airport => {
            const option = document.createElement('option');
            option.value = airport.icao;
            option.textContent = `${airport.name} (${airport.icao})`;
            optgroup.appendChild(option);
          });
          
          arrivingSelect.appendChild(optgroup);
        }
      });
    }
    
    // Restore selection if still available
    if (currentArriving && Array.from(arrivingSelect.options).find(opt => opt.value === currentArriving)) {
      arrivingSelect.value = currentArriving;
    }
  }

  findAirportIsland(icao) {
    for (const [island, airports] of Object.entries(this.airportsByIsland || {})) {
      if (airports.find(airport => airport.icao === icao)) {
        return island;
      }
    }
    return null;
  }

  generateSuggestedCallsign(ingameCallsign) {
    // Extract airline code (letters before numbers) and last 4 characters
    const match = ingameCallsign.match(/^([A-Za-z]+).*?(\d{1,4})$/);
    if (match) {
      const airlineCode = match[1].toUpperCase();
      const lastDigits = match[2].padStart(4, '0').slice(-4);
      return `${airlineCode}${lastDigits}`;
    }
    
    // Fallback: just use the last 4 characters
    return ingameCallsign.slice(-4).toUpperCase();
  }

  getAircraftFullName(icaoCode) {
    return aircraftCodes[icaoCode] || icaoCode; // Return full name or ICAO if not found
  }

  setupFlightPlanControls() {
    const exportButton = document.getElementById('fp-export');
    const clearButton = document.getElementById('fp-clear');
    const ingamecallsignSelect = document.getElementById('fp-ingamecallsign');
    const aircraftSelect = document.getElementById('fp-aircraft');
    const ingamenameSelect = document.getElementById('fp-ingamename');
    const departingSelect = document.getElementById('fp-departing');
    const flightRulesSelect = document.getElementById('fp-flightrules');

    // Handle in-game callsign selection
    ingamecallsignSelect.addEventListener('change', (e) => {
      const selectedCallsign = e.target.value;
      if (selectedCallsign && window.lastAircraftData) {
        const aircraft = window.lastAircraftData[selectedCallsign];
        if (aircraft) {
          // Auto-populate aircraft type (find matching option) - only if not already selected
          if (!aircraftSelect.value) {
            const aircraftOption = Array.from(aircraftSelect.options).find(opt => opt.value === aircraft.aircraftType);
            if (aircraftOption) {
              aircraftSelect.value = aircraft.aircraftType;
            }
          }
          
          // Auto-populate in-game name (find matching option) - only if not already selected
          if (!ingamenameSelect.value) {
            const nameOption = Array.from(ingamenameSelect.options).find(opt => opt.value === aircraft.playerName);
            if (nameOption) {
              ingamenameSelect.value = aircraft.playerName;
            }
          }
          
          // Generate suggested callsign (ICAO + last 4 digits of callsign)
          if (!document.getElementById('fp-callsign').value) {
              document.getElementById('fp-callsign').value = this.generateSuggestedCallsign(selectedCallsign);
          }
          
          // Load flight plan data if available (but aircraft without flight plans shouldn't have this)
          const flightPlan = flightPlans.get(aircraft.playerName);
          if (flightPlan) {
            if (!document.getElementById('fp-departing').value) document.getElementById('fp-departing').value = flightPlan.departing || '';
            if (!document.getElementById('fp-arriving').value) document.getElementById('fp-arriving').value = flightPlan.arriving || '';
            if (!document.getElementById('fp-route').value) document.getElementById('fp-route').value = flightPlan.route || '';
            if (!document.getElementById('fp-flightlevel').value) document.getElementById('fp-flightlevel').value = flightPlan.flightlevel || '';
          }
        }
      }
    });

    // Handle flight rules change (VFR/IFR)
    flightRulesSelect.addEventListener('change', () => {
      this.updateArrivingDropdown();
    });

    // Handle departure change (for VFR island filtering)
    departingSelect.addEventListener('change', () => {
      this.updateArrivingDropdown();
    });

    exportButton.addEventListener('click', () => {
      this.exportFlightPlan();
    });

    clearButton.addEventListener('click', () => {
      this.clearForm();
    });

    // Handle quick-copy button
    const setupQuickCopyButton = () => {
      const quickCopyButton = document.getElementById('fp-quick-copy');
      if (quickCopyButton) {
        quickCopyButton.addEventListener('click', () => {
          const exportText = document.getElementById('fp-export-text');
          if (exportText && exportText.textContent) {
            navigator.clipboard.writeText(exportText.textContent).then(() => {
              quickCopyButton.textContent = 'Copied!';
              quickCopyButton.style.background = '#50c878';
              setTimeout(() => {
                quickCopyButton.textContent = 'Quick Copy';
                quickCopyButton.style.background = '#4a90e2';
              }, 1500);
            }).catch(() => {
              this.updateStatus('Failed to copy to clipboard', 'error');
            });
          }
        });
      }
    };

    // Setup quick copy button initially and after each export
    setupQuickCopyButton();
    this.setupQuickCopyButton = setupQuickCopyButton;

    // No auto-save functionality - only save when export is clicked
  }

  exportFlightPlan() {
    const formData = this.getFormData();
    
    // Validate required fields (route is now optional)
    const required = ['ingamecallsign', 'callsign', 'aircraft', 'flightrules', 'departing', 'arriving', 'flightlevel', 'ingamename'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      this.updateStatus(`Missing required fields: ${missing.join(', ')}`, 'error');
      return;
    }

    // Generate export command with route as optional (use N/A if empty)
    const route = formData.route && formData.route.trim() ? formData.route.trim() : 'N/A';
    const command = `/createflightplan ingamecallsign:${formData.ingamecallsign} callsign:${formData.callsign} aircraft:${formData.aircraft} flightrules:${formData.flightrules} departing:${formData.departing} arriving:${formData.arriving} flightlevel:${formData.flightlevel} ingamename:${formData.ingamename} route:${route}`;
    
    // Display export command
    const exportOutput = document.getElementById('fp-export-output');
    const exportText = document.getElementById('fp-export-text');
    exportText.textContent = command;
    exportOutput.style.display = 'block';
    
    // Setup quick copy button for this export
    if (this.setupQuickCopyButton) {
      this.setupQuickCopyButton();
    }
    
    // Copy to clipboard automatically
    navigator.clipboard.writeText(command).then(() => {
      this.updateStatus('Flight plan command copied to clipboard!', 'success');
    }).catch(() => {
      this.updateStatus('Flight plan command generated (copy manually)', 'info');
    });
    
    // ONLY save to local storage when export is clicked
    this.saveToLocalStorage();
  }

  clearForm() {
    const inputs = this.flightplanContent.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    });
    
    // Hide export output
    const exportOutput = document.getElementById('fp-export-output');
    exportOutput.style.display = 'none';
    
    this.updateStatus('Form cleared', 'info');
  }

  getFormData() {
    return {
      ingamecallsign: document.getElementById('fp-ingamecallsign').value,
      callsign: document.getElementById('fp-callsign').value,
      aircraft: document.getElementById('fp-aircraft').value,
      flightrules: document.getElementById('fp-flightrules').value,
      departing: document.getElementById('fp-departing').value,
      arriving: document.getElementById('fp-arriving').value,
      flightlevel: document.getElementById('fp-flightlevel').value,
      ingamename: document.getElementById('fp-ingamename').value,
      route: document.getElementById('fp-route').value
    };
  }

  updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('fp-status');
    const colors = {
      success: '#50c878',
      error: '#e24a4a',
      warning: '#ffa500',
      info: '#4a90e2'
    };
    
    statusDiv.textContent = message;
    statusDiv.style.color = colors[type] || colors.info;
    
    setTimeout(() => {
      statusDiv.textContent = 'Ready to create flight plan...';
      statusDiv.style.color = '#aaa';
    }, 3000);
  }

  setupEventListeners() {
    this.flightplanTab.addEventListener("click", () => this.updateFlightPlanVisibility(true));
    
    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => this.hideFlightPlan());
    }

    if (this.popoutButton) {
      this.popoutButton.addEventListener("click", () => this.openFlightPlanInNewWindow());
    }

    // Bring window to front when clicked
    this.flightplanWindow.addEventListener("mousedown", () => {
      bringWindowToFront(this.flightplanWindow);
    });

    this.setupDragAndResize();
  }

  setupDragAndResize() {
    // Dragging functionality
    this.flightplanHeader.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.initialDragX = e.clientX - this.flightplanWindow.offsetLeft;
      this.initialDragY = e.clientY - this.flightplanWindow.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        let newLeft = e.clientX - this.initialDragX;
        let newTop = e.clientY - this.initialDragY;

        const sidebarWidth = 150;
        newLeft = Math.max(sidebarWidth, Math.min(newLeft, window.innerWidth - this.flightplanWindow.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - this.flightplanWindow.offsetHeight));

        this.flightplanWindow.style.left = `${newLeft}px`;
        this.flightplanWindow.style.top = `${newTop}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        saveWindowState('flightplan', this.flightplanWindow);
      }
      this.isDragging = false;
    });

    // Resizing functionality
    this.resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.isResizing = true;
        const rect = this.flightplanWindow.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(document.defaultView.getComputedStyle(this.flightplanWindow).width, 10);
        const startHeight = parseInt(document.defaultView.getComputedStyle(this.flightplanWindow).height, 10);

        const doResize = (e) => {
          if (!this.isResizing) return;
          
          const newWidth = startWidth + (e.clientX - startX);
          const newHeight = startHeight + (e.clientY - startY);
          
          this.flightplanWindow.style.width = Math.max(400, newWidth) + 'px';
          this.flightplanWindow.style.height = Math.max(500, newHeight) + 'px';
        };

        const stopResize = () => {
          this.isResizing = false;
          saveWindowState('flightplan', this.flightplanWindow);
        };

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });
    });
  }

  openFlightPlanInNewWindow() {
    const flightPlanData = JSON.stringify(this.getFormData());
    const newWin = window.open('/24Pilot/flightplan', 'FlightPlanWindow', 'width=600,height=700');
    
    if (newWin) {
      newWin.addEventListener('load', () => {
        newWin.localStorage.setItem("flightPlanData", flightPlanData);
      });
      this.hideFlightPlan();
    }
  }

  loadStateFromStorage() {
    const savedData = localStorage.getItem("flightPlanData");
    const isVisible = localStorage.getItem("flightPlanVisible") === "true";
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        // Will populate form after interface is created
        setTimeout(() => this.populateForm(data), 100);
      } catch (e) {
        console.warn("Failed to load flight plan data:", e);
      }
    }
    
    if (isVisible) {
      this.updateFlightPlanVisibility(true);
    }
  }

  populateForm(data) {
    if (data.ingamecallsign) document.getElementById('fp-ingamecallsign').value = data.ingamecallsign;
    if (data.callsign) document.getElementById('fp-callsign').value = data.callsign;
    if (data.aircraft) document.getElementById('fp-aircraft').value = data.aircraft;
    if (data.flightrules) document.getElementById('fp-flightrules').value = data.flightrules;
    if (data.departing) document.getElementById('fp-departing').value = data.departing;
    if (data.arriving) document.getElementById('fp-arriving').value = data.arriving;
    if (data.flightlevel) document.getElementById('fp-flightlevel').value = data.flightlevel;
    if (data.ingamename) document.getElementById('fp-ingamename').value = data.ingamename;
    if (data.route) document.getElementById('fp-route').value = data.route;
  }

  saveToLocalStorage() {
    const data = this.getFormData();
    localStorage.setItem("flightPlanData", JSON.stringify(data));
  }

  updateFlightPlanVisibility(forceVisible = false) {
    let shouldBeVisible = forceVisible || this.flightplanWindow.classList.contains("hidden");
    
    localStorage.setItem("flightPlanVisible", shouldBeVisible.toString());
    
    this.flightplanWindow.classList.toggle("hidden", !shouldBeVisible);
    this.flightplanTab.classList.toggle("tab-active", shouldBeVisible);
  }

  hideFlightPlan() {
    this.flightplanWindow.classList.add("hidden");
    this.flightplanTab.classList.remove("tab-active");
    localStorage.setItem("flightPlanVisible", "false");
  }

  // Method to refresh aircraft data when new data comes in
  updateAircraftData() {
    if (this.flightplanContent && !this.flightplanWindow.classList.contains("hidden")) {
      this.populateAircraftDropdowns();
      this.populateAirportDropdowns();
    }
  }
}

/**
 * Manages all functionality for a floating ILS/LOC window.
 */
class ILSLOCManager {
  constructor(notifier) {
    this.notifier = notifier;
    this.ilslocWindow = document.getElementById("ilsloc-window");
    this.ilslocTab = document.getElementById("ilsloc-tab");
    this.closeButton = document.getElementById("close-ilsloc");
    this.popoutButton = document.getElementById("popout-ilsloc");
    this.ilslocHeader = document.getElementById("ilsloc-header");
    this.ilslocContent = document.getElementById("ilsloc-content");
    this.resizeHandles = document.querySelectorAll("#ilsloc-window .resize-handle");

    this.isDragging = false;
    this.isResizing = false;
    this.initialDragX = 0;
    this.initialDragY = 0;

    this.selectedAirport = null;
    this.selectedRunway = null;
    this.selectedChart = null;

    this.init();
  }

  init() {
    if (!this.ilslocWindow || !this.ilslocTab) {
      console.error("ILS/LOC initialization failed: Core elements not found.");
      return;
    }

    this.setupEventListeners();
    this.loadStateFromStorage();
    this.initializeDimensions();
    this.createILSLOCInterface();
  }

  initializeDimensions() {
    // Load and apply window state
    const defaultState = { left: 250, top: 150, width: 500, height: 600 };
    const windowState = loadWindowState('ilsloc', this.ilslocWindow, defaultState);
    applyWindowState(this.ilslocWindow, windowState);
  }

  createILSLOCInterface() {
    // Clear existing content and create new dual-display structure
    this.ilslocContent.style.margin = '0';
    this.ilslocContent.style.padding = '0';
    this.ilslocContent.style.width = '100%';
    this.ilslocContent.style.height = '100%';
    
    this.ilslocContent.innerHTML = `
      <div style="display: flex; height: 100%; width: 100%; margin: 0; padding: 0; box-sizing: border-box;">
        <!-- Left side - Dual displays -->
        <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
          <!-- Top display - Glideslope Altitude View -->
          <div class="glideslope-container" style="position: relative; flex: 1; background: #1a1a1a; border-bottom: 1px solid #444; overflow: hidden;">
            <div style="position: absolute; top: 5px; left: 10px; color: #888; font-size: 12px; z-index: 10;">
              Glideslope - Altitude View
            </div>
            <canvas id="glideslope-canvas" style="display: block; width: 100%; height: 100%;"></canvas>
          </div>
          
          <!-- Bottom display - Glidepath Overhead View -->
          <div class="glidepath-container" style="position: relative; flex: 1; background: #1a1a1a; overflow: hidden;">
            <div style="position: absolute; top: 5px; left: 10px; color: #888; font-size: 12px; z-index: 10;">
              Glidepath - Overhead View
            </div>
            <canvas id="glidepath-canvas" style="display: block; width: 100%; height: 100%;"></canvas>
          </div>
        </div>
        
        <!-- Right side - Airport/Runway/Chart Controls -->
        <div class="ilsloc-controls" style="flex: 0 0 auto; width: 180px; padding: 8px; background: #2a2a2a; border-left: 1px solid #444; display: flex; flex-direction: column; gap: 10px;">
          <div style="color: white; font-size: 11px;">
            <h4 style="margin: 0 0 10px 0; color: #ccc; font-size: 12px;">ILS/LOC Setup</h4>
            
            <div style="margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 3px; font-size: 10px; color: #aaa;">Airport:</label>
              <select id="ilsloc-airport" style="width: 100%; padding: 4px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 2px; font-size: 10px;">
                <option value="">Select...</option>
                <option value="ISAU">ISAU - Sauthemptona</option>
                <option value="IPPH">IPPH - Perth</option>
                <option value="ILAR">ILAR - Larnaca</option>
                <option value="IBAR">IBAR - Barra</option>
                <option value="IJAF">IJAF - Al Najaf</option>
                <option value="ITKO">ITKO - Tokyo</option>
                <option value="IGRV">IGRV - Grindavik</option>
                <option value="IBLT">IBLT - Baltic</option>
              </select>
            </div>
            
            <div style="margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 3px; font-size: 10px; color: #aaa;">Runway:</label>
              <select id="ilsloc-runway" style="width: 100%; padding: 4px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 2px; font-size: 10px;" disabled>
                <option value="">Select Airport...</option>
              </select>
            </div>
            
            <div style="margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 3px; font-size: 10px; color: #aaa;">Approach:</label>
              <select id="ilsloc-chart" style="width: 100%; padding: 4px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 2px; font-size: 10px;" disabled>
                <option value="">Select Runway...</option>
              </select>
            </div>
          </div>
          
          <div style="border-top: 1px solid #444; padding-top: 10px; color: white; font-size: 10px;">
            <h5 style="margin: 0 0 8px 0; color: #ccc; font-size: 11px;">Approach Data</h5>
            
            <div style="margin-bottom: 6px;">
              <label style="display: block; margin-bottom: 2px; font-size: 10px; color: #aaa;">Glideslope:</label>
              <input type="number" id="glideslope-angle" min="1" max="10" step="0.1" value="3.0" style="width: 50px; padding: 2px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 2px; font-size: 10px;">
              <span style="font-size: 9px; color: #888;">°</span>
            </div>
            
            <div style="margin-bottom: 6px;">
              <label style="display: block; margin-bottom: 2px; font-size: 10px; color: #aaa;">Decision Alt:</label>
              <input type="number" id="decision-altitude" min="0" max="5000" step="100" value="200" style="width: 60px; padding: 2px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 2px; font-size: 10px;">
              <span style="font-size: 9px; color: #888;">ft</span>
            </div>
            
            <div style="margin-bottom: 6px;">
              <label style="display: block; margin-bottom: 2px; font-size: 10px; color: #aaa;">ILS Frequency:</label>
              <input type="text" id="ils-frequency" placeholder="108.10" style="width: 70px; padding: 2px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 2px; font-size: 10px;">
            </div>
            
            <div style="margin-bottom: 8px;">
              <label style="display: block; margin-bottom: 2px; font-size: 10px; color: #aaa;">Course:</label>
              <input type="number" id="approach-course" min="0" max="359" step="1" value="090" style="width: 50px; padding: 2px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 2px; font-size: 10px;">
              <span style="font-size: 9px; color: #888;">°</span>
            </div>
            
            <div id="approach-info" style="color: #aaa; font-size: 9px; word-wrap: break-word; border-top: 1px solid #444; padding-top: 8px;">
              <div id="runway-info">Select runway for approach data</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupCanvases();
    this.setupFormListeners();
    
    // Initial canvas setup with delay to ensure layout is complete
    setTimeout(() => {
      this.resizeCanvases();
      this.drawDisplays();
    }, 10);
    
    // Add resize observer to handle dynamic resizing
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        requestAnimationFrame(() => {
          this.resizeCanvases();
          this.drawDisplays();
        });
      });
      this.resizeObserver.observe(this.ilslocContent);
    }
  }

  setupCanvases() {
    this.glideslopeCanvas = document.getElementById('glideslope-canvas');
    this.glidepathCanvas = document.getElementById('glidepath-canvas');
    
    if (this.glideslopeCanvas) {
      this.glideslopeCtx = this.glideslopeCanvas.getContext('2d');
    }
    
    if (this.glidepathCanvas) {
      this.glidepathCtx = this.glidepathCanvas.getContext('2d');
    }
  }

  resizeCanvases() {
    if (this.glideslopeCanvas && this.glideslopeCtx) {
      const container = this.glideslopeCanvas.parentElement;
      const rect = container.getBoundingClientRect();
      this.glideslopeCanvas.width = rect.width;
      this.glideslopeCanvas.height = rect.height;
    }
    
    if (this.glidepathCanvas && this.glidepathCtx) {
      const container = this.glidepathCanvas.parentElement;
      const rect = container.getBoundingClientRect();
      this.glidepathCanvas.width = rect.width;
      this.glidepathCanvas.height = rect.height;
    }
  }

  drawDisplays() {
    this.drawGlideslopeView();
    this.drawGlidepathView();
  }

  drawGlideslopeView() {
    if (!this.glideslopeCanvas || !this.glideslopeCtx) return;
    
    const ctx = this.glideslopeCtx;
    const width = this.glideslopeCanvas.width;
    const height = this.glideslopeCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up drawing context
    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#ccc';
    ctx.font = '11px Arial';
    
    // Draw simple grid
    this.drawGrid(ctx, width, height, true);
    
    // Define clean approach area
    const margin = 50;
    const chartWidth = width - (margin * 2);
    const chartHeight = height - 80; // Leave space for labels
    const chartTop = 50;
    const chartBottom = chartTop + chartHeight;
    const chartLeft = margin;
    const chartRight = chartLeft + chartWidth;
    
    // Draw border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(chartLeft, chartTop, chartWidth, chartHeight);
    
    if (this.selectedRunway) {
      const glideslopeAngle = parseFloat(document.getElementById('glideslope-angle')?.value || '3.0');
      const decisionAlt = parseFloat(document.getElementById('decision-altitude')?.value || '200');
      
      // Draw glideslope line
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(chartRight, chartBottom); // Runway threshold
      ctx.lineTo(chartLeft, chartTop + 50); // 10nm out
      ctx.stroke();
      
      // Draw decision altitude line
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 4]);
      const daHeight = chartBottom - (decisionAlt / 3000) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(chartLeft, daHeight);
      ctx.lineTo(chartRight, daHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Simple labels
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`${glideslopeAngle}° GLIDESLOPE`, chartLeft + 10, 30);
      ctx.fillStyle = '#ff4444';
      ctx.fillText(`DA ${decisionAlt}FT`, chartLeft + 10, daHeight - 10);
    }
    
    // Clean altitude markers
    ctx.fillStyle = '#999';
    ctx.textAlign = 'right';
    ctx.font = '10px Arial';
    for (let alt = 0; alt <= 3000; alt += 500) {
      const y = chartBottom - (alt / 3000) * chartHeight;
      ctx.fillText(`${alt}'`, chartLeft - 5, y + 3);
    }
    
    // Distance markers
    ctx.textAlign = 'center';
    for (let dist = 0; dist <= 10; dist += 2) {
      const x = chartRight - (dist / 10) * chartWidth;
      ctx.fillText(`${dist}`, x, height - 10);
    }
    
    ctx.textAlign = 'left';
  }

  drawGlidepathView() {
    if (!this.glidepathCanvas || !this.glidepathCtx) return;
    
    const ctx = this.glidepathCtx;
    const width = this.glidepathCanvas.width;
    const height = this.glidepathCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up drawing context
    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#ccc';
    ctx.font = '11px Arial';
    
    // Draw simple grid
    this.drawGrid(ctx, width, height, false);
    
    // Define clean chart area
    const margin = 50;
    const chartWidth = width - (margin * 2);
    const chartHeight = height - 80;
    const chartTop = 50;
    const chartBottom = chartTop + chartHeight;
    const chartLeft = margin;
    const chartRight = chartLeft + chartWidth;
    const centerY = chartTop + chartHeight / 2;
    
    // Draw border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(chartLeft, chartTop, chartWidth, chartHeight);
    
    if (this.selectedRunway) {
      const course = parseFloat(document.getElementById('approach-course')?.value || '090');
      
      // Draw runway
      const runwayX = chartRight - 20;
      const runwayWidth = 12;
      const runwayLength = 30;
      
      ctx.fillStyle = '#666';
      ctx.fillRect(runwayX, centerY - runwayWidth / 2, runwayLength, runwayWidth);
      
      // Draw centerline
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(chartLeft, centerY);
      ctx.lineTo(runwayX, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw localizer beam (simple version)
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(chartLeft, centerY - 30);
      ctx.lineTo(runwayX, centerY - runwayWidth / 2);
      ctx.moveTo(chartLeft, centerY + 30);
      ctx.lineTo(runwayX, centerY + runwayWidth / 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      
      // Labels
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`CRS ${course.toString().padStart(3, '0')}°`, chartLeft + 10, 30);
      ctx.fillText(`RWY ${this.selectedRunway}`, runwayX - 20, centerY - runwayWidth / 2 - 10);
    }
    
    // Distance markers
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.font = '10px Arial';
    for (let dist = 0; dist <= 10; dist += 2) {
      const x = chartRight - (dist / 10) * chartWidth;
      if (dist > 0) {
        ctx.fillText(`${dist}`, x, height - 10);
      }
    }
    
    // Lateral distance markers
    ctx.textAlign = 'right';
    for (let i = 1; i <= 2; i++) {
      const y1 = centerY - i * 25;
      const y2 = centerY + i * 25;
      ctx.fillText(`${i}`, chartLeft - 5, y1 + 3);
      ctx.fillText(`${i}`, chartLeft - 5, y2 + 3);
    }
    
    ctx.textAlign = 'left';
  }

  drawGrid(ctx, width, height, isVertical) {
    // Simple, clean grid - only major lines
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    
    const spacing = 40; // Larger spacing for cleaner look
    
    // Vertical lines
    for (let x = spacing; x < width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = spacing; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  setupFormListeners() {
    const airportSelect = document.getElementById('ilsloc-airport');
    const runwaySelect = document.getElementById('ilsloc-runway');
    const chartSelect = document.getElementById('ilsloc-chart');
    const glideslopeInput = document.getElementById('glideslope-angle');
    const decisionAltInput = document.getElementById('decision-altitude');
    const ilsFreqInput = document.getElementById('ils-frequency');
    const courseInput = document.getElementById('approach-course');

    airportSelect?.addEventListener('change', (e) => {
      this.selectedAirport = e.target.value;
      this.populateRunways();
      this.saveStateToStorage();
    });

    runwaySelect?.addEventListener('change', (e) => {
      this.selectedRunway = e.target.value;
      this.populateCharts();
      this.updateRunwayInfo();
      this.drawDisplays();
      this.saveStateToStorage();
    });

    chartSelect?.addEventListener('change', (e) => {
      this.selectedChart = e.target.value;
      this.drawDisplays();
      this.saveStateToStorage();
    });

    // Add listeners for approach parameters that affect the display
    [glideslopeInput, decisionAltInput, courseInput].forEach(input => {
      input?.addEventListener('input', () => {
        this.drawDisplays();
        this.saveStateToStorage();
      });
    });

    ilsFreqInput?.addEventListener('input', () => {
      this.saveStateToStorage();
    });
  }

  populateRunways() {
    const runwaySelect = document.getElementById('ilsloc-runway');
    const chartSelect = document.getElementById('ilsloc-chart');
    
    if (!runwaySelect || !this.selectedAirport) return;

    runwaySelect.innerHTML = '<option value="">Select Runway...</option>';
    chartSelect.innerHTML = '<option value="">Select Runway First...</option>';
    chartSelect.disabled = true;

    const runwayData = {
      'ISAU': ['26', '08'],
      'IPPH': ['33', '15', '11', '29'],
      'ILAR': ['06', '24'],
      'IBAR': ['08', '26', '13', '31'],
      'IJAF': ['25', '07'],
      'ITKO': ['13', '30', '02', '20'],
      'IGRV': ['10', '28'],
      'IBLT': ['19', '01'],
      'IBRD': ['8', '26']
    };

    const runways = runwayData[this.selectedAirport] || [];
    
    runways.forEach(runway => {
      const option = document.createElement('option');
      option.value = runway;
      option.textContent = `RWY ${runway}`;
      runwaySelect.appendChild(option);
    });

    runwaySelect.disabled = false;
  }

  populateCharts() {
    const chartSelect = document.getElementById('ilsloc-chart');
    
    if (!chartSelect || !this.selectedRunway) return;

    chartSelect.innerHTML = '<option value="">Select Approach...</option>';

    const chartTypes = [
      'ILS',
      'LOC', 
      'VOR',
      'RNAV (GPS)',
      'Visual'
    ];

    chartTypes.forEach(chartType => {
      const option = document.createElement('option');
      option.value = chartType.toLowerCase().replace(/[^a-z]/g, '');
      option.textContent = `${chartType} RWY ${this.selectedRunway}`;
      chartSelect.appendChild(option);
    });

    chartSelect.disabled = false;
  }

  updateRunwayInfo() {
    const runwayInfoDiv = document.getElementById('runway-info');
    if (!runwayInfoDiv || !this.selectedAirport || !this.selectedRunway) return;

    const runwayData = {
      'ISAU': {
        '09L': { length: '12000', elevation: '42', ils: '108.10', course: '088' },
        '09R': { length: '10000', elevation: '45', ils: '110.30', course: '088' },
        '27L': { length: '12000', elevation: '42', ils: '109.50', course: '268' },
        '27R': { length: '10000', elevation: '45', ils: '111.70', course: '268' }
      },
      'IPPH': {
        '03': { length: '11500', elevation: '67', ils: '108.90', course: '033' },
        '21': { length: '11500', elevation: '67', ils: '109.10', course: '213' }
      }
    };

    const airportData = runwayData[this.selectedAirport];
    const runway = airportData?.[this.selectedRunway];

    if (runway) {
      runwayInfoDiv.innerHTML = `
        <div><strong>RWY ${this.selectedRunway}</strong></div>
        <div>Length: ${runway.length}ft</div>
        <div>Elevation: ${runway.elevation}ft</div>
        <div>ILS: ${runway.ils}</div>
        <div>Course: ${runway.course}°</div>
      `;

      // Auto-populate fields
      const ilsFreq = document.getElementById('ils-frequency');
      const course = document.getElementById('approach-course');
      
      if (ilsFreq) ilsFreq.value = runway.ils;
      if (course) course.value = runway.course;
    } else {
      runwayInfoDiv.innerHTML = `
        <div><strong>RWY ${this.selectedRunway}</strong></div>
        <div>No data available</div>
      `;
    }
  }



  setupEventListeners() {
    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => this.hideILSLOC());
    }

    if (this.popoutButton) {
      this.popoutButton.addEventListener("click", () => this.openILSLOCInNewWindow());
    }

    if (this.ilslocTab) {
      this.ilslocTab.addEventListener("click", () => {
        if (this.ilslocWindow.classList.contains("hidden")) {
          this.showILSLOC();
        } else {
          this.hideILSLOC();
        }
      });
    }

    this.setupDragAndResize();
  }

  setupDragAndResize() {
    // Dragging functionality
    this.ilslocHeader.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.initialDragX = e.clientX - this.ilslocWindow.offsetLeft;
      this.initialDragY = e.clientY - this.ilslocWindow.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        let newLeft = e.clientX - this.initialDragX;
        let newTop = e.clientY - this.initialDragY;

        const sidebarWidth = 150;
        newLeft = Math.max(sidebarWidth, Math.min(newLeft, window.innerWidth - this.ilslocWindow.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - this.ilslocWindow.offsetHeight));

        this.ilslocWindow.style.left = `${newLeft}px`;
        this.ilslocWindow.style.top = `${newTop}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        saveWindowState('ilsloc', this.ilslocWindow);
      }
      this.isDragging = false;
    });

    // Resizing functionality
    this.resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.isResizing = true;
        const rect = this.ilslocWindow.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(document.defaultView.getComputedStyle(this.ilslocWindow).width, 10);
        const startHeight = parseInt(document.defaultView.getComputedStyle(this.ilslocWindow).height, 10);

        const doResize = (e) => {
          if (!this.isResizing) return;
          
          const newWidth = startWidth + (e.clientX - startX);
          const newHeight = startHeight + (e.clientY - startY);
          
          this.ilslocWindow.style.width = Math.max(400, newWidth) + 'px';
          this.ilslocWindow.style.height = Math.max(500, newHeight) + 'px';
        };

        const stopResize = () => {
          this.isResizing = false;
          saveWindowState('ilsloc', this.ilslocWindow);
        };

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });
    });
  }

  openILSLOCInNewWindow() {
    const ilslocData = JSON.stringify({
      airport: this.selectedAirport,
      runway: this.selectedRunway,
      chart: this.selectedChart
    });
    const newWin = window.open('/24Pilot/ilsloc', 'ILSLOCWindow', 'width=600,height=700');
    
    if (newWin) {
      newWin.addEventListener('load', () => {
        newWin.localStorage.setItem("ilslocData", ilslocData);
      });
      this.hideILSLOC();
    }
  }

  loadStateFromStorage() {
    const savedData = localStorage.getItem("ilslocData");
    const isVisible = localStorage.getItem("ilslocVisible") === "true";
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        this.selectedAirport = data.airport;
        this.selectedRunway = data.runway;
        this.selectedChart = data.chart;
        this.savedApproachData = {
          glideslopeAngle: data.glideslopeAngle,
          decisionAltitude: data.decisionAltitude,
          ilsFrequency: data.ilsFrequency,
          course: data.course
        };
        
        // Will populate form after interface is created
        setTimeout(() => this.populateFormFromSaved(), 100);
      } catch (e) {
        console.warn("Failed to load ILS/LOC data:", e);
      }
    }
    
    if (isVisible) {
      this.updateILSLOCVisibility(true);
    }
  }

  populateFormFromSaved() {
    if (this.selectedAirport) {
      const airportSelect = document.getElementById('ilsloc-airport');
      if (airportSelect) {
        airportSelect.value = this.selectedAirport;
        this.populateRunways();
        
        if (this.selectedRunway) {
          setTimeout(() => {
            const runwaySelect = document.getElementById('ilsloc-runway');
            if (runwaySelect) {
              runwaySelect.value = this.selectedRunway;
              this.populateCharts();
              this.updateRunwayInfo();
              
              if (this.selectedChart) {
                setTimeout(() => {
                  const chartSelect = document.getElementById('ilsloc-chart');
                  if (chartSelect) {
                    chartSelect.value = this.selectedChart;
                  }
                  
                  // Restore approach parameters
                  if (this.savedApproachData) {
                    const glideslopeInput = document.getElementById('glideslope-angle');
                    const decisionAltInput = document.getElementById('decision-altitude');
                    const ilsFreqInput = document.getElementById('ils-frequency');
                    const courseInput = document.getElementById('approach-course');
                    
                    if (glideslopeInput && this.savedApproachData.glideslopeAngle) {
                      glideslopeInput.value = this.savedApproachData.glideslopeAngle;
                    }
                    if (decisionAltInput && this.savedApproachData.decisionAltitude) {
                      decisionAltInput.value = this.savedApproachData.decisionAltitude;
                    }
                    if (ilsFreqInput && this.savedApproachData.ilsFrequency) {
                      ilsFreqInput.value = this.savedApproachData.ilsFrequency;
                    }
                    if (courseInput && this.savedApproachData.course) {
                      courseInput.value = this.savedApproachData.course;
                    }
                  }
                  
                  this.drawDisplays();
                }, 50);
              } else {
                this.drawDisplays();
              }
            }
          }, 50);
        }
      }
    }
  }

  saveStateToStorage() {
    const glideslopeAngle = document.getElementById('glideslope-angle')?.value;
    const decisionAlt = document.getElementById('decision-altitude')?.value;
    const ilsFreq = document.getElementById('ils-frequency')?.value;
    const course = document.getElementById('approach-course')?.value;
    
    const data = {
      airport: this.selectedAirport,
      runway: this.selectedRunway,
      chart: this.selectedChart,
      glideslopeAngle: glideslopeAngle,
      decisionAltitude: decisionAlt,
      ilsFrequency: ilsFreq,
      course: course
    };
    localStorage.setItem("ilslocData", JSON.stringify(data));
  }

  showILSLOC() {
    this.updateILSLOCVisibility(true);
  }

  updateILSLOCVisibility(isVisible) {
    if (isVisible) {
      this.ilslocWindow.classList.remove("hidden");
      this.ilslocTab.classList.add("tab-active");
      bringWindowToFront(this.ilslocWindow);
      localStorage.setItem("ilslocVisible", "true");
    } else {
      this.ilslocWindow.classList.add("hidden");
      this.ilslocTab.classList.remove("tab-active");
      localStorage.setItem("ilslocVisible", "false");
    }
  }

  hideILSLOC() {
    this.ilslocWindow.classList.add("hidden");
    this.ilslocTab.classList.remove("tab-active");
    localStorage.setItem("ilslocVisible", "false");
  }

  // Method to refresh aircraft data when new data comes in
  updateAircraftData() {
    // Update airport data if needed when aircraft data changes
    if (this.ilslocContent && !this.ilslocWindow.classList.contains("hidden")) {
      // Could update based on current aircraft position/destination
    }
  }
}

let vnasManager;
let flightPlanManager;
let ilslocManager;

document.addEventListener("DOMContentLoaded", () => {
  notifier = new NotificationManager();
  new NotepadManager(notifier);
  vnasManager = new VNASManager(notifier);
  flightPlanManager = new FlightPlanManager(notifier);
  ilslocManager = new ILSLOCManager(notifier);
});

map.scrollWheelZoom.enable();
map.dragging.enable();

function formatConstraint(value, unit = "") {
  if (value == null) return "—";
  if (typeof value === "number") return `${value} ${unit}`;
  if (typeof value !== "object") return "—";

  const hasMin = value.min !== undefined;
  const hasMax = value.max !== undefined;
  const hasExact = value.exact !== undefined;

  if (hasExact) return `${value.exact} ${unit}`;
  if (hasMin && hasMax) return `${value.min}–${value.max} ${unit}`;
  if (hasMin) return `≥ ${value.min} ${unit}`;
  if (hasMax) return `≤ ${value.max} ${unit}`;

  return "—";
}

// Aircraft sidebar management
class AircraftSidebarManager {
  constructor() {
    this.sidebar = document.getElementById('aircraft-sidebar');
    this.aircraftList = document.getElementById('aircraft-list');
    this.aircraftCount = document.getElementById('aircraft-count');
    this.aircraft = new Map();
    this.selectedAircraft = null;
    
    // Add close button event listener
    /*const closeButton = document.getElementById('close-aircraft-sidebar');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide();
        // Remove active state from aircraft tab
        const aircraftTab = document.getElementById('aircraft-tab');
        if (aircraftTab) {
          aircraftTab.classList.remove('tab-active');
        }
      });
    }*/
  }

  show() {
    this.sidebar.classList.remove('hidden');
  }

  hide() {
    this.sidebar.classList.add('hidden');
  }

  toggle() {
    this.sidebar.classList.toggle('hidden');
  }

  updateAircraftData(aircraftData) {
    // Store currently selected aircraft before clearing
    const previouslySelected = localStorage.getItem('selectedAircraft');
    
    // Clear existing aircraft
    this.aircraft.clear();
    
    // Clear section containers
    const filedContainer = document.getElementById('filed-aircraft');
    const noPlanContainer = document.getElementById('no-plan-aircraft');
    if (filedContainer) filedContainer.innerHTML = '';
    if (noPlanContainer) noPlanContainer.innerHTML = '';

    // Categorize aircraft by flight plan status
    const filedAircraft = [];
    const noPlanAircraft = [];

    Object.entries(aircraftData).forEach(([callsign, data]) => {
      this.aircraft.set(callsign, data);
      const hasFlightPlan = flightPlans.has(data.playerName || data.pilot);
      
      if (hasFlightPlan) {
        filedAircraft.push([callsign, data]);
      } else {
        noPlanAircraft.push([callsign, data]);
      }
    });

    // Add aircraft to their respective sections
    filedAircraft.forEach(([callsign, data]) => {
      this.createAircraftItem(callsign, data, 'filed-aircraft');
    });

    noPlanAircraft.forEach(([callsign, data]) => {
      this.createAircraftItem(callsign, data, 'no-plan-aircraft');
    });

    this.updateAircraftCount(filedAircraft.length, noPlanAircraft.length);
    
    // Restore selection if the previously selected aircraft still exists
    if (previouslySelected && aircraftData[previouslySelected]) {
      this.restoreSelection(previouslySelected);
    }
  }

  createAircraftItem(callsign, aircraftData, containerId = 'aircraft-list') {
    const item = document.createElement('div');
    item.className = 'aircraft-item';
    item.setAttribute('data-callsign', callsign);

    const shortType = aircraftNames[aircraftData.type || aircraftData.aircraftType] || aircraftData.type || aircraftData.aircraftType || '?';
    const currentFL = aircraftData.altitude ? String(Math.round(aircraftData.altitude / 100)).padStart(3, '0') : '000';
    const speed = aircraftData.speed || 0;
    const vs = aircraftData.verticalSpeed || 0;
    const vsArrow = getVerticalSpeedArrow(vs);
    const pilot = aircraftData.playerName || aircraftData.pilot || 'Unknown';
    
    // Check if aircraft is on ground (altitude less than 100ft or speed very low)
    const isOnGround = (aircraftData.altitude && aircraftData.altitude < 100) || 
                       (aircraftData.speed && aircraftData.speed < 5);
    const groundIndicator = isOnGround ? '<div class="ground-indicator">GND</div>' : '';

    item.innerHTML = `
      ${groundIndicator}
      <div class="aircraft-callsign">${callsign}</div>
      <div class="aircraft-pilot">${pilot}</div>
      <div class="aircraft-details">
        <div class="aircraft-type">${shortType}</div>
        <div class="aircraft-altitude">FL${currentFL} ${vsArrow}</div>
        <div class="aircraft-speed">${speed} kts</div>
      </div>
    `;
    
    // Click handler
    item.addEventListener('click', () => {
      this.selectAircraft(callsign, aircraftData);
    });

    // Append to the specified container
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(item);
    } else {
      // Fallback to the old aircraftList if container not found
      this.aircraftList.appendChild(item);
    }
  }

  selectAircraft(callsign, aircraftData) {
    // Remove previous selection
    document.querySelectorAll('.aircraft-item.selected').forEach(item => {
      item.classList.remove('selected');
    });

    // Add selection to clicked aircraft
    const element = document.querySelector(`[data-callsign="${callsign}"]`);
    if (element) {
      element.classList.add('selected');
      this.selectedAircraft = callsign;

      // Store the selected aircraft in localStorage for persistence
      localStorage.setItem('selectedAircraft', callsign);

      // Store the selected aircraft data for reference
      window.selectedAircraftFromSidebar = {
        callsign: callsign,
        data: aircraftData
      };

      // Don't trigger flight sidebar or marker click - just keep selection state
      console.log(`Aircraft ${callsign} selected from sidebar`);
    }
  }

  updateAircraftCount(filedCount = 0, noPlanCount = 0) {
    const totalCount = filedCount + noPlanCount;
    this.aircraftCount.textContent = `${totalCount} aircraft${totalCount !== 1 ? 's' : ''}`;
    
    // Update section counts
    const filedCountElement = document.getElementById('filed-count');
    const noPlanCountElement = document.getElementById('no-plan-count');
    
    if (filedCountElement) {
      filedCountElement.textContent = filedCount;
    }
    if (noPlanCountElement) {
      noPlanCountElement.textContent = noPlanCount;
    }
  }

  getSelectedAircraft() {
    return this.selectedAircraft;
  }

  restoreSelection(callsign) {
    const element = document.querySelector(`[data-callsign="${callsign}"]`);
    if (element) {
      element.classList.add('selected');
      this.selectedAircraft = callsign;
      console.log(`Restored selection for aircraft ${callsign}`);
    }
  }

  clearSelection() {
    document.querySelectorAll('.aircraft-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
    this.selectedAircraft = null;
    window.selectedAircraftFromSidebar = null;
    localStorage.removeItem('selectedAircraft');
  }
}

// Initialize aircraft sidebar manager
const aircraftSidebarManager = new AircraftSidebarManager();

// Function to render aircraft in sidebar
function renderAircraftSidebar(aircraftData) {
  aircraftSidebarManager.updateAircraftData(aircraftData);
}

// Initialize sidebar manager - now handled by universal sidebar manager
// const sidebarManager = new SidebarManager();

// Tab switching functionality for Documents and OFP pages
document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // Remove active class from all buttons and panels
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));
      
      // Add active class to clicked button and corresponding panel
      this.classList.add('active');
      const targetPanel = document.getElementById(targetTab);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
});

async function loadChangelog() {
  const res = await fetch("/api/changelog");
  const data = await res.json();

  // Check last seen version
  const lastSeen = localStorage.getItem("changelogVersion");
  if (lastSeen === data.version) return; // Already seen, don't show again

  // Save new version as seen
  localStorage.setItem("changelogVersion", data.version);

  // Fill modal content
  document.getElementById("version").textContent = "Changelog " + data.version;
  document.getElementById("discordLink").href = data.support.discord;
  document.getElementById("donateLink").href = data.support.donate;
  document.getElementById("notes").innerHTML =
    data.notes.map(n => `<li>${n}</li>`).join("");

  // Show modal
  document.getElementById("changelogModal").style.display = "flex";
}

window.addEventListener("DOMContentLoaded", () => {
document.getElementById("closeChangelog").onclick = () => {
  document.getElementById("changelogModal").style.display = "none";
};
});

// Run on page load
window.addEventListener("DOMContentLoaded", loadChangelog);


document.addEventListener('DOMContentLoaded', function() {
    const collapsibleHeaders = document.querySelectorAll('.sidebar-section-header.collapsible');

    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sectionName = this.getAttribute('data-section');
            const content = document.getElementById(`${sectionName}-content`);

            this.classList.toggle('collapsed');

            content.classList.toggle('collapsed');

            const isCollapsed = content.classList.contains('collapsed');
            localStorage.setItem(`sidebar-${sectionName}`, isCollapsed ? 'collapsed' : 'expanded');
        });
    });

    ['universal', 'pilot', 'controller'].forEach(section => {
        const savedState = localStorage.getItem(`sidebar-${section}`);

        if (savedState === 'collapsed') {
            const content = document.getElementById(`${section}-content`);
            const header = document.querySelector(`[data-section="${section}"]`);

            if (content && header) {
                content.classList.add('collapsed');
                header.classList.add('collapsed');
            }
        }
    });
});