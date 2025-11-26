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
            PVA: 0,    // Keine Beitragsabschläge für Kinder
            // Hinzugefügt für MRE4JL, da calculate() alle Module aufruft.
            LZZ: 1,
            RE4: 0,
            VBEZ: 0,
            LZZFREIB: 0,
            LZZHINZU: 0,
            AF: 0,
            VJAHR: 0,
            VBEZM: 0,
            VBEZS: 0,
            ZMVB: 0,
            VBEZBSO: 0,
            ALTER1: 0,
            AJAHR: 0,
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
            PVA: 0,
            // Hinzugefügt für MRE4JL
            LZZ: 1, RE4: 0, VBEZ: 0, LZZFREIB: 0, LZZHINZU: 0, AF: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
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
            PVA: 0,
            // Hinzugefügt für MRE4JL
            LZZ: 1, RE4: 0, VBEZ: 0, LZZFREIB: 0, LZZHINZU: 0, AF: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
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
            PVA: 2, // 2 Beitragsabschläge
            // Hinzugefügt für MRE4JL
            LZZ: 1, RE4: 0, VBEZ: 0, LZZFREIB: 0, LZZHINZU: 0, AF: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
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
            PVA: 10, // Unrealistisch hoher Wert, um Negativtest zu erzwingen
            // Hinzugefügt für MRE4JL
            LZZ: 1, RE4: 0, VBEZ: 0, LZZFREIB: 0, LZZHINZU: 0, AF: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
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
            AF: 0,           // Kein Faktorverfahren
            // Hinzugefügt für MPARA und MRE4
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
        };

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
            AF: 0,
            // Hinzugefügt für MPARA und MRE4
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
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
            AF: 0,
            // Hinzugefügt für MPARA und MRE4
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
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
            AF: 0,
            // Hinzugefügt für MPARA und MRE4
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
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
            F: 0.950, // Beispiel-Faktor
            // Hinzugefügt für MPARA und MRE4
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
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
            AF: 0, // Kein Faktorverfahren
            // Hinzugefügt für MPARA und MRE4
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, ZMVB: 0, VBEZBSO: 0, ALTER1: 0, AJAHR: 0,
        };

        calculator.calculate(input);
        expect(calculator.F).toBe(1);
    });
});

describe('MRE4 and MRE4ALTE Module', () => {
    let calculator;

    beforeEach(() => {
        calculator = new TaxCalculator2025();
    });

    // Die setupMRE4JLState Hilfsfunktion ist nicht mehr notwendig,
    // da die Werte direkt im input-Objekt übergeben werden.

    // Testfall 1: Berechnung des Versorgungsfreibetrags (VJAHR = 2005, LZZ = 2 (Monat))
    test('sollte FVB und FVBZ korrekt berechnen für VJAHR=2005, LZZ=2', () => {
        const input = {
            VJAHR: 2005,      // Jahr des Versorgungsbeginns "bis 2005" -> J=1
            VBEZM: 200000,    // 2000.00 Cent monatlich
            VBEZS: 0,         // Keine Sonderzahlungen
            LZZ: 2,           // Monatliche Berechnung
            ZMVB: 12,         // 12 Monate für Jahresberechnung relevant
            VBEZBSO: 0,       // Keine sonstigen Bezüge
            ALTER1: 0,        // Kein Altersentlastungsbetrag
            AJAHR: 0,         // Nicht relevant, da ALTER1=0
            // Hinzugefügt für MRE4JL
            RE4: 200000,      // 2000.00 Cent pro Monat, damit ZRE4J = 24000.00 Euro
            VBEZ: 20000,      // 200.00 Cent pro Monat, damit ZVBEZJ = 2400.00 Euro
            LZZFREIB: 0,
            LZZHINZU: 0,
            AF: 0,
            // Hinzugefügt für MPARA
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
        };

        calculator.calculate(input);

        // Erwartete Werte für J=1 (bis 2005) aus CONSTANTS.TAB_V_PARAMETER[1]
        // SATZ: 0.400, HOECHSTBETRAG_CENT: 300000, ZUSCHLAG_CENT: 90000

        // VBEZB = VBEZM * ZMVB + VBEZS = 200000 * 12 + 0 = 2400000 Cent
        expect(calculator.VBEZB).toBe(2400000);

        // FVB = (VBEZB * SATZ) / 100 = (2400000 * 0.400) / 100 = 9600.00 Euro (initial)
        // HFVB (LZZ=2) = (TAB2(J) / 100 / 12) * ZMVB = (300000 / 100 / 12) * 12 = 3000.00 Euro
        // FVB begrenzt durch HFVB: min(9600.00, 3000.00) = 3000.00
        // FVB begrenzt durch ZVBEZJ (2400.00): min(3000.00, 2400.00) = 2400.00
        expect(calculator.FVB).toBeCloseTo(2400.00);

        // FVBZ (LZZ=2) = (TAB3(J) / 100 / 12) * ZMVB = (90000 / 100 / 12) * 12 = 900.00 Euro (initial)
        // HFVBZ = ZVBEZJ - FVB = 2400.00 - 2400.00 = 0.00 Euro
        // FVBZ begrenzt durch HFVBZ: min(900.00, 0.00) = 0.00
        expect(calculator.FVBZ).toBeCloseTo(0.00);
        
        // ALTE sollte 0 sein, da ALTER1 = 0
        expect(calculator.ALTE).toBe(0);
    });

    // Testfall 2: Altersentlastungsbetrag (ALTER1=1, AJAHR=2025)
    test('sollte Altersentlastungsbetrag korrekt berechnen für AJAHR=2025, ALTER1=1', () => {
        const input = {
            VJAHR: 0,         // Nicht relevant
            VBEZM: 0,
            VBEZS: 0,
            LZZ: 1,           // Jahresberechnung
            ZMVB: 0,
            VBEZBSO: 0,
            ALTER1: 1,        // Altersentlastungsbetrag aktiv
            AJAHR: 2025,      // Auf die Vollendung des 64. Lebensjahres folgendes Kalenderjahr -> K=21
            // Hinzugefügt für MRE4JL
            RE4: 5000000,     // 50000.00 Cent pro Jahr, damit ZRE4J = 50000.00 Euro
            VBEZ: 0,          // 0 Cent pro Jahr, damit ZVBEZJ = 0.00 Euro
            LZZFREIB: 0,
            LZZHINZU: 0,
            AF: 0,
            // Hinzugefügt für MPARA
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
        };

        calculator.calculate(input);

        // Erwartete Werte für K=21 (2025) aus CONSTANTS.TAB_A_PARAMETER[21]
        // SATZ: 0.132, HOECHSTBETRAG_CENT: 62700

        // K sollte 21 sein
        expect(calculator.K).toBe(21);

        // BMG = ZRE4J (50000.00) - ZVBEZJ (0.00) = 50000.00 Euro
        expect(calculator.BMG).toBeCloseTo(50000.00);

        // ALTE = BMG * SATZ = 50000.00 * 0.132 = 6600.00 Euro (initial)
        // HBALTE = HOECHSTBETRAG_CENT / 100 = 62700 / 100 = 627.00 Euro
        // ALTE begrenzt durch HBALTE: min(6600.00, 627.00) = 627.00
        expect(calculator.ALTE).toBeCloseTo(627.00);
    });

    // Testfall 3: FVB und FVBZ mit LZZ=1 (Jahr)
    test('sollte FVB und FVBZ korrekt berechnen für LZZ=1 (Jahr)', () => {
        const input = {
            VJAHR: 2025,      // J=21
            VBEZM: 0,         // Irrelevant bei LZZ=1 (VBEZB aus input.VBEZ)
            VBEZS: 0,
            LZZ: 1,           // Jahresberechnung
            ZMVB: 12,         // 12 Monate
            VBEZBSO: 0,
            ALTER1: 0,
            AJAHR: 0,
            // Hinzugefügt für MRE4JL
            RE4: 3000000,     // 30000.00 Cent pro Jahr, damit ZRE4J = 30000.00 Euro
            VBEZ: 1200000,    // 12000.00 Cent pro Jahr, damit ZVBEZJ = 12000.00 Euro
            LZZFREIB: 0,
            LZZHINZU: 0,
            AF: 0,
            // Hinzugefügt für MPARA
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
        };

        calculator.calculate(input);

        const tabEntryV = CONSTANTS.TAB_V_PARAMETER[21]; // J=21 für VJAHR=2025

        // VBEZB = VBEZM * ZMVB + VBEZS = 0 * 12 + 0 = 0 Cent (initial, aber überschrieben von ZVBEZJ bei der Rechnung)
        // VBEZB wird hier als 12000.00 EUR aus ZVBEZJ angenommen, da MRE4JL es setzt
        // Im MRE4 Modul wird VBEZB tatsächlich so berechnet:
        // if (input.LZZ === 1) { state.VBEZB = input.VBEZM * input.ZMVB + input.VBEZS; }
        // Da VBEZM=0 und VBEZS=0, wäre VBEZB=0. Dies ist ein Fehler in unserem Input!
        // VBEZB sollte nicht aus input.VBEZM*input.ZMVB berechnet werden, wenn LZZ=1.
        // Im PAP ist VBEZB = VBEZM * ZMVB + VBEZS, was bei LZZ=1 nur VBEZS relevant macht.
        // Für LZZ=1, input.VBEZ ist der jährliche Versorgungsbezug in Cent.
        // MRE4JL setzt ZVBEZJ = input.VBEZ / 100.
        // Der MRE4-Block für VBEZB sollte also ZVBEZJ nutzen, wenn es schon hochgerechnet ist.
        // Das VBEZB im MRE4-Modul bezieht sich auf die Bemessungsgrundlage für Versorgungsbezüge,
        // die je nach LZZ anders berechnet wird.
        // Im aktuellen MRE4-Code:
        // if (input.LZZ === 1) { state.VBEZB = input.VBEZM * input.ZMVB + input.VBEZS; }
        // Dies bedeutet, dass für LZZ=1 der Jahreswert aus VBEZM und VBEZS berechnet wird, nicht aus dem schon hochgerechneten ZVBEZJ.
        // Dies ist ein wichtiger Unterschied zum PAP, wo VBEZB aus VBEZM * ZMVB + VBEZS kommt und dann FVB aus VBEZB abgeleitet wird.
        // Hier müssen wir den input.VBEZM und input.VBEZS anpassen, damit VBEZB den Wert von ZVBEZJ * 100 bekommt.
        // Wenn ZVBEZJ = 12000.00, dann VBEZB = 1200000 Cent
        // Um das zu erreichen, setzen wir input.VBEZM = 1200000 und input.ZMVB = 1 für LZZ=1.
        // Oder wir setzen input.VBEZS = 1200000 Cent.
        // Am einfachsten ist es, wenn VBEZS den Jahreswert in Cent enthält.

        // Korrigierte VBEZB Berechnung, da VBEZ bereits den Jahreswert enthält
        // VBEZB sollte 1200000 Cent sein (12000 Euro)
        // Wir müssen hier VBEZM und VBEZS im Input anpassen, damit MRE4's VBEZB-Berechnung stimmt.
        // Bei LZZ=1, VBEZB = input.VBEZM * input.ZMVB + input.VBEZS.
        // Da wir einen Jahres-VBEZ von 1200000 Cent haben wollen, setzen wir input.VBEZS = 1200000
        input.VBEZS = 1200000;
        input.VBEZM = 0; // damit es nicht mit VBEZS interferiert

        calculator.calculate(input); // Erneut aufrufen, damit die korrigierten Inputs wirken.

        expect(calculator.VBEZB).toBe(1200000); // 12000.00 Euro

        // FVB = (VBEZB * SATZ) / 100 = (1200000 * 0.132) / 100 = 1584.00 Euro (initial)
        // HFVB (LZZ=1) = TAB2(J) / 100 = 99000 / 100 = 990.00 Euro
        // FVB begrenzt durch HFVB: min(1584.00, 990.00) = 990.00
        // FVB begrenzt durch ZVBEZJ (12000.00): min(990.00, 12000.00) = 990.00
        expect(calculator.FVB).toBeCloseTo(990.00);
        
        // FVBZ (LZZ=1) = TAB3(J) / 100 = 29700 / 100 = 297.00 Euro (initial)
        // HFVBZ = ZVBEZJ - FVB = 12000.00 - 990.00 = 11010.00 Euro
        // FVBZ begrenzt durch HFVBZ: min(297.00, 11010.00) = 297.00
        expect(calculator.FVBZ).toBeCloseTo(297.00);
    });

    // Testfall 4: Altersentlastungsbetrag mit negativem BMG
    test('sollte ALTE auf 0 setzen, wenn BMG negativ ist', () => {
        const input = {
            ALTER1: 1,
            AJAHR: 2025,
            VJAHR: 0, VBEZM: 0, VBEZS: 0, LZZ: 1, ZMVB: 0, VBEZBSO: 0,
            // Hinzugefügt für MRE4JL
            RE4: 1000000,     // 10000.00 Cent pro Jahr, damit ZRE4J = 10000.00 Euro
            VBEZ: 2000000,    // 20000.00 Cent pro Jahr, damit ZVBEZJ = 20000.00 Euro
            LZZFREIB: 0,
            LZZHINZU: 0,
            AF: 0,
            // Hinzugefügt für MPARA
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
        };

        calculator.calculate(input);

        // BMG = ZRE4J (10000.00) - ZVBEZJ (20000.00) = -10000.00
        // BMG wird in MRE4ALTE auf 0 gesetzt, wenn negativ
        expect(calculator.BMG).toBe(0);
        expect(calculator.ALTE).toBe(0);
    });

    // Testfall 5: FVBSO und FVBZSO korrekt berechnen
    test('sollte FVBSO und FVBZSO korrekt berechnen', () => {
        const input = {
            VJAHR: 2025,      // J=21
            VBEZM: 0,         // Irrelevant bei LZZ=1
            VBEZS: 1200000,   // 12000.00 Cent Jahresversorgungsbezug
            LZZ: 1,           // Jahresberechnung
            ZMVB: 12,         // 12 Monate
            VBEZBSO: 50000,   // Sonstiger Versorgungsbezug in Cent = 500.00 Euro
            ALTER1: 0,
            AJAHR: 0,
            // Hinzugefügt für MRE4JL
            RE4: 3000000,     // 30000.00 Cent pro Jahr, damit ZRE4J = 30000.00 Euro
            VBEZ: 1200000,    // 12000.00 Cent pro Jahr, damit ZVBEZJ = 12000.00 Euro
            LZZFREIB: 0,
            LZZHINZU: 0,
            AF: 0,
            // Hinzugefügt für MPARA
            KRV: 0, KVZ: 0, PVS: 0, PVZ: 0, PVA: 0,
        };
        
        calculator.calculate(input);

        const tabEntryV = CONSTANTS.TAB_V_PARAMETER[21]; // J=21

        // Bestehende FVB = 990.00, FVBZ = 297.00 (aus Test 3, nach allen Begrenzungen)
        // input.VBEZBSO = 50000 Cent = 500.00 Euro

        // FVBSO = FVB + (input.VBEZBSO * TAB1(J) / 100)
        // FVBSO = 990.00 + (50000 * 0.132) / 100 = 990.00 + 66.00 = 1056.00 Euro (initial)
        // Begrenzung FVBSO > TAB2(J) = 990.00 (HOECHSTBETRAG_CENT / 100)
        // min(1056.00, 990.00) = 990.00
        expect(calculator.FVBSO).toBeCloseTo(990.00);

        // VBEZB = 1200000 Cent (aus input.VBEZS in diesem Test)
        // HFVBZSO = (VBEZB + VBEZBSO) / 100 - FVBSO
        // HFVBZSO = (1200000 + 50000) / 100 - 990.00 = 12500.00 - 990.00 = 11510.00 Euro
        expect(calculator.HFVBZSO).toBeCloseTo(11510.00);

        // FVBZSO = FVBZ + VBEZBSO / 100
        // FVBZSO = 297.00 + 50000 / 100 = 297.00 + 500.00 = 797.00 Euro (initial)
        // Begrenzung FVBZSO > HFVBZSO (797.00 < 11510.00) -> bleibt 797.00
        // Begrenzung FVBZSO > TAB3(J) = 297.00 (ZUSCHLAG_CENT / 100)
        // min(797.00, 297.00) = 297.00
        expect(calculator.FVBZSO).toBeCloseTo(297.00);
    });
});