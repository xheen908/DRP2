#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::UP5_6() {
    X = floor(ZX * 1.25);
    UPTAB26();
    ST1 = ST;
    X = floor(ZX * 0.75);
    UPTAB26();
    ST2 = ST;
    DIFF = (ST1 - ST2) * 2.0;
    MIST = floor(ZX * 0.14);
    if (MIST > DIFF) {
        ST = MIST;
    } else {
        ST = DIFF;
    }
}
