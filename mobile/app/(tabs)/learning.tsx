import React, { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COMPLETION_KEY = "@ieu_cepa:learning_completed";
const COMMUNITY_KEY = "@ieu_cepa:community_questions";

interface CommunityQuestion {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

interface LearningPoint {
  de: string;
  en: string;
  id: string;
}

interface LearningModule {
  id: string;
  title: { de: string; en: string; id: string };
  subtitle: { de: string; en: string; id: string };
  duration: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bgColor: string;
  regulation: string;
  points: LearningPoint[];
  available: boolean;
}

// Static seed questions so the community looks populated from the start
const SEED_QUESTIONS: CommunityQuestion[] = [
  {
    id: "seed1",
    author: "Budi S.",
    text: "Does the DPP apply to furniture products made of wood? We export chairs to Germany.",
    timestamp: "2 days ago",
    isOwn: false,
  },
  {
    id: "seed2",
    author: "Siti R.",
    text: "Unser Kakao-Exportprodukt fällt unter EUDR – müssen wir GPS-Koordinaten für jede einzelne Farm angeben?",
    timestamp: "5 days ago",
    isOwn: false,
  },
  {
    id: "seed3",
    author: "Ahmad W.",
    text: "Apakah sertifikat CE berlaku seumur hidup atau harus diperbarui secara berkala?",
    timestamp: "1 week ago",
    isOwn: false,
  },
];

export default function LearningScreen() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as "de" | "en" | "id") ?? "de";
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [communityQuestions, setCommunityQuestions] = useState<CommunityQuestion[]>([]);
  const [showAskInput, setShowAskInput] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(COMPLETION_KEY).then((val) => {
        if (val) setCompleted(JSON.parse(val));
      });
      AsyncStorage.getItem(COMMUNITY_KEY).then((val) => {
        setCommunityQuestions(val ? JSON.parse(val) : []);
      });
    }, [])
  );

  const submitQuestion = async () => {
    if (!newQuestion.trim()) return;
    const q: CommunityQuestion = {
      id: Date.now().toString(),
      author: user?.name ?? "You",
      text: newQuestion.trim(),
      timestamp: t("learning.justNow"),
      isOwn: true,
    };
    const updated = [q, ...communityQuestions];
    setCommunityQuestions(updated);
    await AsyncStorage.setItem(COMMUNITY_KEY, JSON.stringify(updated));
    setNewQuestion("");
    setShowAskInput(false);
  };

  const toggleCompleted = async (id: string) => {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    await AsyncStorage.setItem(COMPLETION_KEY, JSON.stringify(next));
  };

  const modules: LearningModule[] = [
    {
      id: "dpp",
      available: true,
      title: { de: "Digital Product Passport", en: "Digital Product Passport", id: "Paspor Produk Digital" },
      subtitle: {
        de: "EU-Ökodesign-Verordnung & DPP-Anforderungen",
        en: "EU Ecodesign Regulation & DPP Requirements",
        id: "Regulasi Ekodesain EU & Persyaratan DPP",
      },
      duration: "5",
      icon: "document-text",
      color: colors.primary,
      bgColor: colors.primary + "1A",
      regulation: "EU 2024/1781",
      points: [
        {
          de: "Der DPP ist ein digitales Datendokument, das Informationen über Materialien, Reparierbarkeit und Nachhaltigkeit eines Produkts enthält.",
          en: "The DPP is a digital data document containing information about a product's materials, repairability, and sustainability.",
          id: "DPP adalah dokumen data digital yang berisi informasi tentang material, kemampuan perbaikan, dan keberlanjutan produk.",
        },
        {
          de: "Ab 2027 gilt die Pflicht zunächst für Batterien und Textilien; ab 2030 weitet sie sich auf weitere Produktkategorien aus.",
          en: "From 2027, the obligation applies first to batteries and textiles; from 2030, it extends to more product categories.",
          id: "Mulai 2027, kewajiban berlaku untuk baterai dan tekstil; mulai 2030, diperluas ke kategori produk lainnya.",
        },
        {
          de: "Der DPP muss über einen QR-Code oder einen digitalen Link zugänglich sein und Daten zu CO₂-Fußabdruck, Reparierbarkeit und Recyclinganteil enthalten.",
          en: "The DPP must be accessible via QR code or digital link, containing data on CO₂ footprint, repairability and recycled content.",
          id: "DPP harus dapat diakses melalui kode QR atau tautan digital, berisi data jejak CO₂, kemampuan perbaikan, dan kandungan daur ulang.",
        },
        {
          de: "Indonesische Exporteure müssen sicherstellen, dass ihre Lieferkettendaten vollständig und nachvollziehbar dokumentiert sind.",
          en: "Indonesian exporters must ensure their supply chain data is fully and traceably documented.",
          id: "Eksportir Indonesia harus memastikan data rantai pasok mereka terdokumentasi secara lengkap dan dapat ditelusuri.",
        },
        {
          de: "Verstöße können zu Marktzugangssperren führen – die EU-Marktüberwachung prüft DPP-Konformität aktiv.",
          en: "Non-compliance can lead to market access bans – EU market surveillance actively checks DPP conformity.",
          id: "Ketidakpatuhan dapat menyebabkan larangan akses pasar – pengawasan pasar EU secara aktif memeriksa kesesuaian DPP.",
        },
      ],
    },
    {
      id: "eudr",
      available: true,
      title: { de: "EUDR Compliance", en: "EUDR Compliance", id: "Kepatuhan EUDR" },
      subtitle: {
        de: "Entwaldungsfreie Lieferketten nachweisen",
        en: "Proving deforestation-free supply chains",
        id: "Membuktikan rantai pasok bebas deforestasi",
      },
      duration: "4",
      icon: "leaf",
      color: colors.success,
      bgColor: colors.success + "1A",
      regulation: "EU 2023/1115",
      points: [
        {
          de: "Die EUDR verbietet den Import von Produkten, die mit Entwaldung oder Waldschädigung nach dem 31. Dezember 2020 in Verbindung stehen.",
          en: "The EUDR prohibits the import of products linked to deforestation or forest degradation after December 31, 2020.",
          id: "EUDR melarang impor produk yang terkait deforestasi atau degradasi hutan setelah 31 Desember 2020.",
        },
        {
          de: "Betroffene Produkte: Rinder, Kakao, Kaffee, Palmöl, Soja, Holz, Kautschuk und daraus hergestellte Erzeugnisse.",
          en: "Affected products: cattle, cocoa, coffee, palm oil, soy, wood, rubber and derived products.",
          id: "Produk yang terdampak: sapi, kakao, kopi, minyak sawit, kedelai, kayu, karet, dan produk turunannya.",
        },
        {
          de: "Unternehmen müssen eine Sorgfaltspflichtserklärung abgeben, die GPS-Koordinaten des Anbaugebiets, Lieferkettendokumente und Risikoanalysen enthält.",
          en: "Companies must submit a due diligence statement including GPS coordinates of the growing area, supply chain documents, and risk assessments.",
          id: "Perusahaan harus menyerahkan pernyataan uji tuntas termasuk koordinat GPS area tanam, dokumen rantai pasok, dan analisis risiko.",
        },
        {
          de: "Indonesien ist als Hochrisikoland für Palmöl und Holzprodukte eingestuft – verschärfte Prüfpflichten gelten.",
          en: "Indonesia is classified as a high-risk country for palm oil and timber products – stricter verification requirements apply.",
          id: "Indonesia diklasifikasikan sebagai negara berisiko tinggi untuk minyak sawit dan produk kayu – persyaratan verifikasi yang lebih ketat berlaku.",
        },
      ],
    },
    {
      id: "ce",
      available: true,
      title: { de: "CE-Kennzeichnung", en: "CE Marking", id: "Penandaan CE" },
      subtitle: {
        de: "Konformität mit EU-Produktstandards",
        en: "Conformity with EU product standards",
        id: "Kesesuaian dengan standar produk EU",
      },
      duration: "3",
      icon: "shield-checkmark",
      color: colors.info,
      bgColor: colors.info + "1A",
      regulation: "EU 768/2008",
      points: [
        {
          de: "Das CE-Zeichen bestätigt, dass ein Produkt die EU-Sicherheits-, Gesundheits- und Umweltanforderungen erfüllt – es ist kein Qualitätssiegel.",
          en: "The CE mark confirms that a product meets EU safety, health and environmental requirements – it is not a quality seal.",
          id: "Tanda CE mengonfirmasi bahwa produk memenuhi persyaratan keselamatan, kesehatan, dan lingkungan EU – bukan segel kualitas.",
        },
        {
          de: "Betroffene Produktgruppen: Elektronik, Spielzeug, Maschinen, Medizinprodukte, Schutzausrüstung und viele mehr.",
          en: "Affected product groups: electronics, toys, machinery, medical devices, protective equipment and many more.",
          id: "Kelompok produk yang terdampak: elektronik, mainan, mesin, perangkat medis, alat pelindung, dan banyak lagi.",
        },
        {
          de: "Exporteure benötigen technische Dokumentation, EU-Konformitätserklärung und müssen ggf. eine benannte Stelle (Notified Body) einschalten.",
          en: "Exporters need technical documentation, an EU declaration of conformity and may need to involve a notified body.",
          id: "Eksportir memerlukan dokumentasi teknis, deklarasi kesesuaian EU, dan mungkin perlu melibatkan lembaga yang ditunjuk (notified body).",
        },
        {
          de: "Ohne CE-Kennzeichnung darf das Produkt nicht im EU-Binnenmarkt verkauft werden – Bußgelder und Rückruf drohen.",
          en: "Without CE marking, the product may not be sold in the EU internal market – fines and recalls are at risk.",
          id: "Tanpa penandaan CE, produk tidak boleh dijual di pasar internal EU – denda dan penarikan kembali dapat terjadi.",
        },
      ],
    },
    {
      id: "esg",
      available: true,
      title: { de: "Nachhaltigkeitsberichterstattung", en: "Sustainability Reporting", id: "Pelaporan Keberlanjutan" },
      subtitle: {
        de: "ESG-Berichtspflichten für Exporteure",
        en: "ESG reporting obligations for exporters",
        id: "Kewajiban pelaporan ESG untuk eksportir",
      },
      duration: "5",
      icon: "bar-chart",
      color: colors.secondary,
      bgColor: colors.secondary + "1A",
      regulation: "CSRD 2022/2464",
      points: [
        {
          de: "Die CSRD verpflichtet EU-Unternehmen zur Berichterstattung über Umwelt-, Sozial- und Governance-Themen (ESG) nach dem ESRS-Standard.",
          en: "The CSRD requires EU companies to report on environmental, social and governance (ESG) topics according to the ESRS standard.",
          id: "CSRD mewajibkan perusahaan EU untuk melaporkan topik lingkungan, sosial, dan tata kelola (ESG) sesuai standar ESRS.",
        },
        {
          de: "Indonesische Lieferanten werden indirekt betroffen: EU-Großunternehmen müssen Nachhaltigkeitsdaten ihrer gesamten Lieferkette offenlegen.",
          en: "Indonesian suppliers are indirectly affected: EU large companies must disclose sustainability data from their entire supply chain.",
          id: "Pemasok Indonesia terdampak secara tidak langsung: perusahaan besar EU harus mengungkapkan data keberlanjutan dari seluruh rantai pasok mereka.",
        },
        {
          de: "Wichtige ESG-Themen: CO₂-Emissionen, Wasserverbrauch, Arbeitsbedingungen, Diversität und Anti-Korruption.",
          en: "Key ESG topics: CO₂ emissions, water consumption, working conditions, diversity and anti-corruption.",
          id: "Topik ESG utama: emisi CO₂, konsumsi air, kondisi kerja, keragaman, dan anti-korupsi.",
        },
        {
          de: "KMU-Exporteure sollten proaktiv Daten zu CO₂, Energie und Arbeitsbedingungen erfassen, um Anfragen ihrer EU-Kunden beantworten zu können.",
          en: "SME exporters should proactively collect data on CO₂, energy and working conditions to respond to requests from EU customers.",
          id: "Eksportir UKM harus secara proaktif mengumpulkan data tentang CO₂, energi, dan kondisi kerja untuk merespons permintaan pelanggan EU mereka.",
        },
      ],
    },
    {
      id: "safety",
      available: false,
      title: { de: "Produktsicherheit", en: "Product Safety", id: "Keamanan Produk" },
      subtitle: {
        de: "EU-Produktsicherheitsverordnung",
        en: "EU General Product Safety Regulation",
        id: "Regulasi Keamanan Produk Umum EU",
      },
      duration: "4",
      icon: "checkmark-circle",
      color: colors.accent,
      bgColor: colors.accent + "1A",
      regulation: "EU 2023/988",
      points: [],
    },
    {
      id: "reach",
      available: false,
      title: { de: "REACH-Chemikalienverordnung", en: "REACH Chemicals Regulation", id: "Regulasi Kimia REACH" },
      subtitle: {
        de: "Registrierung & Bewertung chemischer Stoffe",
        en: "Registration & evaluation of chemical substances",
        id: "Registrasi & evaluasi zat kimia",
      },
      duration: "5",
      icon: "flask",
      color: colors.error,
      bgColor: colors.error + "1A",
      regulation: "EG 1907/2006",
      points: [],
    },
  ];

  const availableModules = modules.filter((m) => m.available);
  const plannedModules = modules.filter((m) => !m.available);
  const completedCount = availableModules.filter((m) => completed[m.id]).length;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ backgroundColor: colors.primaryStrong, paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 20 }}>
          <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: "bold" }}>{t("learning.title")}</Text>
          <Text style={{ color: colors.onPrimary + "AA", fontSize: 12, marginTop: 2 }}>{t("learning.subtitle")}</Text>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Progress bar */}
          <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600" }}>
                {t("learning.progress")}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                {completedCount}/{availableModules.length} {t("learning.modulesCompleted")}
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.primary,
                  width: `${availableModules.length > 0 ? (completedCount / availableModules.length) * 100 : 0}%`,
                }}
              />
            </View>
          </View>

          {/* Available modules */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>
              {t("learning.availableModules")}
            </Text>

            {availableModules.map((module) => {
              const isExpanded = expanded === module.id;
              const isDone = !!completed[module.id];

              return (
                <View
                  key={module.id}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: isDone ? colors.primary + "60" : colors.surfaceAlt,
                    overflow: "hidden",
                  }}
                >
                  {/* Module header row */}
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", padding: 14 }}
                    onPress={() => setExpanded(isExpanded ? null : module.id)}
                    activeOpacity={0.75}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0, backgroundColor: module.bgColor }}>
                      <Ionicons name={module.icon} size={22} color={module.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13, flex: 1, paddingRight: 8 }}>
                          {module.title[lang]}
                        </Text>
                        <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{module.duration} {t("learning.minutes")}.</Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{module.subtitle[lang]}</Text>
                      <View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: colors.surfaceAlt, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: "monospace" }}>{module.regulation}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.textSecondary}
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>

                  {/* Expanded content */}
                  {isExpanded && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.surfaceAlt }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", marginTop: 12, marginBottom: 8 }}>
                        {t("learning.keyPoints")}
                      </Text>
                      {module.points.map((point, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: module.bgColor, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1, flexShrink: 0 }}>
                            <Text style={{ color: module.color, fontSize: 11, fontWeight: "700" }}>{i + 1}</Text>
                          </View>
                          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19, flex: 1 }}>
                            {point[lang]}
                          </Text>
                        </View>
                      ))}

                      {/* Buttons row */}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                        <TouchableOpacity
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: colors.primary,
                            borderRadius: 20,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                          }}
                          onPress={() => router.push(`/learning/${module.id}` as any)}
                        >
                          <Ionicons name="play-circle-outline" size={16} color={colors.onPrimary} style={{ marginRight: 6 }} />
                          <Text style={{ color: colors.onPrimary, fontSize: 13, fontWeight: "600" }}>
                            {t("learning.openModule")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: isDone ? colors.primary + "1A" : colors.surfaceAlt,
                            borderRadius: 20,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderWidth: 1,
                            borderColor: isDone ? colors.primary + "60" : colors.border,
                          }}
                          onPress={() => toggleCompleted(module.id)}
                        >
                          <Ionicons
                            name={isDone ? "checkmark-circle" : "ellipse-outline"}
                            size={16}
                            color={isDone ? colors.primary : colors.textSecondary}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={{ color: isDone ? colors.primary : colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                            {isDone ? t("learning.completed") : t("learning.markDone")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Done badge */}
                  {isDone && !isExpanded && (
                    <View style={{ position: "absolute", top: 12, right: 12 }}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Planned modules */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>
              {t("learning.plannedModules")}
            </Text>

            {plannedModules.map((module) => (
              <View
                key={module.id}
                style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.surfaceAlt, opacity: 0.55 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0, backgroundColor: module.bgColor }}>
                    <Ionicons name={module.icon} size={22} color={module.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>{module.title[lang]}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{module.subtitle[lang]}</Text>
                    <View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: colors.surfaceAlt, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: "monospace" }}>{module.regulation}</Text>
                    </View>
                  </View>
                  <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
                </View>
              </View>
            ))}
          </View>

          {/* Community section (DP5 Learning) */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" }}>
                  {t("learning.community")}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                  {t("learning.communitySubtitle")}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.secondary + "1A",
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: colors.secondary + "40",
                }}
                onPress={() => setShowAskInput((v) => !v)}
              >
                <Ionicons name={showAskInput ? "close" : "add"} size={14} color={colors.secondary} style={{ marginRight: 4 }} />
                <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: "600" }}>
                  {showAskInput ? t("learning.cancel") : t("learning.askQuestion")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ask-question input */}
            {showAskInput && (
              <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.secondary + "40" }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.text,
                    fontSize: 13,
                    backgroundColor: colors.inputBackground,
                    minHeight: 72,
                    textAlignVertical: "top",
                  }}
                  placeholder={t("learning.questionPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={newQuestion}
                  onChangeText={setNewQuestion}
                  multiline
                  maxLength={300}
                />
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    backgroundColor: newQuestion.trim() ? colors.secondary : colors.border,
                    borderRadius: 20,
                    paddingHorizontal: 20,
                    paddingVertical: 9,
                    alignSelf: "flex-end",
                  }}
                  onPress={submitQuestion}
                  disabled={!newQuestion.trim()}
                >
                  <Text style={{ color: colors.onPrimary, fontSize: 13, fontWeight: "600" }}>
                    {t("learning.submitQuestion")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* User's own questions */}
            {communityQuestions.map((q) => (
              <View
                key={q.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.secondary + "30",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.secondary + "1A", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                    <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: "700" }}>
                      {q.author.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{q.author}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{q.timestamp}</Text>
                  </View>
                  {q.isOwn && (
                    <View style={{ backgroundColor: colors.secondary + "1A", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color: colors.secondary, fontSize: 10, fontWeight: "600" }}>{t("learning.yourQuestion")}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>{q.text}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{t("learning.expertAnswerPending")}</Text>
                </View>
              </View>
            ))}

            {/* Seed community questions */}
            {SEED_QUESTIONS.map((q) => (
              <View
                key={q.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.surfaceAlt,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700" }}>
                      {q.author.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{q.author}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{q.timestamp}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>{q.text}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                  <Ionicons name="checkmark-circle-outline" size={12} color={colors.success} style={{ marginRight: 4 }} />
                  <Text style={{ color: colors.success, fontSize: 11 }}>{t("learning.expertAnswerPending")}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Footer disclaimer */}
          <View style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 32, backgroundColor: colors.info + "1A", borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Ionicons name="information-circle" size={18} color={colors.info} style={{ marginTop: 1, marginRight: 10 }} />
              <Text style={{ color: colors.info, fontSize: 13, lineHeight: 20, flex: 1 }}>
                {t("learning.moduleInfo")}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
