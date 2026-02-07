#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::UPTAB26() {
    if (X < GFB + 1.0) {
        ST = 0;
    } else if (X < 17800.0) {
        Y = (X - GFB) / 10000.0;
        RW = Y * 914.51 + 1400.0;
        ST = floor(RW * Y + 1e-6);
    } else if (X < 69879.0) {
        Y = (X - 17800.0) / 10000.0;
        RW = Y * 173.1 + 2397.0;
        ST = floor(RW * Y + 1035.12 + 1e-6);
    } else if (X < 277826.0) {
        ST = floor(X * 0.42 - 11135.63 + 1e-6);
    } else {
        ST = floor(X * 0.45 - 19470.38 + 1e-6);
    }
    ST = ST * KZTAB;
}
