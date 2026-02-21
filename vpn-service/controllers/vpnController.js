const { VpnNetwork, VpnClient } = require('../models/vpnModel');
const { generateKeys, getNextAvailableIp } = require('../utils/vpnUtils');

exports.createNetwork = async (req, res) => {
    try {
        const { name, cidr, endpoint, port } = req.body;
        const { privateKey, publicKey } = generateKeys();
        
        const network = await VpnNetwork.create({
            name, cidr, endpoint, port, privateKey, publicKey
        });
        res.status(201).json(network);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addClient = async (req, res) => {
    try {
        let { networkId, userId, deviceName } = req.body;
        
        if (!networkId) {
            const defaultNet = await VpnNetwork.findOne({ order: [['id', 'ASC']] });
            if (!defaultNet) return res.status(404).json({ message: 'No VPN network available' });
            networkId = defaultNet.id;
        }

        const network = await VpnNetwork.findByPk(networkId);
        if (!network) return res.status(404).json({ message: 'Network not found' });

        // Check if user already has a client for this device/network
        const existing = await VpnClient.findOne({ where: { networkId, userId, deviceName } });
        if (existing) return res.status(200).json(existing);

        const usedIps = (await VpnClient.findAll({ where: { networkId } })).map(c => c.clientIp);
        const clientIp = getNextAvailableIp(network.cidr, usedIps);
        const { privateKey, publicKey, presharedKey } = generateKeys();

        const client = await VpnClient.create({
            networkId, userId, deviceName, clientIp, privateKey, publicKey, presharedKey
        });

        res.status(201).json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getClientConfig = async (req, res) => {
    try {
        const client = await VpnClient.findOne({ 
            where: { id: req.params.id }, 
            include: ['network'] 
        });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        
        // ... (config generation)
    } catch (e) {}
};

exports.getClientConfigByUserId = async (req, res) => {
    try {
        const client = await VpnClient.findOne({ 
            where: { userId: req.params.userId }, 
            include: ['network'],
            order: [['createdAt', 'DESC']]
        });
        if (!client) return res.status(404).json({ message: 'No VPN profile found for this user.' });

        const config = `
[Interface]
PrivateKey = ${client.privateKey}
Address = ${client.clientIp}/${client.network.cidr.split('/')[1]}
DNS = 1.1.1.1

[Peer]
PublicKey = ${client.network.publicKey}
PresharedKey = ${client.presharedKey}
Endpoint = ${client.network.endpoint}:${client.network.port}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
        `.trim();

        res.set('Content-Type', 'text/plain');
        res.send(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllNetworks = async (req, res) => {
    try {
        const networks = await VpnNetwork.findAll({ include: ['clients'] });
        res.status(200).json(networks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
