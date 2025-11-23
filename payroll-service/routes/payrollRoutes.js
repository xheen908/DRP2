const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// Routen für Gehaltsabrechnungsläufe (Payroll Runs)
router.post('/runs', payrollController.createPayrollRun); // Neuen Lauf erstellen
router.get('/runs', payrollController.getAllPayrollRuns); // Alle Läufe abrufen
router.get('/runs/:id', payrollController.getPayrollRunById); // Spezifischen Lauf abrufen
router.post('/runs/:id/calculate', payrollController.calculatePayrollRun); // Gehaltsabrechnungen für einen Lauf berechnen
router.put('/runs/:id/status', payrollController.updatePayrollRunStatus); // Status eines Laufs aktualisieren
router.delete('/runs/:id', payrollController.deletePayrollRun); // Lauf löschen

// Routen für einzelne Gehaltsabrechnungen (Payslips)
router.get('/payslips/employee/:employeeId', payrollController.getEmployeePayslips); // Payslips für einen Mitarbeiter abrufen
router.get('/payslips/:id', payrollController.getSinglePayslip); // Einzelnen Payslip abrufen
router.post('/payslips/:id/generate-document', payrollController.generatePayslipDocument); // PDF-Dokument generieren (Placeholder)


module.exports = router;