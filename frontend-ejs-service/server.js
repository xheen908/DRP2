require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');
const path = require('path');
const moment = require('moment-timezone'); // Moment.js hier importieren

const app = express();
const port = process.env.PORT || 3007;

// NEUER GLOBALER LOG FÜR ALLE ANFRAGEN (DEBUGGING ZWECKE)
app.use((req, res, next) => {
    console.log(`[Frontend EJS Service - SEHR FRÜHER GLOBALER LOG] Empfangene Anfrage: ${req.method} ${req.path}`);
    next();
});

// Dynamischer Import von node-fetch für moderne Versionen
// Diese Funktion wird in den Routen verwendet, die `fetch` benötigen.
const importFresh = new Function('modulePath', 'return import(modulePath)');


const API_GATEWAY_URL = process.env.API_GATEWAY_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Überprüfen, ob API_GATEWAY_URL gesetzt ist
if (!API_GATEWAY_URL) {
    console.error('FEHLER: API_GATEWAY_URL ist im Frontend EJS Service nicht gesetzt!');
    // Eine robustere Anwendung würde hier beenden oder eine Fehlermeldung auf der UI anzeigen
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// NEUER LOG: Eingehende Anfragen an /public loggen
app.use((req, res, next) => {
    if (req.path.startsWith('/public')) {
        console.log(`[Frontend EJS Service] --- START Request for static file: ${req.method} ${req.path}`);   
    }
    next();
});

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'views/admin')]);

const publicPath = path.join(__dirname, 'public');
console.log(`Frontend EJS Service: Konfigurierter publicPath (relativ): ${publicPath}`);
console.log(`Frontend EJS Service: Konfigurierter publicPath (absolut im Container): ${path.resolve(publicPath)}`);

// Zusätzliche Middleware VOR express.static
app.use('/public', (req, res, next) => {
    console.log(`[Frontend EJS Service] Middleware vor express.static für /public erreicht für Pfad: ${req.path}`);
    next();
});

app.use('/public', express.static(publicPath, {
    maxAge: '1d',
    setHeaders: (res, path, stat) => {
        console.log(`[Frontend EJS Service] Statische Datei bedient durch express.static: ${path} mit MIME-Typ ${res.getHeader('Content-Type')}`);
    }
}));


// NEUER LOG: Wenn eine Anfrage an /public NICHT von express.static bedient wurde
app.use((req, res, next) => {
    if (req.path.startsWith('/public') && !res.headersSent) {
        console.warn(`[Frontend EJS Service] ACHTUNG: Anfrage für ${req.path} (public asset) wurde NICHT von express.static bedient. Fällt durch zu nachfolgenden Routen/Middleware.`);
    }
    next();
});

const uploadsPath = path.join(__dirname, 'uploads');
console.log(`Frontend EJS Service: Serving uploads from: ${uploadsPath}`);

app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1d'
}));

const getUserFromHeaders = (req) => {
    // console.log('Frontend EJS Service: Empfangene Request Header:', req.headers);
    const userId = req.headers['x-user-id'];
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    const userUsername = req.headers['x-user-username'];
    // console.log('Frontend EJS Service: Wert von x-user-username:', userUsername);

    if (userId) {
        return {
            id: userId,
            username: userUsername || `User-${userId.substring(0, 8)}`,
            email: undefined,
            roles: userRoles
        };
    }
    return null;
};

app.get('/', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user) {
        return res.redirect('/login');
    }
    return res.redirect('/dashboard');
});

app.get('/login', (req, res) => {
    const message = req.query.message || 'Bitte melden Sie sich an.';
    res.render('login', { message: message });
});

app.get('/dashboard', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user) {
        return res.status(403).render('error', { message: 'Zugriff verweigert. Bitte melden Sie sich an.' }); 
    }
    res.render('dashboard', {
        user: user,
        message: `Willkommen im DRP Dashboard, ${user.username}!`
    });
});

app.get('/admin/users', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user || !user.roles.includes('Manager')) {
        return res.status(403).render('error', { message: 'Keine Berechtigung für diese Seite.' });
    }
    res.render('user_management', { user: user });
});

app.get('/admin/jobs', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user || (!user.roles.includes('Manager') && !user.roles.includes('Disponent'))) {
        return res.status(403).render('error', { message: 'Keine Berechtigung für diese Seite.' });
    }
    res.render('job_management', { user: user });
});

app.get('/admin/clients', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user || (!user.roles.includes('Manager') && !user.roles.includes('Admin') && !user.roles.includes('Disponent'))) {
        return res.status(403).render('error', { message: 'Keine Berechtigung für diese Seite.' });
    }
    res.render('client_management', { user: user });
});

app.get('/admin/locations', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user || (!user.roles.includes('Manager') && !user.roles.includes('Admin') && !user.roles.includes('Disponent'))) {
        return res.status(403).render('error', { message: 'Keine Berechtigung für diese Seite.' });
    }
    const googleMapsApiKey = req.headers['x-google-maps-api-key'] || GOOGLE_MAPS_API_KEY;
    res.render('location_management', {
        user: user,
        googleMapsApiKey: googleMapsApiKey
    });
});

app.get('/admin/user-shifts/:userId', async (req, res) => {
    const user = getUserFromHeaders(req);
    const targetUserId = req.params.userId;

    if (!user || !user.roles.includes('Manager')) {
        return res.status(403).render('error', { message: 'Keine Berechtigung für diese Seite.' });
    }

    if (!API_GATEWAY_URL) {
        console.error('API_GATEWAY_URL ist nicht gesetzt. Kann Schichten nicht abrufen.');
        return res.status(500).render('error', { message: 'Interner Konfigurationsfehler: API Gateway URL fehlt.' });
    }

    try {
        const { default: fetch } = await importFresh('node-fetch'); // HIER WIRD node-fetch korrekt importiert

        // --- Schritt 1: Benutzerinformationen des Zielbenutzers abrufen ---
        const userDetailsResponse = await fetch(`${API_GATEWAY_URL}/api/users/${targetUserId}`, {
            headers: {
                'Authorization': req.headers['authorization'],
                'X-User-ID': user.id,
                'X-User-Roles': user.roles.join(','),
                'Content-Type': 'application/json'
            }
        });

        if (!userDetailsResponse.ok) {
            const errorData = await userDetailsResponse.json();
            console.error('Fehler beim Abrufen der Benutzerdetails:', errorData);
            return res.status(userDetailsResponse.status).render('error', { 
                message: `Fehler beim Laden der Benutzerdetails: ${errorData.message || 'Unbekannter Fehler'}` 
            });
        }
        const userDetails = await userDetailsResponse.json();
        const userName = userDetails.full_name || userDetails.username || `Benutzer ${targetUserId}`;

        // --- Schritt 2: Schichtdaten des Zielbenutzers abrufen ---
        const shiftsResponse = await fetch(`${API_GATEWAY_URL}/api/shifts/user/${targetUserId}`, {
            headers: {
                'Authorization': req.headers['authorization'],
                'X-User-ID': user.id,
                'X-User-Roles': user.roles.join(','),
                'Content-Type': 'application/json'
            }
        });

        if (!shiftsResponse.ok) {
            const errorData = await shiftsResponse.json();
            console.error('Fehler beim Abrufen der Schichten vom Shift-Service:', errorData);
            return res.status(shiftsResponse.status).render('error', { 
                message: `Fehler beim Laden der Schichten: ${errorData.message || 'Unbekannter Fehler'}` 
            });
        }

        const shifts = await shiftsResponse.json();
        console.log(`[Frontend EJS Service] Schichten für Benutzer ${targetUserId} erfolgreich abgerufen:`, shifts);
        console.log('[Frontend EJS Service] Übergabe an EJS:', { user: user, userName: userName, shiftsCount: shifts ? shifts.length : 0, googleMapsApiKey: req.headers['x-google-maps-api-key'] || GOOGLE_MAPS_API_KEY }); // NEUE LOG-ZEILE

        res.render('user_shifts_view', {
            user: user,
            userName: userName,
            shifts: shifts,
            googleMapsApiKey: req.headers['x-google-maps-api-key'] || GOOGLE_MAPS_API_KEY,
            moment: moment // Moment.js an das EJS-Template übergeben
        });

    } catch (error) {
        console.error('Fehler beim Laden der Schichtübersicht-Seite:', error);
        res.status(500).render('error', { message: 'Interner Serverfehler beim Laden der Schichtübersicht.' });
    }
});

app.get('/error', (req, res) => {
    const message = req.query.message || 'Ein unbekannter Fehler ist aufgetreten.';
    res.status(500).render('error', { message: message });
});

// NEUER LOG: Bevor die 404-Fehlerbehandlung ausgelöst wird
app.use((req, res, next) => {
    if (req.path.startsWith('/public') && !res.headersSent) {
        console.error(`[Frontend EJS Service] KRITISCHER FEHLER: Statische Datei ${req.path} wurde NICHT gefunden und wird jetzt vom 404-Handler abgefangen. Das ist die Ursache des MIME-Typ-Problems.`);
    }
    next();
});

app.use((req, res) => {
    console.error(`[Frontend EJS Service] 404 Not Found für Pfad: ${req.path}`);
    res.status(404).render('error', { message: 'Seite nicht gefunden.' });
});

app.use((err, req, res, next) => {
    console.error('Frontend EJS Service Fehler:', err.stack);
    res.status(500).render('error', { message: 'Frontend Service: Ein interner Fehler ist aufgetreten!' });   
});

app.listen(port, () => {
    console.log(`Frontend EJS Service läuft auf Port ${port}`);
    console.log(`Frontend EJS Service ist intern erreichbar auf http://frontend-ejs-service:${port}`);        
});