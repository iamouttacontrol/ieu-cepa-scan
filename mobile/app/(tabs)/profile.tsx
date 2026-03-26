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

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      storage.getScans().then(setScans);
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      "Abmelden",
      "Möchtest du dich wirklich abmelden?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Abmelden",
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a5276" />
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "#1a5276",
            paddingTop: 56,
            paddingBottom: 36,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.4)",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 30, fontWeight: "bold" }}>{initials}</Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
            {user?.name ?? "–"}
          </Text>
          <Text style={{ color: "#93c5fd", fontSize: 13, marginTop: 3 }}>
            {user?.email ?? "–"}
          </Text>
          {user?.company ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <Ionicons name="business-outline" size={13} color="#bfdbfe" />
              <Text style={{ color: "#bfdbfe", fontSize: 12, marginLeft: 5 }}>
                {user.company} · {user.sector}
              </Text>
            </View>
          ) : null}
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Stats */}
          <View style={{ flexDirection: "row", marginHorizontal: 20, marginTop: -20, gap: 10, marginBottom: 20 }}>
            <StatCard
              value={String(scans.length)}
              label="Scans"
              color="#1a5276"
              bg="#eff6ff"
            />
            <StatCard
              value={String(totalActionItems)}
              label="Action Items"
              color="#27ae60"
              bg="#f0fdf4"
            />
            <StatCard
              value={lastScore !== null ? String(lastScore) : "–"}
              label="Letzter Score"
              color="#d97706"
              bg="#fffbeb"
            />
          </View>

          {/* Profile Info */}
          <SectionCard title="Profil">
            <ProfileRow icon="person-outline" label="Name" value={user?.name ?? "–"} />
            <ProfileRow icon="mail-outline" label="E-Mail" value={user?.email ?? "–"} />
            <ProfileRow icon="business-outline" label="Unternehmen" value={user?.company ?? "–"} />
            <ProfileRow icon="briefcase-outline" label="Branche" value={user?.sector ?? "–"} last />
          </SectionCard>

          {/* Settings */}
          <SectionCard title="Einstellungen">
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
              <View style={iconBoxStyle}>
                <Ionicons name="language-outline" size={17} color="#6b7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#1f2937", fontWeight: "500", fontSize: 14 }}>Sprache</Text>
                <Text style={{ color: "#9ca3af", fontSize: 12 }}>Deutsch</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={iconBoxStyle}>
                <Ionicons name="notifications-outline" size={17} color="#6b7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#1f2937", fontWeight: "500", fontSize: 14 }}>Benachrichtigungen</Text>
                <Text style={{ color: "#9ca3af", fontSize: 12 }}>Compliance-Updates erhalten</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                thumbColor={notificationsEnabled ? "#1a5276" : "#f4f4f4"}
              />
            </View>
          </SectionCard>

          {/* App Info */}
          <SectionCard title="App-Info">
            <ProfileRow icon="information-circle-outline" label="Version" value="1.0.0" />
            <ProfileRow icon="server-outline" label="Backend" value="localhost:8000" />
            <ProfileRow icon="shield-checkmark-outline" label="Datenspeicherung" value="Lokal (AsyncStorage)" last />
          </SectionCard>

          {/* Scan History (last 3) */}
          {scans.length > 0 && (
            <SectionCard title={`Scan-Verlauf (${scans.length})`}>
              {scans.slice(0, 3).map((scan, idx) => (
                <View
                  key={scan.id}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: idx < Math.min(scans.length, 3) - 1 ? 1 : 0,
                    borderBottomColor: "#f3f4f6",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#1f2937", fontWeight: "600", fontSize: 13 }}>
                      {scan.company_name}
                    </Text>
                    <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 1 }}>
                      {scan.product_type} · {new Date(scan.created_at).toLocaleDateString("de-DE")}
                    </Text>
                  </View>
                  <Text style={{ color: "#1a5276", fontWeight: "bold", fontSize: 18 }}>
                    {scan.score}
                  </Text>
                </View>
              ))}
            </SectionCard>
          )}

          {/* Logout */}
          <View style={{ marginHorizontal: 20, marginBottom: 40, marginTop: 4 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "#fef2f2",
                borderWidth: 1,
                borderColor: "#fecaca",
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
              <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
              <Text style={{ color: "#e74c3c", fontWeight: "bold", fontSize: 16 }}>Abmelden</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({ value, label, color, bg }: { value: string; label: string; color: string; bg: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
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
      <Text style={{ color: "#9ca3af", fontSize: 11, textAlign: "center", marginTop: 3 }}>{label}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        backgroundColor: "#fff",
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
          color: "#9ca3af",
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
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#f3f4f6",
      }}
    >
      <View style={iconBoxStyle}>
        <Ionicons name={icon} size={16} color="#6b7280" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#9ca3af", fontSize: 11 }}>{label}</Text>
        <Text style={{ color: "#1f2937", fontWeight: "500", fontSize: 14, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

const iconBoxStyle = {
  width: 34,
  height: 34,
  borderRadius: 9,
  backgroundColor: "#f3f4f6",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginRight: 12,
};
