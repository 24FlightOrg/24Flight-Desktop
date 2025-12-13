//test
// Use local data.js for aircraft and airline info
const { aircraftNames, aircraftCodes, AIRLINE_MAP } = require('./data.js');

// Example: fetch ICAO code for a given aircraft name
function getIcaoByAircraftName(name) {
  return aircraftNames[name] || null;
}

// Example: fetch aircraft name by ICAO code
function getAircraftNameByIcao(icao) {
  return aircraftCodes[icao] || null;
}

// Given a callsign string, extract the aircraft name and return the ICAO code
function getIcaoFromCallsign(callsign) {
  // Try to match the aircraft name in the callsign (case-insensitive, partial match)
  const lowerCallsign = callsign.toLowerCase();
  for (const name in aircraftNames) {
    if (lowerCallsign.includes(name.toLowerCase())) {
      return aircraftNames[name];
    }
  }
  return null; // Not found
}

// Given an in-game callsign like "Americano-1234" or "AAL-123",
// return a formatted string like "AAL-1234" when possible.
function getFormattedIcaoFlight(callsign) {
  if (!callsign || typeof callsign !== 'string') return null;

  const parts = callsign.split('-');
  const prefix = parts[0].trim();
  const suffix = parts.slice(1).join('-').trim();

  // Extract flight numeric part if present, else use the remainder as-is
  let flightNumber = '';
  if (suffix) {
    const m = suffix.match(/\d+/);
    flightNumber = m ? m[0] : suffix;
  }

  const prefixLower = prefix.toLowerCase();

  // 1) Try to match against AIRLINE_MAP.ingame
  for (const k of Object.keys(AIRLINE_MAP)) {
    const entry = AIRLINE_MAP[k];
    if (!entry) continue;
    if (entry.ingame && entry.ingame.toLowerCase() === prefixLower) {
      return flightNumber ? `${entry.icao}-${flightNumber}` : `${entry.icao}`;
    }
    // also allow matching against radio or full airline name
    if (entry.radio && entry.radio.toLowerCase() === prefixLower) {
      return flightNumber ? `${entry.icao}-${flightNumber}` : `${entry.icao}`;
    }
    if (k && k.toLowerCase() === prefixLower) {
      return flightNumber ? `${entry.icao}-${flightNumber}` : `${entry.icao}`;
    }
  }

  // 2) If prefix already looks like an ICAO (3 letters), return it
    // If prefix looks like an ICAO (2-3 letters) only accept it when it matches
    // a known airline ICAO or a known aircraft code. Avoid blind early returns.
    if (/^[A-Z]{2,3}$/i.test(prefix)) {
      const icao = prefix.toUpperCase();
      const isAirline = Object.values(AIRLINE_MAP).some(e => e && e.icao === icao);
      const isAircraft = !!aircraftCodes[icao];
      if (isAirline || isAircraft) {
        return flightNumber ? `${icao}-${flightNumber}` : `${icao}`;
      }
      // otherwise continue to fallthrough to other matching strategies
    }

  // 3) Fallback: try to find by matching against aircraftNames (less likely for airlines)
  for (const name in aircraftNames) {
    if (prefixLower === name.toLowerCase() || prefixLower.includes(name.toLowerCase())) {
      const icao = aircraftNames[name];
      return flightNumber ? `${icao}-${flightNumber}` : `${icao}`;
    }
  }

  return null;
}

// Examples and quick tests removed from production code.