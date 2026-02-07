#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MST5_6() {
    ZZX = X;
    if (ZZX > W2STKL5) {
        ZX = W2STKL5;
        UP5_6();
        if (ZZX > W3STKL5) {
            ST += (W3STKL5 - W2STKL5) * 0.42;
            ST += (ZZX - W3STKL5) * 0.45;
        } else {
            ST += (ZZX - W2STKL5) * 0.42;
        }
    } else {
        ZX = ZZX;
        UP5_6();
        if (ZZX > W1STKL5) {
            VERGL = ST;
            ZX = W1STKL5;
            UP5_6();
            HOCH = ST + (ZZX - W1STKL5) * 0.42;
            if (HOCH < VERGL) {
                ST = HOCH;
            } else {
                ST = VERGL;
            }
        }
    }
    ST = floor(ST);
}
