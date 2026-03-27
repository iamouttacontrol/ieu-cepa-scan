import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { storage, ScanResult } from "@/lib/storage";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

const LANGUAGES = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "id", label: "Bahasa", flag: "🇮🇩" },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useFocusEffect(
    useCallback(() => {
      storage.getScans().then(setScans);
    }, [])
  );

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    await storage.setLanguage(code);
    setCurrentLang(code);
  };

  const handleLogout = () => {
    Alert.alert(
      t("profile.logoutConfirm"),
      t("profile.logoutText"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("profile.logout"),
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/auth");
          },
        },
      ]
    );
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const totalActionItems = scans.reduce((acc, s) => acc + s.action_plan.length, 0);
  const lastScore = scans.length > 0 ? scans[0].score : null;

  const iconBoxStyle = {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.primaryStrong,
            paddingTop: insets.top + 12,
            paddingBottom: 20,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.onPrimary + "33",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              borderWidth: 2,
              borderColor: colors.onPrimary + "66",
            }}
          >
            <Text style={{ color: colors.onPrimary, fontSize: 30, fontWeight: "bold" }}>{initials}</Text>
          </View>
          <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: "bold" }}>
            {user?.name ?? "–"}
          </Text>
          <Text style={{ color: colors.onPrimary + "AA", fontSize: 13, marginTop: 3 }}>
            {user?.email ?? "–"}
          </Text>
          {user?.company ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <Ionicons name="business-outline" size={13} color={colors.onPrimary + "66"} />
              <Text style={{ color: colors.onPrimary + "66", fontSize: 12, marginLeft: 5 }}>
                {user.company} · {user.sector}
              </Text>
            </View>
          ) : null}

          {/* Stats inside header */}
          <View style={{ flexDirection: "row", marginTop: 20, gap: 10, width: "100%" }}>
            <StatCard
              value={String(scans.length)}
              label={t("profile.scans")}
              color={colors.primary}
              bg={colors.primary + "1A"}
            />
            <StatCard
              value={String(totalActionItems)}
              label={t("profile.actionItems")}
              color={colors.secondary}
              bg={colors.secondary + "1A"}
            />
            <StatCard
              value={lastScore !== null ? String(lastScore) : "–"}
              label={t("profile.lastScore")}
              color={colors.accent}
              bg={colors.accent + "1A"}
            />
          </View>
        </View>

        <ScrollView style={{ flex: 1, paddingTop: 16 }}>
          {/* Profile Info */}
          <SectionCard title={t("profile.title")}>
            <ProfileRow icon="person-outline" label={t("auth.name")} value={user?.name ?? "–"} />
            <ProfileRow icon="mail-outline" label={t("auth.email")} value={user?.email ?? "–"} />
            <ProfileRow icon="business-outline" label={t("auth.company")} value={user?.company ?? "–"} />
            <ProfileRow icon="briefcase-outline" label={t("auth.sector")} value={user?.sector ?? "–"} last />
          </SectionCard>

          {/* Settings */}
          <SectionCard title={t("profile.settings")}>
            {/* Dark/Light Mode Toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={iconBoxStyle}>
                <Ionicons name={mode === "dark" ? "moon" : "sunny"} size={17} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "500", fontSize: 14 }}>
                  {mode === "dark" ? t("profile.darkMode") : t("profile.lightMode")}
                </Text>
              </View>
              <Switch
                value={mode === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={mode === "dark" ? colors.primary : colors.surface}
              />
            </View>

            {/* Language Switcher */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={iconBoxStyle}>
                  <Ionicons name="language-outline" size={17} color={colors.textSecondary} />
                </View>
                <Text style={{ color: colors.text, fontWeight: "500", fontSize: 14 }}>{t("profile.language")}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {LANGUAGES.map((lang) => {
                  const isActive = currentLang === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 6,
                        borderRadius: 10,
                        alignItems: "center",
                        borderWidth: 1.5,
                        backgroundColor: isActive ? colors.primaryStrong : colors.background,
                        borderColor: isActive ? colors.primaryStrong : colors.border,
                      }}
                      onPress={() => handleLanguageChange(lang.code)}
                      activeOpacity={0.75}
                    >
                      <Text style={{ fontSize: 18, marginBottom: 2 }}>{lang.flag}</Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: isActive ? colors.onPrimary : colors.textSecondary,
                        }}
                      >
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={iconBoxStyle}>
                <Ionicons name="notifications-outline" size={17} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "500", fontSize: 14 }}>{t("profile.notifications")}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {notificationsEnabled ? t("common.enabled") : "–"}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.onPrimary + "AA" }}
                thumbColor={notificationsEnabled ? colors.primary : colors.surfaceAlt}
              />
            </View>
          </SectionCard>

          {/* App Info */}
          <SectionCard title={t("profile.appInfo")}>
            <ProfileRow icon="information-circle-outline" label={t("profile.version")} value="1.0.0" />
            <ProfileRow icon="server-outline" label={t("profile.backend")} value="localhost:8000" />
            <ProfileRow icon="shield-checkmark-outline" label={t("profile.storage")} value={t("profile.storageValue")} last />
          </SectionCard>

          {/* Scan History (last 3) */}
          {scans.length > 0 && (
            <SectionCard title={`${t("profile.scanHistory")} (${scans.length})`}>
              {scans.slice(0, 3).map((scan, idx) => (
                <ScanHistoryRow key={scan.id} scan={scan} idx={idx} total={Math.min(scans.length, 3)} />
              ))}
            </SectionCard>
          )}

          {/* Logout */}
          <View style={{ marginHorizontal: 20, marginBottom: 40, marginTop: 4 }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.error + "1A",
                borderWidth: 1,
                borderColor: colors.error + "40",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={{ color: colors.error, fontWeight: "bold", fontSize: 16 }}>{t("profile.logout")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ScanHistoryRow({ scan, idx, total }: { scan: ScanResult; idx: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: idx < total - 1 ? 1 : 0,
        borderBottomColor: colors.surfaceAlt,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>
          {scan.company_name}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
          {scan.product_type} · {new Date(scan.created_at).toLocaleDateString("de-DE")}
        </Text>
      </View>
      <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 18 }}>
        {scan.score}
      </Text>
    </View>
  );
}

function StatCard({ value, label, color, bg }: { value: string; label: string; color: string; bg: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text style={{ color, fontSize: 24, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: "center", marginTop: 3 }}>{label}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 20,
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        overflow: "hidden",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          color: colors.textSecondary,
          fontWeight: "600",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 8,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

interface ProfileRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  last?: boolean;
}

function ProfileRow({ icon, label, value, last = false }: ProfileRowProps) {
  const { colors } = useTheme();
  const iconBoxStyle = {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.surfaceAlt,
      }}
    >
      <View style={iconBoxStyle}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: colors.text, fontWeight: "500", fontSize: 14, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}
