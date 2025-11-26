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
    SOLZFREI_2025_CENT: 1813000 // 18.130 Euro
};