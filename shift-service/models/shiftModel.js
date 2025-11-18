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
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'),
        defaultValue: 'PLANNED',
        allowNull: false,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'shifts',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Shift;