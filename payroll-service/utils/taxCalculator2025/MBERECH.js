// DRP2/payroll-service/utils/taxCalculator2025/MBERECH.js

const CONSTANTS = require('./constants');

/**
 * LST2025 (Platzhalter) - Hauptberechnung der Jahreslohnsteuer
 * Dieses Modul wird später detailliert implementiert.
 * Für den Moment gibt es einfach den Eingabewert zurück.
 * @param {number} X - Zu versteuerndes Einkommen für die Steuerberechnung.
 * @returns {number} Die berechnete Jahreslohnsteuer.
 */
function LST2025(X) {
    // Diese Funktion ist ein Platzhalter und wird später gemäß PAP Seiten 23-28 implementiert.
    // Sie sollte am Ende Lohnsteuer (ST) und ggf. andere Werte im State setzen.
    // Für die MBERECH Tests geben wir einfach X zurück, um die Logik des MBERECH Moduls zu prüfen.
    // Später wird LST2025 direkt auf dem State operieren und ST, ST1, ST2 setzen.
    return X; 
}


/**
 * MBERECH - Ermittlung des zu versteuernden Einkommens und der Steuerbeträge
 * (Seite 21 des Dokuments, Modul "MBERECH")
 *
 * @param {object} state Das aktuelle Zustandsobjekt, das alle internen Felder enthält.
 * @param {object} input Die Eingabeparameter für die Berechnung.
 */
function MBERECH(state, input) {
    console.log("Entering MBERECH module: Ermittlung des zu versteuernden Einkommens und der Steuerbeträge.");

    // 1. Ermittlung des zu versteuernden Einkommens (ZVE) vor Vorsorgepauschale
    // ZRE4 ist bereits in Euro, ANP ist in Euro
    state.ZVE = state.ZRE4 - state.ANP;
    if (state.ZVE < 0) {
        state.ZVE = 0;
    }

    // 2. Berechnung des Jahreswertes für die Vorsorgepauschale (JW in Euro)
    // ZRE4VP ist bereits in Euro, ANP ist in Euro
    state.JW = state.ZRE4VP - state.ANP;
    if (state.JW < 0) {
        state.JW = 0;
    }

    // 3. Berechnung der Vorsorgepauschale (VSP) Teil 1 (Arbeitnehmeranteile)
    // Beitragsbemessungsgrenzen sind in Cent, Sätze sind Dezimal. Ergebnisse in Euro.
    
    // BBGRV_2025_CENT ist 9660000 Cent = 96600 Euro
    state.VSP1 = Math.min(input.RE4J / 100, CONSTANTS.BBGRV_2025_CENT / 100) * state.RVSATZAN;
    
    // BBGKVPV_2025_CENT ist 6615000 Cent = 66150 Euro
    state.VSP2 = Math.min(input.RE4J / 100, CONSTANTS.BBGKVPV_2025_CENT / 100) * (state.KVSATZAN + state.PVSATZAN);

    state.VSP3 = state.VSP1 + state.VSP2;
    state.VSP = state.VSP3; // Hier wird VSP mit dem berechneten Wert aktualisiert

    // 4. Ermittlung des zu versteuernden Einkommens (ZVE) für die Steuerberechnung
    // SAP ist in Euro
    state.ZVE = state.ZVE - state.SAP;
    if (state.ZVE < 0) {
        state.ZVE = 0;
    }

    // 5. Steuerberechnung (Aufruf von LST2025 - Platzhalter)
    state.X = state.ZVE;

    if (input.STKL === 2 && input.KFB > 0) { // KFB (Kinderfreibetrag) ist ein Input-Parameter
        state.X = state.X - input.KFB;
    }
    
    // Für Steuerklassen 3, 4, 5, 6 und Faktorverfahren
    // F (Faktor) wird in MRE4JL gesetzt.
    if (input.STKL >= 3 && input.STKL <= 6 && state.F !== 1) { 
        state.X = state.X / state.F;
    }

    state.ST = LST2025(state.X); // Aufruf des Lohnsteuerberechnungs-Moduls (Platzhalter)
    // Weitere Steuerbeträge (ST1, ST2) würden hier ebenfalls von LST2025 gesetzt werden.

    console.log("Exiting MBERECH module.");
}

module.exports = MBERECH;