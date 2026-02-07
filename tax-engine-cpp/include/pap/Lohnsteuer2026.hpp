#ifndef LOHNSTEUER2026_HPP
#define LOHNSTEUER2026_HPP

#include <vector>
#include <string>

/**
 * @brief BMF Programmlaufplan 2026 (Lohnsteuerberechnung)
 * 
 * Basierend auf dem PAP 2026 Stand 12.11.2025.
 */
class Lohnsteuer2026 {
public:
    // --- Eingangsparameter ---
    int AF = 0;              ///< 1, wenn Faktorverfahren (Stkl IV)
    int AJAHR = 0;           ///< Jahr der Vollendung des 64. Lebensjahres
    int ALTER1 = 0;          ///< 1, wenn 64. Lj vor Beginn des Kalenderjahres vollendet
    int ALV = 0;             ///< 0 = ALV pflichtig, 1 = nicht
    double F = 1.0;          ///< Faktor (3 Nachkommastellen)
    long long JFREIB = 0;    ///< Jahresfreibetrag (Cent)
    long long JHINZU = 0;    ///< Jahreshinzurechnungsbetrag (Cent)
    long long JRE4 = 0;      ///< Voraussichtlicher Jahresarbeitslohn (Cent)
    long long JRE4ENT = 0;   ///< Entschädigungen in JRE4 (Cent)
    long long JVBEZ = 0;     ///< Versorgungsbezüge in JRE4 (Cent)
    int KRV = 0;             ///< Rentenversicherungspflicht (0=ja, 1=nein)
    double KVZ = 0.0;        ///< Zusatzbeitragssatz (Prozent, z.B. 2.90)
    int LZZ = 1;             ///< Lohnzahlungszeitraum (1=J, 2=M, 3=W, 4=T)
    long long LZZFREIB = 0;  ///< Freibetrag LZZ (Cent)
    long long LZZHINZU = 0;  ///< Hinzurechnungsbetrag LZZ (Cent)
    long long MBV = 0;       ///< Nicht zu besteuernde Vorteile bei Vermögensbeteiligungen (Cent)
    long long PKPV = 0;      ///< Private KV/PV Basistarif (Cent Monatsbetrag)
    long long PKPVAGZ = 0;   ///< AG-Zuschuss private KV/PV (Cent Monatsbetrag)
    int PKV = 0;             ///< 0=gesetzlich, 1=privat
    int PVA = 0;             ///< Beitragsabschläge Pflegeversicherung (Kinder)
    int PVS = 0;             ///< Besonderheit Sachsen (1=ja)
    int PVZ = 0;             ///< Zuschlag Kinderlose Pflegeversicherung (1=ja)
    double R = 0.0;          ///< Kirchensteuersatz (Prozent, z.B. 8.0 oder 9.0)
    long long RE4 = 0;       ///< Arbeitslohn LZZ (Cent)
    long long SONSTB = 0;    ///< Sonstige Bezüge (Cent)
    long long SONSTENT = 0;  ///< Entschädigungen in SONSTB (Cent)
    long long STERBE = 0;    ///< Sterbegeld (Cent)
    int STKL = 1;            ///< Steuerklasse (1-6)
    long long VBEZ = 0;      ///< Versorgungsbezüge in RE4 (Cent)
    long long VBEZM = 0;     ///< Versorgungsbezug Januar 2005 (Cent)
    long long VBEZS = 0;     ///< Sonderzahlungen Versorgungsbezüge (Cent)
    long long VBS = 0;       ///< Versorgungsbezüge in SONSTB (Cent)
    int VJAHR = 0;           ///< Jahr des Versorgungsbeginns
    double ZKF = 0.0;        ///< Zahl der Kinderfreibeträge
    int ZMVB = 0;            ///< Monate Versorgungsbezug (bei LZZ=1)

    // --- Ausgangsparameter Steuer ---
    long long BK = 0;        ///< Bemessungsgrundlage Kirchensteuer Cent
    long long BKS = 0;       ///< Bemessungsgrundlage Kirchensteuer sonstige Bezüge Cent
    long long LSTLZZ = 0;    ///< Lohnsteuer LZZ Cent
    long long SOLZLZZ = 0;   ///< SolZ LZZ Cent
    long long SOLZS = 0;     ///< SolZ sonstige Bezüge Cent
    long long STS = 0;       ///< Lohnsteuer sonstige Bezüge Cent

    // --- Ausgangsparameter Sozialversicherung ---
    long long RV_AN = 0;     ///< Rentenversicherung Cent
    long long KV_AN = 0;     ///< Krankenversicherung Cent
    long long PV_AN = 0;     ///< Pflegeversicherung Cent
    long long ALV_AN = 0;    ///< Arbeitslosenversicherung Cent

    void berechnen();
    void berechneSV();

private:
    // --- Interne Felder ---
    double ALTE = 0.0, ANP = 0.0, BMG = 0.0, DIFF = 0.0, EFA = 0.0, FVB = 0.0, FVBSO = 0.0, FVBZ = 0.0, FVBZSO = 0.0, GFB = 0.0, HBALTE = 0.0, HFVB = 0.0, HFVBZ = 0.0, HFVBZSO = 0.0, HOCH = 0.0;
    int J = 0, K = 0;
    double BBGRVALV = 0.0, AVSATZAN = 0.0, BBGKVPV = 0.0, VFRB = 0.0;
    double JBMG = 0.0, JLFREIB = 0.0, JLHINZU = 0.0, JW = 0.0, KFB = 0.0, KVSATZAN = 0.0, KZTAB = 1.0, LSTJAHR = 0.0, LSTOSO = 0.0, LSTSO = 0.0, MIST = 0.0, PKPVAGZJ = 0.0, PVSATZAN = 0.0, RVSATZAN = 0.0, RW = 0.0, SAP = 0.0, SOLZFREI = 0.0, SOLZJ = 0.0, SOLZMIN = 0.0, SOLZSBMG = 0.0, SOLZSZVE = 0.0, ST = 0.0, ST1 = 0.0, ST2 = 0.0;
    double VBEZB = 0.0, VBEZBSO = 0.0, VERGL = 0.0, VSPHB = 0.0, VSP = 0.0, VSPN = 0.0, VSPALV = 0.0, VSPKVPV = 0.0, VSPR = 0.0, W1STKL5 = 0.0, W2STKL5 = 0.0, W3STKL5 = 0.0, X = 0.0, Y = 0.0, ZRE4 = 0.0, ZRE4J = 0.0, ZRE4VP = 0.0, ZRE4VPR = 0.0, ZTABFB = 0.0, ZVBEZ = 0.0, ZVBEZJ = 0.0, ZVE = 0.0, ZX = 0.0, ZZX = 0.0;
    double WVFRB = 0.0, WVFRBM = 0.0, WVFRBO = 0.0, VFRBS1 = 0.0, VFRBS2 = 0.0;
    long long ANTEIL1 = 0;

    // --- Methoden des PAP ---
    void MPARA();
    void MRE4JL();
    void MRE4();
    void MRE4ABZ();
    void MBERECH();
    void MSONST();
    void MRE4ALTE();
    void MST5_6();
    void UP5_6();
    void UPVSP();
    void UPMLST();
    void UPLSTLZZ();
    void UPTAB26();
    void UPANTEIL();
    void MSOLZ();
    void MSOLZSTS();
};

#endif // LOHNSTEUER2026_HPP
