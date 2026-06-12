import { spawn } from 'child_process';
import path from 'path';
import process from 'process';
import { app } from 'electron';
import win from '../server.js';
import { autopilotCallsign } from '../server.js';

// Autopilot process reference
let autopilotProcess = null;

// FIX: Track latest status globally to avoid listener race conditions
let latestAutopilotStatus = 'UNKNOWN';

/**
 * Initialize the C++ autopilot process
 */
export const initAutopilot = async () => {
    if (autopilotProcess && !autopilotProcess.killed) {
        console.log('[Autopilot] Already running');
        return true;
    }

    try {
        // Check if binary exists
        const fs = await import('fs');

        if (app.isPackaged) {
            if (!fs.existsSync(path.join(process.resourcesPath(), 'autopilot', 'autopilot.exe'))) {
                throw new Error('Autopilot binary not found in resources');
            }
            autopilotProcess = spawn(path.join(process.resourcesPath(), 'autopilot', 'autopilot.exe'));
        } else {
            if (!fs.existsSync(path.join(process.cwd(), 'autopilot', 'autopilot.exe'))) {
                throw new Error('Autopilot binary not found in development directory');
            }
            autopilotProcess = spawn(path.join(process.cwd(), 'autopilot', 'autopilot.exe'));
        }
        
        autopilotProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            
            // FIX: Split by newline in case multiple outputs arrive in one buffer chunk
            const lines = output.split('\n');
            
            for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;

                if (cleanLine.includes('STATUS:')) {
                    const match = cleanLine.match(/STATUS:(.*?)\s*(?:\(.*?\))?/);
                    if (match) {
                        latestAutopilotStatus = match[1].toUpperCase().trim();
                        console.log(`[Autopilot] ${latestAutopilotStatus}`);
                    }
                }

                if (cleanLine.includes('PERCENTAGE:')) {
                    const match = cleanLine.match(/PERCENTAGE:(-?\d+\.?\d*)%/);
                    if (match) {
                        const percentage = parseFloat(match[1]);
                        console.log(`[Yoke] ${percentage}%`); // Console output for yoke position
                        
                        // Emit event for UI updates (Electron IPC)
                        win?.webContents?.send?.('autopilot-update', percentage);
                    }
                }
            }
        });

        autopilotProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            
            console.log(`[RAW STDOUT] ${output}`); 
            
            const lines = output.split('\n');
            // ... rest of your existing stdout listener ...
        });

        autopilotProcess.stderr.on('data', (data) => {
            console.error(`[RAW STDERR] ${data.toString().trim()}`);
        });

        autopilotProcess.on('error', (err) => {
            console.error('[Autopilot Error]', err.message);
        });

        autopilotProcess.on('exit', (code, signal) => {
            console.log(`[Autopilot] Process exited with code: ${code}, signal: ${signal}`);
        });

        autopilotProcess.on('close', () => {
            console.log('[Autopilot] Process terminated');
            autopilotProcess = null;
            latestAutopilotStatus = 'DISENGAGED';
        });

        return true;
    } catch (error) {
        console.error('[Autopilot] Init failed:', error.message);
        return false;
    }
};

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

    console.log(`[DEBUG] Sending to C++: ${payload}`);

    autopilotProcess.stdin.write(payload + '\n');
    
    console.log('[Autopilot] Starting mission with waypoints:', cleanWaypoints.length);
    
    // Wait for initial response
    await new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
    
    return 0;
};

export const updateAutopilotPayload = async () => {
    if (!autopilotProcess || autopilotProcess.stdin.destroyed) {
        console.log('[Updater] Aborted: No active C++ process');
        return 0;
    }

    const currentAircraft = getCurrentAircraftState();
    if (!currentAircraft) {
        // THIS IS LIKELY THE PROBLEM
        console.log('[Updater] Aborted: currentAircraftState is null! You need to call setCurrentAircraftState()');
        return 0;
    }

    const cleanWaypoints = getCurrentWaypoints();
    if (!cleanWaypoints || cleanWaypoints.length === 0) {
        console.log('[Updater] Aborted: cleanWaypoints is empty!');
        return 0;
    }

    const payload = JSON.stringify({
        x: currentAircraft.x,
        y: currentAircraft.y,
        heading: currentAircraft.heading,
        altitude: currentAircraft.altitude,
        waypoints: cleanWaypoints
    });

    // NEW: Verify the string is actually being written
    console.log(`[DEBUG] Sending update to C++: ${payload}`);
    
    autopilotProcess.stdin.write(payload + '\n');
    return 0; 
};

let currentAircraftState = null;

export const setCurrentAircraftState = (state) => {
    currentAircraftState = state;
};

export const getCurrentAircraftState = () => {
    return currentAircraftState || null;
};

/**
 * Get current waypoints (from global or IPC)
 */
let currentWaypoints = [];

export const setCurrentWaypoints = (waypoints) => {
    currentWaypoints = waypoints;
};

export const getCurrentWaypoints = () => {
    return currentWaypoints || [];
};

/**
 * Get current autopilot status for UI
 */
export const getAutopilotStatus = async () => {
    if (!autopilotProcess || autopilotProcess.stdin.destroyed) {
        return { 
            status: 'DISENGAGED',
            message: 'Autopilot not started' 
        };
    }

    // Trigger the C++ to output its status
    autopilotProcess.stdin.write('STATUS\n');
    
    // FIX: Removed conflicting .once listener. Wait briefly for the global 
    // listener to update the variable, then return it.
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    let statusText = latestAutopilotStatus;
    if (latestAutopilotStatus === 'MISSION COMPLETE') {
        statusText = 'ROUTE COMPLETE';
    }

    return { 
        status: statusText,
        message: `Current state: ${latestAutopilotStatus}` 
    };
};

/**
 * Stop autopilot and cleanup
 */
export const stopAutopilotPayload = async () => {
    if (autopilotProcess) {
        autopilotProcess.kill();
        autopilotProcess = null;
        latestAutopilotStatus = 'DISENGAGED';
        autopilotCallsign = null;
        return true;
    }
    return false;
};

/**
 * Get current C++ process state
 */
export const getAutopilotState = () => {
    return {
        isRunning: !!autopilotProcess && !autopilotProcess.killed,
        pid: autopilotProcess?.pid
    };
};

export default {
    initAutopilot,
    startAutopilotPayload,
    updateAutopilotPayload,
    getAutopilotStatus,
    stopAutopilotPayload,
    getAutopilotState,
    setCurrentAircraftState,
    setCurrentWaypoints
};