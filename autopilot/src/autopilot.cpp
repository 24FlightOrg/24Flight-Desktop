// autopilot.cpp
// Core C++ logic for flight control (stub)
#include "../include/autopilot.h"

int main() {
    // Example: output telemetry to stdout
    while (true) {
        // Replace with real logic
        printf("{\"altitude\":1000,\"heading\":90}\n");
        fflush(stdout);
        // Simulate 10Hz
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    return 0;
}
