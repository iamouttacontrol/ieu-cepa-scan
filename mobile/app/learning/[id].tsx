import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MODULE_DETAILS, Lang } from "@/lib/learningContent";

const COMPLETION_KEY = "@ieu_cepa:learning_completed";
const QUIZ_KEY = "@ieu_cepa:quiz_scores";

type Tab = "overview" | "videos" | "quiz";

// Key points per module (same content as learning.tsx accordion)
const KEY_POINTS: Record<string, { de: string; en: string; id: string }[]> = {
  dpp: [
    { de: "Der DPP ist ein digitales Datendokument mit Infos zu Materialien, Reparierbarkeit und Nachhaltigkeit eines Produkts.", en: "The DPP is a digital data document with information on a product's materials, repairability and sustainability.", id: "DPP adalah dokumen data digital berisi informasi tentang material, kemampuan perbaikan, dan keberlanjutan produk." },
    { de: "Ab 2027 gilt die Pflicht für Batterien und Textilien; ab 2030 auf weitere Kategorien ausgedehnt.", en: "From 2027 the obligation applies to batteries and textiles; expanded to more categories from 2030.", id: "Mulai 2027 kewajiban berlaku untuk baterai dan tekstil; diperluas ke kategori lain mulai 2030." },
    { de: "Der DPP muss über QR-Code oder digitalen Link zugänglich sein und CO₂-Fußabdruck, Reparierbarkeit und Recyclinganteil enthalten.", en: "The DPP must be accessible via QR code or digital link and contain CO₂ footprint, repairability and recycled content.", id: "DPP harus dapat diakses melalui kode QR atau tautan digital dan berisi jejak CO₂, kemampuan perbaikan, serta kandungan daur ulang." },
    { de: "Indonesische Exporteure müssen Lieferkettendaten vollständig und nachvollziehbar dokumentieren.", en: "Indonesian exporters must document supply chain data fully and traceably.", id: "Eksportir Indonesia harus mendokumentasikan data rantai pasok secara lengkap dan dapat ditelusuri." },
    { de: "Verstöße können zu Marktzugangssperren führen – die EU-Marktüberwachung prüft DPP-Konformität aktiv.", en: "Non-compliance can lead to market access bans – EU market surveillance actively checks DPP conformity.", id: "Ketidakpatuhan dapat menyebabkan larangan akses pasar – pengawasan pasar EU aktif memeriksa kesesuaian DPP." },
  ],
  eudr: [
    { de: "Die EUDR verbietet den Import von Produkten, die nach dem 31.12.2020 mit Entwaldung verbunden sind.", en: "The EUDR prohibits the import of products linked to deforestation after 31 Dec 2020.", id: "EUDR melarang impor produk yang terkait deforestasi setelah 31 Des 2020." },
    { de: "Betroffen: Rinder, Kakao, Kaffee, Palmöl, Soja, Holz, Kautschuk und daraus hergestellte Erzeugnisse.", en: "Affected: cattle, cocoa, coffee, palm oil, soy, wood, rubber and derived products.", id: "Terdampak: sapi, kakao, kopi, minyak sawit, kedelai, kayu, karet, dan produk turunannya." },
    { de: "Unternehmen müssen eine Sorgfaltspflichtserklärung mit GPS-Koordinaten, Lieferkettendokumenten und Risikoanalyse abgeben.", en: "Companies must submit a due diligence statement with GPS coordinates, supply chain documents and risk assessment.", id: "Perusahaan harus menyerahkan pernyataan uji tuntas dengan koordinat GPS, dokumen rantai pasok, dan analisis risiko." },
    { de: "Indonesien ist als Hochrisikoland für Palmöl und Holz eingestuft – verschärfte Prüfpflichten gelten.", en: "Indonesia is classified high-risk for palm oil and timber – stricter verification requirements apply.", id: "Indonesia diklasifikasikan berisiko tinggi untuk minyak sawit dan kayu – persyaratan verifikasi lebih ketat berlaku." },
  ],
  ce: [
    { de: "Das CE-Zeichen bestätigt, dass ein Produkt EU-Sicherheits-, Gesundheits- und Umweltanforderungen erfüllt.", en: "The CE mark confirms that a product meets EU safety, health and environmental requirements.", id: "Tanda CE mengonfirmasi bahwa produk memenuhi persyaratan keselamatan, kesehatan, dan lingkungan EU." },
    { de: "Betroffen: Elektronik, Spielzeug, Maschinen, Medizinprodukte, Schutzausrüstung.", en: "Affected: electronics, toys, machinery, medical devices, protective equipment.", id: "Terdampak: elektronik, mainan, mesin, perangkat medis, alat pelindung." },
    { de: "Exporteure benötigen technische Dokumentation, EU-Konformitätserklärung und ggf. einen Notified Body.", en: "Exporters need technical documentation, EU declaration of conformity and possibly a Notified Body.", id: "Eksportir memerlukan dokumentasi teknis, deklarasi kesesuaian EU, dan mungkin Notified Body." },
    { de: "Ohne CE-Kennzeichnung darf das Produkt nicht im EU-Binnenmarkt verkauft werden.", en: "Without CE marking, the product may not be sold in the EU internal market.", id: "Tanpa penandaan CE, produk tidak boleh dijual di pasar internal EU." },
  ],
  esg: [
    { de: "Die CSRD verpflichtet EU-Unternehmen zur ESG-Berichterstattung nach dem ESRS-Standard.", en: "The CSRD requires EU companies to report on ESG topics according to the ESRS standard.", id: "CSRD mewajibkan perusahaan EU melaporkan topik ESG sesuai standar ESRS." },
    { de: "Indonesische Lieferanten sind indirekt betroffen: EU-Großunternehmen müssen Lieferkettendaten offenlegen.", en: "Indonesian suppliers are indirectly affected: EU large companies must disclose supply chain data.", id: "Pemasok Indonesia terdampak tidak langsung: perusahaan besar EU harus mengungkapkan data rantai pasok." },
    { de: "Wichtige ESG-Themen: CO₂-Emissionen, Wasserverbrauch, Arbeitsbedingungen, Diversität, Anti-Korruption.", en: "Key ESG topics: CO₂ emissions, water consumption, working conditions, diversity, anti-corruption.", id: "Topik ESG utama: emisi CO₂, konsumsi air, kondisi kerja, keberagaman, anti-korupsi." },
    { de: "KMU-Exporteure sollten proaktiv CO₂-, Energie- und Arbeitsdaten erfassen, um EU-Kundenanfragen zu beantworten.", en: "SME exporters should proactively collect CO₂, energy and labour data to respond to EU customer requests.", id: "Eksportir UKM harus proaktif mengumpulkan data CO₂, energi, dan tenaga kerja untuk merespons permintaan pelanggan EU." },
  ],
};

export default function LearningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? "en";
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [moduleCompleted, setModuleCompleted] = useState(false);

  const detail = MODULE_DETAILS.find((m) => m.id === id);
  const points = KEY_POINTS[id ?? ""] ?? [];

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(COMPLETION_KEY).then((val) => {
        const map = val ? JSON.parse(val) : {};
        setModuleCompleted(!!map[id ?? ""]);
      });
      AsyncStorage.getItem(QUIZ_KEY).then((val) => {
        const map = val ? JSON.parse(val) : {};
        if (map[id ?? ""]?.done) {
          setQuizDone(true);
          setAnswers(map[id ?? ""].answers ?? []);
        }
      });
    }, [id])
  );

  if (!detail) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>Modul nicht gefunden.</Text>
      </View>
    );
  }

  const markCompleted = async (completed: boolean) => {
    const val = await AsyncStorage.getItem(COMPLETION_KEY);
    const map = val ? JSON.parse(val) : {};
    map[id ?? ""] = completed;
    await AsyncStorage.setItem(COMPLETION_KEY, JSON.stringify(map));
    setModuleCompleted(completed);
  };

  // ── Quiz logic ──
  const currentQ = detail.quiz[quizIndex];
  const isAnswered = selected !== null;

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
  };

  const handleNext = async () => {
    const isCorrect = selected === currentQ.correct;
    const newAnswers = [...answers, isCorrect];

    if (quizIndex < detail.quiz.length - 1) {
      setAnswers(newAnswers);
      setQuizIndex(quizIndex + 1);
      setSelected(null);
    } else {
      // Quiz finished
      const passed = newAnswers.filter(Boolean).length >= 2;
      setAnswers(newAnswers);
      setQuizDone(true);
      const val = await AsyncStorage.getItem(QUIZ_KEY);
      const map = val ? JSON.parse(val) : {};
      map[id ?? ""] = { done: true, answers: newAnswers };
      await AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(map));
      if (passed) markCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelected(null);
    setAnswers([]);
    setQuizDone(false);
  };

  const correctCount = answers.filter(Boolean).length;
  const passed = correctCount >= 2;

  // ── Tabs ──
  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: t("learning.tabOverview") },
    { key: "videos", label: t("learning.tabVideos") },
    { key: "quiz", label: t("learning.tabQuiz") },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header */}
        <View style={{ backgroundColor: colors.primaryStrong, paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name="chevron-back" size={20} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary + "CC", fontSize: 13, marginLeft: 4 }}>{t("learning.backToHub")}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ backgroundColor: colors.onPrimary + "26", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 6 }}>
                <Text style={{ color: colors.onPrimary + "CC", fontSize: 11, fontFamily: "monospace" }}>{detail.regulation}</Text>
              </View>
              <Text style={{ color: colors.onPrimary, fontSize: 18, fontWeight: "bold" }} numberOfLines={2}>
                {t(`learning.modules.${id}.title` as any, { defaultValue: id })}
              </Text>
            </View>
            {moduleCompleted && (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="checkmark-circle" size={28} color={colors.onPrimary} />
                <Text style={{ color: colors.onPrimary + "AA", fontSize: 10, marginTop: 2 }}>{t("learning.completed")}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tab bar */}
        <View style={{ flexDirection: "row", backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.surfaceAlt }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.key ? colors.primary : "transparent",
              }}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={{ color: activeTab === tab.key ? colors.primary : colors.textSecondary, fontSize: 13, fontWeight: activeTab === tab.key ? "700" : "400" }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <View>
              <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
                {t("learning.keyPoints")}
              </Text>
              {points.map((point, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary + "1A", alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0, marginTop: 1 }}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21, flex: 1 }}>{point[lang]}</Text>
                </View>
              ))}

              {/* Complete toggle */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                  backgroundColor: moduleCompleted ? colors.primary + "1A" : colors.surfaceAlt,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  alignSelf: "flex-start",
                  borderWidth: 1,
                  borderColor: moduleCompleted ? colors.primary + "60" : colors.border,
                }}
                onPress={() => markCompleted(!moduleCompleted)}
              >
                <Ionicons name={moduleCompleted ? "checkmark-circle" : "ellipse-outline"} size={17} color={moduleCompleted ? colors.primary : colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={{ color: moduleCompleted ? colors.primary : colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                  {moduleCompleted ? t("learning.completed") : t("learning.markDone")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── VIDEOS TAB ── */}
          {activeTab === "videos" && (
            <View>
              <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
                {t("learning.tabVideos")}
              </Text>
              {detail.videos.map((video, i) => (
                <View
                  key={i}
                  style={{ backgroundColor: colors.card, borderRadius: 16, marginBottom: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.surfaceAlt }}
                >
                  {/* Thumbnail placeholder */}
                  <View style={{ height: 160, backgroundColor: colors.primaryStrong, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="play" size={26} color="#fff" style={{ marginLeft: 4 }} />
                    </View>
                    <View style={{ position: "absolute", bottom: 10, right: 10, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{video.duration}</Text>
                    </View>
                  </View>

                  <View style={{ padding: 14 }}>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14, marginBottom: 5 }}>{video.title[lang]}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 12 }}>{video.description[lang]}</Text>
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, alignSelf: "flex-start" }}
                      onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(video.youtubeQuery)}`)}
                    >
                      <Ionicons name="logo-youtube" size={15} color={colors.onPrimary} style={{ marginRight: 6 }} />
                      <Text style={{ color: colors.onPrimary, fontSize: 13, fontWeight: "600" }}>{t("learning.watchVideo")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── QUIZ TAB ── */}
          {activeTab === "quiz" && (
            <View>
              {!quizDone ? (
                <>
                  {/* Progress dots */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 6 }}>
                    {detail.quiz.map((_, i) => (
                      <View key={i} style={{ height: 6, flex: 1, borderRadius: 3, backgroundColor: i < quizIndex ? colors.primary : i === quizIndex ? colors.primary + "80" : colors.surfaceAlt }} />
                    ))}
                  </View>

                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
                    {t("learning.tabQuiz")} {quizIndex + 1}/{detail.quiz.length}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 23, marginBottom: 20 }}>
                    {currentQ.question[lang]}
                  </Text>

                  {currentQ.options[lang].map((option, i) => {
                    let bg = colors.card;
                    let border = colors.surfaceAlt;
                    let textColor = colors.text;
                    if (isAnswered) {
                      if (i === currentQ.correct) { bg = colors.success + "1A"; border = colors.success; textColor = colors.success; }
                      else if (i === selected) { bg = colors.error + "1A"; border = colors.error; textColor = colors.error; }
                    } else if (i === selected) { bg = colors.primary + "1A"; border = colors.primary; }

                    return (
                      <TouchableOpacity
                        key={i}
                        style={{ backgroundColor: bg, borderWidth: 1.5, borderColor: border, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}
                        onPress={() => handleAnswer(i)}
                        disabled={isAnswered}
                      >
                        <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: border, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                          {isAnswered && i === currentQ.correct && <Ionicons name="checkmark" size={16} color={colors.success} />}
                          {isAnswered && i === selected && i !== currentQ.correct && <Ionicons name="close" size={16} color={colors.error} />}
                          {(!isAnswered || (i !== currentQ.correct && i !== selected)) && (
                            <Text style={{ color: textColor, fontSize: 13, fontWeight: "600" }}>{String.fromCharCode(65 + i)}</Text>
                          )}
                        </View>
                        <Text style={{ color: textColor, fontSize: 14, flex: 1, lineHeight: 20 }}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Explanation */}
                  {isAnswered && (
                    <View style={{ backgroundColor: colors.info + "1A", borderRadius: 14, padding: 14, marginTop: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.info + "40" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                        <Ionicons name="information-circle" size={16} color={colors.info} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.info, fontWeight: "700", fontSize: 13 }}>{t("learning.explanation")}</Text>
                      </View>
                      <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>{currentQ.explanation[lang]}</Text>
                    </View>
                  )}

                  {isAnswered && (
                    <TouchableOpacity
                      style={{ backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 13, alignItems: "center" }}
                      onPress={handleNext}
                    >
                      <Text style={{ color: colors.onPrimary, fontWeight: "700", fontSize: 15 }}>{t("learning.next")}</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                /* Quiz result */
                <View style={{ alignItems: "center", paddingTop: 20 }}>
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: passed ? colors.success + "1A" : colors.error + "1A", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Ionicons name={passed ? "trophy" : "refresh-circle"} size={40} color={passed ? colors.success : colors.error} />
                  </View>
                  <Text style={{ color: passed ? colors.success : colors.error, fontSize: 20, fontWeight: "bold", marginBottom: 6 }}>
                    {passed ? t("learning.quizPassed") : t("learning.quizFailed")}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 15, marginBottom: 24 }}>
                    {correctCount} {t("learning.quizScore")}
                  </Text>

                  {/* Per-question review */}
                  {detail.quiz.map((q, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 10, backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: answers[i] ? colors.success + "40" : colors.error + "40" }}>
                      <Ionicons name={answers[i] ? "checkmark-circle" : "close-circle"} size={20} color={answers[i] ? colors.success : colors.error} style={{ marginRight: 10 }} />
                      <Text style={{ color: colors.text, fontSize: 13, flex: 1 }} numberOfLines={2}>{q.question[lang]}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={{ backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 13, paddingHorizontal: 32, marginTop: 8 }}
                    onPress={resetQuiz}
                  >
                    <Text style={{ color: colors.onPrimary, fontWeight: "700", fontSize: 15 }}>{t("learning.retryQuiz")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </>
  );
}
