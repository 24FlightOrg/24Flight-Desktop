import WebSocket from 'ws';
import { Notification } from 'electron';

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
            console.log('WS | Connected');
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('main-ws-update', { status: 'online' });
            }
        });

        ws.on('close', () => {
            console.log('WS | Disconnected, retrying in 5s...');
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('main-ws-update', { status: 'offline' });
            }
            startReconnect(mainWindow);
        });

        ws.on('error', (e) => {
            console.error('WS | Error:', e.message);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('main-ws-update', { status: 'offline' });
            }
        });

        ws.on('message', (data) => {
            try {
                const str = data.toString();
                let parsed;

                try {
                    parsed = JSON.parse(str);
                } catch (parseErr) {
                    parsed = null;
                }

                if (parsed && parsed.type === 'notification') {
                    const payload = parsed.payload ?? str;
                    new Notification({
                        title: '24Flight System Notification',
                        body: typeof payload === 'string' ? payload : JSON.stringify(payload)
                    }).show();
                }

                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('main-ws-message', str);
                }
            } catch (err) {
                console.error('WS | Error forwarding message:', err);
            }
        });

    } catch (err) {
        console.error('WS | Failed to init:', err);
        startReconnect(mainWindow);
    }
}

function startReconnect(mainWindow) {
    if (reconnectInterval) return;
    reconnectInterval = setInterval(() => {
        initWS(mainWindow);
    }, 5000);
}
