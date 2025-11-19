const Location = require('../models/locationModel');
const { Op } = require('sequelize');
// const fetch = require('node-fetch'); // <-- Diese Zeile entfernen oder auskommentieren

// Korrigierte URL für den Client-Service
const CLIENT_SERVICE_URL = process.env.CLIENT_SERVICE_URL || 'http://client-service:3006'; // Standard auf Port 3006 setzen

// Hilfsfunktion zur Autorisierung basierend auf X-User-Roles Header
const authorize = (req, res, next, requiredRoles) => {
    console.log(`[authorize] Anfrage für Pfad: ${req.path}, Methode: ${req.method}`);
    const userRolesHeader = req.headers['x-user-roles'];
    if (!userRolesHeader) {
        return res.status(403).json({ message: 'Autorisierungsinformationen fehlen.' });
    }
    const userRoles = userRolesHeader.split(',');
    console.log(`[authorize] Benutzerrollen: ${userRoles.join(', ')}, Erforderliche Rollen: ${requiredRoles.join(', ')}`);
    const hasPermission = userRoles.some(role => requiredRoles.includes(role));
    if (hasPermission) {
        next();
    } else {
        res.status(403).json({ message: 'Keine ausreichenden Berechtigungen für diese Aktion.' });
    }
};

// Hilfsfunktion zum Abrufen von Service-Daten
// Hinzugefügt: requestHeaders-Parameter, um die Header weiterzuleiten
const fetchServiceData = async (url, requestHeaders = {}) => {
    console.log(`[fetchServiceData] Abrufen von Daten von: ${url}`);
    const { default: fetch } = await import('node-fetch');

    try {
        const headers = { 'Content-Type': 'application/json' };

        // X-User-ID und X-User-Roles Header vom eingehenden Request weiterleiten
        if (requestHeaders['x-user-id']) {
            headers['X-User-ID'] = requestHeaders['x-user-id'];
        }
        if (requestHeaders['x-user-roles']) {
            headers['X-User-Roles'] = requestHeaders['x-user-roles'];
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`[fetchServiceData] Daten nicht gefunden für: ${url}`);
                return null;
            }
            const errorText = await response.text();
            throw new Error(`Fehler (${response.status}) beim Abrufen von ${url}: ${errorText}`);
        }
        const data = await response.json();
        console.log(`[fetchServiceData] Daten erfolgreich von ${url} abgerufen.`);
        return data;
    } catch (error) {
        console.error(`[fetchServiceData] Fehler beim Fetch von ${url}:`, error.message);
        throw error;
    }
};

// Hilfsfunktion zur Berechnung der Distanz zwischen zwei GPS-Punkten (Haversine-Formel)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Meter
    const φ1 = lat1 * Math.PI / 180; // φ, λ in Radian
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // Distanz in Metern
    return d;
};


// Alle Standorte abrufen
exports.getAllLocations = async (req, res) => {
    authorize(req, res, async () => {
        console.log('[getAllLocations] Alle Standorte abrufen...');
        console.log('Typ von Location in getAllLocations:', typeof Location);
        if (Location && typeof Location.findAll === 'function') {
            console.log('Location.findAll ist eine Funktion in getAllLocations.');
        } else {
            console.error('Location.findAll ist KEINE Funktion in getAllLocations! Location ist:', Location);
        }
        try {
            const locations = await Location.findAll();
            console.log(`[getAllLocations] ${locations.length} Standorte gefunden.`);

            const locationsWithClientData = await Promise.all(locations.map(async location => {
                if (location.client_id) {
                    console.log(`[getAllLocations] Abrufen von Client ${location.client_id} für Location ${location.id}`);
                    try {
                        // req.headers an fetchServiceData übergeben
                        const client = await fetchServiceData(`${CLIENT_SERVICE_URL}/${location.client_id}`, req.headers);
                        return {
                            ...location.toJSON(),
                            client_name: client ? client.name : null,
                        };
                    } catch (error) {
                        console.error(`[getAllLocations] Fehler beim Abrufen von Client ${location.client_id} für Location ${location.id}:`, error.message);
                        return {
                            ...location.toJSON(),
                            client_name: null,
                        };
                    }
                }
                return location.toJSON();
            }));

            res.status(200).json(locationsWithClientData);
            console.log('[getAllLocations] Standorte erfolgreich zurückgegeben.');
        } catch (error) {
            console.error('[getAllLocations] Fehler beim Abrufen aller Standorte:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Standorte.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']); // HINZUGEFÜGT: 'Reinigungskraft'
};

// Standort nach ID abrufen
exports.getLocationById = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        console.log(`[getLocationById] Standort mit ID ${id} abrufen...`);
        console.log('Typ von Location in getLocationById:', typeof Location);
        if (Location && typeof Location.findByPk === 'function') {
            console.log('Location.findByPk ist eine Funktion in getLocationById.');
        } else {
            console.error('Location.findByPk ist KEINE Funktion in getLocationById! Location ist:', Location);
        }
        try {
            const location = await Location.findByPk(id);
            if (!location) {
                console.warn(`[getLocationById] Standort mit ID ${id} nicht gefunden.`);
                return res.status(404).json({ message: 'Standort nicht gefunden.' });
            }
            console.log(`[getLocationById] Standort ${id} gefunden.`);

            let client_name = null;
            if (location.client_id) {
                console.log(`[getLocationById] Abrufen von Client ${location.client_id} für Location ${location.id}`);
                try {
                    // req.headers an fetchServiceData übergeben
                    const client = await fetchServiceData(`${CLIENT_SERVICE_URL}/${location.client_id}`, req.headers);
                    client_name = client ? client.name : null;
                } catch (error) {
                    console.error(`[getLocationById] Fehler beim Abrufen von Client ${location.client_id} für Location ${location.id}:`, error.message);
                }
            }

            res.status(200).json({
                ...location.toJSON(),
                client_name: client_name,
            });
            console.log(`[getLocationById] Standort ${id} erfolgreich zurückgegeben.`);
        } catch (error) {
            console.error('[getLocationById] Fehler beim Abrufen des Standortes:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']); // HINZUGEFÜGT: 'Reinigungskraft'
};


// Standorte abrufen, die einem bestimmten Client zugeordnet sind
exports.getLocationsByClientId = async (req, res) => {
    authorize(req, res, async () => {
        const { clientId } = req.params;
        console.log(`[getLocationsByClientId] Standorte für Client-ID ${clientId} abrufen...`);
        console.log('Typ von Location in getLocationsByClientId:', typeof Location);
        if (Location && typeof Location.findAll === 'function') {
            console.log('Location.findAll ist eine Funktion in getLocationsByClientId.');
        } else {
            console.error('Location.findAll ist KEINE Funktion in getLocationsByClientId! Location ist:', Location);
        }
        try {
            const locations = await Location.findAll({
                where: { client_id: clientId }
            });
            console.log(`[getLocationsByClientId] ${locations.length} Standorte für Client-ID ${clientId} gefunden.`);

            let client_name = null;
            if (clientId) {
                console.log(`[getLocationsByClientId] Abrufen von Client ${clientId}`);
                try {
                    // req.headers an fetchServiceData übergeben
                    const client = await fetchServiceData(`${CLIENT_SERVICE_URL}/${clientId}`, req.headers);
                    client_name = client ? client.name : null;
                } catch (error) {
                    console.error(`[getLocationsByClientId] Fehler beim Abrufen von Client ${clientId}:`, error.message);
                }
            }

            res.status(200).json(locations.map(location => ({
                ...location.toJSON(),
                client_name: client_name,
            })));
            console.log(`[getLocationsByClientId] Standorte für Client-ID ${clientId} erfolgreich zurückgegeben.`);
        } catch (error) {
            console.error(`[getLocationsByClientId] Fehler beim Abrufen von Standorten für Client ${clientId}:`, error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']); // HINZUGEFÜGT: 'Reinigungskraft'
};

// Standorte und deren Clients für Dropdowns (z.B. in der Job-Erstellung)
exports.getLocationsWithClientsForDropdown = async (req, res) => {
    authorize(req, res, async () => {
        console.log('[getLocationsWithClientsForDropdown] Standorte und Clients für Dropdown abrufen...');
        console.log('Typ von Location in getLocationsWithClientsForDropdown:', typeof Location);
        if (Location && typeof Location.findAll === 'function') {
            console.log('Location.findAll ist eine Funktion in getLocationsWithClientsForDropdown.');
        } else {
            console.error('Location.findAll ist KEINE Funktion in getLocationsWithClientsForDropdown! Location ist:', Location);
        }
        try {
            const locations = await Location.findAll({
                attributes: ['id', 'name', 'address', 'client_id'] // Nur benötigte Felder
            });
            console.log(`[getLocationsWithClientsForDropdown] ${locations.length} Standorte gefunden.`);

            // Clients einmalig abrufen
            console.log(`[getLocationsWithClientsForDropdown] Alle Clients von ${CLIENT_SERVICE_URL}/ abrufen`);
            // req.headers an fetchServiceData übergeben
            const clients = await fetchServiceData(`${CLIENT_SERVICE_URL}/`, req.headers); // Annahme: /clients Endpoint liefert alle Clients
            const clientMap = new Map(clients.map(c => [c.id, c.name]));
            console.log(`[getLocationsWithClientsForDropdown] ${clients.length} Clients gefunden.`);

            const dataForDropdown = locations.map(location => ({
                id: location.id,
                name: location.name,
                address: location.address,
                client_id: location.client_id,
                client_name: location.client_id ? clientMap.get(location.client_id) : null
            }));

            res.status(200).json(dataForDropdown);
            console.log('[getLocationsWithClientsForDropdown] Daten für Dropdown erfolgreich zurückgegeben.');

        } catch (error) {
            console.error('[getLocationsWithClientsForDropdown] Fehler beim Abrufen von Standorten und Clients für Dropdown:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent']);
};


// Neuen Standort erstellen
exports.createLocation = async (req, res) => {
    authorize(req, res, async () => {
        const { name, address, latitude, longitude, nfc_tag_id, client_id } = req.body;
        console.log(`[createLocation] Neuen Standort erstellen mit Daten: ${JSON.stringify(req.body)}`);
        console.log('Typ von Location in createLocation:', typeof Location);
        if (Location && typeof Location.create === 'function') {
            console.log('Location.create ist eine Funktion in createLocation.');
        } else {
            console.error('Location.create ist KEINE Funktion in createLocation! Location ist:', Location);
        }

        if (!name || !address) {
            console.warn('[createLocation] Name und Adresse des Standortes sind erforderlich.');
            return res.status(400).json({ message: 'Name und Adresse des Standortes sind erforderlich.' });
        }

        try {
            // Optional: Prüfen, ob der Client existiert
            if (client_id) {
                console.log(`[createLocation] Prüfe Existenz von Client ${client_id}`);
                // req.headers an fetchServiceData übergeben
                const client = await fetchServiceData(`${CLIENT_SERVICE_URL}/${client_id}`, req.headers);
                if (!client) {
                    console.warn(`[createLocation] Zugewiesener Client ${client_id} nicht gefunden.`);
                    return res.status(404).json({ message: 'Zugewiesener Client nicht gefunden.' });
                }
            }

            const newLocation = await Location.create({
                name,
                address,
                latitude,
                longitude,
                nfc_tag_id,
                client_id
            });
            console.log(`[createLocation] Standort ${newLocation.id} erfolgreich erstellt.`);
            res.status(201).json({ message: 'Standort erfolgreich erstellt.', location: newLocation });
        } catch (error) {
            console.error('[createLocation] Fehler beim Erstellen des Standortes:', error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.warn('[createLocation] NFC Tag ID existiert bereits.');
                return res.status(409).json({ message: 'NFC Tag ID existiert bereits.' });
            }
            res.status(500).json({ message: 'Interner Serverfehler beim Erstellen des Standortes.' });
        }
    }, ['Manager', 'Admin', 'Disponent']);
};

// Standort aktualisieren
exports.updateLocation = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        const { name, address, latitude, longitude, nfc_tag_id, client_id } = req.body;
        console.log(`[updateLocation] Standort ${id} aktualisieren mit Daten: ${JSON.stringify(req.body)}`);
        console.log('Typ von Location in updateLocation:', typeof Location);
        if (Location && typeof Location.findByPk === 'function') {
            console.log('Location.findByPk ist eine Funktion in updateLocation.');
        } else {
            console.error('Location.findByPk ist KEINE Funktion in updateLocation! Location ist:', Location);
        }

        try {
            const location = await Location.findByPk(id);
            if (!location) {
                console.warn(`[updateLocation] Standort mit ID ${id} nicht gefunden.`);
                return res.status(404).json({ message: 'Standort nicht gefunden.' });
            }
            console.log(`[updateLocation] Standort ${id} gefunden für Aktualisierung.`);

            // Optional: Prüfen, ob der Client existiert (wenn client_id geändert wurde)
            if (client_id && client_id !== location.client_id) {
                console.log(`[updateLocation] Prüfe Existenz von neuem Client ${client_id}`);
                // req.headers an fetchServiceData übergeben
                const client = await fetchServiceData(`${CLIENT_SERVICE_URL}/${client_id}`, req.headers);
                if (!client) {
                    console.warn(`[updateLocation] Zugewiesener Client ${client_id} nicht gefunden.`);
                    return res.status(404).json({ message: 'Zugewiesener Client nicht gefunden.' });
                }
            }

            location.name = name !== undefined ? name : location.name;
            location.address = address !== undefined ? address : location.address;
            location.latitude = latitude !== undefined ? latitude : location.latitude;
            location.longitude = longitude !== undefined ? longitude : location.longitude;
            location.nfc_tag_id = nfc_tag_id !== undefined ? nfc_tag_id : location.nfc_tag_id;
            location.client_id = client_id !== undefined ? client_id : location.client_id;

            await location.save();
            console.log(`[updateLocation] Standort ${id} erfolgreich aktualisiert.`);
            res.status(200).json({ message: 'Standort erfolgreich aktualisiert.' });
        } catch (error) {
            console.error('[updateLocation] Fehler beim Aktualisieren des Standortes:', error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.warn('[updateLocation] NFC Tag ID existiert bereits.');
                return res.status(409).json({ message: 'NFC Tag ID existiert bereits.' });
            }
            res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren des Standortes.' });
        }
    }, ['Manager', 'Admin', 'Disponent']);
};

// Standort löschen
exports.deleteLocation = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        console.log(`[deleteLocation] Standort mit ID ${id} löschen...`);
        console.log('Typ von Location in deleteLocation:', typeof Location);
        if (Location && typeof Location.findByPk === 'function') {
            console.log('Location.findByPk ist eine Funktion in deleteLocation.');
        } else {
            console.error('Location.findByPk ist KEINE Funktion in deleteLocation! Location ist:', Location);
        }
        try {
            const location = await Location.findByPk(id);
            if (!location) {
                return res.status(404).json({ message: 'Standort nicht gefunden.' });
            }
            await location.destroy();
            res.status(200).json({ message: 'Standort erfolgreich gelöscht.' });
        } catch (error) {
            console.error('[deleteLocation] Fehler beim Löschen des Standortes:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin']);
};

// Standorte und Client-Informationen für die Kartenansicht abrufen
exports.getLocationsForMap = async (req, res) => {
    authorize(req, res, async () => {
        console.log('[getLocationsForMap] Standorte für die Kartenansicht abrufen...');
        console.log('Typ von Location in getLocationsForMap:', typeof Location);
        if (Location && typeof Location.findAll === 'function') {
            console.log('Location.findAll ist eine Funktion in getLocationsForMap.');
        } else {
            console.error('Location.findAll ist KEINE Funktion in getLocationsForMap! Location ist:', Location);
        }
        try {
            const locations = await Location.findAll({
                attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'client_id']
            });
            console.log(`[getLocationsForMap] ${locations.length} Standorte für die Karte gefunden.`);

            const locationsWithClientData = await Promise.all(locations.map(async location => {
                if (location.client_id) {
                    console.log(`[getLocationsForMap] Abrufen von Client ${location.client_id} für Location ${location.id}`);
                    try {
                        // req.headers an fetchServiceData übergeben
                        const client = await fetchServiceData(`${CLIENT_SERVICE_URL}/${location.client_id}`, req.headers);
                        return {
                            ...location.toJSON(),
                            client_name: client ? client.name : null,
                        };
                    } catch (error) {
                        console.error(`[getLocationsForMap] Fehler beim Abrufen von Client ${location.client_id} für Location ${location.id}:`, error.message);
                        return {
                            ...location.toJSON(),
                            client_name: null,
                        };
                    }
                }
                return location.toJSON();
            }));

            res.status(200).json(locationsWithClientData);
            console.log('[getLocationsForMap] Standorte für die Karte erfolgreich zurückgegeben.');
        } catch (error) {
            console.error('[getLocationsForMap] Fehler beim Abrufen von Standorten für die Karte:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Standorte für die Karte.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']);
};

// NEU: Validiert, ob sich der Benutzer an einem registrierten Firmenstandort befindet
exports.validateCompanyLocation = async (req, res) => {
    console.log(`[validateCompanyLocation] Anfrage erhalten für Standortvalidierung.`);
    
    authorize(req, res, async () => {
        const { latitude, longitude } = req.body;

        if (typeof latitude === 'undefined' || typeof longitude === 'undefined') {
            console.warn('[validateCompanyLocation] Breitengrad und Längengrad sind erforderlich, aber fehlten.');
            return res.status(400).json({ message: 'Breitengrad und Längengrad sind erforderlich.' });
        }

        try {
            const companyLocations = await Location.findAll({
                where: {
                    latitude: { [Op.ne]: null },
                    longitude: { [Op.ne]: null }
                },
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            });

            const userLat = parseFloat(latitude);
            const userLon = parseFloat(longitude);
            const detectionRadius = 100; // Radius in Metern, innerhalb dessen der Standort als gültig gilt

            let isValid = false;
            let foundCompanyName = 'Unbekannt';
            let foundCompanyAddress = 'Unbekannt';

            for (const loc of companyLocations) {
                const companyLat = parseFloat(loc.latitude);
                const companyLon = parseFloat(loc.longitude);

                const distance = calculateDistance(userLat, userLon, companyLat, companyLon);

                console.log(`[validateCompanyLocation] Distanz zum Standort "${loc.name}" (${loc.latitude}, ${loc.longitude}): ${distance.toFixed(2)}m`);

                if (distance <= detectionRadius) {
                    isValid = true;
                    foundCompanyName = loc.name;
                    foundCompanyAddress = loc.address;
                    break;
                }
            }

            if (isValid) {
                console.log(`[validateCompanyLocation] Standort validiert: Benutzer befindet sich in der Nähe von "${foundCompanyName}".`);
                res.status(200).json({
                    isValid: true,
                    message: `Sie befinden sich am Standort: ${foundCompanyName}.`,
                    companyName: foundCompanyName,
                    companyAddress: foundCompanyAddress,
                });
            } else {
                console.log('[validateCompanyLocation] Standort nicht validiert: Benutzer befindet sich nicht in der Nähe eines registrierten Firmenstandorts.');
                res.status(200).json({
                    isValid: false,
                    message: 'Sie befinden sich nicht an einem registrierten Firmenstandort.',
                    companyName: null,
                    companyAddress: null,
                });
            }

        } catch (error) {
            console.error('[validateCompanyLocation] FEHLER beim Validieren des Firmenstandorts:', error.message, error.stack);
            res.status(500).json({ message: 'Interner Serverfehler bei der Standortvalidierung.' });
        }
    }, ['Monteur', 'Reinigungskraft', 'Manager', 'Admin', 'Disponent']); // Alle relevanten Rollen
};