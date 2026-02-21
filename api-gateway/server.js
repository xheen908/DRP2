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

const authenticateGateway = (req, res, next) => {
    const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1];
    const publicPaths = ['/', '/login', '/api/auth/login', '/api/auth/register', '/api/auth/logout'];
    const publicPrefixes = ['/public', '/uploads'];

    if (publicPaths.includes(req.path) || publicPrefixes.some(p => req.path.startsWith(p))) {
        return next();
    }

    if (!token) {
        if (req.path.startsWith('/api')) return res.status(401).json({ message: 'Auth required' });
        return res.redirect('/login');
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.clearCookie('jwt');
        if (req.path.startsWith('/api')) return res.status(401).json({ message: 'Session expired' });
        return res.redirect('/login?message=Expired');
    }
};

const setUserHeaders = (proxyReqOpts, originalReq) => {
    if (originalReq.user) {
        proxyReqOpts.headers['X-User-ID'] = String(originalReq.user.id);
        proxyReqOpts.headers['X-User-Roles'] = Array.isArray(originalReq.user.roles) ? originalReq.user.roles.join(',') : originalReq.user.roles;
        proxyReqOpts.headers['X-User-Username'] = originalReq.user.username || '';
    }
    if (originalReq.cookies.jwt) {
        proxyReqOpts.headers['Authorization'] = `Bearer ${originalReq.cookies.jwt}`;
    }
    return proxyReqOpts;
};

// --- PROXIES ---

app.use('/api/auth', httpProxy(AUTH_SERVICE_URL, { proxyReqPathResolver: req => req.url }));

app.use('/api/users/roles', authenticateGateway, httpProxy(AUTH_SERVICE_URL, { 
    proxyReqPathResolver: req => `/roles${req.url}`,
    proxyReqOptDecorator: setUserHeaders
}));

app.use('/api/users', authenticateGateway, httpProxy(AUTH_SERVICE_URL, { 
    proxyReqPathResolver: req => `/users${req.url}`,
    proxyReqOptDecorator: setUserHeaders
}));

app.use('/api/vpn', authenticateGateway, httpProxy(VPN_SERVICE_URL, {
    proxyReqPathResolver: req => req.originalUrl,
    proxyReqOptDecorator: setUserHeaders
}));

app.use('/api/jobs', authenticateGateway, httpProxy(JOB_SERVICE_URL, { 
    proxyReqPathResolver: req => req.url, 
    proxyReqOptDecorator: setUserHeaders 
}));

app.use('/api/shifts', authenticateGateway, httpProxy(SHIFT_SERVICE_URL, { 
    proxyReqPathResolver: req => `/api/shifts${req.url}`, 
    proxyReqOptDecorator: setUserHeaders 
}));

app.use('/api/locations', authenticateGateway, httpProxy(LOCATION_SERVICE_URL, { 
    proxyReqPathResolver: req => `/api/locations${req.url}`, 
    proxyReqOptDecorator: setUserHeaders 
}));

app.use('/api/clients', authenticateGateway, httpProxy(CLIENT_SERVICE_URL, { 
    proxyReqPathResolver: req => req.url, 
    proxyReqOptDecorator: setUserHeaders 
}));

app.use('/api/hr', authenticateGateway, httpProxy(HR_SERVICE_URL, { 
    proxyReqPathResolver: req => req.url, 
    proxyReqOptDecorator: setUserHeaders 
}));

app.use('/api/payroll', authenticateGateway, httpProxy(PAYROLL_SERVICE_URL, { 
    proxyReqPathResolver: req => req.url, 
    proxyReqOptDecorator: setUserHeaders 
}));

app.get('/api/files/download/:filename(*)', (req, res, next) => { next(); }, httpProxy(FILE_STORAGE_SERVICE_URL, {
    proxyReqPathResolver: req => req.originalUrl.replace('/api/files', ''),
    proxyReqOptDecorator: setUserHeaders
}));

app.use('/api/files', authenticateGateway, httpProxy(FILE_STORAGE_SERVICE_URL, {
    proxyReqPathResolver: req => req.originalUrl.replace('/api/files', ''),
    proxyReqOptDecorator: setUserHeaders,
    parseReqBody: false
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

app.listen(port, () => { console.log(`API Gateway running on port ${port}`); });
