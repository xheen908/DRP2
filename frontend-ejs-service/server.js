require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3007;

// NEUER GLOBALER LOG FÜR ALLE ANFRAGEN (DEBUGGING ZWECKE)
// Diese Middleware wird als ERSTES ausgeführt, um zu sehen, ob JEDE Anfrage die App erreicht.
app.use((req, res, next) => {
    console.log(`[Frontend EJS Service - SEHR FRÜHER GLOBALER LOG] Empfangene Anfrage: ${req.method} ${req.path}`);
    next();
});

const API_GATEWAY_URL = process.env.API_GATEWAY_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// NEUER LOG: Eingehende Anfragen an /public loggen
// Diese Middleware wird VOR express.static ausgeführt
app.use((req, res, next) => {
    if (req.path.startsWith('/public')) {
        console.log(`[Frontend EJS Service] --- START Request for static file: ${req.method} ${req.path}`);   
    }
    next();
});

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'views/admin')]);

const publicPath = path.join(__dirname, 'public');
// LOGGEN DES ABSOLUTEN PFADES von publicPath, wie er im Container aufgelöst wird
console.log(`Frontend EJS Service: Konfigurierter publicPath (relativ): ${publicPath}`);
console.log(`Frontend EJS Service: Konfigurierter publicPath (absolut im Container): ${path.resolve(publicPath)}`);

// Zusätzliche Middleware VOR express.static, um zu prüfen, ob der Middleware-Stack korrekt erreicht wird     
app.use('/public', (req, res, next) => {
    console.log(`[Frontend EJS Service] Middleware vor express.static für /public erreicht für Pfad: ${req.path}`);
    next(); // Wichtig: next() aufrufen, damit express.static tatsächlich ausgeführt wird
});

app.use('/public', express.static(publicPath, {
    maxAge: '1d',
    setHeaders: (res, path, stat) => {
        console.log(`[Frontend EJS Service] Statische Datei bedient durch express.static: ${path} mit MIME-Typ ${res.getHeader('Content-Type')}`);
    }
}));


// NEUER LOG: Wenn eine Anfrage an /public NICHT von express.static bedient wurde
// Diese Middleware wird NACH express.static ausgeführt, falls express.static die Anfrage nicht beendet hat   
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
    // DEBUGGING: Logge alle empfangenen Header
    console.log('Frontend EJS Service: Empfangene Request Header:', req.headers);

    const userId = req.headers['x-user-id'];
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    const userUsername = req.headers['x-user-username'];
    // DEBUGGING: Logge den Wert von userUsername
    console.log('Frontend EJS Service: Wert von x-user-username:', userUsername);

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

app.get('/admin/user-shifts/:userId', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user || !user.roles.includes('Manager')) {
        return res.status(403).render('error', { message: 'Keine Berechtigung für diese Seite.' });
    }
    res.render('user_shifts_view', {
        user: user,
        userName: `Benutzer ${req.params.userId}`, // Platzhalter
        shifts: [], // Platzhalter
        googleMapsApiKey: GOOGLE_MAPS_API_KEY // API Key weitergeben
    });
});

app.get('/error', (req, res) => {
    const message = req.query.message || 'Ein unbekannter Fehler ist aufgetreten.';
    res.status(500).render('error', { message: message });
});

// NEUER LOG: Bevor die 404-Fehlerbehandlung ausgelöst wird
app.use((req, res, next) => {
    // Wenn die Anfrage /public betrifft und noch keine Header gesendet wurden,
    // wissen wir, dass express.static sie nicht behandelt hat und sie jetzt im 404-Handler landet.
    if (req.path.startsWith('/public') && !res.headersSent) {
        console.error(`[Frontend EJS Service] KRITISCHER FEHLER: Statische Datei ${req.path} wurde NICHT gefunden und wird jetzt vom 404-Handler abgefangen. Das ist die Ursache des MIME-Typ-Problems.`);
    }
    next(); // Weiterleiten an den tatsächlichen 404-Handler
});

app.use((req, res) => {
    console.error(`[Frontend EJS Service] 404 Not Found für Pfad: ${req.path}`); // ZUSÄTZLICHEN LOG HIER
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