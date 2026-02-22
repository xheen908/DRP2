// DRP2/payroll-service/routes/payrollRoutes.js
const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// Gehaltsabrechnungsläufe (Payroll Runs)
router.post('/runs', payrollController.createPayrollRun);
router.get('/runs', payrollController.getAllPayrollRuns);
router.get('/runs/:id', payrollController.getPayrollRunById);
router.post('/runs/:id/calculate', payrollController.calculatePayrollRun);
router.put('/runs/:id/status', payrollController.updatePayrollRunStatus);
router.delete('/runs/:id', payrollController.deletePayrollRun);

// Einzelschritte
router.get('/payslips/employee/:employeeId', payrollController.getEmployeePayslips);
router.get('/payslips/:id', payrollController.getSinglePayslip);
router.post('/payslips/:id/generate-document', payrollController.generatePayslipDocument);

module.exports = router;
