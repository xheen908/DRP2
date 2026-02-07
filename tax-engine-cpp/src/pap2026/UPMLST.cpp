#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::UPMLST() {
    if (ZVE < 1.0) {
        ZVE = 0;
        X = 0;
    } else {
        X = floor(ZVE / KZTAB);
    }
    
    if (STKL < 5) {
        UPTAB26();
    } else {
        MST5_6();
    }
}
