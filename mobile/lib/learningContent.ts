export type Lang = "de" | "en" | "id";

export interface VideoItem {
  title: { de: string; en: string; id: string };
  description: { de: string; en: string; id: string };
  duration: string;
  youtubeQuery: string;
}

export interface QuizQuestion {
  question: { de: string; en: string; id: string };
  options: { de: string[]; en: string[]; id: string[] };
  correct: number;
  explanation: { de: string; en: string; id: string };
}

export interface ModuleDetail {
  id: string;
  regulation: string;
  videos: VideoItem[];
  quiz: QuizQuestion[];
}

export const MODULE_DETAILS: ModuleDetail[] = [
  {
    id: "dpp",
    regulation: "EU 2024/1781",
    videos: [
      {
        title: {
          de: "Was ist der Digital Product Passport?",
          en: "What is the Digital Product Passport?",
          id: "Apa itu Paspor Produk Digital?",
        },
        description: {
          de: "Einführung in den DPP: Zweck, Aufbau und Umsetzung für Exporteure.",
          en: "Introduction to the DPP: purpose, structure and implementation for exporters.",
          id: "Pengantar DPP: tujuan, struktur, dan implementasi bagi eksportir.",
        },
        duration: "8:24",
        youtubeQuery: "Digital Product Passport EU Ecodesign Regulation explained",
      },
      {
        title: {
          de: "DPP in der Lieferkette – Praxisbeispiele",
          en: "DPP in the Supply Chain – Practical Examples",
          id: "DPP dalam Rantai Pasok – Contoh Praktis",
        },
        description: {
          de: "Wie Unternehmen den DPP in ihre Lieferkette integrieren und welche Daten erforderlich sind.",
          en: "How companies integrate the DPP into their supply chain and what data is required.",
          id: "Bagaimana perusahaan mengintegrasikan DPP ke rantai pasok dan data apa yang diperlukan.",
        },
        duration: "12:05",
        youtubeQuery: "Digital Product Passport supply chain implementation SME",
      },
    ],
    quiz: [
      {
        question: {
          de: "Ab wann gilt die DPP-Pflicht erstmals für Textilien?",
          en: "From when does the DPP obligation first apply to textiles?",
          id: "Mulai kapan kewajiban DPP pertama kali berlaku untuk tekstil?",
        },
        options: {
          de: ["2025", "2027", "2030", "2035"],
          en: ["2025", "2027", "2030", "2035"],
          id: ["2025", "2027", "2030", "2035"],
        },
        correct: 1,
        explanation: {
          de: "Die DPP-Pflicht gilt ab 2027 zunächst für Batterien und Textilien, bevor sie auf weitere Produktkategorien ausgeweitet wird.",
          en: "The DPP obligation applies from 2027 first to batteries and textiles, before being extended to other product categories.",
          id: "Kewajiban DPP berlaku mulai 2027 pertama untuk baterai dan tekstil, sebelum diperluas ke kategori produk lainnya.",
        },
      },
      {
        question: {
          de: "Wie wird ein Digital Product Passport für Verbraucher zugänglich gemacht?",
          en: "How is a Digital Product Passport made accessible to consumers?",
          id: "Bagaimana Paspor Produk Digital dibuat dapat diakses oleh konsumen?",
        },
        options: {
          de: ["Papierhandbuch", "QR-Code oder digitaler Link", "Nur intern", "E-Mail-Anfrage"],
          en: ["Paper manual", "QR code or digital link", "Internal only", "Email request"],
          id: ["Manual kertas", "Kode QR atau tautan digital", "Hanya internal", "Permintaan email"],
        },
        correct: 1,
        explanation: {
          de: "Der DPP muss physisch auf dem Produkt über einen QR-Code oder digitalen Link abrufbar sein.",
          en: "The DPP must be physically accessible on the product via a QR code or digital link.",
          id: "DPP harus dapat diakses secara fisik pada produk melalui kode QR atau tautan digital.",
        },
      },
      {
        question: {
          de: "Welche Datenkategorie muss ein DPP zwingend enthalten?",
          en: "Which data category must a DPP mandatorily contain?",
          id: "Kategori data apa yang wajib ada dalam DPP?",
        },
        options: {
          de: ["Marketingdaten", "Preisinformationen", "CO₂-Fußabdruck und Reparierbarkeit", "Kundenbewertungen"],
          en: ["Marketing data", "Price information", "CO₂ footprint and repairability", "Customer reviews"],
          id: ["Data pemasaran", "Informasi harga", "Jejak CO₂ dan kemampuan perbaikan", "Ulasan pelanggan"],
        },
        correct: 2,
        explanation: {
          de: "Der DPP muss Umweltdaten wie CO₂-Fußabdruck, Reparierbarkeit und Recyclinganteil enthalten.",
          en: "The DPP must contain environmental data such as CO₂ footprint, repairability and recycled content.",
          id: "DPP harus berisi data lingkungan seperti jejak CO₂, kemampuan perbaikan, dan kandungan daur ulang.",
        },
      },
    ],
  },
  {
    id: "eudr",
    regulation: "EU 2023/1115",
    videos: [
      {
        title: {
          de: "EUDR – Die EU-Entwaldungsverordnung erklärt",
          en: "EUDR – The EU Deforestation Regulation Explained",
          id: "EUDR – Regulasi Deforestasi EU Dijelaskan",
        },
        description: {
          de: "Überblick über die EUDR: Welche Produkte betroffen sind und was Exporteure nachweisen müssen.",
          en: "Overview of EUDR: which products are affected and what exporters must prove.",
          id: "Gambaran EUDR: produk mana yang terdampak dan apa yang harus dibuktikan eksportir.",
        },
        duration: "9:45",
        youtubeQuery: "EU Deforestation Regulation EUDR explained exporters 2024",
      },
      {
        title: {
          de: "Due Diligence nach EUDR – Schritt für Schritt",
          en: "EUDR Due Diligence – Step by Step",
          id: "Uji Tuntas EUDR – Langkah demi Langkah",
        },
        description: {
          de: "Wie erstellt man eine EUDR-konforme Sorgfaltspflichtserklärung? Praktische Anleitung für Lieferanten.",
          en: "How to create an EUDR-compliant due diligence statement – practical guide for suppliers.",
          id: "Cara membuat pernyataan uji tuntas yang sesuai EUDR – panduan praktis untuk pemasok.",
        },
        duration: "14:30",
        youtubeQuery: "EUDR due diligence statement Indonesia palm oil timber",
      },
    ],
    quiz: [
      {
        question: {
          de: "Was ist das Referenzdatum der EUDR – Waren ab wann dürfen nicht mit Entwaldung verbunden sein?",
          en: "What is the EUDR reference date – from when must goods not be linked to deforestation?",
          id: "Apa tanggal referensi EUDR – mulai kapan barang tidak boleh terkait deforestasi?",
        },
        options: {
          de: ["1. Januar 2019", "31. Dezember 2020", "1. Januar 2023", "31. Dezember 2024"],
          en: ["1 January 2019", "31 December 2020", "1 January 2023", "31 December 2024"],
          id: ["1 Januari 2019", "31 Desember 2020", "1 Januari 2023", "31 Desember 2024"],
        },
        correct: 1,
        explanation: {
          de: "Das Referenzdatum ist der 31. Dezember 2020. Produkte dürfen nicht mit Entwaldung nach diesem Datum in Verbindung stehen.",
          en: "The reference date is 31 December 2020. Products must not be linked to deforestation after this date.",
          id: "Tanggal referensi adalah 31 Desember 2020. Produk tidak boleh terkait deforestasi setelah tanggal ini.",
        },
      },
      {
        question: {
          de: "Welches Produkt fällt NICHT unter die EUDR?",
          en: "Which product is NOT covered by the EUDR?",
          id: "Produk mana yang TIDAK tercakup oleh EUDR?",
        },
        options: {
          de: ["Palmöl", "Kaffee", "Stahl", "Kautschuk"],
          en: ["Palm oil", "Coffee", "Steel", "Rubber"],
          id: ["Minyak sawit", "Kopi", "Baja", "Karet"],
        },
        correct: 2,
        explanation: {
          de: "Stahl ist kein landwirtschaftliches Erzeugnis und fällt nicht unter die EUDR. Betroffen sind: Rinder, Kakao, Kaffee, Palmöl, Soja, Holz und Kautschuk.",
          en: "Steel is not an agricultural product and is not covered by EUDR. Affected commodities are: cattle, cocoa, coffee, palm oil, soy, wood and rubber.",
          id: "Baja bukan produk pertanian dan tidak tercakup EUDR. Komoditas yang terdampak: sapi, kakao, kopi, minyak sawit, kedelai, kayu, dan karet.",
        },
      },
      {
        question: {
          de: "Was muss eine EUDR-Sorgfaltspflichtserklärung enthalten?",
          en: "What must an EUDR due diligence statement include?",
          id: "Apa yang harus ada dalam pernyataan uji tuntas EUDR?",
        },
        options: {
          de: ["Nur eine ISO-Zertifizierung", "GPS-Koordinaten der Anbaufläche", "Nur Handelsrechnung", "EU-Büronachweis"],
          en: ["Only an ISO certificate", "GPS coordinates of the growing area", "Only a trade invoice", "Proof of EU office"],
          id: ["Hanya sertifikat ISO", "Koordinat GPS area tanam", "Hanya faktur perdagangan", "Bukti kantor EU"],
        },
        correct: 1,
        explanation: {
          de: "Die Erklärung muss GPS-Koordinaten des Anbaugebiets, Lieferkettendokumente und eine Risikoanalyse enthalten.",
          en: "The statement must include GPS coordinates of the growing area, supply chain documents and a risk assessment.",
          id: "Pernyataan harus mencakup koordinat GPS area tanam, dokumen rantai pasok, dan analisis risiko.",
        },
      },
    ],
  },
  {
    id: "ce",
    regulation: "EU 768/2008",
    videos: [
      {
        title: {
          de: "CE-Kennzeichnung – Was bedeutet das für Exporteure?",
          en: "CE Marking – What Does It Mean for Exporters?",
          id: "Penandaan CE – Apa Artinya bagi Eksportir?",
        },
        description: {
          de: "Grundlagen der CE-Kennzeichnung: Welche Produkte betroffen sind und wie man sie erhält.",
          en: "Basics of CE marking: which products are affected and how to obtain it.",
          id: "Dasar-dasar penandaan CE: produk mana yang terdampak dan cara mendapatkannya.",
        },
        duration: "7:15",
        youtubeQuery: "CE marking explained requirements exporters EU market",
      },
      {
        title: {
          de: "Konformitätsbewertung & technische Dokumentation",
          en: "Conformity Assessment & Technical Documentation",
          id: "Penilaian Kesesuaian & Dokumentasi Teknis",
        },
        description: {
          de: "Schritt-für-Schritt-Anleitung: Von der Risikoanalyse zur EU-Konformitätserklärung.",
          en: "Step-by-step guide: from risk analysis to the EU declaration of conformity.",
          id: "Panduan langkah demi langkah: dari analisis risiko hingga deklarasi kesesuaian EU.",
        },
        duration: "11:00",
        youtubeQuery: "CE marking conformity assessment technical documentation guide",
      },
    ],
    quiz: [
      {
        question: {
          de: "Wofür steht die Abkürzung CE?",
          en: "What does the abbreviation CE stand for?",
          id: "Apa kepanjangan dari singkatan CE?",
        },
        options: {
          de: ["China Export", "Conformité Européenne", "Carbon Emission", "Customs Entry"],
          en: ["China Export", "Conformité Européenne", "Carbon Emission", "Customs Entry"],
          id: ["China Export", "Conformité Européenne", "Carbon Emission", "Customs Entry"],
        },
        correct: 1,
        explanation: {
          de: "CE steht für 'Conformité Européenne' (Europäische Konformität) – es ist kein Qualitätssiegel, sondern bestätigt die Einhaltung EU-Vorschriften.",
          en: "CE stands for 'Conformité Européenne' (European Conformity) – it is not a quality mark, but confirms compliance with EU regulations.",
          id: "CE singkatan dari 'Conformité Européenne' (Kesesuaian Eropa) – bukan segel kualitas, melainkan konfirmasi kepatuhan terhadap regulasi EU.",
        },
      },
      {
        question: {
          de: "Welche Produktkategorie benötigt zwingend eine CE-Kennzeichnung?",
          en: "Which product category mandatorily requires CE marking?",
          id: "Kategori produk mana yang wajib memiliki penandaan CE?",
        },
        options: {
          de: ["Lebensmittel", "Software-Apps", "Elektrische Geräte", "Rohstoffe"],
          en: ["Food products", "Software apps", "Electrical equipment", "Raw materials"],
          id: ["Produk makanan", "Aplikasi perangkat lunak", "Peralatan listrik", "Bahan baku"],
        },
        correct: 2,
        explanation: {
          de: "Elektrische Geräte, Spielzeug, Maschinen und Schutzausrüstung benötigen CE. Lebensmittel und Software fallen nicht darunter.",
          en: "Electrical equipment, toys, machinery and protective equipment require CE. Food and software are not covered.",
          id: "Peralatan listrik, mainan, mesin, dan alat pelindung memerlukan CE. Makanan dan perangkat lunak tidak tercakup.",
        },
      },
      {
        question: {
          de: "Was ist ein 'Notified Body' im CE-Prozess?",
          en: "What is a 'Notified Body' in the CE process?",
          id: "Apa itu 'Notified Body' dalam proses CE?",
        },
        options: {
          de: ["Eine EU-Behörde", "Eine akkreditierte Prüf- und Zertifizierungsstelle", "Ein Zollamt", "Ein Handelsverband"],
          en: ["An EU authority", "An accredited testing and certification body", "A customs office", "A trade association"],
          id: ["Otoritas EU", "Lembaga pengujian dan sertifikasi terakreditasi", "Kantor bea cukai", "Asosiasi perdagangan"],
        },
        correct: 1,
        explanation: {
          de: "Ein Notified Body ist eine von der EU anerkannte Prüfstelle, die bei bestimmten Produkten die Konformitätsbewertung durchführen muss.",
          en: "A Notified Body is an EU-recognised testing organisation that must conduct the conformity assessment for certain products.",
          id: "Notified Body adalah organisasi pengujian yang diakui EU yang harus melakukan penilaian kesesuaian untuk produk tertentu.",
        },
      },
    ],
  },
  {
    id: "esg",
    regulation: "CSRD 2022/2464",
    videos: [
      {
        title: {
          de: "CSRD & ESG-Berichterstattung – Grundlagen",
          en: "CSRD & ESG Reporting – Basics",
          id: "CSRD & Pelaporan ESG – Dasar-dasar",
        },
        description: {
          de: "Was ist die CSRD, wer ist betroffen und was muss berichtet werden?",
          en: "What is the CSRD, who is affected and what must be reported?",
          id: "Apa itu CSRD, siapa yang terdampak, dan apa yang harus dilaporkan?",
        },
        duration: "10:20",
        youtubeQuery: "CSRD ESG reporting explained Corporate Sustainability Reporting Directive",
      },
      {
        title: {
          de: "ESG für indonesische Lieferanten – Warum es wichtig ist",
          en: "ESG for Indonesian Suppliers – Why It Matters",
          id: "ESG untuk Pemasok Indonesia – Mengapa Penting",
        },
        description: {
          de: "Wie EU-Großkunden ESG-Daten von ihren Lieferanten einfordern und wie man sich vorbereitet.",
          en: "How EU large companies request ESG data from their suppliers and how to prepare.",
          id: "Bagaimana perusahaan besar EU meminta data ESG dari pemasok mereka dan cara mempersiapkannya.",
        },
        duration: "8:50",
        youtubeQuery: "ESG supply chain sustainability reporting SME suppliers EU",
      },
    ],
    quiz: [
      {
        question: {
          de: "Wofür stehen die Buchstaben ESG?",
          en: "What do the letters ESG stand for?",
          id: "Apa kepanjangan dari huruf ESG?",
        },
        options: {
          de: ["Export, Safety, Growth", "Environmental, Social, Governance", "European Standards Group", "Economic Strategy Guide"],
          en: ["Export, Safety, Growth", "Environmental, Social, Governance", "European Standards Group", "Economic Strategy Guide"],
          id: ["Export, Safety, Growth", "Environmental, Social, Governance", "European Standards Group", "Economic Strategy Guide"],
        },
        correct: 1,
        explanation: {
          de: "ESG steht für Environmental (Umwelt), Social (Soziales) und Governance (Unternehmensführung).",
          en: "ESG stands for Environmental, Social and Governance.",
          id: "ESG singkatan dari Environmental (Lingkungan), Social (Sosial), dan Governance (Tata Kelola).",
        },
      },
      {
        question: {
          de: "Sind indonesische KMU direkt durch die CSRD verpflichtet?",
          en: "Are Indonesian SMEs directly obligated by the CSRD?",
          id: "Apakah UKM Indonesia diwajibkan langsung oleh CSRD?",
        },
        options: {
          de: ["Ja, sofort ab 2024", "Nein, niemals", "Indirekt über Anfragen ihrer EU-Kunden", "Nur börsennotierte Unternehmen"],
          en: ["Yes, immediately from 2024", "No, never", "Indirectly through requests from EU customers", "Only listed companies"],
          id: ["Ya, langsung mulai 2024", "Tidak, tidak pernah", "Secara tidak langsung melalui permintaan pelanggan EU", "Hanya perusahaan terdaftar"],
        },
        correct: 2,
        explanation: {
          de: "Indonesische KMU sind nicht direkt betroffen, aber ihre EU-Kunden sind verpflichtet, ESG-Daten der gesamten Lieferkette offenzulegen – und fordern diese daher von Lieferanten ein.",
          en: "Indonesian SMEs are not directly affected, but their EU customers are required to disclose ESG data from the entire supply chain – and therefore request it from suppliers.",
          id: "UKM Indonesia tidak terdampak langsung, tetapi pelanggan EU mereka diwajibkan mengungkapkan data ESG dari seluruh rantai pasok – sehingga memintanya dari pemasok.",
        },
      },
      {
        question: {
          de: "Welche Datenkategorie ist für indonesische Lieferanten am relevantesten?",
          en: "Which data category is most relevant for Indonesian suppliers?",
          id: "Kategori data mana yang paling relevan bagi pemasok Indonesia?",
        },
        options: {
          de: ["Aktienkurse", "CO₂-Emissionen und Arbeitsbedingungen", "Werbeumsätze", "Firmenwert"],
          en: ["Stock prices", "CO₂ emissions and working conditions", "Advertising revenues", "Goodwill"],
          id: ["Harga saham", "Emisi CO₂ dan kondisi kerja", "Pendapatan iklan", "Goodwill"],
        },
        correct: 1,
        explanation: {
          de: "EU-Kunden fragen typischerweise nach CO₂-Emissionen, Energieverbrauch, Wassernutzung, Arbeitsbedingungen und Diversität.",
          en: "EU customers typically ask about CO₂ emissions, energy consumption, water use, working conditions and diversity.",
          id: "Pelanggan EU biasanya menanyakan tentang emisi CO₂, konsumsi energi, penggunaan air, kondisi kerja, dan keberagaman.",
        },
      },
    ],
  },
];
