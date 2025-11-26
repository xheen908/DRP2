// DRP2/payroll-service/utils/taxCalculator2025/index.js

// Importiere alle Unterprogramme
const MPARA = require('./MPARA');
const MRE4JL = require('./MRE4JL');
const MRE4 = require('./MRE4');
const MRE4ABZ = require('./MRE4ABZ');
const { MBERECH, LST2025 } = require('./MBERECH');
const MSONST = require('./MSONST');
const MBEZUG = require('./MBEZUG'); // MBEZUG hinzugefügt

/**
 * Verwaltet den Zustand der Lohnsteuerberechnung für 2025.
 * Die internen Felder (state) spiegeln die Variablen im PAP 2025 wider.
 */
class TaxCalculator2025 {
    constructor() {
        this.resetInternalState();
    }

    /**
     * Setzt alle internen Felder auf ihre initialen Werte zurück.
     * Dies ist wichtig, um sicherzustellen, dass jede Berechnung sauber startet.
     */
    resetInternalState() {
        // Parameter aus MPARA
        this.BBGRV = 0;
        this.RVSATZAN = 0;
        this.BBGKVPV = 0;
        this.KVSATZAN = 0;
        this.KVSATZAG = 0;
        this.PVSATZAN = 0;
        this.PVSATZAG = 0;
        this.W1STKL5 = 0;
        this.W2STKL5 = 0;
        this.W3STKL5 = 0;
        this.GFB = 0;
        this.SOLZFREI = 0;

        // Parameter aus MRE4JL
        this.ZRE4J = 0;
        this.ZVBEZJ = 0;
        this.JLFREIB = 0;
        this.JLHINZU = 0;
        this.F = 1; // Standardwert für Faktor

        // Parameter aus MRE4
        this.VBEZB = 0;
        this.FVB = 0;
        this.FVBZ = 0;
        this.HFVB = 0;
        this.HFVBZ = 0;
        this.FVBSO = 0;
        this.FVBZSO = 0;
        this.HFVBZSO = 0;
        this.J = 0;

        // Parameter aus MRE4ALTE
        this.ALTE = 0;
        this.BMG = 0;
        this.HBALTE = 0;
        this.K = 0;

        // Parameter aus MRE4ABZ
        this.ANP = 0;
        this.SAP = 0;
        this.ZVBEZ = 0;
        this.ZRE4 = 0;
        this.ZRE4VP = 0;

        // Parameter aus MBERECH
        this.ZVE = 0;
        this.JW = 0;
        this.VSP1 = 0;
        this.VSP2 = 0;
        this.VSP = 0;
        this.X = 0;
        this.ST = 0;

        // Parameter aus MSONST
        this.ZRE4SO = 0;
        this.JBMG = 0;
        this.ZTABFB = 0;
        this.LSTSO = 0;
        this.STS = 0;
        this.SOLZS = 0;
        this.BKS = 0;

        // Parameter aus MBEZUG
        this.WVFRB = 0;
        this.ANRE4 = 0;
        this.ANRE4PV = 0;

        // Andere interne Felder oder Ergebnisse
        this.LSTLZZ = 0; // Lohnsteuer für den LZZ
        this.SOLZLZZ = 0; // Solidaritätszuschlag für den LZZ
        this.BKSATLZZ = 0; // Bemessungsgrundlage für die Kirchensteuer

        this.input = {}; // Speichert die ursprünglichen Eingabeparameter
    }

    /**
     * Führt die Lohnsteuerberechnung basierend auf den Eingabeparametern durch.
     * @param {object} inputParameters Die Eingabeparameter für die Berechnung.
     */
    calculate(inputParameters) {
        console.log("Starting Lohnsteuerberechnung 2025...");
        this.resetInternalState(); // Zustand vor jeder Berechnung zurücksetzen
        Object.assign(this, inputParameters); // Eingabeparameter in den Zustand kopieren
        this.input = inputParameters; // Referenz auf die ursprünglichen Inputs speichern

        // Aufruf der einzelnen Unterprogramme in der korrekten Reihenfolge gemäß PAP
        MPARA(this, this.input);
        MRE4JL(this, this.input);
        MRE4(this, this.input); // Ruft MRE4ALTE intern auf
        MRE4ABZ(this, this.input);
        MBERECH(this, this.input); // Ruft LST2025 intern auf
        MSONST(this, this.input);
        MBEZUG(this, this.input); // MBEZUG hinzugefügt

        console.log("Finished Lohnsteuerberechnung 2025.");
    }
}

module.exports = TaxCalculator2025;