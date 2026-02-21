# File Storage Service (Microservice)

Der File-Storage-Service ist der zentrale Dienst für die Verwaltung digitaler Dokumente und Assets im DRP2-System.

## Funktionalität
- **Cloud-Anbindung**: Nutzung von Cloudflare R2 (S3-kompatibel) via Rclone.
- **Automatisierte Ablage**: Strukturierte Speicherung (z.B. nach Jahr/Monat) von Gehaltsabrechnungen.
- **Sicherer Download**: Bereitstellung von temporären oder gesicherten Links via API Gateway.
- **Hybrid-Speicher**: Lokales Zwischenspeichern von Uploads mit anschließendem Cloud-Sync.

## API-Dokumentation

Der Dienst ist intern auf Port `3010` erreichbar.

### Datei-Operationen
| Methode | Pfad | Beschreibung |
| :--- | :--- | :--- |
| `POST` | `/upload/:folder` | Datei in einen spezifischen Bucket-Ordner hochladen. |
| `GET` | `/download/:filename` | Datei aus der Cloud abrufen und zum Download anbieten. |
| `DELETE` | `/delete/:filename` | Dokument dauerhaft aus dem Speicher entfernen. |

## Sicherheit & Infrastruktur
Der Service nutzt das API Gateway als Proxy. Downloads werden über `/api/files/download/*` geroutet. Die Authentifizierung erfolgt über das Gateway, sodass nur berechtigte Nutzer Zugriff auf sensible Dokumente wie Lohnabrechnungen haben. ^^
