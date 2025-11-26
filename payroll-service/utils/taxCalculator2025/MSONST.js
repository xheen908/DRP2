// DRP2/payroll-service/utils/taxCalculator2025/MSONST.js

const CONSTANTS = require('./constants');
const { LST2025 } = require('./MBERECH'); // LST2025 aus MBERECH importieren

/**
 * MSONST - Ermittlung der Lohnsteuer für sonstige Bezüge
 * (§ 39b Absatz 3 EStG)
 * (Seite 22 des Dokuments, Modul "MSONST")
 *
 * @param {object} state Das aktuelle Zustandsobjekt, das alle internen Felder enthält.
 * @param {object} input Die Eingabeparameter für die Berechnung.
 */
function MSONST(state, input) {
    console.log("Entering MSONST module: Ermittlung der Lohnsteuer für sonstige Bezüge.");

    // 1. Prüfung auf sonstige Bezüge
    if (input.RE4SO === 0) {
        state.ZRE4SO = 0;
        state.JBMG = 0;
        state.ZTABFB = 0;
        state.LSTSO = 0;
        state.STS = 0;
        state.SOLZS = 0;
        state.BKS = 0;
        console.log("Exiting MSONST module (RE4SO = 0).");
        return; // Modul beenden
    }

    // 2. Berechnung von ZRE4SO (zu versteuernde sonstige Bezüge in Euro)
    // Beachten Sie die Einheiten: input.RE4J, input.RE4, input.RE4SO sind in Cent.
    // state.FVBSO, state.ALTE, state.JLFREIB, state.JLHINZU sind in Euro im State gespeichert,
    // daher Multiplikation mit 100 für die Berechnung in Cent im Zähler.
    state.ZRE4SO = (
        input.RE4J - input.RE4 + input.RE4SO -
        (state.FVBSO * 100) - (state.ALTE * 100) -
        (state.JLFREIB * 100) + (state.JLHINZU * 100) // Korrigiert: Verwendung von state.JLFREIB und state.JLHINZU
    ) / 100;

    if (state.ZRE4SO < 0) {
        state.ZRE4SO = 0;
    }

    // 3. Berechnung von JBMG (Jahres-Bemessungsgrundlage für Lohnsteuer in Euro)
    state.JBMG = state.ZRE4SO;

    // 4. Berechnung von ZTABFB (Zu versteuerndes Einkommen für Lohnsteuerberechnung in Euro)
    state.ZTABFB = state.JBMG - state.ANP - state.SAP;

    if (state.ZTABFB < 0) {
        state.ZTABFB = 0;
    }

    // 5. Berechnung der Lohnsteuer für sonstige Bezüge (LSTSO in Euro)
    state.LSTSO = LST2025(state.ZTABFB); // LST2025 wird mit ZTABFB aufgerufen.

    // 6. Berechnung des Solidaritätszuschlags (SOLZS) und der Kirchensteuer (BKS) für sonstige Bezüge
    state.SOLZS = 0;
    state.BKS = 0;
    state.STS = 0; 

    console.log("Exiting MSONST module.");
}

module.exports = MSONST;