#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::UPLSTLZZ() {
    JW = LSTJAHR * 100.0;
    UPANTEIL();
    LSTLZZ = ANTEIL1;
}
