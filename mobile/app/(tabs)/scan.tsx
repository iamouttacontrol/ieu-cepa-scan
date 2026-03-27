import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "@/constants/api";
import { storage, ScanResult } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

const SECTORS = [
  "Herstellung",
  "Textil & Bekleidung",
  "Lebensmittel & Getränke",
  "Elektronik",
  "Möbel & Holz",
  "Chemikalien",
  "Landwirtschaft",
  "Sonstiges",
];

const COMPANY_SIZES = ["Mikro (<10)", "Klein (10-49)", "Mittel (50-249)", "Groß (250+)"];
const TARGET_COUNTRIES = [
  "Deutschland",
  "Niederlande",
  "Frankreich",
  "Italien",
  "Spanien",
  "Polen",
  "Schweden",
  "Andere EU",
];
const EXPORT_EXPERIENCES = ["Keine", "1-2 Jahre", "3-5 Jahre", "5+ Jahre"];

interface ScanFormData {
  company_name: string;
  sector: string;
  company_size: string;
  region: string;
  product_type: string;
  hs_code: string;
  target_country: string;
  export_experience: string;
  compliance_dpp: boolean;
  compliance_eudr: boolean;
  compliance_ce: boolean;
  compliance_esg: boolean;
  compliance_origin: boolean;
  compliance_food_safety: boolean;
}

interface AnalysisResult {
  score: number;
  risk_level: string;
  missing_requirements: string[];
  completed_requirements: string[];
  action_plan: string[];
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
}

function Dropdown({ label, value, options, onSelect }: DropdownProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const labelStyle = {
    color: colors.text,
    fontWeight: "600" as const,
    fontSize: 13,
    marginBottom: 6,
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.surface,
    marginBottom: 16,
  };

  const dropdownStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: colors.surface,
    overflow: "hidden" as const,
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={labelStyle}>{label}</Text>
      <TouchableOpacity
        style={[inputStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ color: colors.text, fontSize: 15 }}>{value}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: -1000,
              right: -1000,
              bottom: -1000,
              backgroundColor: colors.overlay,
              zIndex: 1,
            }}
            onPress={() => setOpen(false)}
            activeOpacity={1}
          />
          <View style={[dropdownStyle, { zIndex: 2 }]}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={opt}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  backgroundColor: value === opt ? colors.secondary + "1A" : colors.surface,
                  borderBottomWidth: idx < options.length - 1 ? 1 : 0,
                  borderBottomColor: colors.surfaceAlt,
                }}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
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

// ─── Checkbox Item ────────────────────────────────────────────────────────────

interface CheckboxItemProps {
  label: string;
  sublabel: string;
  value: boolean;
  onToggle: () => void;
}

function CheckboxItem({ label, sublabel, value, onToggle }: CheckboxItemProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1.5,
        backgroundColor: value ? colors.primary + "1A" : colors.surface,
        borderColor: value ? colors.primary : colors.border,
      }}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          borderWidth: 2,
          marginRight: 12,
          marginTop: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: value ? colors.primary : "transparent",
          borderColor: value ? colors.primary : colors.textSecondary,
        }}
      >
        {value && <Ionicons name="checkmark" size={12} color={colors.onPrimary} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "600", fontSize: 13, color: value ? colors.primary : colors.text }}>
          {label}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 }}>
          {sublabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Score Circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const { colors } = useTheme();
  const color = score >= 70 ? colors.success : score >= 40 ? colors.warning : colors.error;
  return (
    <View style={{ alignItems: "center", marginVertical: 16 }}>
      <View
        style={{
          width: 128,
          height: 128,
          borderRadius: 64,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 8,
          borderColor: color,
        }}
      >
        <Text style={{ fontSize: 40, fontWeight: "bold", color }}>{score}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>/ 100</Text>
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRiskColorFromColors(riskLevel: string, colors: { error: string; warning: string; success: string; textSecondary: string }): string {
  const l = riskLevel?.toLowerCase();
  if (l === "hoch" || l === "high") return colors.error;
  if (l === "mittel" || l === "medium") return colors.warning;
  if (l === "niedrig" || l === "low") return colors.success;
  return colors.textSecondary;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const STEP_LABELS = [
    t("scan.step.company"),
    t("scan.step.product"),
    t("scan.step.compliance"),
    t("scan.step.results"),
  ];

  const labelStyle = {
    color: colors.text,
    fontWeight: "600" as const,
    fontSize: 13,
    marginBottom: 6,
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.surface,
    marginBottom: 16,
  };

  const getRiskLabel = (riskLevel: string): string => {
    const l = riskLevel?.toLowerCase();
    if (l === "high") return t("common.risk.high");
    if (l === "medium") return t("common.risk.medium");
    if (l === "low") return t("common.risk.low");
    return riskLevel ?? "–";
  };

  const getRiskColor = (riskLevel: string) => getRiskColorFromColors(riskLevel, colors);

  const defaultForm = (): ScanFormData => ({
    company_name: user?.company ?? "",
    sector: user?.sector ?? SECTORS[0],
    company_size: COMPANY_SIZES[1],
    region: "",
    product_type: "",
    hs_code: "",
    target_country: TARGET_COUNTRIES[0],
    export_experience: EXPORT_EXPERIENCES[0],
    compliance_dpp: false,
    compliance_eudr: false,
    compliance_ce: false,
    compliance_esg: false,
    compliance_origin: false,
    compliance_food_safety: false,
  });

  const [form, setForm] = useState<ScanFormData>(defaultForm);

  const update = (key: keyof ScanFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
    setStep(3);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-readiness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          sector: form.sector,
          company_size: form.company_size,
          product_type: form.product_type,
          hs_code: form.hs_code,
          target_country: form.target_country,
          export_experience: form.export_experience,
          compliance_dpp: form.compliance_dpp,
          compliance_eudr: form.compliance_eudr,
          compliance_ce: form.compliance_ce,
          compliance_esg: form.compliance_esg,
          compliance_origin: form.compliance_origin,
          compliance_food_safety: form.compliance_food_safety,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server-Fehler: ${response.status}`);
      }

      const res: AnalysisResult = await response.json();
      setResult(res);

      const scanRecord: ScanResult = {
        id: Date.now().toString(),
        company_name: form.company_name,
        product_type: form.product_type,
        score: res.score,
        risk_level: res.risk_level,
        missing_requirements: res.missing_requirements,
        completed_requirements: res.completed_requirements,
        action_plan: res.action_plan,
        created_at: new Date().toISOString(),
      };
      await storage.addScan(scanRecord);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
      Alert.alert(
        t("scan.analyzeErrorTitle"),
        `${t("scan.analyzeErrorText")}\n\nDetails: ${msg}`,
        [{ text: t("scan.back"), onPress: () => setStep(2) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setStep(0);
    setResult(null);
    setForm(defaultForm());
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header — OUTSIDE KAV, never moves */}
        <View style={{ backgroundColor: colors.primaryStrong, paddingTop: insets.top + 12, paddingBottom: 20, paddingHorizontal: 20 }}>
          <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: "bold" }}>{t("scan.title")}</Text>
          <Text style={{ color: colors.onPrimary + "AA", fontSize: 12, marginTop: 2 }}>{t("scan.subtitle")}</Text>

          {/* Step progress */}
          <View style={{ flexDirection: "row", marginTop: 16, gap: 6 }}>
            {STEP_LABELS.map((label, idx) => (
              <View key={label} style={{ flex: 1 }}>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: idx <= step ? colors.onPrimary : colors.onPrimary + "4D",
                  }}
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 10,
                    marginTop: 4,
                    color: idx === step ? colors.onPrimary : colors.onPrimary + "AA",
                    fontWeight: idx === step ? "700" : "400",
                  }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* KAV wraps ONLY the scroll area */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }} keyboardShouldPersistTaps="handled">
            {/* ── Step 0: Company Profile ── */}
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

            {/* ── Step 2: Compliance ── */}
            {step === 2 && (
              <View>
                <SectionHeader title={t("scan.complianceTitle")} subtitle={t("scan.complianceSubtitle")} />

                <CheckboxItem
                  label={t("scan.compliance.dpp")}
                  sublabel={t("scan.compliance.dppSub")}
                  value={form.compliance_dpp}
                  onToggle={() => update("compliance_dpp", !form.compliance_dpp)}
                />
                <CheckboxItem
                  label={t("scan.compliance.eudr")}
                  sublabel={t("scan.compliance.eudrSub")}
                  value={form.compliance_eudr}
                  onToggle={() => update("compliance_eudr", !form.compliance_eudr)}
                />
                <CheckboxItem
                  label={t("scan.compliance.ce")}
                  sublabel={t("scan.compliance.ceSub")}
                  value={form.compliance_ce}
                  onToggle={() => update("compliance_ce", !form.compliance_ce)}
                />
                <CheckboxItem
                  label={t("scan.compliance.esg")}
                  sublabel={t("scan.compliance.esgSub")}
                  value={form.compliance_esg}
                  onToggle={() => update("compliance_esg", !form.compliance_esg)}
                />
                <CheckboxItem
                  label={t("scan.compliance.origin")}
                  sublabel={t("scan.compliance.originSub")}
                  value={form.compliance_origin}
                  onToggle={() => update("compliance_origin", !form.compliance_origin)}
                />
                <CheckboxItem
                  label={t("scan.compliance.food")}
                  sublabel={t("scan.compliance.foodSub")}
                  value={form.compliance_food_safety}
                  onToggle={() => update("compliance_food_safety", !form.compliance_food_safety)}
                />
              </View>
            )}

            {/* ── Step 3: Results ── */}
            {step === 3 && (
              <View>
                {loading ? (
                  <View style={{ alignItems: "center", paddingVertical: 60 }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text, marginTop: 16, fontWeight: "600", fontSize: 16 }}>
                      {t("scan.analyzing")}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6, textAlign: "center" }}>
                      {t("scan.analyzingSubtitle")}
                    </Text>
                  </View>
                ) : result ? (
                  <View>
                    <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18, textAlign: "center" }}>
                      {t("scan.results")}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 8 }}>
                      {form.company_name} · {form.product_type}
                    </Text>

                    <ScoreCircle score={result.score} />

                    <View style={{ alignItems: "center", marginBottom: 20 }}>
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 6,
                          borderRadius: 20,
                          backgroundColor: getRiskColor(result.risk_level) + "22",
                        }}
                      >
                        <Text style={{ fontWeight: "bold", fontSize: 14, color: getRiskColor(result.risk_level) }}>
                          {t("scan.riskLevel")}: {getRiskLabel(result.risk_level)}
                        </Text>
                      </View>
                    </View>

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
                ) : null}
              </View>
            )}

            {/* ── Navigation Buttons (steps 0-2) ── */}
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

// ─── Shared Styles ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>{title}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>{subtitle}</Text>
    </View>
  );
}
