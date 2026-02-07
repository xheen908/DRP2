#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MSOLZ() {
    double current_SOLZFREI = SOLZFREI * KZTAB;
    if (JBMG > current_SOLZFREI) {
        SOLZJ = floor(JBMG * 5.5) / 100.0;
        SOLZMIN = floor((JBMG - current_SOLZFREI) * 11.9) / 100.0;
        if (SOLZMIN < SOLZJ) {
            SOLZJ = SOLZMIN;
        }
        JW = SOLZJ * 100.0;
        UPANTEIL();
        SOLZLZZ = ANTEIL1;
    } else {
        SOLZLZZ = 0;
    }
    
    if (R > 0.0) {
        JW = JBMG * 100.0;
        UPANTEIL();
        BK = ANTEIL1;
    } else {
        BK = 0;
    }
}

void Lohnsteuer2026::MSOLZSTS() {
    if (ZKF > 0.0) {
        SOLZSZVE = ZVE - KFB;
    } else {
        SOLZSZVE = ZVE;
    }
    if (SOLZSZVE < 1.0) {
        SOLZSZVE = 0;
        X = 0;
    } else {
        X = floor(SOLZSZVE / KZTAB);
    }
    
    if (X > 0) {
        if (STKL < 5) {
            UPTAB26();
        } else {
            MST5_6();
        }
        SOLZSBMG = ST * F;
        if (SOLZSBMG > SOLZFREI) {
            SOLZS = (long long)(STS * 5.5 / 100.0);
        } else {
            SOLZS = 0;
        }
    } else {
        SOLZS = 0;
    }
}
