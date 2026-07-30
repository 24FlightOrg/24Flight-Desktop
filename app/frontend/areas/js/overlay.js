document.addEventListener('DOMContentLoaded', async () => {
    const titleInput = document.getElementById('window-title');
    const titleSelect = document.getElementById('window-title-select');
    const refreshWindowsBtn = document.getElementById('btn-refresh-windows');
    const callsignSelect = document.getElementById('callsign-select');
    const startBtn = document.getElementById('btn-start-overlay');
    const stopBtn = document.getElementById('btn-stop-overlay');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const chipBtns = document.querySelectorAll('.preset-chips .chip-btn');

    chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-target') || btn.innerText;
            titleInput.value = val;
        });
    });

    async function fetchWindowTitles() {
        if (window.overlay && typeof window.overlay.getWindowTitles === 'function') {
            try {
                titleSelect.innerHTML = '<option value="">Loading running windows...</option>';
                const titles = await window.overlay.getWindowTitles();
                titleSelect.innerHTML = '<option value="">-- Select an open window --</option>';
                if (Array.isArray(titles) && titles.length > 0) {
                    titles.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t;
                        opt.textContent = t;
                        titleSelect.appendChild(opt);
                    });
                } else {
                    const opt = document.createElement('option');
                    opt.value = "";
                    opt.textContent = "No open windows detected";
                    titleSelect.appendChild(opt);
                }
            } catch (e) {
                console.error('Error fetching window titles:', e);
                titleSelect.innerHTML = '<option value="">Error detecting windows</option>';
            }
        }
    }

    titleSelect.addEventListener('change', () => {
        if (titleSelect.value) {
            titleInput.value = titleSelect.value;
        }
    });

    if (refreshWindowsBtn) {
        refreshWindowsBtn.addEventListener('click', fetchWindowTitles);
    }

    await fetchWindowTitles();

    function lockOverlayUI(message) {
        startBtn.disabled = true;
        stopBtn.disabled = true;
        startBtn.textContent = 'Overlay Locked';
        statusDot.className = 'status-dot inactive';
        statusText.textContent = message || 'Overlay used — restart 24Flight to use it again';
    }

    async function checkStatus() {
        if (window.overlay && typeof window.overlay.getStatus === 'function') {
            try {
                const res = await window.overlay.getStatus();
                if (res && res.locked) {
                    lockOverlayUI('Overlay used — restart 24Flight to use it again');
                    return;
                }
                if (res && res.active) {
                    statusDot.className = 'status-dot active';
                    statusText.textContent = 'Overlay Active';
                    stopBtn.disabled = false;
                } else {
                    statusDot.className = 'status-dot inactive';
                    statusText.textContent = 'Overlay Inactive';
                    stopBtn.disabled = true;
                }
            } catch (e) {
                console.error('Error checking status:', e);
            }
        }
    }

    await checkStatus();

    if (window['24data'] && typeof window['24data'].onMessage === 'function') {
        window['24data'].onMessage((data) => {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'acft' && msg.payload) {
                    const currentSelection = callsignSelect.value;
                    callsignSelect.innerHTML = '<option value="">All / Automatic</option>';
                    Object.keys(msg.payload).forEach(callsign => {
                        const opt = document.createElement('option');
                        opt.value = callsign;
                        opt.textContent = callsign;
                        if (callsign === currentSelection) opt.selected = true;
                        callsignSelect.appendChild(opt);
                    });
                }
            } catch (e) {
                // ignore
            }
        });
    }

    startBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim() || titleSelect.value || 'Roblox';
        const callsign = callsignSelect.value || '';
        if (window.overlay && typeof window.overlay.start === 'function') {
            startBtn.disabled = true;
            statusText.textContent = 'Launching overlay...';
            const res = await window.overlay.start({ title, callsign });
            if (res && res.success) {
                startBtn.disabled = false;
                await checkStatus();
            } else if (res && res.locked) {
                lockOverlayUI(res.error || 'Overlay used — restart 24Flight to use it again');
                alert('You can only start the overlay once per app session. Please fully close and reopen 24Flight to use it again.');
            } else {
                startBtn.disabled = false;
                alert('Failed to start overlay: ' + (res?.error || 'Unknown error'));
                await checkStatus();
            }
        }
    });

    stopBtn.addEventListener('click', async () => {
        if (window.overlay && typeof window.overlay.stop === 'function') {
            stopBtn.disabled = true;
            statusText.textContent = 'Stopping overlay...';
            const res = await window.overlay.stop();
            if (res && res.locked) {
                lockOverlayUI('Overlay stopped — restart 24Flight to use it again');
                alert('The overlay has been stopped. To start it again, please fully close and reopen 24Flight.');
            } else {
                await checkStatus();
            }
        }
    });
});