const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController'); // Controller importieren

// Alle Mitarbeiter abrufen
router.get('/employees', hrController.getAllEmployees);

// Mitarbeiter anhand der ID abrufen
router.get('/employees/:id', hrController.getEmployeeById);

// Mitarbeiter anhand der userId (aus Auth Service) abrufen
router.get('/employees/user/:userId', hrController.getEmployeeByUserId);

// Einen neuen Mitarbeiter erstellen
router.post('/employees', hrController.createEmployee);

// Mitarbeiter aktualisieren (anhand der internen HR ID)
router.put('/employees/:id', hrController.updateEmployee);

// NEU: Mitarbeiter aktualisieren (anhand der userId vom Auth Service)
router.put('/employees/user/:userId', hrController.updateEmployeeByUserId);

// Mitarbeiter löschen (anhand der internen HR ID)
router.delete('/employees/:id', hrController.deleteEmployee);

// NEU: Mitarbeiter löschen (anhand der userId vom Auth Service)
router.delete('/employees/user/:userId', hrController.deleteEmployeeByUserId);

module.exports = router;