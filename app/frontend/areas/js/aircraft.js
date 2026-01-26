function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

const callsignParam = getQueryParam('callsign');
let targetCallsign = callsignParam || null;

let lastAircraftData = {};
let flightPlansObj = {};

function safeText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text ?? '-';
}

function resolveDisplayCallsign(ac) {
  try {
    if (ac && ac.playerName && flightPlansObj && flightPlansObj[ac.playerName] && flightPlansObj[ac.playerName].callsign) {
      return flightPlansObj[ac.playerName].callsign;
    }
  } catch (e) {
    // ignore
  }
  return (ac && (ac.callsign || ac.ingameCallsign)) || targetCallsign || 'Unknown';
}

function updateUI() {
  if (!targetCallsign) return;

  const ac = lastAircraftData[targetCallsign];
  if (!ac) {
    document.getElementById('status').textContent = 'Aircraft not found.';
    return;
  }

  document.getElementById('status').textContent = 'Live';
  const display = resolveDisplayCallsign(ac);
  safeText('callsign', display);
  safeText('player', ac.playerName || '-');
  safeText('type', ac.aircraftType || '-');
  safeText('alt', ac.altitude ? `FL${Math.round(ac.altitude / 100)}` : '-');
  safeText('spd', ac.speed ? `${Math.round(ac.speed)}kts` : '-');
  safeText('hdg', ac.heading != null ? `${Math.round(ac.heading)}°` : '-');
  if (ac.position) {
    safeText('pos', `x:${Math.round(ac.position.x)}, y:${Math.round(ac.position.y)}`);
  } else {
    safeText('pos', '-');
  }

  const plan = (ac.playerName && flightPlansObj[ac.playerName]) ? flightPlansObj[ac.playerName] : null;
  safeText('fp-callsign', (plan && plan.callsign) ? plan.callsign : (ac.callsign || targetCallsign || '-'));

  const title = plan && plan.callsign ? plan.callsign : (ac.callsign || targetCallsign || 'Aircraft');
  if (window.topBarSettings && window.topBarSettings.title !== title) {
    window.topBarSettings.title = title;
    if (typeof window.renderTopBar === 'function') {
      window.renderTopBar();
    }
  }
}

function init() {
  if (!targetCallsign) {
    document.getElementById('status').textContent = 'No callsign provided.';
    return;
  }

  // attempt initial update immediately
  updateUI();

  // subscribe to forwarded aircraft data from main
  try {
    if (window.mapBridge && typeof window.mapBridge.onAircraftData === 'function') {
      window.mapBridge.onAircraftData((data) => {
        lastAircraftData = data || {};
        updateUI();
      });
    }
    if (window.mapBridge && typeof window.mapBridge.onFlightPlans === 'function') {
      window.mapBridge.onFlightPlans((plans) => {
        flightPlansObj = plans || {};
        updateUI();
      });
    }
  } catch (e) {
    // ignore
  }
}

document.addEventListener('DOMContentLoaded', init);
