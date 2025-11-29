// DRP2/payroll-service/controllers/payrollController.js

const fetch = require('node-fetch');
const sequelize = require('../config/sequelize');
const { Op } = require('sequelize');
const puppeteer = require('puppeteer'); // Wird später entfernt (oder je nach Bedarf beibehalten, falls noch verwendet)
const fs = require('fs'); // Kann eventuell entfernt werden, wenn lokale Dateispeicherung komplett entfällt
const path = require('path'); // Kann eventuell entfernt werden, wenn lokale Dateispeicherung komplett entfällt
const PDFDocument = require('pdfkit'); // Hinzugefügt
const { raw } = require('express');
const FormData = require('form-data'); // Hinzugefügt für multipart/form-data Upload

// NEU: Umgebungsvariable für den File Storage Service
const FILE_STORAGE_SERVICE_URL = process.env.FILE_STORAGE_SERVICE_URL || 'http://filestorage-service:3010'; // Standard-URL

let PayrollRun;
let Payslip;

exports.init = (payrollRunModel, payslipModel) => {
    PayrollRun = payrollRunModel;
    Payslip = payslipModel;
    console.log("[Payroll Controller] Sequelize Modelle erfolgreich initialisiert.");
};

const HR_SERVICE_URL = process.env.HR_SERVICE_URL || 'http://hr-service:3008';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const SHIFT_SERVICE_URL = process.env.SHIFT_SERVICE_URL || 'http://shift-service:3006';
// NEU: Umgebungsvariable für den Location Service
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://location-service:3004'; // Standard-URL auf den korrekten Port 3004 aktualisiert

async function fetchWithAuth(url, options, req) {
    const token = req.user ? req.user.jwtToken : null;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        // NEU: X-User-ID und X-User-Roles an Downstream-Services weiterleiten
        'X-User-ID': req.user?.id || '',
        'X-User-Roles': req.user?.roles?.join(',') || ''
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Abrufen von ${url}: ${response.status} ${response.statusText} - ${errorText}`);
    }
    // NEU: Wenn die Antwort JSON ist, diese zurückgeben. Ansonsten den Response selbst.
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response; // Nicht-JSON-Antworten (z.B. Dateistreams) direkt zurückgeben
}

/**
 * Holt die Firmenadresse vom Location Service.
 * Sucht nach einer Location mit type 'company_location'.
 * @returns {string} Die formatierte Firmenadresse oder eine Fallback-Adresse.
 */
async function fetchCompanyLocation(req) {
    try {
        const response = await fetchWithAuth(`${LOCATION_SERVICE_URL}/api/locations/type/company_location`, { method: 'GET' }, req);
        
        if (response && response.length > 0) {
            const companyLocation = response[0]; // Nehmen Sie die erste passende Location
            // KORREKTUR: Verwenden Sie direkt das 'address'-Feld, das die komplette Adresse enthält
            // und fügen Sie den Namen davor, falls gewünscht.
            const formattedAddress = `${companyLocation.name}, ${companyLocation.address}`;
            return formattedAddress;
        }
        return 'DRP2 GmbH, Musterstraße 42, 12345 Musterstadt'; // Fallback-Adresse
    } catch (error) {
        console.error('Fehler beim Abrufen der Firmenadresse vom Location Service:', error);
        return 'DRP2 GmbH, Musterstraße 42, 12345 Musterstadt'; // Fallback im Fehlerfall
    }
}

/**
 * Vereinfachte deutsche Gehaltsabrechnung.
 * @param {object} employeeData - Daten des Mitarbeiters vom HR-Service (muss employee.salary enthalten, jetzt als Stundenlohn)
 * @param {number} actualWorkingHours - Tatsächlich geleistete Arbeitsstunden im Monat
 * @returns {object} Berechnungsergebnisse (grossSalary, netSalary, taxAmount, socialSecurityAmount etc.)
 */
function calculateGermanPayroll(employeeData, actualWorkingHours) {
    // ANPASSUNG: employeeData.salary wird jetzt als Stundenlohn interpretiert
    const HOURLY_WAGE = parseFloat(employeeData.salary) || 17.6; // Fallback auf 17,6€ pro Stunde
    const MONTHLY_WORKING_HOURS = 160; // Standardmäßige monatliche Arbeitsstunden

    let monthlyGrossSalary = HOURLY_WAGE * MONTHLY_WORKING_HOURS; // Stundenlohn * monatliche Stunden
    let annualGrossSalary = monthlyGrossSalary * 12; // Monatslohn * 12 für das Jahresbrutto

    console.log(`[Payroll Calculation] Employee ${employeeData.id}: Stundenlohn ${HOURLY_WAGE.toFixed(2)}€, Monatsbrutto ${monthlyGrossSalary.toFixed(2)}€, Jahresbrutto ${annualGrossSalary.toFixed(2)}€`);

    let taxAmount = 0;
    let socialSecurityAmount = 0;
    let netSalary = monthlyGrossSalary;

    const taxRate = 0.20;
    const socialSecurityRate = 0.19;

    if (monthlyGrossSalary > 0) {
        taxAmount = monthlyGrossSalary * taxRate;
        socialSecurityAmount = monthlyGrossSalary * socialSecurityRate;
        netSalary = monthlyGrossSalary - taxAmount - socialSecurityAmount;
    }

    return {
        grossSalary: monthlyGrossSalary,
        netSalary: netSalary,
        taxAmount: taxAmount,
        socialSecurityAmount: socialSecurityAmount,
        healthInsuranceAmount: monthlyGrossSalary * 0.073,
        pensionInsuranceAmount: monthlyGrossSalary * 0.093,
        unemploymentInsuranceAmount: monthlyGrossSalary * 0.012,
        careInsuranceAmount: monthlyGrossSalary * 0.015,
    };
}


// --- PayrollRun Controller Funktionen ---

exports.createPayrollRun = async (req, res) => {
    try {
        const { month, year, createdByUserId, employeeIds } = req.body;
        if (!month || !year || !createdByUserId || !employeeIds || !Array.isArray(employeeIds)) {
            return res.status(400).json({ message: 'Monat, Jahr, Ersteller-ID und Mitarbeiter-IDs sind erforderlich.' });
        }

        const newPayrollRun = await PayrollRun.create({
            month,
            year,
            status: 'Pending',
            totalGrossSalary: 0,
            totalNetSalary: 0,
            createdByUserId
        });

        res.status(201).json(newPayrollRun);
    } catch (error) {
        console.error('Fehler beim Erstellen des Gehaltsabrechnungslaufs:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Erstellen des Gehaltsabrechnungslaufs', error: error.message });
    }
};

exports.getAllPayrollRuns = async (req, res) => {
    try {
        const payrollRuns = await PayrollRun.findAll({
            include: [{ model: Payslip, as: 'payslips' }]
        });
        res.status(200).json(payrollRuns);
    } catch (error) {
        console.error('Fehler beim Abrufen aller Gehaltsabrechnungsläufe:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Gehaltsabrechnungsläufe', error: error.message });
    }
};

exports.getPayrollRunById = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRun = await PayrollRun.findByPk(id, {
            include: [{ model: Payslip, as: 'payslips' }]
        });

        if (!payrollRun) {
            return res.status(404).json({ message: 'Gehaltsabrechnungslauf nicht gefunden.' });
        }
        res.status(200).json(payrollRun);
    } catch (error) {
        console.error('Fehler beim Abrufen des Gehaltsabrechnungslaufs:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen des Gehaltsabrechnungslaufs', error: error.message });
    }
};

exports.calculatePayrollRun = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRun = await PayrollRun.findByPk(id);

        if (!payrollRun) {
            return res.status(404).json({ message: 'Gehaltsabrechnungslauf nicht gefunden.' });
        }
        if (payrollRun.status !== 'Pending') {
            return res.status(400).json({ message: 'Gehaltsabrechnungslauf kann nur im Status "Pending" berechnet werden.' });
        }

        const allEmployees = await fetchWithAuth(`${HR_SERVICE_URL}/api/hr/employees`, { method: 'GET' }, req);
        const employeesToProcess = allEmployees;

        if (!employeesToProcess || employeesToProcess.length === 0) {
            return res.status(404).json({ message: 'Keine Mitarbeiterdaten zum Berechnen gefunden.' });
        }

        let totalGross = 0;
        let totalNet = 0;
        const payslipsToCreate = [];

        for (const employee of employeesToProcess) {
            const actualWorkingHours = 160;

            const calculationResult = calculateGermanPayroll(employee, actualWorkingHours);

            payslipsToCreate.push({
                payrollRunId: payrollRun.id,
                employeeId: employee.id,
                grossSalary: calculationResult.grossSalary,
                netSalary: calculationResult.netSalary,
                taxAmount: calculationResult.taxAmount,
                socialSecurityAmount: calculationResult.socialSecurityAmount,
                healthInsuranceAmount: calculationResult.healthInsuranceAmount,
                pensionInsuranceAmount: calculationResult.pensionInsuranceAmount,
                unemploymentInsuranceAmount: calculationResult.unemploymentInsuranceAmount,
                careInsuranceAmount: calculationResult.careInsuranceAmount,
                taxClass: employee.taxClass || 'I',
                childAllowances: employee.childAllowances || 0,
                maritalStatus: employee.maritalStatus || 'Single',
                payrollPeriodStart: new Date(payrollRun.year, payrollRun.month - 1, 1),
                payrollPeriodEnd: new Date(payrollRun.year, payrollRun.month, 0),
                payslipDate: new Date(),
                status: 'Calculated',
                documentPath: null
            });

            totalGross += calculationResult.grossSalary;
            totalNet += calculationResult.netSalary;
        }

        await Payslip.destroy({ where: { payrollRunId: payrollRun.id } });
        await Payslip.bulkCreate(payslipsToCreate);

        await payrollRun.update({
            status: 'Calculated',
            totalGrossSalary: totalGross,
            totalNetSalary: totalNet,
            calculationDate: new Date()
        });

        res.status(200).json({ message: 'Gehaltsabrechnung erfolgreich berechnet.', payrollRun });
    } catch (error) {
        console.error('Fehler beim Berechnen des Gehaltsabrechnungslaufs:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler beim Berechnen des Gehaltsabrechnungslaufs', error: error.message });
    }
};

exports.updatePayrollRunStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Calculated', 'Approved', 'Paid', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Ungültiger Status.' });
        }

        const payrollRun = await PayrollRun.findByPk(id);

        if (!payrollRun) {
            return res.status(404).json({ message: 'Gehaltsabrechnungslauf nicht gefunden.' });
        }

        await payrollRun.update({ status, lastModifiedDate: new Date() });
        res.status(200).json({ message: `Status des Gehaltsabrechnungslaufs auf '${status}' aktualisiert.`, payrollRun });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Gehaltsabrechnungslauf-Status:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren des Status', error: error.message });
    }
};

exports.deletePayrollRun = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRun = await PayrollRun.findByPk(id);

        if (!payrollRun) {
            return res.status(404).json({ message: 'Gehaltsabrechnungslauf nicht gefunden.' });
        }

        await Payslip.destroy({ where: { payrollRunId: id } });
        await payrollRun.destroy();

        res.status(204).send();
    } catch (error) {
        console.error('Fehler beim Löschen des Gehaltsabrechnungslaufs:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler beim Löschen des Gehaltsabrechnungslaufs', error: error.message });
    }
};

// --- Payslip Controller Funktionen ---

exports.getEmployeePayslips = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const payslips = await Payslip.findAll({
            where: { employeeId },
            include: [{ model: PayrollRun, as: 'payrollRun' }],
            order: [['payslipDate', 'DESC']]
        });
        res.status(200).json(payslips);
    } catch (error) {
        console.error('Fehler beim Abrufen der Gehaltsabrechnungen des Mitarbeiters:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Gehaltsabrechnungen', error: error.message });
    }
};

exports.getSinglePayslip = async (req, res) => {
    try {
        const { id } = req.params;
        const payslip = await Payslip.findByPk(id, {
            include: [{ model: PayrollRun, as: 'payrollRun' }]
        });

        if (!payslip) {
            return res.status(404).json({ message: 'Gehaltsabrechnung nicht gefunden.' });
        }
        res.status(200).json(payslip);
    } catch (error) {
        console.error('Fehler beim Abrufen der einzelnen Gehaltsabrechnung:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Gehaltsabrechnung', error: error.message });
    }
};

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

// Die Funktion generateGermanPayslipPDF wurde angepasst, um einen Buffer zurückzugeben.
async function generateGermanPayslipPDF(payslipData, req) { // 'outputPath' Parameter entfernt
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 25, bottom: 20, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            font: 'Helvetica'
        });

        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            let pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer); // Löst mit dem PDF-Buffer auf
        });
        doc.on('error', reject);

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
            // ... (bestehender Code für die rechte Box im Header) ...

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
    });
}

exports.generatePayslipDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const payslip = await Payslip.findByPk(id, {
            include: [{ model: PayrollRun, as: 'payrollRun' }]
        });

        if (!payslip) {
            return res.status(404).json({ message: 'Gehaltsabrechnung nicht gefunden.' });
        }

        const employeeId = payslip.employeeId;
        const payrollRunMonth = payslip.payrollRun.month;
        const payrollRunYear = payslip.payrollRun.year;

        const employeeDetails = await fetchWithAuth(`${HR_SERVICE_URL}/api/hr/employees/${employeeId}`, { method: 'GET' }, req);
        // NEU: Firmenadresse vom Location Service abrufen
        const employerAddress = await fetchCompanyLocation(req);

        const abzugJobticketValue = '-20,00';

        const primaryAddress = employeeDetails.addresses?.find(addr => addr.isPrimary) || employeeDetails.addresses?.[0] || {};

        const payslipDataForPdfkit = {
            personalNr: employeeDetails.employeeNumber || employeeDetails.id?.toString() || 'N/A',
            svNumber: employeeDetails.taxSocialSecurity?.socialSecurityNumber || 'N/A',
            krankenkasse: employeeDetails.taxSocialSecurity?.healthInsuranceProvider || 'N/A',
            eintrittsdatum: employeeDetails.dateOfHire ? new Date(employeeDetails.dateOfHire).toLocaleDateString('de-DE') : 'N/A',

            month: new Date(payslip.payrollPeriodStart).toLocaleDateString('de-DE', { month: 'long' }),
            year: payslip.payrollRun.year.toString(),
            date: new Date(payslip.payslipDate).toLocaleDateString('de-DE'),
            page: '1',

            employerName: employerAddress, // HIER WIRD DIE DYNAMISCHE ADRESSE VERWENDET

            employeeName: `${employeeDetails.firstName || ''} ${employeeDetails.lastName || ''}`.trim() || 'N/A',
            employeeAddressStreetHouseNo: `${primaryAddress.street || ''} ${primaryAddress.houseNumber || ''}`.trim() || 'N/A',
            employeeAddressLine2: `${primaryAddress.zipCode || ''} ${primaryAddress.city || ''}`.trim() || 'N/A',

            bruttoBezug: [
                { lohnart: '2000', bezeichnung: 'Gehalt', stKZ: payslip.taxClass || (employeeDetails.taxSocialSecurity?.taxClass?.toString() || 'L'), svKZ: 'L', gbKZ: 'J', betrag: parseFloat(payslip.grossSalary).toFixed(2).replace('.', ',') },
                { lohnart: '3000', bezeichnung: 'Sachbezug Jobticket', stKZ: 'F', svKZ: 'L', gbKZ: 'J', betrag: abzugJobticketValue.replace('-', '') },
            ].filter(item => parseFloat(item.betrag.replace(',', '.')) > 0),
            gesamtBrutto: parseFloat(payslip.grossSalary).toFixed(2).replace('.', ','),

            steuerBrutto: parseFloat(payslip.grossSalary).toFixed(2).replace('.', ','),
            lohnsteuer: parseFloat(payslip.taxAmount).toFixed(2).replace('.', ','),
            kirchensteuer: employeeDetails.taxSocialSecurity?.churchTaxApplicable ? 'Ja' : 'Nein',
            soliZuschlag: '0,00',
            steuerrechtlicheAbzuege: (parseFloat(payslip.taxAmount) + (employeeDetails.taxSocialSecurity?.churchTaxApplicable ? 0 : 0) + 0).toFixed(2).replace('.', ','),

            kvBrutto: parseFloat(payslip.grossSalary).toFixed(2).replace('.', ','),
            rvBrutto: parseFloat(payslip.grossSalary).toFixed(2).replace('.', ','),
            avBrutto: parseFloat(payslip.grossSalary).toFixed(2).replace('.', ','),
            pvBrutto: parseFloat(payslip.grossSalary).toFixed(2).replace('.', ','),
            kvBeitrag: parseFloat(payslip.healthInsuranceAmount).toFixed(2).replace('.', ','),
            rvBeitrag: parseFloat(payslip.pensionInsuranceAmount).toFixed(2).replace('.', ','),
            avBeitrag: parseFloat(payslip.unemploymentInsuranceAmount).toFixed(2).replace('.', ','),
            pvBeitrag: parseFloat(payslip.careInsuranceAmount).toFixed(2).replace('.', ','),
            svRechtlicheAbzuege: (parseFloat(payslip.healthInsuranceAmount) + parseFloat(payslip.pensionInsuranceAmount) + parseFloat(payslip.unemploymentInsuranceAmount) + parseFloat(payslip.careInsuranceAmount)).toFixed(2).replace('.', ','),

            lohnsteuerBescheinigung: (parseFloat(payslip.taxAmount) * 12).toFixed(2).replace('.', ','),
            kirchensteuerBescheinigung: '0,00',
            soliZuschlagBescheinigung: '0,00',
            pauschalVerstZukl: '0,00',

            nettoBezugLohnart: '3100',
            nettoBezugBezeichnung: 'Abzug Geldw. Vorteil Jobticket',
            abzugJobticket: abzugJobticketValue,

            nettoVerdienst: parseFloat(payslip.netSalary).toFixed(2).replace('.', ','),
            auszahlungsbetrag: (parseFloat(payslip.netSalary) + parseFloat(abzugJobticketValue.replace(',', '.'))).toFixed(2).replace('.', ','),

            bank: employeeDetails.bankDetails?.bankName || 'N/A',
            konto: employeeDetails.bankDetails?.iban || 'N/A',

            payrollPeriodStart: new Date(payslip.payrollPeriodStart).toLocaleDateString('de-DE'),
            payrollPeriodEnd: new Date(payslip.payrollPeriodEnd).toLocaleDateString('de-DE'),

            svAgAnteil: '743,44',
            zusAgKosten: '14,00',
            gesamtkosten: parseFloat(payslip.grossSalary).toFixed(2).replace('.', ','),
        };

        // --- PDF generieren in einen Buffer ---
        const pdfBuffer = await generateGermanPayslipPDF(payslipDataForPdfkit, req);

        // --- Ordnerstruktur und vollständiger Dateiname generieren ---
        const monthNamesFull = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        const folderMonth = monthNamesFull[payrollRunMonth - 1]; // Voller Monatsname
        const folderYear = payrollRunYear;

        // Dateiname mit Mitarbeitername, Monat, Jahr und Payslip-ID
        const employeeFullName = `${employeeDetails.firstName || ''} ${employeeDetails.lastName || ''}`.trim().replace(/\s/g, '_'); // Leerzeichen durch Unterstriche ersetzen
        const baseFileName = `Gehaltsabrechnung_${employeeFullName}_${folderMonth}_${folderYear}_${payslip.id}.pdf`; 
        
        // Der Pfad im Bucket (ohne den Bucket-Namen "filestorageservice")
        const bucketPath = `payslips/${folderYear}/${folderMonth}`; // Beispiel: "payslips/2025/November"
        
        const filenameForStorage = baseFileName; // Nur der Basisdateiname für FormData


        // --- Hochladen des Buffers zum File Storage Service ---
        const formData = new FormData();
        formData.append('file', pdfBuffer, {
            filename: filenameForStorage, // <-- HIER wird NUR der Basis-Dateiname übergeben
            contentType: 'application/pdf',
        });

        // Der bucketPath wird nun als Teil der URL übergeben
        const uploadResponse = await fetch(`${FILE_STORAGE_SERVICE_URL}/upload/${bucketPath}`, {
            method: 'POST',
            body: formData,
            headers: {
                // Wichtig: X-User-ID und X-User-Roles weiterleiten zur Autorisierung im filestorage-service
                'X-User-ID': req.user?.id || '',
                'X-User-Roles': req.user?.roles?.join(',') || '',
                // ACHTUNG: 'Content-Type' wird von form-data selbst gesetzt,
                // wenn der Body ein FormData-Objekt ist, inklusive Boundary.
                // Nicht manuell setzen!
            }
        });

        if (!uploadResponse.ok) {
            let errorData;
            const contentType = uploadResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await uploadResponse.json();
            } else {
                errorData = await uploadResponse.text(); // Als Text lesen, wenn nicht JSON
            }
            throw new Error(errorData.message || `Fehler beim Hochladen der Datei zum File Storage Service. Status: ${uploadResponse.status}. Antwort: ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`);
        }

        const uploadResult = await uploadResponse.json();
        const documentPathFromStorage = uploadResult.apiGatewayDownloadLink; // Dies ist der Link, den wir speichern und zurückgeben

        // Den erhaltenen Link in der Payslip-Datenbank speichern
        await payslip.update({ documentPath: documentPathFromStorage, status: 'Generated' });

        res.status(200).json({
            message: 'Gehaltsabrechnungsdokument erfolgreich generiert und hochgeladen.',
            documentPath: documentPathFromStorage, // Der vom File Storage Service erhaltene Link
            payslip
        });
    } catch (error) {
        console.error('Fehler beim Generieren oder Hochladen des Gehaltsabrechnungsdokuments:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler beim Generieren oder Hochladen des Dokuments', error: error.message });
    }
};