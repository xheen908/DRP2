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