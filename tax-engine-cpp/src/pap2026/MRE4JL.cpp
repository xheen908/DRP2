#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MRE4JL() {
    if (LZZ == 1) {
        ZRE4J = (double)RE4 / 100.0;
        ZVBEZJ = (double)VBEZ / 100.0;
        JLFREIB = (double)LZZFREIB / 100.0;
        JLHINZU = (double)LZZHINZU / 100.0;
    } else if (LZZ == 2) {
        ZRE4J = (double)RE4 * 12.0 / 100.0;
        ZVBEZJ = (double)VBEZ * 12.0 / 100.0;
        JLFREIB = (double)LZZFREIB * 12.0 / 100.0;
        JLHINZU = (double)LZZHINZU * 12.0 / 100.0;
    } else if (LZZ == 3) {
        ZRE4J = (double)RE4 * 360.0 / 7.0 / 100.0;
        ZVBEZJ = (double)VBEZ * 360.0 / 7.0 / 100.0;
        JLFREIB = (double)LZZFREIB * 360.0 / 7.0 / 100.0;
        JLHINZU = (double)LZZHINZU * 360.0 / 7.0 / 100.0;
    } else {
        ZRE4J = (double)RE4 * 360.0 / 100.0;
        ZVBEZJ = (double)VBEZ * 360.0 / 100.0;
        JLFREIB = (double)LZZFREIB * 360.0 / 100.0;
        JLHINZU = (double)LZZHINZU * 360.0 / 100.0;
    }
    
    if (AF == 0) {
        F = 1.0;
    }
}
