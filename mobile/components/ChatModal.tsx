import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/constants/api";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { storage, ScanResult } from "@/lib/storage";
import { DOCUMENTS } from "@/lib/documents";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ChatDocument {
  filename: string;
  name: string;
}

const CHAT_HISTORY_KEY = "@ieu_cepa:chat_history";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

// Serialise/deserialise Date objects for AsyncStorage
function serializeMessages(msgs: Message[]): string {
  return JSON.stringify(msgs.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })));
}
function deserializeMessages(raw: string): Message[] {
  return JSON.parse(raw).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSourcePress?: (source: string) => void;
  /** Pre-scope the chat to a single document (Knowledge Hub → "Ask AI"). */
  initialDocument?: ChatDocument | null;
  /** When set together with initialDocument, this prompt is sent automatically on open. */
  autoPrompt?: string;
}

export default function ChatModal({ visible, onClose, onSourcePress, initialDocument, autoPrompt }: ChatModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scopedDoc, setScopedDoc] = useState<ChatDocument | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  // Mirror scopedDoc into a ref so async senders (auto-prompt) always see the latest value.
  const scopedDocRef = useRef<ChatDocument | null>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    scopedDocRef.current = scopedDoc;
  }, [scopedDoc]);

  const quickActions: { label: string; message: string }[] = scopedDoc
    ? [
        { label: t("chat.docQuickSummary"), message: t("chat.summarizePrompt") },
        { label: t("chat.docQuickObligations"), message: t("chat.docQuickObligations") },
        { label: t("chat.docQuickDeadlines"), message: t("chat.docQuickDeadlines") },
      ]
    : [t("chat.quick1"), t("chat.quick5"), t("chat.quick2"), t("chat.quick4")].map((a) => ({
        label: a,
        message: a,
      }));

  const getInitialMessage = (): Message => ({
    id: "init",
    role: "assistant",
    content: t("chat.initialMessage"),
    sources: [],
    timestamp: new Date(),
  });

  useEffect(() => {
    if (visible) {
      setInput("");
      setScopedDoc(initialDocument ?? null);
      scopedDocRef.current = initialDocument ?? null;
      autoSentRef.current = false;
      storage.getLastScan().then(setLastScan);
      AsyncStorage.getItem(CHAT_HISTORY_KEY).then((raw) => {
        if (raw) {
          const loaded = deserializeMessages(raw);
          // Always show greeting in the currently selected language
          if (loaded[0]?.id === "init") {
            loaded[0] = getInitialMessage();
          }
          setMessages(loaded);
        } else {
          setMessages([getInitialMessage()]);
        }
        // Auto-send (e.g. "summarize this document") once messages are ready
        if (autoPrompt && (initialDocument ?? null) && !autoSentRef.current) {
          autoSentRef.current = true;
          setTimeout(() => sendMessage(autoPrompt), 500);
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    if (messages.length === 0) return;
    AsyncStorage.setItem(CHAT_HISTORY_KEY, serializeMessages(messages));
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const history = updatedMessages
        .filter((m) => m.id !== "init")
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const userContext = user
        ? {
            company: user.company,
            sector: user.sector,
            last_score: lastScan?.score,
            missing_requirements: lastScan?.missing_requirements?.slice(0, 4),
          }
        : {};

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history,
          language: i18n.language,
          user_context: userContext,
          document: scopedDocRef.current?.filename ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server-Fehler: ${response.status}`);
      }

      const res: { answer: string; sources: string[] } = await response.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        sources: res.sources ?? [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t("chat.error"),
        sources: [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.surface }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.primaryStrong,
            paddingTop: insets.top + 12,
            paddingBottom: 16,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.onPrimary + "33",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.onPrimary, fontWeight: "bold", fontSize: 16 }}>{t("chat.title")}</Text>
            <Text style={{ color: colors.onPrimary + "AA", fontSize: 12 }}>{t("chat.subtitle")}</Text>
          </View>
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.onPrimary + "26",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
            }}
            onPress={async () => {
              await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
              setMessages([getInitialMessage()]);
            }}
          >
            <Ionicons name="trash-outline" size={17} color={colors.onPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.onPrimary + "26",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 6,
            borderBottomWidth: 1,
            borderBottomColor: colors.surfaceAlt,
            flexWrap: "wrap",
          }}
        >
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: colors.secondary + "1A",
                borderWidth: 1,
                borderColor: colors.secondary + "40",
              }}
              onPress={() => sendMessage(action.message)}
              disabled={loading}
            >
              <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: "600" }}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                marginBottom: 12,
                maxWidth: "85%",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, marginLeft: 4 }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: colors.secondary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 6,
                    }}
                  >
                    <Ionicons name="sparkles" size={10} color={colors.onPrimary} />
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{t("chat.title")}</Text>
                </View>
              )}

              <View
                style={{
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: msg.role === "user" ? colors.primary : colors.surfaceAlt,
                  borderBottomRightRadius: msg.role === "user" ? 4 : 18,
                  borderBottomLeftRadius: msg.role === "assistant" ? 4 : 18,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 20,
                    color: msg.role === "user" ? colors.onPrimary : colors.text,
                  }}
                >
                  {msg.content}
                </Text>
              </View>

              {/* Sources */}
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6, marginLeft: 4, gap: 4 }}>
                  {msg.sources.map((source, i) => (
                    <TouchableOpacity
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: onSourcePress ? colors.primary + "1A" : colors.secondary + "1A",
                        borderWidth: 1,
                        borderColor: onSourcePress ? colors.primary + "40" : colors.secondary + "40",
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                      onPress={() => {
                        if (onSourcePress) {
                          onClose();
                          setTimeout(() => onSourcePress(source), 300);
                        }
                      }}
                      activeOpacity={onSourcePress ? 0.7 : 1}
                    >
                      <Ionicons
                        name={onSourcePress ? "library-outline" : "document-text-outline"}
                        size={10}
                        color={onSourcePress ? colors.primary : colors.secondary}
                        style={{ marginRight: 3 }}
                      />
                      <Text style={{ color: onSourcePress ? colors.primary : colors.secondary, fontSize: 11 }} numberOfLines={1}>
                        {source}
                      </Text>
                      {onSourcePress && (
                        <Ionicons name="chevron-forward" size={9} color={colors.primary} style={{ marginLeft: 2 }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* DP7: AI disclaimer on non-initial assistant messages */}
              {msg.role === "assistant" && msg.id !== "init" && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5, marginLeft: 4 }}>
                  <Ionicons name="information-circle-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 10, flex: 1, lineHeight: 13 }}>
                    {t("chat.disclaimer")}
                  </Text>
                </View>
              )}

              <Text
                style={{
                  fontSize: 10,
                  color: colors.textSecondary,
                  marginTop: 4,
                  textAlign: msg.role === "user" ? "right" : "left",
                  marginLeft: msg.role === "assistant" ? 4 : 0,
                  marginRight: msg.role === "user" ? 4 : 0,
                }}
              >
                {msg.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={{ alignSelf: "flex-start", marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 18,
                  borderBottomLeftRadius: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t("chat.responding")}</Text>
              </View>
            </View>
          )}

          {/* DP8: Expert escalation card – shown after at least one exchange */}
          {messages.length >= 3 && (
            <View
              style={{
                marginHorizontal: 4,
                marginBottom: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.secondary + "40",
                backgroundColor: colors.secondary + "0D",
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Ionicons name="people" size={14} color={colors.secondary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.secondary, fontWeight: "700", fontSize: 13 }}>
                  {t("chat.expertTitle")}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginBottom: 10 }}>
                {t("chat.expertText")}
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.secondary,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  alignSelf: "flex-start",
                }}
                onPress={() => Linking.openURL("mailto:expert@sustainable-supply.academy?subject=IEU-CEPA%20Compliance%20Beratung")}
              >
                <Ionicons name="mail-outline" size={13} color={colors.onPrimary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.onPrimary, fontSize: 12, fontWeight: "600" }}>
                  {t("chat.expertBtn")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Bottom: document scope chip + input */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.surfaceAlt,
            backgroundColor: colors.surface,
            paddingBottom: Math.max(insets.bottom + 12, 75),
          }}
        >
          {/* Active document scope */}
          {scopedDoc && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginHorizontal: 16,
                marginTop: 10,
                backgroundColor: colors.primary + "14",
                borderWidth: 1,
                borderColor: colors.primary + "40",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 7,
              }}
            >
              <Ionicons name="document-text" size={13} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.primary, fontSize: 10, opacity: 0.8 }}>{t("chat.scopeLabel")}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }} numberOfLines={1}>
                  {scopedDoc.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setScopedDoc(null)} hitSlop={8} style={{ marginLeft: 6 }}>
                <Ionicons name="close-circle" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              paddingHorizontal: 16,
              paddingTop: 10,
            }}
          >
            {/* Pick document */}
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: scopedDoc ? colors.primary + "1A" : colors.surfaceAlt,
                borderWidth: 1,
                borderColor: scopedDoc ? colors.primary + "40" : colors.border,
                marginRight: 8,
              }}
              onPress={() => {
                setPickerQuery("");
                setPickerVisible(true);
              }}
              accessibilityLabel={t("chat.pickDocument")}
            >
              <Ionicons
                name="document-attach-outline"
                size={20}
                color={scopedDoc ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 10,
                color: colors.text,
                fontSize: 14,
                backgroundColor: colors.inputBackground,
                marginRight: 10,
                maxHeight: 100,
              }}
              placeholder={t("chat.placeholder")}
              placeholderTextColor={colors.placeholder}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
              submitBehavior="newline"
            />
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: input.trim() && !loading ? colors.primary : colors.border,
              }}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Ionicons
                name="send"
                size={18}
                color={input.trim() && !loading ? colors.onPrimary : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Document picker */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          <View
            style={{
              backgroundColor: colors.primaryStrong,
              paddingTop: insets.top + 12,
              paddingBottom: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ flex: 1, color: colors.onPrimary, fontWeight: "bold", fontSize: 16 }}>
              {t("chat.pickerTitle")}
            </Text>
            <TouchableOpacity
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.onPrimary + "26",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => setPickerVisible(false)}
            >
              <Ionicons name="close" size={19} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.inputBackground,
                borderRadius: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: colors.inputBorder,
              }}
            >
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={{ flex: 1, color: colors.text, fontSize: 14, paddingVertical: 9, paddingHorizontal: 8 }}
                placeholder={t("chat.pickerSearch")}
                placeholderTextColor={colors.placeholder}
                value={pickerQuery}
                onChangeText={setPickerQuery}
                autoCorrect={false}
              />
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
            {DOCUMENTS.filter((d) => {
              const q = pickerQuery.trim().toLowerCase();
              return !q || d.name.toLowerCase().includes(q) || d.filename.toLowerCase().includes(q);
            }).map((d) => (
              <TouchableOpacity
                key={d.filename}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => {
                  setScopedDoc({ filename: d.filename, name: d.name });
                  setPickerVisible(false);
                }}
              >
                <Ionicons name="document-text" size={16} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, color: colors.text, fontSize: 12, fontWeight: "600" }} numberOfLines={2}>
                  {d.name}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}
