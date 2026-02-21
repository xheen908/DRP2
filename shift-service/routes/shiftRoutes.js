// DRP2/shift-service/routes/shiftRoutes.js
const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');

// Check-in / Check-out
router.post('/checkin', shiftController.checkInShift);
router.post('/checkout', shiftController.checkOutShift);

// Abruf ALLER Schichten für einen Benutzer
router.get('/user/:userId', shiftController.getShiftsByUserId);

// Abruf des aktuellen Schichtstatus
router.get('/status/:userId', shiftController.getCurrentShiftStatus);

module.exports = router;
