async function init() {
  try {
    const greetingEl = document.getElementById('username-display');

    // Check if the API is exposed
    if (window.userData && typeof window.userData.globalname === 'function') {
      const globalname = await window.userData.globalname();
      if (globalname) {
        greetingEl.textContent = globalname;
      } else {
        greetingEl.textContent = 'Pilot';
      }
    } else {
      greetingEl.textContent = 'Pilot';
    }

    // App Version
    if (window.userData && window.userData.appVersion) {
      const ver = await window.userData.appVersion();
      const verEl = document.querySelector('.status-value[data-type="version"]');
      if (verEl) verEl.textContent = 'v' + ver;
    }

    // WebSocket Logic
    const connectionStatusEl = document.querySelector('.status-value[data-type="connection"]');
    const dataStreamEl = document.querySelector('.status-value[data-type="datastream"]');
    const activeFlightsEl = document.querySelector('.status-value[data-type="flights"]');

    const updateStatus = (el, status, text, addClass, removeClass) => {
      if (!el) return;
      el.textContent = text;
      if (addClass) el.classList.add(addClass);
      if (removeClass) el.classList.remove(removeClass);
    };

    if (window['24data']) {
      window['24data'].onUpdate((data) => {
        if (data.status === 'online') {
          updateStatus(connectionStatusEl, 'online', 'Online', 'online', 'offline');
          updateStatus(dataStreamEl, 'active', 'Active', 'active', 'inactive');
        } else {
          updateStatus(connectionStatusEl, 'offline', 'Offline', 'offline', 'online');
          updateStatus(dataStreamEl, 'inactive', 'Inactive', 'inactive', 'active');
        }
      });

      window['24data'].onMessage((data) => {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'acft' && msg.payload) {
            const count = Object.keys(msg.payload).length;
            if (activeFlightsEl) activeFlightsEl.textContent = count;
          }
        } catch (e) {
          // ignore
        }
      });
    } else {
      console.warn('24data API not available');
    }

  } catch (err) {
    console.warn('Dashboard init error:', err);
    const greetingEl = document.getElementById('username-display');
    if (greetingEl) greetingEl.textContent = 'Pilot';
  }
}

document.addEventListener('DOMContentLoaded', init);
