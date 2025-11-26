// DRP2/payroll-service/utils/taxCalculator2025/MPARA.js

const CONSTANTS = require('./constants'); // Importiere die Konstanten

/**
 * MPARA - Zuweisung von Werten für bestimmte Sozialversicherungsparameter
 * (Seite 14 des Dokuments, Modul "MPARA")
 * Setzt globale Konstanten und beitragssatzabhängige Werte.
 *
 * @param {object} state Das aktuelle Zustandsobjekt, das alle internen Felder enthält.
 * @param {object} input Die Eingabeparameter für die Berechnung.
 */
function MPARA(state, input) {
    console.log("Entering MPARA module: Zuweisung von Sozialversicherungsparametern.");

    // Parameter Rentenversicherung (KRV < 1 bedeutet KRV == 0 im PAP)
    if (input.KRV === 0) { // Arbeitnehmer ist gesetzlich rentenversichert
        state.BBGRV = CONSTANTS.BBGRV_2025_CENT;
        state.RVSATZAN = CONSTANTS.RVSATZ_AN_2025;
    } else {
        state.BBGRV = 0;
        state.RVSATZAN = 0;
    }

    // Parameter Krankenversicherung / Pflegeversicherung (BBG)
    state.BBGKVPV = CONSTANTS.BBGKVPV_2025_CENT;

    // Krankenversicherungssätze
    // KVSATZAN = KVZ/2/100 + 0,07
    state.KVSATZAN = (input.KVZ / 2 / 100) + CONSTANTS.KVSATZ_BASIS_AN_2025;
    
    // KVSATZAG = 0,0125 + 0,07
    state.KVSATZAG = CONSTANTS.KVSATZ_AG_FIX_2025;

    // Pflegeversicherungssätze
    if (input.PVS === 1) { // Besonderheiten in Sachsen (PVS = 1)
        state.PVSATZAN = CONSTANTS.PVSATZ_AN_SACHSEN_2025;
        state.PVSATZAG = CONSTANTS.PVSATZ_AG_SACHSEN_2025;
    } else { // Keine Besonderheiten in Sachsen (PVS = 0)
        state.PVSATZAN = CONSTANTS.PVSATZ_AN_NORMAL_2025;
        state.PVSATZAG = CONSTANTS.PVSATZ_AG_NORMAL_2025;
    }

    // Zuschlag für Kinderlose (PVZ = 1)
    if (input.PVZ === 1) { // Arbeitnehmer hat Zuschlag zur sozialen Pflegeversicherung zu zahlen
        state.PVSATZAN += CONSTANTS.PVSATZ_KINDERLOS_ZUSCHLAG_2025;
    }

    // Beitragsabschläge für Kinder (PVA)
    // PVSATZAN = PVSATZAN – PVA * 0,0025
    state.PVSATZAN -= input.PVA * CONSTANTS.PVSATZ_KINDER_ABSCHLAG_2025;
    // Sicherstellen, dass der Beitragssatz nicht negativ wird
    if (state.PVSATZAN < 0) {
        state.PVSATZAN = 0;
    }

    // Grenzwerte für die Steuerklassen V / VI
    state.W1STKL5 = CONSTANTS.W1STKL5_2025_CENT;
    state.W2STKL5 = CONSTANTS.W2STKL5_2025_CENT;
    state.W3STKL5 = CONSTANTS.W3STKL5_2025_CENT;

    // Grundfreibetrag
    state.GFB = CONSTANTS.GFB_2025_CENT;

    // Freigrenze Solidaritätszuschlag
    state.SOLZFREI = CONSTANTS.SOLZFREI_2025_CENT;

    console.log("Exiting MPARA module.");
}

module.exports = MPARA;