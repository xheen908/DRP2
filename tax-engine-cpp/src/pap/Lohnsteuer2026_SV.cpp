#include "pap/Lohnsteuer2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::berechneSV() {
    if (PKV == 1) { // Privat versichert
        RV_AN = (KRV == 1) ? 0 : (long long)(std::min((double)RE4, BBGRVALV / 12.0 * 100.0) * RVSATZAN);
        ALV_AN = (ALV == 1) ? 0 : (long long)(std::min((double)RE4, BBGRVALV / 12.0 * 100.0) * AVSATZAN);
        KV_AN = 0;
        PV_AN = 0;
        return;
    }

    double bbg_rv_monat = BBGRVALV / 12.0 * 100.0;
    double bbg_kv_monat = BBGKVPV / 12.0 * 100.0;

    double basis_rv = std::min((double)RE4, bbg_rv_monat);
    double basis_kv = std::min((double)RE4, bbg_kv_monat);

    RV_AN = (long long)(basis_rv * RVSATZAN);
    ALV_AN = (long long)(basis_rv * AVSATZAN);
    KV_AN = (long long)(basis_kv * KVSATZAN);
    PV_AN = (long long)(basis_kv * PVSATZAN);
}
