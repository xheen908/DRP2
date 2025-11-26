// DRP2/payroll-service/tests/taxCalculator.test.js

const TaxCalculator2025 = require('../utils/taxCalculator2025/index');
const CONSTANTS = require('../utils/taxCalculator2025/constants');

describe('MPARA Module', () => {
    let calculator;

    beforeEach(() => {
        calculator = new TaxCalculator2025();
    });

    // Testfall 1: Standardwerte für einen gesetzlich Versicherten ohne Sachsen, kinderlos
    test('sollte korrekte Parameter für einen gesetzlich Versicherten (KRV=0, PVS=0, PVZ=1, PVA=0) setzen', () => {
        const input = {
            KRV: 0,   // Gesetzlich rentenversichert
            KVZ: 2.50, // Kassenindividueller Zusatzbeitragssatz 2.50%
            PVS: 0,   // Keine Besonderheiten in Sachsen
            PVZ: 1,   // Zuschlag für Kinderlose zu zahlen
            PVA: 0    // Keine Beitragsabschläge für Kinder
        };

        calculator.calculate(input); // Ruft MPARA intern auf

        // Erwartete Werte aus der Skizze und den Konstanten
        expect(calculator.BBGRV).toBe(CONSTANTS.BBGRV_2025_CENT);
        expect(calculator.RVSATZAN).toBe(CONSTANTS.RVSATZ_AN_2025);
        expect(calculator.BBGKVPV).toBe(CONSTANTS.BBGKVPV_2025_CENT);
        
        // KVSATZAN: (2.50 / 2 / 100) + 0.07 = 0.0125 + 0.07 = 0.0825
        expect(calculator.KVSATZAN).toBeCloseTo(0.0825); 
        expect(calculator.KVSATZAG).toBeCloseTo(CONSTANTS.KVSATZ_AG_FIX_2025); // 0.0125 + 0.07 = 0.0825

        // PVSATZAN: 0.023 (normal) + 0.006 (kinderlos) - 0 (PVA) = 0.029
        expect(calculator.PVSATZAN).toBeCloseTo(0.029);
        expect(calculator.PVSATZAG).toBeCloseTo(CONSTANTS.PVSATZ_AG_NORMAL_2025); // 0.013

        expect(calculator.W1STKL5).toBe(CONSTANTS.W1STKL5_2025_CENT);
        expect(calculator.W2STKL5).toBe(CONSTANTS.W2STKL5_2025_CENT);
        expect(calculator.W3STKL5).toBe(CONSTANTS.W3STKL5_2025_CENT);
        expect(calculator.GFB).toBe(CONSTANTS.GFB_2025_CENT);
        expect(calculator.SOLZFREI).toBe(CONSTANTS.SOLZFREI_2025_CENT);
    });

    // Testfall 2: Nicht gesetzlich rentenversichert (KRV=1)
    test('sollte BBGRV und RVSATZAN auf 0 setzen, wenn KRV=1', () => {
        const input = {
            KRV: 1, // Nicht gesetzlich rentenversichert
            KVZ: 1.00,
            PVS: 0,
            PVZ: 0,
            PVA: 0
        };

        calculator.calculate(input);

        expect(calculator.BBGRV).toBe(0);
        expect(calculator.RVSATZAN).toBe(0);
    });

    // Testfall 3: Besonderheiten in Sachsen (PVS=1)
    test('sollte PV-Sätze für Sachsen anpassen, wenn PVS=1', () => {
        const input = {
            KRV: 0,
            KVZ: 1.00,
            PVS: 1, // Besonderheiten in Sachsen
            PVZ: 0,
            PVA: 0
        };

        calculator.calculate(input);

        expect(calculator.PVSATZAN).toBeCloseTo(CONSTANTS.PVSATZ_AN_SACHSEN_2025); // 0.018
        expect(calculator.PVSATZAG).toBeCloseTo(CONSTANTS.PVSATZ_AG_SACHSEN_2025); // 0.018
    });

    // Testfall 4: Beitragsabschläge für Kinder (PVA > 0)
    test('sollte PVSATZAN um Beitragsabschläge reduzieren (PVA=2)', () => {
        const input = {
            KRV: 0,
            KVZ: 1.00,
            PVS: 0,
            PVZ: 1, // Kinderlos, um den Basissatz zu haben vor Abzügen
            PVA: 2 // 2 Beitragsabschläge
        };

        calculator.calculate(input);

        // Erwarteter PVSATZAN: 0.023 (normal) + 0.006 (kinderlos) - (2 * 0.0025) = 0.029 - 0.005 = 0.024
        expect(calculator.PVSATZAN).toBeCloseTo(0.024);
    });

    // Testfall 5: PVSATZAN sollte nicht negativ werden
    test('sollte PVSATZAN nicht negativ werden, selbst bei hohen PVA-Werten', () => {
        const input = {
            KRV: 0,
            KVZ: 1.00,
            PVS: 0,
            PVZ: 0, // Nicht kinderlos, um den niedrigsten Startwert zu haben
            PVA: 10 // Unrealistisch hoher Wert, um Negativtest zu erzwingen
        };

        calculator.calculate(input);

        // 0.023 (normal) - (10 * 0.0025) = 0.023 - 0.025 = -0.002. Sollte auf 0 gesetzt werden.
        expect(calculator.PVSATZAN).toBe(0);
    });
});

describe('MRE4JL Module', () => {
    let calculator;

    beforeEach(() => {
        calculator = new TaxCalculator2025();
    });

    // Testfall 1: LZZ = 1 (Jahr)
    test('sollte Jahreswerte korrekt setzen, wenn LZZ = 1 (Jahr)', () => {
        const input = {
            LZZ: 1,
            RE4: 3600000,   // 36000.00 Cent
            VBEZ: 120000,   // 1200.00 Cent
            LZZFREIB: 50000, // 500.00 Cent
            LZZHINZU: 10000, // 100.00 Cent
            AF: 0           // Kein Faktorverfahren
        };

        // MPARA wird automatisch im calculate-Aufruf ausgeführt,
        // seine spezifischen Einstellungen sind für MRE4JL selbst nicht relevant,
        // aber der calculate-Aufruf führt beide Module sequenziell aus.
        calculator.calculate(input); 

        // Erwartete Werte (in Euro, da PAP so definiert):
        expect(calculator.ZRE4J).toBeCloseTo(36000.00);
        expect(calculator.ZVBEZJ).toBeCloseTo(1200.00);
        expect(calculator.JLFREIB).toBeCloseTo(500.00);
        expect(calculator.JLHINZU).toBeCloseTo(100.00);
        expect(calculator.F).toBe(1); // AF = 0 -> F = 1
    });

    // Testfall 2: LZZ = 2 (Monat)
    test('sollte Jahreswerte korrekt hochrechnen, wenn LZZ = 2 (Monat)', () => {
        const input = {
            LZZ: 2,
            RE4: 300000,   // 3000.00 Cent pro Monat
            VBEZ: 10000,   // 100.00 Cent pro Monat
            LZZFREIB: 5000,  // 50.00 Cent pro Monat
            LZZHINZU: 1000,  // 10.00 Cent pro Monat
            AF: 0
        };

        calculator.calculate(input);

        // Erwartete Werte (monatlich * 12, dann in Euro umgerechnet):
        expect(calculator.ZRE4J).toBeCloseTo((300000 * 12) / 100); // 36000.00
        expect(calculator.ZVBEZJ).toBeCloseTo((10000 * 12) / 100);  // 1200.00
        expect(calculator.JLFREIB).toBeCloseTo((5000 * 12) / 100);   // 600.00
        expect(calculator.JLHINZU).toBeCloseTo((1000 * 12) / 100);   // 120.00
        expect(calculator.F).toBe(1);
    });

    // Testfall 3: LZZ = 3 (Woche)
    test('sollte Jahreswerte korrekt hochrechnen, wenn LZZ = 3 (Woche)', () => {
        const input = {
            LZZ: 3,
            RE4: 75000,    // 750.00 Cent pro Woche
            VBEZ: 2500,    // 25.00 Cent pro Woche
            LZZFREIB: 1250,   // 12.50 Cent pro Woche
            LZZHINZU: 250,    // 2.50 Cent pro Woche
            AF: 0
        };

        calculator.calculate(input);

        // Erwartete Werte (wöchentlich * 360/7, dann in Euro umgerechnet):
        // RE4 * 360 / 7 / 100
        expect(calculator.ZRE4J).toBeCloseTo((75000 * 360 / 7) / 100); // ca. 38571.43
        expect(calculator.ZVBEZJ).toBeCloseTo((2500 * 360 / 7) / 100);  // ca. 1285.71
        expect(calculator.JLFREIB).toBeCloseTo((1250 * 360 / 7) / 100);   // ca. 642.86
        expect(calculator.JLHINZU).toBeCloseTo((250 * 360 / 7) / 100);    // ca. 128.57
        expect(calculator.F).toBe(1);
    });

    // Testfall 4: LZZ = 4 (Tag)
    test('sollte Jahreswerte korrekt hochrechnen, wenn LZZ = 4 (Tag)', () => {
        const input = {
            LZZ: 4,
            RE4: 15000,    // 150.00 Cent pro Tag
            VBEZ: 500,     // 5.00 Cent pro Tag
            LZZFREIB: 250,    // 2.50 Cent pro Tag
            LZZHINZU: 50,     // 0.50 Cent pro Tag
            AF: 0
        };

        calculator.calculate(input);

        // Erwartete Werte (täglich * 360, dann in Euro umgerechnet):
        expect(calculator.ZRE4J).toBeCloseTo((15000 * 360) / 100); // 54000.00
        expect(calculator.ZVBEZJ).toBeCloseTo((500 * 360) / 100);   // 1800.00
        expect(calculator.JLFREIB).toBeCloseTo((250 * 360) / 100);    // 900.00
        expect(calculator.JLHINZU).toBeCloseTo((50 * 360) / 100);     // 180.00
        expect(calculator.F).toBe(1);
    });

    // Testfall 5: AF = 1 (Faktorverfahren)
    test('sollte F auf den Eingabewert setzen, wenn AF = 1', () => {
        const input = {
            LZZ: 2,
            RE4: 300000,
            VBEZ: 10000,
            LZZFREIB: 5000,
            LZZHINZU: 1000,
            AF: 1,    // Faktorverfahren angewendet
            F: 0.950 // Beispiel-Faktor
        };

        calculator.calculate(input);
        expect(calculator.F).toBe(0.950);
    });

    // Testfall 6: Standard-Fall mit AF = 0
    test('sollte F auf 1 setzen, wenn AF = 0', () => {
        const input = {
            LZZ: 2,
            RE4: 300000,
            VBEZ: 10000,
            LZZFREIB: 5000,
            LZZHINZU: 1000,
            AF: 0 // Kein Faktorverfahren
        };

        calculator.calculate(input);
        expect(calculator.F).toBe(1);
    });
});