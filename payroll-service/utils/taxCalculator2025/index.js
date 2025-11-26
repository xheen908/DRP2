// DRP2/payroll-service/utils/taxCalculator2025/index.js

// Importiere alle Unterprogramme
const MPARA = require('./MPARA');
const MRE4JL = require('././MRE4JL');
const MRE4 = require('./MRE4');
const MRE4ABZ = require('./MRE4ABZ');
const MBERECH = require('./MBERECH'); // MBERECH hinzugefügt

/**
 * Verwaltet den Zustand (interne Felder und Eingabeparameter) für die Lohnsteuerberechnung
 * und orchestriert den Aufruf der einzelnen PAP-Module.
 */
class TaxCalculator2025 {
    constructor() {
        // Initialisiere alle internen Felder gemäß PAP, Abschnitt 4.
        // Die Namen der Felder entsprechen exakt den Bezeichnungen im PAP.
        this.ALTE = 0; // Dieser Wert wird von MRE4ALTE gesetzt
        this.ANP = 0; // Dieser Wert wird von MRE4ABZ gesetzt
        this.ANTEIL1 = 0;
        this.BBGKVPV = 0;
        this.BBGRV = 0;
        this.BMG = 0; // Dieser Wert wird von MRE4ALTE gesetzt
        this.DIFF = 0;
        this.EFA = 0;
        this.FVB = 0; // Dieser Wert wird von MRE4 gesetzt
        this.FVBSO = 0; // Dieser Wert wird von MRE4 gesetzt
        this.FVBZ = 0; // Dieser Wert wird von MRE4 gesetzt
        this.FVBZSO = 0; // Dieser Wert wird von MRE4 gesetzt
        this.GFB = 0;
        this.HBALTE = 0; // Dieser Wert wird von MRE4ALTE gesetzt
        this.HFVB = 0; // Dieser Wert wird von MRE4 gesetzt
        this.HFVBZ = 0; // Dieser Wert wird von MRE4 gesetzt
        this.HFVBZSO = 0; // Dieser Wert wird von MRE4 gesetzt
        this.HOCH = 0;
        this.J = 0; // Dieser Wert wird von MRE4 gesetzt
        this.JBMG = 0;
        this.JLFREIB = 0;
        this.JLHINZU = 0;
        this.JW = 0; // Neu für MBERECH
        this.K = 0; // Dieser Wert wird von MRE4ALTE gesetzt
        this.KFB = 0; // Kinderfreibetrag
        this.KVSATZAG = 0;
        this.KVSATZAN = 0;
        this.KZTAB = 0;
        this.LSTJAHR = 0;
        this.LSTOSO = 0;
        this.LSTSO = 0;
        this.MIST = 0;
        this.PVSATZAG = 0;
        this.PVSATZAN = 0;
        this.RVSATZAN = 0;
        this.RW = 0;
        this.SAP = 0; // Dieser Wert wird von MRE4ABZ gesetzt
        this.SOLZFREI = 0;
        this.SOLZJ = 0;
        this.SOLZMIN = 0;
        this.SOLZSBMG = 0;
        this.SOLZSZVE = 0;
        this.ST = 0;
        this.ST1 = 0;
        this.ST2 = 0;
        // Tabellen müssen noch als Objekte oder Arrays definiert werden, falls nicht in constants.js
        this.TAB1 = {};
        this.TAB2 = {};
        this.TAB3 = {};
        this.TAB4 = {};
        this.TAB5 = {};
        this.VBEZB = 0; // Dieser Wert wird von MRE4 gesetzt
        this.VBEZBSO = 0;
        this.VERGL = 0;
        this.VHB = 0;
        this.VKV = 0;
        this.VSP = 0; // Neu für MBERECH
        this.VSPN = 0;
        this.VSP1 = 0; // Neu für MBERECH
        this.VSP2 = 0; // Neu für MBERECH
        this.VSP3 = 0; // Neu für MBERECH
        this.W1STKL5 = 0;
        this.W2STKL5 = 0;
        this.W3STKL5 = 0;
        this.X = 0;
        this.Y = 0;
        this.ZRE4 = 0; // Dieser Wert wird von MRE4ABZ gesetzt
        this.ZRE4J = 0;
        this.ZRE4VP = 0; // Dieser Wert wird von MRE4ABZ gesetzt
        this.ZTABFB = 0;
        this.ZVBEZ = 0; // Dieser Wert wird von MRE4ABZ gesetzt
        this.ZVBEZJ = 0;
        this.ZVE = 0;
        this.ZX = 0;
        this.ZZX = 0;
        this.F = 0; // F wird in MRE4JL gesetzt
        
        // Eingabeparameter
        this.input = {};
        // Ausgangsparameter gemäß PAP, Abschnitt 3.2
        this.output = {
            BK: 0,
            BKS: 0,
            LSTLZZ: 0,
            SOLZLZZ: 0,
            SOLZS: 0,
            STS: 0,
            VKVLZZ: 0,
            VKVSONST: 0
        };
    }

    /**
     * Setzt alle internen Felder und Output-Parameter auf ihre Initialwerte zurück.
     * Dies sollte vor jeder neuen Lohnsteuerberechnung aufgerufen werden, um
     * sicherzustellen, dass keine alten Werte die neue Berechnung beeinflussen.
     */
    resetInternalState() {
        // Setze alle numerischen internen Felder auf 0
        for (const key in this) {
            // Überspringe input und output, da sie separat verwaltet werden
            if (key === 'input' || key === 'output') continue;
            // Wenn der Wert eine Zahl ist, setze ihn auf 0
            if (typeof this[key] === 'number') {
                this[key] = 0;
            }
            // Wenn der Wert ein Objekt ist (z.B. für Tabellen), leere es
            if (typeof this[key] === 'object' && !Array.isArray(this[key])) {
                this[key] = {}; 
            }
        }
        // Setze Input und Output explizit zurück
        this.input = {};
        this.output = {
            BK: 0, BKS: 0, LSTLZZ: 0, SOLZLZZ: 0, SOLZS: 0, STS: 0, VKVLZZ: 0, VKVSONST: 0
        };
    }

    /**
     * Führt die Hauptberechnung der Lohnsteuer durch.
     * @param {object} inputParameters - Die Eingangsparameter gemäß PAP, Abschnitt 3.1.
     * @returns {object} Die berechneten Ausgangsparameter.
     */
    calculate(inputParameters) {
        this.resetInternalState(); // Zustand vor jeder Berechnung zurücksetzen
        this.input = inputParameters;

        console.log("Starting Lohnsteuerberechnung 2025...");

        // Hauptsteuerung des Programmablaufplans (Seite 13 des Dokuments)
        MPARA(this, this.input);
        MRE4JL(this, this.input);
        MRE4(this, this.input);
        MRE4ABZ(this, this.input);
        MBERECH(this, this.input); // MBERECH wird aufgerufen
        // MSONST(this, this.input);

        console.log("Finished Lohnsteuerberechnung 2025.");
        return this.output; // Gibt die Ausgangsparameter zurück
    }
}

module.exports = TaxCalculator2025;