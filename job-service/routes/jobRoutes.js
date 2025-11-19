const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Alle Routen sind geschützt, die Autorisierung erfolgt im Controller

// Spezifische Routen müssen VOR allgemeinen Routen wie '/:id' definiert werden
router.get('/statuses', jobController.getJobStatuses); // Route für Job-Status
router.get('/users-for-assignment', jobController.getUsersForAssignment); // NEU: Route für Benutzer zur Zuweisung

// NEUE ROUTE: Nächsten Job für einen Mitarbeiter abrufen
router.get('/next-for-employee/:employeeId', jobController.getNextJobForEmployee);

// NEUE ROUTEN: Starten und Beenden eines Jobs
router.post('/:jobId/start', jobController.startJob);
router.post('/:jobId/end', jobController.endJob);

router.get('/', jobController.getAllJobs);
router.post('/', jobController.createJob);
router.get('/:id', jobController.getJobById);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);


module.exports = router;