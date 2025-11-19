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
    // Autorisierung: Manager/Admin/Disponent sehen alle Jobs, Reinigungskrafte nur ihre eigenen
    authorize(req, res, async () => {
        const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const userId = req.headers['x-user-id']; // Vom Gateway übermittelte User ID

        let whereClause = {};
        if (userRoles.includes('Monteur') || userRoles.includes('Reinigungskraft')) { // HINZUGEFÜGT: 'Reinigungskraft'
            if (!userId) {
                return res.status(403).json({ message: 'Benutzer-ID fehlt für Monteur/Reinigungskraft-Rolle.' });
            }
            whereClause = { assigned_user_id: userId };
        } else if (!userRoles.some(role => ['Manager', 'Admin', 'Disponent'].includes(role))) {
            return res.status(403).json({ message: 'Keine Berechtigung, Jobs abzurufen.' });
        }

        try {
            const jobs = await Job.findAll({ where: whereClause });

            // Daten von anderen Services aggregieren
            const jobDataPromises = jobs.map(async job => {
                const jobJson = job.toJSON(); // Sequelize-Instanz zu Plain Object konvertieren

                // req.headers an fetchServiceData übergeben
                const clientPromise = jobJson.client_id ? fetchServiceData(`${CLIENT_SERVICE_URL}/${jobJson.client_id}`, null, req.headers) : Promise.resolve(null);
                const locationPromise = jobJson.location_id ? fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${jobJson.location_id}`, null, req.headers) : Promise.resolve(null);
                const assignedUserPromise = jobJson.assigned_user_id ? fetchServiceData(`${AUTH_SERVICE_URL}/users/${jobJson.assigned_user_id}`, null, req.headers) : Promise.resolve(null);

                const [client, location, assignedUser] = await Promise.all([clientPromise, locationPromise, assignedUserPromise]);

                return {
                    ...jobJson,
                    start_time: jobJson.planned_start_time, // Feld umbenennen für Frontend-Kompatibilität
                    end_time: jobJson.planned_end_time,     // Feld umbenennen für Frontend-Kompatibilität
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
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']); // Alle diese Rollen dürfen zugreifen (mit Einschränkungen)
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

            const jobJson = job.toJSON(); // Sequelize-Instanz zu Plain Object konvertieren

            // Daten von anderen Services aggregieren
            const clientPromise = fetchServiceData(`${CLIENT_SERVICE_URL}/${jobJson.client_id}`, null, req.headers);
            const locationPromise = fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${jobJson.location_id}`, null, req.headers);
            const assignedUserPromise = jobJson.assigned_user_id ? fetchServiceData(`${AUTH_SERVICE_URL}/users/${jobJson.assigned_user_id}`, null, req.headers) : Promise.resolve(null);

            const [client, location, assignedUser] = await Promise.all([clientPromise, locationPromise, assignedUserPromise]);

            res.status(200).json({
                ...jobJson,
                start_time: jobJson.planned_start_time, // Feld umbenennen für Frontend-Kompatibilität
                end_time: jobJson.planned_end_time,     // Feld umbenennen für Frontend-Kompatibilität
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
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']);
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
            const location = await fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${location_id}`, null, req.headers);
            if (!location) {
                return res.status(404).json({ message: 'Einsatzort nicht gefunden.' });
            }
            const client_id = location.client_id; // Client-ID vom Location Service holen

            // Optional: Prüfen, ob der zugewiesene Benutzer existiert
            if (assigned_user_id) {
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

            // Rückgabe des neuen Jobs mit umbenannten Feldern
            const newJobJson = newJob.toJSON();
            res.status(201).json({ 
                message: 'Job erfolgreich erstellt.', 
                job: {
                    ...newJobJson,
                    start_time: newJobJson.planned_start_time,
                    end_time: newJobJson.planned_end_time,
                }
            });
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
                const location = await fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${location_id}`, null, req.headers);
                if (!location) {
                    return res.status(404).json({ message: 'Einsatzort nicht gefunden.' });
                }
                job.client_id = location.client_id; // Client-ID automatisch aktualisieren
            }

            // Optional: Prüfen, ob der zugewiesene Benutzer existiert
            if (assigned_user_id && assigned_user_id !== job.assigned_user_id) {
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
        const statuses = Job.rawAttributes.status.values;
        res.status(200).json(statuses);
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']);
};

// NEU: Benutzer für die Zuweisung abrufen (Auth Service)
exports.getUsersForAssignment = async (req, res) => {
    authorize(req, res, async () => {
        try {
            const users = await fetchServiceData(`${AUTH_SERVICE_URL}/users`, null, req.headers);
            res.status(200).json(users);
        } catch (error) {
            console.error('Fehler beim Abrufen der Benutzer für die Zuweisung:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Benutzer.' });
        }
    }, ['Manager', 'Admin', 'Disponent']); // Diese Rollen dürfen Benutzer für Zuweisung sehen
};

// NEU: Ruft den nächsten anstehenden oder in Bearbeitung befindlichen Job für einen Mitarbeiter ab
exports.getNextJobForEmployee = async (req, res) => {
    authorize(req, res, async () => {
        const { employeeId } = req.params;
        const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const userId = req.headers['x-user-id'];

        // Autorisierung: Mitarbeiter darf nur seine eigenen Jobs abrufen. Manager/Admin/Disponent dürfen alle sehen
        if (!(userRoles.includes('Manager') || userRoles.includes('Admin') || userRoles.includes('Disponent')) && userId != employeeId) {
            return res.status(403).json({ message: 'Keine Berechtigung, Jobs anderer Benutzer abzurufen.' });
        }

        try {
            const nextJob = await Job.findOne({
                where: {
                    assigned_user_id: employeeId,
                    status: {
                        [Op.in]: ['PENDING', 'IN_PROGRESS'] // Nur ausstehende oder laufende Jobs
                    },
                },
                order: [
                    ['status', 'ASC'], // PENDING vor IN_PROGRESS
                    ['planned_start_time', 'ASC'], // Ältere Jobs zuerst
                    ['id', 'ASC'] // Als Fallback
                ]
            });

            if (!nextJob) {
                return res.status(404).json({ message: 'Kein nächster Job für diesen Mitarbeiter gefunden.' });
            }

            const nextJobJson = nextJob.toJSON(); // Sequelize-Instanz zu Plain Object konvertieren

            // Daten von anderen Services aggregieren (wie in getAllJobs/getJobById)
            const clientPromise = nextJobJson.client_id ? fetchServiceData(`${CLIENT_SERVICE_URL}/${nextJobJson.client_id}`, null, req.headers) : Promise.resolve(null);
            const locationPromise = nextJobJson.location_id ? fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${nextJobJson.location_id}`, null, req.headers) : Promise.resolve(null);
            const assignedUserPromise = nextJobJson.assigned_user_id ? fetchServiceData(`${AUTH_SERVICE_URL}/users/${nextJobJson.assigned_user_id}`, null, req.headers) : Promise.resolve(null);

            const [client, location, assignedUser] = await Promise.all([clientPromise, locationPromise, assignedUserPromise]);

            const aggregatedJob = {
                ...nextJobJson,
                start_time: nextJobJson.planned_start_time, // Feld umbenennen für Frontend-Kompatibilität
                end_time: nextJobJson.planned_end_time,     // Feld umbenennen für Frontend-Kompatibilität
                client_name: client ? client.name : null,
                location_name: location ? location.name : null,
                location_address: location ? location.address : null,
                location_latitude: location ? location.latitude : null,
                location_longitude: location ? location.longitude : null,
                location_nfc_tag_id: location ? location.nfc_tag_id : null,
                assigned_to_username: assignedUser ? assignedUser.full_name : null,
                assigned_to_user_pin: assignedUser ? assignedUser.pin : null,
            };

            res.status(200).json(aggregatedJob);

        } catch (error) {
            console.error('Fehler beim Abrufen des nächsten Jobs für Mitarbeiter:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen des nächsten Jobs.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']); // Alle relevanten Rollen
};

// NEU: Startet einen Job und aktualisiert dessen Status auf 'IN_PROGRESS'.
exports.startJob = async (req, res) => {
    authorize(req, res, async () => {
        const { jobId } = req.params;
        const { employee_id, location_barcode, check_in_latitude, check_in_longitude } = req.body;
        const userId = req.headers['x-user-id']; // Aus dem Authentifizierungstoken

        // Stellen Sie sicher, dass der angefragte employee_id mit dem authentifizierten Benutzer übereinstimmt.
        if (parseInt(employee_id) !== parseInt(userId)) {
            return res.status(403).json({ message: 'Sie sind nicht berechtigt, diesen Job zu starten.' });
        }

        // Grundlegende Validierung der Eingangsdaten
        if (!jobId || !employee_id || !location_barcode || !check_in_latitude || !check_in_longitude) {
            return res.status(400).json({ message: 'Fehlende Job-Start-Daten.' });
        }

        try {
            const job = await Job.findByPk(jobId);

            if (!job) {
                return res.status(404).json({ message: 'Job nicht gefunden.' });
            }

            // Überprüfen, ob der Job dem Mitarbeiter zugewiesen ist und den Status 'PENDING' oder 'ASSIGNED' hat.
            if (job.assigned_user_id !== parseInt(employee_id) || (job.status !== 'PENDING' && job.status !== 'ASSIGNED')) {
                return res.status(400).json({ message: 'Job kann nicht gestartet werden: Nicht zugewiesen oder bereits gestartet/abgeschlossen.' });
            }

            // NFC-Tag der Location abrufen
            const location = await fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${job.location_id}`, null, req.headers);
            if (!location || location.nfc_tag_id !== location_barcode) {
                return res.status(400).json({ message: 'Falscher Location Barcode. Job kann nicht gestartet werden.' });
            }

            job.status = 'IN_PROGRESS';
            job.actual_start_time = new Date();
            job.check_in_latitude = check_in_latitude;
            job.check_in_longitude = check_in_longitude;
            await job.save();

            // Rückgabe des aktualisierten Jobs mit umbenannten Feldern
            const updatedJobJson = job.toJSON();
            res.status(200).json({ 
                message: 'Job erfolgreich gestartet!', 
                job: {
                    ...updatedJobJson,
                    start_time: updatedJobJson.planned_start_time,
                    end_time: updatedJobJson.planned_end_time,
                }
            });

        } catch (error) {
            console.error(`Fehler beim Starten des Jobs ${jobId} für Mitarbeiter ${employee_id}:`, error);
            res.status(500).json({ message: 'Interner Serverfehler beim Starten des Jobs.' });
        }
    }, ['Monteur', 'Reinigungskraft']); // Nur Monteure und Reinigungskräfte dürfen Jobs starten
};

// NEU: Beendet einen Job und aktualisiert dessen Status auf 'COMPLETED'.
exports.endJob = async (req, res) => {
    authorize(req, res, async () => {
        const { jobId } = req.params;
        const { employee_id, location_barcode, check_out_latitude, check_out_longitude } = req.body;
        const userId = req.headers['x-user-id']; // Aus dem Authentifizierungstoken

        // Stellen Sie sicher, dass der angefragte employee_id mit dem authentifizierten Benutzer übereinstimmt.
        if (parseInt(employee_id) !== parseInt(userId)) {
            return res.status(403).json({ message: 'Sie sind nicht berechtigt, diesen Job zu beenden.' });
        }

        // Grundlegende Validierung der Eingangsdaten
        if (!jobId || !employee_id || !location_barcode || !check_out_latitude || !check_out_longitude) {
            return res.status(400).json({ message: 'Fehlende Job-End-Daten.' });
        }

        try {
            const job = await Job.findByPk(jobId);

            if (!job) {
                return res.status(404).json({ message: 'Job nicht gefunden.' });
            }

            // Überprüfen, ob der Job dem Mitarbeiter zugewiesen ist und den Status 'IN_PROGRESS' hat.
            if (job.assigned_user_id !== parseInt(employee_id) || job.status !== 'IN_PROGRESS') {
                return res.status(400).json({ message: 'Job kann nicht beendet werden: Nicht zugewiesen oder nicht im Status "IN_PROGRESS".' });
            }

            // NFC-Tag der Location abrufen
            const location = await fetchServiceData(`${LOCATION_SERVICE_URL}/api/locations/${job.location_id}`, null, req.headers);
            if (!location || location.nfc_tag_id !== location_barcode) {
                return res.status(400).json({ message: 'Falscher Location Barcode. Job kann nicht beendet werden.' });
            }

            job.status = 'COMPLETED';
            job.actual_end_time = new Date();
            job.check_out_latitude = check_out_latitude;
            job.check_out_longitude = check_out_longitude;
            await job.save();

            // Rückgabe des aktualisierten Jobs mit umbenannten Feldern
            const updatedJobJson = job.toJSON();
            res.status(200).json({ 
                message: 'Job erfolgreich beendet!', 
                job: {
                    ...updatedJobJson,
                    start_time: updatedJobJson.planned_start_time,
                    end_time: updatedJobJson.planned_end_time,
                }
            });

        } catch (error) {
            console.error(`Fehler beim Beenden des Jobs ${jobId} für Mitarbeiter ${employee_id}:`, error);
            res.status(500).json({ message: 'Interner Serverfehler beim Beenden des Jobs.' });
        }
    }, ['Monteur', 'Reinigungskraft']); // Nur Monteure und Reinigungskräfte dürfen Jobs beenden
};