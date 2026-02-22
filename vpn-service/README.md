# VPN Service - DRP2 Core Component

Zentraler Dienst zur Verwaltung von WireGuard VPN Netzwerken und Clients innerhalb des DRP2 Stacks.

## Übersicht
Der VPN Service ermöglicht die automatisierte Bereitstellung von VPN-Zugängen für Mitarbeiter und externe Partner. Er verwaltet IP-Adressbereiche (CIDR), generiert kryptographische Schlüsselpaare und liefert fertige WireGuard-Konfigurationsdateien aus.

## API Endpunkte

### Netzwerke (Networks)

#### `GET /networks`
Ruft alle konfigurierten VPN-Netzwerke ab, inklusive der zugeordneten Clients.
* **Response:** Array von Netzwerk-Objekten.

#### `POST /networks`
Erstellt ein neues VPN-Netzwerk.
* **Body:**
  * `name`: Anzeigename des Netzwerks.
  * `cidr`: IP-Bereich (z.B. `10.8.0.0/24`).
  * `endpoint`: Öffentliche IP oder Domain des VPN-Gateways.
  * `port`: UDP Port des Gateways.
* **Details:** Generiert automatisch ein `privateKey` und `publicKey` für den Server.

### Clients (Peers)

#### `POST /clients`
Registriert einen neuen VPN-Client (Peer).
* **Body:**
  * `userId`: ID des Benutzers (aus Auth-Service).
  * `deviceName`: Name des Geräts (z.B. "iPhone Neo").
  * `networkId` (optional): ID des Netzwerks. Falls nicht angegeben, wird das erste verfügbare Netzwerk gewählt.
* **Response:** Client-Objekt mit generierten Schlüsseln und zugewiesener IP.

#### `GET /clients/:id/config`
Liefert die fertige WireGuard Konfigurationsdatei für einen spezifischen Client anhand der Client-ID.
* **Response:** `text/plain` (WireGuard Format).

#### `GET /clients/user/:userId/config`
Liefert das aktuellste VPN-Profil eines Benutzers.
* **Response:** `text/plain` (WireGuard Format).

## Technischer Stack
* **Runtime:** Node.js / Express
* **Database:** MySQL (über DRP2 Core DB)
* **Kryptographie:** Automatische Schlüsselgenerierung (Curve25519) via `vpnUtils`.

---
*Erstellt am 22.02.2026* ^^
