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
        type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
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
            return rawValue ? moment(rawValue).toISOString() : null;
        }
    },
    actual_end_time: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('actual_end_time');
            return rawValue ? moment(rawValue).toISOString() : null;
        }
    },
    before_photo_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    after_photo_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    check_in_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    check_in_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    check_out_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    check_out_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
    }
}, {
    tableName: 'jobs',
    timestamps: true
});

module.exports = Job;
