// DRP2/payroll-service/test.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// --- KONSTANTEN FÜR LAYOUT ---
const MARGIN_LEFT = 25;
const MARGIN_RIGHT = 25;
const PAGE_WIDTH = 595.28 - MARGIN_LEFT - MARGIN_RIGHT;
const ROW_HEIGHT = 10.5;

// Spalten-Definition für Brutto-Tabelle (zur Referenz)
const BRUTTO_COLS = [
    { label: 'Lohnart', x: MARGIN_LEFT, width: 35, align: 'left' },
    { label: 'Bezeichnung', x: MARGIN_LEFT + 35, width: 90, align: 'left' },
    { label: 'Einheit', x: MARGIN_LEFT + 125, width: 30, align: 'left' },
    { label: 'Menge', x: MARGIN_LEFT + 155, width: 35, align: 'left' },
    { label: 'Faktor', x: MARGIN_LEFT + 190, width: 35, align: 'left' },
    { label: 'Prozentsatz', x: MARGIN_LEFT + 225, width: 55, align: 'left' },
    { label: 'St', x: MARGIN_LEFT + 280, width: 15, align: 'center' },
    { label: 'SV', x: MARGIN_LEFT + 295, width: 15, align: 'center' },
    { label: 'GB', x: MARGIN_LEFT + 310, width: 15, align: 'center' },
    { label: 'Betrag', x: MARGIN_LEFT + 325, width: 70, align: 'right' }
];

async function generateGermanPayslipPDF(payslipData, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 25, bottom: 20, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            font: 'Helvetica'
        });

        doc.pipe(fs.createWriteStream(outputPath));

        // --- HILFSFUNKTIONEN (Sicherer Zugriff auf 'doc') ---
        const drawLine = (x1, y1, x2, y2, width = 0.5) => {
            doc.lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke();
        };

        const drawBox = (x, y, width, height, borderWidth = 0.5) => {
            doc.lineWidth(borderWidth).rect(x, y, width, height).stroke();
        };

        const addText = (text, x, y, options = {}) => {
            const defaultOptions = {
                align: 'left',
                width: 100,
                ...options
            };
            doc.text(text, x, y, defaultOptions);
        };
        
        // --- MODUL: Header und Briefkopf (ANGEPASST) ---
        function drawHeaderAndInfo(data) {
            let currentY = doc.y;

            // --- Top-Header-Leiste ---
            doc.fontSize(8);
            addText('Abrechnung der Brutto/Netto-Bezüge', MARGIN_LEFT, currentY, { width: 150 });
            addText(`für ${data.month} ${data.year}`, MARGIN_LEFT + 150, currentY, { width: 80 });
            addText(`Zeitraum: ${data.payrollPeriodStart} - ${data.payrollPeriodEnd}`, MARGIN_LEFT + 250, currentY, { width: 150 });
            addText(data.date, MARGIN_LEFT + PAGE_WIDTH - 100, currentY, { width: 70, align: 'right' });
            addText(`Blatt ${data.page}`, MARGIN_LEFT + PAGE_WIDTH - 25, currentY, { width: 25, align: 'right' });
            currentY += 10;

            drawLine(MARGIN_LEFT, currentY, MARGIN_LEFT + PAGE_WIDTH, currentY);
            currentY += 4;

            // --- Haupt-Briefkopf-Bereich ---
            const blockHeight = 40;
            const blockWidth1 = 260;
            const blockX2 = MARGIN_LEFT + blockWidth1 + 10;

            drawBox(MARGIN_LEFT, currentY, blockWidth1, blockHeight);
            drawBox(blockX2, currentY, PAGE_WIDTH - blockWidth1 - 10, blockHeight);

            // Linke Box (Daten)
            let textY = currentY + 4;
            doc.fontSize(7.5);
            addText('Personal-Nr.', MARGIN_LEFT + 4, textY);
            addText('SV-Nummer', MARGIN_LEFT + 4, textY + ROW_HEIGHT);
            addText('Krankenkasse', MARGIN_LEFT + 4, textY + ROW_HEIGHT * 2);

            addText(data.personalNr, MARGIN_LEFT + 65, textY);
            addText(data.svNumber, MARGIN_LEFT + 65, textY + ROW_HEIGHT);
            addText(data.krankenkasse, MARGIN_LEFT + 65, textY + ROW_HEIGHT * 2);

            // Rechte Box (Kennzahlen)
            let rightBoxTextX = blockX2 + 4;
            let rightBoxTextY = currentY + 4;

            // Vertikale Linien für die Kennzahlen
            drawLine(rightBoxTextX + 25, currentY, rightBoxTextX + 25, currentY + blockHeight);
            drawLine(rightBoxTextX + 60, currentY, rightBoxTextX + 60, currentY + blockHeight);
            drawLine(rightBoxTextX + 110, currentY, rightBoxTextX + 110, currentY + blockHeight);
            
            // Header
            addText('KK%', rightBoxTextX + 2, rightBoxTextY);
            addText('PGRS', rightBoxTextX + 30, rightBoxTextY);
            addText('BGRS', rightBoxTextX + 65, rightBoxTextY);
            addText('St-Tg', rightBoxTextX + 115, rightBoxTextY);
            
            // Werte
            rightBoxTextY += ROW_HEIGHT;
            addText('157', rightBoxTextX + 2, rightBoxTextY);
            addText('101', rightBoxTextX + 30, rightBoxTextY);
            addText('1111', rightBoxTextX + 65, rightBoxTextY);
            addText('30', rightBoxTextX + 115, rightBoxTextY);
            
            // Eintritt
            rightBoxTextY += ROW_HEIGHT;
            addText('Eintritt', rightBoxTextX + 2, rightBoxTextY);
            addText(data.eintrittsdatum, rightBoxTextX + 45, rightBoxTextY);

            currentY += blockHeight + 8;

            // --- Mitarbeiteradresse & Hinweise zur Abrechnung ---
            const addrHeight = 45; 
            drawBox(blockX2, currentY, PAGE_WIDTH - blockWidth1 - 10, addrHeight);

            // Adresse links
            // 1. Firmenadresse: KLEINERE SCHRIFTGRÖSSE
            doc.fontSize(7); // <--- ANGEPASST: Kleiner als 7.5
            addText(data.employerName, MARGIN_LEFT + 4, currentY + 2, {font: 'Helvetica-Bold'});

            // 2. Leerzeile: ROW_HEIGHT
            
            // 3. Mitarbeiteradresse: Startet zwei Zeilen tiefer (ROW_HEIGHT für Firmenname + ROW_HEIGHT für Leerzeile)
            doc.fontSize(7.5); // Zurück zur Standardgröße
            
            let employeeAddressY = currentY + 2 + ROW_HEIGHT * 2; // + 2 wegen Padding + 2 * ROW_HEIGHT (Firmenname + Leerzeile)

            // Mitarbeitername
            addText(data.employeeName, MARGIN_LEFT + 4, employeeAddressY);

            // Mitarbeiteradresse: Zeile 1 (Straße und Hausnummer getrennt)
            employeeAddressY += ROW_HEIGHT;
            // Der erste Teil (Straße und Hausnummer)
            addText(data.employeeAddressStreetHouseNo, MARGIN_LEFT + 4, employeeAddressY);
            
            // Zeilenumbruch: Der zweite Teil (PLZ und Ort)
            employeeAddressY += ROW_HEIGHT;
            addText(data.employeeAddressLine2, MARGIN_LEFT + 4, employeeAddressY);
            
            // Hinweise rechts
            doc.fontSize(7.5).text('Hinweise zur Abrechnung', blockX2 + 4, currentY + 4, { font: 'Helvetica-Bold' });
            
            return currentY + addrHeight + 15;
        }

        // --- MODUL: Brutto-Tabelle ---
        function drawBruttoTable(startY) {
            doc.fontSize(9).text('Brutto-Bezüge', MARGIN_LEFT, startY).moveDown(0.2);
            let currentY = doc.y;
            const headerY = currentY;
            const headerHeight = 12;

            doc.fontSize(7.5);
            
            // Header zeichnen
            BRUTTO_COLS.forEach(col => {
                addText(col.label, col.x, headerY, { width: col.width, align: col.align, font: 'Helvetica-Bold' });
            });
            
            // Horizontale Linie
            const bruttoTableEnd = BRUTTO_COLS[BRUTTO_COLS.length - 1].x + BRUTTO_COLS[BRUTTO_COLS.length - 1].width;
            drawLine(MARGIN_LEFT, headerY + headerHeight, bruttoTableEnd, headerY + headerHeight); 
            currentY = headerY + headerHeight + 2;

            const dataStartY = currentY;
            let dataCurrentY = dataStartY;
            
            // Datenzeilen zeichnen
            payslipData.bruttoBezug.forEach(item => {
                addText(item.lohnart, BRUTTO_COLS[0].x, dataCurrentY, { width: BRUTTO_COLS[0].width, align: 'left' });
                addText(item.bezeichnung, BRUTTO_COLS[1].x, dataCurrentY, { width: BRUTTO_COLS[1].width, align: 'left' });
                addText(item.stKZ, BRUTTO_COLS[6].x, dataCurrentY, { width: BRUTTO_COLS[6].width, align: 'center' });
                addText(item.svKZ, BRUTTO_COLS[7].x, dataCurrentY, { width: BRUTTO_COLS[7].width, align: 'center' });
                addText(item.gbKZ, BRUTTO_COLS[8].x, dataCurrentY, { width: BRUTTO_COLS[8].width, align: 'center' });
                addText(item.betrag, BRUTTO_COLS[9].x, dataCurrentY, { width: BRUTTO_COLS[9].width, align: 'right', font: 'Helvetica' });
                dataCurrentY += ROW_HEIGHT;
            });
            
            // Vertikale Linien für die ganze Tabelle
            const vertLineStart = headerY;
            const vertLineEnd = dataCurrentY + 5;
            drawLine(BRUTTO_COLS[6].x, vertLineStart, BRUTTO_COLS[6].x, vertLineEnd);
            drawLine(BRUTTO_COLS[7].x, vertLineStart, BRUTTO_COLS[7].x, vertLineEnd);
            drawLine(BRUTTO_COLS[8].x, vertLineStart, BRUTTO_COLS[8].x, vertLineEnd);
            
            // Gesamt-Brutto Box (Rechte Spalte)
            const gesamtBruttoBoxX = MARGIN_LEFT + PAGE_WIDTH - 100;
            const gesamtBruttoBoxWidth = 100;
            const gesamtBruttoBoxHeight = 35;
            const gesamtBruttoY = headerY; 

            addText('Gesamt-Brutto', gesamtBruttoBoxX + 5, gesamtBruttoY + 4, { width: gesamtBruttoBoxWidth - 10, font: 'Helvetica-Bold', fontSize: 8.5 });
            addText(payslipData.gesamtBrutto, gesamtBruttoBoxX + 5, gesamtBruttoY + 18, { align: 'right', width: gesamtBruttoBoxWidth - 10, font: 'Helvetica-Bold', fontSize: 8.5 });
            drawBox(gesamtBruttoBoxX, gesamtBruttoY, gesamtBruttoBoxWidth, gesamtBruttoBoxHeight);

            currentY = vertLineEnd + 10;
            drawLine(MARGIN_LEFT, currentY, gesamtBruttoBoxX - 10, currentY); 
            
            return currentY + 5;
        }

        // --- MODUL: Steuer/Sozialversicherung ---
        function drawSteuerSVTable(startY) {
            doc.fontSize(9).text('Steuer/Sozialversicherung', MARGIN_LEFT, startY).moveDown(0.2);
            let currentY = doc.y;
            const headerY = currentY;
            const headerHeight = 12;

            doc.fontSize(7.5);
            
            // Steuer-Header
            const steuerCols = [
                { label: 'St¹', x: MARGIN_LEFT, width: 25, align: 'left' },
                { label: 'Steuer-Brutto', x: MARGIN_LEFT + 25, width: 70, align: 'right' },
                { label: 'Lohnsteuer', x: MARGIN_LEFT + 95, width: 60, align: 'right' },
                { label: 'Kirchensteuer', x: MARGIN_LEFT + 155, width: 60, align: 'right' },
                { label: 'Solidaritätszuschlag', x: MARGIN_LEFT + 215, width: 80, align: 'right' }
            ];
            
            steuerCols.forEach(col => {
                addText(col.label, col.x, headerY, { width: col.width, align: col.align, font: 'Helvetica-Bold' });
            });
            
            // Horizontale Linie
            const steuerTableEnd = steuerCols[steuerCols.length - 1].x + steuerCols[steuerCols.length - 1].width;
            drawLine(MARGIN_LEFT, headerY + headerHeight, steuerTableEnd, headerY + headerHeight);
            currentY = headerY + headerHeight + 2;

            // Steuer-Werte
            addText('L', steuerCols[0].x, currentY, { width: steuerCols[0].width, align: 'center' });
            addText(payslipData.steuerBrutto, steuerCols[1].x, currentY, { width: steuerCols[1].width, align: 'right' });
            addText(payslipData.lohnsteuer, steuerCols[2].x, currentY, { width: steuerCols[2].width, align: 'right' });
            addText(payslipData.kirchensteuer, steuerCols[3].x, currentY, { width: steuerCols[3].width, align: 'right' });
            addText(payslipData.soliZuschlag, steuerCols[4].x, currentY, { width: steuerCols[4].width, align: 'right' });
            currentY += ROW_HEIGHT + 5;

            // Vertikale Linien
            for (let i = 1; i < steuerCols.length; i++) {
                drawLine(steuerCols[i].x, headerY, steuerCols[i].x, currentY); 
            }
            
            const steuerEnd = currentY;
            currentY += 8;

            // SV-Header
            const svCols = [
                { label: 'SV²', x: MARGIN_LEFT, width: 25, align: 'left' },
                { label: 'KV-Brutto', x: MARGIN_LEFT + 25, width: 45, align: 'right' },
                { label: 'RV-Brutto', x: MARGIN_LEFT + 70, width: 45, align: 'right' },
                { label: 'AV-Brutto', x: MARGIN_LEFT + 115, width: 45, align: 'right' },
                { label: 'PV-Brutto', x: MARGIN_LEFT + 160, width: 45, align: 'right' },
                { label: 'KV-Beitrag', x: MARGIN_LEFT + 205, width: 50, align: 'right' },
                { label: 'RV-Beitrag', x: MARGIN_LEFT + 255, width: 50, align: 'right' },
                { label: 'AV-Beitrag', x: MARGIN_LEFT + 305, width: 50, align: 'right' },
                { label: 'PV-Beitrag', x: MARGIN_LEFT + 355, width: 50, align: 'right' }
            ];
            const svHeaderY = currentY;
            
            svCols.forEach(col => {
                addText(col.label, col.x, svHeaderY, { width: col.width, align: col.align, font: 'Helvetica-Bold' });
            });
            
            // Horizontale Linie
            const svTableEnd = svCols[svCols.length - 1].x + svCols[svCols.length - 1].width;
            drawLine(MARGIN_LEFT, svHeaderY + headerHeight, svTableEnd, svHeaderY + headerHeight);
            currentY = svHeaderY + headerHeight + 2;

            // SV-Werte
            addText('L', svCols[0].x, currentY, { width: svCols[0].width, align: 'center' });
            addText(payslipData.kvBrutto, svCols[1].x, currentY, { width: svCols[1].width, align: 'right' });
            addText(payslipData.rvBrutto, svCols[2].x, currentY, { width: svCols[2].width, align: 'right' });
            addText(payslipData.avBrutto, svCols[3].x, currentY, { width: svCols[3].width, align: 'right' });
            addText(payslipData.pvBrutto, svCols[4].x, currentY, { width: svCols[4].width, align: 'right' });
            addText(payslipData.kvBeitrag, svCols[5].x, currentY, { width: svCols[5].width, align: 'right' });
            addText(payslipData.rvBeitrag, svCols[6].x, currentY, { width: svCols[6].width, align: 'right' });
            addText(payslipData.avBeitrag, svCols[7].x, currentY, { width: svCols[7].width, align: 'right' });
            addText(payslipData.pvBeitrag, svCols[8].x, currentY, { width: svCols[8].width, align: 'right' });
            currentY += ROW_HEIGHT;
            
            // Vertikale Linien
            for (let i = 1; i < svCols.length; i++) {
                drawLine(svCols[i].x, svHeaderY, svCols[i].x, currentY); 
            }
            
            const svEnd = currentY;

            // --- Abzugs-Boxen (Rechts) ---
            const rechtsBoxX = MARGIN_LEFT + PAGE_WIDTH - 100;
            const rechtsBoxWidth = 100;
            const rechtsMiniBoxHeight = 35; 

            // Steuerrechtliche Abzüge
            const steuerAbzuegeY = headerY; 
            addText('Steuerrechtliche', rechtsBoxX + 5, steuerAbzuegeY + 2, {fontSize: 7.5});
            addText('Abzüge', rechtsBoxX + 5, steuerAbzuegeY + ROW_HEIGHT, {fontSize: 7.5});
            addText(payslipData.steuerrechtlicheAbzuege, rechtsBoxX + 5, steuerAbzuegeY + 22, {align: 'right', width: rechtsBoxWidth - 10, font: 'Helvetica-Bold', fontSize: 8.5});
            drawBox(rechtsBoxX, steuerAbzuegeY, rechtsBoxWidth, rechtsMiniBoxHeight);

            // SV-rechtliche Abzüge
            const svAbzuegeY = steuerAbzuegeY + rechtsMiniBoxHeight + 5;
            addText('SV-rechtliche', rechtsBoxX + 5, svAbzuegeY + 2, {fontSize: 7.5});
            addText('Abzüge', rechtsBoxX + 5, svAbzuegeY + ROW_HEIGHT, {fontSize: 7.5});
            addText(payslipData.svRechtlicheAbzuege, rechtsBoxX + 5, svAbzuegeY + 22, {align: 'right', width: rechtsBoxWidth - 10, font: 'Helvetica-Bold', fontSize: 8.5});
            drawBox(rechtsBoxX, svAbzuegeY, rechtsBoxWidth, rechtsMiniBoxHeight);
            
            return Math.max(steuerEnd, svEnd, svAbzuegeY + rechtsMiniBoxHeight) + 10;
        }


        let currentY = doc.y;

        // 1. Header und Info-Blöcke
        currentY = drawHeaderAndInfo(payslipData);

        // 2. Brutto-Tabelle und Gesamt-Brutto
        currentY = drawBruttoTable(currentY);
        
        // 3. Steuer/Sozialversicherung und Abzugs-Boxen
        currentY = drawSteuerSVTable(currentY);


        // --- Verdienstbescheinigung / Netto-Bezüge/-Abzüge / Netto-Verdienst ---
        doc.fontSize(9).text('Verdienstbescheinigung', MARGIN_LEFT, currentY).moveDown(0.2);
        doc.fontSize(7.5);
        const verdienstY = doc.y;
        let verdienstCurrentY = verdienstY;

        // Linke Spalte: Verdienstbescheinigung Details (Spalten 1 & 2)
        const verdienstCol1X = MARGIN_LEFT;
        const verdienstCol1Width = 120;
        const verdienstCol2X = verdienstCol1X + verdienstCol1Width;
        const verdienstCol2Width = 50;

        const fields = [
            { label: 'Gesamt-Brutto', valueKey: 'gesamtBrutto' },
            { label: 'Lohnsteuer', valueKey: 'lohnsteuerBescheinigung' },
            { label: 'Kirchensteuer', valueKey: 'kirchensteuerBescheinigung' },
            { label: 'Solidaritätszuschlag', valueKey: 'soliZuschlagBescheinigung' },
            { label: 'P. verst. Zukl.', valueKey: 'pauschalVerstZukl' },
        ];
        
        fields.forEach(field => {
            addText(field.label, verdienstCol1X, verdienstCurrentY, { width: verdienstCol1Width, align: 'left' });
            addText(payslipData[field.valueKey], verdienstCol2X, verdienstCurrentY, { width: verdienstCol2Width, align: 'right' });
            verdienstCurrentY += ROW_HEIGHT;
        });

        // Mittlere Spalte: Netto-Bezüge/-Abzüge
        let nettoMittigY = verdienstY; 
        const nettoMittigColX = MARGIN_LEFT + 200; 
        const nettoMittigCol1Width = 40; 
        const nettoMittigCol2Width = 100; 
        const nettoMittigCol3Width = 50; 

        doc.text('Netto-Bezüge/-Abzüge', nettoMittigColX, nettoMittigY, {font: 'Helvetica-Bold'}); nettoMittigY += ROW_HEIGHT;

        doc.font('Helvetica-Bold');
        addText('Lohnart', nettoMittigColX, nettoMittigY, { width: nettoMittigCol1Width });
        addText('Bezeichnung', nettoMittigColX + nettoMittigCol1Width, nettoMittigY, { width: nettoMittigCol2Width });
        addText('Betrag', nettoMittigColX + nettoMittigCol1Width + nettoMittigCol2Width, nettoMittigY, { align: 'right', width: nettoMittigCol3Width });
        nettoMittigY += ROW_HEIGHT;
        
        doc.font('Helvetica');
        addText(payslipData.nettoBezugLohnart, nettoMittigColX, nettoMittigY, { width: nettoMittigCol1Width });
        addText(payslipData.nettoBezugBezeichnung, nettoMittigColX + nettoMittigCol1Width, nettoMittigY, { width: nettoMittigCol2Width });
        addText(payslipData.abzugJobticket, nettoMittigColX + nettoMittigCol1Width + nettoMittigCol2Width, nettoMittigY, { align: 'right', width: nettoMittigCol3Width });
        nettoMittigY += ROW_HEIGHT;


        // Rechte Spalte (ganz rechts): Netto-Verdienst & Auszahlungsbetrag
        const nettoRechtsBoxX = MARGIN_LEFT + PAGE_WIDTH - 100;
        const nettoRechtsBoxWidth = 100;
        const boxHeight = 35;

        const nettoVerdienstY = verdienstY;
        addText('Netto-Verdienst', nettoRechtsBoxX + 5, nettoVerdienstY + 4, {fontSize: 8.5});
        addText(payslipData.nettoVerdienst, nettoRechtsBoxX + 5, nettoVerdienstY + 18, {align: 'right', width: nettoRechtsBoxWidth - 10, font: 'Helvetica-Bold', fontSize: 8.5});
        drawBox(nettoRechtsBoxX, nettoVerdienstY, nettoRechtsBoxWidth, boxHeight); 

        const auszahlungsBetragY = nettoVerdienstY + boxHeight + 5;
        addText('Auszahlungsbetrag', nettoRechtsBoxX + 5, auszahlungsBetragY + 4, {fontSize: 8.5});
        addText(payslipData.auszahlungsbetrag, nettoRechtsBoxX + 5, auszahlungsBetragY + 18, {align: 'right', width: nettoRechtsBoxWidth - 10, font: 'Helvetica-Bold', fontSize: 8.5});
        drawBox(nettoRechtsBoxX, auszahlungsBetragY, nettoRechtsBoxWidth, boxHeight); 

        currentY = Math.max(verdienstCurrentY, nettoMittigY, auszahlungsBetragY + boxHeight) + 20;

        // --- Bankdaten & Fußzeile ---
        doc.fontSize(7.5);
        addText('Bank', MARGIN_LEFT, currentY);
        addText(payslipData.bank, MARGIN_LEFT + 50, currentY);
        currentY += ROW_HEIGHT;
        addText('Konto', MARGIN_LEFT, currentY);
        addText(payslipData.konto, MARGIN_LEFT + 50, currentY);
        currentY += 20;

        const footerBottomY = doc.page.height - doc.page.margins.bottom - 20;

        // SV-AG-Anteil (unten rechts)
        const blockY = footerBottomY - 10;
        const blockHeightFooter = 25;
        const svAgX = MARGIN_LEFT + PAGE_WIDTH - 250; 
        const blockWidthFooter = 80;
        
        const footerBoxes = [
            { label: 'SV-AG-Anteil', valueKey: 'svAgAnteil' },
            { label: 'Zus. AG-Kosten', valueKey: 'zusAgKosten' },
            { label: 'Gesamtkosten', valueKey: 'gesamtkosten' }
        ];

        let footerX = svAgX;
        footerBoxes.forEach(box => {
            drawBox(footerX, blockY, blockWidthFooter, blockHeightFooter);
            addText(box.label, footerX + 5, blockY + 2, {fontSize: 7.5});
            addText(payslipData[box.valueKey], footerX + 5, blockY + 15, {align: 'right', width: blockWidthFooter - 10, fontSize: 7.5});
            footerX += blockWidthFooter + 5;
        });
        
        // Kleiner Legendentext (ganz unten, links)
        doc.fontSize(6).text('¹ Steuerklasse | ² Sozialversicherungskennzeichen (L=laufend, J=Jahresmeldung)', MARGIN_LEFT, doc.page.height - doc.page.margins.bottom + 5);


        doc.end();

        doc.on('end', resolve);
        doc.on('error', reject);
    });
}

// Beispiel-Daten (ANGEPASST)
const testPayslipData = {
    personalNr: '0000',
    svNumber: '123456789',
    krankenkasse: 'AOK Musterkasse',
    eintrittsdatum: '01.08.2019',
    month: 'November',
    year: '2019',
    date: '21.11.2019',
    page: '1',
    // --- NEUE STRUKTUR DER ADRESSDATEN ---
    employerName: 'DRP2 GmbH, Musterstraße 42, 12345 Musterstadt', // Bleibt als eine Zeile (Wunsch)
    employeeName: 'Max Mustermann',
    employeeAddressStreetHouseNo: 'Musterstraße 1', // Neu: Nur Straße und Hausnummer
    employeeAddressLine2: '09876 Musterstadt', // Postleitzahl und Ort
    // ------------------------------------
    
    bruttoBezug: [
        { lohnart: '3000', bezeichnung: 'Sachbezug Jobticket', stKZ: 'F', svKZ: 'L', gbKZ: 'J', betrag: '20,00' },
        { lohnart: '2000', bezeichnung: 'Gehalt', stKZ: 'L', svKZ: 'L', gbKZ: 'J', betrag: '3.700,00' },
    ],
    gesamtBrutto: '3.720,00',
    
    steuerBrutto: '3.700,00',
    lohnsteuer: '601,00',
    kirchensteuer: '48,10',
    soliZuschlag: '33,06',
    steuerrechtlicheAbzuege: '682,16', 
    
    kvBrutto: '3.700,00',
    rvBrutto: '3.700,00',
    avBrutto: '3.700,00',
    pvBrutto: '3.700,00',
    kvBeitrag: '292,02',
    rvBeitrag: '345,96',
    avBeitrag: '46,50',
    pvBeitrag: '66,03',
    svRechtlicheAbzuege: '750,51', 
    
    lohnsteuerBescheinigung: '1.168,08',
    kirchensteuerBescheinigung: '1.383,84', 
    soliZuschlagBescheinigung: '264,12', 
    pauschalVerstZukl: '80,00', 
    
    nettoBezugLohnart: '3100',
    nettoBezugBezeichnung: 'Abzug Geldw. Vorteil Jobticket',
    abzugJobticket: '-20,00',
    
    nettoVerdienst: '2.287,33',
    auszahlungsbetrag: '2.267,33',
    
    bank: 'Beispielbank',
    konto: 'DE00-0000-0000-0000-0000-00',
    
    payrollPeriodStart: '01.11.2019',
    payrollPeriodEnd: '30.11.2019',
    svAgAnteil: '743,44',
    zusAgKosten: '14,00',
    gesamtkosten: '3.720,00',
};

const outputFilePath = path.join(__dirname, 'test_deutsche_lohnabrechnung_v4_address_fix.pdf');

generateGermanPayslipPDF(testPayslipData, outputFilePath)
    .then(() => console.log(`Test-PDF (pdfkit) erfolgreich generiert: ${outputFilePath}`))
    .catch(error => console.error('Fehler beim Generieren des Test-PDF (pdfkit):', error));