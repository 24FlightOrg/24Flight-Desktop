import { spawn } from 'child_process';
import path from 'path';
import process from 'process';
import fs from 'fs';
import { app } from 'electron';
import win from '../server.js';

// --- SYSTEM STATE VARIABLES ---
let autopilotProcess = null;
let javaWorkerProcess = null;

let latestAutopilotStatus = 'UNKNOWN';
let autopilotEngaged = false; 
let currentYokePercentage = 0.0; 
let activeKey = null;

let currentAircraftState = null;
let currentWaypoints = [];

/**
 * Initializes the clean Java Input Bridge Process
 */
export const initJavaWorker = () => {
    if (javaWorkerProcess && !javaWorkerProcess.killed) return true;

    // Target the apinputworker directory where the JAR is generated
    let jarPath = app.isPackaged
        ? path.join(process.resourcesPath(), 'apinputworker', 'InputWorker.jar')
        : path.join(process.cwd(), 'apinputworker', 'InputWorker.jar');

    console.log(`[Electron] Spawning pure Java Robot from: ${jarPath}`);
    
    javaWorkerProcess = spawn('java', ['-jar', jarPath]);

    // Route standard out strings from Java right into the main Electron terminal console
    javaWorkerProcess.stdout.on('data', (data) => {
        console.log(`[Java STDOUT] ${data.toString().trim()}`);
    });

    javaWorkerProcess.stderr.on('data', (data) => {
        console.error(`[Java STDERR] ${data.toString().trim()}`);
    });

    javaWorkerProcess.on('close', (code) => {
        console.log(`[Java Worker] Pipeline disconnected with exit code: ${code}`);
        javaWorkerProcess = null;
    });
};

/**
 * Streams text buffers down to Java's System.in stream
 */
function sendJavaCommand(command) {
    if (!javaWorkerProcess || javaWorkerProcess.stdin.destroyed) {
        initJavaWorker();
    }
    try {
        javaWorkerProcess.stdin.write(`${command}\n`, 'utf8', (err) => {
            if (err) console.error("[IPC Pipe Flush Error]:", err.message);
        });
    } catch (err) {
        console.error("[IPC Pipe Error] Stream write failed:", err.message);
    }
}

function pressKey(key) {
    if (activeKey !== key) {
        releaseAllKeys();
        activeKey = key;
        console.log(`[Electron Loop] Sending command -> PRESS_${key.toUpperCase()}`);
        sendJavaCommand(`PRESS_${key.toUpperCase()}`);
    }
}

function releaseAllKeys() {
    if (activeKey) {
        console.log(`[Electron Loop] Sending command -> RELEASE_${activeKey.toUpperCase()}`);
        sendJavaCommand(`RELEASE_${activeKey.toUpperCase()}`);
        activeKey = null;
    }
}

/**
 * Initialize the C++ autopilot math calculation process
 */
export const initAutopilot = async () => {
    if (autopilotProcess && !autopilotProcess.killed) {
        console.log('[Autopilot] Math engine already running');
        return true;
    }

    const platform = process.platform;
    const binaryExt = platform === 'win32' ? '.exe' : '';
    
    let binaryPath = app.isPackaged
        ? path.join(process.resourcesPath(), 'autopilot', `autopilot${binaryExt}`)
        : path.join(process.cwd(), 'autopilot', `autopilot${binaryExt}`);

    try {
        if (!fs.existsSync(binaryPath)) {
            throw new Error(`Autopilot binary not found at: ${binaryPath}`);
        }

        // Spin up the Java input bridge worker alongside the math engine
        initJavaWorker();

        autopilotProcess = spawn(binaryPath);
        setupProcessListeners();
        return true;

    } catch (error) {
        console.error('[Autopilot] Init failed:', error.message);
        return false;
    }
};

/**
 * Registers live data streams from the active C++ binary process
 */
function setupProcessListeners() {
    if (!autopilotProcess) return;

    // Helper function to extract telemetry data from a text chunk
    const parseTelemetryData = (rawBuffer) => {
        const rawChunk = rawBuffer.toString();
        const lines = rawChunk.split(/\r?\n/);
        
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            // Log everything to the terminal so you can see it working
            console.log(`[C++ Stream Intercept] ${cleanLine}`);

            // TARGET LOCKED: Check for Yoke Cmd anywhere in the string
            if (cleanLine.includes('Yoke Cmd:')) {
                const parts = cleanLine.split('Yoke Cmd:');
                if (parts.length > 1) {
                    const valueStr = parts[1].replace('%', '').trim();
                    const parsedValue = parseFloat(valueStr);

                    if (!isNaN(parsedValue)) {
                        currentYokePercentage = parsedValue;
                        win?.webContents?.send?.('autopilot-update', currentYokePercentage);
                    }
                }
            }

            if (cleanLine.includes('STATUS:')) {
                const match = cleanLine.match(/STATUS:(.*?)\s*(?:\(.*?\))?/);
                if (match) {
                    latestAutopilotStatus = match[1].toUpperCase().trim();
                    if (latestAutopilotStatus === 'MISSION COMPLETE' || latestAutopilotStatus === 'DISENGAGED') {
                        stopAutopilotPayload();
                    }
                }
            }
        }
    };

    // Listen to Standard Output (stdout)
    autopilotProcess.stdout.on('data', parseTelemetryData);

    // CRITICAL FIX: Run the exact same parsing logic on Standard Error (stderr) 
    // because that's where your C++ engine is routing the logs!
    autopilotProcess.stderr.on('data', parseTelemetryData);
}

export const startAutopilotPayload = async (waypoints, aircraftCallsign) => {
    if (!autopilotProcess) {
        await initAutopilot();
    }

    const cleanWaypoints = waypoints.map(wp => [wp.x, wp.y]);
    
    const payload = JSON.stringify({
        type: 'start',
        payload: {
            waypoints: cleanWaypoints,
            aircraft: aircraftCallsign
        }
    });

    autopilotProcess.stdin.write(payload + '\n');
    
    autopilotEngaged = true;
    currentYokePercentage = 0.0;

    await new Promise((resolve) => setTimeout(resolve, 100));
    return 0;
};

export const updateAutopilotPayload = async () => {
    if (!autopilotProcess || autopilotProcess.stdin.destroyed) {
        return 0;
    }

    const currentAircraft = getCurrentAircraftState();
    if (!currentAircraft) return 0;

    const cleanWaypoints = getCurrentWaypoints();
    if (!cleanWaypoints || cleanWaypoints.length === 0) return 0;

    const payload = JSON.stringify({
        x: currentAircraft.x,
        y: currentAircraft.y,
        heading: currentAircraft.heading,
        altitude: currentAircraft.altitude,
        waypoints: cleanWaypoints
    });

    autopilotProcess.stdin.write(payload + '\n');
    return 0; 
};

export const setInitialAircraftState = (state) => { currentAircraftState = state; };
export const setCurrentAircraftState = (state) => { currentAircraftState = state; };
export const getCurrentAircraftState = () => { return currentAircraftState || null; };

export const setCurrentWaypoints = (waypoints) => { currentWaypoints = waypoints; };
export const getCurrentWaypoints = () => { return currentWaypoints || []; };

export const getAutopilotStatus = async () => {
    if (!autopilotProcess || autopilotProcess.stdin.destroyed) {
        return { status: 'DISENGAGED', message: 'Autopilot not started' };
    }

    let statusText = latestAutopilotStatus;
    if (latestAutopilotStatus === 'MISSION COMPLETE') {
        statusText = 'ROUTE COMPLETE';
    }

    return { 
        status: statusText,
        message: `Current state: ${latestAutopilotStatus}` 
    };
};

export const stopAutopilotPayload = async () => {
    if (!autopilotEngaged) return false;

    console.log('[AUTOPILOT] SHUTTING DOWN ENGINE AND DRIVERS SAFELY.');
    autopilotEngaged = false;
    currentYokePercentage = 0.0;
    
    // Reset inputs immediately
    sendJavaCommand("RELEASE_ALL");
    sendJavaCommand("EXIT");

    if (javaWorkerProcess) {
        javaWorkerProcess.kill();
        javaWorkerProcess = null;
    }
    
    if (autopilotProcess) {
        autopilotProcess.kill();
        autopilotProcess = null;
        latestAutopilotStatus = 'DISENGAGED';
        return true;
    }
    return false;
};

export const getAutopilotState = () => {
    return {
        isRunning: !!autopilotProcess && !autopilotProcess.killed,
        pid: autopilotProcess?.pid
    };
};

// --- MAIN HARDWARE DRIVER LOOP (20Hz Refresh) ---
setInterval(() => {
    console.log(`[Loop Tick] Engaged: ${autopilotEngaged} | Yoke Cmd: ${currentYokePercentage}% | Active Key: ${activeKey}`);

    if (!autopilotEngaged) return;

    if (currentYokePercentage < -2.0) {
        pressKey('a');
    } else if (currentYokePercentage > 2.0) {
        pressKey('d');
    } else {
        releaseAllKeys();
    }
}, 50);

export default {
    initJavaWorker,
    initAutopilot,
    startAutopilotPayload,
    updateAutopilotPayload,
    getAutopilotStatus,
    stopAutopilotPayload,
    getAutopilotState,
    setCurrentAircraftState,
    setCurrentWaypoints
};