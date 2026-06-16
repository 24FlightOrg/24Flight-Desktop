// Predictor: Implements derivative calculations and iterative prediction in C++
// Outputs a small JSON example to stdout. No external JSON dependency required.

#include <iostream>
#include <vector>
#include <cmath>
#include <ctime>
#include <string>
#include <sstream>
#include <iomanip>
#include <unordered_map>
#include <thread>
#include <chrono>
#include <algorithm>
#include <cstdlib>
#include <cctype>
#include <cstdio>
#include <csignal>
#include <atomic>
#include <functional>

// running flag used by signal handlers
static std::atomic<bool> g_running(true);

// (forward declarations removed; types are defined below)

struct Sample {
    double ts; // seconds
    double x, y; // position (studs)
    double altitude; // ft
    double heading; // degrees
    double speed; // knots
    double groundSpeed; // studs/sec or provided ground speed
    bool hasPos;
    bool hasAlt;
    bool hasGroundSpeed;
    std::string aircraftType;
    std::string wind;
};

struct Deriv {
    double vx, vy; // studs/sec
    double altRate; // ft/sec
    double speedRate; // knots/sec
    double headingRate; // deg/sec
    double dt;
};

struct SecDeriv {
    double ax, ay; // studs/sec^2
    double altAcc; // ft/sec^2
    double speedAcc; // knots/sec^2
    double headingAcc; // deg/sec^2 (may be NAN)
    SecDeriv() : ax(NAN), ay(NAN), altAcc(NAN), speedAcc(NAN), headingAcc(NAN) {}
};

// Fit quadratic y(t)=a t^2 + b t + c to (t,y) samples (t in seconds) using least-squares
// Returns 2*a (second derivative) or NAN if not enough data / ill-conditioned
static double secondDerivativeQuadLS_from_samples(const std::vector<std::pair<double,double>> &pts) {
    size_t n = pts.size();
    if (n < 3) return NAN;
    // shift times to mean to improve conditioning
    double tmean = 0.0;
    for (auto &p: pts) tmean += p.first;
    tmean /= (double)n;
    double S0=0, S1=0, S2=0, S3=0, S4=0;
    double T0=0, T1=0, T2=0;
    for (auto &p: pts) {
        double t = p.first - tmean;
        double y = p.second;
        double t2 = t*t, t3 = t2*t, t4 = t3*t;
        S0 += 1.0;
        S1 += t;
        S2 += t2;
        S3 += t3;
        S4 += t4;
        T0 += y;
        T1 += t*y;
        T2 += t2*y;
    }
    // normal matrix M * [a b c]^T = R
    double M00 = S4, M01 = S3, M02 = S2;
    double M10 = S3, M11 = S2, M12 = S1;
    double M20 = S2, M21 = S1, M22 = S0;
    double R0 = T2, R1 = T1, R2 = T0;
    // solve 3x3 via Gaussian elimination
    double A[3][4] = {{M00,M01,M02,R0},{M10,M11,M12,R1},{M20,M21,M22,R2}};
    const int N=3;
    for (int i=0;i<N;i++) {
        // pivot
        int piv=i;
        for (int r=i+1;r<N;r++) if (std::abs(A[r][i])>std::abs(A[piv][i])) piv=r;
        if (std::abs(A[piv][i]) < 1e-18) return NAN;
        if (piv!=i) for (int c=i;c<4;c++) std::swap(A[i][c], A[piv][c]);
        double d = A[i][i];
        for (int c=i;c<4;c++) A[i][c] /= d;
        for (int r=0;r<N;r++) if (r!=i) {
            double f = A[r][i];
            for (int c=i;c<4;c++) A[r][c] -= f * A[i][c];
        }
    }
    double a = A[0][3];
    return 2.0 * a;
}

// Helper: extract time/value pairs for a numeric field from samples
// Collect (time, value) pairs for a numeric field from `samples`.
// `getter` is any callable that receives a `Sample` and returns the numeric
// value for that sample or NAN if the field is not present. We optionally
// limit the returned vector to the most recent `maxPoints` entries to bound
// computation and reduce sensitivity to old data.
template<typename F>
static std::vector<std::pair<double,double>> collectField(const std::vector<Sample> &samples, F getter, size_t maxPoints=0) {
    std::vector<std::pair<double,double>> out;
    for (size_t i=0;i<samples.size();++i) {
        double t = samples[i].ts;
        double v = getter(samples[i]);
        if (!std::isnan(v)) out.emplace_back(t, v);
    }
    if (maxPoints && out.size() > maxPoints) {
        // keep most recent maxPoints
        std::vector<std::pair<double,double>> tail(out.end()-maxPoints, out.end());
        return tail;
    }
    return out;
}

// Compute second derivatives (accelerations) for available fields in `samples`.
//
// Strategy:
// - For each numeric field (x, y, altitude, speed) collect up to `maxPts`
//   most recent valid samples and run a quadratic least-squares fit to
//   estimate the second derivative. This smooths measurement noise while
//   remaining responsive for small windows (default maxPts=8).
// - Heading requires special handling due to circular wrap at 360 degrees;
//   we unwrap successive heading measurements to build a monotonic sequence
//   before fitting.
// - If insufficient valid samples exist for a field the corresponding
//   acceleration remains NAN.
static SecDeriv computeSecondDerivatives(const std::vector<Sample> &samples) {
    SecDeriv s;
    if (samples.size() < 3) return s;
    const size_t maxPts = std::min<size_t>(samples.size(), 8);
    // x
    auto ptsx = collectField(samples, [](const Sample &sm){ return sm.hasPos ? sm.x : NAN; }, maxPts);
    auto ptsy = collectField(samples, [](const Sample &sm){ return sm.hasPos ? sm.y : NAN; }, maxPts);
    auto ptsAlt = collectField(samples, [](const Sample &sm){ return sm.hasAlt ? sm.altitude : NAN; }, maxPts);
    auto ptsSpd = collectField(samples, [](const Sample &sm){ return std::isnan(sm.speed) ? NAN : sm.speed; }, maxPts);
    if (ptsx.size() >= 3) s.ax = secondDerivativeQuadLS_from_samples(ptsx);
    if (ptsy.size() >= 3) s.ay = secondDerivativeQuadLS_from_samples(ptsy);
    if (ptsAlt.size() >= 3) s.altAcc = secondDerivativeQuadLS_from_samples(ptsAlt);
    if (ptsSpd.size() >= 3) s.speedAcc = secondDerivativeQuadLS_from_samples(ptsSpd);
    // heading acceleration is noisy due to wrapping; compute from unwrapped heading where possible
    std::vector<std::pair<double,double>> ptsHead;
    double lastH = NAN;
    for (auto &sm : samples) {
        double h = sm.heading;
        if (std::isnan(h)) continue;
        if (std::isnan(lastH)) { lastH = h; ptsHead.emplace_back(sm.ts, h); continue; }
        double diff = std::fmod((h - lastH + 540.0), 360.0) - 180.0;
        double unwrapped = ptsHead.empty() ? h : ptsHead.back().second + diff;
        ptsHead.emplace_back(sm.ts, unwrapped);
        lastH = h;
    }
    if (ptsHead.size() >= 3) s.headingAcc = secondDerivativeQuadLS_from_samples(ptsHead);
    return s;
}

double knotsToStudsPerSec(double knots) {
    return (knots) * 1.687809857 / 1.8372;
}

static constexpr double PI_VAL = 3.14159265358979323846;

void headingToUnitVec(double headingDeg, double &dx, double &dy) {
    double rad = headingDeg * PI_VAL / 180.0;
    dx = sin(rad);
    dy = -cos(rad);
}

double normalizeHeading(double h) {
    double n = std::fmod(h, 360.0);
    if (n < 0) n += 360.0;
    return n;
}

// Compute smoothed derivative between earliest sample within windowSec and latest
bool computeSmoothedDerivatives(const std::vector<Sample>& samples, double windowSec, Deriv &out, std::string &method) {
    // returns true if a derivative estimate is available
    method = "none";
    out.vx = out.vy = out.altRate = out.speedRate = out.headingRate = 0.0;
    out.dt = 0.0;
    if (samples.size() < 2) return false;
    const Sample &b = samples.back();
    // find earliest sample within window (prefer a small window for smoothing)
    size_t idx = samples.size() - 1;
    for (size_t i = samples.size(); i-- > 0;) {
        double lag = b.ts - samples[i].ts;
        if (lag <= windowSec) idx = i; else break;
    }
    const Sample &a = samples[idx];
    double dt = b.ts - a.ts;
    // if dt is too small or zero, try a two-sample fallback using last two samples
    if (dt <= 1e-6) {
        if (samples.size() >= 2) {
            const Sample &a2 = samples[samples.size()-2];
            double dt2 = b.ts - a2.ts;
            if (dt2 > 1e-6) {
                // fallback using last two samples
                out.dt = dt2;
                method = "two_sample";
                if (a2.hasPos && b.hasPos) {
                    out.vx = (b.x - a2.x) / dt2;
                    out.vy = (b.y - a2.y) / dt2;
                }
                if (a2.hasAlt && b.hasAlt) out.altRate = (b.altitude - a2.altitude) / dt2;
                out.speedRate = (b.speed - a2.speed) / dt2;
                double diff = std::fmod((b.heading - a2.heading + 540.0), 360.0) - 180.0;
                out.headingRate = diff / dt2;
                return true;
            }
        }
        return false;
    }
    // normal windowed estimate
    out.dt = dt;
    method = "window";
    if (a.hasPos && b.hasPos) {
        out.vx = (b.x - a.x) / dt;
        out.vy = (b.y - a.y) / dt;
    }
    if (a.hasAlt && b.hasAlt) out.altRate = (b.altitude - a.altitude) / dt;
    out.speedRate = (b.speed - a.speed) / dt;
    double diff = std::fmod((b.heading - a.heading + 540.0), 360.0) - 180.0;
    out.headingRate = diff / dt;
    return true;
}

std::vector<Sample> iterativePredict(const Sample &latest, const Deriv* deriv, double horizonSec, double stepSec) {
    std::vector<Sample> out;
    if (stepSec <= 0) stepSec = 0.5;
    double maxStep = std::max(0.01, stepSec);
    int steps = std::max(1, (int)std::ceil(horizonSec / maxStep));

    Sample curr = latest;

    for (int i = 1; i <= steps; ++i) {
        double dt = std::min(maxStep, horizonSec - (i - 1) * maxStep);
        if (deriv) {
            if (!std::isnan(deriv->speedRate)) curr.speed = curr.speed + deriv->speedRate * dt;
            if (!std::isnan(deriv->altRate) && curr.hasAlt) curr.altitude = curr.altitude + deriv->altRate * dt;
            if (!std::isnan(deriv->headingRate)) curr.heading = normalizeHeading(curr.heading + deriv->headingRate * dt);
        }
        if (curr.hasPos) {
            if (deriv && !std::isnan(deriv->vx) && !std::isnan(deriv->vy)) {
                curr.x = curr.x + deriv->vx * dt;
                curr.y = curr.y + deriv->vy * dt;
            } else {
                double studsPerSec = NAN;
                if (curr.hasGroundSpeed) {
                    studsPerSec = curr.groundSpeed; // assume already studs/sec
                } else {
                    studsPerSec = knotsToStudsPerSec(curr.speed);
                }
                double dx, dy; headingToUnitVec(curr.heading, dx, dy);
                curr.x = curr.x + dx * studsPerSec * dt;
                curr.y = curr.y + dy * studsPerSec * dt;
            }
        }
        curr.ts = latest.ts + i * maxStep;
        out.push_back(curr);
    }
    return out;
}

// Tiny JSON helper
std::string jsonEscape(const std::string &s) {
    std::string out; out.reserve(s.size());
    for (char c: s) {
        if (c == '"') out += "\\\"";
        else if (c == '\\') out += "\\\\";
        else if (c == '\b') out += "\\b";
        else if (c == '\f') out += "\\f";
        else if (c == '\n') out += "\\n";
        else if (c == '\r') out += "\\r";
        else if (c == '\t') out += "\\t";
        else out += c;
    }
    return out;
}

// Configuration: polling and prediction timing (ms)
static int POLL_INTERVAL_MS = 200; // how often to poll FlightNet for acft-data (ms)
static int PRED_STEP_MS = 200;     // prediction step resolution (ms) (was 100)
static int PRED_HORIZON_MS = 1000; // horizon to predict ahead (ms)
static int PUSH_MS = 1000;        // how often to push aggregated predictions (ms)
static int HISTORY_MAX = 8;        // samples to keep per ac

// Simple cross-platform popen wrapper to run `curl -s URL`
static std::string runCurl(const std::string &url) {
#ifdef _WIN32
    std::string cmd = "curl -s " + url;
    FILE* pipe = _popen(cmd.c_str(), "r");
#else
    std::string cmd = "curl -s " + url;
    FILE* pipe = popen(cmd.c_str(), "r");
#endif
    if (!pipe) return std::string();
    std::string result;
    char buf[4096];
    while (fgets(buf, sizeof(buf), pipe)) result += buf;
#ifdef _WIN32
    _pclose(pipe);
#else
    pclose(pipe);
#endif
    return result;
}

// Find top-level objects in JSON string: returns vector of (key, objectText)
static std::vector<std::pair<std::string,std::string>> extractTopLevelObjects(const std::string &s) {
    std::vector<std::pair<std::string,std::string>> out;
    size_t i = 0;
    // find first '{'
    i = s.find('{');
    if (i == std::string::npos) return out;
    ++i;
    while (g_running.load()) {
        // skip whitespace and commas
        while (i < s.size() && (isspace((unsigned char)s[i]) || s[i] == ',')) ++i;
        if (i >= s.size() || s[i] == '}') break;
        if (s[i] != '"') break;
        size_t keyStart = i+1;
        size_t keyEnd = s.find('"', keyStart);
        if (keyEnd == std::string::npos) break;
        std::string key = s.substr(keyStart, keyEnd - keyStart);
        size_t colon = s.find(':', keyEnd);
        if (colon == std::string::npos) break;
        size_t valStart = s.find_first_not_of(" \t\r\n", colon+1);
        if (valStart == std::string::npos) break;
        if (s[valStart] == '{') {
            // find matching brace
            int depth = 0;
            size_t j = valStart;
            for (; j < s.size(); ++j) {
                if (s[j] == '{') depth++;
                else if (s[j] == '}') { depth--; if (depth == 0) break; }
            }
            if (j >= s.size()) break;
            std::string obj = s.substr(valStart, j - valStart + 1);
            out.emplace_back(key, obj);
            i = j + 1;
            continue;
        } else {
            // non-object value; skip
            size_t comma = s.find(',', valStart);
            if (comma == std::string::npos) break;
            i = comma+1;
            continue;
        }
    }
    return out;
}

// Helper to find first number token in text after key
static bool extractNumber(const std::string &text, const std::string &key, double &out) {
    size_t pos = text.find('"' + key + '"');
    if (pos == std::string::npos) pos = text.find(key);
    if (pos == std::string::npos) return false;
    size_t colon = text.find(':', pos);
    if (colon == std::string::npos) return false;
    size_t i = colon + 1;
    // find start of number
    while (i < text.size() && (isspace((unsigned char)text[i]) || text[i] == '"' || text[i] == '\'')) ++i;
    // allow number with sign and decimal and exponent
    size_t start = i;
    bool seen = false;
    while (i < text.size() && ( (text[i] >= '0' && text[i] <= '9') || text[i] == '.' || text[i]=='-' || text[i]=='+' || text[i]=='e' || text[i]=='E')) { seen = true; ++i; }
    if (!seen) return false;
    try { out = std::stod(text.substr(start, i - start)); return true; } catch (...) { return false; }
}

static bool extractPosition(const std::string &text, double &x, double &y) {
    size_t pos = text.find("\"position\"");
    if (pos == std::string::npos) pos = text.find("position");
    if (pos == std::string::npos) return false;
    size_t brace = text.find('{', pos);
    if (brace == std::string::npos) return false;
    size_t end = text.find('}', brace);
    if (end == std::string::npos) return false;
    std::string sub = text.substr(brace, end - brace + 1);
    double vx, vy;
    if (extractNumber(sub, "x", vx) && extractNumber(sub, "y", vy)) { x = vx; y = vy; return true; }
    return false;
}

static bool extractBool(const std::string &text, const std::string &key, bool &out) {
    size_t pos = text.find('"' + key + '"');
    if (pos == std::string::npos) pos = text.find(key);
    if (pos == std::string::npos) return false;
    size_t colon = text.find(':', pos);
    if (colon == std::string::npos) return false;
    size_t i = text.find_first_not_of(" \t\r\n", colon+1);
    if (i == std::string::npos) return false;
    if (text.compare(i, 4, "true") == 0) { out = true; return true; }
    if (text.compare(i, 5, "false") == 0) { out = false; return true; }
    return false;
}

// forward declaration for string extractor (defined later)
static bool extractString(const std::string &text, const std::string &key, std::string &out);

// forward declarations: FilterState used by main and SG derivative func defined later
struct FilterState;
static SecDeriv computeSecondDerivativesEMA(const std::vector<Sample> &samples, FilterState &fs);

int main(int argc, char** argv) {
    std::string base = "http://localhost:10000";
    if (argc >= 2) base = argv[1];
    const std::string acftUrl = base + "/api/acft-data";

    std::unordered_map<std::string, std::vector<Sample>> ACFT_HISTORY;
    // store predicted sample at horizon (e.g., +1s) for comparison when real data arrives
    std::unordered_map<std::string, Sample> PRED_AT_HORIZON;
    // store latest per-callsign predictions (vector of samples at sub-steps)
    std::unordered_map<std::string, std::vector<Sample>> PENDING_PREDS;
    // per-callsign EMA filter states (non-quadratic smoothing for derivatives)
    std::unordered_map<std::string, FilterState> FILTER_STATES;

    // comparison tolerances
    const double POS_TOL = 5.0;      // studs
    const double SPEED_TOL = 2.0;    // knots
    const double HEADING_TOL = 5.0;  // degrees
    const double ALT_TOL = 50.0;     // ft

    // stats counters
    std::atomic<int> total_comparisons{0};
    std::atomic<int> pos_error_count{0};
    std::atomic<int> speed_error_count{0};
    std::atomic<int> heading_error_count{0};
    std::atomic<int> alt_error_count{0};
    std::atomic<int> pos_comparisons{0};
    std::atomic<int> alt_comparisons{0};
    double sum_pos_err = 0.0;
    double sum_speed_err = 0.0;
    double sum_heading_err = 0.0;
    double sum_alt_err = 0.0;
    double sum_dx_abs = 0.0;
    double sum_dy_abs = 0.0;
    // worst (maximum) error trackers
    double worst_pos_err = -1.0;
    std::string worst_pos_callsign;
    Sample worst_pos_sample{};
    bool has_worst_pos_sample = false;
    double worst_speed_err = -1.0;
    double worst_heading_err = -1.0;
    double worst_alt_err = -1.0;

    struct CallStats {
        int total = 0;
        int pos_err = 0;
        int speed_err = 0;
        int heading_err = 0;
        int alt_err = 0;
        double sum_pos = 0.0;
        double sum_speed = 0.0;
        double sum_heading = 0.0;
        double sum_alt = 0.0;
        double sum_pos_x = 0.0;
        double sum_pos_y = 0.0;
    };
    std::unordered_map<std::string, CallStats> CALLSIGN_STATS;

    std::function<void(int)> print_stats = [&](int signum) {
        int total = total_comparisons.load();
        if (total == 0) {
            std::ostringstream s0; s0 << "{\"summary\": {\"total\": 0}}\n";
            std::cerr << s0.str() << std::flush;
            return;
        }
        int pos_comp = pos_comparisons.load();
        int alt_comp = alt_comparisons.load();
        double pos_pct = pos_comp ? 100.0 * (double)pos_error_count.load() / pos_comp : 0.0;
        double speed_pct = 100.0 * (double)speed_error_count.load() / total;
        double heading_pct = 100.0 * (double)heading_error_count.load() / total;
        double alt_pct = alt_comp ? 100.0 * (double)alt_error_count.load() / alt_comp : 0.0;
        double avg_pos = pos_comp ? sum_pos_err / pos_comp : 0.0;
        double avg_dx = pos_comp ? sum_dx_abs / pos_comp : 0.0;
        double avg_dy = pos_comp ? sum_dy_abs / pos_comp : 0.0;
        double avg_speed = total ? sum_speed_err / total : 0.0;
        double avg_heading = total ? sum_heading_err / total : 0.0;
        double avg_alt = alt_comp ? sum_alt_err / alt_comp : 0.0;

        std::ostringstream s;
        s << std::fixed << std::setprecision(3);
        s << "{\"summary\": {";
        s << "\"total\": " << total << ", ";
        s << "\"pos_error_pct\": " << pos_pct << ", \"avg_pos_err\": " << avg_pos << ", \"avg_pos_dx\": " << avg_dx << ", \"avg_pos_dy\": " << avg_dy << ", ";
        s << "\"speed_error_pct\": " << speed_pct << ", \"avg_speed_err\": " << avg_speed << ", ";
        s << "\"heading_error_pct\": " << heading_pct << ", \"avg_heading_err\": " << avg_heading << ", ";
        s << "\"alt_error_pct\": " << alt_pct << ", \"avg_alt_err\": " << avg_alt;
        s << ", \"by_callsign\": {";
        bool first = true;
        for (auto &it : CALLSIGN_STATS) {
            if (!first) s << ", "; first = false;
            const auto &k = it.first;
            const auto &cs = it.second;
            double ppospct = cs.total ? 100.0 * (double)cs.pos_err / cs.total : 0.0;
            double pspeedpct = cs.total ? 100.0 * (double)cs.speed_err / cs.total : 0.0;
            double pheadpct = cs.total ? 100.0 * (double)cs.heading_err / cs.total : 0.0;
            double paltpct = cs.total ? 100.0 * (double)cs.alt_err / cs.total : 0.0;
            double avgpos = cs.total ? cs.sum_pos / cs.total : 0.0;
            double avgposx = cs.total ? cs.sum_pos_x / cs.total : 0.0;
            double avgposy = cs.total ? cs.sum_pos_y / cs.total : 0.0;
            double avgspeed = cs.total ? cs.sum_speed / cs.total : 0.0;
            double avghead = cs.total ? cs.sum_heading / cs.total : 0.0;
            double avgalt = cs.total ? cs.sum_alt / cs.total : 0.0;
            s << "\"" << k << "\": {";
            s << "\"total\": " << cs.total << ", ";
            s << "\"pos_error_pct\": " << ppospct << ", \"avg_pos_err\": " << avgpos << ", \"avg_pos_dx\": " << avgposx << ", \"avg_pos_dy\": " << avgposy << ", ";
            s << "\"speed_error_pct\": " << pspeedpct << ", \"avg_speed_err\": " << avgspeed << ", ";
            s << "\"heading_error_pct\": " << pheadpct << ", \"avg_heading_err\": " << avghead << ", ";
            s << "\"alt_error_pct\": " << paltpct << ", \"avg_alt_err\": " << avgalt;
            s << "}";
        }
        s << "} }\n";
        std::cerr << s.str() << std::flush;
    };

    // runtime control: allow PREDS_RUN_SECONDS env var to override the default 20s
    double run_seconds = 20.0;
    const char* envv = std::getenv("PREDS_RUN_SECONDS");
    if (envv) {
        try { run_seconds = std::stod(envv); } catch(...) { /* keep default */ }
    }
    // start time for timed run
    auto start_time = std::chrono::steady_clock::now();
    // allow overriding timing via environment variables (no recompile needed)
    const char* e;
    e = std::getenv("PREDS_POLL_MS");
    if (e) {
        try { POLL_INTERVAL_MS = std::max(1, std::stoi(e)); } catch(...) {}
    }
    e = std::getenv("PREDS_STEP_MS");
    if (e) {
        try { PRED_STEP_MS = std::max(1, std::stoi(e)); } catch(...) {}
    }
    e = std::getenv("PREDS_HORIZON_MS");
    if (e) {
        try { PRED_HORIZON_MS = std::max(1, std::stoi(e)); } catch(...) {}
    }
    e = std::getenv("PREDS_PUSH_MS");
    if (e) {
        try { PUSH_MS = std::max(1, std::stoi(e)); } catch(...) {}
    }

    // log effective timing configuration
    std::cerr << "preds: POLL_INTERVAL_MS=" << POLL_INTERVAL_MS << " PRED_STEP_MS=" << PRED_STEP_MS << " PRED_HORIZON_MS=" << PRED_HORIZON_MS << " PUSH_MS=" << PUSH_MS << "\n";

    // compute how many poll updates make up one push interval
    int UPDATES_PER_PUSH = std::max(1, PUSH_MS / POLL_INTERVAL_MS);

    // global running flag so CTRL+C stops loop and prints stats
    std::signal(SIGINT, [](int){ g_running.store(false); });
    std::signal(SIGTERM, [](int){ g_running.store(false); });

    while (g_running.load()) {
        // stop after 20 seconds of run time
        auto now_steady = std::chrono::steady_clock::now();
        double elapsed = std::chrono::duration_cast<std::chrono::duration<double>>(now_steady - start_time).count();
        // if run_seconds <= 0 -> run indefinitely; otherwise stop after run_seconds
        if (run_seconds > 0.0 && elapsed >= run_seconds) {
            // print final stats and exit loop
            print_stats(0);
            break;
        }

        // fetch acft data
        std::string resp = runCurl(acftUrl);
        // high-resolution timestamp in seconds
        auto now = std::chrono::system_clock::now();
        double ts = std::chrono::duration_cast<std::chrono::duration<double>>(now.time_since_epoch()).count();

        if (!resp.empty()) {
            auto objs = extractTopLevelObjects(resp);
                    // (silenced per-object debug)
            for (auto &kv : objs) {
                const std::string &callsign = kv.first;
                const std::string &obj = kv.second;
                Sample s{};
                s.ts = ts;
                s.hasPos = false; s.hasAlt = false;
                double px, py;
                if (extractPosition(obj, px, py)) { s.x = px; s.y = py; s.hasPos = true; }
                double alt=0;
                if (extractNumber(obj, "altitude", alt) || extractNumber(obj, "alt", alt)) { s.altitude = alt; s.hasAlt = true; }
                double gspd=0;
                if (extractNumber(obj, "groundSpeed", gspd)) { s.groundSpeed = gspd; s.hasGroundSpeed = true; }
                double speed=0;
                if (!s.hasGroundSpeed && (extractNumber(obj, "speed", speed))) { s.speed = speed; }
                double heading=0;
                if (extractNumber(obj, "heading", heading)) s.heading = heading;
                            // optional string fields
                            std::string acTypeStr;
                            if (extractString(obj, "aircraftType", acTypeStr) || extractString(obj, "acType", acTypeStr) || extractString(obj, "type", acTypeStr)) s.aircraftType = acTypeStr;
                            std::string windStr;
                            if (extractString(obj, "wind", windStr) || extractString(obj, "wnd", windStr)) s.wind = windStr;
                bool onGround=false; extractBool(obj, "isOnGround", onGround); s.hasAlt = s.hasAlt || false;

                auto &arr = ACFT_HISTORY[callsign];
                arr.push_back(s);
                while ((int)arr.size() > HISTORY_MAX) arr.erase(arr.begin());

                // If we have a stored prediction for this callsign at horizon, and the
                // incoming sample timestamp is at-or-after the predicted timestamp,
                // compare and log result, then remove the stored prediction.
                auto pit = PRED_AT_HORIZON.find(callsign);
                if (pit != PRED_AT_HORIZON.end()) {
                    const Sample &pred = pit->second;
                    // allow some slack: accept actual samples that arrive within +/-0.5s of pred.ts
                    if (s.ts + 0.5 >= pred.ts) {
                        double dx = NAN, dy = NAN, pos_err = NAN;
                        bool pos_equal = false;
                        if (s.hasPos && pred.hasPos) {
                            dx = s.x - pred.x;
                            dy = s.y - pred.y;
                            pos_err = std::hypot(dx, dy);
                            pos_equal = (pos_err <= POS_TOL);
                        }
                        double speed_err = std::abs(s.speed - pred.speed);
                        bool speed_equal = (speed_err <= SPEED_TOL);
                        double heading_diff = std::fmod(std::abs(s.heading - pred.heading), 360.0);
                        if (heading_diff > 180.0) heading_diff = 360.0 - heading_diff;
                        bool heading_equal = (heading_diff <= HEADING_TOL);
                        // altitude comparison
                        double alt_err = NAN;
                        bool alt_equal = false;
                        if (s.hasAlt && pred.hasAlt) {
                            alt_err = std::abs(s.altitude - pred.altitude);
                            alt_equal = (alt_err <= ALT_TOL);
                        }

                            // per-callsign comparison summarized in counters only (no per-aircraft log)

                        // update stats - global
                        total_comparisons++;
                        if (!std::isnan(pos_err) && pos_err >= 0.0) { sum_pos_err += pos_err; sum_dx_abs += std::abs(dx); sum_dy_abs += std::abs(dy); pos_comparisons++; }
                        if (!pos_equal && !(std::isnan(pos_err))) pos_error_count++;
                        sum_speed_err += speed_err;
                        if (!speed_equal) speed_error_count++;
                        sum_heading_err += heading_diff;
                        if (!heading_equal) heading_error_count++;
                        if (!std::isnan(alt_err)) { sum_alt_err += alt_err; alt_comparisons++; if (!alt_equal) alt_error_count++; }
                        // per-callsign
                        auto &cs = CALLSIGN_STATS[callsign];
                        cs.total++;
                        if (!std::isnan(pos_err) && pos_err >= 0.0) { cs.sum_pos += pos_err; cs.sum_pos_x += std::abs(dx); cs.sum_pos_y += std::abs(dy); }
                        if (!pos_equal && !(std::isnan(pos_err))) cs.pos_err++;
                        cs.sum_speed += speed_err;
                        if (!speed_equal) cs.speed_err++;
                        cs.sum_heading += heading_diff;
                        if (!heading_equal) cs.heading_err++;
                        if (!std::isnan(alt_err)) { cs.sum_alt += alt_err; if (!alt_equal) cs.alt_err++; }

                        // update global worsts
                        if (!std::isnan(pos_err) && pos_err >= 0.0 && pos_err > worst_pos_err) {
                            worst_pos_err = pos_err; worst_pos_callsign = callsign; worst_pos_sample = s; has_worst_pos_sample = true;
                        }
                        if (!std::isnan(speed_err) && speed_err > worst_speed_err) {
                            worst_speed_err = speed_err;
                        }
                        if (!std::isnan(heading_diff) && heading_diff > worst_heading_err) {
                            worst_heading_err = heading_diff;
                        }
                        if (!std::isnan(alt_err) && alt_err >= 0.0 && alt_err > worst_alt_err) {
                            worst_alt_err = alt_err;
                        }

                        PRED_AT_HORIZON.erase(pit);
                    }
                }
            }
        }

        // emit one compact JSON line per callsign (easier to read/grep)
        for (auto &entry : ACFT_HISTORY) {
            const std::string &callsign = entry.first;
            const auto &samples = entry.second;
            if (samples.empty()) continue;
            const Sample &latest = samples.back();
            Deriv deriv{};
            std::string deriv_method;
            bool ok = computeSmoothedDerivatives(samples, 3.0, deriv, deriv_method);
            // Compute second derivatives (accelerations) from recent history.
            // These are optional and may be NAN when insufficient data is available.
            SecDeriv sec{};
            if (ok) {
                auto &fs = FILTER_STATES[callsign];
                sec = computeSecondDerivativesEMA(samples, fs);
            }

            // per-callsign debug disabled

            // generate predictions at steps
            std::vector<Sample> preds = iterativePredict(latest, ok ? &deriv : nullptr, (double)PRED_HORIZON_MS/1000.0, (double)PRED_STEP_MS/1000.0);

            // store the prediction at the horizon (last prediction) for later comparison
                    if (!preds.empty()) {
                PRED_AT_HORIZON[callsign] = preds.back();
            }

            // store latest predictions for this callsign so we can push them all at once
            PENDING_PREDS[callsign] = preds;

            // per-callsign output suppressed — see aggregated UPDATED output after loop
        }

        // After processing all callsigns for this poll, increment update counter
        static int update_count = 0;
        update_count++;

        // if it's time to push aggregated preds (every PUSH_MS), emit them all at once
        if (update_count % UPDATES_PER_PUSH == 0) {
            // push timestamp in ms
            auto now_sys = std::chrono::system_clock::now();
            long long push_ts_ms = std::chrono::duration_cast<std::chrono::milliseconds>(now_sys.time_since_epoch()).count();
            std::ostringstream out; out << std::fixed << std::setprecision(3);
            out << "{\"push\": { \"push_ts_ms\": " << push_ts_ms << ", \"interval_ms\": " << PUSH_MS << ", \"predictions\": {";
            bool first_cs = true;
            for (auto &pp : PENDING_PREDS) {
                const std::string &cs = pp.first;
                const auto &pv = pp.second;
                if (pv.empty()) continue;
                if (!first_cs) out << ", "; first_cs = false;
                out << "\"" << jsonEscape(cs) << "\": [";
                bool first_p = true;
                for (const auto &ps : pv) {
                    if (!first_p) out << ", "; first_p = false;
                    long long ms = (long long)std::llround(ps.ts * 1000.0);
                    // format UTC hh:mm:ss and include millisecond remainder
                    time_t sec = (time_t)(ms / 1000);
                    std::tm *ptm = std::gmtime(&sec);
                    char timestr[9] = "00:00:00";
                    if (ptm) std::strftime(timestr, sizeof(timestr), "%H:%M:%S", ptm);
                    long long ms_rem = ms % 1000;
                    out << "{ \"ts\": \"" << timestr << "\", \"ms\": " << ms_rem << ", \"ts_epoch_ms\": " << ms;
                    if (ps.hasPos) out << ", \"x\": " << ps.x << ", \"y\": " << ps.y;
                    if (ps.hasAlt) out << ", \"altitude\": " << ps.altitude;
                    out << ", \"heading\": " << ps.heading << ", \"speed\": " << ps.speed;
                    if (ps.hasGroundSpeed) out << ", \"groundSpeed\": " << ps.groundSpeed;
                    if (!ps.aircraftType.empty()) out << ", \"aircraftType\": \"" << jsonEscape(ps.aircraftType) << "\"";
                    if (!ps.wind.empty()) out << ", \"wind\": \"" << jsonEscape(ps.wind) << "\"";
                    out << " }";
                }
                out << "]";
            }
            out << " } } }\n";
            std::cout << out.str() << std::flush;
        }

        // every 10 updates emit aggregated debug summary (printed to stdout)
        if (update_count % 10 == 0) {
            int total = total_comparisons.load();
            int pos_comp = pos_comparisons.load();
            int alt_comp = alt_comparisons.load();
            double avg_pos = pos_comp ? sum_pos_err / pos_comp : 0.0;
            double avg_speed = total ? sum_speed_err / total : 0.0;
            double avg_heading = total ? sum_heading_err / total : 0.0;
            double avg_alt = alt_comp ? sum_alt_err / alt_comp : 0.0;
            std::ostringstream dbg; dbg << std::fixed << std::setprecision(3);
            dbg << "{\"summary_debug\": { \"updates\": " << update_count << ", \"total_cmp\": " << total << ", \"avg_pos_err\": " << avg_pos << ", \"avg_speed_err\": " << avg_speed << ", \"avg_heading_err\": " << avg_heading << ", \"avg_alt_err\": " << avg_alt;
            dbg << ", \"worst_pos_err\": " << (worst_pos_err >= 0.0 ? worst_pos_err : 0.0);
            dbg << ", \"worst_pos_callsign\": \"" << jsonEscape(worst_pos_callsign) << "\"";
            dbg << ", \"worst_speed_err\": " << (worst_speed_err >= 0.0 ? worst_speed_err : 0.0);
            dbg << ", \"worst_heading_err\": " << (worst_heading_err >= 0.0 ? worst_heading_err : 0.0);
            dbg << ", \"worst_alt_err\": " << (worst_alt_err >= 0.0 ? worst_alt_err : 0.0);
            dbg << " } }\n";
            std::cout << dbg.str() << std::flush;
        }

        // sleep until next poll
        std::this_thread::sleep_for(std::chrono::milliseconds(POLL_INTERVAL_MS));
    }
    // print final stats on exit
    print_stats(0);
    return 0;
}

// --- Savitzky-Golay per-aircraft derivative estimator (non-quadratic) ---
// Compute second derivatives (accelerations) using a Savitzky-Golay fit to
// the most recent samples. This fits a polynomial in time (of configurable
// order) to the last N samples and returns the m-th derivative at t=0.
// The implementation dynamically builds the design matrix from actual
// sample timestamps (no assumption of uniform sampling).

struct FilterState {
    // left for compatibility; SG is stateless per-call using recent samples
    bool unused = false;
};

static double factorial(int n) {
    double f = 1.0;
    for (int i = 2; i <= n; ++i) f *= (double)i;
    return f;
}

// Solve linear system A * x = b for small square A using Gaussian elimination
// Returns true on success and writes solution into x (size n)
static bool solveLinearSystem(std::vector<std::vector<double>> A, std::vector<double> b, std::vector<double> &x) {
    int n = (int)A.size();
    x.assign(n, 0.0);
    for (int i = 0; i < n; ++i) A[i].push_back(b[i]);
    for (int i = 0; i < n; ++i) {
        int piv = i;
        for (int r = i+1; r < n; ++r) if (std::abs(A[r][i]) > std::abs(A[piv][i])) piv = r;
        if (std::abs(A[piv][i]) < 1e-18) return false;
        if (piv != i) std::swap(A[piv], A[i]);
        double d = A[i][i];
        for (int c = i; c <= n; ++c) A[i][c] /= d;
        for (int r = 0; r < n; ++r) if (r != i) {
            double f = A[r][i];
            for (int c = i; c <= n; ++c) A[r][c] -= f * A[i][c];
        }
    }
    for (int i = 0; i < n; ++i) x[i] = A[i][n];
    return true;
}

// Compute SG convolution coefficients for derivative `m` given times t_j
// t_j are sample times relative to evaluation time (in seconds), length n.
// polyOrder is polynomial fit degree. Returns vector c of length n where
// derivative estimate = sum_j c[j] * y[j]
static bool computeSGCoeffs(const std::vector<double> &t, const std::vector<double> &w, int polyOrder, int derivOrder, std::vector<double> &outC) {
    int n = (int)t.size();
    int p = polyOrder;
    if (n <= p) return false;
    // center times to mean to improve conditioning
    double tmean = 0.0; for (double tv : t) tmean += tv; tmean /= (double)n;
    std::vector<double> tc(n); for (int i=0;i<n;++i) tc[i] = t[i] - tmean;
    // Build A: n x (p+1) with A[j][k] = tc_j^k
    std::vector<std::vector<double>> A(n, std::vector<double>(p+1, 0.0));
    for (int j = 0; j < n; ++j) {
        double v = 1.0;
        for (int k = 0; k <= p; ++k) { A[j][k] = v; v *= tc[j]; }
    }
    // Compute weighted ATA = A^T * W * A  (size (p+1)x(p+1))
    int m = p+1;
    std::vector<std::vector<double>> ATA(m, std::vector<double>(m, 0.0));
    for (int i = 0; i < m; ++i) for (int j = 0; j < m; ++j) {
        double s=0.0; for (int r=0;r<n;++r) s += (w.empty() ? 1.0 : w[r]) * A[r][i] * A[r][j]; ATA[i][j] = s;
    }
    // Compute ATW = A^T * W  => size m x n
    std::vector<std::vector<double>> ATW(m, std::vector<double>(n, 0.0));
    for (int i = 0; i < m; ++i) for (int j = 0; j < n; ++j) ATW[i][j] = (w.empty() ? 1.0 : w[j]) * A[j][i];
    // Compute inv(ATA) by solving ATA * X = I for each column of I
    std::vector<std::vector<double>> invATA(m, std::vector<double>(m, 0.0));
    for (int col = 0; col < m; ++col) {
        std::vector<double> e(m, 0.0); e[col] = 1.0;
        std::vector<double> sol;
        if (!solveLinearSystem(ATA, e, sol)) return false;
        for (int r = 0; r < m; ++r) invATA[r][col] = sol[r];
    }
    // Compute M = invATA * ATW  => size m x n
    std::vector<std::vector<double>> M(m, std::vector<double>(n, 0.0));
    for (int i = 0; i < m; ++i) for (int j = 0; j < n; ++j) {
        double s = 0.0; for (int k = 0; k < m; ++k) s += invATA[i][k] * ATW[k][j]; M[i][j] = s;
    }
    double fac = factorial(derivOrder);
    outC.assign(n, 0.0);
    for (int j = 0; j < n; ++j) outC[j] = fac * M[derivOrder][j];
    return true;
}

static SecDeriv computeSecondDerivativesEMA(const std::vector<Sample> &samples, FilterState &fs) {
    // This function now implements Savitzky-Golay derivative estimation.
    SecDeriv out;
    if (samples.size() < 3) return out;
    // SG parameters: can be overridden via env vars
    int SG_WINDOW = 7;
    int SG_ORDER = 3;
    const char* e;
    e = std::getenv("PREDS_SG_WINDOW"); if (e) try { SG_WINDOW = std::max(3, std::stoi(e)); } catch(...) {}
    e = std::getenv("PREDS_SG_ORDER"); if (e) try { SG_ORDER = std::max(1, std::stoi(e)); } catch(...) {}
    if (SG_WINDOW > (int)samples.size()) SG_WINDOW = (int)samples.size();
    // altitude-specific SG parameters (optional)
    int SG_WINDOW_ALT = SG_WINDOW;
    int SG_ORDER_ALT = SG_ORDER;
    double TAU_ALT = 0.0;
    const char* e_alt;
    e_alt = std::getenv("PREDS_SG_WINDOW_ALT"); if (e_alt) try { SG_WINDOW_ALT = std::max(3, std::stoi(e_alt)); } catch(...) {}
    e_alt = std::getenv("PREDS_SG_ORDER_ALT"); if (e_alt) try { SG_ORDER_ALT = std::max(1, std::stoi(e_alt)); } catch(...) {}
    // choose most recent SG_WINDOW samples
    std::vector<Sample> win;
    for (int i = (int)samples.size()-SG_WINDOW; i < (int)samples.size(); ++i) if (i>=0) win.push_back(samples[i]);
    int n = (int)win.size();
    if (n <= SG_ORDER) return out;
    // times relative to latest (latest t=0)
    std::vector<double> t(n);
    double t0 = win.back().ts;
    for (int i = 0; i < n; ++i) t[i] = win[i].ts - t0;

    // compute weights (exponential decay on age) and helper to build vector
    double TAU = 0.6; // seconds
    const char* e_tau = std::getenv("PREDS_SG_TAU"); if (e_tau) try { TAU = std::max(0.01, std::stod(e_tau)); } catch(...) {}
    std::vector<double> weights(n, 1.0);
    for (int i = 0; i < n; ++i) {
        double age = t0 - win[i].ts; // age in seconds >= 0
        weights[i] = std::exp(-age / TAU);
    }

    // prepare altitude-specific window/weights if requested
    if (SG_WINDOW_ALT > (int)samples.size()) SG_WINDOW_ALT = (int)samples.size();
    std::vector<Sample> win_alt;
    for (int i = (int)samples.size()-SG_WINDOW_ALT; i < (int)samples.size(); ++i) if (i>=0) win_alt.push_back(samples[i]);
    int n_alt = (int)win_alt.size();
    std::vector<double> t_alt;
    std::vector<double> weights_alt;
    if (n_alt > 0) {
        double t0_alt = win_alt.back().ts;
        t_alt.resize(n_alt);
        weights_alt.resize(n_alt);
        for (int i = 0; i < n_alt; ++i) t_alt[i] = win_alt[i].ts - t0_alt;
        TAU_ALT = TAU; // default to global TAU
        const char* e_ta = std::getenv("PREDS_SG_TAU_ALT"); if (e_ta) try { TAU_ALT = std::max(0.01, std::stod(e_ta)); } catch(...) {}
        for (int i = 0; i < n_alt; ++i) { double age = t0_alt - win_alt[i].ts; weights_alt[i] = std::exp(-age / TAU_ALT); }
    }

    // helper to build vector of values for a field and compute 2nd derivative
    auto compute_field = [&](auto getter)->double {
        std::vector<double> y; y.reserve(n);
        for (int i = 0; i < n; ++i) { double v = getter(win[i]); if (std::isnan(v)) return NAN; y.push_back(v); }
        std::vector<double> coeffs;
        if (!computeSGCoeffs(t, weights, SG_ORDER, 2, coeffs)) return NAN;
        double val = 0.0; for (int j = 0; j < n; ++j) val += coeffs[j] * y[j];
        return val;
    };

    // x,y
    out.ax = compute_field([&](const Sample &s){ return s.hasPos ? s.x : NAN; });
    out.ay = compute_field([&](const Sample &s){ return s.hasPos ? s.y : NAN; });
    // altitude — use altitude-specific SG window/order/tau when available
    if (n_alt > SG_ORDER_ALT) {
        // build altitude y vector
        std::vector<double> y_alt; y_alt.reserve(n_alt);
        bool ok_alt = true;
        for (int i = 0; i < n_alt; ++i) { double v = win_alt[i].altitude; if (std::isnan(v)) { ok_alt = false; break; } y_alt.push_back(v); }
        if (ok_alt) {
            std::vector<double> coeffs_alt;
            if (computeSGCoeffs(t_alt, weights_alt, SG_ORDER_ALT, 2, coeffs_alt)) {
                double val = 0.0; for (int j = 0; j < n_alt; ++j) val += coeffs_alt[j] * y_alt[j];
                out.altAcc = val;
            } else out.altAcc = NAN;
        } else out.altAcc = NAN;
    } else {
        out.altAcc = compute_field([&](const Sample &s){ return s.hasAlt ? s.altitude : NAN; });
    }
    // speed (knots)
    out.speedAcc = compute_field([&](const Sample &s){ return std::isnan(s.speed) ? NAN : s.speed; });
    // heading: unwrap then compute
    std::vector<double> headVec; headVec.reserve(n);
    double lastH = NAN;
    for (int i = 0; i < n; ++i) {
        double h = win[i].heading;
        if (std::isnan(h)) { headVec.clear(); break; }
        if (i==0) { headVec.push_back(h); lastH = h; continue; }
        double diff = std::fmod((h - lastH + 540.0), 360.0) - 180.0;
        double unwrapped = headVec.back() + diff;
        headVec.push_back(unwrapped);
        lastH = h;
    }
    if ((int)headVec.size() == n) {
        std::vector<double> coeffs;
        if (computeSGCoeffs(t, weights, SG_ORDER, 2, coeffs)) {
            double val = 0.0; for (int j = 0; j < n; ++j) val += coeffs[j] * headVec[j];
            out.headingAcc = val;
        }
    }
    return out;
}

// extract a quoted string field value (basic, assumes simple JSON string)
static bool extractString(const std::string &text, const std::string &key, std::string &out) {
    size_t pos = text.find('"' + key + '"');
    if (pos == std::string::npos) pos = text.find(key);
    if (pos == std::string::npos) return false;
    size_t colon = text.find(':', pos);
    if (colon == std::string::npos) return false;
    size_t i = text.find_first_not_of(" \t\r\n", colon+1);
    if (i == std::string::npos) return false;
    if (text[i] != '"') return false;
    size_t j = i+1;
    std::string acc;
    while (j < text.size()) {
        char c = text[j++];
        if (c == '"') { out = acc; return true; }
        if (c == '\\' && j < text.size()) { acc += text[j++]; continue; }
        acc += c;
    }
    return false;
}
// (declaration placed earlier)