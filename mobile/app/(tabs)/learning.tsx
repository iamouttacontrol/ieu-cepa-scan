import React from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

interface LearningModule {
  title: string;
  subtitle: string;
  duration: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bgColor: string;
  regulation: string;
}

export default function LearningScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const modules: LearningModule[] = [
    {
      title: "Digital Product Passport",
      subtitle: "EU-Ökodesign-Verordnung & DPP-Anforderungen",
      duration: "5",
      icon: "document-text",
      color: colors.primary,
      bgColor: colors.primary + "1A",
      regulation: "EU 2024/1781",
    },
    {
      title: "EUDR Compliance",
      subtitle: "Entwaldungsfreie Lieferketten nachweisen",
      duration: "4",
      icon: "leaf",
      color: colors.success,
      bgColor: colors.success + "1A",
      regulation: "EU 2023/1115",
    },
    {
      title: "CE-Kennzeichnung",
      subtitle: "Konformität mit EU-Produktstandards",
      duration: "3",
      icon: "shield-checkmark",
      color: colors.info,
      bgColor: colors.info + "1A",
      regulation: "EU 768/2008",
    },
    {
      title: "Nachhaltigkeitsberichterstattung",
      subtitle: "ESG-Berichtspflichten für Exporteure",
      duration: "5",
      icon: "bar-chart",
      color: colors.secondary,
      bgColor: colors.secondary + "1A",
      regulation: "CSRD 2022/2464",
    },
    {
      title: "Produktsicherheit",
      subtitle: "EU-Produktsicherheitsverordnung",
      duration: "4",
      icon: "checkmark-circle",
      color: colors.accent,
      bgColor: colors.accent + "1A",
      regulation: "EU 2023/988",
    },
    {
      title: "REACH-Chemikalienverordnung",
      subtitle: "Registrierung & Bewertung chemischer Stoffe",
      duration: "5",
      icon: "flask",
      color: colors.error,
      bgColor: colors.error + "1A",
      regulation: "EG 1907/2006",
    },
  ];

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
          {/* Coming Soon Banner */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 20,
              backgroundColor: colors.accent + "1A",
              borderWidth: 1,
              borderColor: colors.accent + "40",
              borderRadius: 18,
              padding: 20,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.accent + "1A",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="lock-closed" size={26} color={colors.accent} />
            </View>
            <Text style={{ color: colors.accent, fontWeight: "bold", fontSize: 17, textAlign: "center" }}>
              {t("learning.comingSoon")}
            </Text>
            <Text style={{ color: colors.accent, fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
              {t("learning.comingSoonText")}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
                backgroundColor: colors.accent + "1A",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 7,
              }}
            >
              <Ionicons name="notifications-outline" size={14} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
                {t("learning.notifyBtn")}
              </Text>
            </View>
          </View>

          {/* Module Preview */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
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
              {t("learning.plannedModules")}
            </Text>

            {modules.map((module) => (
              <View
                key={module.title}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.surfaceAlt,
                  opacity: 0.65,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                      flexShrink: 0,
                      backgroundColor: module.bgColor,
                    }}
                  >
                    <Ionicons name={module.icon} size={22} color={module.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13, flex: 1, paddingRight: 8 }}>
                        {module.title}
                      </Text>
                      <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{module.duration} {t("learning.minutes")}.</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{module.subtitle}</Text>
                    <View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: colors.surfaceAlt, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: "monospace" }}>{module.regulation}</Text>
                    </View>
                  </View>
                </View>

                {/* Lock indicator */}
                <View style={{ position: "absolute", top: 12, right: 12 }}>
                  <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
                </View>
              </View>
            ))}
          </View>

          {/* Footer info */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 8,
              marginBottom: 32,
              backgroundColor: colors.info + "1A",
              borderRadius: 16,
              padding: 16,
            }}
          >
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
