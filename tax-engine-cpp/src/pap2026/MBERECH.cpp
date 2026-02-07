#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MBERECH() {
    ANP = 0;
    if (ZVBEZ >= 0) {
        if (ZVBEZ < FVBZ) {
            FVBZ = ZVBEZ;
        }
    }
    if (STKL < 6) {
        if (ZVBEZ > 0) {
            if (ZVBEZ - FVBZ < 102.0) {
                ANP = floor(ZVBEZ - FVBZ);
            } else {
                ANP = 102.0;
            }
        }
    } else {
        FVBZ = 0;
        FVBZSO = 0;
    }
    
    if (STKL < 6) {
        if (ZRE4 > ZVBEZ) {
            if (ZRE4 - ZVBEZ < 1230.0) {
                ANP += floor(ZRE4 - ZVBEZ);
            } else {
                ANP += 1230.0;
            }
        }
    }
    
    KZTAB = (STKL == 3 || STKL == 4) ? 2.0 : 1.0;
    
    if (STKL == 1) {
        SAP = 36.0;
        KFB = floor(ZKF * 9756.0);
    } else if (STKL == 2) {
        EFA = 4260.0;
        SAP = 36.0;
        KFB = floor(ZKF * 9756.0);
    } else if (STKL == 3) {
        SAP = 36.0;
        KFB = floor(ZKF * 9756.0);
    } else if (STKL == 4) {
        SAP = 36.0;
        KFB = floor(ZKF * 9756.0);
    } else if (STKL == 5) {
        SAP = 36.0;
        KFB = 0;
    } else {
        SAP = 36.0;
        KFB = 0;
    }
    
    ZTABFB = EFA + ANP + SAP + FVBZ;
    VFRB = (ANP + FVB + FVBZ) * 100.0;
    
    UPVSP();
    ZVE = ZRE4 - ZTABFB - VSP;
    if (ZVE < 0) ZVE = 0;
    UPMLST();
    
    WVFRB = (ZVE - GFB) * 100.0;
    if (WVFRB < 0) WVFRB = 0;
    
    LSTJAHR = ST * F;
    UPLSTLZZ();
    
    if (ZKF > 0) {
        ZTABFB += KFB;
        MRE4ABZ();
        UPVSP();
        ZVE = ZRE4 - ZTABFB - VSP;
        if (ZVE < 0) ZVE = 0;
        UPMLST();
        JBMG = ST * F;
    } else {
        JBMG = LSTJAHR;
    }
    
    MSOLZ();
}
