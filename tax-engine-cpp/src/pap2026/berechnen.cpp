#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::berechnen() {
    MPARA();
    MRE4JL();
    VBEZBSO = 0;
    MRE4();
    MRE4ABZ();
    MBERECH();
    MSOLZSTS(); 
    MSONST();
    berechneSV();
}
