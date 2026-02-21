const PDFDocument = require('pdfkit');

const ML = 25;
const MR = 25;
const PW = 545.28;
const RH = 10.5;

// Spalten-Definitionen für die Brutto-Tabelle (DIN 5008 konform)
const BR_COLS = [
    { label: 'Lohnart', x: ML, width: 35, align: 'left' },
    { label: 'Bezeichnung', x: ML + 35, width: 90, align: 'left' },
    { label: 'Einheit', x: ML + 125, width: 30, align: 'left' },
    { label: 'Menge', x: ML + 155, width: 35, align: 'right' },
    { label: 'Faktor', x: ML + 195, width: 35, align: 'right' },
    { label: 'Prozent', x: ML + 235, width: 40, align: 'right' },
    { label: 'St', x: ML + 280, width: 15, align: 'center' },
    { label: 'SV', x: ML + 295, width: 15, align: 'center' },
    { label: 'GB', x: ML + 310, width: 15, align: 'center' },
    { label: 'Betrag', x: ML + 325, width: 70, align: 'right' }
];

async function generateGermanPayslipPDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margins: { top: 25, bottom: 20, left: ML, right: MR }, font: 'Helvetica' });
            let buffers = []; doc.on('data', buffers.push.bind(buffers)); doc.on('end', () => resolve(Buffer.concat(buffers)));

            const drawLine = (x1, y1, x2, y2, width = 0.5) => doc.lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke();
            const drawBox = (x, y, w, h, bw = 0.5) => doc.lineWidth(bw).rect(x, y, w, h).stroke();
            const addText = (t, x, y, opt = {}) => doc.fontSize(opt.fontSize || 7.5).text(t || '', x, y, { width: opt.width || 100, align: opt.align || 'left', ...opt });

            // --- BRIEFKOPF ---
            let curY = 25;
            addText('Abrechnung der Brutto/Netto-Bezüge', ML, curY, { fontSize: 8, width: 150 });
            addText(`für ${data.month} ${data.year}`, ML + 150, curY, { fontSize: 8 });
            addText(data.date, ML + PW - 70, curY, { fontSize: 8, align: 'right', width: 70 });
            curY += 10; drawLine(ML, curY, ML + PW, curY); curY += 4;

            drawBox(ML, curY, 260, 40); 
            drawBox(ML + 270, curY, PW - 270, 40);
            
            addText('Personal-Nr.', ML + 4, curY + 4); addText(data.personalNr, ML + 65, curY + 4);
            addText('SV-Nummer', ML + 4, curY + 4 + RH); addText(data.svNumber, ML + 65, curY + 4 + RH);
            addText('Krankenkasse', ML + 4, curY + 4 + RH * 2); addText(data.krankenkasse, ML + 65, curY + 4 + RH * 2);

            let rBX = ML + 270 + 4;
            drawLine(rBX + 25, curY, rBX + 25, curY + 40); 
            drawLine(rBX + 60, curY, rBX + 60, curY + 40); 
            drawLine(rBX + 110, curY, rBX + 110, curY + 40);
            addText('KK%', rBX + 2, curY + 4); addText('PGRS', rBX + 30, curY + 4); addText('BGRS', rBX + 65, curY + 4); addText('St-Tg', rBX + 115, curY + 4);
            addText('15.7', rBX + 2, curY + 4 + RH); addText('101', rBX + 30, curY + 4 + RH); addText('1111', rBX + 65, curY + 4 + RH); addText('30', rBX + 115, curY + 4 + RH);
            addText('Eintritt', rBX + 2, curY + 4 + RH * 2); addText(data.eintritt, rBX + 45, curY + 4 + RH * 2);

            curY += 48;
            drawBox(ML + 270, curY, PW - 270, 45);
            addText(data.employerName, ML + 4, curY + 2, { fontSize: 8, underline: true });
            doc.fontSize(7.5).font('Helvetica');
            addText(data.employeeName, ML + 4, curY + 2 + RH * 2);
            addText(data.addr1, ML + 4, curY + 2 + RH * 3);
            addText(data.addr2, ML + 4, curY + 2 + RH * 4);
            addText('Hinweise zur Abrechnung', ML + 274, curY + 4, { font: 'Helvetica-Bold' });

            curY += 65;

            // --- BRUTTO TABELLE ---
            addText('Brutto-Bezüge', ML, curY, { fontSize: 9, font: 'Helvetica-Bold' }); curY += 12;
            BR_COLS.forEach(c => addText(c.label, c.x, curY, { width: c.width, align: c.align, font: 'Helvetica-Bold' }));
            curY += 12; drawLine(ML, curY, ML + PW - 110, curY); curY += 2;
            
            const tableStartY = curY;
            if (data.bruttoItems && Array.isArray(data.bruttoItems)) {
                data.bruttoItems.forEach(i => {
                    addText(i.lohnart, BR_COLS[0].x, curY);
                    addText(i.bezeichnung || i.label, BR_COLS[1].x, curY, { width: 90 });
                    addText(i.einheit || '', BR_COLS[2].x, curY, { width: 30 });
                    addText(i.menge || '', BR_COLS[3].x, curY, { align: 'right', width: 35 });
                    addText(i.faktor || '', BR_COLS[4].x, curY, { align: 'right', width: 35 });
                    addText(i.prozent || '', BR_COLS[5].x, curY, { align: 'right', width: 40 });
                    addText(i.st || '', BR_COLS[6].x, curY, { align: 'center', width: 15 });
                    addText(i.sv || '', BR_COLS[7].x, curY, { align: 'center', width: 15 });
                    addText(i.gb || '', BR_COLS[8].x, curY, { align: 'center', width: 15 });
                    addText(i.val, BR_COLS[9].x, curY, { align: 'right', width: 70 });
                    curY += RH;
                });
            }

            const bxX = ML + PW - 100;
            drawBox(bxX, tableStartY - 1, 100, 35);
            addText('Gesamt-Brutto', bxX + 5, tableStartY + 4, { font: 'Helvetica-Bold', fontSize: 8.5 });
            addText(data.gesamtBrutto, bxX + 5, tableStartY + 18, { align: 'right', font: 'Helvetica-Bold', fontSize: 8.5, width: 90 });

            curY = Math.max(curY, tableStartY + 45) + 15;

            // --- ABGABEN TABELLE ---
            addText('Gesetzliche Abzüge', ML, curY, { fontSize: 9, font: 'Helvetica-Bold' }); curY += 12;
            
            const abgabenHeaderY = curY;
            const AB_COLS = [
                { l: 'Bezeichnung', x: ML, w: 150 },
                { l: 'St-Brutto', x: ML + 155, w: 70, a: 'right' },
                { l: 'SV-Brutto', x: ML + 230, w: 70, a: 'right' },
                { l: 'Abzug (EUR)', x: ML + 325, w: 70, a: 'right' }
            ];

            AB_COLS.forEach(c => addText(c.l, c.x, curY, { width: c.w, align: c.a || 'left', font: 'Helvetica-Bold' }));
            curY += 12; drawLine(ML, curY, ML + 395, curY); curY += 2;

            const abgaben = [
                { label: 'Lohnsteuer', s: data.totalGross, v: '', val: data.lohnsteuer },
                { label: 'Kirchensteuer', s: data.totalGross, v: '', val: data.churchTax },
                { label: 'Soli', s: data.totalGross, v: '', val: data.soliZuschlag },
                { label: 'KV-Beitrag', s: '', v: data.totalGross, val: data.kvBeitrag },
                { label: 'RV-Beitrag', s: '', v: data.totalGross, val: data.rvBeitrag },
                { label: 'AV-Beitrag', s: '', v: data.totalGross, val: data.avBeitrag },
                { label: 'PV-Beitrag', s: '', v: data.totalGross, val: data.pvBeitrag }
            ];

            abgaben.forEach(ab => {
                const numVal = parseFloat((ab.val || '0').replace(',', '.'));
                if (numVal > 0) {
                    addText(ab.label, AB_COLS[0].x, curY);
                    addText(ab.s, AB_COLS[1].x, curY, { align: 'right', width: AB_COLS[1].w });
                    addText(ab.v, AB_COLS[2].x, curY, { align: 'right', width: AB_COLS[2].w });
                    addText(ab.val, AB_COLS[3].x, curY, { align: 'right', width: AB_COLS[3].w });
                    curY += RH;
                }
            });

            // Summe der Abzüge Box
            drawBox(bxX, abgabenHeaderY, 100, 35);
            addText('Summe Abzüge', bxX + 5, abgabenHeaderY + 4, { font: 'Helvetica-Bold' });
            addText(data.sumAbzuege, bxX + 5, abgabenHeaderY + 18, { align: 'right', font: 'Helvetica-Bold', width: 90 });

            curY = Math.max(curY, abgabenHeaderY + 45) + 15;

            // --- NETTO / AUSZAHLUNG ---
            drawBox(bxX, curY, 100, 35);
            addText('Netto-Verdienst', bxX + 5, curY + 4, { fontSize: 8.5 });
            addText(data.netVerdienst, bxX + 5, curY + 18, { align: 'right', font: 'Helvetica-Bold', width: 90, fontSize: 8.5 });
            
            curY += 40;
            drawBox(bxX, curY, 100, 35);
            addText('Auszahlungsbetrag', bxX + 5, curY + 4, { font: 'Helvetica-Bold', fontSize: 8.5 });
            addText(data.netAuszahlung, bxX + 5, curY + 18, { align: 'right', font: 'Helvetica-Bold', fontSize: 10, width: 90 });

            curY += 50;
            addText('Bank: ' + data.bank, ML, curY);
            addText('IBAN: ' + data.iban, ML, curY + RH);
            addText('Dieses Dokument wurde maschinell erstellt.', ML, doc.page.height - 25, { fontSize: 6, align: 'center', width: PW });

            doc.end();
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = { generateGermanPayslipPDF };
