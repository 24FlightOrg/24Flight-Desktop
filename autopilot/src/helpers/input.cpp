#include "include/helpers/input.hpp"

static bool isWhitespace(char ch) {
    return ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n';
}

std::string unescapeQuotedString(const std::string& input) {
    std::string output;
    output.reserve(input.size());

    for (size_t i = 0; i < input.size(); ++i) {
        char ch = input[i];
        if (ch == '\\' && i + 1 < input.size()) {
            ++i;
            switch (input[i]) {
                case 'n': output += '\n'; break;
                case 'r': output += '\r'; break;
                case 't': output += '\t'; break;
                case '\\': output += '\\'; break;
                case '"': output += '"'; break;
                default: output += input[i]; break;
            }
        } else {
            output += ch;
        }
    }

    return output;
}

bool parseTocppLine(const std::string& line, std::string& type, std::string& data) {
    const std::string prefix = "tocpp: ";
    if (line.rfind(prefix, 0) != 0) {
        return false;
    }

    size_t pos = prefix.size();
    const auto readLiteral = [&](const std::string& literal) -> bool {
        if (line.compare(pos, literal.size(), literal) == 0) {
            pos += literal.size();
            return true;
        }
        return false;
    };

    const auto skipWhitespace = [&]() {
        while (pos < line.size() && isWhitespace(line[pos])) {
            ++pos;
        }
    };

    const auto readQuotedString = [&]() -> std::string {
        if (pos >= line.size() || line[pos] != '"') {
            return std::string();
        }
        ++pos;
        std::string value;
        while (pos < line.size()) {
            char ch = line[pos++];
            if (ch == '\\' && pos < line.size()) {
                char esc = line[pos++];
                switch (esc) {
                    case 'n': value += '\n'; break;
                    case 'r': value += '\r'; break;
                    case 't': value += '\t'; break;
                    case '\\': value += '\\'; break;
                    case '"': value += '"'; break;
                    default: value += esc; break;
                }
            } else if (ch == '"') {
                return value;
            } else {
                value += ch;
            }
        }
        return std::string();
    };

    skipWhitespace();
    if (!readLiteral("type:")) {
        return false;
    }
    skipWhitespace();
    type = readQuotedString();
    if (type.empty()) {
        return false;
    }
    skipWhitespace();
    if (!readLiteral(":")) {
        return false;
    }
    skipWhitespace();
    if (!readLiteral("data:")) {
        return false;
    }
    skipWhitespace();
    data = readQuotedString();
    return !data.empty();
}
