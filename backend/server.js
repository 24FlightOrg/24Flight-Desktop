const express = require('express');
const http = require('http');
const telemetryRouter = require('./telemetry/telemetry');
const { startAutopilot } = require('./ipc/index');
const { startWSServer } = require('./ws/wsServer');

const app = express();
app.use('/telemetry', telemetryRouter);

const server = http.createServer(app);
startWSServer(server);
startAutopilot();

server.listen(3000, () => console.log('Backend listening on port 3000'));
