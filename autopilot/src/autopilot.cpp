#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>
#include <curl/curl.h>

static size_t write_cb(void* contents, size_t size, size_t nmemb, void* userp) {
    std::string* s = (std::string*)userp;
    size_t total = size * nmemb;
    s->append((char*)contents, total);
    return total;
}

int main(int argc, char** argv) {
    std::string base = "http://localhost:24000";
    std::string outpath = "predictions.json";
    std::string discordUser;
    if (argc >= 2) base = argv[1];
    if (argc >= 3) outpath = argv[2];
    if (argc >= 4) discordUser = argv[3];

    // prepare prediction URL
    std::string url = base + "/flightnet/predict?seconds=5&step=0.5";

    CURL* curl = curl_easy_init();
    if (!curl) {
        std::cerr << "Failed to init curl\n";
        return 2;
    }

    std::string resp;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 5L);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_cb);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);

    CURLcode rc = curl_easy_perform(curl);
    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
    curl_easy_cleanup(curl);

    if (rc != CURLE_OK) {
        std::cerr << "curl error: " << curl_easy_strerror(rc) << "\n";
        return 3;
    }
    if (http_code < 200 || http_code >= 300) {
        std::cerr << "HTTP error: " << http_code << "\n";
        return 4;
    }

    // If no discord user specified, save full predictions
    if (discordUser.empty()) {
        std::ofstream ofs(outpath, std::ios::binary);
        if (!ofs) {
            std::cerr << "Failed to open output file: " << outpath << "\n";
            return 5;
        }
        ofs << resp;
        ofs.close();
        std::cout << "Saved predictions to " << outpath << "\n";
        return 0;
    }

    // If discord user provided, attempt to find their aircraft callsign by fetching acft-data
    std::string acftUrl = base + "/flightnet/acft-data";
    std::string acftResp;
    CURL* curl2 = curl_easy_init();
    if (!curl2) {
        std::cerr << "Failed to init curl2\n";
        return 6;
    }
    curl_easy_setopt(curl2, CURLOPT_URL, acftUrl.c_str());
    curl_easy_setopt(curl2, CURLOPT_TIMEOUT, 5L);
    curl_easy_setopt(curl2, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl2, CURLOPT_WRITEFUNCTION, write_cb);
    curl_easy_setopt(curl2, CURLOPT_WRITEDATA, &acftResp);
    CURLcode rc2 = curl_easy_perform(curl2);
    long http_code2 = 0;
    curl_easy_getinfo(curl2, CURLINFO_RESPONSE_CODE, &http_code2);
    curl_easy_cleanup(curl2);
    if (rc2 != CURLE_OK || http_code2 < 200 || http_code2 >= 300) {
        std::cerr << "Failed to fetch acft-data (" << curl_easy_strerror(rc2) << ") http:" << http_code2 << "\n";
        return 7;
    }

    // Try to find a top-level key whose object contains playerName/pilot/pilotName/discord matching discordUser
    auto findMatch = [&](const std::string& keyField)->std::string {
        std::string needle = "\"" + keyField + "\"";
        size_t pos = 0;
        while (true) {
            pos = acftResp.find(needle, pos);
            if (pos == std::string::npos) break;
            // look ahead for : "<discordUser>"
            size_t colon = acftResp.find(':', pos);
            if (colon == std::string::npos) break;
            size_t quote = acftResp.find('"', colon+1);
            if (quote == std::string::npos) break;
            // read string value
            size_t quote2 = acftResp.find('"', quote+1);
            if (quote2 == std::string::npos) break;
            std::string value = acftResp.substr(quote+1, quote2-quote-1);
            if (value == discordUser) {
                // find the callsign key before this object: search backwards for "<callsign>"\s*:
                // find the '{' that starts this object
                size_t objStart = acftResp.rfind('{', pos);
                if (objStart == std::string::npos) objStart = pos;
                // find the key string just before objStart
                size_t keyColon = acftResp.rfind(':', objStart);
                if (keyColon == std::string::npos) keyColon = objStart;
                size_t keyEnd = acftResp.rfind('"', keyColon);
                if (keyEnd == std::string::npos) return std::string();
                size_t keyStart = acftResp.rfind('"', keyEnd-1);
                if (keyStart == std::string::npos) return std::string();
                std::string callsign = acftResp.substr(keyStart+1, keyEnd-keyStart-1);
                return callsign;
            }
            pos = quote2+1;
        }
        return std::string();
    };

    std::string callsign;
    const char* fields[] = {"playerName", "pilot", "pilotName", "discord"};
    for (auto f: fields) {
        callsign = findMatch(f);
        if (!callsign.empty()) break;
    }
    if (callsign.empty()) {
        // fallback: try to find callsign by seeing if discordUser appears anywhere within an aircraft object
        size_t pos = acftResp.find(discordUser);
        if (pos != std::string::npos) {
            size_t keyColon = acftResp.rfind(':', pos);
            if (keyColon != std::string::npos) {
                size_t keyEnd = acftResp.rfind('"', keyColon);
                size_t keyStart = acftResp.rfind('"', keyEnd-1);
                if (keyStart != std::string::npos && keyEnd != std::string::npos) {
                    callsign = acftResp.substr(keyStart+1, keyEnd-keyStart-1);
                }
            }
        }
    }

    if (callsign.empty()) {
        std::cerr << "Could not determine callsign for user: " << discordUser << "\n";
        return 8;
    }
    std::cout << "Identified callsign: " << callsign << " for user " << discordUser << "\n";

    // extract only the callsign entry from the previously fetched predictions (resp)
    // the predictions JSON contains a top-level "predictions" object with callsign keys
    std::string key = "\"" + callsign + "\"";
    size_t kpos = resp.find(key);
    if (kpos == std::string::npos) {
        std::cerr << "Predictions do not contain callsign: " << callsign << "\n";
        // save full resp as fallback
        std::ofstream ofs(outpath, std::ios::binary);
        if (!ofs) return 9;
        ofs << resp;
        ofs.close();
        return 0;
    }

    // find the object starting brace for this callsign
    size_t brace = resp.find('{', kpos);
    if (brace == std::string::npos) {
        std::cerr << "Malformed predictions JSON\n";
        return 10;
    }
    // find matching closing brace
    int depth = 0;
    size_t i = brace;
    for (; i < resp.size(); ++i) {
        if (resp[i] == '{') depth++;
        else if (resp[i] == '}') {
            depth--;
            if (depth == 0) break;
        }
    }
    if (i >= resp.size()) {
        std::cerr << "Could not find end of callsign object\n";
        return 11;
    }
    std::string callsignObj = resp.substr(brace, i - brace + 1);

    // wrap into a small container with metadata
    std::string outJson = "{\"callsign\":\"" + callsign + "\",\"data\": " + callsignObj + "}\n";
    std::ofstream ofs(outpath, std::ios::binary);
    if (!ofs) {
        std::cerr << "Failed to open output file: " << outpath << "\n";
        return 12;
    }
    ofs << outJson;
    ofs.close();
    std::cout << "Saved filtered predictions for " << callsign << " to " << outpath << "\n";
    return 0;
}
