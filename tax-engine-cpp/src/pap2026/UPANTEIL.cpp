#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::UPANTEIL() {
    if (LZZ == 1) {
        ANTEIL1 = (long long)JW;
    } else if (LZZ == 2) {
        ANTEIL1 = (long long)(JW / 12.0);
    } else if (LZZ == 3) {
        ANTEIL1 = (long long)(JW * 7.0 / 360.0);
    } else {
        ANTEIL1 = (long long)(JW / 360.0);
    }
}
