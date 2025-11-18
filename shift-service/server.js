const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const shiftRoutes = require('./routes/shiftRoutes');
const sequelize = require('./config/sequelize');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routen
app.use('/api/shifts', shiftRoutes);

// Health Check Endpoint
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({ message: 'Shift Service is healthy', database: 'connected' });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ message: 'Shift Service is unhealthy', database: 'disconnected', error: error.message });
    }
});

// Sequelize synchronisieren und Server starten
sequelize.sync({ alter: false })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Shift Service läuft auf Port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Datenbankverbindung fehlgeschlagen:', err);
    });

module.exports = app;