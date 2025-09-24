// IPC bridge: spawns C++ autopilot and parses stdout
const { spawn } = require('child_process');

function startAutopilot() {
    const proc = spawn('./autopilot', [], { cwd: '../autopilot' });
    proc.stdout.on('data', (data) => {
        // Parse and forward telemetry
        try {
            const msg = JSON.parse(data.toString());
            // TODO: emit to ws/telemetry
            console.log('Telemetry:', msg);
        } catch (e) {
            console.error('Parse error:', e);
        }
    });
    proc.stderr.on('data', (data) => console.error('Autopilot error:', data.toString()));
    proc.on('close', (code) => console.log('Autopilot exited:', code));
    return proc;
}

module.exports = { startAutopilot };
