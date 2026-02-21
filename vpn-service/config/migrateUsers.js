const { VpnNetwork, VpnClient } = require('../models/vpnModel');
const { generateKeys, getNextAvailableIp } = require('../utils/vpnUtils');
const fetch = require('node-fetch');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

const migrateExistingUsers = async () => {
    try {
        console.log("[VPN Migration] Starting migration for existing users...");
        
        // 1. Get the default network
        const network = await VpnNetwork.findOne({ order: [['id', 'ASC']] });
        if (!network) {
            console.error("[VPN Migration] No VPN network found. Run initNetwork first.");
            return;
        }

        // 2. Fetch all users from Auth Service
        // Since this is internal, we use a simple fetch (assuming no strict internal auth for this task)
        const response = await fetch(`${AUTH_SERVICE_URL}/users`, {
            headers: { 
                'X-User-Roles': 'Manager',
                'X-User-ID': '1006' // Sarah Manager
            }
        });
        
        if (!response.ok) {
            console.error("[VPN Migration] Failed to fetch users from Auth Service");
            return;
        }
        
        const users = await response.json();
        console.log(`[VPN Migration] Found ${users.length} users to check.`);

        for (const user of users) {
            // Check if client already exists
            const existing = await VpnClient.findOne({ where: { userId: user.id, networkId: network.id } });
            
            if (!existing) {
                console.log(`[VPN Migration] Creating VPN profile for user: ${user.full_name || user.username} (ID: ${user.id})`);
                
                const usedIps = (await VpnClient.findAll({ where: { networkId: network.id } })).map(c => c.clientIp);
                const clientIp = getNextAvailableIp(network.cidr, usedIps);
                const { privateKey, publicKey, presharedKey } = generateKeys();

                await VpnClient.create({
                    networkId: network.id,
                    userId: user.id,
                    deviceName: 'Primary_Device',
                    clientIp,
                    privateKey,
                    publicKey,
                    presharedKey
                });
            }
        }
        
        console.log("[VPN Migration] Migration finished.");
    } catch (error) {
        console.error("[VPN Migration] Error during migration:", error.message);
    }
};

module.exports = migrateExistingUsers;
