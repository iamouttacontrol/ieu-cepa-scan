import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { storage, ScanResult } from "@/lib/storage";

type Priority = "Alle" | "Hoch" | "Mittel" | "Niedrig";

const FILTER_TABS: Priority[] = ["Alle", "Hoch", "Mittel", "Niedrig"];

function getPriorityForIndex(index: number, total: number): Priority {
  const ratio = index / total;
  if (ratio < 0.34) return "Hoch";
  if (ratio < 0.67) return "Mittel";
  return "Niedrig";
}

function getPriorityColor(priority: Priority): string {
  if (priority === "Hoch") return "#e74c3c";
  if (priority === "Mittel") return "#f39c12";
  if (priority === "Niedrig") return "#27ae60";
  return "#9ca3af";
}

function getPriorityBg(priority: Priority): string {
  if (priority === "Hoch") return "#fef2f2";
  if (priority === "Mittel") return "#fffbeb";
  if (priority === "Niedrig") return "#f0fdf4";
  return "#f9fafb";
}

function getPriorityBorderColor(priority: Priority): string {
  if (priority === "Hoch") return "#fecaca";
  if (priority === "Mittel") return "#fde68a";
  if (priority === "Niedrig") return "#bbf7d0";
  return "#e5e7eb";
}

interface ActionItem {
  id: string;
  text: string;
  priority: Priority;
  completed: boolean;
}

function getRiskColor(riskLevel: string): string {
  const l = riskLevel?.toLowerCase();
  if (l === "hoch" || l === "high") return "#e74c3c";
  if (l === "mittel" || l === "medium") return "#f39c12";
  if (l === "niedrig" || l === "low") return "#27ae60";
  return "#9ca3af";
}

function getRiskLabel(riskLevel: string): string {
  const l = riskLevel?.toLowerCase();
  if (l === "high") return "Hoch";
  if (l === "medium") return "Mittel";
  if (l === "low") return "Niedrig";
  return riskLevel ?? "–";
}

export default function ActionPlanScreen() {
  const router = useRouter();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [filter, setFilter] = useState<Priority>("Alle");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const latestScan = await storage.getLastScan();
    if (latestScan) {
      setScan(latestScan);
      const saved = await storage.getActionCompleted(latestScan.id);
      const items: ActionItem[] = latestScan.action_plan.map((text, idx) => ({
        id: `${latestScan.id}-${idx}`,
        text,
        priority: getPriorityForIndex(idx, latestScan.action_plan.length),
        completed: saved[idx] ?? false,
      }));
      setActionItems(items);
    } else {
      setScan(null);
      setActionItems([]);
    }
  };

  const toggleItem = (id: string) => {
    setActionItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      // Persist completed state
      if (scan) {
        storage.setActionCompleted(scan.id, updated.map((i) => i.completed));
      }
      return updated;
    });
  };

  const filteredItems =
    filter === "Alle" ? actionItems : actionItems.filter((i) => i.priority === filter);

  const completedCount = actionItems.filter((i) => i.completed).length;
  const totalCount = actionItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!scan) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#1a5276" />
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <View style={{ backgroundColor: "#1a5276", paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Aktionsplan</Text>
            <Text style={{ color: "#93c5fd", fontSize: 12, marginTop: 2 }}>Priorisierte Compliance-Schritte</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="list-circle-outline" size={44} color="#9ca3af" />
            </View>
            <Text style={{ color: "#1f2937", fontWeight: "bold", fontSize: 18, textAlign: "center" }}>
              Noch kein Aktionsplan
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              Führe zuerst einen Readiness Scan durch, um deinen personalisierten Aktionsplan zu erhalten.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#1a5276",
                borderRadius: 12,
                paddingHorizontal: 32,
                paddingVertical: 14,
                marginTop: 24,
              }}
              onPress={() => router.push("/(tabs)/scan")}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>Scan starten</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // ── Loaded state ───────────────────────────────────────────────────────────
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a5276" />
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        {/* Header */}
        <View style={{ backgroundColor: "#1a5276", paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Aktionsplan</Text>
              <Text style={{ color: "#93c5fd", fontSize: 12, marginTop: 2 }}>
                {scan.company_name} · Score: {scan.score}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor: getRiskColor(scan.risk_level) + "33",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {getRiskLabel(scan.risk_level)}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: "#bfdbfe", fontSize: 11 }}>Fortschritt</Text>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                {completedCount}/{totalCount} erledigt ({progressPercent}%)
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 3, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  backgroundColor: "#fff",
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6, gap: 8 }}>
          {FILTER_TABS.map((tab) => {
            const count =
              tab === "Alle"
                ? actionItems.length
                : actionItems.filter((i) => i.priority === tab).length;
            const isActive = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1,
                  backgroundColor: isActive ? "#1a5276" : "#fff",
                  borderColor: isActive ? "#1a5276" : "#e5e7eb",
                }}
                onPress={() => setFilter(tab)}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? "#fff" : "#6b7280" }}>
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Items */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
          {filteredItems.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Ionicons name="checkmark-done-circle" size={52} color="#27ae60" />
              <Text style={{ color: "#374151", fontWeight: "600", fontSize: 15, marginTop: 12 }}>
                Alle Punkte erledigt!
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
                Gut gemacht! Du bist auf dem richtigen Weg.
              </Text>
            </View>
          ) : (
            filteredItems.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={{
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1.5,
                  backgroundColor: item.completed ? "#f9fafb" : getPriorityBg(item.priority),
                  borderColor: item.completed ? "#e5e7eb" : getPriorityBorderColor(item.priority),
                  opacity: item.completed ? 0.65 : 1,
                }}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  {/* Checkbox */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      marginRight: 12,
                      marginTop: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      backgroundColor: item.completed ? "#27ae60" : "transparent",
                      borderColor: item.completed ? "#27ae60" : "#d1d5db",
                    }}
                  >
                    {item.completed && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>

                  <View style={{ flex: 1 }}>
                    {/* Priority badge + index */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: getPriorityColor(item.priority) + "22",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: getPriorityColor(item.priority) }}>
                          {item.priority}
                        </Text>
                      </View>
                      <Text style={{ color: "#d1d5db", fontSize: 11 }}>#{idx + 1}</Text>
                    </View>

                    {/* Text */}
                    <Text
                      style={{
                        fontSize: 13,
                        lineHeight: 19,
                        color: item.completed ? "#9ca3af" : "#1f2937",
                        textDecorationLine: item.completed ? "line-through" : "none",
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Start new scan CTA */}
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: "center",
              marginTop: 8,
              marginBottom: 32,
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#fff",
            }}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <Ionicons name="refresh-outline" size={16} color="#6b7280" />
            <Text style={{ color: "#6b7280", fontWeight: "600", fontSize: 14 }}>Neuer Scan</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}
