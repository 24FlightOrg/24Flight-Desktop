(function () {
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const acceptDisclaimerBtn = document.getElementById('accept-disclaimer-btn');
    const apContainer = document.getElementById('ap-container');
    const callSignSelect = document.getElementById('call-sign-select');
    const waypointList = document.getElementById('waypoint-list');
    const addWaypointBtn = document.getElementById('add-waypoint-btn');
    const clearWaypointsBtn = document.getElementById('clear-waypoints-btn');
    const startAutopilotBtn = document.getElementById('start-autopilot-btn');
    const routeStatus = document.getElementById('route-status');
    const waypointXInput = document.getElementById('waypoint-x');
    const waypointYInput = document.getElementById('waypoint-y');
    const waypointAltitudeInput = document.getElementById('waypoint-altitude');
    const yokeDisplay = document.getElementById('yoke-display');
    const yokeFill = document.getElementById('yoke-fill');
    const yokeValue = document.getElementById('yoke-value');

    let map = null;
    let waypointMarkers = [];
    let polyline = null;
    let waypoints = [];
    const aircraftSet = new Set();

    function updateYokeDisplay(percentage) {
        // Clamp percentage to -100 to 100
        const clamped = Math.max(-100, Math.min(100, percentage));
        
        // Show the yoke display
        yokeDisplay.classList.remove('hidden');
        
        // Update the value text
        yokeValue.textContent = Math.round(clamped) + '%';
        
        // Update the fill bar
        // -100% = 0% width on left, 0% = 50% width from center, 100% = 100% width on right
        const centerPercent = 50;
        const fillPercent = centerPercent + (clamped / 2);
        
        if (clamped < 0) {
            // Left side - fill from center to left
            yokeFill.style.left = fillPercent + '%';
            yokeFill.style.right = 'auto';
            yokeFill.style.width = (centerPercent - fillPercent) + '%';
        } else {
            // Right side or center - fill from center to right
            yokeFill.style.left = centerPercent + '%';
            yokeFill.style.right = 'auto';
            yokeFill.style.width = (fillPercent - centerPercent) + '%';
        }
    }

    function showStatus(message, type = 'info') {
        routeStatus.textContent = message;
        routeStatus.className = `route-status ${type}`;
    }

    function setCallsignOptions() {
        const previousValue = callSignSelect.value;
        callSignSelect.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = aircraftSet.size === 0 ? 'No aircraft available' : 'Select an aircraft';
        callSignSelect.appendChild(placeholder);

        Array.from(aircraftSet).sort().forEach((callsign) => {
            const option = document.createElement('option');
            option.value = callsign;
            option.textContent = callsign;
            if (callsign === previousValue) {
                option.selected = true;
            }
            callSignSelect.appendChild(option);
        });
    }

    function updateWaypointDisplay() {
        waypointList.innerHTML = '';
        if (waypoints.length === 0) {
            waypointList.innerHTML = '<em>No waypoints yet. Click the map or add coordinates manually.</em>';
            return;
        }

        waypoints.forEach((waypoint, index) => {
            const item = document.createElement('div');
            item.className = 'waypoint-item';

            const label = document.createElement('span');
            label.textContent = `#${index + 1}: X=${Math.round(waypoint.x)} Y=${Math.round(waypoint.y)} Alt=${Math.round(waypoint.altitude)}`;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => {
                removeWaypoint(index);
            });

            item.appendChild(label);
            item.appendChild(removeBtn);
            waypointList.appendChild(item);
        });
    }

    function refreshMapPath() {
        if (!polyline) return;
        const latLngs = waypoints.map((waypoint) => {
            return map.options.crs.unproject(L.point(waypoint.x, waypoint.y));
        });
        polyline.setLatLngs(latLngs);
    }

    function addWaypoint(point) {
        waypoints.push(point);

        const marker = L.circleMarker(map.options.crs.unproject(L.point(point.x, point.y)), {
            radius: 6,
            color: '#74d8ff',
            fillColor: '#74d8ff',
            fillOpacity: 0.9,
            weight: 2,
        }).addTo(map);
        waypointMarkers.push(marker);

        updateWaypointDisplay();
        refreshMapPath();
        showStatus(`Added waypoint ${waypoints.length}.`, 'success');
    }

    function removeWaypoint(index) {
        if (index < 0 || index >= waypoints.length) return;
        waypoints.splice(index, 1);
        const marker = waypointMarkers.splice(index, 1)[0];
        if (marker) {
            map.removeLayer(marker);
        }
        updateWaypointDisplay();
        refreshMapPath();
    }

    function clearWaypoints() {
        waypoints = [];
        waypointMarkers.forEach((marker) => {
            if (map && marker) map.removeLayer(marker);
        });
        waypointMarkers = [];
        updateWaypointDisplay();
        refreshMapPath();
        showStatus('Waypoints cleared.', 'info');
    }

    function addWaypointFromMapClick(event) {
        const point = map.options.crs.project(event.latlng);
        addWaypoint({ x: point.x, y: point.y, altitude: 0 });
    }

    function initMap() {
        if (!window.L) {
            showStatus('Leaflet is unavailable; map cannot initialize.', 'error');
            return;
        }

        const imageWidth = 14453;
        const imageHeight = 13800;
        const mapMinZoom = 0;
        const mapMaxZoom = 5;
        const mapMaxResolution = 2.0;
        const mapMinResolution = Math.pow(2, mapMaxZoom) * mapMaxResolution;
        const mapExtent = [0, imageHeight, imageWidth, 0];

        const crs = L.CRS.Simple;
        crs.transformation = new L.Transformation(1, -mapExtent[0], -1, mapExtent[3] + imageHeight);
        crs.scale = function (zoom) {
            return Math.pow(2, zoom) / mapMinResolution;
        };
        crs.zoom = function (scale) {
            return Math.log(scale * mapMinResolution) / Math.LN2;
        };

        map = L.map('map', {
            crs,
            minZoom: mapMinZoom,
            maxZoom: mapMaxZoom,
            zoomSnap: 0.25,
            attributionControl: false,
            zoomControl: true,
        });

        L.tileLayer('https://prod.24flight.org/ptfs/regular/{z}/{x}/{y}.png', {
            minZoom: mapMinZoom,
            maxZoom: mapMaxZoom,
            tileSize: L.point(256, 512),
            noWrap: true,
            tms: false,
            nativeZooms: [1, 2, 3, 4, 5],
        }).addTo(map);

        map.fitBounds([
            crs.unproject(L.point(mapExtent[2], mapExtent[3])),
            crs.unproject(L.point(mapExtent[0], mapExtent[1]))
        ]);
        map.setView(crs.unproject(L.point(imageWidth / 2, imageHeight / 2)), 2);

        polyline = L.polyline([], {
            color: '#74d8ff',
            weight: 4,
            opacity: 0.85,
            dashArray: '6 4',
        }).addTo(map);

        map.on('click', addWaypointFromMapClick);
    }

    function addWaypointFromInputs() {
        const x = Number(waypointXInput.value);
        const y = Number(waypointYInput.value);
        const altitude = Number(waypointAltitudeInput.value) || 0;

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            showStatus('Waypoint X and Y must be valid numbers.', 'error');
            return;
        }

        addWaypoint({ x, y, altitude });
        waypointXInput.value = '';
        waypointYInput.value = '';
        waypointAltitudeInput.value = '';
    }

    function buildRoutePayload() {
        const callsign = callSignSelect.value.trim();
        if (!callsign) {
            throw new Error('Please select an aircraft callsign.');
        }
        if (waypoints.length === 0) {
            throw new Error('Please add at least one waypoint.');
        }
        return {
            action: 'engage',
            route: {
                callsign,
                plannedAt: new Date().toISOString(),
                waypoints: waypoints.map((wp) => ({ x: wp.x, y: wp.y, altitude: wp.altitude }))
            }
        };
    }

    function sendRoute() {
        try {
            const payload = buildRoutePayload();
            if (window.autopilot && typeof window.autopilot.sendRoute === 'function') {
                window.autopilot.sendRoute(payload);
                showStatus('Route sent to the autopilot bridge.', 'success');
            } else {
                showStatus('Autopilot bridge is not available.', 'error');
            }
        } catch (err) {
            showStatus(err.message, 'error');
        }
    }

    function handleAutopilotAck(message) {
        if (!message || typeof message !== 'object') return;
        if (message.status === 'error') {
            showStatus(`Autopilot error: ${message.error || 'unknown error'}`, 'error');
        } else if (message.status === 'started') {
            showStatus('Autopilot started successfully.', 'success');
        } else {
            showStatus(`Autopilot acknowledged: ${message.status || 'received'}`, 'info');
        }
        console.log('Autopilot ACK:', message);
    }

    acceptDisclaimerBtn.addEventListener('click', () => {
        disclaimerModal.classList.add('hidden');
        apContainer.classList.remove('hidden');
        if (!map) initMap();
        setTimeout(() => {
            map.invalidateSize(true);
        }, 100);
        showStatus('Disclaimer accepted. Add a callsign and waypoints to begin.', 'info');
    });

    addWaypointBtn.addEventListener('click', addWaypointFromInputs);
    clearWaypointsBtn.addEventListener('click', clearWaypoints);
    startAutopilotBtn.addEventListener('click', sendRoute);

    if (window.autopilot && typeof window.autopilot.onAck === 'function') {
        window.autopilot.onAck(handleAutopilotAck);
    }

    if (window.autopilot && typeof window.autopilot.onYokeUpdate === 'function') {
        window.autopilot.onYokeUpdate((data) => {
            console.log('Yoke update:', data.percentage);
            updateYokeDisplay(data.percentage);
        });
    }

    if (window['24data'] && typeof window['24data'].onMessage === 'function') {
        window['24data'].onMessage((raw) => {
            try {
                const payload = JSON.parse(raw);
                if (payload.type === 'acft' && payload.payload) {
                    Object.keys(payload.payload).forEach((callsign) => {
                        if (callsign && typeof callsign === 'string') {
                            aircraftSet.add(callsign);
                        }
                    });
                    setCallsignOptions();
                }
            } catch (err) {
                console.warn('Failed to parse 24data message', err);
            }
        });
    } else {
        showStatus('24data bridge is unavailable; dropdown may remain empty.', 'info');
    }
})();

