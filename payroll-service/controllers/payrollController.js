// DRP2/payroll-service/controllers/payrollController.js
const fetch = require('node-fetch');
const sequelize = require('../config/sequelize');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const moment = require('moment-timezone');
const { generateGermanPayslipPDF } = require('../utils/pdfGenerator');

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
    try { tr = await fetchTaxCalculation(taxParams); } catch (e) {}

    const churchAmt = (tr.BK || 0) * (taxParams.R / 100);
    const taxSum = (tr.LSTLZZ + tr.SOLZLZZ + churchAmt) / 100;
    const svSum = (tr.RV_AN + tr.KV_AN + tr.PV_AN + (tr.ALV_AN || tr.AV_AN || 0)) / 100;

    return {
        grossSalary: totalGross || 0, 
        netSalary: totalGross - taxSum - svSum,
        taxAmount: taxSum, 
        socialSecurityAmount: svSum,
        taxableGross, overtimeHours: Math.max(tOver, Math.max(0, tNet - TARGET)), 
        totalHours: tNet, sfnSupplements: sfn.total,
        nightHours: tNight, sundayHours: tSun,
        health: tr.KV_AN / 100, pension: tr.RV_AN / 100, unemp: (tr.ALV_AN || tr.AV_AN || 0) / 100,
        care: tr.PV_AN / 100, church: churchAmt / 100, soli: tr.SOLZLZZ / 100, wageTax: tr.LSTLZZ / 100,
        basePay: taxableGross, hourlyWage: WAGE
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
        const allCreated = await Payslip.findAll({ where: { payrollRunId: run.id } });
        for (const s of allCreated) { try { await exports.generateAndUploadPayslipPDF(s.id, req); } catch (e) {} }

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
        lohnsteuer: (calc.wageTax || 0).toFixed(2).replace('.', ','),
        churchTax: (calc.church || 0).toFixed(2).replace('.', ','),
        soliZuschlag: (calc.soli || 0).toFixed(2).replace('.', ','),
        kvBeitrag: (calc.health || 0).toFixed(2).replace('.', ','),
        rvBeitrag: (calc.pension || 0).toFixed(2).replace('.', ','),
        avBeitrag: (calc.unemp || 0).toFixed(2).replace('.', ','),
        pvBeitrag: (calc.care || 0).toFixed(2).replace('.', ','),
        sumAbzuege: (calc.taxAmount + calc.socialSecurityAmount).toFixed(2).replace('.', ','),
        netVerdienst: (calc.netSalary || 0).toFixed(2).replace('.', ','),
        netAuszahlung: (calc.netSalary || 0).toFixed(2).replace('.', ','),
        bank: emp.bankDetails?.bankName || 'N/A',
        iban: emp.bankDetails?.iban || 'N/A',
        bruttoItems: [
            { lohnart: '2000', bezeichnung: 'Gehalt', st: payslip.taxClass || '1', sv: 'L', gb: 'J', einheit: 'Std', menge: calc.totalHours.toFixed(2).replace('.', ','), faktor: calc.hourlyWage.toFixed(2).replace('.', ','), val: calc.basePay.toFixed(2).replace('.', ',') },
            { lohnart: '2010', bezeichnung: 'Überstunden', st: '1', sv: 'L', gb: 'J', einheit: 'Std', menge: calc.overtimeHours.toFixed(2).replace('.', ','), faktor: calc.hourlyWage.toFixed(2).replace('.', ','), val: 'inkl.' },
            { lohnart: '3000', bezeichnung: 'SFN-Zuschläge', st: 'F', sv: 'L', gb: 'J', val: calc.sfnSupplements.toFixed(2).replace('.', ',') }
        ],
        page: '1', payrollPeriodStart: moment(payslip.payrollPeriodStart).format('DD.MM.YYYY'), payrollPeriodEnd: moment(payslip.payrollPeriodEnd).format('DD.MM.YYYY')
    };

    const pdfBuffer = await generateGermanPayslipPDF(pdfData);
    const fileName = `Abrechnung_${id}.pdf`;
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
