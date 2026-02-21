require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./config/sequelize'); 
const HrModel = require('./models/hrModel'); // <-- AKTUALISIERT: hrModel importiert

const app = express();
const port = process.env.PORT || 3003; 

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routen
const hrRoutes = require('./routes/hrRoutes');
app.use('/api/hr', hrRoutes); 

// Health Check Route
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate(); 
        res.status(200).json({ status: 'HR Service ist gesund', database: 'OK' });
    } catch (error) {
        console.error('HR Service Health Check Fehler:', error);
        res.status(500).json({ status: 'HR Service fehlerhaft', database: 'ERROR', message: error.message });
    }
});

// Fehlerbehandlung und Server-Start
app.use((err, req, res, next) => {
    console.error('HR Service Fehler:', err.stack);
    res.status(500).json({ message: 'HR Service: Ein interner Fehler ist aufgetreten!' });
});

// Startet den Server, nachdem die Sequelize-Verbindung geprüft und die Modelle synchronisiert wurden
sequelize.authenticate()
    .then(async () => {
        console.log('HR Service: Erfolgreich mit der MySQL-Datenbank verbunden (Sequelize)!');
        // Synchronisiert die Modelle mit der Datenbank
        // NUR FÜR ENTWICKLUNG! In Produktion besser Migrations-Tools verwenden
        await sequelize.sync({ alter: true }); // 'alter: true' versucht, bestehende Tabellen anzupassen
        console.log('HR Service: Datenbank synchronisiert!');

        app.listen(port, () => {
            console.log(`HR Service läuft auf Port ${port}`);
            console.log(`HR Service ist intern erreichbar auf http://hr-service:${port}`);
        });
    })
    .catch(err => {
        console.error('HR Service: Fehler beim Starten des Servers aufgrund von DB-Verbindungsfehler oder Synchronisationsfehler:', err.message);
        process.exit(1); 
    });