// autopilot/include/autopilot.h
#pragma once
#include <vector>
#include <string>
#include <cmath>

struct Waypoint {
    float x;
    float y;
};

struct AircraftState {
    float x, y, heading, altitude;
    std::string callsign;
};

struct MissionState {
    std::vector<Waypoint> waypoints;
    int activeWaypointIndex = 0;
    bool missionComplete = false;
    bool engaged = false;
};

// Core logic function (C++)
typedef struct {
    float percentage; // Yoke output (-100% to 100%)
} YokeOutput;

// Calculate yoke adjustment needed to reach next waypoint
YokeOutput calculateYokeCorrection(const Waypoint& current, const Waypoint& target, float heading);

// Check if aircraft is within hitbox of target waypoint (100x100)
bool isWithinHitbox(float x, float y, const Waypoint& target);

// Advance mission state if hitbox reached
void advanceMission(MissionState& missionState, const AircraftState& acftState);

// Format and return status for UI updates
std::string getAutopilotStatus(const MissionState& missionState);
