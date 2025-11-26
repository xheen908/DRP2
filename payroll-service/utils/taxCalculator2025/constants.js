// DRP2/payroll-service/utils/taxCalculator2025/constants.js

module.exports = {
    // Beitragsbemessungsgrenzen in Cent
    BBGRV_2025_CENT: 9660000, // 96.600 Euro
    BBGKVPV_2025_CENT: 6615000, // 66.150 Euro

    // Beitragssätze (Dezimalwerte)
    RVSATZ_AN_2025: 0.093, // Arbeitnehmeranteil Rentenversicherung
    KVSATZ_AG_FIX_2025: 0.0125 + 0.07, // Arbeitgeberanteil Krankenversicherung (fester Teil + hälftiger Durchschnitts-Zusatzbeitrag)
    KVSATZ_BASIS_AN_2025: 0.07, // Basis-Arbeitnehmeranteil Krankenversicherung
    PVSATZ_AN_SACHSEN_2025: 0.018, // Arbeitnehmeranteil Pflegeversicherung Sachsen
    PVSATZ_AG_SACHSEN_2025: 0.018, // Arbeitgeberanteil Pflegeversicherung Sachsen
    PVSATZ_AN_NORMAL_2025: 0.023, // Arbeitnehmeranteil Pflegeversicherung normal
    PVSATZ_AG_NORMAL_2025: 0.013, // Arbeitgeberanteil Pflegeversicherung normal
    PVSATZ_KINDERLOS_ZUSCHLAG_2025: 0.006, // Zuschlag für Kinderlose
    PVSATZ_KINDER_ABSCHLAG_2025: 0.0025, // Beitragsabschlag pro Kind

    // Grenzwerte für Steuerklassen V/VI in Cent
    W1STKL5_2025_CENT: 1343200, // 13.432 Euro
    W2STKL5_2025_CENT: 3338000, // 33.380 Euro
    W3STKL5_2025_CENT: 22226000, // 222.260 Euro

    // Grundfreibetrag in Cent
    GFB_2025_CENT: 1178400, // 11.784 Euro

    // Freigrenze Solidaritätszuschlag in Cent
    SOLZFREI_2025_CENT: 1813000, // 18.130 Euro

    // --- Tabellen für Versorgungsbezüge (§ 19 Absatz 2 EStG) - Seite 18 PAP ---
    // Der Index 'J' entspricht hier dem Offset vom Basisjahr
    // Beispiel: J=1 für 'bis 2005' oder '2006' je nach Definition
    // Im PAP ist J = VJAHR - 2004 für den "Satz" und "Höchstbetrag"
    // und J = VJAHR - 2005 für den "Zuschlag" im Kontext Altersentlastungsbetrag.
    // Für Versorgungsbezüge wird J = VJAHR - 2004 bzw. J=1 für bis 2005 verwendet.
    TAB_V_PARAMETER: [
        // Index 0 wird ungenutzt gelassen, da PAP J bei 1 beginnt
        null, 
        // J=1 (bis 2005)
        { JAHR: 'bis 2005', SATZ: 0.400, HOECHSTBETRAG_CENT: 300000, ZUSCHLAG_CENT: 90000 },
        // J=2 (2006)
        { JAHR: '2006', SATZ: 0.384, HOECHSTBETRAG_CENT: 288000, ZUSCHLAG_CENT: 86400 },
        // J=3 (2007)
        { JAHR: '2007', SATZ: 0.368, HOECHSTBETRAG_CENT: 276000, ZUSCHLAG_CENT: 82800 },
        // J=4 (2008)
        { JAHR: '2008', SATZ: 0.352, HOECHSTBETRAG_CENT: 264000, ZUSCHLAG_CENT: 79200 },
        // J=5 (2009)
        { JAHR: '2009', SATZ: 0.336, HOECHSTBETRAG_CENT: 252000, ZUSCHLAG_CENT: 75600 },
        // J=6 (2010)
        { JAHR: '2010', SATZ: 0.320, HOECHSTBETRAG_CENT: 240000, ZUSCHLAG_CENT: 72000 },
        // J=7 (2011)
        { JAHR: '2011', SATZ: 0.304, HOECHSTBETRAG_CENT: 228000, ZUSCHLAG_CENT: 68400 },
        // J=8 (2012)
        { JAHR: '2012', SATZ: 0.288, HOECHSTBETRAG_CENT: 216000, ZUSCHLAG_CENT: 64800 },
        // J=9 (2013)
        { JAHR: '2013', SATZ: 0.272, HOECHSTBETRAG_CENT: 204000, ZUSCHLAG_CENT: 61200 },
        // J=10 (2014)
        { JAHR: '2014', SATZ: 0.256, HOECHSTBETRAG_CENT: 192000, ZUSCHLAG_CENT: 57600 },
        // J=11 (2015)
        { JAHR: '2015', SATZ: 0.240, HOECHSTBETRAG_CENT: 180000, ZUSCHLAG_CENT: 54000 },
        // J=12 (2016)
        { JAHR: '2016', SATZ: 0.224, HOECHSTBETRAG_CENT: 168000, ZUSCHLAG_CENT: 50400 },
        // J=13 (2017)
        { JAHR: '2017', SATZ: 0.208, HOECHSTBETRAG_CENT: 156000, ZUSCHLAG_CENT: 46800 },
        // J=14 (2018)
        { JAHR: '2018', SATZ: 0.192, HOECHSTBETRAG_CENT: 144000, ZUSCHLAG_CENT: 43200 },
        // J=15 (2019)
        { JAHR: '2019', SATZ: 0.176, HOECHSTBETRAG_CENT: 132000, ZUSCHLAG_CENT: 39600 },
        // J=16 (2020)
        { JAHR: '2020', SATZ: 0.160, HOECHSTBETRAG_CENT: 120000, ZUSCHLAG_CENT: 36000 },
        // J=17 (2021)
        { JAHR: '2021', SATZ: 0.152, HOECHSTBETRAG_CENT: 114000, ZUSCHLAG_CENT: 34200 },
        // J=18 (2022)
        { JAHR: '2022', SATZ: 0.144, HOECHSTBETRAG_CENT: 108000, ZUSCHLAG_CENT: 32400 },
        // J=19 (2023)
        { JAHR: '2023', SATZ: 0.140, HOECHSTBETRAG_CENT: 105000, ZUSCHLAG_CENT: 31500 },
        // J=20 (2024)
        { JAHR: '2024', SATZ: 0.136, HOECHSTBETRAG_CENT: 102000, ZUSCHLAG_CENT: 30600 },
        // J=21 (2025)
        { JAHR: '2025', SATZ: 0.132, HOECHSTBETRAG_CENT: 99000, ZUSCHLAG_CENT: 29700 },
        // J=22 (2026)
        { JAHR: '2026', SATZ: 0.128, HOECHSTBETRAG_CENT: 96000, ZUSCHLAG_CENT: 28800 },
        // J=23 (2027)
        { JAHR: '2027', SATZ: 0.124, HOECHSTBETRAG_CENT: 93000, ZUSCHLAG_CENT: 27900 },
        // J=24 (2028)
        { JAHR: '2028', SATZ: 0.120, HOECHSTBETRAG_CENT: 90000, ZUSCHLAG_CENT: 27000 },
        // J=25 (2029)
        { JAHR: '2029', SATZ: 0.116, HOECHSTBETRAG_CENT: 87000, ZUSCHLAG_CENT: 26100 },
        // J=26 (2030)
        { JAHR: '2030', SATZ: 0.112, HOECHSTBETRAG_CENT: 84000, ZUSCHLAG_CENT: 25200 },
        // J=27 (2031)
        { JAHR: '2031', SATZ: 0.108, HOECHSTBETRAG_CENT: 81000, ZUSCHLAG_CENT: 24300 },
        // J=28 (2032)
        { JAHR: '2032', SATZ: 0.104, HOECHSTBETRAG_CENT: 78000, ZUSCHLAG_CENT: 23400 },
        // J=29 (2033)
        { JAHR: '2033', SATZ: 0.100, HOECHSTBETRAG_CENT: 75000, ZUSCHLAG_CENT: 22500 },
        // J=30 (2034)
        { JAHR: '2034', SATZ: 0.096, HOECHSTBETRAG_CENT: 72000, ZUSCHLAG_CENT: 21600 },
        // J=31 (2035)
        { JAHR: '2035', SATZ: 0.092, HOECHSTBETRAG_CENT: 69000, ZUSCHLAG_CENT: 20700 },
        // J=32 (2036)
        { JAHR: '2036', SATZ: 0.088, HOECHSTBETRAG_CENT: 66000, ZUSCHLAG_CENT: 19800 },
        // J=33 (2037)
        { JAHR: '2037', SATZ: 0.084, HOECHSTBETRAG_CENT: 63000, ZUSCHLAG_CENT: 18900 },
        // J=34 (2038)
        { JAHR: '2038', SATZ: 0.080, HOECHSTBETRAG_CENT: 60000, ZUSCHLAG_CENT: 18000 },
        // J=35 (2039)
        { JAHR: '2039', SATZ: 0.076, HOECHSTBETRAG_CENT: 57000, ZUSCHLAG_CENT: 17100 },
        // J=36 (2040)
        { JAHR: '2040', SATZ: 0.072, HOECHSTBETRAG_CENT: 54000, ZUSCHLAG_CENT: 16200 },
        // J=37 (2041)
        { JAHR: '2041', SATZ: 0.068, HOECHSTBETRAG_CENT: 51000, ZUSCHLAG_CENT: 15300 },
        // J=38 (2042)
        { JAHR: '2042', SATZ: 0.064, HOECHSTBETRAG_CENT: 48000, ZUSCHLAG_CENT: 14400 },
        // J=39 (2043)
        { JAHR: '2043', SATZ: 0.060, HOECHSTBETRAG_CENT: 45000, ZUSCHLAG_CENT: 13500 },
        // J=40 (2044)
        { JAHR: '2044', SATZ: 0.056, HOECHSTBETRAG_CENT: 42000, ZUSCHLAG_CENT: 12600 },
        // J=41 (2045)
        { JAHR: '2045', SATZ: 0.052, HOECHSTBETRAG_CENT: 39000, ZUSCHLAG_CENT: 11700 },
        // J=42 (2046)
        { JAHR: '2046', SATZ: 0.048, HOECHSTBETRAG_CENT: 36000, ZUSCHLAG_CENT: 10800 },
        // J=43 (2047)
        { JAHR: '2047', SATZ: 0.044, HOECHSTBETRAG_CENT: 33000, ZUSCHLAG_CENT: 9900 },
        // J=44 (2048)
        { JAHR: '2048', SATZ: 0.040, HOECHSTBETRAG_CENT: 30000, ZUSCHLAG_CENT: 9000 },
        // J=45 (2049)
        { JAHR: '2049', SATZ: 0.036, HOECHSTBETRAG_CENT: 27000, ZUSCHLAG_CENT: 8100 },
        // J=46 (2050)
        { JAHR: '2050', SATZ: 0.032, HOECHSTBETRAG_CENT: 24000, ZUSCHLAG_CENT: 7200 },
        // J=47 (2051)
        { JAHR: '2051', SATZ: 0.028, HOECHSTBETRAG_CENT: 21000, ZUSCHLAG_CENT: 6300 },
        // J=48 (2052)
        { JAHR: '2052', SATZ: 0.024, HOECHSTBETRAG_CENT: 18000, ZUSCHLAG_CENT: 5400 },
        // J=49 (2053)
        { JAHR: '2053', SATZ: 0.020, HOECHSTBETRAG_CENT: 15000, ZUSCHLAG_CENT: 4500 },
        // J=50 (2054)
        { JAHR: '2054', SATZ: 0.016, HOECHSTBETRAG_CENT: 12000, ZUSCHLAG_CENT: 3600 },
        // J=51 (2055)
        { JAHR: '2055', SATZ: 0.012, HOECHSTBETRAG_CENT: 9000, ZUSCHLAG_CENT: 2700 },
        // J=52 (2056)
        { JAHR: '2056', SATZ: 0.008, HOECHSTBETRAG_CENT: 6000, ZUSCHLAG_CENT: 1800 },
        // J=53 (2057)
        { JAHR: '2057', SATZ: 0.004, HOECHSTBETRAG_CENT: 3000, ZUSCHLAG_CENT: 900 },
        // J=54 (2058)
        { JAHR: '2058', SATZ: 0.000, HOECHSTBETRAG_CENT: 0, ZUSCHLAG_CENT: 0 }
    ],

    // --- Tabellen für Altersentlastungsbetrag (§ 24a EStG) - Seite 19 PAP ---
    // Der Index 'K' entspricht hier dem Offset vom Basisjahr
    // K = AJAHR - 2004 bzw. K=1 für bis 2005
    TAB_A_PARAMETER: [
        // Index 0 ungenutzt
        null,
        // K=1 (bis 2005)
        { JAHR: 'bis 2005', SATZ: 0.400, HOECHSTBETRAG_CENT: 190000 },
        // K=2 (2006)
        { JAHR: '2006', SATZ: 0.384, HOECHSTBETRAG_CENT: 182400 },
        // K=3 (2007)
        { JAHR: '2007', SATZ: 0.368, HOECHSTBETRAG_CENT: 174800 },
        // K=4 (2008)
        { JAHR: '2008', SATZ: 0.352, HOECHSTBETRAG_CENT: 167200 },
        // K=5 (2009)
        { JAHR: '2009', SATZ: 0.336, HOECHSTBETRAG_CENT: 159600 },
        // K=6 (2010)
        { JAHR: '2010', SATZ: 0.320, HOECHSTBETRAG_CENT: 152000 },
        // K=7 (2011)
        { JAHR: '2011', SATZ: 0.304, HOECHSTBETRAG_CENT: 144400 },
        // K=8 (2012)
        { JAHR: '2012', SATZ: 0.288, HOECHSTBETRAG_CENT: 136800 },
        // K=9 (2013)
        { JAHR: '2013', SATZ: 0.272, HOECHSTBETRAG_CENT: 129200 },
        // K=10 (2014)
        { JAHR: '2014', SATZ: 0.256, HOECHSTBETRAG_CENT: 121600 },
        // K=11 (2015)
        { JAHR: '2015', SATZ: 0.240, HOECHSTBETRAG_CENT: 114000 },
        // K=12 (2016)
        { JAHR: '2016', SATZ: 0.224, HOECHSTBETRAG_CENT: 106400 },
        // K=13 (2017)
        { JAHR: '2017', SATZ: 0.208, HOECHSTBETRAG_CENT: 98800 },
        // K=14 (2018)
        { JAHR: '2018', SATZ: 0.192, HOECHSTBETRAG_CENT: 91200 },
        // K=15 (2019)
        { JAHR: '2019', SATZ: 0.176, HOECHSTBETRAG_CENT: 83600 },
        // K=16 (2020)
        { JAHR: '2020', SATZ: 0.160, HOECHSTBETRAG_CENT: 76000 },
        // K=17 (2021)
        { JAHR: '2021', SATZ: 0.152, HOECHSTBETRAG_CENT: 72200 },
        // K=18 (2022)
        { JAHR: '2022', SATZ: 0.144, HOECHSTBETRAG_CENT: 68400 },
        // K=19 (2023)
        { JAHR: '2023', SATZ: 0.140, HOECHSTBETRAG_CENT: 66500 },
        // K=20 (2024)
        { JAHR: '2024', SATZ: 0.136, HOECHSTBETRAG_CENT: 64600 },
        // K=21 (2025)
        { JAHR: '2025', SATZ: 0.132, HOECHSTBETRAG_CENT: 62700 },
        // K=22 (2026)
        { JAHR: '2026', SATZ: 0.128, HOECHSTBETRAG_CENT: 60800 },
        // K=23 (2027)
        { JAHR: '2027', SATZ: 0.124, HOECHSTBETRAG_CENT: 58900 },
        // K=24 (2028)
        { JAHR: '2028', SATZ: 0.120, HOECHSTBETRAG_CENT: 57000 },
        // K=25 (2029)
        { JAHR: '2029', SATZ: 0.116, HOECHSTBETRAG_CENT: 55100 },
        // K=26 (2030)
        { JAHR: '2030', SATZ: 0.112, HOECHSTBETRAG_CENT: 53200 },
        // K=27 (2031)
        { JAHR: '2031', SATZ: 0.108, HOECHSTBETRAG_CENT: 51300 },
        // K=28 (2032)
        { JAHR: '2032', SATZ: 0.104, HOECHSTBETRAG_CENT: 49400 },
        // K=29 (2033)
        { JAHR: '2033', SATZ: 0.100, HOECHSTBETRAG_CENT: 47500 },
        // K=30 (2034)
        { JAHR: '2034', SATZ: 0.096, HOECHSTBETRAG_CENT: 45600 },
        // K=31 (2035)
        { JAHR: '2035', SATZ: 0.092, HOECHSTBETRAG_CENT: 43700 },
        // K=32 (2036)
        { JAHR: '2036', SATZ: 0.088, HOECHSTBETRAG_CENT: 41800 },
        // K=33 (2037)
        { JAHR: '2037', SATZ: 0.084, HOECHSTBETRAG_CENT: 39900 },
        // K=34 (2038)
        { JAHR: '2038', SATZ: 0.080, HOECHSTBETRAG_CENT: 38000 },
        // K=35 (2039)
        { JAHR: '2039', SATZ: 0.076, HOECHSTBETRAG_CENT: 36100 },
        // K=36 (2040)
        { JAHR: '2040', SATZ: 0.072, HOECHSTBETRAG_CENT: 34200 },
        // K=37 (2041)
        { JAHR: '2041', SATZ: 0.068, HOECHSTBETRAG_CENT: 32300 },
        // K=38 (2042)
        { JAHR: '2042', SATZ: 0.064, HOECHSTBETRAG_CENT: 30400 },
        // K=39 (2043)
        { JAHR: '2043', SATZ: 0.060, HOECHSTBETRAG_CENT: 28500 },
        // K=40 (2044)
        { JAHR: '2044', SATZ: 0.056, HOECHSTBETRAG_CENT: 26600 },
        // K=41 (2045)
        { JAHR: '2045', SATZ: 0.052, HOECHSTBETRAG_CENT: 24700 },
        // K=42 (2046)
        { JAHR: '2046', SATZ: 0.048, HOECHSTBETRAG_CENT: 22800 },
        // K=43 (2047)
        { JAHR: '2047', SATZ: 0.044, HOECHSTBETRAG_CENT: 20900 },
        // K=44 (2048)
        { JAHR: '2048', SATZ: 0.040, HOECHSTBETRAG_CENT: 19000 },
        // K=45 (2049)
        { JAHR: '2049', SATZ: 0.036, HOECHSTBETRAG_CENT: 17100 },
        // K=46 (2050)
        { JAHR: '2050', SATZ: 0.032, HOECHSTBETRAG_CENT: 15200 },
        // K=47 (2051)
        { JAHR: '2051', SATZ: 0.028, HOECHSTBETRAG_CENT: 13300 },
        // K=48 (2052)
        { JAHR: '2052', SATZ: 0.024, HOECHSTBETRAG_CENT: 11400 },
        // K=49 (2053)
        { JAHR: '2053', SATZ: 0.020, HOECHSTBETRAG_CENT: 9500 },
        // K=50 (2054)
        { JAHR: '2054', SATZ: 0.016, HOECHSTBETRAG_CENT: 7600 },
        // K=51 (2055)
        { JAHR: '2055', SATZ: 0.012, HOECHSTBETRAG_CENT: 5700 },
        // K=52 (2056)
        { JAHR: '2056', SATZ: 0.008, HOECHSTBETRAG_CENT: 3800 },
        // K=53 (2057)
        { JAHR: '2057', SATZ: 0.004, HOECHSTBETRAG_CENT: 1900 },
        // K=54 (2058)
        { JAHR: '2058', SATZ: 0.000, HOECHSTBETRAG_CENT: 0 }
    ]
};