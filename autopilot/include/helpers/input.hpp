#ifndef AUTOPILOT_HELPERS_INPUT_HPP
#define AUTOPILOT_HELPERS_INPUT_HPP

#include <string>

bool parseTocppLine(const std::string& line, std::string& type, std::string& data);
std::string unescapeQuotedString(const std::string& input);

#endif // AUTOPILOT_HELPERS_INPUT_HPP
