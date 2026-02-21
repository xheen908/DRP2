// DRP2/payroll-service/server.js
const express = require('express');
const dotenv = require('dotenv');
const defineModels = require('./models/payrollModel'); 
const sequelize = require('./config/sequelize'); 
const { DataTypes } = require('sequelize'); 
const payrollController = require('./controllers/payrollController'); 
const path = require('path'); 

dotenv.config();

const app = express();
app.use(express.json());

// Modelle initialisieren
const { PayrollRun, Payslip } = defineModels(sequelize, DataTypes); 
payrollController.init(PayrollRun, Payslip);

// Authentifizierungs-Middleware
const extractUserAndRolesFromHeaders = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRolesHeader = req.headers['x-user-roles'];
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!userId) {
        return res.sendStatus(401);
    }

    req.user = { id: userId };
    if (userRolesHeader) {
        req.user.roles = userRolesHeader.split(',').map(role => role.trim());
    } else {
        req.user.roles = [];
    }
    req.user.jwtToken = token;
    next();
};

app.use(extractUserAndRolesFromHeaders);

// Statische Dateien
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routen erst laden, wenn der Controller initialisiert ist
const payrollRoutes = require('./routes/payrollRoutes');
app.use('/api/payroll', payrollRoutes);

// Globaler Fehler-Handler
app.use((err, req, res, next) => {
    console.error(`[Payroll Service] Globaler Fehler: ${err.stack}`);
    res.status(500).send('Ein interner Serverfehler ist aufgetreten!');
});

const PORT = process.env.PORT || 3009;

sequelize.sync({ alter: false })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Payroll Service läuft auf Port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Payroll Service Error:', err.message);
        process.exit(1);
    });
