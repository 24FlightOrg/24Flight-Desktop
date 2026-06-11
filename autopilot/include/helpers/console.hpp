#ifndef AUTOPILOT_HELPERS_CONSOLE_HPP
#define AUTOPILOT_HELPERS_CONSOLE_HPP

#include <string>

int print(const std::string& msg);
int error(const std::string& msg);
int warn(const std::string& msg);
int stdoutMessage(const std::string& type, const std::string& msg);

#endif // AUTOPILOT_HELPERS_CONSOLE_HPP
