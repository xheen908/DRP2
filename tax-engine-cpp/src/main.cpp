#include "httplib.h"
#include "json.hpp"
#include "pap2026/pap2026.hpp"
#include <iostream>

using json = nlohmann::json;

void handle_calculate(const httplib::Request& req, httplib::Response& res) {
    try {
        auto j = json::parse(req.body);
        Lohnsteuer2026 lohnsteuer;

        // Map input fields
        if (j.contains("AF")) lohnsteuer.AF = j["AF"];
        if (j.contains("AJAHR")) lohnsteuer.AJAHR = j["AJAHR"];
        if (j.contains("ALTER1")) lohnsteuer.ALTER1 = j["ALTER1"];
        if (j.contains("ALV")) lohnsteuer.ALV = j["ALV"];
        if (j.contains("F")) lohnsteuer.F = j["F"];
        if (j.contains("JFREIB")) lohnsteuer.JFREIB = j["JFREIB"];
        if (j.contains("JHINZU")) lohnsteuer.JHINZU = j["JHINZU"];
        if (j.contains("JRE4")) lohnsteuer.JRE4 = j["JRE4"];
        if (j.contains("JRE4ENT")) lohnsteuer.JRE4ENT = j["JRE4ENT"];
        if (j.contains("JVBEZ")) lohnsteuer.JVBEZ = j["JVBEZ"];
        if (j.contains("KRV")) lohnsteuer.KRV = j["KRV"];
        if (j.contains("KVZ")) lohnsteuer.KVZ = j["KVZ"];
        if (j.contains("LZZ")) lohnsteuer.LZZ = j["LZZ"];
        if (j.contains("LZZFREIB")) lohnsteuer.LZZFREIB = j["LZZFREIB"];
        if (j.contains("LZZHINZU")) lohnsteuer.LZZHINZU = j["LZZHINZU"];
        if (j.contains("MBV")) lohnsteuer.MBV = j["MBV"];
        if (j.contains("PKPV")) lohnsteuer.PKPV = j["PKPV"];
        if (j.contains("PKPVAGZ")) lohnsteuer.PKPVAGZ = j["PKPVAGZ"];
        if (j.contains("PKV")) lohnsteuer.PKV = j["PKV"];
        if (j.contains("PVA")) lohnsteuer.PVA = j["PVA"];
        if (j.contains("PVS")) lohnsteuer.PVS = j["PVS"];
        if (j.contains("PVZ")) lohnsteuer.PVZ = j["PVZ"];
        if (j.contains("R")) lohnsteuer.R = j["R"];
        if (j.contains("RE4")) lohnsteuer.RE4 = j["RE4"];
        if (j.contains("SONSTB")) lohnsteuer.SONSTB = j["SONSTB"];
        if (j.contains("SONSTENT")) lohnsteuer.SONSTENT = j["SONSTENT"];
        if (j.contains("STERBE")) lohnsteuer.STERBE = j["STERBE"];
        if (j.contains("STKL")) lohnsteuer.STKL = j["STKL"];
        if (j.contains("VBEZ")) lohnsteuer.VBEZ = j["VBEZ"];
        if (j.contains("VBEZM")) lohnsteuer.VBEZM = j["VBEZM"];
        if (j.contains("VBEZS")) lohnsteuer.VBEZS = j["VBEZS"];
        if (j.contains("VBS")) lohnsteuer.VBS = j["VBS"];
        if (j.contains("VJAHR")) lohnsteuer.VJAHR = j["VJAHR"];
        if (j.contains("ZKF")) lohnsteuer.ZKF = j["ZKF"];
        if (j.contains("ZMVB")) lohnsteuer.ZMVB = j["ZMVB"];

        // Perform calculation
        lohnsteuer.berechnen();

        // Construct response
        json response;
        response["BK"] = lohnsteuer.BK;
        response["BKS"] = lohnsteuer.BKS;
        response["LSTLZZ"] = lohnsteuer.LSTLZZ;
        response["SOLZLZZ"] = lohnsteuer.SOLZLZZ;
        response["SOLZS"] = lohnsteuer.SOLZS;
        response["STS"] = lohnsteuer.STS;
        response["RV_AN"] = lohnsteuer.RV_AN;
        response["KV_AN"] = lohnsteuer.KV_AN;
        response["PV_AN"] = lohnsteuer.PV_AN;
        response["ALV_AN"] = lohnsteuer.ALV_AN;

        res.set_content(response.dump(), "application/json");

    } catch (const std::exception& e) {
        res.status = 400;
        json error;
        error["error"] = e.what();
        res.set_content(error.dump(), "application/json");
        std::cerr << "Error processing request: " << e.what() << std::endl;
    }
}

int main() {
    httplib::Server svr;

    svr.Post("/calculate", handle_calculate);

    std::cout << "Starting Tax Engine on port 8080..." << std::endl;
    svr.listen("0.0.0.0", 8080);

    return 0;
}
