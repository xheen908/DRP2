require('dotenv').config();
const express = require('express');
const httpProxy = require('express-http-proxy');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL;
const SHIFT_SERVICE_URL = process.env.SHIFT_SERVICE_URL;
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL;
const CLIENT_SERVICE_URL = process.env.CLIENT_SERVICE_URL;
const FRONTEND_EJS_SERVICE_URL = process.env.FRONTEND_EJS_SERVICE_URL;
const HR_SERVICE_URL = process.env.HR_SERVICE_URL; // <-- NEU: URL für HR Service
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!JWT_SECRET) {
    console.error('FEHLER: JWT_SECRET ist im API Gateway nicht gesetzt!');
    process.exit(1);
}
if (!FRONTEND_EJS_SERVICE_URL) {
    console.warn('WARNUNG: FRONTEND_EJS_SERVICE_URL ist im API Gateway nicht gesetzt. Frontend-Proxy könnte fehlschlagen.');
}
if (!HR_SERVICE_URL) { // <-- NEU: Warnung, falls HR_SERVICE_URL nicht gesetzt ist
    console.warn('WARNUNG: HR_SERVICE_URL ist im API Gateway nicht gesetzt. HR-Proxy könnte fehlschlagen.');
}

app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://static.cloudflareinsights.com",
                "https://cdnjs.cloudflare.com",
                "https://maps.googleapis.com",
                "https://cdn.tailwindcss.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://cdn.tailwindcss.com",
                "https://fonts.googleapis.com"
            ],
            imgSrc: ["'self'", "data:", "https://maps.googleapis.com", "https://*.gstatic.com"],
            connectSrc: [
                "'self'",
                "ws:",
                "wss:",
                AUTH_SERVICE_URL,
                JOB_SERVICE_URL,
                SHIFT_SERVICE_URL,
                LOCATION_SERVICE_URL,
                CLIENT_SERVICE_URL,
                FRONTEND_EJS_SERVICE_URL,
                HR_SERVICE_URL, // <-- NEU: HR Service URL zur CSP hinzufügen
                "https://maps.googleapis.com",
                "https://*.googleapis.com",
                "https://*.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"], // <-- AKTUALISIERT: Cloudflare CDN für Fonts hinzugefügt
            frameSrc: [
                "'self'",
                "https://www.google.com/",
                "https://maps.google.com/",
                "https://googleusercontent.com/",
                "https://www.youtube.com"
            ],
        },
    },
}));

const authenticateGateway = (req, res, next) => {
    const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1];

    const publicFrontendRoutes = ['/', '/login'];
    const publicStaticRoutes = ['/public', '/uploads']; 

    const isPublicFrontendRoute = publicFrontendRoutes.includes(req.path);
    const isPublicStaticRoute = publicStaticRoutes.some(prefix => req.path.startsWith(prefix));

    if (isPublicFrontendRoute) {
        console.log(`[API Gateway Auth] Anfrage für '${req.path}' als öffentliche Frontend-Route erkannt.`);
    }
    if (isPublicStaticRoute) {
        console.log(`[API Gateway Auth] Anfrage für '${req.path}' als öffentliche statische Route erkannt.`);
    }

    if (!token) {
        if (isPublicFrontendRoute || isPublicStaticRoute) {
            req.user = null;
            return next();
        }
        console.warn(`[API Gateway Auth] KEIN TOKEN gefunden für '${req.path}'. Authentifizierung fehlgeschlagen.`);
        return res.status(401).json({ message: 'Kein Authentifizierungstoken bereitgestellt.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log('Dekodiertes JWT im Gateway (req.user):', req.user);
        next();
    } catch (error) {
        console.error('JWT Validierungsfehler im Gateway:', error.message);
        if (isPublicFrontendRoute || req.path.startsWith('/admin') || req.path === '/dashboard') {
             res.clearCookie('jwt');
             return res.redirect('/login?message=Sitzung abgelaufen oder ungültig.');
        }
        return res.status(403).json({ message: 'Ungültiges oder abgelaufenes Token.' });
    }
};

const setUserHeaders = (proxyReqOpts, originalReq) => {
    delete proxyReqOpts.headers['x-user-id'];
    delete proxyReqOpts.headers['x-user-roles'];
    delete proxyReqOpts.headers['x-user-email'];
    delete proxyReqOpts.headers['x-user-username']; 
    // WICHTIG: Auch vorhandenen Authorization-Header löschen, um Duplikate oder veraltete Tokens zu vermeiden
    delete proxyReqOpts.headers['authorization'];

    if (originalReq.user) {
        proxyReqOpts.headers['X-User-ID'] = originalReq.user.id ? String(originalReq.user.id) : '';
        proxyReqOpts.headers['X-User-Roles'] = Array.isArray(originalReq.user.roles)
                                                ? originalReq.user.roles.join(',')
                                                : originalReq.user.roles || '';
        proxyReqOpts.headers['X-User-Username'] = originalReq.user.username || ''; 
    }

    // NEU: Authorization-Header weiterleiten, falls im Original-Request oder Cookie vorhanden
    const originalAuthHeader = originalReq.headers['authorization'];
    if (originalAuthHeader) {
        proxyReqOpts.headers['Authorization'] = originalAuthHeader;
        console.log(`[API Gateway Proxy Debug] Authorization Header (${originalAuthHeader.substring(0, 30)}...) an den Microservice weitergeleitet.`);
    } else if (originalReq.cookies.jwt) {
        proxyReqOpts.headers['Authorization'] = `Bearer ${originalReq.cookies.jwt}`;
        console.log(`[API Gateway Proxy Debug] JWT-Cookie an den Microservice als Authorization Header weitergeleitet.`);
    }

    return proxyReqOpts;
};

app.use('/api/auth', httpProxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: req => req.url
}));

// PROXY-REGELN FÜR USER-ENDPUNKTE
// Wichtig: Die Reihenfolge der app.use-Statements ist entscheidend.
// Spezifischere Routen (z.B. /api/users/roles) müssen vor allgemeineren Routen (/api/users) stehen.

app.use('/api/users/roles', authenticateGateway, httpProxy(AUTH_SERVICE_URL, { 
    proxyReqPathResolver: req => {
        const resolvedPath = `/roles${req.url}`;
        console.log(`[API Gateway Proxy] /api/users/roles Proxy aktiv: Leite ${req.originalUrl} weiter als ${resolvedPath} an ${AUTH_SERVICE_URL}`);
        return resolvedPath;
    },
    proxyReqOptDecorator: setUserHeaders
}));

app.use('/api/users', authenticateGateway, httpProxy(AUTH_SERVICE_URL, { 
    proxyReqPathResolver: req => {
        const resolvedPath = `/users${req.url}`;
        console.log(`[API Gateway Proxy] /api/users Proxy aktiv: Leite ${req.originalUrl} weiter als ${resolvedPath} an ${AUTH_SERVICE_URL}`);
        return resolvedPath;
    },
    proxyReqOptDecorator: setUserHeaders
}));
// ENDE PROXY-REGELN FÜR USER

app.use('/api/jobs', authenticateGateway, httpProxy(JOB_SERVICE_URL, {
    proxyReqPathResolver: req => req.url,
    proxyReqOptDecorator: setUserHeaders
}));

// PROXY-REGELN FÜR SHIFT-ENDPUNKTE (Aktualisiert)
// Stellen Sie sicher, dass spezifischere Routen vor allgemeineren stehen.

// Proxy für Schichtstatus nach Benutzer-ID
app.get('/api/shifts/status/:userId', authenticateGateway, httpProxy(SHIFT_SERVICE_URL, {
    proxyReqPathResolver: req => `/api/shifts/status/${req.params.userId}`,
    proxyReqOptDecorator: setUserHeaders
}));

// Proxy für Check-in
app.post('/api/shifts/checkin', authenticateGateway, httpProxy(SHIFT_SERVICE_URL, {
    proxyReqPathResolver: req => `/api/shifts/checkin`, // Korrigierter Pfad
    proxyReqOptDecorator: setUserHeaders
}));

// Proxy für Check-out
app.post('/api/shifts/checkout', authenticateGateway, httpProxy(SHIFT_SERVICE_URL, {
    proxyReqPathResolver: req => `/api/shifts/checkout`, // Korrigierter Pfad
    proxyReqOptDecorator: setUserHeaders
}));

// Proxy für Schichten nach Benutzer-ID (wichtig für user_shifts_view.ejs)
app.get('/api/shifts/user/:userId', authenticateGateway, httpProxy(SHIFT_SERVICE_URL, {
    proxyReqPathResolver: req => `/api/shifts/user/${req.params.userId}`, // Korrigierter Pfad
    proxyReqOptDecorator: setUserHeaders
}));

// NEUE REGEL: Proxy für /api/locations/clients-for-dropdown an den Client Service
// Dies muss VOR der allgemeineren '/api/locations' Regel stehen
app.get('/api/locations/clients-for-dropdown', authenticateGateway, httpProxy(CLIENT_SERVICE_URL, {
    proxyReqPathResolver: req => {
        const resolvedPath = `/clients-for-dropdown`; // Der Client Service sollte diesen Pfad erwarten
        console.log(`[API Gateway Proxy] Spezifische Proxy-Regel für /api/locations/clients-for-dropdown aktiv: Leite ${req.originalUrl} weiter als ${resolvedPath} an ${CLIENT_SERVICE_URL}`);
        return resolvedPath;
    },
    proxyReqOptDecorator: setUserHeaders,
    proxyErrorHandler: (err, res, next) => {
        console.error(`[API Gateway Proxy Error] Fehler beim Weiterleiten von /api/locations/clients-for-dropdown-Anfrage an ${CLIENT_SERVICE_URL}:`, err.code, err.message);
        if (!res.headersSent) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                res.status(503).json({ message: `Client Service nicht verfügbar oder nicht erreichbar: ${err.message}` });
            } else {
                res.status(500).json({ message: `Proxy-Fehler beim Abrufen von Clients für Dropdown: ${err.message}` });
            }
        }
    }
}));

// NEUE REGEL: Proxy für /api/locations/validate-company-location an den Location Service
// Dies muss VOR der allgemeineren '/api/locations' Regel stehen
app.post('/api/locations/validate-company-location', authenticateGateway, httpProxy(LOCATION_SERVICE_URL, {
    proxyReqPathResolver: req => `/api/locations/validate-company-location`, // Der Location Service sollte diesen Pfad erwarten
    proxyReqOptDecorator: setUserHeaders,
    proxyErrorHandler: (err, res, next) => {
        console.error(`[API Gateway Proxy Error] Fehler beim Weiterleiten von /api/locations/validate-company-location-Anfrage an ${LOCATION_SERVICE_URL}:`, err.code, err.message);
        if (!res.headersSent) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                res.status(503).json({ message: `Location Service nicht verfügbar oder nicht erreichbar: ${err.message}` });
            } else {
                res.status(500).json({ message: `Proxy-Fehler beim Validieren des Standorts: ${err.message}` });
            }
        }
    }
}));


app.use('/api/locations', authenticateGateway, httpProxy(LOCATION_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
        const resolvedPath = `/api/locations${req.url}`;
        console.log(`[API Gateway Proxy] /api/locations Proxy aktiv: Leite ${req.originalUrl} weiter als ${resolvedPath} an ${LOCATION_SERVICE_URL}`);
        return resolvedPath;
    },
    proxyReqOptDecorator: setUserHeaders,
    proxyErrorHandler: (err, res, next) => {
        console.error(`[API Gateway Proxy Error] Fehler beim Weiterleiten von /api/locations-Anfrage an ${LOCATION_SERVICE_URL}${req.url}:`, err.code, err.message);
        if (!res.headersSent) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                res.status(503).json({ message: `Location Service nicht verfügbar oder nicht erreichbar: ${err.message}` });
            } else {
                res.status(500).json({ message: `Proxy-Fehler beim Abrufen von Standorten: ${err.message}` });
            }
        }
    }
}));

app.use('/api/clients', authenticateGateway, httpProxy(CLIENT_SERVICE_URL, {
    proxyReqPathResolver: req => req.url,
    proxyReqOptDecorator: setUserHeaders
}));

// NEU: PROXY-REGELN FÜR HR-ENDPUNKTE
app.use('/api/hr', authenticateGateway, httpProxy(HR_SERVICE_URL, {
    proxyReqPathResolver: req => {
        // Da der HR Service selbst Routen unter '/api/hr' definiert,
        // müssen wir den Pfad 1:1 weiterleiten (req.url enthält bereits /employees, /employees/:id etc.)
        const resolvedPath = req.url; 
        console.log(`[API Gateway Proxy] /api/hr Proxy aktiv: Leite ${req.originalUrl} weiter als ${resolvedPath} an ${HR_SERVICE_URL}`);
        return resolvedPath;
    },
    proxyReqOptDecorator: setUserHeaders,
    proxyErrorHandler: (err, res, next) => {
        console.error(`[API Gateway Proxy Error] Fehler beim Weiterleiten von /api/hr-Anfrage an ${HR_SERVICE_URL}:`, err.code, err.message);
        if (!res.headersSent) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                res.status(503).json({ message: `HR Service nicht verfügbar oder nicht erreichbar: ${err.message}` });
            } else {
                res.status(500).json({ message: `Proxy-Fehler beim Abrufen von HR-Daten: ${err.message}` });
            }
        }
    }
}));


// NEUE MIDDLEWARE FÜR BESSERES DEBUGGING VON /PUBLIC UND /UPLOADS
app.use((req, res, next) => {
    if (req.path.startsWith('/public') || req.path.startsWith('/uploads')) {
        console.log(`[API Gateway Proxy Debug] Anfrage für statische Assets: ${req.method} ${req.path}`);
    }
    next();
});

app.use('/public', httpProxy(FRONTEND_EJS_SERVICE_URL, {
    proxyReqPathResolver: req => {
        console.log(`[API Gateway Proxy] /public Proxy aktiv: Leite ${req.url} weiter an ${FRONTEND_EJS_SERVICE_URL}`);
        return req.url;
    },
    proxyErrorHandler: (err, res, next) => {
        console.error(`[API Gateway Proxy Error] Fehler beim Weiterleiten von /public-Anfrage für ${FRONTEND_EJS_SERVICE_URL}${req.url}:`, err.code, err.message);
        if (!res.headersSent) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                res.status(503).json({ message: `Service für statische Dateien nicht verfügbar oder nicht erreichbar: ${err.message}` });
            } else {
                res.status(500).json({ message: `Proxy-Fehler beim Laden statischer Dateien: ${err.message}` });
            }
        }
    }
}));
app.use('/uploads', httpProxy(FRONTEND_EJS_SERVICE_URL, {
    proxyReqPathResolver: req => {
        console.log(`[API Gateway Proxy] /uploads Proxy aktiv: Leite ${req.url} weiter an ${FRONTEND_EJS_SERVICE_URL}`);
        return req.url;
    },
    proxyErrorHandler: (err, res, next) => {
        console.error(`[API Gateway Proxy Error] Fehler beim Weiterleiten von /uploads-Anfrage für ${FRONTEND_EJS_SERVICE_URL}${req.url}:`, err.code, err.message);
        if (!res.headersSent) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                res.status(503).json({ message: `Service für Uploads nicht verfügbar oder nicht erreichbar: ${err.message}` });
            } else {
                res.status(500).json({ message: `Proxy-Fehler beim Laden von Uploads: ${err.message}` });
            }
        }
    }
}));

app.use('/', authenticateGateway, httpProxy(FRONTEND_EJS_SERVICE_URL, {
    proxyReqPathResolver: req => {
        console.log(`[API Gateway Proxy] Generischer Frontend-Proxy aktiv: Leite ${req.url} weiter an ${FRONTEND_EJS_SERVICE_URL}`);
        return req.url;
    },
    proxyReqOptDecorator: (proxyReqOpts, originalReq) => {
        // Hier rufen wir setUserHeaders auf, das jetzt den Authorization-Header korrekt propagiert
        proxyReqOpts = setUserHeaders(proxyReqOpts, originalReq);
        
        proxyReqOpts.headers['X-Google-Maps-API-Key'] = GOOGLE_MAPS_API_KEY || '';
        return proxyReqOpts;
    },
    proxyErrorHandler: (err, res, next) => {
        console.error(`[API Gateway Proxy Error] Fehler beim Weiterleiten der generischen Frontend-Anfrage (${res.statusCode}):`, err.code, err.message);
        if (!res.headersSent) {
            res.redirect('/login?message=Verbindung zum Frontend-Service fehlgeschlagen.');
        }
    }
}));

app.use((err, req, res, next) => {
    console.error('API Gateway Fehler:', err.stack);
    if (res.headersSent) {
        return next(err); 
    }
    res.status(500).send('API Gateway: Ein interner Fehler ist aufgetreten!');
});

app.listen(port, () => {
    console.log(`API Gateway läuft auf Port ${port}`);
    console.log(`Open in browser: http://localhost:${port}`);
});