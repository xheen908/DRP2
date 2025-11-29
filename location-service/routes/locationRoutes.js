const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

console.log('Location Routen initialisieren...');
console.log('Typ von locationController in locationRoutes.js:', typeof locationController);
console.log('locationController.getAllLocations ist:', typeof locationController.getAllLocations);

// NEUE ROUTE: Standort des Unternehmens validieren (für mobile App)
router.post('/validate-company-location', locationController.validateCompanyLocation);

// Abrufen aller Standorte (für Manager, Admin, Disponent, Monteur)
router.get('/', (req, res, next) => { console.log('[Route] GET /api/locations - Alle Standorte abrufen'); next(); }, locationController.getAllLocations);

// Abrufen eines Standorts nach ID (für Manager, Admin, Disponent, Monteur)
router.get('/:id', (req, res, next) => { console.log(`[Route] GET /api/locations/${req.params.id} - Standort nach ID abrufen`); next(); }, locationController.getLocationById);

// Abrufen von Standorten nach Client-ID (für Manager, Admin, Disponent, Monteur)
router.get('/client/:clientId', (req, res, next) => { console.log(`[Route] GET /api/locations/client/${req.params.clientId} - Standorte nach Client-ID abrufen`); next(); }, locationController.getLocationsByClientId);

// NEUE ROUTE: Abrufen von Standorten nach Typ
router.get('/type/:type', (req, res, next) => { console.log(`[Route] GET /api/locations/type/${req.params.type} - Standorte nach Typ abrufen`); next(); }, locationController.getLocationsByType);

// Abrufen von Standorten mit Client-Infos für Dropdowns (z.B. Job-Erstellung) (für Manager, Admin, Disponent)
router.get('/dropdown/clients', (req, res, next) => { console.log('[Route] GET /api/locations/dropdown/clients - Standorte für Dropdowns abrufen'); next(); }, locationController.getLocationsWithClientsForDropdown);

// Abrufen von Standorten für die Karte (für Manager, Admin, Disponent, Monteur)
router.get('/map', (req, res, next) => { console.log('[Route] GET /api/locations/map - Standorte für die Karte abrufen'); next(); }, locationController.getLocationsForMap);

// Neuen Standort erstellen (für Manager, Admin, Disponent)
router.post('/', (req, res, next) => { console.log('[Route] POST /api/locations - Neuen Standort erstellen'); next(); }, locationController.createLocation);

// Standort aktualisieren (für Manager, Admin, Disponent)
router.put('/:id', (req, res, next) => { console.log(`[Route] PUT /api/locations/${req.params.id} - Standort aktualisieren`); next(); }, locationController.updateLocation);

// Standort löschen (für Manager, Admin)
router.delete('/:id', (req, res, next) => { console.log(`[Route] DELETE /api/locations/${req.params.id} - Standort löschen`); next(); }, locationController.deleteLocation);

module.exports = router;
console.log('Location Routen exportiert.');