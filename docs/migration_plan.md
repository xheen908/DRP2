# Migrationsplan: BayChat & openPOS (Kasse) -> DRP2 Stack

Dieses Dokument beschreibt den Plan zur Integration der Standalone-Projekte **BayChat** und **openPOS (Kasse)** in das **DRP2 Microservices-Ökosystem**.

## 1. Aktueller Status & Komponenten
- **DRP2 Stack (`D:\DRP2`):** Bestehendes Kubernetes/Docker-System mit Auth, HR, Payroll, Shift, VPN und Tax-Engine.
- **BayChat (`D:\private_projects\BayChat`):** Standalone Chat-System (Node.js/Express).
- **openPOS / Kasse (`C:\Users\xheen908\kasse`):** Point-of-Sale System mit mehreren Microservices (Sale, Catalog, Payment).

## 2. Migrationsziele
- Zentralisierung der Authentifizierung über den DRP2 Auth-Service.
- Integration der Kassen-Funktionen (Catalog/Sales) in den DRP2-Stack.
- Bereitstellung von BayChat als interner Kommunikationsdienst für Mitarbeiter.

## 3. Phasenplan

### Phase 1: Vorbereitung (In Progress)
- [x] Dokumentation des VPN-Service (README & Endpunkte).
- [x] Lokalisierung von openPOS unter `D:\private_projects\openPOS`.
- [x] Dokumentation der openPOS Endpunkte (`endpoint_docs.md`).
- [x] Dokumentation der BayChat Endpunkte (`endpoint_docs.md`).
- [ ] Analyse der Datenbank-Schemata von BayChat und Kasse.

### Phase 2: VPN & Infrastruktur
- [ ] Integration der Kassen-Services in die `docker-compose.yml` von DRP2.
- [ ] Konfiguration des API-Gateways für `/commerce` (Kasse) und `/chat` (BayChat).
- [ ] Sicherstellung der Erreichbarkeit über den Cloudflare Tunnel.

### Phase 3: Service-Migration
- **Commerce-Service:** Neuer DRP2 Service basierend auf dem `kasse/backend` (Catalog + Sale).
- **BayChat Integration:** Portierung des BayChat Backends als DRP2-kompatiblen Microservice.
- **Auth-Anpassung:** Umstellung beider Projekte auf JWT-Validierung gegen den DRP2 Auth-Service.

### Phase 4: Frontend & Testing
- [ ] Integration der Kassen-Views in das DRP2 EJS-Frontend.
- [ ] End-to-End Tests der Prozesskette (Schicht -> Verkauf -> Abrechnung).

---
*Status: 22.02.2026 - Planungsphase* ^^
