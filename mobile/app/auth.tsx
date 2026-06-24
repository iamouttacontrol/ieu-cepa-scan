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
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import i18n from "@/lib/i18n";
import { storage } from "@/lib/storage";
import { showAlert } from "@/lib/alert";

const LANGUAGES = [
  { code: "de", flag: "🇩🇪" },
  { code: "en", flag: "🇬🇧" },
  { code: "id", flag: "🇮🇩" },
];

type Tab = "login" | "register";

export default function AuthScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const SECTORS = t("scan.options.sectors", { returnObjects: true }) as string[];

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    await storage.setLanguage(code);
    setCurrentLang(code);
  };

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

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    marginBottom: 16,
  };

  const handleLogin = async () => {
    if (!loginEmail.trim()) {
      showAlert(t("auth.error"), t("auth.emailRequired"));
      return;
    }
    if (!loginPassword.trim()) {
      showAlert(t("auth.error"), t("auth.passwordRequired"));
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      router.replace("/(tabs)/dashboard");
    } catch (e) {
      console.error("Login failed", e);
      showAlert(t("auth.loginFailed"), t("auth.tryAgain"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim()) {
      showAlert(t("auth.error"), t("auth.nameRequired"));
      return;
    }
    if (!regEmail.trim()) {
      showAlert(t("auth.error"), t("auth.emailRequired"));
      return;
    }
    if (!regEmail.includes("@")) {
      showAlert(t("auth.error"), t("auth.emailInvalid"));
      return;
    }
    if (regPassword.length < 6) {
      showAlert(t("auth.error"), t("auth.passwordTooShort"));
      return;
    }
    if (!regCompany.trim()) {
      showAlert(t("auth.error"), t("auth.companyRequired"));
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
    } catch (e) {
      console.error("Registration failed", e);
      showAlert(t("auth.registerFailed"), t("auth.tryAgain"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.surface }}
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
              backgroundColor: colors.primaryStrong,
              paddingTop: insets.top + 12,
              paddingBottom: 40,
              paddingHorizontal: 24,
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignSelf: "flex-end", gap: 6, marginBottom: 12 }}>
              {LANGUAGES.map((lang) => {
                const isActive = currentLang === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isActive ? colors.onPrimary + "33" : "transparent",
                      borderWidth: isActive ? 1.5 : 0,
                      borderColor: colors.onPrimary + "66",
                    }}
                    onPress={() => handleLanguageChange(lang.code)}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 16 }}>{lang.flag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: colors.onPrimary + "33",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="shield-checkmark" size={36} color={colors.onPrimary} />
            </View>
            <Text style={{ color: colors.onPrimary, fontSize: 24, fontWeight: "bold", letterSpacing: -0.5 }}>
              Sustainable Supply Academy
            </Text>
            <Text style={{ color: colors.onPrimary + "AA", fontSize: 13, marginTop: 4, textAlign: "center" }}>
              {t("auth.appSubtitle")}
            </Text>
          </View>

          {/* Tab Switcher */}
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: 24,
              marginTop: 24,
              backgroundColor: colors.surfaceAlt,
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
                backgroundColor: activeTab === "login" ? colors.surface : "transparent",
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
                  color: activeTab === "login" ? colors.primaryStrong : colors.textSecondary,
                }}
              >
                {t("auth.login")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: activeTab === "register" ? colors.surface : "transparent",
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
                  color: activeTab === "register" ? colors.primaryStrong : colors.textSecondary,
                }}
              >
                {t("auth.register")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
            {activeTab === "login" ? (
              <View>
                <FormLabel text={t("auth.email")} color={colors.text} />
                <TextInput
                  style={inputStyle}
                  placeholder={t("auth.emailPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <FormLabel text={t("auth.password")} color={colors.text} />
                <TextInput
                  style={[inputStyle, { marginBottom: 24 }]}
                  placeholder={t("auth.passwordPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={{ color: colors.buttonText, fontWeight: "bold", fontSize: 16 }}>
                      {t("auth.loginBtn")}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={{ textAlign: "center", color: colors.textSecondary, fontSize: 13, marginTop: 16 }}>
                  {t("auth.noAccount")}{" "}
                  <Text
                    style={{ color: colors.secondary, fontWeight: "600" }}
                    onPress={() => setActiveTab("register")}
                  >
                    {t("auth.registerBtn")}
                  </Text>
                </Text>
              </View>
            ) : (
              <View>
                <FormLabel text={t("auth.name") + " *"} color={colors.text} />
                <TextInput
                  style={inputStyle}
                  placeholder={t("auth.namePlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={regName}
                  onChangeText={setRegName}
                  autoCapitalize="words"
                />

                <FormLabel text={t("auth.email") + " *"} color={colors.text} />
                <TextInput
                  style={inputStyle}
                  placeholder={t("auth.emailPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={regEmail}
                  onChangeText={setRegEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <FormLabel text={t("auth.password") + " *"} color={colors.text} />
                <TextInput
                  style={inputStyle}
                  placeholder={t("auth.passwordPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={regPassword}
                  onChangeText={setRegPassword}
                  secureTextEntry
                />

                <FormLabel text={t("auth.company") + " *"} color={colors.text} />
                <TextInput
                  style={inputStyle}
                  placeholder={t("auth.companyPlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={regCompany}
                  onChangeText={setRegCompany}
                />

                <FormLabel text={t("auth.sector") + " *"} color={colors.text} />
                <TouchableOpacity
                  style={[
                    inputStyle,
                    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
                  ]}
                  onPress={() => setShowSectorPicker(!showSectorPicker)}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>{regSector}</Text>
                  <Ionicons
                    name={showSectorPicker ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {showSectorPicker && (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      marginBottom: 16,
                      backgroundColor: colors.surface,
                      overflow: "hidden",
                    }}
                  >
                    {SECTORS.map((sector, idx) => (
                      <TouchableOpacity
                        key={sector}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: regSector === sector ? colors.secondary + "1A" : colors.surface,
                          borderBottomWidth: idx < SECTORS.length - 1 ? 1 : 0,
                          borderBottomColor: colors.surfaceAlt,
                        }}
                        onPress={() => {
                          setRegSector(sector);
                          setShowSectorPicker(false);
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            color: regSector === sector ? colors.secondary : colors.text,
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
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                    marginTop: 8,
                  }}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={{ color: colors.buttonText, fontWeight: "bold", fontSize: 16 }}>
                      {t("auth.registerBtn")}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={{ textAlign: "center", color: colors.textSecondary, fontSize: 13, marginTop: 16 }}>
                  {t("auth.hasAccount")}{" "}
                  <Text
                    style={{ color: colors.secondary, fontWeight: "600" }}
                    onPress={() => setActiveTab("login")}
                  >
                    {t("auth.loginBtn")}
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

function FormLabel({ text, color }: { text: string; color: string }) {
  return (
    <Text
      style={{ color, fontWeight: "600", fontSize: 13, marginBottom: 6 }}
    >
      {text}
    </Text>
  );
}
