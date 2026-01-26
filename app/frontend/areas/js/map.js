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

document.addEventListener('DOMContentLoaded', () => {
  this.notifier = new NotificationManager('notification-container');
});

let selectedAircraftCallsign = null;
let iconurl = null;
let iconcss = null;

let wsRequestId = 0;
const wsPending = new Map();

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const ptfsBounds = {
  top_left: { x: -49222.1, y: -45890.8 },
  bottom_right: { x: 47132.9, y: 46139.2 }
};

const flightPlans = new Map();
const eventFlightPlans = new Map();

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
const aircraftLabelMarkers = new Map();
const aircraftTrailLayers = new Map();
const aircraftTrailVisible = new Map();
const LABEL_Y_OFFSET = 0.08;

const ICAO_MAP = (typeof AIRLINE_MAP !== 'undefined')
  ? Object.fromEntries(Object.values(AIRLINE_MAP).map(v => [v.icao && v.icao.toUpperCase(), v]))
  : {};

const INGAME_TO_ICAO = (typeof AIRLINE_MAP !== 'undefined')
  ? Object.fromEntries(
    Object.entries(AIRLINE_MAP).flatMap(([name, v]) => {
      const icao = v.icao && v.icao.toUpperCase();
      const entries = [];
      entries.push([name.toLowerCase(), icao]);
      if (v.ingame) entries.push([v.ingame.toLowerCase(), icao]);
      if (v.radio && v.radio !== v.ingame) entries.push([v.radio.toLowerCase(), icao]);
      return entries;
    })
  )
  : {};

const AIRCRAFT_CODES = (typeof aircraftCodes !== 'undefined') ? aircraftCodes : {};
const AIRCRAFT_NAMES = (typeof aircraftNames !== 'undefined') ? aircraftNames : {};

function computeIcaoPrefixedCallsign(callsign) {
  if (!callsign) return callsign;

  const icaoMatch = callsign.match(/^([A-Za-z]{2,3})(\d.*)$/);
  if (icaoMatch) {
    const code = icaoMatch[1].toUpperCase();
    if (ICAO_MAP[code]) {
      return callsign;
    }
  }

  const lowerCallsign = callsign.toLowerCase();

  for (const [airlineName, icao] of Object.entries(INGAME_TO_ICAO)) {
    if (lowerCallsign.startsWith(airlineName)) {
      const rest = callsign.substring(airlineName.length);
      if (rest && /^\d/.test(rest)) {
        return `${icao} ${rest}`;
      }
    }
  }

  const parts = callsign.split(/[-\s]/);
  const prefix = (parts[0] || '').toLowerCase();
  if (prefix && INGAME_TO_ICAO[prefix]) {
    parts[0] = INGAME_TO_ICAO[prefix];
    return parts.join(' ');
  }

  return callsign;
}

function computeLabelHtml(zoom, callsign, ac) {
  const flightPlan = ac && ac.flightPlan ? ac.flightPlan : (ac ? flightPlans.get(ac.playerName) : null);
  const labelCallsign = flightPlan?.callsign || callsign;
  const displayCallsign = computeIcaoPrefixedCallsign(labelCallsign);
  if (zoom <= 3) {
    return `<div style="font-family: 'Roboto Mono', 'Consolas', monospace; font-size:10px; background:transparent; color:#fff; padding:2px 6px; border-radius:6px; white-space:nowrap; text-align:center; z-index:19349235;"><div>${displayCallsign}</div></div>`;
  }
  const rawType = ac?.aircraftType || "?";
  const type = AIRCRAFT_NAMES[rawType] || rawType;
  const alt = ac?.altitude ? `FL${Math.round(ac.altitude / 100)}` : "?";
  const speed = ac?.speed ? `${Math.round(ac.speed)}kts` : "?";
  return `<div style="font-family: 'Roboto Mono', 'Consolas', monospace; font-size:13px; background:transparent; color:#fff; padding:4px 10px; border-radius:6px; white-space:nowrap; text-align:left; z-index:19349235;"><div>${displayCallsign}</div><div><span style='color:white;'>${type}</span> <span style='color:white;'>${alt}</span></div><div><span style='color:white;'>${speed}</span></div></div>`;
}

map.on('zoomend', () => {
  const zoom = map.getZoom();
  for (const [callsign, entry] of aircraftLabelMarkers.entries()) {
    if (!entry || !entry.label) continue;
    if (entry.manualMoved) continue;
    const ac = window.lastAircraftData && window.lastAircraftData[callsign] ? window.lastAircraftData[callsign] : null;
    const html = computeLabelHtml(zoom, callsign, ac);
    entry.label.setIcon(L.divIcon({ className: 'aircraft-label', html, iconAnchor: [-5, 16] }));
  }
});

const getSizeForZoom = (zoom) => {
  if (zoom >= 2) return 32;
  if (zoom >= 0) return 32;
  if (zoom >= -2) return 32;
  return 32;
};

map.on("click", () => {
  document.getElementById("aircraft-sidebar").classList.add("hidden");
  for (const [callsign, polyline] of aircraftTrailLayers.entries()) {
    if (map.hasLayer(polyline)) {
      map.removeLayer(polyline);
    }
    aircraftTrailVisible.set(callsign, false);
  }
});

function formatFlightPlans(planArray) {
  return planArray.reduce((acc, currentPlan) => {
    if (currentPlan.robloxName) {
      acc[currentPlan.robloxName] = currentPlan;
    }
    return acc;
  }, {});
}

if (window['24data']) {
  window['24data'].onMessage((data) => {
    try {
      const msg = JSON.parse(data);

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
            updateEventFlightPlans(formattedPlans)
          }
          break;

        case 'controllers':
          if (msg.payload) {
            //do smth with the controller data idk
          }
          break;

        case 'notification':
          if (msg.payload && msg.duration) {
            notifier.show(msg.payload, msg.duration || 5000);
          }
          break;

        default:
          console.log("cooked websocket:", msg);
          break;
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  });

  window['24data'].onUpdate((data) => {
    if (data.status === 'offline') {
      notifier.show("Connection lost. Please refresh the page.", 10000000000000);
    }
  });
} else {
  console.error('24data bridge missing!');
}

function wsSend(type, data) {
  return new Promise((resolve) => {
    const requestId = ++wsRequestId;
    wsPending.set(requestId, resolve);
    if (window['24data']) {
      window['24data'].send({ type, requestId, ...data });
    }
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

  const sidebar = document.getElementById("aircraft-sidebar");
  if (selectedAircraftCallsign && !sidebar.classList.contains("hidden")) {
    const aircraftData = aircraft[selectedAircraftCallsign];
    const flightPlan = flightPlans.get(aircraftData?.playerName);
    await updateSidebarData(selectedAircraftCallsign, aircraftData, flightPlan);
  }

  try {
    if (window.mapBridge && typeof window.mapBridge.sendAircraftData === 'function') {
      window.mapBridge.sendAircraftData(aircraft);
    }
  } catch (e) {
    // ignore
  }
}

function updateFlightPlans(plans) {
  flightPlans.clear();
  for (const [robloxName, plan] of Object.entries(plans)) {
    flightPlans.set(robloxName, plan);
  }

  try {
    if (window.mapBridge && typeof window.mapBridge.sendFlightPlans === 'function') {
      window.mapBridge.sendFlightPlans(plans);
    }
  } catch (e) {
    // ignore
  }
}

function updateEventFlightPlans(plans) {
  eventFlightPlans.clear();
  for (const [robloxName, plan] of Object.entries(plans)) {
    eventFlightPlans.set(robloxName, plan);
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

setInterval(updateVisibleAircraftTrails, 1500);

function openAircraftWindow(callsign) {
  try {
    if (window.windowControl && typeof window.windowControl.openAircraft === 'function') {
      window.windowControl.openAircraft(callsign);
    } else {
      const name = `aircraft_${callsign}`;
      const url = `aircraft.html?callsign=${encodeURIComponent(callsign)}`;
      const features = 'width=420,height=520,resizable=yes,scrollbars=yes';
      const win = window.open(url, name, features);
      if (win) win.focus();
    }
  } catch (e) {
    console.error('Failed to open aircraft window', e);
  }
}

async function plotAircraft(data) {
  const callsigns = Object.keys(data);
  const activeSet = new Set(callsigns);

  for (const oldCallsign of aircraftMarkers.keys()) {
    if (!activeSet.has(oldCallsign)) {
      map.removeLayer(aircraftMarkers.get(oldCallsign));
      aircraftMarkers.delete(oldCallsign);

      if (aircraftLabelMarkers.has(oldCallsign)) {
        map.removeLayer(aircraftLabelMarkers.get(oldCallsign));
        aircraftLabelMarkers.delete(oldCallsign);
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

    let marker;
    if (aircraftMarkers.has(callsign)) {
      marker = aircraftMarkers.get(callsign);
      marker.setLatLng([lat, lng]);
      const iconImg = marker.getElement()?.querySelector("img");
      if (iconImg) iconImg.style.transform = `rotate(${heading}deg)`;
    } else {
      const icon = L.divIcon({
        className: "aircraft-icon",
        html: `<img src="https://24flight.org/unified/icons/aircraft/default/testaircraft.png" style="transform: rotate(${heading}deg); width: 32px; height: 32px;" alt="aircraft">`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      marker = L.marker([lat, lng], { icon }).addTo(map);
      aircraftMarkers.set(callsign, marker);
    }

    try {
      marker.off('click');
      marker.on('click', () => openAircraftWindow(callsign));
    } catch (e) {
      // ignore if marker doesn't support events yet
    }

    if (aircraftLabelMarkers.has(callsign)) {
      const entry = aircraftLabelMarkers.get(callsign);
      const labelMarker = entry.label;
      const line = entry.line;
      const manualMoved = entry.manualMoved;
      if (!manualMoved && labelMarker) {
        labelMarker.setLatLng([lat + LABEL_Y_OFFSET, lng]);
      }
      if (line) {
        const markerLatLng = marker.getLatLng();
        const labelLatLng = labelMarker ? labelMarker.getLatLng() : markerLatLng;
        line.setLatLngs([markerLatLng, labelLatLng]);
      }
    }

    const currentZoom = map.getZoom();
    const infoText = computeLabelHtml(currentZoom, callsign, ac);
    const labelIcon = L.divIcon({
      className: "aircraft-label",
      html: infoText,
      iconAnchor: [-5, 16]
    });

    let labelMarker, manualMoved, line;

    if (aircraftLabelMarkers.has(callsign)) {
      const prev = aircraftLabelMarkers.get(callsign);
      manualMoved = prev.manualMoved;
      map.removeLayer(prev.line);

      if (manualMoved) {
        labelMarker = prev.label;
      } else {
        map.removeLayer(prev.label);
        labelMarker = L.marker([lat + LABEL_Y_OFFSET, lng], { icon: labelIcon, draggable: true, interactive: true }).addTo(map);
      }
    } else {
      labelMarker = L.marker([lat + LABEL_Y_OFFSET, lng], { icon: labelIcon, draggable: true, interactive: true }).addTo(map);
      manualMoved = false;
    }

    labelMarker.on('dragend', () => {
      const entry = aircraftLabelMarkers.get(callsign);
      if (entry) entry.manualMoved = true;
    });

    line = L.polyline([marker.getLatLng(), labelMarker.getLatLng()], {
      color: 'white',
      weight: 1.5,
      opacity: 0.7,
      dashArray: '4,4'
    }).addTo(map);

    marker.on('move', () => {
      try {
        const entry = aircraftLabelMarkers.get(callsign);
        const manual = entry ? entry.manualMoved : false;
        if (labelMarker && !manual) {
          const ml = marker.getLatLng();
          labelMarker.setLatLng([ml.lat + LABEL_Y_OFFSET, ml.lng]);
        }
      } catch (e) {
        // ignore
      }
      line.setLatLngs([marker.getLatLng(), labelMarker.getLatLng()]);
    });
    labelMarker.on('move', () => {
      line.setLatLngs([marker.getLatLng(), labelMarker.getLatLng()]);
    });

    aircraftLabelMarkers.set(callsign, { label: labelMarker, line, manualMoved });
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

if (typeof Fixes !== 'undefined' && Fixes && Fixes.length > 0) {
  renderFixes(Fixes);
} else {
  console.error('Fixes data not loaded from data.js');
}

function renderFixes(list) {
  list.forEach(({ name, px, py, size, type }) => {
    iconurl = null;
    iconurl = null;
    const [lat, lng] = waypointPositionToLatLng(px, py);
    //waypoint
    if (type == "waypoint") {
      iconurl = "https://24flight.org/unified/icons/map/Fix.RNAVFlyOver.png"
      iconcss = "waypoint-black"
      //airport
      //airport w/ service and tower. basic airport
    } else if (type == "aprt.serv.twr") {
      iconurl = "https://24flight.org/unified/icons/map/1Airport.Serv.Tower.png";
      iconcss = "blue-label";
      //seabase
    } else if (type == "aprt.seabase") {
      iconurl = "https://24flight.org/unified/icons/map/2Airport.Seabase.png";
      iconcss = "pink-label";
      //private airport w/ a tower
    } else if (type == "aprt.priv.twr") {
      iconurl = "https://24flight.org/unified/icons/map/3Airport.Private.Tower.png";
      iconcss = "blue-label";
      //normal airport
    } else if (type == "aprt") {
      iconurl = "https://24flight.org/unified/icons/map/4Airport.png";
      iconcss = "pink-label";
      //military w/ tower
    } else if (type == "aprt.mltry.twr") {
      iconurl = "https://24flight.org/unified/icons/map/5Airport.Military.Tower.png";
      iconcss = "blue-label";
      //military airport
    } else if (type == "aprt.mltry") {
      iconurl = "https://24flight.org/unified/icons/map/6Airport.Military.png";
      iconcss = "pink-label";
      //airport service
    } else if (type == "aprt.serv") {
      iconurl = "https://24flight.org/unified/icons/map/7Airport.Service.png";
      iconcss = "pink-label";
      //private airport
    } else if (type == "aprt.priv") {
      iconurl = "https://24flight.org/unified/icons/map/8Airport.Private.png";
      iconcss = "pink-label";
      //airport w/ a tower
    } else if (type == "aprt.twr") {
      iconurl = "https://24flight.org/unified/icons/map/9Airport.Tower.png";
      iconcss = "blue-label";
    }
    icon = L.divIcon({
      className: "waypoint-icon",
      html: `
        <div class="fix-wrapper" style="width:${size}px; height:${size}px;">
          <div class="${iconcss}">${name}</div>
          <img src="${iconurl}" style="width:${size}px; height:${size}px;">
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
    L.marker([lat, lng], { icon }).addTo(map);
  });
}