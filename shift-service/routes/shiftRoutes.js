// DRP2/shift-service/routes/shiftRoutes.js
const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');

// NEUE ROUTE für den Schicht-Check-in
router.post('/checkin', shiftController.checkInShift);

// NEUE ROUTE für den Schicht-Check-out
router.post('/checkout', shiftController.checkOutShift);

// NEUE ROUTE zum Abrufen ALLER Schichten für einen bestimmten Benutzer (die user_shifts_view.ejs benötigt diese)
// Achtung: Der Parameter ist jetzt employeeId, nicht mehr userId (obwohl es die gleiche ID ist)
router.get('/user/:userId', shiftController.getShiftsByUserId);

// Die alten Routen (/, /:id, /statuses, etc.) aus der DRP2-Version sollten entfernt oder
// an das neue Modell angepasst werden, falls sie noch benötigt werden.
// Für die Wiederherstellung der ursprünglichen Logik sind sie irrelevant oder müssten umgeschrieben werden.

module.exports = router;