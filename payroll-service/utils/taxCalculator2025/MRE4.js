// DRP2/payroll-service/utils/taxCalculator2025/MRE4.js

const CONSTANTS = require('./constants');
const MRE4ALTE = require('./MRE4ALTE'); // MRE4ALTE wird von MRE4 aufgerufen

/**
 * MRE4 - Ermittlung der Freibeträge für Versorgungsbezüge, Altersentlastungsbetrag
 * (§ 39b Absatz 2 Satz 3 EStG)
 * (Seite 16 des Dokuments, Modul "MRE4")
 *
 * @param {object} state Das aktuelle Zustandsobjekt, das alle internen Felder enthält.
 * @param {object} input Die Eingabeparameter für die Berechnung.
 */
function MRE4(state, input) {
    console.log("Entering MRE4 module: Ermittlung der Freibeträge für Versorgungsbezüge und Altersentlastungsbetrag.");

    // 1. Bestimmung von J (Index für Versorgungsparameter-Tabellen)
    if (input.VJAHR < 2006) {
        state.J = 1; // "bis 2005" entspricht J=1 im PAP
    } else if (input.VJAHR > 2058) {
        state.J = 54; // Höchster Index im PAP
    } else {
        state.J = input.VJAHR - 2004; // VJAHR=2006 -> J=2, VJAHR=2025 -> J=21
    }

    // Stellen Sie sicher, dass J ein gültiger Index für die Tabelle ist
    const tabEntry = CONSTANTS.TAB_V_PARAMETER[state.J];
    if (!tabEntry) {
        console.error(`[MRE4] Ungültiger Index J=${state.J} für TAB_V_PARAMETER. VJAHR=${input.VJAHR}`);
        // Fehlerbehandlung: Standardwerte setzen oder Fehler werfen
        state.FVB = 0;
        state.FVBZ = 0;
        state.HFVB = 0;
        state.HFVBZ = 0;
        state.FVBSO = 0;
        state.FVBZSO = 0;
        // Dennoch MRE4ALTE aufrufen, da es unabhängig sein kann
        MRE4ALTE(state, input);
        console.log("Exiting MRE4 module with error (TAB_V_PARAMETER).");
        return;
    }

    // 2. Berechnung der Bemessungsgrundlage für Versorgungsbezüge (VBEZB in Cent)
    if (input.LZZ === 1) { // Jahresberechnung
        state.VBEZB = input.VBEZM * input.ZMVB + input.VBEZS;
    } else { // Unterjährige Berechnung
        state.VBEZB = input.VBEZM * 12 + input.VBEZS;
    }

    // 3. Berechnung des Versorgungsfreibetrags (FVB in Euro, Cent)
    // FVB = VBEZB * TAB1(J) / 100
    state.FVB = (state.VBEZB * tabEntry.SATZ) / 100; // VBEZB ist Cent, SATZ ist Dezimal, Ergebnis in Euro

    // 4. Berechnung des maximalen Versorgungsfreibetrags (HFVB in Euro, Cent)
    // HFVB = TAB2(J) bzw. TAB2(J) / 12 * ZMVB
    if (input.LZZ === 1) {
        state.HFVB = tabEntry.HOECHSTBETRAG_CENT / 100; // Cent -> Euro
    } else {
        state.HFVB = (tabEntry.HOECHSTBETRAG_CENT / 100 / 12) * input.ZMVB;
    }

    // 5. Begrenzung von FVB durch HFVB
    if (state.FVB > state.HFVB) {
        state.FVB = state.HFVB;
    }

    // 6. Begrenzung von FVB durch ZVBEZJ
    // ZVBEZJ ist bereits in Euro (Gleitkomma)
    if (state.FVB > state.ZVBEZJ) {
        state.FVB = state.ZVBEZJ;
    }
    // FVB darf nicht negativ sein (nicht explizit im PAP-Flussdiagramm auf S.16, aber logisch notwendig)
    if (state.FVB < 0) {
        state.FVB = 0;
    }

    // 7. Berechnung des Zuschlags zum Versorgungsfreibetrag (FVBZ in Euro, Cent)
    // FVBZ = TAB3(J) bzw. TAB3(J) / 12 * ZMVB
    if (input.LZZ === 1) {
        state.FVBZ = tabEntry.ZUSCHLAG_CENT / 100; // Cent -> Euro
    } else {
        state.FVBZ = (tabEntry.ZUSCHLAG_CENT / 100 / 12) * input.ZMVB;
    }

    // 8. Berechnung von HFVBZ (maximaler Zuschlag in Euro, Cent)
    // HFVBZ = ZVBEZJ - FVB
    state.HFVBZ = state.ZVBEZJ - state.FVB;

    // 9. Begrenzung von FVBZ durch HFVBZ
    if (state.FVBZ > state.HFVBZ) {
        state.FVBZ = state.HFVBZ;
    }
    // FVBZ darf nicht negativ sein
    if (state.FVBZ < 0) {
        state.FVBZ = 0;
    }
    
    // --- Berechnung FVBSO und FVBZSO (für Sonstige Bezüge) ---
    // Diese Berechnungen sind im PAP-Flussdiagramm auf Seite 16 unter "FVBSO = FVB + VBEZBSO * TAB1(J) / 100"
    // Es wird angenommen, dass input.VBEZBSO in Cent vorliegt.

    // FVBSO (Versorgungsfreibetrag für sonstige Bezüge in Euro, Cent)
    // FVBSO = FVB + VBEZBSO * TAB1(J) / 100
    state.FVBSO = state.FVB + (input.VBEZBSO * tabEntry.SATZ) / 100;

    // Begrenzung von FVBSO durch TAB2(J)
    // FVBSO > TAB2(J)
    if (state.FVBSO > (tabEntry.HOECHSTBETRAG_CENT / 100)) {
        state.FVBSO = tabEntry.HOECHSTBETRAG_CENT / 100; // Cent -> Euro
    }
    if (state.FVBSO < 0) {
        state.FVBSO = 0;
    }

    // FVBZSO (Zuschlag zum Versorgungsfreibetrag für sonstige Bezüge in Euro, Cent)
    // HFVBZSO = (VBEZB + VBEZBSO) / 100 - FVBSO
    state.HFVBZSO = (state.VBEZB + input.VBEZBSO) / 100 - state.FVBSO;

    // FVBZSO = FVBZ + VBEZBSO / 100
    state.FVBZSO = state.FVBZ + (input.VBEZBSO / 100);

    // Begrenzung von FVBZSO durch HFVBZSO
    if (state.FVBZSO > state.HFVBZSO) {
        state.FVBZSO = state.HFVBZSO;
    }

    // Begrenzung von FVBZSO durch TAB3(J)
    // FVBZSO > TAB3(J)
    if (state.FVBZSO > (tabEntry.ZUSCHLAG_CENT / 100)) {
        state.FVBZSO = tabEntry.ZUSCHLAG_CENT / 100; // Cent -> Euro
    }
    if (state.FVBZSO < 0) {
        state.FVBZSO = 0;
    }

    // 11. Aufruf von MRE4ALTE
    MRE4ALTE(state, input);

    console.log("Exiting MRE4 module.");
}

module.exports = MRE4;