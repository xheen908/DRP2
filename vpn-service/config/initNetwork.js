const { VpnNetwork } = require('../models/vpnModel');
const { generateKeys } = require('../utils/vpnUtils');

const initDefaultNetwork = async () => {
    try {
        const count = await VpnNetwork.count();
        if (count === 0) {
            console.log("Initializing default DRP2 VPN network...");
            const { privateKey, publicKey } = generateKeys();
            await VpnNetwork.create({
                name: 'DRP2 Corporate VPN',
                cidr: '10.8.0.0/24',
                port: 51820,
                privateKey: privateKey,
                publicKey: publicKey,
                endpoint: 'drp2.vpn23.com' // Default from user info
            });
            console.log("Default network created successfully.");
        }
    } catch (error) {
        console.error("Failed to init default network:", error.message);
    }
};

module.exports = initDefaultNetwork;
