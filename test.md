```mermaid
graph TD
    subgraph "🌐 Externe Schicht (Nutzer & Zugang)"
        Cloudflared[Cloudflared Tunnel] --> Internet
        Internet --> Cloudflared
    end

    subgraph "🚪 Gateway-Schicht"
        Cloudflared --> API_GW(API Gateway: Authentifizierung, Routing)
        Frontend_EJS(Frontend EJS Service) --> API_GW
        Mobile_App(React Native Mobile App) --> API_GW
    end

    subgraph "⚙️ Core Microservices-Schicht"
        direction LR
        subgraph "I. Autorisierung & HR"
            Auth(Auth Service: Benutzer)
            HR(HR Service: Personal)
            HR --> Auth
        end

        subgraph "II. Workforce & Aufträge"
            Job(Job Service: Aufgaben)
            Shift(Shift Service: Schichtplanung)
            Job --> Client(Client Service: Kunden)
            Job --> Location(Location Service: Standorte)
            Shift --> Job
            Shift --> Location
        end
        
        API_GW --> Auth
        API_GW --> HR
        API_GW --> Job
        API_GW --> Shift
        API_GW --> Client
        API_GW --> Location
        
        style I. Autorisierung & HR fill:#e0ffe0,stroke:#28a745
        style II. Workforce & Aufträge fill:#e0ffe0,stroke:#28a745
    end

    subgraph "💾 Datenhaltung"
        MySQL_DB(MySQL DB: auth, hr, job, shift, client, location)
        Redis_Cache(Redis Cache: Sessions/Cache)
        
        Auth -- DB-Verbindung --> MySQL_DB
        HR -- DB-Verbindung --> MySQL_DB
        Job -- DB-Verbindung --> MySQL_DB
        Shift -- DB-Verbindung --> MySQL_DB
        Client -- DB-Verbindung --> MySQL_DB
        Location -- DB-Verbindung --> MySQL_DB

        API_GW --> Redis_Cache
        Auth --> Redis_Cache
        Job --> Redis_Cache
    end

    classDef Gateway fill:#fffacd,stroke:#ffa500,stroke-width:2px;
    classDef Frontend fill:#fffacd,stroke:#ffa500,stroke-width:2px;
    classDef Data fill:#ffe0e0,stroke:#dc3545,stroke-width:2px;
    classDef Service fill:#e0ffe0,stroke:#28a745,stroke-width:2px;

    class API_GW,Frontend_EJS Gateway;
    class MySQL_DB,Redis_Cache Data;
    class Auth,HR,Job,Shift,Client,Location Service;