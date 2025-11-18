const Job = require('../models/jobModel');
const { Op } = require('sequelize');
const fetch = require('node-fetch'); // Für Service-zu-Service HTTP-Aufrufe

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const CLIENT_SERVICE_URL = process.env.CLIENT_SERVICE_URL;
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL;

// Hilfsfunktion zur Autorisierung basierend auf X-User-Roles Header
const authorize = (req, res, next, requiredRoles) => {
    const userRolesHeader = req.headers['x-user-roles'];
    if (!userRolesHeader) {
        return res.status(403).json({ message: 'Autorisierungsinformationen fehlen.' });
    }
    const userRoles = userRolesHeader.split(',');
    const hasPermission = userRoles.some(role => requiredRoles.includes(role));
    if (hasPermission) {
        next();
    } else {
        res.status(403).json({ message: 'Keine ausreichenden Berechtigungen für diese Aktion.' });
    }
};

// Hilfsfunktion zum Abrufen von Service-Daten
// NEU: requestHeaders-Parameter hinzugefügt, um X-User-ID und X-User-Roles weiterzuleiten
const fetchServiceData = async (url, token = null, requestHeaders = {}) => {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // WICHTIG: X-User-ID und X-User-Roles Header vom eingehenden Request weiterleiten
        if (requestHeaders['x-user-id']) {
            headers['X-User-ID'] = requestHeaders['x-user-id'];
        }
        if (requestHeaders['x-user-roles']) {
            headers['X-User-Roles'] = requestHeaders['x-user-roles'];
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fehler (${response.status}) beim Abrufen von ${url}: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Fehler beim Fetch von ${url}:`, error.message);
        throw error; // Fehler weiterwerfen
    }
};

// Alle Jobs abrufen
exports.getAllJobs = async (req, res) => {
    // Autorisierung: Manager/Admin/Disponent sehen alle Jobs, Monteure nur ihre eigenen
    authorize(req, res, async () => {
        const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const userId = req.headers['x-user-id']; // Vom Gateway übermittelte User ID

        let whereClause = {};
        if (userRoles.includes('Monteur')) {
            if (!userId) {
                return res.status(403).json({ message: 'Benutzer-ID fehlt für Monteur-Rolle.' });
            }
            whereClause = { assigned_user_id: userId };
        } else if (!userRoles.some(role => ['Manager', 'Admin', 'Disponent'].includes(role))) {
            return res.status(403).json({ message: 'Keine Berechtigung, Jobs abzurufen.' });
        }

        try {
            const jobs = await Job.findAll({ where: whereClause });

            // Daten von anderen Services aggregieren
            const jobDataPromises = jobs.map(async job => {
                // req.headers an fetchServiceData übergeben
                const clientPromise = job.client_id ? fetchServiceData(`${CLIENT_SERVICE_URL}/${job.client_id}`, null, req.headers) : Promise.resolve(null);
                // HIER IST DIE KORREKTUR: Fügen Sie /api/locations hinzu
                const locationPromise = job.location_id ? fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${job.location_id}`, null, req.headers) : Promise.resolve(null);
                const assignedUserPromise = job.assigned_user_id ? fetchServiceData(`${AUTH_SERVICE_URL}/users/${job.assigned_user_id}`, null, req.headers) : Promise.resolve(null);

                const [client, location, assignedUser] = await Promise.all([clientPromise, locationPromise, assignedUserPromise]);

                return {
                    ...job.toJSON(), // Konvertiert Sequelize-Instanz zu Plain Object
                    client_name: client ? client.name : null,
                    location_name: location ? location.name : null,
                    location_address: location ? location.address : null,
                    location_latitude: location ? location.latitude : null,
                    location_longitude: location ? location.longitude : null,
                    location_nfc_tag_id: location ? location.nfc_tag_id : null,
                    assigned_to_username: assignedUser ? assignedUser.full_name : null,
                    assigned_to_user_pin: assignedUser ? assignedUser.pin : null,
                };
            });

            const aggregatedJobs = await Promise.all(jobDataPromises);
            res.status(200).json(aggregatedJobs);
        } catch (error) {
            console.error('Fehler beim Abrufen aller Jobs:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Jobs.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']); // Alle diese Rollen dürfen zugreifen (mit Einschränkungen)
};

// Job nach ID abrufen
exports.getJobById = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const userId = req.headers['x-user-id'];

        try {
            const job = await Job.findByPk(id);
            if (!job) {
                return res.status(404).json({ message: 'Job nicht gefunden.' });
            }

            // Monteure dürfen nur ihre eigenen Jobs sehen
            if (userRoles.includes('Monteur') && job.assigned_user_id != userId) {
                 return res.status(403).json({ message: 'Keine Berechtigung, diesen Job zu sehen.' });
            }

            // Daten von anderen Services aggregieren
            // req.headers an fetchServiceData übergeben
            const clientPromise = fetchServiceData(`${CLIENT_SERVICE_URL}/${job.client_id}`, null, req.headers);
            // HIER IST DIE KORREKTUR: Fügen Sie /api/locations hinzu
            const locationPromise = fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${job.location_id}`, null, req.headers);
            const assignedUserPromise = job.assigned_user_id ? fetchServiceData(`${AUTH_SERVICE_URL}/users/${job.assigned_user_id}`, null, req.headers) : Promise.resolve(null);

            const [client, location, assignedUser] = await Promise.all([clientPromise, locationPromise, assignedUserPromise]);

            res.status(200).json({
                ...job.toJSON(),
                client_name: client ? client.name : null,
                location_name: location ? location.name : null,
                location_address: location ? location.address : null,
                assigned_to_username: assignedUser ? assignedUser.full_name : null,
                assigned_to_user_pin: assignedUser ? assignedUser.pin : null,
            });
        } catch (error) {
            console.error('Fehler beim Abrufen des Jobs:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']);
};


// Neuen Job erstellen
exports.createJob = async (req, res) => {
    authorize(req, res, async () => {
        const { job_number, title, description, location_id, assigned_user_id, start_time, end_time } = req.body;

        if (!job_number || !title || !location_id) {
            return res.status(400).json({ message: 'Job-Nummer, Titel und Einsatzort sind erforderlich.' });
        }

        try {
            // Validieren, ob Location existiert und Client-ID von Location holen
            // req.headers an fetchServiceData übergeben
            // HIER IST DIE KORREKTUR: Fügen Sie /api/locations hinzu
            const location = await fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${location_id}`, null, req.headers);
            if (!location) {
                return res.status(404).json({ message: 'Einsatzort nicht gefunden.' });
            }
            const client_id = location.client_id; // Client-ID vom Location Service holen

            // Optional: Prüfen, ob der zugewiesene Benutzer existiert
            if (assigned_user_id) {
                // req.headers an fetchServiceData übergeben
                const assignedUser = await fetchServiceData(`${AUTH_SERVICE_URL}/users/${assigned_user_id}`, null, req.headers);
                if (!assignedUser) {
                    return res.status(404).json({ message: 'Zugewiesener Benutzer nicht gefunden.' });
                }
            }

            const newJob = await Job.create({
                job_number,
                title,
                description,
                client_id, // Hier die vom Location Service geholte Client-ID verwenden
                location_id,
                assigned_user_id,
                planned_start_time: start_time,
                planned_end_time: end_time,
                status: 'PENDING' // Neuer Job startet immer als PENDING
            });

            res.status(201).json({ message: 'Job erfolgreich erstellt.', job: newJob });
        } catch (error) {
            console.error('Fehler beim Erstellen des Jobs:', error);
            if (error.message.includes('Validation error')) {
                return res.status(400).json({ message: 'Ungültige Daten für den Job.' });
            }
            res.status(500).json({ message: 'Interner Serverfehler beim Erstellen des Jobs.' });
        }
    }, ['Manager', 'Admin', 'Disponent']);
};


// Job aktualisieren
exports.updateJob = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        const { job_number, title, description, location_id, assigned_user_id, status, planned_start_time, planned_end_time, actual_start_time, actual_end_time } = req.body;
        const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const userId = req.headers['x-user-id'];

        try {
            const job = await Job.findByPk(id);
            if (!job) {
                return res.status(404).json({ message: 'Job nicht gefunden.' });
            }

            // Autorisierung prüfen:
            // Manager/Admin/Disponent dürfen alles, Monteure nur bestimmte Status ändern an ihren Jobs
            if (userRoles.includes('Monteur')) {
                if (job.assigned_user_id != userId) {
                    return res.status(403).json({ message: 'Sie dürfen nur Ihre eigenen Jobs bearbeiten.' });
                }
                // Monteure dürfen nur den Status auf IN_PROGRESS oder COMPLETED setzen,
                // und nur wenn es sinnvoll ist (nicht von COMPLETED zurück zu PENDING etc.)
                if (status && !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
                    return res.status(403).json({ message: 'Monteure dürfen den Status nur auf IN_PROGRESS oder COMPLETED setzen.' });
                }
                // Monteure dürfen keine anderen Felder ändern (job_number, title, location_id, assigned_user_id)
                if (job_number || title || description || location_id || assigned_user_id || planned_start_time || planned_end_time) {
                     return res.status(403).json({ message: 'Monteure dürfen nur den Status, Actual Start/Ende ändern.' });
                }
            }


            // Validieren, ob Location existiert (wenn location_id geändert wurde)
            if (location_id && location_id !== job.location_id) {
                // req.headers an fetchServiceData übergeben
                // HIER IST DIE KORREKTUR: Fügen Sie /api/locations hinzu
                const location = await fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${location_id}`, null, req.headers);
                if (!location) {
                    return res.status(404).json({ message: 'Einsatzort nicht gefunden.' });
                }
                job.client_id = location.client_id; // Client-ID automatisch aktualisieren
            }

            // Optional: Prüfen, ob der zugewiesene Benutzer existiert
            if (assigned_user_id && assigned_user_id !== job.assigned_user_id) {
                // req.headers an fetchServiceData übergeben
                const assignedUser = await fetchServiceData(`${AUTH_SERVICE_URL}/users/${assigned_user_id}`, null, req.headers);
                if (!assignedUser) {
                    return res.status(404).json({ message: 'Zugewiesener Benutzer nicht gefunden.' });
                }
            }

            job.job_number = job_number !== undefined ? job_number : job.job_number;
            job.title = title !== undefined ? title : job.title;
            job.description = description !== undefined ? description : job.description;
            job.location_id = location_id !== undefined ? location_id : job.location_id;
            job.assigned_user_id = assigned_user_id !== undefined ? assigned_user_id : job.assigned_user_id;
            job.status = status !== undefined ? status : job.status;
            job.planned_start_time = planned_start_time !== undefined ? planned_start_time : job.planned_start_time;
            job.planned_end_time = planned_end_time !== undefined ? planned_end_time : job.planned_end_time;
            job.actual_start_time = actual_start_time !== undefined ? actual_start_time : job.actual_start_time;
            job.actual_end_time = actual_end_time !== undefined ? actual_end_time : job.actual_end_time;

            await job.save();
            res.status(200).json({ message: 'Job erfolgreich aktualisiert.' });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Jobs:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren des Jobs.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']); // Monteure dürfen auch (eingeschränkt)
};

// Job löschen
exports.deleteJob = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        try {
            const job = await Job.findByPk(id);
            if (!job) {
                return res.status(404).json({ message: 'Job nicht gefunden.' });
            }
            await job.destroy();
            res.status(200).json({ message: 'Job erfolgreich gelöscht.' });
        } catch (error) {
            console.error('Fehler beim Löschen des Jobs:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin']); // Nur Manager und Admin dürfen Jobs löschen
};

// Mögliche Job-Status abrufen
exports.getJobStatuses = async (req, res) => {
    // Jeder authentifizierte Benutzer darf die Status abrufen
    authorize(req, res, async () => {
        // Status sind im ENUM definiert, direkt aus dem Modell holen
        // NEU: Zugriff auf die Enumerationswerte der 'status'-Spalte über das Sequelize-Model
        const statuses = Job.rawAttributes.status.values;
        res.status(200).json(statuses);
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']);
};

// NEU: Benutzer für die Zuweisung abrufen (Auth Service)
exports.getUsersForAssignment = async (req, res) => {
    authorize(req, res, async () => {
        try {
            // req.headers an fetchServiceData übergeben
            const users = await fetchServiceData(`${AUTH_SERVICE_URL}/users`, null, req.headers);
            // Filtern oder Anpassen der Benutzerliste, falls nötig (z.B. nur aktive Benutzer)
            res.status(200).json(users);
        } catch (error) {
            console.error('Fehler beim Abrufen der Benutzer für die Zuweisung:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Benutzer.' });
        }
    }, ['Manager', 'Admin', 'Disponent']); // Diese Rollen dürfen Benutzer für Zuweisung sehen
};