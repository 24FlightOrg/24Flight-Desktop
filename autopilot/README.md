# Autopilot System

## Overview
C++ autopilot that flies through 3D world via 2D plane coordinates (X, Y). Communicates with Node.js via stdin/stdout.

## Architecture
- **Node.js**: Orchestrates mission, handles UI updates, manages waypoints
- **C++**: Processes aircraft data, calculates yoke adjustments (-100% to 100%)

## Communication Protocol

### Start Command
```json
{
    "type": "start",
    "payload": {
        "waypoints": [[x1, y1], [x2, y2], ...],
        "aircraft": "AirFrans-2291"
    }
}
```

### Update Command (every 1 second)
```text
UPDATE
```

### Status Command
```text
STATUS
```

## Output Format

### Status Messages
```
STATUS:ENGAGED (Waypoint 1)
STATUS:DISENGAGED
STATUS:MISSION COMPLETE
```

### Percentage Output
```
PERCENTAGE:25.5%
PERCENTAGE:-45.3%
PERCENTAGE:0%
```

## Yoke Calculation
- **0%**: Yoke straight (center)
- **-100%**: Yoke all way left
- **+100%**: Yoke all way right

## Hitbox Logic
- **Waypoint completion**: Aircraft must be within 100x100 hitbox of waypoint
- **Route completion**: All waypoints must be completed

## Usage Example (Node.js)

```javascript
const autopilot = require('./main');

// Initialize process
autopilot.initAutopilot();

// Start mission with waypoints and aircraft
await autopilot.startMission([
    [-2238, 20358], // Waypoint 1
    [1000, 15000],  // Waypoint 2
    [5000, -5000]   // Waypoint 3
], 'AirFrans-2291');

// Update every 1 second for continuous yoke control
setInterval(async () => {
    const percentage = await autopilot.updateMission();
    console.log(`Yoke: ${percentage}%`);
}, 1000);

// Get status for UI
const status = await autopilot.getMissionStatus();
console.log(status);

// Cleanup
autopilot.stopAutopilot();
```

## Build Instructions
1. Compile C++ with g++/clang++
2. Place binary in `autopilot/bin/` or update path in main.js
3. Run Node.js entry point

## Files Structure
- `autopilot/src/autopilot.cpp` - Core logic and math
- `app/src/ipc/index.js` - IPC handler (optional, use main.js directly)
- `autopilot/src/main.js` - Main entry point for Node.js