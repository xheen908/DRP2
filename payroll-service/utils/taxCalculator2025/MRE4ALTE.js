// DRP2/payroll-service/utils/taxCalculator2025/MRE4ALTE.js

const CONSTANTS = require('./constants');

/**
 * MRE4ALTE - Ermittlung des Altersentlastungsbetrags
 * (§ 39b Absatz 2 Satz 3 EStG)
 * (Seite 17 des Dokuments, Modul "MRE4ALTE")
 *
 * @param {object} state Das aktuelle Zustandsobjekt, das alle internen Felder enthält.
 * @param {object} input Die Eingabeparameter für die Berechnung.
 */
function MRE4ALTE(state, input) {
    console.log("Entering MRE4ALTE module: Ermittlung des Altersentlastungsbetrags.");

    // 1. Prüfung von ALTER1
    if (input.ALTER1 === 0) {
        state.ALTE = 0;
        console.log("Exiting MRE4ALTE module (ALTER1 = 0).");
        return; // Modul beenden
    }

    // 2. Bestimmung von K (Index für Altersentlastungsbetrag-Tabellen)
    if (input.AJAHR < 2006) {
        state.K = 1; // "bis 2005" entspricht K=1 im PAP
    } else if (input.AJAHR > 2058) {
        state.K = 54; // Höchster Index im PAP
    } else {
        state.K = input.AJAHR - 2004; // AJAHR=2006 -> K=2, AJAHR=2025 -> K=21
    }

    // Stellen Sie sicher, dass K ein gültiger Index für die Tabelle ist
    const tabEntry = CONSTANTS.TAB_A_PARAMETER[state.K];
    if (!tabEntry) {
        console.error(`[MRE4ALTE] Ungültiger Index K=${state.K} für TAB_A_PARAMETER. AJAHR=${input.AJAHR}`);
        state.ALTE = 0;
        console.log("Exiting MRE4ALTE module with error (TAB_A_PARAMETER).");
        return;
    }

    // 3. Berechnung der Bemessungsgrundlage (BMG in Euro, Cent)
    // BMG = ZRE4J - ZVBEZJ (beide in Euro Gleitkomma)
    state.BMG = state.ZRE4J - state.ZVBEZJ;
    if (state.BMG < 0) { // BMG darf nicht negativ sein, auch wenn im PAP nicht explizit gezeigt
        state.BMG = 0;
    }

    // 4. Berechnung des Altersentlastungsbetrags (ALTE in Euro, Cent)
    // ALTE = BMG * TAB4(K)
    state.ALTE = state.BMG * tabEntry.SATZ;

    // 5. Berechnung des maximalen Altersentlastungsbetrags (HBALTE in Euro)
    // HBALTE = TAB5(K)
    state.HBALTE = tabEntry.HOECHSTBETRAG_CENT / 100; // Cent -> Euro

    // 6. Begrenzung von ALTE durch HBALTE
    if (state.ALTE > state.HBALTE) {
        state.ALTE = state.HBALTE;
    }
    // ALTE darf nicht negativ sein
    if (state.ALTE < 0) {
        state.ALTE = 0;
    }

    console.log("Exiting MRE4ALTE module.");
}

module.exports = MRE4ALTE;