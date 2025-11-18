const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');

// Abrufen aller Schichten
router.get('/', shiftController.getAllShifts);

// Abrufen einer Schicht nach ID
router.get('/:id', shiftController.getShiftById);

// Abrufen von Schichten für einen bestimmten Benutzer
router.get('/user/:userId', shiftController.getShiftsByUserId);

// Neuen Schicht erstellen
router.post('/', shiftController.createShift);

// Schicht aktualisieren
router.put('/:id', shiftController.updateShift);

// Schicht löschen
router.delete('/:id', shiftController.deleteShift);

// Mögliche Schicht-Status abrufen
router.get('/statuses', shiftController.getShiftStatuses);

module.exports = router;