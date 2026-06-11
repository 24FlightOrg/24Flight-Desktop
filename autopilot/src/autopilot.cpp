#include "helpers/console.hpp"
#include "helpers/input.hpp"
#include <atomic>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <chrono>

static std::queue<std::string> stdinQueue;
static std::mutex stdinMutex;
static std::condition_variable stdinCv;
static std::atomic<bool> stdinOpen{true};

static void stdinReader() {
    std::string line;
    while (std::getline(std::cin, line)) {
        {
            std::lock_guard<std::mutex> lock(stdinMutex);
            stdinQueue.push(line);
        }
        stdinCv.notify_one();
    }
    stdinOpen = false;
    stdinCv.notify_one();
}

static bool tryPopStdinLine(std::string& line) {
    std::lock_guard<std::mutex> lock(stdinMutex);
    if (stdinQueue.empty()) {
        return false;
    }
    line = std::move(stdinQueue.front());
    stdinQueue.pop();
    return true;
}

static void handleTocppMessage(const std::string& type, const std::string& data) {
    print("Received tocpp type: " + type + " data: " + data);
    // TODO: implement actual command handling here
}

// main autopilot loop

int loop() {
    print("Autopilot | Loop");
    return true;
}

// start

int main() {
    print("Autopilot | Starting...");

    std::thread reader(stdinReader);
    reader.detach();

    while (true) {
        std::string line;
        {
            std::unique_lock<std::mutex> lock(stdinMutex);
            if (stdinQueue.empty() && stdinOpen) {
                stdinCv.wait_for(lock, std::chrono::milliseconds(10));
            }
        }

        if (tryPopStdinLine(line)) {
            std::string type;
            std::string data;
            if (parseTocppLine(line, type, data)) {
                handleTocppMessage(type, data);
            } else {
                warn("Unrecognized stdin line: " + line);
            }
        }

        loop();
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }

    return true;
}

// start ap