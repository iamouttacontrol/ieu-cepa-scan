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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/constants/api";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSourcePress?: (source: string) => void;
}

export default function ChatModal({ visible, onClose, onSourcePress }: ChatModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const QUICK_ACTIONS = [
    t("chat.quick1"),
    t("chat.quick5"),
    t("chat.quick2"),
    t("chat.quick4"),
  ];

  const getInitialMessage = (): Message => ({
    id: "init",
    role: "assistant",
    content: t("chat.initialMessage"),
    sources: [],
    timestamp: new Date(),
  });

  useEffect(() => {
    if (visible) {
      setMessages([getInitialMessage()]);
      setInput("");
    }
  }, [visible]);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
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

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, history }),
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
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: colors.secondary + "1A",
                borderWidth: 1,
                borderColor: colors.secondary + "40",
              }}
              onPress={() => sendMessage(action)}
              disabled={loading}
            >
              <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: "600" }}>{action}</Text>
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

          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.surfaceAlt,
            backgroundColor: colors.surface,
            paddingBottom: Math.max(insets.bottom + 12, 75)
          }}
        >
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
            blurOnSubmit={false}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
