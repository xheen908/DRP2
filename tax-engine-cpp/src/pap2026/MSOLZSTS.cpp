#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

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
