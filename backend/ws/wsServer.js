const WebSocket = require('ws');

function startWSServer(server) {
    const wss = new WebSocket.Server({ server });
    wss.on('connection', (ws) => {
        ws.send(JSON.stringify({ msg: 'Connected to telemetry WS' }));
        // TODO: handle incoming commands
    });
    return wss;
}

module.exports = { startWSServer };
