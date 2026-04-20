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
import { storage, ScanResult, ActionItem, GapPriority, EffortLevel } from "@/lib/storage";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

type FilterKey = "all" | GapPriority;
const FILTER_KEYS: FilterKey[] = ["all", "critical", "significant", "monitored"];

// Derive ActionItems from scan — prefer structured action_items, fall back to action_plan strings
function buildActionItems(scan: ScanResult): ActionItem[] {
  if (scan.action_items && scan.action_items.length > 0) {
    return scan.action_items;
  }
  // Legacy fallback: derive priority from position
  const total = scan.action_plan.length;
  return scan.action_plan.map((text, idx) => {
    const ratio = total > 1 ? idx / (total - 1) : 0;
    const priority: GapPriority = ratio < 0.34 ? "critical" : ratio < 0.67 ? "significant" : "monitored";
    const effort: EffortLevel = ratio < 0.34 ? "high" : ratio < 0.67 ? "medium" : "low";
    return { text, dimension: "", effort, priority };
  });
}

interface TrackedItem extends ActionItem {
  id: string;
  completed: boolean;
}

export default function ActionPlanScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [items, setItems] = useState<TrackedItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");

  // ── Color helpers ──────────────────────────────────────────────────────────

  function priorityColor(p: GapPriority): string {
    if (p === "critical") return colors.error;
    if (p === "significant") return colors.warning;
    if (p === "monitored") return colors.primary;
    return colors.success;
  }

  function effortColor(e: EffortLevel): string {
    if (e === "high") return colors.error;
    if (e === "medium") return colors.warning;
    return colors.success;
  }

  function getRiskColor(riskLevel: string): string {
    const l = riskLevel?.toLowerCase();
    if (l === "hoch" || l === "high") return colors.error;
    if (l === "mittel" || l === "medium") return colors.warning;
    if (l === "niedrig" || l === "low") return colors.success;
    return colors.textSecondary;
  }

  const getRiskLabel = (riskLevel: string): string => {
    const l = riskLevel?.toLowerCase();
    if (l === "high") return t("common.risk.high");
    if (l === "medium") return t("common.risk.medium");
    if (l === "low") return t("common.risk.low");
    return riskLevel ?? "–";
  };

  // ── Load data ──────────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const latestScan = await storage.getLastScan();
    if (latestScan) {
      setScan(latestScan);
      const savedCompleted = await storage.getActionCompleted(latestScan.id);
      const actionItems = buildActionItems(latestScan);
      const tracked: TrackedItem[] = actionItems.map((item, idx) => ({
        ...item,
        id: `${latestScan.id}-${idx}`,
        completed: savedCompleted[idx] ?? false,
      }));
      setItems(tracked);
    } else {
      setScan(null);
      setItems([]);
    }
  };

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      if (scan) {
        storage.setActionCompleted(scan.id, updated.map((i) => i.completed));
      }
      return updated;
    });
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const filteredItems =
    filter === "all" ? items : items.filter((i) => i.priority === filter);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const countForFilter = (key: FilterKey) =>
    key === "all" ? items.length : items.filter((i) => i.priority === key).length;

  const getPriorityLabel = (p: GapPriority): string => {
    switch (p) {
      case "critical": return t("actionPlan.priority.critical");
      case "significant": return t("actionPlan.priority.significant");
      case "monitored": return t("actionPlan.priority.monitored");
      default: return p;
    }
  };

  const getEffortLabel = (e: EffortLevel): string => {
    return t(`scan.effort.${e}`, { defaultValue: e });
  };

  const getFilterLabel = (key: FilterKey): string => {
    if (key === "all") return t("actionPlan.filter.all");
    return t(`actionPlan.filter.${key}`, { defaultValue: key });
  };

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!scan) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ backgroundColor: colors.primaryStrong, paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 20 }}>
            <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: "bold" }}>{t("actionPlan.title")}</Text>
            <Text style={{ color: colors.onPrimary + "AA", fontSize: 12, marginTop: 2 }}>{t("actionPlan.subtitle")}</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="list-circle-outline" size={44} color={colors.textSecondary} />
            </View>
            <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18, textAlign: "center" }}>
              {t("actionPlan.noScan")}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              {t("actionPlan.noScanText")}
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 24 }}
              onPress={() => router.push("/(tabs)/scan")}
            >
              <Text style={{ color: colors.buttonText, fontWeight: "bold", fontSize: 15 }}>{t("common.startScan")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // ── Loaded state ───────────────────────────────────────────────────────────

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryStrong} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header */}
        <View style={{ backgroundColor: colors.primaryStrong, paddingTop: insets.top + 12, paddingBottom: 20, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: "bold" }}>{t("actionPlan.title")}</Text>
              <Text style={{ color: colors.onPrimary + "AA", fontSize: 12, marginTop: 2 }}>
                {scan.company_name} · {t("common.score")}: {scan.score}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: getRiskColor(scan.risk_level) + "33" }}>
              <Text style={{ color: colors.onPrimary, fontSize: 12, fontWeight: "700" }}>
                {getRiskLabel(scan.risk_level)}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: colors.onPrimary + "66", fontSize: 11 }}>{t("actionPlan.progress")}</Text>
              <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: "600" }}>
                {completedCount}/{totalCount} {t("actionPlan.completed")} ({progressPercent}%)
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.onPrimary + "40", borderRadius: 3, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${progressPercent}%`, backgroundColor: colors.onPrimary, borderRadius: 3 }} />
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6, gap: 8 }}>
          {FILTER_KEYS.map((key) => {
            const count = countForFilter(key);
            const isActive = filter === key;
            const activeColor = key === "critical" ? colors.error : key === "significant" ? colors.warning : key === "monitored" ? colors.primary : colors.primaryStrong;
            return (
              <TouchableOpacity
                key={key}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
                  backgroundColor: isActive ? (key === "all" ? colors.primaryStrong : activeColor + "22") : colors.surface,
                  borderColor: isActive ? (key === "all" ? colors.primaryStrong : activeColor) : colors.border,
                }}
                onPress={() => setFilter(key)}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? (key === "all" ? colors.onPrimary : activeColor) : colors.textSecondary }}>
                  {getFilterLabel(key)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Items */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
          {filteredItems.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Ionicons name="checkmark-done-circle" size={52} color={colors.success} />
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15, marginTop: 12 }}>
                {t("actionPlan.allDone")}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {t("actionPlan.allDoneText")}
              </Text>
            </View>
          ) : (
            filteredItems.map((item, idx) => {
              const pc = priorityColor(item.priority);
              const ec = effortColor(item.effort);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={{
                    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5,
                    backgroundColor: item.completed ? colors.background : pc + "0D",
                    borderColor: item.completed ? colors.border : pc + "44",
                    opacity: item.completed ? 0.65 : 1,
                  }}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    {/* Checkbox */}
                    <View
                      style={{
                        width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                        marginRight: 12, marginTop: 1, alignItems: "center", justifyContent: "center", flexShrink: 0,
                        backgroundColor: item.completed ? colors.success : "transparent",
                        borderColor: item.completed ? colors.success : colors.border,
                      }}
                    >
                      {item.completed && <Ionicons name="checkmark" size={13} color={colors.onPrimary} />}
                    </View>

                    <View style={{ flex: 1 }}>
                      {/* Badges row */}
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                          {/* Priority badge */}
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: pc + "22" }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: pc }}>
                              {getPriorityLabel(item.priority)}
                            </Text>
                          </View>
                          {/* Effort badge */}
                          <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: ec + "1A", flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Ionicons name="time-outline" size={10} color={ec} />
                            <Text style={{ fontSize: 10, fontWeight: "600", color: ec }}>
                              {t("actionPlan.effort")}: {getEffortLabel(item.effort)}
                            </Text>
                          </View>
                        </View>
                        {/* Dimension tag + index */}
                        <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                          {item.dimension ? (
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.surfaceAlt }}>
                              <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "600" }}>{item.dimension}</Text>
                            </View>
                          ) : null}
                          <Text style={{ color: colors.border, fontSize: 11 }}>#{idx + 1}</Text>
                        </View>
                      </View>

                      {/* Action text */}
                      <Text
                        style={{
                          fontSize: 13, lineHeight: 19,
                          color: item.completed ? colors.textSecondary : colors.text,
                          textDecorationLine: item.completed ? "line-through" : "none",
                        }}
                      >
                        {item.text}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* New scan CTA */}
          <TouchableOpacity
            style={{
              borderWidth: 1, borderColor: colors.border, borderRadius: 16,
              paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 32,
              flexDirection: "row", justifyContent: "center", gap: 8,
              backgroundColor: colors.card,
            }}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.buttonSecondaryText, fontWeight: "600", fontSize: 14 }}>{t("actionPlan.newScan")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}
