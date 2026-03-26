import React from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface LearningModule {
  title: string;
  subtitle: string;
  duration: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bgColor: string;
  regulation: string;
}

const modules: LearningModule[] = [
  {
    title: "Digital Product Passport",
    subtitle: "EU-Ökodesign-Verordnung & DPP-Anforderungen",
    duration: "5 Min.",
    icon: "document-text",
    color: "#1a5276",
    bgColor: "#eff6ff",
    regulation: "EU 2024/1781",
  },
  {
    title: "EUDR Compliance",
    subtitle: "Entwaldungsfreie Lieferketten nachweisen",
    duration: "4 Min.",
    icon: "leaf",
    color: "#27ae60",
    bgColor: "#f0fdf4",
    regulation: "EU 2023/1115",
  },
  {
    title: "CE-Kennzeichnung",
    subtitle: "Konformität mit EU-Produktstandards",
    duration: "3 Min.",
    icon: "shield-checkmark",
    color: "#2e86c1",
    bgColor: "#eff6ff",
    regulation: "EU 768/2008",
  },
  {
    title: "Nachhaltigkeitsberichterstattung",
    subtitle: "ESG-Berichtspflichten für Exporteure",
    duration: "5 Min.",
    icon: "bar-chart",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    regulation: "CSRD 2022/2464",
  },
  {
    title: "Produktsicherheit",
    subtitle: "EU-Produktsicherheitsverordnung",
    duration: "4 Min.",
    icon: "checkmark-circle",
    color: "#d97706",
    bgColor: "#fffbeb",
    regulation: "EU 2023/988",
  },
  {
    title: "REACH-Chemikalienverordnung",
    subtitle: "Registrierung & Bewertung chemischer Stoffe",
    duration: "5 Min.",
    icon: "flask",
    color: "#c0392b",
    bgColor: "#fef2f2",
    regulation: "EG 1907/2006",
  },
];

export default function LearningScreen() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a5276" />
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        {/* Header */}
        <View style={{ backgroundColor: "#1a5276", paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Learning Hub</Text>
          <Text style={{ color: "#93c5fd", fontSize: 12, marginTop: 2 }}>EU-Compliance-Module</Text>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Coming Soon Banner */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 20,
              backgroundColor: "#fffbeb",
              borderWidth: 1,
              borderColor: "#fde68a",
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
                backgroundColor: "#fef3c7",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="lock-closed" size={26} color="#d97706" />
            </View>
            <Text style={{ color: "#92400e", fontWeight: "bold", fontSize: 17, textAlign: "center" }}>
              Demnächst verfügbar
            </Text>
            <Text style={{ color: "#b45309", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
              Interaktive Lernmodule zu EU-Compliance-Themen sind in Entwicklung.
              Werde benachrichtigt, sobald sie verfügbar sind.
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
                backgroundColor: "#fef3c7",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 7,
              }}
            >
              <Ionicons name="notifications-outline" size={14} color="#92400e" />
              <Text style={{ color: "#92400e", fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
                Benachrichtigung aktivieren
              </Text>
            </View>
          </View>

          {/* Module Preview */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text
              style={{
                color: "#9ca3af",
                fontWeight: "600",
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Geplante Module
            </Text>

            {modules.map((module) => (
              <View
                key={module.title}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#f3f4f6",
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
                      <Text style={{ color: "#1f2937", fontWeight: "600", fontSize: 13, flex: 1, paddingRight: 8 }}>
                        {module.title}
                      </Text>
                      <View style={{ backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <Text style={{ color: "#9ca3af", fontSize: 11 }}>{module.duration}</Text>
                      </View>
                    </View>
                    <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>{module.subtitle}</Text>
                    <View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: "#f3f4f6", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace" }}>{module.regulation}</Text>
                    </View>
                  </View>
                </View>

                {/* Lock indicator */}
                <View style={{ position: "absolute", top: 12, right: 12 }}>
                  <Ionicons name="lock-closed-outline" size={13} color="#9ca3af" />
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
              backgroundColor: "#eff6ff",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Ionicons name="information-circle" size={18} color="#1a5276" style={{ marginTop: 1, marginRight: 10 }} />
              <Text style={{ color: "#1a5276", fontSize: 13, lineHeight: 20, flex: 1 }}>
                Die Module werden schrittweise freigeschaltet. Jedes Modul enthält interaktive
                Inhalte, Quizze und praktische Checklisten auf Basis offizieller EU-Rechtsquellen.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
