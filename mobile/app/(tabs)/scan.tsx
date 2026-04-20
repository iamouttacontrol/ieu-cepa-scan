import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { storage, ScanResult, DimensionScore, ActionItem, GapPriority } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

type ResponseValue = 0 | 1 | 2;
type DimensionKey = "d1" | "d2" | "d3" | "d4" | "d5" | "d6";
const DIMENSION_KEYS: DimensionKey[] = ["d1", "d2", "d3", "d4", "d5", "d6"];

interface ScanFormData {
  company_name: string;
  sector: string;
  company_size: string;
  region: string;
  product_type: string;
  hs_code: string;
  target_country: string;
  export_experience: string;
}

interface AnalysisResult {
  score: number;
  risk_level: string;
  missing_requirements: string[];
  completed_requirements: string[];
  action_plan: string[];
  action_items: ActionItem[];
  dimension_scores: DimensionScore[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcDimensionScore(responses: ResponseValue[]): number {
  const sum = responses.reduce((a, b) => a + b, 0);
  const max = responses.length * 2;
  return max > 0 ? Math.round((sum / max) * 100) : 0;
}

function getWeights(sector: string): Record<DimensionKey, number> {
  const s = sector.toLowerCase();
  if (["lebensmittel", "food", "getränke", "beverage", "agri", "pangan"].some((x) => s.includes(x)))
    return { d1: 0.10, d2: 0.25, d3: 0.20, d4: 0.10, d5: 0.20, d6: 0.15 };
  if (["textil", "apparel", "pakaian", "fashion"].some((x) => s.includes(x)))
    return { d1: 0.20, d2: 0.20, d3: 0.20, d4: 0.10, d5: 0.15, d6: 0.15 };
  if (["elektronik", "electronic", "tech"].some((x) => s.includes(x)))
    return { d1: 0.30, d2: 0.10, d3: 0.05, d4: 0.20, d5: 0.20, d6: 0.15 };
  if (["möbel", "wood", "furniture", "kayu", "holz"].some((x) => s.includes(x)))
    return { d1: 0.20, d2: 0.25, d3: 0.20, d4: 0.05, d5: 0.15, d6: 0.15 };
  const w = 1 / 6;
  return { d1: w, d2: w, d3: w, d4: w, d5: w, d6: w };
}

function classifyGap(score: number): GapPriority {
  if (score < 40) return "critical";
  if (score < 60) return "significant";
  if (score < 80) return "monitored";
  return "good";
}

function getRiskColorFromColors(
  riskLevel: string,
  colors: { error: string; warning: string; success: string; textSecondary: string }
): string {
  const l = riskLevel?.toLowerCase();
  if (l === "hoch" || l === "high") return colors.error;
  if (l === "mittel" || l === "medium") return colors.warning;
  if (l === "niedrig" || l === "low") return colors.success;
  return colors.textSecondary;
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
}

function Dropdown({ label, value, options, onSelect }: DropdownProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13, marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity
        style={{
          borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface,
          flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        }}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ color: colors.text, fontSize: 15 }}>{value}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <>
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: -1000, right: -1000, bottom: -1000, backgroundColor: colors.overlay, zIndex: 1 }}
            onPress={() => setOpen(false)}
            activeOpacity={1}
          />
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginTop: 4, backgroundColor: colors.surface, overflow: "hidden", zIndex: 2 }}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={opt}
                style={{
                  paddingHorizontal: 16, paddingVertical: 11,
                  backgroundColor: value === opt ? colors.secondary + "1A" : colors.surface,
                  borderBottomWidth: idx < options.length - 1 ? 1 : 0,
                  borderBottomColor: colors.surfaceAlt,
                }}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={{ fontSize: 15, color: value === opt ? colors.secondary : colors.text, fontWeight: value === opt ? "600" : "400" }}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── Score Circle ──────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const { colors } = useTheme();
  const color = score >= 70 ? colors.success : score >= 40 ? colors.warning : colors.error;
  return (
    <View style={{ alignItems: "center", marginVertical: 16 }}>
      <View style={{ width: 128, height: 128, borderRadius: 64, alignItems: "center", justifyContent: "center", borderWidth: 8, borderColor: color }}>
        <Text style={{ fontSize: 40, fontWeight: "bold", color }}>{score}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>/ 100</Text>
      </View>
    </View>
  );
}

// ── Gap Priority Badge ────────────────────────────────────────────────────────

function GapBadge({ priority }: { priority: GapPriority }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const colorMap: Record<GapPriority, string> = {
    critical: colors.error,
    significant: colors.warning,
    monitored: colors.primary,
    good: colors.success,
  };
  const c = colorMap[priority];
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: c + "22" }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: c }}>
        {t(`scan.gap.${priority}`)}
      </Text>
    </View>
  );
}

// ── Dimension Score Bar ───────────────────────────────────────────────────────

function DimensionBar({ dim }: { dim: DimensionScore }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const colorMap: Record<GapPriority, string> = {
    critical: colors.error,
    significant: colors.warning,
    monitored: colors.primary,
    good: colors.success,
  };
  const barColor = colorMap[dim.priority];
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: colors.text, fontWeight: "600", flex: 1 }} numberOfLines={1}>{dim.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <GapBadge priority={dim.priority} />
          <Text style={{ fontSize: 12, color: colors.textSecondary, width: 36, textAlign: "right" }}>{dim.score}%</Text>
        </View>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${dim.score}%`, backgroundColor: barColor, borderRadius: 3 }} />
      </View>
    </View>
  );
}

// ── 3-Point Response Row ──────────────────────────────────────────────────────

interface ResponseRowProps {
  question: string;
  value: ResponseValue;
  onChange: (v: ResponseValue) => void;
  responseLabels: string[];
}

function ResponseRow({ question, value, onChange, responseLabels }: ResponseRowProps) {
  const { colors } = useTheme();
  const optColors: [string, string, string] = [colors.error, colors.warning, colors.success];
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, color: colors.text, lineHeight: 19, marginBottom: 8 }}>{question}</Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {([0, 1, 2] as ResponseValue[]).map((v) => {
          const isSelected = value === v;
          return (
            <TouchableOpacity
              key={v}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", justifyContent: "center",
                borderWidth: 1.5,
                backgroundColor: isSelected ? optColors[v] + "22" : colors.surface,
                borderColor: isSelected ? optColors[v] : colors.border,
              }}
              onPress={() => onChange(v)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 11, fontWeight: isSelected ? "700" : "400", color: isSelected ? optColors[v] : colors.textSecondary, textAlign: "center" }}>
                {responseLabels[v]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Dimension Section ─────────────────────────────────────────────────────────

interface DimensionSectionProps {
  dimKey: DimensionKey;
  responses: ResponseValue[];
  onUpdate: (idx: number, val: ResponseValue) => void;
  responseLabels: string[];
}

function DimensionSection({ dimKey, responses, onUpdate, responseLabels }: DimensionSectionProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const dimData = t(`scan.dimensions.${dimKey}`, { returnObjects: true }) as {
    name: string;
    desc: string;
    questions: string[];
  };

  const score = calcDimensionScore(responses);
  const answered = responses.filter((r) => r > 0).length;
  const scoreColor = score >= 70 ? colors.success : score >= 40 ? colors.warning : colors.error;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", padding: 14 }}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{dimData.name}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{dimData.desc}</Text>
        </View>
        <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "bold", color: scoreColor }}>{score}%</Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary }}>{answered}/{responses.length}</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }}>
          {dimData.questions.map((q, idx) => (
            <ResponseRow
              key={idx}
              question={`${idx + 1}. ${q}`}
              value={responses[idx] ?? 0}
              onChange={(v) => onUpdate(idx, v)}
              responseLabels={responseLabels}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>{title}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>{subtitle}</Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const SECTORS = t("scan.options.sectors", { returnObjects: true }) as string[];
  const COMPANY_SIZES = t("scan.options.companySizes", { returnObjects: true }) as string[];
  const TARGET_COUNTRIES = t("scan.options.targetCountries", { returnObjects: true }) as string[];
  const EXPORT_EXPERIENCES = t("scan.options.exportExperiences", { returnObjects: true }) as string[];
  const RESPONSE_LABELS = t("scan.dimensionResponseLabels", { returnObjects: true }) as string[];

  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const STEP_LABELS = [
    t("scan.step.company"),
    t("scan.step.product"),
    t("scan.step.compliance"),
    t("scan.step.results"),
  ];

  const labelStyle = { color: colors.text, fontWeight: "600" as const, fontSize: 13, marginBottom: 6 };
  const inputStyle = {
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, color: colors.text,
    fontSize: 15, backgroundColor: colors.surface, marginBottom: 16,
  };

  const defaultForm = (): ScanFormData => ({
    company_name: user?.company ?? "",
    sector: user?.sector ?? SECTORS[0],
    company_size: COMPANY_SIZES[1],
    region: "",
    product_type: "",
    hs_code: "",
    target_country: TARGET_COUNTRIES[0],
    export_experience: EXPORT_EXPERIENCES[0],
  });

  const defaultDimResponses = (): Record<DimensionKey, ResponseValue[]> => ({
    d1: [0, 0, 0, 0],
    d2: [0, 0, 0, 0],
    d3: [0, 0, 0, 0],
    d4: [0, 0, 0, 0],
    d5: [0, 0, 0, 0],
    d6: [0, 0, 0, 0],
  });

  const [form, setForm] = useState<ScanFormData>(defaultForm);
  const [dimResponses, setDimResponses] = useState<Record<DimensionKey, ResponseValue[]>>(defaultDimResponses);

  const update = (key: keyof ScanFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDimResponse = (dim: DimensionKey, idx: number, val: ResponseValue) => {
    setDimResponses((prev) => {
      const updated = [...prev[dim]] as ResponseValue[];
      updated[idx] = val;
      return { ...prev, [dim]: updated };
    });
  };

  const getRiskLabel = (riskLevel: string): string => {
    const l = riskLevel?.toLowerCase();
    if (l === "high") return t("common.risk.high");
    if (l === "medium") return t("common.risk.medium");
    if (l === "low") return t("common.risk.low");
    return riskLevel ?? "–";
  };

  const getRiskColor = (riskLevel: string) => getRiskColorFromColors(riskLevel, colors);

  const handleNext = () => {
    if (step === 0 && !form.company_name.trim()) {
      Alert.alert(t("scan.missingFieldTitle"), t("scan.missingField.company"));
      return;
    }
    if (step === 1 && !form.product_type.trim()) {
      Alert.alert(t("scan.missingFieldTitle"), t("scan.missingField.product"));
      return;
    }
    if (step === 2) {
      runAnalysis();
      return;
    }
    setStep((s) => s + 1);
  };

  const runAnalysis = async () => {
    // Compute dimension scores deterministically — no API call needed
    const weights = getWeights(form.sector);
    const dimScores: DimensionScore[] = DIMENSION_KEYS.map((key) => {
      const score = calcDimensionScore(dimResponses[key]);
      const weight = weights[key];
      return {
        id: key,
        name: (t(`scan.dimensions.${key}`, { returnObjects: true }) as { name: string }).name,
        score,
        weight,
        priority: classifyGap(score),
      };
    });

    const overallScore = Math.round(dimScores.reduce((sum, d) => sum + d.score * d.weight, 0));
    const riskLevel = overallScore >= 70 ? "Low" : overallScore >= 40 ? "Medium" : "High";

    // Build action items from predefined recommendations for gap dimensions
    type RecEntry = { text: string; effort: string };
    const actionItems: ActionItem[] = [];
    const completed: string[] = [];
    const missing: string[] = [];

    for (const dim of dimScores) {
      const recs = t(`scan.actionRecommendations.${dim.id}`, { returnObjects: true }) as RecEntry[];
      if (dim.priority === "good") {
        completed.push(dim.name);
      } else {
        missing.push(dim.name);
        // Include all 4 recs for critical, top 2 for significant, top 1 for monitored
        const count = dim.priority === "critical" ? 4 : dim.priority === "significant" ? 2 : 1;
        for (let i = 0; i < Math.min(count, recs.length); i++) {
          actionItems.push({
            text: recs[i].text,
            dimension: dim.id.toUpperCase(),
            effort: recs[i].effort as ActionItem["effort"],
            priority: dim.priority,
          });
        }
      }
    }

    // Sort: critical first, then significant, then monitored
    const priorityOrder: Record<GapPriority, number> = { critical: 0, significant: 1, monitored: 2, good: 3 };
    actionItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const finalResult: AnalysisResult = {
      score: overallScore,
      risk_level: riskLevel,
      completed_requirements: completed,
      missing_requirements: missing,
      action_plan: actionItems.map((i) => i.text),
      action_items: actionItems,
      dimension_scores: dimScores,
    };

    setResult(finalResult);
    setStep(3);

    const scanRecord: ScanResult = {
      id: Date.now().toString(),
      company_name: form.company_name,
      product_type: form.product_type,
      score: finalResult.score,
      risk_level: finalResult.risk_level,
      missing_requirements: finalResult.missing_requirements,
      completed_requirements: finalResult.completed_requirements,
      action_plan: finalResult.action_plan,
      action_items: finalResult.action_items,
      dimension_scores: dimScores,
      created_at: new Date().toISOString(),
    };
    await storage.addScan(scanRecord);
  };

  const resetScan = () => {
    setStep(0);
    setResult(null);
    setForm(defaultForm());
    setDimResponses(defaultDimResponses());
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ backgroundColor: colors.primaryStrong, paddingTop: insets.top + 12, paddingBottom: 20, paddingHorizontal: 20 }}>
          <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: "bold" }}>{t("scan.title")}</Text>
          <Text style={{ color: colors.onPrimary + "AA", fontSize: 12, marginTop: 2 }}>{t("scan.subtitle")}</Text>
          <View style={{ flexDirection: "row", marginTop: 16, gap: 6 }}>
            {STEP_LABELS.map((label, idx) => (
              <View key={label} style={{ flex: 1 }}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: idx <= step ? colors.onPrimary : colors.onPrimary + "4D" }} />
                <Text
                  style={{ textAlign: "center", fontSize: 10, marginTop: 4, color: idx === step ? colors.onPrimary : colors.onPrimary + "AA", fontWeight: idx === step ? "700" : "400" }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }} keyboardShouldPersistTaps="handled">

            {/* ── Step 0: Company ── */}
            {step === 0 && (
              <View>
                <SectionHeader title={t("scan.step.company")} subtitle={t("scan.companySubtitle")} />
                <Text style={labelStyle}>{t("scan.companyName")}</Text>
                <TextInput
                  style={inputStyle}
                  placeholder={t("scan.companyNamePlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={form.company_name}
                  onChangeText={(v) => update("company_name", v)}
                />
                <Dropdown label={t("scan.sector")} value={form.sector} options={SECTORS} onSelect={(v) => update("sector", v)} />
                <Dropdown label={t("scan.companySize")} value={form.company_size} options={COMPANY_SIZES} onSelect={(v) => update("company_size", v)} />
                <Text style={labelStyle}>{t("scan.region")}</Text>
                <TextInput
                  style={inputStyle}
                  placeholder={t("scan.regionPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={form.region}
                  onChangeText={(v) => update("region", v)}
                />
              </View>
            )}

            {/* ── Step 1: Product & Market ── */}
            {step === 1 && (
              <View>
                <SectionHeader title={t("scan.step.product")} subtitle={t("scan.productSubtitle")} />
                <Text style={labelStyle}>{t("scan.productType")}</Text>
                <TextInput
                  style={inputStyle}
                  placeholder={t("scan.productTypePlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={form.product_type}
                  onChangeText={(v) => update("product_type", v)}
                />
                <Text style={labelStyle}>{t("scan.hsCode")}</Text>
                <TextInput
                  style={inputStyle}
                  placeholder={t("scan.hsCodePlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={form.hs_code}
                  onChangeText={(v) => update("hs_code", v)}
                />
                <Dropdown label={t("scan.targetCountry")} value={form.target_country} options={TARGET_COUNTRIES} onSelect={(v) => update("target_country", v)} />
                <Dropdown label={t("scan.exportExperience")} value={form.export_experience} options={EXPORT_EXPERIENCES} onSelect={(v) => update("export_experience", v)} />
              </View>
            )}

            {/* ── Step 2: Dimension Assessment ── */}
            {step === 2 && (
              <View>
                <SectionHeader title={t("scan.dimensionTitle")} subtitle={t("scan.dimensionSubtitle")} />
                {DIMENSION_KEYS.map((key) => (
                  <DimensionSection
                    key={key}
                    dimKey={key}
                    responses={dimResponses[key]}
                    onUpdate={(idx, val) => updateDimResponse(key, idx, val)}
                    responseLabels={RESPONSE_LABELS}
                  />
                ))}
              </View>
            )}

            {/* ── Step 3: Results ── */}
            {step === 3 && (
              <View>
                {result && (
                  <View>
                    <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18, textAlign: "center" }}>
                      {t("scan.results")}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 8 }}>
                      {form.company_name} · {form.product_type}
                    </Text>

                    <ScoreCircle score={result.score} />

                    <View style={{ alignItems: "center", marginBottom: 20 }}>
                      <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: getRiskColor(result.risk_level) + "22" }}>
                        <Text style={{ fontWeight: "bold", fontSize: 14, color: getRiskColor(result.risk_level) }}>
                          {t("scan.riskLevel")}: {getRiskLabel(result.risk_level)}
                        </Text>
                      </View>
                    </View>

                    {/* Dimension Scores */}
                    {result.dimension_scores && result.dimension_scores.length > 0 && (
                      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 14, fontSize: 14 }}>
                          {t("scan.gapDiagnosis")}
                        </Text>
                        {result.dimension_scores.map((dim) => (
                          <DimensionBar key={dim.id} dim={dim} />
                        ))}
                        {/* Legend */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                          {(["critical", "significant", "monitored", "good"] as GapPriority[]).map((p) => (
                            <GapBadge key={p} priority={p} />
                          ))}
                        </View>
                      </View>
                    )}

                    {result.completed_requirements.length > 0 && (
                      <View style={{ backgroundColor: colors.success + "1A", borderWidth: 1, borderColor: colors.success + "40", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: colors.success, fontWeight: "bold", marginBottom: 10 }}>
                          {t("scan.completedReqs")} ({result.completed_requirements.length})
                        </Text>
                        {result.completed_requirements.map((req, i) => (
                          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginTop: 1, marginRight: 8 }} />
                            <Text style={{ color: colors.text, fontSize: 13, flex: 1, lineHeight: 19 }}>{req}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {result.missing_requirements.length > 0 && (
                      <View style={{ backgroundColor: colors.error + "1A", borderWidth: 1, borderColor: colors.error + "40", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: colors.error, fontWeight: "bold", marginBottom: 10 }}>
                          {t("scan.missingReqs")} ({result.missing_requirements.length})
                        </Text>
                        {result.missing_requirements.map((req, i) => (
                          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                            <Ionicons name="close-circle" size={16} color={colors.error} style={{ marginTop: 1, marginRight: 8 }} />
                            <Text style={{ color: colors.text, fontSize: 13, flex: 1, lineHeight: 19 }}>{req}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {result.action_plan.length > 0 && (
                      <View style={{ backgroundColor: colors.primary + "1A", borderWidth: 1, borderColor: colors.primary + "40", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: colors.primary, fontWeight: "bold", marginBottom: 10 }}>
                          {t("scan.actionPlanTitle")} ({result.action_plan.length} {t("scan.steps")})
                        </Text>
                        {result.action_plan.map((item, i) => (
                          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 }}>
                              <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: "bold" }}>{i + 1}</Text>
                            </View>
                            <Text style={{ color: colors.text, fontSize: 13, flex: 1, lineHeight: 19 }}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 10 }}
                      onPress={() => router.push("/(tabs)/action-plan")}
                    >
                      <Text style={{ color: colors.buttonText, fontWeight: "bold", fontSize: 16 }}>{t("scan.openActionPlan")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 32 }}
                      onPress={resetScan}
                    >
                      <Text style={{ color: colors.buttonSecondaryText, fontWeight: "600", fontSize: 16 }}>{t("scan.newScan")}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Navigation Buttons */}
            {step < 3 && (
              <View style={{ flexDirection: "row", gap: 12, marginTop: 16, marginBottom: 40 }}>
                {step > 0 && (
                  <TouchableOpacity
                    style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
                    onPress={() => setStep((s) => s - 1)}
                  >
                    <Text style={{ color: colors.buttonSecondaryText, fontWeight: "600", fontSize: 15 }}>{t("scan.back")}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
                  onPress={handleNext}
                >
                  <Text style={{ color: colors.buttonText, fontWeight: "bold", fontSize: 15 }}>
                    {step === 2 ? t("scan.analyzeBtn") : t("scan.next")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}
