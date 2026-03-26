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
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={labelStyle}>{label}</Text>
      <TouchableOpacity
        style={[inputStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ color: "#111827", fontSize: 15 }}>{value}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
      </TouchableOpacity>
      {open && (
        <View style={dropdownStyle}>
          {options.map((opt, idx) => (
            <TouchableOpacity
              key={opt}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 11,
                backgroundColor: value === opt ? "#eff6ff" : "#fff",
                borderBottomWidth: idx < options.length - 1 ? 1 : 0,
                borderBottomColor: "#f3f4f6",
              }}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text style={{ fontSize: 15, color: value === opt ? "#1a5276" : "#374151", fontWeight: value === opt ? "600" : "400" }}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1.5,
        backgroundColor: value ? "#eff6ff" : "#fff",
        borderColor: value ? "#1a5276" : "#e5e7eb",
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
          backgroundColor: value ? "#1a5276" : "transparent",
          borderColor: value ? "#1a5276" : "#9ca3af",
        }}
      >
        {value && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "600", fontSize: 13, color: value ? "#1a5276" : "#1f2937" }}>
          {label}
        </Text>
        <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2, lineHeight: 17 }}>
          {sublabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Score Circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#27ae60" : score >= 40 ? "#f39c12" : "#e74c3c";
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
        <Text style={{ color: "#6b7280", fontSize: 12 }}>/ 100</Text>
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRiskColor(riskLevel: string): string {
  const l = riskLevel?.toLowerCase();
  if (l === "hoch" || l === "high") return "#e74c3c";
  if (l === "mittel" || l === "medium") return "#f39c12";
  if (l === "niedrig" || l === "low") return "#27ae60";
  return "#9ca3af";
}

function getRiskLabel(riskLevel: string): string {
  const l = riskLevel?.toLowerCase();
  if (l === "high") return "Hoch";
  if (l === "medium") return "Mittel";
  if (l === "low") return "Niedrig";
  return riskLevel ?? "–";
}

const STEP_LABELS = ["Unternehmen", "Produkt & Markt", "Compliance", "Ergebnisse"];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

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
      Alert.alert("Pflichtfeld fehlt", "Bitte Unternehmensname eingeben.");
      return;
    }
    if (step === 1 && !form.product_type.trim()) {
      Alert.alert("Pflichtfeld fehlt", "Bitte Produkttyp eingeben.");
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
        "Analyse fehlgeschlagen",
        `Die Verbindung zum Server konnte nicht hergestellt werden.\n\nDetails: ${msg}`,
        [{ text: "Zurück", onPress: () => setStep(2) }]
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
      <StatusBar barStyle="light-content" backgroundColor="#1a5276" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        {/* Header */}
        <View style={{ backgroundColor: "#1a5276", paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Readiness Scan</Text>
          <Text style={{ color: "#93c5fd", fontSize: 12, marginTop: 2 }}>EU-Compliance-Analyse</Text>

          {/* Step progress */}
          <View style={{ flexDirection: "row", marginTop: 16, gap: 6 }}>
            {STEP_LABELS.map((label, idx) => (
              <View key={label} style={{ flex: 1 }}>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: idx <= step ? "#fff" : "rgba(255,255,255,0.3)",
                  }}
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 10,
                    marginTop: 4,
                    color: idx === step ? "#fff" : "#93c5fd",
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

        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }} keyboardShouldPersistTaps="handled">
          {/* ── Step 0: Company Profile ── */}
          {step === 0 && (
            <View>
              <SectionHeader title="Unternehmensprofil" subtitle="Grundlegende Informationen zu deinem Unternehmen" />

              <Text style={labelStyle}>Unternehmensname *</Text>
              <TextInput
                style={inputStyle}
                placeholder="Name deines Unternehmens"
                placeholderTextColor="#9ca3af"
                value={form.company_name}
                onChangeText={(v) => update("company_name", v)}
              />

              <Dropdown label="Branche *" value={form.sector} options={SECTORS} onSelect={(v) => update("sector", v)} />
              <Dropdown label="Unternehmensgröße *" value={form.company_size} options={COMPANY_SIZES} onSelect={(v) => update("company_size", v)} />

              <Text style={labelStyle}>Region / Provinz</Text>
              <TextInput
                style={inputStyle}
                placeholder="z.B. Java, Sumatra, Bali"
                placeholderTextColor="#9ca3af"
                value={form.region}
                onChangeText={(v) => update("region", v)}
              />
            </View>
          )}

          {/* ── Step 1: Product & Market ── */}
          {step === 1 && (
            <View>
              <SectionHeader title="Produkt & Markt" subtitle="Details zu deinem Produkt und Zielmarkt" />

              <Text style={labelStyle}>Produkttyp *</Text>
              <TextInput
                style={inputStyle}
                placeholder="z.B. Textilien, Elektronik, Lebensmittel"
                placeholderTextColor="#9ca3af"
                value={form.product_type}
                onChangeText={(v) => update("product_type", v)}
              />

              <Text style={labelStyle}>HS-Code (optional)</Text>
              <TextInput
                style={inputStyle}
                placeholder="z.B. 6203.42"
                placeholderTextColor="#9ca3af"
                value={form.hs_code}
                onChangeText={(v) => update("hs_code", v)}
              />

              <Dropdown label="Zielland (EU) *" value={form.target_country} options={TARGET_COUNTRIES} onSelect={(v) => update("target_country", v)} />
              <Dropdown label="Exporterfahrung *" value={form.export_experience} options={EXPORT_EXPERIENCES} onSelect={(v) => update("export_experience", v)} />
            </View>
          )}

          {/* ── Step 2: Compliance ── */}
          {step === 2 && (
            <View>
              <SectionHeader title="Compliance Selbstbewertung" subtitle="Welche EU-Anforderungen erfüllst du bereits?" />

              <CheckboxItem
                label="DPP – Digital Product Passport"
                sublabel="Digitaler Produktpass nach EU-Ökodesign-Verordnung (EU 2024/1781)"
                value={form.compliance_dpp}
                onToggle={() => update("compliance_dpp", !form.compliance_dpp)}
              />
              <CheckboxItem
                label="EUDR – Entwaldungsverordnung"
                sublabel="EU-Verordnung gegen Entwaldung und Waldschädigung (EU 2023/1115)"
                value={form.compliance_eudr}
                onToggle={() => update("compliance_eudr", !form.compliance_eudr)}
              />
              <CheckboxItem
                label="CE-Kennzeichnung"
                sublabel="Konformitätskennzeichnung für den EU-Binnenmarkt"
                value={form.compliance_ce}
                onToggle={() => update("compliance_ce", !form.compliance_ce)}
              />
              <CheckboxItem
                label="ESG-Berichterstattung"
                sublabel="Nachhaltigkeits- und Governance-Berichterstattung (CSRD)"
                value={form.compliance_esg}
                onToggle={() => update("compliance_esg", !form.compliance_esg)}
              />
              <CheckboxItem
                label="Ursprungszeugnis"
                sublabel="Nachweis des Warenursprungs für Präferenzzölle"
                value={form.compliance_origin}
                onToggle={() => update("compliance_origin", !form.compliance_origin)}
              />
              <CheckboxItem
                label="Lebensmittelsicherheit"
                sublabel="EU-Lebensmittelsicherheitsstandards (HACCP, EU 178/2002)"
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
                  <ActivityIndicator size="large" color="#1a5276" />
                  <Text style={{ color: "#374151", marginTop: 16, fontWeight: "600", fontSize: 16 }}>
                    Analyse läuft...
                  </Text>
                  <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 6, textAlign: "center" }}>
                    Deine EU-Compliance-Bereitschaft wird bewertet
                  </Text>
                </View>
              ) : result ? (
                <View>
                  <Text style={{ color: "#1f2937", fontWeight: "bold", fontSize: 18, textAlign: "center" }}>
                    Analyseergebnisse
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 8 }}>
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
                        Risikoniveau: {getRiskLabel(result.risk_level)}
                      </Text>
                    </View>
                  </View>

                  {result.completed_requirements.length > 0 && (
                    <View style={{ backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                      <Text style={{ color: "#15803d", fontWeight: "bold", marginBottom: 10 }}>
                        Erfüllte Anforderungen ({result.completed_requirements.length})
                      </Text>
                      {result.completed_requirements.map((req, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                          <Ionicons name="checkmark-circle" size={16} color="#27ae60" style={{ marginTop: 1, marginRight: 8 }} />
                          <Text style={{ color: "#374151", fontSize: 13, flex: 1, lineHeight: 19 }}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {result.missing_requirements.length > 0 && (
                    <View style={{ backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                      <Text style={{ color: "#b91c1c", fontWeight: "bold", marginBottom: 10 }}>
                        Fehlende Anforderungen ({result.missing_requirements.length})
                      </Text>
                      {result.missing_requirements.map((req, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                          <Ionicons name="close-circle" size={16} color="#e74c3c" style={{ marginTop: 1, marginRight: 8 }} />
                          <Text style={{ color: "#374151", fontSize: 13, flex: 1, lineHeight: 19 }}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {result.action_plan.length > 0 && (
                    <View style={{ backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                      <Text style={{ color: "#1a5276", fontWeight: "bold", marginBottom: 10 }}>
                        Aktionsplan ({result.action_plan.length} Schritte)
                      </Text>
                      {result.action_plan.map((item, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#1a5276", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 }}>
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>{i + 1}</Text>
                          </View>
                          <Text style={{ color: "#374151", fontSize: 13, flex: 1, lineHeight: 19 }}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={{ backgroundColor: "#1a5276", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 10 }}
                    onPress={() => router.push("/(tabs)/action-plan")}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Aktionsplan öffnen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 32 }}
                    onPress={resetScan}
                  >
                    <Text style={{ color: "#374151", fontWeight: "600", fontSize: 16 }}>Neuer Scan</Text>
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
                  style={{ flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
                  onPress={() => setStep((s) => s - 1)}
                >
                  <Text style={{ color: "#374151", fontWeight: "600", fontSize: 15 }}>Zurück</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#1a5276", borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
                onPress={handleNext}
              >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
                  {step === 2 ? "Analyse starten" : "Weiter"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: "#1f2937", fontWeight: "bold", fontSize: 18 }}>{title}</Text>
      <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 3 }}>{subtitle}</Text>
    </View>
  );
}

const labelStyle = {
  color: "#374151",
  fontWeight: "600" as const,
  fontSize: 13,
  marginBottom: 6,
};

const inputStyle = {
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: "#111827",
  fontSize: 15,
  backgroundColor: "#fff",
  marginBottom: 16,
};

const dropdownStyle = {
  borderWidth: 1,
  borderColor: "#e5e7eb",
  borderRadius: 12,
  marginTop: 4,
  backgroundColor: "#fff",
  overflow: "hidden" as const,
};
