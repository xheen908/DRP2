#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MBERECH() {
    ANP = 0;
    if (ZVBEZ >= 0) {
        if (ZVBEZ < FVBZ) {
            FVBZ = ZVBEZ;
        }
    }
    if (STKL < 6) {
        if (ZVBEZ > 0) {
            if (ZVBEZ - FVBZ < 102.0) {
                ANP = floor(ZVBEZ - FVBZ);
            } else {
                ANP = 102.0;
            }
        }
    } else {
        FVBZ = 0;
        FVBZSO = 0;
    }
    
    if (STKL < 6) {
        if (ZRE4 > ZVBEZ) {
            if (ZRE4 - ZVBEZ < 1230.0) {
                ANP += floor(ZRE4 - ZVBEZ);
            } else {
                ANP += 1230.0;
            }
        }
    }
    
    KZTAB = (STKL == 3 || STKL == 4) ? 2.0 : 1.0;
    
    if (STKL == 1) {
        SAP = 36.0;
        KFB = floor(ZKF * 9756.0);
    } else if (STKL == 2) {
        EFA = 4260.0;
        SAP = 36.0;
        KFB = floor(ZKF * 9756.0);
    } else if (STKL == 3) {
        SAP = 36.0;
        KFB = floor(ZKF * 9756.0);
    } else if (STKL == 4) {
        SAP = 36.0;
        KFB = floor(ZKF * 9756.0);
    } else if (STKL == 5) {
        SAP = 36.0;
        KFB = 0;
    } else {
        SAP = 36.0;
        KFB = 0;
    }
    
    ZTABFB = EFA + ANP + SAP + FVBZ;
    VFRB = (ANP + FVB + FVBZ) * 100.0;
    
    UPVSP();
    ZVE = ZRE4 - ZTABFB - VSP;
    if (ZVE < 0) ZVE = 0;
    UPMLST();
    
    WVFRB = (ZVE - GFB) * 100.0;
    if (WVFRB < 0) WVFRB = 0;
    
    LSTJAHR = ST * F;
    UPLSTLZZ();
    
    if (ZKF > 0) {
        ZTABFB += KFB;
        MRE4ABZ();
        UPVSP();
        ZVE = ZRE4 - ZTABFB - VSP;
        if (ZVE < 0) ZVE = 0;
        UPMLST();
        JBMG = ST * F;
    } else {
        JBMG = LSTJAHR;
    }
    
    MSOLZ();
}

void Lohnsteuer2026::UPVSP() {
    if (KRV == 1) {
        VSPR = 0;
    } else {
        if (ZRE4VP > BBGRVALV) {
            ZRE4VPR = BBGRVALV;
        } else {
            ZRE4VPR = ZRE4VP;
        }
        VSPR = floor(ZRE4VPR * RVSATZAN * 100.0) / 100.0;
    }
    
    if (ZRE4VP > BBGKVPV) {
        ZRE4VPR = BBGKVPV;
    } else {
        ZRE4VPR = ZRE4VP;
    }
    
    if (PKV > 0) {
        if (STKL == 6) {
            VSPKVPV = 0;
        } else {
            PKPVAGZJ = (double)PKPVAGZ * 12.0 / 100.0;
            VSPKVPV = (double)PKPV * 12.0 / 100.0;
            VSPKVPV -= PKPVAGZJ;
        }
    } else {
        VSPKVPV = floor(ZRE4VPR * (KVSATZAN + PVSATZAN) * 100.0) / 100.0;
    }
    
    if (VSPKVPV < 0) VSPKVPV = 0;
    VSP = VSPKVPV + VSPR;
    
    if (STKL == 6 || ALV == 1) {
    } else {
        if (ZRE4VP > BBGRVALV) {
            ZRE4VPR = BBGRVALV;
        } else {
            ZRE4VPR = ZRE4VP;
        }
        VSPALV = floor(AVSATZAN * ZRE4VPR * 100.0) / 100.0;
        VSPHB = VSPALV + VSPKVPV;
        if (VSPHB > 1900.0) VSPHB = 1900.0;
        VSPN = VSPR + VSPHB;
        if (VSPN > VSP) VSP = VSPN;
    }
}

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

void Lohnsteuer2026::UPLSTLZZ() {
    JW = LSTJAHR * 100.0;
    UPANTEIL();
    LSTLZZ = ANTEIL1;
}

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
