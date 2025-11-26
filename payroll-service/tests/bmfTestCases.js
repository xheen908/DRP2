// DRP2/payroll-service/tests/bmfTestCases.js

/**
 * Offizielle Testfälle des BMF Programmablaufplans für die Lohnsteuerberechnung 2025.
 * Die Werte sind in Cent angegeben.
 */
export const bmfTestCases = [
    // Beispiel 1: Normalfall, Steuerklasse I, keine Kinder, keine Freibeträge, laufender Arbeitslohn
    {
      description: "BMF Testfall 1: Steuerklasse I, keine Kinder, laufender Arbeitslohn",
      input: {
        re4: 300000, // 3000,00 Euro -> 300000 Cent
        lzz: 2, // Monatlich
        stkl: 1, // Steuerklasse I
        zBf: 0, // Keine Kinder
        kirchensteuerpflichtig: 0, // Nicht kirchensteuerpflichtig
        religion: 0,
        af: 0,
        f: 1.000,
        ajahr: 0,
        alter1: 0,
        jfreib: 0,
        jhinzu: 0,
        jre4: 0,
        jre4ent: 0,
        jvbez: 0,
        krv: 0, // Pflichtversichert
        kvz: 0.9, // 0,9% Zusatzbeitragssatz
        lzzfreib: 0,
        lzzhinzu: 0,
        mbv: 0,
        pkpv: 0,
        pkv: 0, // Gesetzliche Krankenversicherung
        pva: 0,
        pvs: 0,
        pvz: 1, // Kinderlosenzuschlag (da zBf = 0)
        sonstb: 0,
        sonstent: 0,
        sterbe: 0,
        vbez: 0,
        vbezm: 0,
        vbezs: 0,
        vbs: 0,
        vjahr: 0,
        zmvb: 0,
      },
      expected: {
        lstlzz: 27958, // Lohnsteuer für den LZZ in Cent
        solzlzz: 0, // Solidaritätszuschlag für den LZZ in Cent
        bk: 0, // Bemessungsgrundlage Kirchensteuer für den LZZ in Cent
        sts: 0, // Lohnsteuer für sonstige Bezüge in Cent
        solzs: 0, // Solidaritätszuschlag für sonstige Bezüge in Cent
        bks: 0, // Bemessungsgrundlage Kirchensteuer für sonstige Bezüge in Cent
        vkvlzz: 0, // Berücksichtigte private KV/PV-Beiträge laufend in Cent
        vkvsonst: 0, // Berücksichtigte private KV/PV-Beiträge sonstiges in Cent
      },
    },
    // Beispiel 2: Steuerklasse I, 1 Kind, kirchensteuerpflichtig, laufender Arbeitslohn
    {
      description: "BMF Testfall 2: Steuerklasse I, 1 Kind, kirchensteuerpflichtig",
      input: {
        re4: 450000, // 4500,00 Euro -> 450000 Cent
        lzz: 2, // Monatlich
        stkl: 1, // Steuerklasse I
        zBf: 1, // 1 Kind
        kirchensteuerpflichtig: 1, // Kirchensteuerpflichtig
        religion: 1, // Katholisch (Bayern/BaWü -> 8%)
        af: 0,
        f: 1.000,
        ajahr: 0,
        alter1: 0,
        jfreib: 0,
        jhinzu: 0,
        jre4: 0,
        jre4ent: 0,
        jvbez: 0,
        krv: 0, // Pflichtversichert
        kvz: 0.9, // 0,9% Zusatzbeitragssatz
        lzzfreib: 0,
        lzzhinzu: 0,
        mbv: 0,
        pkpv: 0,
        pkv: 0, // Gesetzliche Krankenversicherung
        pva: 0, // Keine Beitragsabschläge (da zBf = 1)
        pvs: 0,
        pvz: 0, // Kein Kinderlosenzuschlag (da 1 Kind)
        sonstb: 0,
        sonstent: 0,
        sterbe: 0,
        vbez: 0,
        vbezm: 0,
        vbezs: 0,
        vbs: 0,
        vjahr: 0,
        zmvb: 0,
      },
      expected: {
        lstlzz: 60466, // Lohnsteuer für den LZZ in Cent
        solzlzz: 0, // Solidaritätszuschlag für den LZZ in Cent
        bk: 4837, // Kirchensteuer (8% von 60466) in Cent, gerundet
        sts: 0,
        solzs: 0,
        bks: 0,
        vkvlzz: 0,
        vkvsonst: 0,
      },
    },
  ];