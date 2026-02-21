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

// --- AUTH MIDDLEWARE ---

const gatewayAuth = (req, res, next) => {
    const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1];
    
    const publicPaths = ['/', '/login', '/api/auth/login', '/api/auth/register'];
    const publicPrefixes = ['/public', '/uploads'];
    const isPublic = publicPaths.includes(req.path) || publicPrefixes.some(p => req.path.startsWith(p));

    if (!token) {
        if (isPublic) return next();
        if (req.path.startsWith('/api')) return res.status(401).json({ message: 'Auth required' });
        return res.redirect('/login');
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        console.error(`[Gateway Auth] Invalid Token: ${err.message}`);
        res.clearCookie('jwt');
        if (isPublic) return next();
        if (req.path.startsWith('/api')) return res.status(401).json({ message: 'Session expired' });
        return res.redirect('/login?message=Expired');
    }
};

const proxyOptions = {
    proxyReqOptDecorator: (proxyReqOpts, originalReq) => {
        if (originalReq.user) {
            proxyReqOpts.headers['x-user-id'] = String(originalReq.user.id);
            proxyReqOpts.headers['x-user-roles'] = Array.isArray(originalReq.user.roles) ? originalReq.user.roles.join(',') : originalReq.user.roles;
            proxyReqOpts.headers['x-user-username'] = originalReq.user.username || '';
        }
        if (originalReq.cookies.jwt) {
            proxyReqOpts.headers['authorization'] = `Bearer ${originalReq.cookies.jwt}`;
        }
        return proxyReqOpts;
    }
};

// --- PROXY ROUTES ---

// Public Auth API
app.use('/api/auth', httpProxy(AUTH_SERVICE_URL, { proxyReqPathResolver: req => req.url }));

// User & Role Management
app.use('/api/users/roles', gatewayAuth, httpProxy(AUTH_SERVICE_URL, { 
    ...proxyOptions,
    proxyReqPathResolver: req => `/roles${req.url}`
}));

app.use('/api/users', gatewayAuth, httpProxy(AUTH_SERVICE_URL, { 
    ...proxyOptions,
    proxyReqPathResolver: req => `/users${req.url}`
}));

// VPN Service
app.use('/api/vpn', gatewayAuth, httpProxy(VPN_SERVICE_URL, {
    ...proxyOptions,
    proxyReqPathResolver: req => req.originalUrl
}));

// Core Services
app.use('/api/jobs', gatewayAuth, httpProxy(JOB_SERVICE_URL, { ...proxyOptions, proxyReqPathResolver: req => req.url }));
app.use('/api/shifts', gatewayAuth, httpProxy(SHIFT_SERVICE_URL, { ...proxyOptions, proxyReqPathResolver: req => `/api/shifts${req.url}` }));
app.use('/api/locations', gatewayAuth, httpProxy(LOCATION_SERVICE_URL, { ...proxyOptions, proxyReqPathResolver: req => `/api/locations${req.url}` }));
app.use('/api/clients', gatewayAuth, httpProxy(CLIENT_SERVICE_URL, { ...proxyOptions, proxyReqPathResolver: req => req.url }));
app.use('/api/hr', gatewayAuth, httpProxy(HR_SERVICE_URL, { ...proxyOptions, proxyReqPathResolver: req => req.url }));
app.use('/api/payroll', gatewayAuth, httpProxy(PAYROLL_SERVICE_URL, { ...proxyOptions, proxyReqPathResolver: req => req.url }));

// File Storage
app.use('/api/files', gatewayAuth, httpProxy(FILE_STORAGE_SERVICE_URL, {
    ...proxyOptions,
    proxyReqPathResolver: req => req.originalUrl.replace('/api/files', ''),
    parseReqBody: false
}));

// Frontend static & views
app.use('/public', httpProxy(FRONTEND_EJS_SERVICE_URL, { proxyReqPathResolver: req => req.url }));
app.use('/uploads', httpProxy(FRONTEND_EJS_SERVICE_URL, { proxyReqPathResolver: req => req.url }));

app.use('/', gatewayAuth, httpProxy(FRONTEND_EJS_SERVICE_URL, {
    ...proxyOptions,
    proxyReqPathResolver: req => req.url,
    proxyReqOptDecorator: (opts, req) => {
        const decorated = proxyOptions.proxyReqOptDecorator(opts, req);
        decorated.headers['x-google-maps-api-key'] = GOOGLE_MAPS_API_KEY || '';
        return decorated;
    }
}));

app.listen(port, () => { console.log(`API Gateway live on port ${port}`); });
