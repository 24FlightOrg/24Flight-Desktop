#include "helpers/console.hpp"
#include <iostream>

static std::string escapeQuotedString(const std::string& input) {
    std::string escaped;
    escaped.reserve(input.size());

    for (char ch : input) {
        switch (ch) {
            case '"': escaped += "\\\""; break;
            case '\\': escaped += "\\\\"; break;
            case '\n': escaped += "\\n"; break;
            case '\r': escaped += "\\r"; break;
            case '\t': escaped += "\\t"; break;
            default: escaped += ch; break;
        }
    }

    return escaped;
}

int print(const std::string& msg) {
    std::cout << msg << std::endl;
    return true;
}

int error(const std::string& msg) {
    std::cerr << msg << std::endl;
    return true;
}

int warn(const std::string& msg) {
    std::cerr << msg << std::endl;
    return true;
}

int stdoutMessage(const std::string& type, const std::string& msg) {
    std::cout << "tondjs: type:\"" << escapeQuotedString(type) << "\": data:\"" << escapeQuotedString(msg) << "\"" << std::endl;
    return true;
}
