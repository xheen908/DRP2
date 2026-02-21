const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const VpnNetwork = sequelize.define('VpnNetwork', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    cidr: { type: DataTypes.STRING, allowNull: false, defaultValue: '10.8.0.0/24' },
    port: { type: DataTypes.INTEGER, allowNull: false, unique: true, defaultValue: 51820 },
    privateKey: { type: DataTypes.TEXT, allowNull: false, field: 'private_key' },
    publicKey: { type: DataTypes.TEXT, allowNull: false, field: 'public_key' },
    endpoint: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'vpn_networks',
    timestamps: true,
    underscored: true
});

const VpnClient = sequelize.define('VpnClient', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    networkId: { type: DataTypes.INTEGER, allowNull: false, field: 'network_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    deviceName: { type: DataTypes.STRING, allowNull: false, field: 'device_name' },
    clientIp: { type: DataTypes.STRING, allowNull: false, field: 'client_ip' },
    privateKey: { type: DataTypes.TEXT, allowNull: false, field: 'private_key' },
    publicKey: { type: DataTypes.TEXT, allowNull: false, field: 'public_key' },
    presharedKey: { type: DataTypes.STRING, allowNull: true, field: 'preshared_key' },
    isActive: { type: DataTypes.TINYINT(1), defaultValue: 1, field: 'is_active' },
    lastHandshake: { type: DataTypes.DATE, allowNull: true, field: 'last_handshake' }
}, {
    tableName: 'vpn_clients',
    timestamps: true,
    underscored: true
});

VpnNetwork.hasMany(VpnClient, { foreignKey: 'networkId', as: 'clients' });
VpnClient.belongsTo(VpnNetwork, { foreignKey: 'networkId', as: 'network' });

module.exports = { VpnNetwork, VpnClient };
