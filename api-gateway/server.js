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
const HR_SERVICE_URL = process.env.HR_SERVICE_URL;
const PAYROLL_SERVICE_URL = process.env.PAYROLL_SERVICE_URL;
const FILE_STORAGE_SERVICE_URL = process.env.FILE_STORAGE_SERVICE_URL; 
const VPN_SERVICE_URL = process.env.VPN_SERVICE_URL || 'http://vpn-service:3800';
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!JWT_SECRET) {
    console.error('FEHLER: JWT_SECRET ist im API Gateway nicht gesetzt!');
    process.exit(1);
}

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://static.cloudflareinsights.com", "https://cdnjs.cloudflare.com", "https://maps.googleapis.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://maps.googleapis.com", "https://*.gstatic.com"],
            connectSrc: ["'self'", "ws:", "wss:", AUTH_SERVICE_URL, JOB_SERVICE_URL, SHIFT_SERVICE_URL, LOCATION_SERVICE_URL, CLIENT_SERVICE_URL, FRONTEND_EJS_SERVICE_URL, HR_SERVICE_URL, PAYROLL_SERVICE_URL, FILE_STORAGE_SERVICE_URL, VPN_SERVICE_URL, "https://maps.googleapis.com", "https://*.googleapis.com", "https://*.gstatic.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            frameSrc: ["'self'", "https://www.google.com/", "https://maps.google.com/", "https://googleusercontent.com/", "https://www.youtube.com"],
        },
    },
}));

const authenticateGateway = (req, res, next) => {
    const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1];
    const publicFrontendRoutes = ['/', '/login'];
    const publicStaticRoutes = ['/public', '/uploads']; 

    if (publicFrontendRoutes.includes(req.path) || publicStaticRoutes.some(prefix => req.path.startsWith(prefix))) {
        req.user = null;
        return next();
    }

    if (!token) return res.status(401).json({ message: 'Kein Authentifizierungstoken bereitgestellt.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (req.path.startsWith('/admin') || req.path === '/dashboard') {
             res.clearCookie('jwt');
             return res.redirect('/login?message=Sitzung abgelaufen.');
        }
        return res.status(403).json({ message: 'Ungültiges Token.' });
    }
};

const setUserHeaders = (proxyReqOpts, originalReq) => {
    if (originalReq.user) {
        proxyReqOpts.headers['X-User-ID'] = String(originalReq.user.id);
        proxyReqOpts.headers['X-User-Roles'] = Array.isArray(originalReq.user.roles) ? originalReq.user.roles.join(',') : originalReq.user.roles;
    }
    if (originalReq.cookies.jwt) {
        proxyReqOpts.headers['Authorization'] = `Bearer ${originalReq.cookies.jwt}`;
    }
    return proxyReqOpts;
};

// Proxies
app.use('/api/auth', httpProxy(AUTH_SERVICE_URL, { proxyReqPathResolver: req => req.url }));
app.use('/api/users', authenticateGateway, httpProxy(AUTH_SERVICE_URL, { 
    proxyReqPathResolver: req => `/users${req.url}`,
    proxyReqOptDecorator: setUserHeaders
}));
app.use('/api/jobs', authenticateGateway, httpProxy(JOB_SERVICE_URL, { proxyReqPathResolver: req => req.url, proxyReqOptDecorator: setUserHeaders }));
app.use('/api/shifts', authenticateGateway, httpProxy(SHIFT_SERVICE_URL, { proxyReqPathResolver: req => `/api/shifts${req.url}`, proxyReqOptDecorator: setUserHeaders }));
app.use('/api/locations', authenticateGateway, httpProxy(LOCATION_SERVICE_URL, { proxyReqPathResolver: req => `/api/locations${req.url}`, proxyReqOptDecorator: setUserHeaders }));
app.use('/api/clients', authenticateGateway, httpProxy(CLIENT_SERVICE_URL, { proxyReqPathResolver: req => req.url, proxyReqOptDecorator: setUserHeaders }));
app.use('/api/hr', authenticateGateway, httpProxy(HR_SERVICE_URL, { proxyReqPathResolver: req => req.url, proxyReqOptDecorator: setUserHeaders }));
app.use('/api/payroll', authenticateGateway, httpProxy(PAYROLL_SERVICE_URL, { proxyReqPathResolver: req => req.url, proxyReqOptDecorator: setUserHeaders }));

app.get('/api/files/download/:filename(*)', (req, res, next) => { next(); }, httpProxy(FILE_STORAGE_SERVICE_URL, {
    proxyReqPathResolver: req => req.originalUrl.replace('/api/files', ''),
    proxyReqOptDecorator: setUserHeaders
}));

app.use('/api/files', authenticateGateway, httpProxy(FILE_STORAGE_SERVICE_URL, {
    proxyReqPathResolver: req => req.originalUrl.replace('/api/files', ''),
    proxyReqOptDecorator: setUserHeaders,
    parseReqBody: false
}));

app.use('/api/vpn', authenticateGateway, httpProxy(VPN_SERVICE_URL, {
    proxyReqPathResolver: req => req.originalUrl.replace('/api/vpn', '/api/vpn'),
    proxyReqOptDecorator: setUserHeaders
}));

app.use('/public', httpProxy(FRONTEND_EJS_SERVICE_URL, { proxyReqPathResolver: req => req.url }));
app.use('/uploads', httpProxy(FRONTEND_EJS_SERVICE_URL, { proxyReqPathResolver: req => req.url }));
app.use('/', authenticateGateway, httpProxy(FRONTEND_EJS_SERVICE_URL, {
    proxyReqPathResolver: req => req.url,
    proxyReqOptDecorator: (proxyReqOpts, originalReq) => {
        proxyReqOpts = setUserHeaders(proxyReqOpts, originalReq);
        proxyReqOpts.headers['X-Google-Maps-API-Key'] = GOOGLE_MAPS_API_KEY || '';
        return proxyReqOpts;
    }
}));

app.listen(port, () => { console.log(`API Gateway läuft auf Port ${port}`); });
