// DRP2/payroll-service/utils/taxCalculator2025/MRE4JL.js

/**
 * MRE4JL - Ermittlung des Jahresarbeitslohns und der Freibeträge
 * (§ 39b Absatz 2 Satz 2 EStG)
 * (Seite 15 des Dokuments, Modul "MRE4JL")
 *
 * @param {object} state Das aktuelle Zustandsobjekt, das alle internen Felder enthält.
 * @param {object} input Die Eingabeparameter für die Berechnung.
 */
function MRE4JL(state, input) {
    console.log("Entering MRE4JL module: Ermittlung des Jahresarbeitslohns und der Freibeträge.");

    // Initialisierung der Jahreswerte
    state.ZRE4J = 0;
    state.ZVBEZJ = 0;
    state.JLFREIB = 0;
    state.JLHINZU = 0;

    // Hochrechnung auf Jahreswerte basierend auf LZZ (Lohnzahlungszeitraum)
    switch (input.LZZ) {
        case 1: // Jahr
            state.ZRE4J = input.RE4 / 100;         // Cent -> Euro, Cent (2 Dezimalstellen)
            state.ZVBEZJ = input.VBEZ / 100;       // Cent -> Euro, Cent (2 Dezimalstellen)
            state.JLFREIB = input.LZZFREIB / 100;  // Cent -> Euro, Cent (2 Dezimalstellen)
            state.JLHINZU = input.LZZHINZU / 100;  // Cent -> Euro, Cent (2 Dezimalstellen)
            break;
        case 2: // Monat
            state.ZRE4J = (input.RE4 * 12) / 100;
            state.ZVBEZJ = (input.VBEZ * 12) / 100;
            state.JLFREIB = (input.LZZFREIB * 12) / 100;
            state.JLHINZU = (input.LZZHINZU * 12) / 100;
            break;
        case 3: // Woche
            // PAP verwendet 360/7 für Wochenhochrechnung. Ergebnis ist eine Gleitkommazahl.
            state.ZRE4J = (input.RE4 * 360 / 7) / 100;
            state.ZVBEZJ = (input.VBEZ * 360 / 7) / 100;
            state.JLFREIB = (input.LZZFREIB * 360 / 7) / 100;
            state.JLHINZU = (input.LZZHINZU * 360 / 7) / 100;
            break;
        case 4: // Tag
            state.ZRE4J = (input.RE4 * 360) / 100;
            state.ZVBEZJ = (input.VBEZ * 360) / 100;
            state.JLFREIB = (input.LZZFREIB * 360) / 100;
            state.JLHINZU = (input.LZZHINZU * 360) / 100;
            break;
        default:
            console.warn(`[MRE4JL] Ungültiger Lohnzahlungszeitraum (LZZ): ${input.LZZ}`);
            // Hier könnte eine Fehlerbehandlung oder ein Standardwert greifen
            break;
    }

    // Faktorverfahren prüfen
    if (input.AF === 0) {
        state.F = 1; // F wird auf 1 gesetzt, wenn das Faktorverfahren nicht gewählt wurde
    } else {
        // Wenn AF = 1, wird der Faktor F aus den Eingabeparametern verwendet.
        // Der PAP sagt nichts über eine Zuweisung hier, nur wenn AF=0.
        // Es wird angenommen, dass F bereits korrekt im input oder state vorhanden ist.
        state.F = input.F; // Dies muss sicherstellen, dass F korrekt übergeben wird
    }

    console.log("Exiting MRE4JL module.");
}

module.exports = MRE4JL;