// DRP2/payroll-service/utils/taxCalculator2025/MBEZUG.js

const CONSTANTS = require('./constants');

/**
 * MBEZUG - Ermittlung des geldwerten Vorteils aus Sachbezügen und des Versorgungsfreibetrags bei Sachbezügen
 * (Seite 23 des Dokuments, Modul "MBEZUG")
 *
 * @param {object} state Das aktuelle Zustandsobjekt, das alle internen Felder enthält.
 * @param {object} input Die Eingabeparameter für die Berechnung.
 */
function MBEZUG(state, input) {
    console.log("Entering MBEZUG module: Ermittlung des geldwerten Vorteils aus Sachbezügen.");

    // 1. Werbungskosten-Pauschbetrag für Versorgungsbezüge (WVFRB)
    state.WVFRB = 102.00; // Laut PAP

    // 2. Berechnung des Jahresarbeitslohns ohne Sachbezüge für Vergleich (ANRE4, ANRE4PV)
    // Diese Werte werden für spätere Vergleiche mit den Beitragsbemessungsgrenzen benötigt.
    // Hier werden die Eingangsgrößen von RE4J und ZVBEZJ (aus MRE4JL) verwendet.
    // Umrechnung von Cent in Euro, da ANRE4 und ANRE4PV in Euro sein sollen.
    state.ANRE4 = state.ZRE4J + state.ZVBEZJ - state.JLFREIB; // RE4J + VBEZJ - JLFREIB (alles in Euro)
    if (state.ANRE4 < 0) {
        state.ANRE4 = 0;
    }

    state.ANRE4PV = state.ZRE4J - state.JLFREIB; // RE4J - JLFREIB (alles in Euro)
    if (state.ANRE4PV < 0) {
        state.ANRE4PV = 0;
    }

    // 3. Hinzurechnung der Sachbezüge (SACHBEZUG)
    if (input.SACHBEZUG > 0) {
        // input.RE4 und input.RE4J sind Cent-Werte, daher direkte Addition
        // state.ZRE4 und state.ZRE4VP sind bereits Euro-Werte, daher Umrechnung
        state.RE4 = input.RE4 + input.SACHBEZUG;
        state.RE4J = input.RE4J + input.SACHBEZUG;
        state.ZRE4 = state.ZRE4 + (input.SACHBEZUG / 100);
        state.ZRE4VP = state.ZRE4VP + (input.SACHBEZUG / 100);
    }
    
    // Sicherstellen, dass ZRE4 und ZRE4VP nicht negativ werden können
    if (state.ZRE4 < 0) {
        state.ZRE4 = 0;
    }
    if (state.ZRE4VP < 0) {
        state.ZRE4VP = 0;
    }

    // 4. Begrenzung des Versorgungsfreibetrags für Sachbezüge (FVBSO, FVBZSO)
    // Dieser Schritt ist komplexer und basiert auf den Berechnungen in MRE4 (Seite 19 des PAP).
    // Da FVB, FVBZ, FVBSO, FVBZSO bereits durch MRE4 berechnet wurden,
    // und MRE4 bereits die hochgerechneten Jahreswerte verwendet,
    // sind die Anpassungen der Sachbezüge auf RE4 und RE4J ausreichend.
    // Die erneute Berechnung der Freibeträge ist in MRE4JL bereits berücksichtigt,
    // da RE4 und VBEZ als Eingaben an MRE4JL übergeben werden und MRE4JL dann
    // die hochgerechneten Jahreswerte (ZRE4J, ZVBEZJ) an MRE4 weitergibt.
    // Hier ist keine explizite Anpassung von FVBSO und FVBZSO erforderlich,
    // da die Logik in MRE4 bereits mit den korrekten RE4J und VBEZJ Werten arbeitet.

    console.log("Exiting MBEZUG module.");
}

module.exports = MBEZUG;