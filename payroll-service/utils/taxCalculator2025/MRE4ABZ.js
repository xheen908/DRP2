// DRP2/payroll-service/utils/taxCalculator2025/MRE4ABZ.js

/**
 * MRE4ABZ - Ermittlung der abziehbaren Vorsorgeaufwendungen und des Versorgungsfreibetrags bei mehreren Versorgungsbezügen
 * (Seite 20 des Dokuments, Modul "MRE4ABZ")
 *
 * @param {object} state Das aktuelle Zustandsobjekt, das alle internen Felder enthält.
 * @param {object} input Die Eingabeparameter für die Berechnung.
 */
function MRE4ABZ(state, input) {
    console.log("Entering MRE4ABZ module: Ermittlung der abziehbaren Vorsorgeaufwendungen.");

    // 1. Arbeitnehmer-Pauschbetrag (ANP in Euro) und Versorgungsbezüge (ZVBEZ in Euro)
    state.ANP = 1200.00; // Arbeitnehmer-Pauschbetrag laut PAP
    state.ZVBEZ = input.VBEZ / 100 - state.FVB; // input.VBEZ in Cent, state.FVB in Euro

    if (state.ZVBEZ < 0) {
        state.ZVBEZ = 0;
    }

    // 2. Berechnung von ZRE4 (Summe des Jahresarbeitslohns in Euro)
    // ZRE4 = RE4 - FVB - ALTE - JLFREIB (alles in Euro)
    // input.RE4 in Cent, state.JLFREIB in Euro (aus MRE4JL)
    state.ZRE4 = (input.RE4 / 100) - state.FVB - state.ALTE - state.JLFREIB;

    if (state.ZRE4 < 0) {
        state.ZRE4 = 0;
    }

    // 3. Berechnung von ZRE4VP (für Vorsorgepauschale maßgebender Arbeitslohn des Jahres in Euro)
    // ZRE4VP = RE4J - FVB - ALTE - JLFREIB
    // input.RE4J in Cent, state.JLFREIB in Euro (aus MRE4JL)
    state.ZRE4VP = (input.RE4J / 100) - state.FVB - state.ALTE - state.JLFREIB;

    if (state.ZRE4VP < 0) {
        state.ZRE4VP = 0;
    }

    // 4. Sonderausgaben-Pauschbetrag (SAP in Euro)
    state.SAP = 36.00; // Standard Sonderausgaben-Pauschbetrag laut PAP

    // 5. Anwendung des Jahresfreibetrags (JLFREIB) und Hinzurechnungsbetrags (JLHINZU)
    // state.JLHINZU und state.JLFREIB sind in Euro (aus MRE4JL)
    state.ZRE4 = state.ZRE4 - state.JLHINZU + state.JLFREIB;
    state.ZRE4VP = state.ZRE4VP - state.JLHINZU + state.JLFREIB;

    if (state.ZRE4 < 0) {
        state.ZRE4 = 0;
    }
    if (state.ZRE4VP < 0) {
        state.ZRE4VP = 0;
    }

    console.log("Exiting MRE4ABZ module.");
}

module.exports = MRE4ABZ;