const { execSync } = require('child_process');
const ip = require('ip');

const generateKeys = () => {
    try {
        const privateKey = execSync('wg genkey').toString('utf8').trim();
        const publicKey = execSync(`echo ${privateKey} | wg pubkey`).toString('utf8').trim();
        const presharedKey = execSync('wg genpsk').toString('utf8').trim();
        return { privateKey, publicKey, presharedKey };
    } catch (error) {
        console.error('WireGuard Key Gen Error:', error);
        throw new Error('Key generation failed - check if wg tools are installed');
    }
};

const getNextAvailableIp = (cidr, usedIps) => {
    const subnet = ip.cidrSubnet(cidr);
    const used = new Set(usedIps);

    // Reserved: .0 (Net), .1 (Gateway/Server), .255 (Broadcast)
    const serverIp = ip.fromLong(ip.toLong(subnet.networkAddress) + 1);
    used.add(subnet.networkAddress);
    used.add(serverIp);
    used.add(subnet.broadcastAddress);

    let candidate = ip.fromLong(ip.toLong(serverIp) + 1);
    const last = ip.fromLong(ip.toLong(subnet.broadcastAddress) - 1);

    while (ip.toLong(candidate) <= ip.toLong(last)) {
        if (!used.has(candidate)) return candidate;
        candidate = ip.fromLong(ip.toLong(candidate) + 1);
    }
    throw new Error('No available IPs in subnet');
};

module.exports = { generateKeys, getNextAvailableIp };
