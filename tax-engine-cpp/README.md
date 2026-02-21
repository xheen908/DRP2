# Tax Engine Microservice (C++)

Diese Engine ist das Herzstück der Lohnsteuerberechnung im DRP2-System. Sie ist in C++ geschrieben, um eine extrem hohe Performance und Präzision bei der Verarbeitung komplexer Steuerformeln (PAP - Programmablaufplan) zu gewährleisten.

## Features
- **PAP 2026 konform**: Implementierung der neuesten gesetzlichen Vorgaben für die Lohnsteuerberechnung.
- **Microservice-Architektur**: Erreichbar via HTTP/JSON.
- **Hohe Performance**: C++ Backend für blitzschnelle Berechnungen auch bei großen Datenmengen.

## API-Dokumentation

Der Service läuft standardmäßig auf Port `8080` (intern) bzw. `3011` (extern via Docker).

### Endpunkt: `POST /calculate`

Berechnet die Lohnsteuer und Sozialabgaben basierend auf den übergebenen Parametern.

#### Eingabeparameter (JSON)
| Parameter | Typ | Beschreibung |
| :--- | :--- | :--- |
| `RE4` | int | Bruttoarbeitslohn in Cent (Lohnzahlungszeitraum) |
| `LZZ` | int | Lohnzahlungszeitraum (1=Jahr, 2=Monat, 3=Woche, 4=Tag) |
| `STKL` | int | Lohnsteuerklasse (1-6) |
| `R` | double | Kirchensteuersatz (z.B. 9.0 oder 8.0) |
| `ZKF` | double | Zahl der Kinderfreibeträge (z.B. 0.5 oder 1.0) |
| `KVZ` | double | Krankenkassenzusatzbeitrag (z.B. 1.6) |
| `PVZ` | int | Pflegeversicherungszuschlag für Kinderlose (1=ja, 0=nein) |
| `ALTER1` | int | Altersentlastungsbetrag (1=ja, 0=nein) |
| `KRV` | int | Rentenversicherungspflicht (0=ja, 1=nein/Ost, 2=nein/West) |

*Hinweis: Viele weitere PAP-spezifische Parameter werden unterstützt (siehe `main.cpp`).*

#### Beispiel-Anfrage
```json
{
  "RE4": 350000,
  "LZZ": 2,
  "STKL": 1,
  "R": 9.0,
  "ZKF": 0,
  "KVZ": 1.6
}
```

#### Ausgabe-Parameter (JSON)
| Parameter | Typ | Beschreibung |
| :--- | :--- | :--- |
| `LSTLZZ` | int | Lohnsteuer für den LZZ (in Cent) |
| `SOLZLZZ` | int | Solidaritätszuschlag (in Cent) |
| `BK` | int | Bemessungsgrundlage für Kirchensteuer (in Cent) |
| `RV_AN` | int | Rentenversicherung AN-Anteil (in Cent) |
| `KV_AN` | int | Krankenversicherung AN-Anteil (in Cent) |
| `PV_AN` | int | Pflegeversicherung AN-Anteil (in Cent) |
| `ALV_AN` | int | Arbeitslosenversicherung AN-Anteil (in Cent) |

#### Beispiel-Antwort
```json
{
  "LSTLZZ": 45337,
  "SOLZLZZ": 0,
  "BK": 45337,
  "RV_AN": 32550,
  "KV_AN": 28350,
  "PV_AN": 6650,
  "ALV_AN": 4550
}
```

## Setup & Build
Der Service nutzt `CMake` und `httplib` für den HTTP-Server.

1. **Build lokal**:
   ```bash
   mkdir build && cd build
   cmake ..
   make
   ./tax-engine
   ```

2. **Docker**:
   ```bash
   docker build -t tax-engine-cpp .
   docker run -p 8080:8080 tax-engine-cpp
   ```

---
*Status: Februar 2026* ^^
