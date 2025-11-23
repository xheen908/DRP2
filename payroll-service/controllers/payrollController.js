const { PayrollRun, Payslip } = require('../models/payrollModel');
const fetch = require('node-fetch');

// Basis-URL des HR Service (wird in einer echten Anwendung über Umgebungsvariablen oder Service Discovery gelöst)
const HR_SERVICE_URL = process.env.HR_SERVICE_URL || 'http://hr-service:3008'; // Korrigierter Port
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'; // Korrigierter Port

// --- Helper-Funktionen (Stark vereinfacht!) ---
const calculateGermanPayroll = (employeeData, month, year) => {
    // ACHTUNG: DIES IST EINE EXTREM VEREINFACHTE PLACEHOLDER-FUNKTION!
    // EINE ECHTE DEUTSCHE GEHALTSABRECHNUNG IST HOCHKOMPLEX
    // UND MÜSSTE FOLGENDES BERÜCKSICHTIGEN:
    // - Lohnsteuerklassen, Kinderfreibeträge, Kirchensteuer, Soli (mit jährlichen Änderungen)
    // - Sozialversicherungsbeiträge (Kranken, Pflege, Renten, Arbeitslosen) mit AG- & AN-Anteil, Beitragsbemessungsgrenzen
    // - Spezifische Sätze je Krankenkasse
    // - Diverse Lohnarten (Überstunden, Zuschläge, Boni, Sachbezüge) mit unterschiedlicher Steuer-/SV-Behandlung
    // - Sonderfälle (Minijob, Werkstudent, Gleitzone, Mutterschutz, Krankheit etc.)
    // - Gesetzliche Freibeträge, Pauschalen
    // Hier würde man oft auf spezialisierte Bibliotheken oder umfassende Regelwerke zurückgreifen.

    console.log(`[Payroll Controller] Starte Gehaltsberechnung für Mitarbeiter ${employeeData.firstName} ${employeeData.lastName}`);

    const baseSalary = parseFloat(employeeData.salary); // Grundgehalt vom HR Service
    let grossSalary = baseSalary; // Vereinfacht

    let taxAmount = grossSalary * 0.15; // 15% Steuer als Mock
    let socialSecurityAmount = grossSalary * 0.20; // 20% SV als Mock

    // Beispiel für detaillierte SV-Anteile (Mock-Werte)
    const healthInsuranceEmployeeShare = grossSalary * 0.07;
    const nursingInsuranceEmployeeShare = grossSalary * 0.017;
    const pensionInsuranceEmployeeShare = grossSalary * 0.093;
    const unemploymentInsuranceEmployeeShare = grossSalary * 0.012;

    const employerSocialSecurityTotal = grossSalary * (0.07 + 0.017 + 0.093 + 0.012); // AG-Anteil vereinfacht

    let netSalary = grossSalary - taxAmount - socialSecurityAmount;

    console.log(`[Payroll Controller] Berechnung abgeschlossen für ${employeeData.firstName} ${employeeData.lastName}: Brutto=${grossSalary.toFixed(2)}, Netto=${netSalary.toFixed(2)}`);

    return {
        grossSalary: parseFloat(grossSalary.toFixed(2)),
        netSalary: parseFloat(netSalary.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        socialSecurityAmount: parseFloat(socialSecurityAmount.toFixed(2)),
        healthInsuranceEmployeeShare: parseFloat(healthInsuranceEmployeeShare.toFixed(2)),
        nursingInsuranceEmployeeShare: parseFloat(nursingInsuranceEmployeeShare.toFixed(2)),
        pensionInsuranceEmployeeShare: parseFloat(pensionInsuranceEmployeeShare.toFixed(2)),
        unemploymentInsuranceEmployeeShare: parseFloat(unemploymentInsuranceEmployeeShare.toFixed(2)),
        employerSocialSecurityTotal: parseFloat(employerSocialSecurityTotal.toFixed(2)),
        // Daten aus HR Service zur Abrechnung hinzufügen
        taxClass: employeeData.taxSocialSecurity?.taxClass || 'IV', // Mock default
        childAllowances: employeeData.taxSocialSecurity?.childAllowances || 0.0,
        maritalStatus: employeeData.maritalStatus || 'Unbekannt',
        // weitere Lohnabrechnungs-relevante Daten
    };
};

// --- Controller-Funktionen ---

// Einen neuen Gehaltsabrechnungslauf erstellen
const createPayrollRun = async (req, res) => {
    try {
        const { month, year } = req.body;
        const createdByUserId = req.user.id; // Vom Authentifizierungs-Middleware

        if (!month || !year) {
            return res.status(400).json({ message: 'Monat und Jahr sind erforderlich.' });
        }

        const newPayrollRun = await PayrollRun.create({ month, year, createdByUserId });
        res.status(201).json(newPayrollRun);
    } catch (error) {
        console.error('Fehler beim Erstellen des Gehaltsabrechnungslaufs:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Erstellen des Laufs.' });
    }
};

// Alle Gehaltsabrechnungsläufe abrufen
const getAllPayrollRuns = async (req, res) => {
    try {
        const payrollRuns = await PayrollRun.findAll({
            include: [{ model: Payslip }], // Payslips direkt mitladen
            order: [['year', 'DESC'], ['month', 'DESC']],
        });
        res.status(200).json(payrollRuns);
    } catch (error) {
        console.error('Fehler beim Abrufen aller Gehaltsabrechnungsläufe:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Läufe.' });
    }
};

// Einen spezifischen Gehaltsabrechnungslauf abrufen
const getPayrollRunById = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRun = await PayrollRun.findByPk(id, {
            include: [{ model: Payslip }],
        });

        if (!payrollRun) {
            return res.status(404).json({ message: 'Gehaltsabrechnungslauf nicht gefunden.' });
        }
        res.status(200).json(payrollRun);
    } catch (error) {
        console.error('Fehler beim Abrufen des Gehaltsabrechnungslaufs:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen des Laufs.' });
    }
};

// Gehaltsabrechnungen für einen Lauf berechnen
const calculatePayrollRun = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRun = await PayrollRun.findByPk(id);

        if (!payrollRun) {
            return res.status(404).json({ message: 'Gehaltsabrechnungslauf nicht gefunden.' });
        }
        if (payrollRun.status !== 'pending') {
            return res.status(400).json({ message: 'Gehaltsabrechnungslauf kann nicht berechnet werden, da der Status nicht "pending" ist.' });
        }

        console.log(`[Payroll Controller] Starte Berechnung für Lauf ${payrollRun.id} (${payrollRun.month}/${payrollRun.year})`);

        // Schritt 1: Alle aktiven Mitarbeiter vom HR Service abrufen
        const hrServiceResponse = await fetch(`${HR_SERVICE_URL}/api/hr/employees`, {
            headers: {
                'Authorization': req.headers['authorization'], // Auth Header weiterleiten
            },
        });

        if (!hrServiceResponse.ok) {
            const errorData = await hrServiceResponse.json();
            console.error('Fehler beim Abrufen der Mitarbeiter vom HR Service:', errorData);
            return res.status(hrServiceResponse.status).json({ message: `Fehler vom HR Service: ${errorData.message}` });
        }
        const employees = await hrServiceResponse.json();
        console.log(`[Payroll Controller] ${employees.length} Mitarbeiter vom HR Service erhalten.`);

        let totalGross = 0;
        let totalNet = 0;
        const payslipPromises = [];

        // Vorhandene Payslips für diesen Lauf löschen, falls neu berechnet wird
        await Payslip.destroy({ where: { payrollRunId: payrollRun.id } });

        for (const employee of employees) {
            // Nur aktive Mitarbeiter abrechnen (oder nach Status filtern)
            if (employee.status === 'active') { // Annahme: HR Service Employee hat einen 'status'
                const payslipData = calculateGermanPayroll(employee, payrollRun.month, payrollRun.year);

                totalGross += payslipData.grossSalary;
                totalNet += payslipData.netSalary;

                const payslipPeriodStart = new Date(payrollRun.year, payrollRun.month - 1, 1).toISOString().split('T')[0];
                const payslipPeriodEnd = new Date(payrollRun.year, payrollRun.month, 0).toISOString().split('T')[0];


                payslipPromises.push(Payslip.create({
                    payrollRunId: payrollRun.id,
                    employeeId: employee.id, // Die HR Service Employee ID
                    grossSalary: payslipData.grossSalary,
                    netSalary: payslipData.netSalary,
                    taxAmount: payslipData.taxAmount,
                    socialSecurityAmount: payslipData.socialSecurityAmount,
                    healthInsuranceEmployeeShare: payslipData.healthInsuranceEmployeeShare,
                    nursingInsuranceEmployeeShare: payslipData.nursingInsuranceEmployeeShare,
                    pensionInsuranceEmployeeShare: payslipData.pensionInsuranceEmployeeShare,
                    unemploymentInsuranceEmployeeShare: payslipData.unemploymentInsuranceEmployeeShare,
                    employerSocialSecurityTotal: payslipData.employerSocialSecurityTotal,
                    otherDeductions: payslipData.otherDeductions,
                    bonuses: payslipData.bonuses,
                    allowances: payslipData.allowances,
                    taxClass: payslipData.taxClass,
                    childAllowances: payslipData.childAllowances,
                    maritalStatus: payslipData.maritalStatus,
                    payrollPeriodStart: payslipPeriodStart,
                    payrollPeriodEnd: payslipPeriodEnd,
                }));
            }
        }

        const payslips = await Promise.all(payslipPromises);

        payrollRun.totalGrossSalary = totalGross;
        payrollRun.totalNetSalary = totalNet;
        payrollRun.status = 'calculated';
        await payrollRun.save();

        res.status(200).json({ message: 'Gehaltsabrechnungslauf erfolgreich berechnet.', payrollRun, payslipsCount: payslips.length });
    } catch (error) {
        console.error('Fehler beim Berechnen des Gehaltsabrechnungslaufs:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Berechnen des Laufs.' });
    }
};

// Status eines Gehaltsabrechnungslaufs aktualisieren (z.B. auf 'approved' oder 'paid')
const updatePayrollRunStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'paid', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Ungültiger Status. Erlaubt sind: approved, paid, cancelled.' });
        }

        const payrollRun = await PayrollRun.findByPk(id);

        if (!payrollRun) {
            return res.status(404).json({ message: 'Gehaltsabrechnungslauf nicht gefunden.' });
        }

        payrollRun.status = status;
        await payrollRun.save();
        res.status(200).json({ message: `Status des Laufs auf '${status}' aktualisiert.`, payrollRun });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Status des Gehaltsabrechnungslaufs:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren des Status.' });
    }
};


// Alle Gehaltsabrechnungen eines spezifischen Mitarbeiters abrufen (über HR Employee ID)
const getEmployeePayslips = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const payslips = await Payslip.findAll({
            where: { employeeId },
            order: [['payslipDate', 'DESC']],
            include: [{ model: PayrollRun }],
        });

        if (payslips.length === 0) {
            return res.status(404).json({ message: 'Keine Gehaltsabrechnungen für diesen Mitarbeiter gefunden.' });
        }
        res.status(200).json(payslips);
    } catch (error) {
        console.error('Fehler beim Abrufen der Gehaltsabrechnungen für Mitarbeiter:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Mitarbeiter-Payslips.' });
    }
};

// Eine einzelne Gehaltsabrechnung abrufen
const getSinglePayslip = async (req, res) => {
    try {
        const { id } = req.params;
        const payslip = await Payslip.findByPk(id, {
            include: [{ model: PayrollRun }],
        });

        if (!payslip) {
            return res.status(404).json({ message: 'Gehaltsabrechnung nicht gefunden.' });
        }
        res.status(200).json(payslip);
    } catch (error) {
        console.error('Fehler beim Abrufen der einzelnen Gehaltsabrechnung:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Payslip.' });
    }
};

// Gehaltsabrechnungslauf löschen (WARNUNG: Dies löscht auch alle zugehörigen Payslips)
const deletePayrollRun = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRun = await PayrollRun.findByPk(id);

        if (!payrollRun) {
            return res.status(404).json({ message: 'Gehaltsabrechnungslauf nicht gefunden.' });
        }

        await payrollRun.destroy(); // Cascade-Delete sollte Payslips löschen
        res.status(200).json({ message: 'Gehaltsabrechnungslauf und zugehörige Payslips erfolgreich gelöscht.' });
    } catch (error) {
        console.error('Fehler beim Löschen des Gehaltsabrechnungslaufs:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Löschen des Laufs.' });
    }
};

// Gehaltsabrechnungsdokument (PDF) generieren (Placeholder)
const generatePayslipDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const payslip = await Payslip.findByPk(id, {
            include: [{ model: PayrollRun }],
        });

        if (!payslip) {
            return res.status(404).json({ message: 'Gehaltsabrechnung nicht gefunden.' });
        }

        // --- HIER WÜRDE DIE LOGIK ZUR PDF-GENERIERUNG STATTFINDEN ---
        // Dies würde eine Bibliothek wie 'pdfkit', 'handlebars' + 'html-pdf' oder ähnliches erfordern.
        // Die Daten aus dem Payslip-Objekt würden in ein Template eingefügt und als PDF ausgegeben.
        const mockPdfPath = `/payslips/${payslip.payrollRunId}-${payslip.employeeId}-${payslip.id}.pdf`;
        console.log(`[Payroll Controller] Mock-PDF für Payslip ${id} generiert: ${mockPdfPath}`);

        payslip.documentPath = mockPdfPath;
        await payslip.save();

        res.status(200).json({ message: 'Mock-Gehaltsabrechnungsdokument generiert und Pfad gespeichert.', documentPath: mockPdfPath });

    } catch (error) {
        console.error('Fehler beim Generieren des Gehaltsabrechnungsdokuments:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Generieren des Dokuments.' });
    }
};


module.exports = {
    createPayrollRun,
    getAllPayrollRuns,
    getPayrollRunById,
    calculatePayrollRun,
    updatePayrollRunStatus,
    getEmployeePayslips,
    getSinglePayslip,
    deletePayrollRun,
    generatePayslipDocument,
};