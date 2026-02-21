// DRP2/payroll-service/controllers/payrollController.js
const fetch = require('node-fetch');
const sequelize = require('../config/sequelize');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const FormData = require('form-data');
const moment = require('moment-timezone');

// Service Configuration
const FILE_STORAGE_SERVICE_URL = process.env.FILE_STORAGE_SERVICE_URL || 'http://filestorage-service:3010';
const TAX_SERVICE_URL = process.env.TAX_SERVICE_URL || 'http://tax-engine:8080';
const HR_SERVICE_URL = process.env.HR_SERVICE_URL || 'http://hr-service:3008';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const SHIFT_SERVICE_URL = process.env.SHIFT_SERVICE_URL || 'http://shift-service:3003';
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'http://location-service:3004';

let PayrollRun;
let Payslip;

exports.init = (payrollRunModel, payslipModel) => {
    PayrollRun = payrollRunModel;
    Payslip = payslipModel;
    console.log("[Payroll Controller] Modelle initialisiert.");
};

// --- Helper Functions ---

async function fetchWithAuth(url, options = {}, req) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'X-User-ID': req.headers['x-user-id'] || '1006',
        'X-User-Roles': req.headers['x-user-roles'] || 'Manager',
        'Authorization': req.headers['authorization'] || ''
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Service Call failed: ${url} (${response.status}) - ${txt}`);
    }
    const contentType = response.headers.get('content-type');
    return (contentType && contentType.includes('application/json')) ? await response.json() : response;
}

async function fetchCompanyLocation(req) {
    try {
        const response = await fetchWithAuth(`${LOCATION_SERVICE_URL}/api/locations/type/company_location`, { method: 'GET' }, req);
        if (response && response.length > 0) return `${response[0].name}, ${response[0].address}`;
        return 'DRP Dienstleistungen GmbH, Albertstr. 7, 47059 Duisburg';
    } catch (e) { return 'DRP Dienstleistungen GmbH, Albertstr. 7, 47059 Duisburg'; }
}

async function fetchTaxCalculation(params) {
    const response = await fetch(`${TAX_SERVICE_URL}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error(`Tax Engine Error: ${response.status}`);
    return await response.json();
}

function calculateSFNSupplements(baseWage, nightH, sunH, holH) {
    const sfnBase = Math.min(baseWage, 50);
    const night = (nightH || 0) * (sfnBase * 0.25);
    const sun = (sunH || 0) * (sfnBase * 0.50);
    const hol = (holH || 0) * (sfnBase * 1.25);
    return { night, sun, hol, total: parseFloat((night + sun + hol).toFixed(2)) };
}

function processShiftDetails(shift) {
    const start = moment(shift.start_time).tz('Europe/Berlin');
    const end = moment(shift.end_time).tz('Europe/Berlin');
    const grossMin = end.diff(start, 'minutes');
    let pause = 0;
    if (grossMin >= 540) pause = 45;
    else if (grossMin >= 360) pause = 30;
    const netH = Math.max(0, (grossMin - pause) / 60);
    return { 
        netH, pause, 
        overtime: Math.max(0, netH - 7.5),
        night: parseFloat(shift.night_hours || 0), 
        sun: parseFloat(shift.sunday_hours || 0) 
    };
}

async function calculateGermanPayroll(employeeData, shifts) {
    const WAGE = parseFloat(employeeData.salary) || 17.50;
    const TARGET = parseFloat(employeeData.targetHoursMonthly || employeeData.target_hours_monthly) || 160;

    let tNet = 0, tOver = 0, tNight = 0, tSun = 0;
    shifts.forEach(s => {
        const d = processShiftDetails(s);
        tNet += d.netH; tOver += d.overtime; tNight += d.night; tSun += d.sun;
    });

    const taxableGross = tNet * WAGE;
    const sfn = calculateSFNSupplements(WAGE, tNight, tSun, 0);
    const totalGross = taxableGross + sfn.total;

    const isChurch = employeeData.taxSocialSecurity?.churchTaxApplicable;
    const taxParams = {
        RE4: Math.round(taxableGross * 100),
        LZZ: 2,
        STKL: parseInt(employeeData.taxSocialSecurity?.taxClass) || 1,
        KVZ: 1.6, PVZ: 0, R: isChurch ? 9.0 : 0.0,
        ZKF: parseFloat(employeeData.taxSocialSecurity?.childAllowances) || 0.0
    };

    let tr = { LSTLZZ: 0, SOLZLZZ: 0, KV_AN: 0, RV_AN: 0, AV_AN: 0, PV_AN: 0, BK: 0 };
    try { 
        tr = await fetchTaxCalculation(taxParams); 
    } catch (e) { 
        console.error("Tax Engine Fallback applied"); 
    }

    const churchAmt = (tr.BK || 0) * (taxParams.R / 100);
    const taxes = (tr.LSTLZZ + tr.SOLZLZZ + churchAmt) / 100;
    const social = (tr.RV_AN + tr.KV_AN + tr.PV_AN + (tr.ALV_AN || tr.AV_AN || 0)) / 100;

    return {
        grossSalary: totalGross || 0, 
        netSalary: (totalGross - taxes - social) || 0,
        taxAmount: taxes || 0, 
        socialSecurityAmount: social || 0,
        taxableGross: taxableGross || 0, 
        overtimeHours: Math.max(tOver, Math.max(0, tNet - TARGET)) || 0, 
        totalHours: tNet || 0, 
        sfnSupplements: sfn.total || 0,
        health: (tr.KV_AN / 100) || 0, 
        pension: (tr.RV_AN / 100) || 0, 
        unemp: ((tr.ALV_AN || tr.AV_AN || 0) / 100) || 0,
        care: (tr.PV_AN / 100) || 0, 
        church: (churchAmt / 100) || 0, 
        soli: (tr.SOLZLZZ / 100) || 0, 
        wageTax: (tr.LSTLZZ / 100) || 0,
        basePay: taxableGross || 0
    };
}

// --- Controller Actions ---

exports.calculatePayrollRun = async (req, res) => {
    try {
        const run = await PayrollRun.findByPk(req.params.id);
        const employees = await fetchWithAuth(`${HR_SERVICE_URL}/api/hr/employees`, { method: 'GET' }, req);
        let gSum = 0, nSum = 0;
        const slips = [];

        for (const emp of employees) {
            const resp = await fetchWithAuth(`${SHIFT_SERVICE_URL}/api/shifts/user/${emp.userId || emp.user_id}`, { method: 'GET' }, req);
            const mShifts = resp.filter(s => {
                const d = new Date(s.start_time);
                return d.getMonth() + 1 === run.month && d.getFullYear() === run.year;
            });
            const result = await calculateGermanPayroll(emp, mShifts);
            slips.push({
                payrollRunId: run.id, employeeId: emp.id,
                grossSalary: result.grossSalary, netSalary: result.netSalary,
                taxAmount: result.taxAmount, socialSecurityAmount: result.socialSecurityAmount,
                healthInsuranceAmount: result.health, pensionInsuranceAmount: result.pension,
                unemploymentInsuranceAmount: result.unemp, careInsuranceAmount: result.care,
                taxClass: String(emp.taxSocialSecurity?.taxClass || '1'),
                childAllowances: emp.taxSocialSecurity?.childAllowances || 0,
                maritalStatus: emp.maritalStatus || 'Unbekannt',
                payrollPeriodStart: new Date(run.year, run.month - 1, 1),
                payrollPeriodEnd: new Date(run.year, run.month, 0),
                payslipDate: new Date(), status: 'Calculated'
            });
            gSum += result.grossSalary; nSum += result.netSalary;
        }

        await Payslip.destroy({ where: { payrollRunId: run.id } });
        const created = await Payslip.bulkCreate(slips);
        for (const s of created) { try { await exports.generateAndUploadPayslipPDF(s.id, req); } catch (e) { console.error("PDF Fail:", e.message); } }

        await run.update({ status: 'Calculated', totalGrossSalary: gSum, totalNetSalary: nSum, calculationDate: new Date() });
        res.status(200).json({ message: 'OK', totalGross: gSum, totalNet: nSum });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createPayrollRun = async (req, res) => { try { const run = await PayrollRun.create({ ...req.body, status: 'Pending' }); res.status(201).json(run); } catch (e) { res.status(500).json({ message: e.message }); } };
exports.getAllPayrollRuns = async (req, res) => { try { const runs = await PayrollRun.findAll({ include: [{ model: Payslip, as: 'payslips' }] }); res.status(200).json(runs); } catch (e) { res.status(500).json({ message: e.message }); } };
exports.getPayrollRunById = async (req, res) => { try { const run = await PayrollRun.findByPk(req.params.id, { include: [{ model: Payslip, as: 'payslips' }] }); res.status(200).json(run); } catch (e) { res.status(500).json({ message: e.message }); } };
exports.updatePayrollRunStatus = async (req, res) => { try { const run = await PayrollRun.findByPk(req.params.id); await run.update({ status: req.body.status, lastModifiedDate: new Date() }); res.status(200).json(run); } catch (e) { res.status(500).json({ message: e.message }); } };
exports.deletePayrollRun = async (req, res) => { try { await Payslip.destroy({ where: { payrollRunId: req.params.id } }); await PayrollRun.destroy({ where: { id: req.params.id } }); res.status(204).send(); } catch (e) { res.status(500).json({ message: e.message }); } };
exports.getEmployeePayslips = async (req, res) => { try { const slips = await Payslip.findAll({ where: { employeeId: req.params.employeeId }, include: [{ model: PayrollRun, as: 'payrollRun' }] }); res.status(200).json(slips); } catch (e) { res.status(500).json({ message: e.message }); } };
exports.getSinglePayslip = async (req, res) => { try { const slip = await Payslip.findByPk(req.params.id, { include: [{ model: PayrollRun, as: 'payrollRun' }] }); res.status(200).json(slip); } catch (e) { res.status(500).json({ message: e.message }); } };

// --- PDF Engine ---

const ML = 25, PW = 545.28, RH = 10.5;

const BR_COLS = [
    { label: 'Lohnart', x: ML, width: 35, align: 'left' },
    { label: 'Bezeichnung', x: ML + 35, width: 90, align: 'left' },
    { label: 'Einheit', x: ML + 125, width: 30, align: 'left' },
    { label: 'Menge', x: ML + 155, width: 35, align: 'left' },
    { label: 'Faktor', x: ML + 190, width: 35, align: 'left' },
    { label: 'Prozentsatz', x: ML + 225, width: 55, align: 'left' },
    { label: 'St', x: ML + 280, width: 15, align: 'center' },
    { label: 'SV', x: ML + 295, width: 15, align: 'center' },
    { label: 'GB', x: ML + 310, width: 15, align: 'center' },
    { label: 'Betrag', x: ML + 325, width: 70, align: 'right' }
];

async function generateGermanPayslipPDF(data) {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: 'A4', margins: { top: 25, bottom: 20, left: ML, right: ML }, font: 'Helvetica' });
        let buffers = []; doc.on('data', buffers.push.bind(buffers)); doc.on('end', () => resolve(Buffer.concat(buffers)));

        const drawLine = (x1, y1, x2, y2) => doc.lineWidth(0.5).moveTo(x1, y1).lineTo(x2, y2).stroke();
        const drawBox = (x, y, w, h) => doc.lineWidth(0.5).rect(x, y, w, h).stroke();
        const addText = (t, x, y, opt = {}) => doc.fontSize(opt.fontSize || 7.5).text(t || '', x, y, { width: opt.width || 100, align: opt.align || 'left', ...opt });

        function drawHeaderAndInfo(d) {
            let currentY = doc.y;
            addText('Abrechnung der Brutto/Netto-Bezüge', ML, currentY, { width: 150, fontSize: 8 });
            addText(`für ${d.month} ${d.year}`, ML + 150, currentY, { fontSize: 8 });
            addText(d.date, ML + PW - 70, currentY, { fontSize: 8, align: 'right' });
            currentY += 10; drawLine(ML, currentY, ML + PW, currentY); currentY += 4;

            drawBox(ML, currentY, 260, 40); drawBox(ML + 270, currentY, PW - 270, 40);
            addText('Personal-Nr.', ML + 4, currentY + 4); addText(d.personalNr, ML + 65, currentY + 4);
            addText('SV-Nummer', ML + 4, currentY + 4 + RH); addText(d.svNumber, ML + 65, currentY + 4 + RH);
            addText('Krankenkasse', ML + 4, currentY + 4 + RH * 2); addText(d.krankenkasse, ML + 65, currentY + 4 + RH * 2);

            let rBX = ML + 270 + 4;
            drawLine(rBX + 25, currentY, rBX + 25, currentY + 40); 
            drawLine(rBX + 60, currentY, rBX + 60, currentY + 40); 
            drawLine(rBX + 110, currentY, rBX + 110, currentY + 40);
            addText('KK%', rBX + 2, currentY + 4); addText('PGRS', rBX + 30, currentY + 4); addText('BGRS', rBX + 65, currentY + 4); addText('St-Tg', rBX + 115, currentY + 4);
            addText('157', rBX + 2, currentY + 4 + RH); addText('101', rBX + 30, currentY + 4 + RH); addText('1111', rBX + 65, currentY + 4 + RH); addText('30', rBX + 115, currentY + 4 + RH);
            addText('Eintritt', rBX + 2, currentY + 4 + RH * 2); addText(d.eintritt, rBX + 45, currentY + 4 + RH * 2);

            currentY += 48;
            drawBox(ML + 270, currentY, PW - 270, 45);
            doc.fontSize(7).font('Helvetica-Bold').text(d.employerName, ML + 4, currentY + 2);
            doc.fontSize(7.5).font('Helvetica');
            addText(d.employeeName, ML + 4, currentY + 15 + RH);
            addText(d.addr1, ML + 4, currentY + 15 + RH * 2);
            addText(d.addr2, ML + 4, currentY + 15 + RH * 3);
            return currentY + 65;
        }

        function drawBruttoTable(d, startY) {
            addText('Brutto-Bezüge', ML, startY, { fontSize: 9 });
            let y = startY + 12;
            BR_COLS.forEach(c => addText(c.label, c.x, y, { width: c.width, align: c.align, font: 'Helvetica-Bold' }));
            y += 12; drawLine(ML, y, ML + 400, y); y += 2;
            d.bruttoItems.forEach(i => {
                addText(i.lohnart, BR_COLS[0].x, y);
                addText(i.label, BR_COLS[1].x, y, { width: 120 });
                addText(i.st, BR_COLS[6].x, y, { align: 'center' });
                addText(i.sv, BR_COLS[7].x, y, { align: 'center' });
                addText(i.gb, BR_COLS[8].x, y, { align: 'center' });
                addText(i.val, BR_COLS[9].x, y, { align: 'right' });
                y += RH;
            });
            const bxX = ML + PW - 100;
            drawBox(bxX, startY + 12, 100, 35);
            addText('Gesamt-Brutto', bxX + 5, startY + 16, { font: 'Helvetica-Bold' });
            addText(d.totalGross, bxX + 5, startY + 30, { align: 'right', font: 'Helvetica-Bold', width: 90 });
            return y + 15;
        }

        function drawSteuerSV(d, startY) {
            addText('Steuer/Sozialversicherung', ML, startY, { fontSize: 9 });
            let y = startY + 12;
            const sCols = [{l:'St¹',x:ML,w:25},{l:'Steuer-Brutto',x:ML+25,w:70},{l:'Lohnsteuer',x:ML+95,w:60},{l:'Soli',x:ML+215,w:80}];
            sCols.forEach(c => addText(c.l, c.x, y, { width: c.w, align: 'right', font: 'Helvetica-Bold' }));
            y += 12; drawLine(ML, y, ML + 300, y); y += 2;
            addText('L', ML, y, { align: 'center', width: 25 });
            addText(d.totalGross, ML + 25, y, { align: 'right', width: 70 });
            addText(d.wageTax, ML + 95, y, { align: 'right', width: 60 });
            addText(d.soli, ML + 215, y, { align: 'right', width: 80 });
            
            const bxX = ML + PW - 100;
            drawBox(bxX, startY + 12, 100, 35);
            addText('Netto-Verdienst', bxX + 5, startY + 16);
            addText(d.netVerdienst, bxX + 5, startY + 30, { align: 'right', font: 'Helvetica-Bold', width: 90 });
            return y + 40;
        }

        let yLine = drawHeaderAndInfo(data);
        yLine = drawBruttoTable(data, yLine);
        yLine = drawSteuerSV(data, yLine);

        const bxX = ML + PW - 100;
        drawBox(bxX, yLine, 100, 35);
        addText('Auszahlungsbetrag', bxX + 5, yLine + 4, { font: 'Helvetica-Bold' });
        addText(data.netAuszahlung, bxX + 5, yLine + 18, { align: 'right', font: 'Helvetica-Bold', fontSize: 10, width: 90 });

        yLine += 50;
        addText('Bank: ' + data.bank, ML, yLine);
        addText('IBAN: ' + data.iban, ML, yLine + RH);
        addText('¹ Steuerklasse | ² SV-Kennzeichen (L=laufend)', ML, doc.page.height - 25, { fontSize: 6 });

        doc.end();
    });
}

exports.generateAndUploadPayslipPDF = async (id, req) => {
    const payslip = await Payslip.findByPk(id, { include: [{ model: PayrollRun, as: 'payrollRun' }] });
    const emp = await fetchWithAuth(`${HR_SERVICE_URL}/api/hr/employees/${payslip.employeeId}`, { method: 'GET' }, req);
    const shifts = await fetchWithAuth(`${SHIFT_SERVICE_URL}/api/shifts/user/${emp.userId || emp.user_id}`, { method: 'GET' }, req);
    const mShifts = shifts.filter(s => (new Date(s.start_time)).getMonth() + 1 === payslip.payrollRun.month);
    
    const calc = await calculateGermanPayroll(emp, mShifts);
    const addr = emp.addresses?.find(a => a.isPrimary) || emp.addresses?.[0] || {};

    const pdfData = {
        month: moment().month(payslip.payrollRun.month - 1).locale('de').format('MMMM'),
        year: payslip.payrollRun.year.toString(),
        personalNr: emp.userId || emp.user_id || 'N/A',
        svNumber: emp.taxSocialSecurity?.socialSecurityNumber || 'N/A',
        krankenkasse: emp.taxSocialSecurity?.healthInsuranceProvider || 'N/A',
        date: moment().format('DD.MM.YYYY'),
        eintritt: emp.dateOfHire ? moment(emp.dateOfHire).format('DD.MM.YYYY') : 'N/A',
        employerName: await fetchCompanyLocation(req),
        employeeName: `${emp.firstName} ${emp.lastName}`,
        addr1: `${addr.street || ''} ${addr.houseNumber || ''}`,
        addr2: `${addr.zipCode || ''} ${addr.city || ''}`,
        totalGross: (calc.grossSalary || 0).toFixed(2).replace('.', ','),
        wageTax: (calc.wageTax || 0).toFixed(2).replace('.', ','),
        soli: (calc.soli || 0).toFixed(2).replace('.', ','),
        netVerdienst: (calc.netSalary || 0).toFixed(2).replace('.', ','),
        netAuszahlung: (calc.netSalary || 0).toFixed(2).replace('.', ','),
        bank: emp.bankDetails?.bankName || 'N/A',
        iban: emp.bankDetails?.iban || 'N/A',
        bruttoItems: [
            { lohnart: '2000', label: 'Gehalt', st: payslip.taxClass || '1', sv: 'L', gb: 'J', val: (calc.basePay || 0).toFixed(2).replace('.', ',') },
            { lohnart: '2010', label: `Überstunden (${(calc.overtimeHours || 0).toFixed(2)}h)`, st: '1', sv: 'L', gb: 'J', val: 'inkl.' },
            { lohnart: '3000', label: 'SFN-Zuschläge', st: 'F', sv: 'L', gb: 'J', val: (calc.sfnSupplements || 0).toFixed(2).replace('.', ',') }
        ]
    };

    const pdfBuffer = await generateGermanPayslipPDF(pdfData);
    const fileName = `Abrechnung_${emp.lastName}_${id}.pdf`;
    const form = new FormData();
    form.append('file', pdfBuffer, { filename: fileName, contentType: 'application/pdf' });

    const up = await fetch(`${FILE_STORAGE_SERVICE_URL}/upload/payslips/${pdfData.year}/${pdfData.month}`, {
        method: 'POST', body: form, headers: { 'X-User-ID': '1006', 'X-User-Roles': 'Manager' }
    });
    if (up.ok) {
        const r = await up.json();
        await payslip.update({ documentPath: r.apiGatewayDownloadLink, status: 'Generated' });
        return r.apiGatewayDownloadLink;
    }
    throw new Error('Upload failed');
};

exports.generatePayslipDocument = async (req, res) => {
    try {
        const url = await exports.generateAndUploadPayslipPDF(req.params.id, req);
        res.status(200).json({ message: 'OK', documentPath: url });
    } catch (e) { 
        console.error("PDF Gen Error:", e.message);
        res.status(500).json({ message: e.message }); 
    }
};
