require('dotenv').config();
const express = require('express');
const vpnRoutes = require('./routes/vpnRoutes');
const sequelize = require('./config/sequelize');
const initNetwork = require('./config/initNetwork');
const migrateUsers = require('./config/migrateUsers');

const app = express();
app.use(express.json());

// Routes
app.use('/api/vpn', vpnRoutes);

const PORT = process.env.PORT || 3800;

sequelize.sync({ alter: true })
    .then(async () => {
        await initNetwork();
        await migrateUsers();
        app.listen(PORT, () => {
            console.log(`VPN Service running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('VPN Service DB Error:', err.message);
    });
