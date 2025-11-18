const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize').sequelize;
const moment = require('moment'); // Für Datum/Uhrzeit-Handling

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    job_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false
        // KEIN REFERENCES HIER, da der Client Service seine eigene DB hat
    },
    location_id: {
        type: DataTypes.INTEGER,
        allowNull: false
        // KEIN REFERENCES HIER, da der Location Service seine eigene DB hat
    },
    assigned_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
        // KEIN REFERENCES HIER, da der Auth Service seine eigene DB hat
    },
    status: {
        // Hinzugefügt: 'Offen' und 'Abgeschlossen' für Kompatibilität mit bestehenden Daten
        type: DataTypes.ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED', 'ON_HOLD', 'Offen', 'Abgeschlossen'),
        allowNull: false,
        defaultValue: 'PENDING'
    },
    planned_start_time: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('planned_start_time');
            return rawValue ? moment(rawValue).format('YYYY-MM-DD HH:mm:ss') : null;
        }
    },
    planned_end_time: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('planned_end_time');
            return rawValue ? moment(rawValue).format('YYYY-MM-DD HH:mm:ss') : null;
        }
    },
    actual_start_time: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('actual_start_time');
            return rawValue ? moment(rawValue).format('YYYY-MM-DD HH:mm:ss') : null;
        }
    },
    actual_end_time: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('actual_end_time');
            return rawValue ? moment(rawValue).format('YYYY-MM-DD HH:mm:ss') : null;
        }
    }
}, {
    tableName: 'jobs',
    timestamps: true
});

module.exports = Job;