const wsPending = new Map();
let wsRequestId = 0;
let planeData = [];

const TCAS_HORIZONTAL_THRESHOLD = 500;
const TCAS_VERTICAL_THRESHOLD = 304.8;

const tcasConflicts = new Set();
let tcasCheckInterval = null;
let tcasAudioInterval = null;

const enableTCAS = { value: true }; 
const tcasAudio = new Audio('https://upload.wikimedia.org/wikipedia/commons/c/c3/Tcas_traffic.ogg');
const currentSound = { interval: 1000 };
let playerUser = 'GreenvillSSnick';

// --- Link Configuration Event Hooks ---
document.addEventListener("DOMContentLoaded", () => {
    const playerInput = document.getElementById("player-input");
    const tcasToggle = document.getElementById("tcas-toggle");

    if (playerInput) {
        playerInput.addEventListener("input", (e) => {
            playerUser = e.target.value.trim();
            checkTCAS();
        });
    }

    if (tcasToggle) {
        tcasToggle.addEventListener("change", (e) => {
            enableTCAS.value = e.target.checked;
            checkTCAS();
        });
    }

    startTCASMonitoring();
});

// --- Network Message Handlers ---
if (window['24data']) {
    window['24data'].onMessage((data) => {
        try {
            const msg = JSON.parse(data);

            if (msg.requestId && wsPending.has(msg.requestId)) {
                wsPending.get(msg.requestId)(msg);
                wsPending.delete(msg.requestId);
                return;
            }

            if (msg.type === 'acft' && msg.payload) {
                handleAircraftUpdate(msg.payload);
            }
        } catch (e) {
            console.error('Error handling message:', e);
        }
    });

    window['24data'].onUpdate((data) => {
        if (data.status === 'offline') {
            console.log('24data is offline');
        }
    });
}

function handleAircraftUpdate(aircraft) {
    try {
        planeData = Object.entries(aircraft).map(([callsign, data]) => ({
            callsign: callsign,
            playerName: data.playerName,
            altitude: data.altitude,
            isOnGround: data.isOnGround,
            posX: data.position ? data.position.x : 0,
            posY: data.position ? data.position.y : 0
        }));
        
        updateAircraftTable();
    } catch (e) {
        console.error("Error updating plane data context array:", e);
    }
}

// --- Tracking Calculations Engine ---
function checkTCAS() {
    if (!enableTCAS.value) {
        if (tcasAudioInterval) { clearInterval(tcasAudioInterval); tcasAudioInterval = null; }
        tcasConflicts.clear();
        updateUIStatus(false, "OFFLINE");
        updateAircraftTable();
        return;
    }

    tcasConflicts.clear();

    // Check separation paths across all live airborne planes
    for (let i = 0; i < planeData.length; i++) {
        const a1 = planeData[i];
        if (a1.isOnGround || (a1.isOnGround === undefined && a1.altitude < 161)) continue;

        for (let j = i + 1; j < planeData.length; j++) {
            const a2 = planeData[j];
            if (a2.isOnGround || (a2.isOnGround === undefined && a2.altitude < 161)) continue;

            const dx_m = (a1.posX - a2.posX) * 0.56;
            const dy_m = (a1.posY - a2.posY) * 0.56;
            const horizontalDist = dx_m * dx_m + dy_m * dy_m;

            const alt1_m = a1.altitude * 0.3048;
            const alt2_m = a2.altitude * 0.3048;
            const verticalDist = Math.abs(alt1_m - alt2_m);

            if (
                horizontalDist < TCAS_HORIZONTAL_THRESHOLD ** 2 &&
                verticalDist < TCAS_VERTICAL_THRESHOLD
            ) {
                tcasConflicts.add(a1.callsign);
                tcasConflicts.add(a2.callsign);
            }
        }
    }

    // Isolate if own tracking ID matches current active hazards
    const conflictArray = Array.from(tcasConflicts);
    const playerInConflict = planeData.some(acft => 
        conflictArray.includes(acft.callsign) && acft.playerName === playerUser
    );

    if (tcasConflicts.size > 0 && playerInConflict) {
        updateUIStatus(true, "⚠️ TRAFFIC ALERT - CONFLICT DETECTED ⚠️");
        
        if (!tcasAudioInterval) {
            tcasAudioInterval = setInterval(() => {
                tcasAudio.currentTime = 0;
                tcasAudio.play().catch(err => console.warn("Audio stream error:", err));
            }, currentSound.interval);
        }
    } else {
        updateUIStatus(false, "MONITORING - NO CONFLICTS");
        if (tcasAudioInterval) { clearInterval(tcasAudioInterval); tcasAudioInterval = null; }
    }
    
    updateAircraftTable();
}

// --- Layout Modifiers ---
function updateUIStatus(isActiveAlert, textContent) {
    const statusBox = document.getElementById("tcas-alert-status");
    if (!statusBox) return;

    if (isActiveAlert) {
        statusBox.className = "alert-status-box active-warning";
        statusBox.textContent = textContent;
    } else {
        statusBox.className = "alert-status-box";
        statusBox.textContent = textContent;
        if (textContent === "OFFLINE") {
            statusBox.style.color = "#718096";
        } else {
            statusBox.style.color = "";
        }
    }
}

function updateAircraftTable() {
    const tbody = document.getElementById("aircraft-table-body");
    if (!tbody) return;

    if (planeData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #718096; padding: 20px;">Awaiting network stream packets...</td></tr>`;
        return;
    }

    let html = "";
    planeData.forEach(acft => {
        const isConflicted = tcasConflicts.has(acft.callsign);
        const isSelf = acft.playerName === playerUser;
        const rowClass = isConflicted ? 'class="row-conflict"' : '';
        const nameLabel = isSelf ? `<strong>${acft.playerName} [Self]</strong>` : acft.playerName;

        html += `
            <tr ${rowClass}>
                <td style="font-family: monospace; font-weight: bold;">${acft.callsign}</td>
                <td>${nameLabel}</td>
                <td>${acft.altitude.toLocaleString()} ft</td>
                <td>${acft.isOnGround ? 'On Ground' : 'Airborne'}</td>
                <td style="font-family: monospace; color: #a0aec0;">${Math.round(acft.posX)}, ${Math.round(acft.posY)}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function startTCASMonitoring() {
    if (tcasCheckInterval !== null) return;
    tcasCheckInterval = setInterval(() => {
        checkTCAS();
    }, 500);
}