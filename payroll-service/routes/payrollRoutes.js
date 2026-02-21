// DRP2/payroll-service/routes/payrollRoutes.js
const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// Helper to ensure controller method exists
const check = (fn) => {
    if (typeof fn !== 'function') {
        return (req, res) => res.status(500).json({ message: 'Controller method not found' });
    }
    return fn;
};

// Gehaltsabrechnungsläufe (Payroll Runs)
router.post('/runs', payrollController.createPayrollRun);
router.get('/runs', payrollController.getAllPayrollRuns);
router.get('/runs/:id', payrollController.getPayrollRunById);
router.post('/runs/:id/calculate', payrollController.calculatePayrollRun);
router.put('/runs/:id/status', (req, res, next) => {
    if (payrollController.updatePayrollRunStatus) return payrollController.updatePayrollRunStatus(req, res, next);
    res.status(500).json({ message: 'Method not ready' });
});
router.delete('/runs/:id', payrollController.deletePayrollRun);

// Einzelschritte
router.get('/payslips/employee/:employeeId', (req, res, next) => {
    if (payrollController.getEmployeePayslips) return payrollController.getEmployeePayslips(req, res, next);
    res.status(500).json({ message: 'Method not ready' });
});
router.get('/payslips/:id', (req, res, next) => {
    if (payrollController.getSinglePayslip) return payrollController.getSinglePayslip(req, res, next);
    res.status(500).json({ message: 'Method not ready' });
});
router.post('/payslips/:id/generate-document', payrollController.generatePayslipDocument);

module.exports = router;
