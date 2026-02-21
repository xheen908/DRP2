// DRP2/shift-service/models/shiftModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Shift = sequelize.define('Shift', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('Geplant', 'Bestätigt', 'Abgeschlossen', 'Abgebrochen'),
        defaultValue: 'Geplant',
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    break_duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    night_hours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
    },
    sunday_hours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
    },
    holiday_hours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
    },
    total_work_hours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'createdAt'
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt'
    },
}, {
    tableName: 'shifts',
    timestamps: true,
});

module.exports = Shift;
