#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MSONST() {
    LZZ = 1;
    if (SONSTB == 0 && MBV == 0) {
        STS = 0;
        SOLZS = 0;
        BKS = 0;
    } else {
        ZRE4J = (double)JRE4 / 100.0;
        ZVBEZJ = (double)JVBEZ / 100.0;
        JLFREIB = (double)JFREIB / 100.0;
        JLHINZU = (double)JHINZU / 100.0;
        MRE4();
        MRE4ABZ();
        ZRE4VP -= (double)JRE4ENT / 100.0;
        MBERECH(); 
        LSTOSO = ST * 100.0;
        WVFRBO = (ZVE - GFB) * 100.0;
        if (WVFRBO < 0) WVFRBO = 0;
        
        ZRE4J = (double)(JRE4 + SONSTB) / 100.0;
        ZVBEZJ = (double)(JVBEZ + VBS) / 100.0;
        VBEZBSO = STERBE;
        MRE4();
        MRE4ABZ();
        ZRE4VP = ZRE4VP + (double)MBV / 100.0 - (double)JRE4ENT / 100.0 - (double)SONSTENT / 100.0;
        FVB = FVBSO;
        FVBZ = FVBZSO;
        MBERECH();
        LSTSO = ST * 100.0;
        STS = (long long)((LSTSO - LSTOSO) * F);
        if (STS < 0) {
            if (MBV != 0) {
                LSTLZZ += STS;
                if (LSTLZZ < 0) LSTLZZ = 0;
                SOLZLZZ += (long long)(STS * 5.5 / 100.0);
                if (SOLZLZZ < 0) SOLZLZZ = 0;
                BK += STS;
                if (BK < 0) BK = 0;
            }
            STS = 0;
        }
        
        MSOLZSTS();
        if (R > 0.0) {
            BKS = STS;
        } else {
            BKS = 0;
        }
    }
}
