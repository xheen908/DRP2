#include "pap2026/pap2026.hpp"
#include <cmath>
#include <algorithm>

void Lohnsteuer2026::MRE4() {
    static const double TAB1[] = { 0.0, 0.400, 0.384, 0.368, 0.352, 0.336, 0.320, 0.304, 0.288, 0.272, 0.256, 0.240, 0.224, 0.208, 0.192, 0.176, 0.160, 0.152, 0.144, 0.140, 0.136, 0.132, 0.128, 0.124, 0.120, 0.116, 0.112, 0.108, 0.104, 0.100, 0.096, 0.092, 0.088, 0.084, 0.080, 0.076, 0.072, 0.068, 0.064, 0.060, 0.056, 0.052, 0.048, 0.044, 0.040, 0.036, 0.032, 0.028, 0.024, 0.020, 0.016, 0.012, 0.008, 0.004, 0.000 };
    static const double TAB2[] = { 0.0, 3000.0, 2880.0, 2760.0, 2640.0, 2520.0, 2400.0, 2280.0, 2160.0, 2040.0, 1920.0, 1800.0, 1680.0, 1560.0, 1440.0, 1320.0, 1200.0, 1140.0, 1080.0, 1050.0, 1020.0, 990.0, 960.0, 930.0, 900.0, 870.0, 840.0, 810.0, 780.0, 750.0, 720.0, 690.0, 660.0, 630.0, 600.0, 570.0, 540.0, 510.0, 480.0, 450.0, 420.0, 390.0, 360.0, 330.0, 300.0, 270.0, 240.0, 210.0, 180.0, 150.0, 120.0, 90.0, 60.0, 30.0, 0.0 };
    static const double TAB3[] = { 0.0, 900.0, 864.0, 828.0, 792.0, 756.0, 720.0, 684.0, 648.0, 612.0, 576.0, 540.0, 504.0, 468.0, 432.0, 396.0, 360.0, 342.0, 324.0, 315.0, 306.0, 297.0, 288.0, 279.0, 270.0, 261.0, 252.0, 243.0, 234.0, 225.0, 216.0, 207.0, 198.0, 189.0, 180.0, 171.0, 162.0, 153.0, 144.0, 135.0, 126.0, 117.0, 108.0, 99.0, 90.0, 81.0, 72.0, 63.0, 54.0, 45.0, 36.0, 27.0, 18.0, 9.0, 0.0 };

    if (ZVBEZJ < 0.0001) {
        FVB = 0;
        FVBZ = 0;
        FVBSO = 0;
        FVBZSO = 0;
    } else {
        if (VJAHR < 2006) {
            J = 1;
        } else if (VJAHR > 2058) {
            J = 54;
        } else {
            J = VJAHR - 2004;
        }
        
        if (LZZ == 1) {
            VBEZB = (double)VBEZM * (double)ZMVB + (double)VBEZS;
            HFVB = floor(TAB2[J] / 12.0 * (double)ZMVB * 100.0) / 100.0;
            FVBZ = floor(TAB3[J] / 12.0 * (double)ZMVB * 100.0) / 100.0;
        } else {
            VBEZB = (double)VBEZM * 12.0 + (double)VBEZS;
            HFVB = TAB2[J];
            FVBZ = TAB3[J];
        }
        
        FVB = floor(VBEZB * TAB1[J] * 100.0) / 100.0;
        if (FVB > HFVB) {
            FVB = HFVB;
        }
        if (FVB > ZVBEZJ) {
            FVB = ZVBEZJ;
        }
        
        HFVBZ = ZVBEZJ - FVB;
        if (FVBZ > HFVBZ) {
            FVBZ = HFVBZ;
        }
        
        FVBSO = floor(FVB * 100.0 + (double)VBEZBSO * TAB1[J]) / 100.0;
        if (FVBSO > TAB2[J]) {
            FVBSO = TAB2[J];
        }
        HFVBZSO = (VBEZB + (double)VBEZBSO) / 100.0 - FVBSO;
        FVBZSO = floor(FVBZ * 100.0 + (double)VBEZBSO) / 100.0;
        if (FVBZSO > HFVBZSO) {
            FVBZSO = HFVBZSO;
        }
        if (FVBZSO > TAB3[J]) {
            FVBZSO = TAB3[J];
        }
    }
    MRE4ALTE();
}
