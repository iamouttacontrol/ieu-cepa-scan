import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { storage, ScanResult } from "@/lib/storage";
import ChatModal from "@/components/ChatModal";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FeatureCard {
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bgColor: string;
  action: "scan" | "action-plan" | "chat" | "learning";
  badgeKey?: string;
}

const featureCards: FeatureCard[] = [
  {
    titleKey: "dashboard.readinessScan",
    descriptionKey: "scan.subtitle",
    icon: "search-circle",
    color: "#1a5276",
    bgColor: "#eff6ff",
    action: "scan",
  },
  {
    titleKey: "dashboard.actionPlan",
    descriptionKey: "actionPlan.subtitle",
    icon: "list-circle",
    color: "#27ae60",
    bgColor: "#f0fdf4",
    action: "action-plan",
  },
  {
    titleKey: "dashboard.aiAssistant",
    descriptionKey: "chat.subtitle",
    icon: "chatbubble-ellipses",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    action: "chat",
  },
  {
    titleKey: "dashboard.learningHub",
    descriptionKey: "learning.subtitle",
    icon: "school",
    color: "#d97706",
    bgColor: "#fffbeb",
    action: "learning",
    badgeKey: "dashboard.comingSoon",
  },
];

function getRiskColor(riskLevel: string): string {
  const l = riskLevel?.toLowerCase();
  if (l === "hoch" || l === "high") return "#e74c3c";
  if (l === "mittel" || l === "medium") return "#f39c12";
  if (l === "niedrig" || l === "low") return "#27ae60";
  return "#9ca3af";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const [chatVisible, setChatVisible] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      storage.getLastScan().then(setLastScan);
    }, [])
  );

  const handleCardPress = (action: FeatureCard["action"]) => {
    switch (action) {
      case "chat":
        setChatVisible(true);
        break;
      case "learning":
        router.push("/(tabs)/learning");
        break;
      case "scan":
        router.push("/(tabs)/scan");
        break;
      case "action-plan":
        router.push("/(tabs)/action-plan");
        break;
    }
  };

  const getRiskLabel = (riskLevel: string): string => {
    const l = riskLevel?.toLowerCase();
    if (l === "high") return t("common.risk.high");
    if (l === "medium") return t("common.risk.medium");
    if (l === "low") return t("common.risk.low");
    return riskLevel ?? "–";
  };

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : "Nutzer";

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a5276" />
      <ScrollView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        {/* Header */}
        <View style={{ backgroundColor: "#1a5276", paddingTop: insets.top + 12, paddingBottom: 32, paddingHorizontal: 24 }}>
          <Text style={{ color: "#93c5fd", fontSize: 13, fontWeight: "500" }}>{t("dashboard.welcome")},</Text>
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "bold", marginTop: 2, letterSpacing: -0.5 }}>
            {displayName}!
          </Text>
          {user?.company && (
            <Text style={{ color: "#bfdbfe", fontSize: 13, marginTop: 3 }}>{user.company}</Text>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 14,
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 7,
              alignSelf: "flex-start",
            }}
          >
            <Ionicons name="shield-checkmark" size={13} color="#93c5fd" />
            <Text style={{ color: "#bfdbfe", fontSize: 12, marginLeft: 6, fontWeight: "500" }}>
              {t("dashboard.tagline")}
            </Text>
          </View>
        </View>

        {/* Last Scan Card */}
        {lastScan ? (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: -20,
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: "#9ca3af", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  {t("dashboard.lastScan")}
                </Text>
                <Text style={{ fontSize: 15, color: "#1f2937", fontWeight: "700", marginTop: 3 }}>
                  {lastScan.company_name}
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>
                  {lastScan.product_type}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 36, fontWeight: "bold", color: "#1a5276", lineHeight: 40 }}>
                  {lastScan.score}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 10,
                    backgroundColor: getRiskColor(lastScan.risk_level) + "22",
                    marginTop: 2,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: getRiskColor(lastScan.risk_level) }}>
                    {getRiskLabel(lastScan.risk_level)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                {formatDate(lastScan.created_at)}
              </Text>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => router.push("/(tabs)/action-plan")}
              >
                <Text style={{ color: "#1a5276", fontSize: 13, fontWeight: "600" }}>{t("dashboard.actionPlan")}</Text>
                <Ionicons name="chevron-forward" size={14} color="#1a5276" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: -20,
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <Ionicons name="search-circle-outline" size={40} color="#9ca3af" />
            <Text style={{ color: "#374151", fontWeight: "600", fontSize: 15, marginTop: 10 }}>
              {t("dashboard.noScan")}
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", marginTop: 4, lineHeight: 18 }}>
              {t("dashboard.aboutText")}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#1a5276",
                borderRadius: 10,
                paddingHorizontal: 24,
                paddingVertical: 10,
                marginTop: 14,
              }}
              onPress={() => router.push("/(tabs)/scan")}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{t("dashboard.startScan")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feature Cards */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ color: "#6b7280", fontWeight: "600", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>
            {t("dashboard.features")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {featureCards.map((card) => (
              <TouchableOpacity
                key={card.titleKey}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 18,
                  padding: 16,
                  width: "47%",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                }}
                onPress={() => handleCardPress(card.action)}
                activeOpacity={0.75}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: card.bgColor,
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name={card.icon} size={24} color={card.color} />
                </View>
                <Text style={{ color: "#1f2937", fontWeight: "700", fontSize: 13 }}>{t(card.titleKey)}</Text>
                <Text style={{ color: "#6b7280", fontSize: 11, marginTop: 3, lineHeight: 16 }}>
                  {t(card.descriptionKey)}
                </Text>
                {card.badgeKey && (
                  <View
                    style={{
                      backgroundColor: "#fef3c7",
                      borderRadius: 8,
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      marginTop: 8,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#92400e", fontWeight: "600" }}>{t(card.badgeKey)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 32,
            backgroundColor: "#fff",
            borderRadius: 18,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 11, color: "#9ca3af", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
            {t("dashboard.about")}
          </Text>
          <Text style={{ color: "#374151", fontSize: 13, lineHeight: 20 }}>
            {t("dashboard.aboutText")}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 14, gap: 10 }}>
            <StatBox value="6+" label={t("dashboard.statRegs")} color="#1a5276" bg="#eff6ff" />
            <StatBox value="KI" label={t("dashboard.statAi")} color="#27ae60" bg="#f0fdf4" />
            <StatBox value="24/7" label={t("dashboard.statAvailable")} color="#d97706" bg="#fffbeb" />
          </View>
        </View>
      </ScrollView>

      <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </>
  );
}

function StatBox({ value, label, color, bg }: { value: string; label: string; color: string; bg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 12, padding: 10, alignItems: "center" }}>
      <Text style={{ color, fontSize: 18, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: "#6b7280", fontSize: 11, textAlign: "center", marginTop: 2 }}>{label}</Text>
    </View>
  );
}
