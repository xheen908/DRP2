#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MPARA() {
    BBGRVALV = 101400.0;
    AVSATZAN = 0.0130;
    RVSATZAN = 0.0930;
    BBGKVPV = 69750.0;
    KVSATZAN = (KVZ / 2.0 / 100.0) + 0.07;
    
    if (PVS == 1) {
        PVSATZAN = 0.023;
    } else {
        PVSATZAN = 0.018;
    }
    
    if (PVZ == 1) {
        PVSATZAN += 0.006;
    }
    
    if (PVA > 0) {
        PVSATZAN -= (double)PVA * 0.0025;
    }
    
    W1STKL5 = 14071.0;
    W2STKL5 = 34939.0;
    W3STKL5 = 222260.0;
    GFB = 12348.0;
    SOLZFREI = 20350.0;
}
