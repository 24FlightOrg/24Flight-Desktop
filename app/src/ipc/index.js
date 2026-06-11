// IPC bridge: spawns C++ autopilot and parses stdout
const { spawn } = require('child_process');
const { app } = require('electron');
const path = require('path');

let autopilotProc = null;

function getAutopilotExecutablePath() {
    const execName = process.platform === 'win32' ? 'autopilot.exe' : 'autopilot';
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'autopilot', execName);
    }
    return path.join(app.getAppPath(), '..', '..', 'autopilot', execName);
}

function escapeQuotedString(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

function makeTocppMessage(type, data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return `tocpp: type="${escapeQuotedString(type)}": data="${escapeQuotedString(payload)}"\n`;
}

function sendToCpp(type, data) {
    if (!autopilotProc) {
        throw new Error('Autopilot process is not started');
    }
    if (!autopilotProc.stdin || autopilotProc.stdin.destroyed) {
        throw new Error('Autopilot stdin is not available');
    }

    const message = makeTocppMessage(type, data);
    autopilotProc.stdin.write(message);
}

function parseTondjsLine(line) {
    const prefix = 'tondjs: ';
    if (!line.startsWith(prefix)) return null;

    const payload = line.slice(prefix.length);
    let pos = 0;

    const skipWhitespace = () => {
        while (pos < payload.length && /\s/.test(payload[pos])) {
            pos += 1;
        }
    };

    const readLiteral = (literal) => {
        if (payload.slice(pos, pos + literal.length) === literal) {
            pos += literal.length;
            return true;
        }
        return false;
    };

    const readQuotedString = () => {
        if (payload[pos] !== '"') {
            throw new Error(`Expected opening quote at position ${pos}`);
        }
        pos += 1;
        let value = '';

        while (pos < payload.length) {
            const ch = payload[pos++];
            if (ch === '\\') {
                if (pos >= payload.length) break;
                const esc = payload[pos++];
                if (esc === 'n') value += '\n';
                else if (esc === 'r') value += '\r';
                else if (esc === 't') value += '\t';
                else if (esc === '"' || esc === '\\' || esc === '/') value += esc;
                else value += `\\${esc}`;
            } else if (ch === '"') {
                return value;
            } else {
                value += ch;
            }
        }

        throw new Error('Unterminated quoted string in tondjs payload');
    };

    try {
        skipWhitespace();
        if (!readLiteral('type:')) return null;
        skipWhitespace();
        const type = readQuotedString();
        skipWhitespace();
        if (!readLiteral(':')) return null;
        skipWhitespace();
        if (!readLiteral('data:')) return null;
        skipWhitespace();
        let data = readQuotedString();

        try {
            data = JSON.parse(data);
        } catch (_) {
            // keep as string when not valid JSON
        }

        return { type, data };
    } catch (error) {
        console.error('Failed to parse tondjs payload:', error.message, 'payload:', payload);
        return null;
    }
}

function startAutopilot() {
    const executable = getAutopilotExecutablePath();
    const proc = spawn(executable, [], { cwd: path.dirname(executable), stdio: ['pipe', 'pipe', 'pipe'] });
    autopilotProc = proc;
    let stdoutBuffer = '';

    proc.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop();

        for (const line of lines) {
            const msg = parseTondjsLine(line);
            if (msg) {
                // TODO: emit to ws/telemetry
                console.log('Telemetry:', msg);
            }
        }
    });

    proc.stderr.on('data', (data) => console.error('Autopilot error:', data.toString()));
    proc.on('close', (code) => console.log('Autopilot exited:', code));
    return proc;
}

module.exports = { startAutopilot, sendToCpp };
