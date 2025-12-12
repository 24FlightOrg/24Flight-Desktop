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

ws = new WebSocket(`wss://24flight.org/ws`);

//this.ws = new WebSocket(`ws://localhost:8081`);

const ptfsBounds = {
  top_left:     { x: -49222.1, y: -45890.8 },
  bottom_right: { x:  47132.9, y:  46139.2 }
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
      if(msg.payload && Array.isArray(msg.payload)) {
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
}

function updateFlightPlans(plans) {
  flightPlans.clear();
  for (const [robloxName, plan] of Object.entries(plans)) {
    flightPlans.set(robloxName, plan);
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

    const flightPlan = flightPlans.get(ac.playerName);
    const labelCallsign = flightPlan?.callsign || callsign;
    const infoText = `
      <div style="
        font-family: 'Roboto Mono', 'Consolas', monospace;
        font-size: 13px;
        background: transparent;
        color: #fff;
        padding: 4px 10px;
        border-radius: 6px;
        white-space: nowrap;
        text-align: left;
        cursor: move;
        z-index: 19349235;
      ">
        <div><span style="color:white;">${labelCallsign}</span></div>
        <div><span style="color:white;">${ac.aircraftType || "?"}</span> <span style="color:#white;">FL${ac.altitude || "?"}</span></div>
        <div><span style="color:white;">${ac.speed || "?"}kts</span></div>
      </div>
    `;
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
        labelMarker = L.marker([lat, lng + 0.08], { icon: labelIcon, draggable: true, interactive: true }).addTo(map);
      }
    } else {
      labelMarker = L.marker([lat, lng + 0.08], { icon: labelIcon, draggable: true, interactive: true }).addTo(map);
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

const Fixes = [

  // Waypoints relative to the top left of the map image

  // Top left corner
  // { name: "TOPLEFT", px: -14453*2, py: -13800*2, size: 32, type: "waypoint" }, // top left

  // Center of map
  // { name: "CENTER", px: imageWidth / 2, py: imageHeight / 2, size: 32, type: "waypoint" }, // center

  // Bottom right corner
  // { name: "BOTTOMRIGHT", px: imageWidth, py: imageHeight, size: 32, type: "waypoint" }, // bottom right

  // Grindavik
  { name: "BULLY", px: 2456.09, py: 2417.97, size: 32, type: "waypoint" }, //bully
  { name: "FROOT", px: 1503.71, py: 3544.37, size: 32, type: "waypoint" }, //fruit
  { name: "EURAD", px: 3402.95, py: 3875.30, size: 32, type: "waypoint" }, //Yurad
  { name: "BOBOS", px: 543.59, py: 4476.87, size: 32, type: "waypoint" }, //bowbows?
  { name: "THENR", px: 1496.88, py: 4987.5, size: 32, type: "waypoint" }, //thenner
  { name: "BLANK", px: 3790.63, py: 4756.25, size: 32, type: "waypoint" }, //blank
  { name: "ACRES", px: -146.88, py: 5275, size: 32, type: "waypoint" }, //acres
  { name: "YOUTH", px: 2587.5, py: 5571.88, size: 32, type: "waypoint" }, //youth
  { name: "UWAIS", px: -893.75, py: 6028.13, size: 32, type: "waypoint" }, //Eww Wais
  { name: "FRANK", px: -815.63, py: 7182.81, size: 32, type: "waypoint" }, //Frank
  { name: "CELAR", px: 1856.16, py: 7658.85, size: 32, type: "waypoint" }, //Sellar
  { name: "EZYDB", px: 3848.21, py: 6238.01, size: 32, type: "waypoint" }, //EasyDub
  { name: "THACC", px: -826.43, py: 8455.45, size: 32, type: "waypoint" }, //Thack
  { name: "SHREK", px: 513.28, py: 8585.94, size: 32, type: "waypoint" }, //Shrek
  { name: "SPACE", px: 1915.82, py: 8843.25, size: 32, type: "waypoint" }, //Space

  // Sauthemptona
  { name: "HACKE", px: -322.19, py: 9934.38, size: 32, type: "waypoint" }, //Hackee
  { name: "HECKS", px: -950.78, py: 11425.78, size: 32, type: "waypoint" }, //Hecks
  { name: "GEORG", px: 610.94, py: 10313.28, size: 32, type: "waypoint" }, //George
  { name: "SEEKS", px: 1923.44, py: 10763.28, size: 32, type: "waypoint" }, //Seeks
  { name: "PACKT", px: 117.19, py: 11721.88, size: 32, type: "waypoint" }, //Packet
  { name: "ALDER", px: 3212.92, py: 11899.28, size: 32, type: "waypoint" }, //Alder
  { name: "STACK", px: 1506.25, py: 12237.5, size: 32, type: "waypoint" }, //Stack
  { name: "WASTE", px: 23.44, py: 12975, size: 32, type: "waypoint" }, //Waste
  { name: "HOGGS", px: 3000.78, py: 12844.48, size: 32, type: "waypoint" }, //Hoggs
  { name: "ROBUX", px: 2358.86, py: 14075.84, size: 32, type: "waypoint" }, //Robux

  // Rockford
  { name: "ENDER", px: 4415, py: 7000.36, size: 32, type: "waypoint" }, //Ender
  { name: "SUNST", px: 3621.71, py: 7665.48, size: 32, type: "waypoint" }, //Sunset
  { name: "BUCFA", px: 4481.29, py: 8200.23, size: 32, type: "waypoint" }, //Buckfuh
  { name: "KENED", px: 5683.37, py: 7442.3, size: 32, type: "waypoint" }, //Keneddy? kened?
  { name: "SETHR", px: 7901.92, py: 8038.92, size: 32, type: "waypoint" }, //Sether
  { name: "KUNAV", px: 5685.58, py: 8315.13, size: 32, type: "waypoint" }, //Kunnov
  { name: "HAWFA", px: 6220.33, py: 8606.82, size: 32, type: "waypoint" }, //Haw Fuh
  { name: "SAWPE", px: 3277.34, py: 8505.47, size: 32, type: "waypoint" }, //Saw pee
  { name: "BEANS", px: 3355.44, py: 9736.53, size: 32, type: "waypoint" }, //Beans
  { name: "LOGAN", px: 4395.31, py: 9970.31, size: 32, type: "waypoint" }, //Logan
  { name: "EXMOR", px: 4577.41, py: 10896.63, size: 32, type: "waypoint" }, //exhmore
  { name: "QUEEN", px: 7062.23, py: 9241, size: 32, type: "waypoint" }, //queen
  { name: "MOGTA", px: 5718.73, py: 10398.89, size: 32, type: "waypoint" }, //moghtha
  { name: "LAVNO", px: 7721.88, py: 9537.1, size: 32, type: "waypoint" }, //lavno
  { name: "ICTAM", px: 5409.37, py: 8757.08, size: 32, type: "waypoint" }, //ichtham
  { name: "ATPEV", px: 8186.97, py: 9353.7, size: 32, type: "waypoint" }, //ath pev
  { name: "JAMSI", px: 8702.94, py: 10251.94, size: 32, type: "waypoint" }, //jam see
  { name: "GODLU", px: 7897.5, py: 10994.41, size: 32, type: "waypoint" }, //god loo
  { name: "LAZER", px: 8599.08, py: 11282.77, size: 32, type: "waypoint" }, //laser
  { name: "PEPUL", px: 6128.63, py: 11217.59, size: 32, type: "waypoint" }, //people
  { name: "EMJAY", px: 5184.38, py: 12296.88, size: 32, type: "waypoint" }, //MJ
  { name: "ODOKU", px: 6843.75, py: 12306.25, size: 32, type: "waypoint" }, //Odo ku
  { name: "REAPR", px: 7192.6, py: 13494.69, size: 32, type: "waypoint" }, //Reaper
  { name: "TRELN", px: 5875.62, py: 13722.29, size: 32, type: "waypoint" }, 
  { name: "DEATH", px: 4556.42, py: 14033.86, size: 32, type: "waypoint" },

  // Larnaca
  { name: "RENTS", px: 11320.34, py: 10213.27, size: 32, type: "waypoint" }, //Rents
  { name: "GRASS", px: 10182.34, py: 10739.18, size: 32, type: "waypoint" }, //Grass
  { name: "AQWRT", px: 9766.91, py: 12330.17, size: 32, type: "waypoint" }, //Aquirt
  { name: "FORIA", px: 8449.93, py: 13218.48, size: 32, type: "waypoint" }, //Forya
  { name: "FORCE", px: 10469.6, py: 14239.36, size: 32, type: "waypoint" }, //Force
  { name: "MASEV", px: 11592.13, py: 14279.14, size: 32, type: "waypoint" }, //Masiv
  { name: "ALTRS", px: 12811.89, py: 14252.62, size: 32, type: "waypoint" }, //Alters
  { name: "MUONE", px: 13267.09, py: 13214.06, size: 32, type: "waypoint" }, //Mew Own
  { name: "JAZZR", px: 14539.88, py: 13227.32, size: 32, type: "waypoint" }, //Jazzer
  { name: "NUBER", px: 15755.22, py: 12414.14, size: 32, type: "waypoint" }, //New ber
  { name: "BOBUX", px: 13457.13, py: 12188.75, size: 32, type: "waypoint" }, //Bobux
  { name: "DEBUG", px: 14557.56, py: 11318.13, size: 32, type: "waypoint" }, //Debug
  { name: "JACKI", px: 12599.76, py: 11304.87, size: 32, type: "waypoint" }, //Jacky

  // Skopelos
  { name: "CAWZE", px: 10343.65, py: 8030.08, size: 32, type: "waypoint" }, //Cawz ey
  { name: "ANYMS", px: 9669.69, py: 9324.53, size: 32, type: "waypoint" }, //Ay nims

  // Izolirani
  { name: "CAMEL", px: 10703.83, py: 5979.47, size: 32, type: "waypoint" }, //Camel
  { name: "CYRIL", px: 11512.58, py: 6995.94, size: 32, type: "waypoint" }, //S eye ril, sir il
  { name: "DUNKS", px: 11768.91, py: 6028.09, size: 32, type: "waypoint" }, //Dunks
  { name: "DOGGO", px: 12909.12, py: 8012.4, size: 32, type: "waypoint" }, //Dog Oh
  { name: "JUSTY", px: 13262.67, py: 9333.81, size: 32, type: "waypoint" }, //Justy
  { name: "CHAIN", px: 15732.06, py: 9766.91, size: 32, type: "waypoint" }, //Chain
  { name: "BILLO", px: 14557.56, py: 8586.93, size: 32, type: "waypoint" }, //Bill oh
  { name: "ABSRS", px: 15768.48, py: 7919.6, size: 32, type: "waypoint" }, //Abserse
  { name: "MORRD", px: 15087.89, py: 6624.71, size: 32, type: "waypoint" }, //Mord
  { name: "LLIME", px: 15538.67, py: 5670.11, size: 32, type: "waypoint" }, //Lime
  { name: "UDMUG", px: 15083.47, py: 4808.33, size: 32, type: "waypoint" }, //Uhd mug
  { name: "ROSMO", px: 13474.8, py: 5484.5, size: 32, type: "waypoint" }, //Ros moh

  // Saint Barts
  { name: "PROBE", px: 6306.51, py: 5351.91, size: 32, type: "waypoint" }, //Probe
  { name: "DINER", px: 8012.4, py: 5427.04, size: 32, type: "waypoint" }, //Diner
  { name: "INDEX", px: 6505.38, py: 6819.16, size: 32, type: "waypoint" }, //Index
  { name: "GAVIN", px: 8361.54, py: 7141.78, size: 32, type: "waypoint" }, //Gavin
  { name: "SILVA", px: 10018.82, py: 7159.46, size: 32, type: "waypoint" }, //Silva
  { name: "OCEEN", px: 9143.77, py: 7716.3, size: 32, type: "waypoint" }, //Oceen?
  { name: "GERLD", px: 5077.91, py: 4605.03, size: 32, type: "waypoint" }, //Gerald
  { name: "RENDR", px: 5687.79, py: 4772.97, size: 32, type: "waypoint" }, //Render
  { name: "WELSH", px: 5687.79, py: 6249.06, size: 32, type: "waypoint" }, //Whelsh
  { name: "JOOPY", px: 7115.26, py: 4631.55, size: 32, type: "waypoint" }, //Jhoophy

  // Perth
  { name: "CRAZY", px: 10279.56, py: 1327.34, size: 32, type: "waypoint" }, //crazy
  { name: "WOTAN", px: 12625, py: 1929.69, size: 32, type: "waypoint" }, //woah ton
  { name: "WAGON", px: 14049.33, py: 2417.42, size: 32, type: "waypoint" }, //wagon
  { name: "WELLS", px: 11223.11, py: 2978.69, size: 32, type: "waypoint" }, //wells
  { name: "SQUID", px: 12951.1, py: 3011.83, size: 32, type: "waypoint" }, //squid
  { name: "KELLA", px: 12639.06, py: 4100, size: 32, type: "waypoint" }, //kell uh
  { name: "ZESTA", px: 14448.44, py: 3410.94, size: 32, type: "waypoint" }, //zest uh
  { name: "NOONU", px: 11890.63, py: 4068.75, size: 32, type: "waypoint" }, //Newnew
  { name: "SISTA", px: 12350, py: 5018.75, size: 32, type: "waypoint" }, //Sistuh
  { name: "TALIS", px: 11375, py: 5168.75, size: 32, type: "waypoint" }, //Talis
  { name: "STRAX", px: 9336.57, py: 4321.32, size: 32, type: "waypoint" }, //Strax
  { name: "TINDR", px: 9083.59, py: 3561.72, size: 32, type: "waypoint" }, //Tinder

  // Tokyo
  { name: "SHELL", px: 3588.57, py: 866.21, size: 32, type: "waypoint" }, //Shell
  { name: "NIKON", px: 5716.52, py: 583.36, size: 32, type: "waypoint" }, //neekon
  { name: "CHILY", px: 8046.88, py: 828.13, size: 32, type: "waypoint" }, //chilly
  { name: "SHIBA", px: 4781.81, py: 1261.74, size: 32, type: "waypoint" }, //shee buh
  { name: "LETSE", px: 6815.63, py: 1653.13, size: 32, type: "waypoint" }, //lets see
  { name: "HONDA", px: 8478.13, py: 1653.13, size: 32, type: "waypoint" }, //Honda
  { name: "ASTRO", px: 5192.92, py: 2293.68, size: 32, type: "waypoint" }, //Astro
  { name: "GULEG", px: 4215.12, py: 3056.13, size: 32, type: "waypoint" }, //goo leg
  { name: "PIPER", px: 5508.8, py: 3155.46, size: 32, type: "waypoint" }, //Piper
  { name: "TUDEP", px: 5095.59, py: 4182.98, size: 32, type: "waypoint" }, //too dep
  { name: "ALLRY", px: 8449.93, py: 4191.82, size: 32, type: "waypoint" }, //all rey
  { name: "ONDER", px: 6653.43, py: 3462.61, size: 32, type: "waypoint" }, //Onder
  { name: "KNIFE", px: 7711.88, py: 3204.08, size: 32, type: "waypoint" }, //Knife

  // Airport Fixes

  // Rockford
  { name: "IRFD", px: 6844.02, py: 9947, size: 32, type: "aprt.serv.twr" }, //done
  { name: "IMLR", px: 4510.23, py: 9082.34, size: 32, type: "aprt.serv.twr" }, //done
  { name: "ITRC", px: 7040.13, py: 11408.45, size: 32, type: "aprt" }, //done
  { name: "IGAR", px: 5001.56, py: 10434.38, size: 32, type: "aprt.mltry.twr" }, //done
  { name: "IBLT", px: 5698.83, py: 9500.39, size: 32, type: "aprt.priv.twr" }, //done
  { name: "OWO", px: 6375, py: 8871.88, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "RFDCG", px: 5574.54, py: 10166.87, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "RFDRB", px: 6103.77, py: 9981.25, size: 32, type: "aprt.priv" }, //done seabase

  //Grindavik
  { name: "IGRV", px: 876.56, py: 6415.23, size: 32, type: "aprt.serv.twr" }, //done
  { name: "TVO", px: 1031.93, py: 6777.18, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "GRVCG", px: 1009.63, py: 6267.56, size: 32, type: "aprt.seabase" }, //done seabase

  //Sauthemptona
  { name: "ISAU", px: 622.66, py: 10986.33, size: 32, type: "aprt.serv.twr" }, //done
  { name: "OILRIG", px: 1370.56, py: 9110.64, size: 32, type: "aprt.seabase" }, //done

  //Larnaca
  { name: "IHEN", px: 9957.5, py: 13120.7, size: 32, type: "aprt.priv" }, //done private? airport?
  { name: "IIAB", px: 10857.81, py: 12953.13, size: 32, type: "aprt.mltry.twr" }, //done military w/ tower
  { name: "ILAR", px: 10651.9, py: 11682.73, size: 32, type: "aprt.serv.twr" }, //done
  { name: "IPAP", px: 12044.53, py: 12087.11, size: 32, type: "aprt.serv.twr" }, //done
  { name: "IBAR", px: 11507.42, py: 12550.39, size: 32, type: "aprt.serv.twr" }, //private w/ tower +services?

  //Skopelos
  { name: "ISKP", px: 11196.59, py: 8865.9, size: 32, type: "aprt.serv.twr" }, //airport? private?

  //Izolirani
  { name: "IZOL", px: 14189.06, py: 7529.69, size: 32, type: "aprt.serv.twr" }, //done
  { name: "ISCM", px: 12846.88, py: 6234.38, size: 32, type: "aprt.mltry.twr" }, //done military w/ a tower
  { name: "IZOCG", px: 13182.29, py: 7488.36, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "IJAF", px: 14351.56, py: 6953.13, size: 32, type: "aprt.priv.twr" }, //done private? airport? tower?
  { name: "IZORB", px: 13669.53, py: 6791.02, size: 32, type: "aprt.priv" }, //done seabase

  //Saint Barts
  { name: "IBTH", px: 8238.9, py: 6231.38, size: 32, type: "aprt.serv.twr" }, //done

  //Perth
  { name: "IPPH", px: 9914.96, py: 3802.91, size: 32, type: "aprt.serv.twr" }, //done
  { name: "ILKL", px: 10748.02, py: 4428.26, size: 32, type: "aprt.serv.twr" }, //done private?
  { name: "SHV", px: 10942.48, py: 3763.13, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "PERCG", px: 10449.78, py: 4719.87, size: 32, type: "aprt.seabase" }, //done seabase

  //Tokyo
  { name: "ITKO", px: 6266.73, py: 2127.95, size: 32, type: "aprt.serv.twr" }, //done
  { name: "ORNCG", px: 5705.74, py: 1533.54, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "ORNRB", px: 5907.66, py: 967.85, size: 32, type: "aprt.priv" }, //done
  { name: "IDCS", px: 6651.22, py: 190.03, size: 32, type: "aprt.priv" }, //done private? airport?
];

renderFixes(Fixes);

function renderFixes(list) {
  list.forEach(({ name, px, py, size, type}) => {
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