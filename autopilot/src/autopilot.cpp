#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <sstream>
#include <regex>
#include <algorithm>

#ifndef M_PI
#define M_PI 3.14159265358979
#endif

const float IMAGE_WIDTH = 14453.0f;
const float IMAGE_HEIGHT = 13800.0f;

const float PTFS_TOP_LEFT_X = -49222.1f;
const float PTFS_TOP_LEFT_Y = -45890.8f;
const float PTFS_BOTTOM_RIGHT_X = 47132.9f;
const float PTFS_BOTTOM_RIGHT_Y = 46139.2f;

const float PTFS_CENTER_X = (PTFS_TOP_LEFT_X + PTFS_BOTTOM_RIGHT_X) / 2.0f;
const float PTFS_CENTER_Y = (PTFS_TOP_LEFT_Y + PTFS_BOTTOM_RIGHT_Y) / 2.0f;

const float PTFS_WIDTH = PTFS_BOTTOM_RIGHT_X - PTFS_TOP_LEFT_X;
const float PTFS_HEIGHT = PTFS_BOTTOM_RIGHT_Y - PTFS_TOP_LEFT_Y;

const float SCALE_X = IMAGE_WIDTH / PTFS_WIDTH;
const float SCALE_Y = IMAGE_HEIGHT / PTFS_HEIGHT;
const float SCALE = std::min(SCALE_X, SCALE_Y);

const float OFFSET_Y = 8.0f;

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

Waypoint transformMapToApi(float mapX, float mapY) {
    float dx = (mapX - (IMAGE_WIDTH / 2.0f)) / SCALE;
    float apiX = dx + PTFS_CENTER_X;

    float dy = ((IMAGE_HEIGHT / 2.0f) - mapY) / SCALE;
    float adjustedY = dy + PTFS_CENTER_Y;
    float apiY = adjustedY + OFFSET_Y;

    return {apiX, apiY};
}

float extractFloatValue(const std::string& json, const std::string& key) {
    std::regex pattern("\"" + key + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
    std::smatch match;
    
    if (std::regex_search(json, match, pattern)) return std::stof(match[1].str());
    
    std::string searchKey = key;
    std::regex posPattern("\"position\"\\s*:\\s*\\{[^{}]*\"" + searchKey + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
    if (std::regex_search(json, match, posPattern)) return std::stof(match[1].str());
    
    if (key == "y") {
        std::regex yPattern("\"y\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)");
        if (std::regex_search(json, match, yPattern)) return std::stof(match[1].str());
    }
    
    return 0.0f;
}

float calculateBearing(float startX, float startY, float targetX, float targetY) {
    float dLat = startY - targetY; 
    float dLon = targetX - startX;
    
    float bearingRad = std::atan2(dLon, dLat); 
    float bearingDeg = bearingRad * (180.0f / M_PI);
    
    while (bearingDeg < 0.0f) bearingDeg += 360.0f;
    while (bearingDeg >= 360.0f) bearingDeg -= 360.0f;
    
    return bearingDeg;
}

float getSignedHeadingDiff(float current, float target) {
    float diff = target - current;
    while (diff > 180.0f) diff -= 360.0f;
    while (diff <= -180.0f) diff += 360.0f;
    return diff;
}

float calculateYokePercent(float currentHeading, float targetBearing) {
    float signedDiff = getSignedHeadingDiff(currentHeading, targetBearing);
    
    float percent = (signedDiff / 90.0f) * 100.0f;
    
    return std::clamp(percent, -100.0f, 100.0f);
}

bool isWithinHitbox(const AircraftState& acft, const Waypoint& target) {
    float hitboxRadiusAPI = 500.0f / SCALE; 
    return std::abs(acft.x - target.x) <= hitboxRadiusAPI && 
           std::abs(acft.y - target.y) <= hitboxRadiusAPI;
}

std::vector<Waypoint> parseWaypoints(const std::string& json) {
    std::vector<Waypoint> waypoints;
    
    size_t wpStart = json.find("\"waypoints\"");
    if (wpStart == std::string::npos) return waypoints;
    
    std::string searchStr = json.substr(wpStart); 
    std::smatch match;
    
    std::regex objectPattern(R"(\{\s*"x"\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*"y"\s*:\s*(-?\d+(?:\.\d+)?))");
    
    while (std::regex_search(searchStr, match, objectPattern)) {
        float mapX = std::stof(match[1].str());
        float mapY = std::stof(match[2].str());
        
        waypoints.push_back(transformMapToApi(mapX, mapY));
        searchStr = match.suffix().str(); 
    }
    
    if (waypoints.empty()) {
        searchStr = json.substr(wpStart); 
        std::regex arrayPattern(R"(\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\])");
        
        while (std::regex_search(searchStr, match, arrayPattern)) {
            float mapX = std::stof(match[1].str());
            float mapY = std::stof(match[2].str());
            
            waypoints.push_back(transformMapToApi(mapX, mapY));
            searchStr = match.suffix().str(); 
        }
    }
    
    return waypoints;
}

AircraftState parseAircraftState(const std::string& json) {
    AircraftState state;
    state.altitude = extractFloatValue(json, "altitude");
    state.heading = extractFloatValue(json, "heading");
    
    float x = extractFloatValue(json, "x");
    float y = extractFloatValue(json, "y");
    
    if (x != 0.0f || y != 0.0f) {
        state.x = x;
        state.y = y;
    } else {
        state.x = extractFloatValue(json, "position.x");
        state.y = extractFloatValue(json, "position.y");
    }
    return state;
}

void processCommand(const std::string& inputJson) {
    if (inputJson.find("\"type\":\"start\"") != std::string::npos || inputJson.find("START") != std::string::npos) {
        gMissionState.engaged = true;
        gMissionState.missionComplete = false;
        gMissionState.waypointIndex = 0;
        std::cout << "STATUS:ENGAGED" << std::endl;
        return;
    }
    if (inputJson.find("UPDATE") != std::string::npos || inputJson.find("update") != std::string::npos) {
        gMissionState.missionComplete = true;
        gMissionState.engaged = false;
        gMissionState.waypointIndex = 0;
        std::cout << "STATUS:DISENGAGED" << std::endl;
        return;
    }
}

void processAutopilot(const std::string& inputJson) {
    processCommand(inputJson);
    
    if (!gMissionState.engaged || gMissionState.missionComplete) {
        if (gMissionState.missionComplete) std::cout << "STATUS:MISSION COMPLETE" << std::endl;
        else std::cout << "STATUS:DISENGAGED" << std::endl;
        
        std::cout << "PERCENTAGE:0%" << std::endl;
        return;
    }

    AircraftState acft = parseAircraftState(inputJson);
    std::vector<Waypoint> waypoints = parseWaypoints(inputJson);
    
    if (waypoints.empty()) {
        std::cout << "PERCENTAGE:0%" << std::endl;
        return;
    }

    const Waypoint& currentTarget = waypoints[gMissionState.waypointIndex];
    
    float distX = std::abs(acft.x - currentTarget.x);
    float distY = std::abs(acft.y - currentTarget.y);
    
    std::cerr << "[C++ HITBOX] WP " << gMissionState.waypointIndex 
              << " | Dist API X: " << distX << " | Dist API Y: " << distY << std::endl;

    if (isWithinHitbox(acft, currentTarget)) {
        std::cerr << "[C++ HITBOX] *** WAYPOINT " << gMissionState.waypointIndex << " REACHED! ***" << std::endl;
        gMissionState.waypointIndex++;
        
        if (gMissionState.waypointIndex >= waypoints.size()) {
            gMissionState.missionComplete = true;
            gMissionState.engaged = false;
            std::cout << "STATUS:MISSION COMPLETE" << std::endl;
            std::cout << "PERCENTAGE:0%" << std::endl;
            return;
        }
    }
    
    const Waypoint& activeTarget = waypoints[gMissionState.waypointIndex];
    float targetBearing = calculateBearing(acft.x, acft.y, activeTarget.x, activeTarget.y);
    float actualYokePercent = calculateYokePercent(acft.heading, targetBearing);
    
    std::cerr << "[C++ MATH] Target WP: " << gMissionState.waypointIndex 
              << " | API T-Bearing: " << targetBearing 
              << " | ACFT Heading: " << acft.heading 
              << " | Yoke Cmd: " << actualYokePercent << "%" << std::endl;
    
    std::cout << "PERCENTAGE:" << actualYokePercent << "%" << std::endl;
}

int main() {
    std::string line;
    std::cerr << "[C++ DEBUG] Autopilot executable started successfully." << std::endl;

    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        processAutopilot(line);
    }
    
    std::cerr << "[C++ DEBUG] Input stream closed, exiting." << std::endl;
    return 0;
}