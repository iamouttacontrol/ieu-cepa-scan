import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

type Tab = "login" | "register";

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regSector, setRegSector] = useState(SECTORS[0]);
  const [showSectorPicker, setShowSectorPicker] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail.trim()) {
      Alert.alert("Fehler", "Bitte E-Mail-Adresse eingeben.");
      return;
    }
    if (!loginPassword.trim()) {
      Alert.alert("Fehler", "Bitte Passwort eingeben.");
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      router.replace("/(tabs)/dashboard");
    } catch {
      Alert.alert("Anmeldung fehlgeschlagen", "Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim()) {
      Alert.alert("Fehler", "Bitte vollständigen Namen eingeben.");
      return;
    }
    if (!regEmail.trim()) {
      Alert.alert("Fehler", "Bitte E-Mail-Adresse eingeben.");
      return;
    }
    if (!regEmail.includes("@")) {
      Alert.alert("Fehler", "Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }
    if (regPassword.length < 6) {
      Alert.alert("Fehler", "Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (!regCompany.trim()) {
      Alert.alert("Fehler", "Bitte Unternehmensname eingeben.");
      return;
    }
    setLoading(true);
    try {
      await register({
        email: regEmail.trim(),
        password: regPassword,
        name: regName.trim(),
        company: regCompany.trim(),
        sector: regSector,
      });
      router.replace("/(tabs)/dashboard");
    } catch {
      Alert.alert("Registrierung fehlgeschlagen", "Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a5276" />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: "#1a5276",
              paddingTop: 60,
              paddingBottom: 40,
              paddingHorizontal: 24,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="shield-checkmark" size={36} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold", letterSpacing: -0.5 }}>
              Sustainable Supply Academy
            </Text>
            <Text style={{ color: "#93c5fd", fontSize: 13, marginTop: 4, textAlign: "center" }}>
              EU-Compliance für indonesische Exporteure
            </Text>
          </View>

          {/* Tab Switcher */}
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: 24,
              marginTop: 24,
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
              padding: 4,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: activeTab === "login" ? "#fff" : "transparent",
                shadowColor: activeTab === "login" ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: activeTab === "login" ? 2 : 0,
              }}
              onPress={() => setActiveTab("login")}
            >
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 14,
                  color: activeTab === "login" ? "#1a5276" : "#6b7280",
                }}
              >
                Anmelden
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: activeTab === "register" ? "#fff" : "transparent",
                shadowColor: activeTab === "register" ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: activeTab === "register" ? 2 : 0,
              }}
              onPress={() => setActiveTab("register")}
            >
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 14,
                  color: activeTab === "register" ? "#1a5276" : "#6b7280",
                }}
              >
                Registrieren
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
            {activeTab === "login" ? (
              <View>
                <FormLabel text="E-Mail-Adresse" />
                <TextInput
                  style={inputStyle}
                  placeholder="deine@email.com"
                  placeholderTextColor="#9ca3af"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <FormLabel text="Passwort" />
                <TextInput
                  style={[inputStyle, { marginBottom: 24 }]}
                  placeholder="Mindestens 6 Zeichen"
                  placeholderTextColor="#9ca3af"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: "#1a5276",
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                      Anmelden
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={{ textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 16 }}>
                  Noch kein Konto?{" "}
                  <Text
                    style={{ color: "#1a5276", fontWeight: "600" }}
                    onPress={() => setActiveTab("register")}
                  >
                    Jetzt registrieren
                  </Text>
                </Text>
              </View>
            ) : (
              <View>
                <FormLabel text="Vollständiger Name *" />
                <TextInput
                  style={inputStyle}
                  placeholder="Dein Name"
                  placeholderTextColor="#9ca3af"
                  value={regName}
                  onChangeText={setRegName}
                  autoCapitalize="words"
                />

                <FormLabel text="E-Mail-Adresse *" />
                <TextInput
                  style={inputStyle}
                  placeholder="deine@email.com"
                  placeholderTextColor="#9ca3af"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <FormLabel text="Passwort *" />
                <TextInput
                  style={inputStyle}
                  placeholder="Mindestens 6 Zeichen"
                  placeholderTextColor="#9ca3af"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  secureTextEntry
                />

                <FormLabel text="Unternehmen *" />
                <TextInput
                  style={inputStyle}
                  placeholder="Name deines Unternehmens"
                  placeholderTextColor="#9ca3af"
                  value={regCompany}
                  onChangeText={setRegCompany}
                />

                <FormLabel text="Branche *" />
                <TouchableOpacity
                  style={[
                    inputStyle,
                    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
                  ]}
                  onPress={() => setShowSectorPicker(!showSectorPicker)}
                >
                  <Text style={{ color: "#111827", fontSize: 16 }}>{regSector}</Text>
                  <Ionicons
                    name={showSectorPicker ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#6b7280"
                  />
                </TouchableOpacity>

                {showSectorPicker && (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 12,
                      marginBottom: 16,
                      backgroundColor: "#fff",
                      overflow: "hidden",
                    }}
                  >
                    {SECTORS.map((sector, idx) => (
                      <TouchableOpacity
                        key={sector}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: regSector === sector ? "#eff6ff" : "#fff",
                          borderBottomWidth: idx < SECTORS.length - 1 ? 1 : 0,
                          borderBottomColor: "#f3f4f6",
                        }}
                        onPress={() => {
                          setRegSector(sector);
                          setShowSectorPicker(false);
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            color: regSector === sector ? "#1a5276" : "#374151",
                            fontWeight: regSector === sector ? "600" : "400",
                          }}
                        >
                          {sector}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: "#1a5276",
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                    marginTop: 8,
                  }}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                      Konto erstellen
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={{ textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 16 }}>
                  Bereits registriert?{" "}
                  <Text
                    style={{ color: "#1a5276", fontWeight: "600" }}
                    onPress={() => setActiveTab("login")}
                  >
                    Jetzt anmelden
                  </Text>
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function FormLabel({ text }: { text: string }) {
  return (
    <Text
      style={{ color: "#374151", fontWeight: "600", fontSize: 13, marginBottom: 6 }}
    >
      {text}
    </Text>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 13,
  color: "#111827",
  fontSize: 16,
  backgroundColor: "#f9fafb",
  marginBottom: 16,
};
