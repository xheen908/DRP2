// DRP2/payroll-service/tests/taxCalculator.test.js
import { calculateTax } from '../utils/taxCalculator.js';
import { bmfTestCases } from './bmfTestCases.js'; // Importiere die BMF Testfälle

// Da wir kein Jest verwenden und die package.json nicht ändern dürfen,
// werden wir einen einfachen manuellen Test-Runner erstellen.

function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  console.log('Starte BMF-Lohnsteuerberechnungs-Tests...');

  bmfTestCases.forEach((testCase, index) => {
    totalTests++;
    console.log(`\nFühre Testfall ${index + 1}: "${testCase.description}" aus...`);
    try {
      const result = calculateTax(testCase.input);

      let testPassed = true;
      for (const key in testCase.expected) {
        // Vergleich der erwarteten und tatsächlichen Werte
        if (result[key] !== testCase.expected[key]) {
          console.error(`  Fehler im Feld ${key}: Erwartet ${testCase.expected[key]}, Erhalten ${result[key]}`);
          testPassed = false;
        }
      }

      if (testPassed) {
        console.log(`  Testfall ${index + 1} BESTANDEN.`);
        passedTests++;
      } else {
        console.error(`  Testfall ${index + 1} FEHLGESCHLAGEN.`);
        // Optional: Detaillierte Ausgabe der Ergebnisse bei Fehlschlag
        console.error("  Eingabe:", testCase.input);
        console.error("  Erwartetes Ergebnis:", testCase.expected);
        console.error("  Tatsächliches Ergebnis:", result);
      }
    } catch (error) {
      console.error(`  Fehler beim Ausführen von Testfall ${index + 1}:`, error);
      console.error("  Eingabe, die den Fehler verursacht hat:", testCase.input);
    }
  });

  console.log(`\n--- Testzusammenfassung ---`);
  console.log(`Gesamtzahl der Tests: ${totalTests}`);
  console.log(`Bestandene Tests: ${passedTests}`);
  console.log(`Fehlgeschlagene Tests: ${totalTests - passedTests}`);

  if (passedTests === totalTests) {
    console.log('Alle BMF-Testfälle BESTANDEN!');
  } else {
    console.error('Einige BMF-Testfälle SIND FEHLGESCHLAGEN. Bitte überprüfen Sie die Details oben.');
  }
}

// Führe die Tests aus
runTests();