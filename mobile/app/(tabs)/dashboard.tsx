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
import { useTheme } from "@/context/ThemeContext";
import { ThemeColors } from "@/colors-indonesia";

type FeatureAction = "scan" | "action-plan" | "chat" | "learning";

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bgColor: string;
  action: FeatureAction;
  badge?: string;
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
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [chatVisible, setChatVisible] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      storage.getLastScan().then(setLastScan);
    }, [])
  );

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : t("dashboard.user");

  const getRiskColor = (riskLevel: string): string => {
    const l = riskLevel?.toLowerCase();
    if (l === "hoch" || l === "high") return colors.error;
    if (l === "mittel" || l === "medium") return colors.warning;
    if (l === "niedrig" || l === "low") return colors.success;
    return colors.textSecondary;
  };

  const getRiskLabel = (riskLevel: string): string => {
    const l = riskLevel?.toLowerCase();
    if (l === "high") return t("common.risk.high");
    if (l === "medium") return t("common.risk.medium");
    if (l === "low") return t("common.risk.low");
    return riskLevel ?? "–";
  };

  const featureCards: FeatureCard[] = [
    {
      title: t("dashboard.readinessScan"),
      description: t("dashboard.readinessScanDesc"),
      icon: "search-circle",
      color: colors.primary,
      bgColor: colors.primary + "1A",
      action: "scan",
    },
    {
      title: t("dashboard.actionPlan"),
      description: t("dashboard.actionPlanDesc"),
      icon: "list-circle",
      color: colors.success,
      bgColor: colors.success + "1A",
      action: "action-plan",
    },
    {
      title: t("dashboard.aiAssistant"),
      description: t("dashboard.aiAssistantDesc"),
      icon: "chatbubble-ellipses",
      color: colors.secondary,
      bgColor: colors.secondary + "1A",
      action: "chat",
    },
    {
      title: t("dashboard.learningHub"),
      description: t("dashboard.learningHubDesc"),
      icon: "school",
      color: colors.accent,
      bgColor: colors.accent + "1A",
      action: "learning",
      badge: t("dashboard.comingSoon"),
    },
  ];

  const handleCardPress = (action: FeatureAction) => {
    if (action === "chat") {
      setChatVisible(true);
      return;
    }
    router.push(`/(tabs)/${action}`);
  };

  const handleSourcePress = (source: string) => {
    router.navigate(`/(tabs)/knowledge?doc=${encodeURIComponent(source)}`);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.primaryStrong,
            paddingTop: insets.top + 12,
            paddingBottom: 32,
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: colors.onPrimary + "AA", fontSize: 13, fontWeight: "500" }}>
            {t("dashboard.welcome")},
          </Text>
          <Text style={{ color: colors.onPrimary, fontSize: 26, fontWeight: "bold", marginTop: 2, letterSpacing: -0.5 }}>
            {displayName}!
          </Text>
          {user?.company && (
            <Text style={{ color: colors.onPrimary + "AA", fontSize: 13, marginTop: 3 }}>{user.company}</Text>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 14,
              backgroundColor: colors.onPrimary + "1A",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 7,
              alignSelf: "flex-start",
            }}
          >
            <Ionicons name="shield-checkmark" size={13} color={colors.onPrimary + "AA"} />
            <Text style={{ color: colors.onPrimary + "AA", fontSize: 12, marginLeft: 6, fontWeight: "500" }}>
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
              backgroundColor: colors.card,
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
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  {t("dashboard.lastScan")}
                </Text>
                <Text style={{ fontSize: 15, color: colors.text, fontWeight: "700", marginTop: 3 }}>
                  {lastScan.company_name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                  {lastScan.product_type}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 36, fontWeight: "bold", color: colors.primary, lineHeight: 40 }}>
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(lastScan.created_at)}</Text>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => router.push("/(tabs)/action-plan")}
              >
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>{t("dashboard.actionPlan")}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: -20,
              backgroundColor: colors.card,
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
            <Ionicons name="search-circle-outline" size={40} color={colors.textSecondary} />
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15, marginTop: 10 }}>
              {t("dashboard.noScan")}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: "center", marginTop: 4, lineHeight: 18 }}>
              {t("dashboard.noScanText")}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 24,
                paddingVertical: 10,
                marginTop: 14,
              }}
              onPress={() => router.push("/(tabs)/scan")}
            >
              <Text style={{ color: colors.buttonText, fontWeight: "700", fontSize: 14 }}>{t("dashboard.startScan")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feature Cards */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontWeight: "600",
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {t("dashboard.features")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {featureCards.map((card) => (
              <TouchableOpacity
                key={card.action}
                style={{
                  backgroundColor: colors.card,
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
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{card.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 3, lineHeight: 16 }}>
                  {card.description}
                </Text>
                {card.badge && (
                  <View
                    style={{
                      backgroundColor: colors.accent + "1A",
                      borderRadius: 8,
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      marginTop: 8,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ fontSize: 10, color: colors.accent, fontWeight: "600" }}>{card.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About IEU-CEPA */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 32,
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: colors.textSecondary,
              fontWeight: "600",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {t("dashboard.about")}
          </Text>
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>{t("dashboard.aboutText")}</Text>
          <View style={{ flexDirection: "row", marginTop: 14, gap: 10 }}>
            <StatBox value="6+" label={t("dashboard.statRegs")} color={colors.primary} bg={colors.primary + "1A"} colors={colors} />
            <StatBox value="KI" label={t("dashboard.statAi")} color={colors.success} bg={colors.success + "1A"} colors={colors} />
            <StatBox value="24/7" label={t("dashboard.statAvailable")} color={colors.accent} bg={colors.accent + "1A"} colors={colors} />
          </View>
        </View>
      </ScrollView>

      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        onSourcePress={handleSourcePress}
      />
    </>
  );
}

function StatBox({
  value,
  label,
  color,
  bg,
  colors,
}: {
  value: string;
  label: string;
  color: string;
  bg: string;
  colors: ThemeColors;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 12, padding: 10, alignItems: "center" }}>
      <Text style={{ color, fontSize: 18, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: "center", marginTop: 2 }}>{label}</Text>
    </View>
  );
}
