#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MRE4ABZ() {
    ZRE4 = ZRE4J - FVB - ALTE - JLFREIB + JLHINZU;
    if (ZRE4 < 0) {
        ZRE4 = 0;
    }
    ZRE4VP = ZRE4J;
    ZVBEZ = ZVBEZJ - FVB;
    if (ZVBEZ < 0) {
        ZVBEZ = 0;
    }
}
