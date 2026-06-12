#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <sstream>
#include <regex>
#include <iomanip>

// Define M_PI if not defined (C++ standard compliance)
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Global mission state (persistent across calls)
static struct MissionState {
    bool engaged = false;
    bool missionComplete = false;
    int waypointIndex = 0;
} gMissionState;

struct Waypoint {
    float x, y;
};

struct AircraftState {
    float x, y, heading, altitude, speed;
};

// Extract float value from JSON (handles both direct and nested position objects)
float extractFloatValue(const std::string& json, const std::string& key) {
    // Try direct access first - FIX: Made decimal optional via (?:\\.\\d+)?
    std::regex pattern("\"" + key + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
    std::smatch match;
    
    if (std::regex_search(json, match, pattern)) {
        return std::stof(match[1].str());
    }
    
    // Try nested position object via regex - FIX: Made decimal optional
    std::string searchKey = key;
    std::regex posPattern("\"position\"\\s*:\\s*\\{[^{}]*\"" + searchKey + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
    if (std::regex_search(json, match, posPattern)) {
        return std::stof(match[1].str());
    }
    
    // Try alternative pattern for position.y specifically - FIX: Made decimal optional
    if (key == "y") {
        std::regex yPattern("\"y\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
        if (std::regex_search(json, match, yPattern)) {
            return std::stof(match[1].str());
        }
    }
    
    return 0.0f;
}

// Calculate target bearing from current position to waypoint
float calculateBearing(float startX, float startY, float targetX, float targetY) {
    float dLat = targetY - startY;
    float dLon = targetX - startX;
    float bearingRad = std::atan2(dLat, dLon);
    float bearingDeg = bearingRad * (180.0f / M_PI);
    
    if (bearingDeg < 0) {
        bearingDeg += 360.0f;
    }
    return bearingDeg;
}

// Calculate heading difference (normalized to -180 to 180 range)
float getSignedHeadingDiff(float current, float target) {
    float diff = target - current;
    
    // Normalize to -180 to 180 range
    while (diff > 180.0f) diff -= 360.0f;
    while (diff <= -180.0f) diff += 360.0f;
    
    return diff;
}

// Calculate yoke percentage (-100% to 100%) based on heading error
float calculateYokePercent(float currentHeading, float targetBearing) {
    float signedDiff = getSignedHeadingDiff(currentHeading, targetBearing);
    
    // Scale: max deviation of 90 degrees = +/- 100%
    float percent = (signedDiff / 90.0f) * 100.0f;
    
    return std::clamp(percent, -100.0f, 100.0f);
}

// Check if aircraft is within 100x100 hitbox of waypoint
bool isWithinHitbox(const AircraftState& acft, const Waypoint& target) {
    float hitboxSize = 50.0f; // Half-size for 100x100 total (radius)
    return std::abs(acft.x - target.x) <= hitboxSize && 
           std::abs(acft.y - target.y) <= hitboxSize;
}

// Parse waypoints from JSON array string
std::vector<Waypoint> parseWaypoints(const std::string& json) {
    std::vector<Waypoint> waypoints;
    std::string searchStr = json;
    std::smatch match;
    
    // Pattern 1: Looks for {"x": 123, "y": 456} format (What Node is currently sending)
    std::regex objectPattern(R"(\{\s*"x"\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*"y"\s*:\s*(-?\d+(?:\.\d+)?))");
    
    while (std::regex_search(searchStr, match, objectPattern)) {
        float x = std::stof(match[1].str());
        float y = std::stof(match[2].str());
        waypoints.push_back({x, y});
        searchStr = match.suffix().str(); 
    }
    
    // Pattern 2: Fallback for [123, 456] array format
    if (waypoints.empty()) {
        searchStr = json; // Reset search string
        std::regex arrayPattern(R"(\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\])");
        
        while (std::regex_search(searchStr, match, arrayPattern)) {
            float x = std::stof(match[1].str());
            float y = std::stof(match[2].str());
            waypoints.push_back({x, y});
            searchStr = match.suffix().str(); 
        }
    }
    
    return waypoints;
}

// Parse aircraft state from JSON
AircraftState parseAircraftState(const std::string& json) {
    AircraftState state;
    
    state.altitude = extractFloatValue(json, "altitude");
    state.heading = extractFloatValue(json, "heading");
    
    // Handle nested position object (x and y)
    float x = extractFloatValue(json, "x");
    float y = extractFloatValue(json, "y");
    
    if (x != 0.0f || y != 0.0f) {
        state.x = x;
        state.y = y;
    } else {
        // Try direct access if structure differs
        state.x = extractFloatValue(json, "position.x");
        state.y = extractFloatValue(json, "position.y");
    }
    
    // Extract speed if available (optional)
    state.speed = extractFloatValue(json, "speed");
    if (state.speed == 0.0f && json.find("\"groundSpeed\"") != std::string::npos) {
        state.speed = extractFloatValue(json, "groundSpeed");
    }
    
    return state;
}

// Yoke physics: smooth steering with centering behavior
struct YokeState {
    float targetPercent;  // Where yoke should be (-100 to 100)
    float currentPercent; // Where yoke actually is (-100 to 100)
    float smoothingFactor; // How fast yoke moves toward target (0.5 = moderate, 0.8 = fast)
    bool engaged = false;
};

// Physics-based yoke movement with centering
float calculateYokePhysics(YokeState& yoke, float targetPercent) {
    if (!yoke.engaged) {
        yoke.currentPercent = 0.0f;
        return 0.0f;
    }
    
    // Calculate distance to target
    float error = targetPercent - yoke.currentPercent;
    
    // Move yoke toward target with smoothing
    yoke.currentPercent += error * yoke.smoothingFactor;
    
    // Clamp to valid range
    yoke.currentPercent = std::clamp(yoke.currentPercent, -100.0f, 100.0f);
    
    return yoke.currentPercent;
}

// Process command types
void processCommand(const std::string& inputJson) {
    // Check for startup command
    if (inputJson.find("\"type\":\"start\"") != std::string::npos || 
        inputJson.find("START") != std::string::npos) {
        
        gMissionState.engaged = true;
        gMissionState.missionComplete = false;
        gMissionState.waypointIndex = 0;
        
        std::cout << "STATUS:ENGAGED" << std::endl;
        return;
    }
    
    // Check for update command (re-fetch new data)
    if (inputJson.find("UPDATE") != std::string::npos || 
        inputJson.find("update") != std::string::npos) {
        
        gMissionState.missionComplete = true;
        gMissionState.engaged = false;
        gMissionState.waypointIndex = 0;
        
        std::cout << "STATUS:DISENGAGED" << std::endl;
        return;
    }
    
    // Check for status command
    if (inputJson.find("STATUS") != std::string::npos || 
        inputJson.find("status") != std::string::npos) {
        
        if (gMissionState.missionComplete) {
            std::cout << "STATUS:MISSION COMPLETE" << std::endl;
            gMissionState.engaged = false;
            return;
        } else if (!gMissionState.engaged) {
            std::cout << "STATUS:DISENGAGED" << std::endl;
            return;
        } else {
            // Get next waypoint index for status
            int remaining = gMissionState.waypointIndex + 1;
            std::cout << "STATUS:ENGAGED (Waypoint " << remaining << ")" << std::endl;
            return;
        }
    }
}

// Main processing loop with persistent state
void processAutopilot(const std::string& inputJson) {
    // Process command types first
    processCommand(inputJson);
    
    if (!gMissionState.engaged || gMissionState.missionComplete) {
        if (gMissionState.missionComplete) {
            std::cout << "STATUS:MISSION COMPLETE" << std::endl;
        } else {
            std::cout << "STATUS:DISENGAGED" << std::endl;
        }
        std::cout << "PERCENTAGE:0%" << std::endl;
        return;
    }

    // Parse input JSON
    AircraftState acft = parseAircraftState(inputJson);
    std::vector<Waypoint> waypoints = parseWaypoints(inputJson);
    
    // NEW: Print out what C++ actually parsed!
    std::cerr << "[C++ MATH] Parsed ACFT -> X:" << acft.x << " Y:" << acft.y << " HDG:" << acft.heading << std::endl;
    std::cerr << "[C++ MATH] Parsed Waypoints -> Count: " << waypoints.size() << std::endl;

    if (waypoints.empty()) {
        std::cout << "PERCENTAGE:0%" << std::endl;
        return;
    }
    
    // Get current target waypoint
    const Waypoint& target = waypoints[gMissionState.waypointIndex];
    
    // Calculate current bearing to waypoint
    float targetBearing = calculateBearing(acft.x, acft.y, target.x, target.y);
    
    // Calculate raw yoke adjustment needed (instant correction)
    float targetPercent = calculateYokePercent(acft.heading, targetBearing);
    
    // Physics-based yoke smoothing with centering behavior
    static YokeState yokePhysics;
    yokePhysics.engaged = true;
    yokePhysics.smoothingFactor = 0.7f; // Adjust for desired response speed
    
    float actualYokePercent = calculateYokePhysics(yokePhysics, targetPercent);
    
    // FIX: Removed duplicate output lines. Handle logic first, print once at the end.
    
    // Check if within hitbox (mission progression)
    if (isWithinHitbox(acft, target)) {
        gMissionState.waypointIndex++;
        
        if (gMissionState.waypointIndex >= waypoints.size()) {
            gMissionState.missionComplete = true;
            gMissionState.engaged = false;
            yokePhysics.engaged = false; // Reset physics
            std::cout << "STATUS:MISSION COMPLETE" << std::endl;
            actualYokePercent = 0.0f; // Reset yoke to center on completion
        } else {
            // Move to next waypoint and recalculate
            const Waypoint& nextTarget = waypoints[gMissionState.waypointIndex];
            float nextBearing = calculateBearing(acft.x, acft.y, nextTarget.x, nextTarget.y);
            float nextTargetPercent = calculateYokePercent(acft.heading, nextBearing);
            actualYokePercent = calculateYokePhysics(yokePhysics, nextTargetPercent);
        }
    } 
    
    // FIX: Final unified output for this tick
    std::cout << "PERCENTAGE:" << actualYokePercent << "%" << std::endl;
}

int main() {
    std::string line;
    // Print a startup message so we know the binary actually launched
    std::cerr << "[C++ DEBUG] Autopilot executable started successfully." << std::endl;

    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        
        // Log exactly what C++ receives from Node.js
        std::cerr << "[C++ DEBUG] Received payload: " << line << std::endl;
        
        processAutopilot(line);
    }
    
    std::cerr << "[C++ DEBUG] Input stream closed, exiting." << std::endl;
    return 0;
}