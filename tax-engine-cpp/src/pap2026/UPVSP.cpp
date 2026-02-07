#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::UPVSP() {
    if (KRV == 1) {
        VSPR = 0;
    } else {
        if (ZRE4VP > BBGRVALV) {
            ZRE4VPR = BBGRVALV;
        } else {
            ZRE4VPR = ZRE4VP;
        }
        VSPR = floor(ZRE4VPR * RVSATZAN * 100.0) / 100.0;
    }
    
    if (ZRE4VP > BBGKVPV) {
        ZRE4VPR = BBGKVPV;
    } else {
        ZRE4VPR = ZRE4VP;
    }
    
    if (PKV > 0) {
        if (STKL == 6) {
            VSPKVPV = 0;
        } else {
            PKPVAGZJ = (double)PKPVAGZ * 12.0 / 100.0;
            VSPKVPV = (double)PKPV * 12.0 / 100.0;
            VSPKVPV -= PKPVAGZJ;
        }
    } else {
        VSPKVPV = floor(ZRE4VPR * (KVSATZAN + PVSATZAN) * 100.0) / 100.0;
    }
    
    if (VSPKVPV < 0) VSPKVPV = 0;
    VSP = VSPKVPV + VSPR;
    
    if (STKL == 6 || ALV == 1) {
    } else {
        if (ZRE4VP > BBGRVALV) {
            ZRE4VPR = BBGRVALV;
        } else {
            ZRE4VPR = ZRE4VP;
        }
        VSPALV = floor(AVSATZAN * ZRE4VPR * 100.0) / 100.0;
        VSPHB = VSPALV + VSPKVPV;
        if (VSPHB > 1900.0) VSPHB = 1900.0;
        VSPN = VSPR + VSPHB;
        if (VSPN > VSP) VSP = VSPN;
    }
}
