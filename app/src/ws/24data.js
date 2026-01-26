import WebSocket from 'ws';

let ws;
let reconnectInterval;

export function sendWS(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            const payload = typeof data === 'string' ? data : JSON.stringify(data);
            ws.send(payload);
        } catch (e) {
            console.error('WS send error:', e);
        }
    }
}

export function getWSStatus() {
    if (ws && ws.readyState === WebSocket.OPEN) return 'online';
    return 'offline';
}

export function initWS(mainWindow) {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    try {
        ws = new WebSocket('wss://24flight.org/ws');

        ws.on('open', () => {
            console.log('WS Connected to central server');
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('main-ws-update', { status: 'online' });
            }
        });

        ws.on('close', () => {
            console.log('WS Disconnected, retrying in 5s...');
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('main-ws-update', { status: 'offline' });
            }
            startReconnect(mainWindow);
        });

        ws.on('error', (e) => {
            console.error('WS Error:', e.message);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('main-ws-update', { status: 'offline' });
            }
        });

        ws.on('message', (data) => {
            try {
                const str = data.toString();
                // Forward raw message string to renderer
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('main-ws-message', str);
                }
            } catch (err) {
                console.error('Error forwarding WS message:', err);
            }
        });

    } catch (err) {
        console.error('Failed to init WS:', err);
        startReconnect(mainWindow);
    }
}

function startReconnect(mainWindow) {
    if (reconnectInterval) return;
    reconnectInterval = setInterval(() => {
        initWS(mainWindow);
    }, 5000);
}
