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
}

const QUICK_ACTIONS = [
  "Was ist der DPP?",
  "EUDR erklären",
  "CE-Kennzeichnung",
  "ESG-Pflichten",
];

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "Hallo! Ich bin dein KI-Assistent für EU-Compliance-Fragen. Ich helfe dir bei Fragen zu EU-Regularien, Dokumentationsanforderungen und Compliance-Prozessen für indonesische Exporteure. Wie kann ich dir helfen?",
  sources: [],
  timestamp: new Date(),
};

export default function ChatModal({ visible, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setMessages([{ ...INITIAL_MESSAGE, timestamp: new Date() }]);
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
        content:
          "Entschuldigung, ich konnte keine Verbindung zum Server herstellen. Bitte stelle sicher, dass das Backend unter localhost:8000 läuft und versuche es erneut.",
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
      <StatusBar barStyle="light-content" backgroundColor="#1a5276" />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#1a5276",
            paddingTop: 56,
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
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>KI-Assistent</Text>
            <Text style={{ color: "#93c5fd", fontSize: 12 }}>EU-Rechtsexperten-KI · localhost:8000</Text>
          </View>
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#fff" />
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
            borderBottomColor: "#f3f4f6",
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
                backgroundColor: "#eff6ff",
                borderWidth: 1,
                borderColor: "#bfdbfe",
              }}
              onPress={() => sendMessage(action)}
              disabled={loading}
            >
              <Text style={{ color: "#1a5276", fontSize: 12, fontWeight: "600" }}>{action}</Text>
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
                      backgroundColor: "#1a5276",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 6,
                    }}
                  >
                    <Ionicons name="sparkles" size={10} color="#fff" />
                  </View>
                  <Text style={{ color: "#9ca3af", fontSize: 11 }}>KI-Assistent</Text>
                </View>
              )}

              <View
                style={{
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: msg.role === "user" ? "#1a5276" : "#f3f4f6",
                  borderBottomRightRadius: msg.role === "user" ? 4 : 18,
                  borderBottomLeftRadius: msg.role === "assistant" ? 4 : 18,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 20,
                    color: msg.role === "user" ? "#fff" : "#1f2937",
                  }}
                >
                  {msg.content}
                </Text>
              </View>

              {/* Sources */}
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6, marginLeft: 4, gap: 4 }}>
                  {msg.sources.map((source, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#eff6ff",
                        borderWidth: 1,
                        borderColor: "#bfdbfe",
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Ionicons name="document-text-outline" size={10} color="#1a5276" style={{ marginRight: 3 }} />
                      <Text style={{ color: "#1a5276", fontSize: 11 }} numberOfLines={1}>
                        {source}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
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
                  backgroundColor: "#f3f4f6",
                  borderRadius: 18,
                  borderBottomLeftRadius: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" color="#1a5276" />
                <Text style={{ color: "#6b7280", fontSize: 13 }}>Antwortet...</Text>
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
            borderTopColor: "#f3f4f6",
            backgroundColor: "#fff",
          }}
        >
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: "#111827",
              fontSize: 14,
              backgroundColor: "#f9fafb",
              marginRight: 10,
              maxHeight: 100,
            }}
            placeholder="Stelle eine EU-Compliance-Frage..."
            placeholderTextColor="#9ca3af"
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
              backgroundColor: input.trim() && !loading ? "#1a5276" : "#e5e7eb",
            }}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Ionicons
              name="send"
              size={18}
              color={input.trim() && !loading ? "#fff" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
