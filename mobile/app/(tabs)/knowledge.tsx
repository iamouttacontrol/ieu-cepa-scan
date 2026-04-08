import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { API_BASE_URL } from "@/constants/api";
import { ThemeColors } from "@/colors-indonesia";
import * as WebBrowser from "expo-web-browser";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeDoc {
  filename: string;
  name: string;
  size_kb: number;
}

interface SubFolder {
  name: string;
  docs: KnowledgeDoc[];
}

interface TopFolder {
  name: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  colorKey: keyof ThemeColors;
  subfolders: SubFolder[];
  directDocs: KnowledgeDoc[];
}

// ─── Folder metadata ──────────────────────────────────────────────────────────

const FOLDER_META: Record<string, { iconName: React.ComponentProps<typeof Ionicons>["name"]; colorKey: keyof ThemeColors }> = {
  "IEU-CEPA":                       { iconName: "globe",            colorKey: "primary" },
  "Environmental & Sustainability":  { iconName: "leaf",             colorKey: "success" },
  "Chemical _ Material Compliance":  { iconName: "flask",            colorKey: "error" },
  "Data & Digital":                  { iconName: "code-slash",       colorKey: "info" },
  "Food":                            { iconName: "restaurant",       colorKey: "accent" },
  "Procuct Compliance":              { iconName: "shield-checkmark", colorKey: "secondary" },
  "Sustainable Finance":             { iconName: "bar-chart",        colorKey: "warning" },
  "Waste Framework Directive":       { iconName: "trash-outline",    colorKey: "textSecondary" },
};

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildTree(docs: KnowledgeDoc[]): TopFolder[] {
  const map = new Map<string, { subfolders: Map<string, KnowledgeDoc[]>; directDocs: KnowledgeDoc[] }>();

  for (const doc of docs) {
    const parts = doc.filename.split("/");
    // parts[0] = "SSA Brain", parts[1] = category, parts[2+] = subfolder / file
    const category = parts[1] || "Other";
    if (!map.has(category)) {
      map.set(category, { subfolders: new Map(), directDocs: [] });
    }
    const entry = map.get(category)!;
    if (parts.length === 3) {
      entry.directDocs.push(doc);
    } else if (parts.length >= 4) {
      const sub = parts[2];
      if (!entry.subfolders.has(sub)) entry.subfolders.set(sub, []);
      entry.subfolders.get(sub)!.push(doc);
    }
  }

  const result: TopFolder[] = [];
  for (const [name, entry] of map) {
    const meta = FOLDER_META[name] ?? { iconName: "folder-outline" as const, colorKey: "textSecondary" as keyof ThemeColors };
    const subfolders: SubFolder[] = [];
    for (const [sfName, sfDocs] of entry.subfolders) {
      subfolders.push({ name: sfName, docs: sfDocs });
    }
    subfolders.sort((a, b) => a.name.localeCompare(b.name));
    result.push({ name, iconName: meta.iconName, colorKey: meta.colorKey, subfolders, directDocs: entry.directDocs });
  }

  result.sort((a, b) => {
    if (a.name === "IEU-CEPA") return -1;
    if (b.name === "IEU-CEPA") return 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function KnowledgeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { doc: selectedDoc } = useLocalSearchParams<{ doc?: string }>();

  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [openSubfolders, setOpenSubfolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const lastAutoOpenedDoc = useRef<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      if (!res.ok) throw new Error();
      const data: KnowledgeDoc[] = await res.json();
      setDocuments(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto-open PDF + expand parent folder when navigated from chat
  useEffect(() => {
    if (!selectedDoc || documents.length === 0) return;
    if (lastAutoOpenedDoc.current === selectedDoc) return;

    // Normalize path separators (Windows backslash → forward slash) before matching
    const normalizedSelected = selectedDoc.replace(/\\/g, "/");
    const doc =
      documents.find((d) => d.filename === normalizedSelected) ??
      documents.find((d) => d.filename.replace(/\\/g, "/") === normalizedSelected) ??
      documents.find((d) => d.filename.endsWith(normalizedSelected.split("/").pop() ?? ""));
    if (!doc) return;
    lastAutoOpenedDoc.current = selectedDoc;

    const parts = doc.filename.split("/");
    const category = parts[1];
    const subfolder = parts.length >= 4 ? parts[2] : null;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFolders((prev) => new Set([...prev, category]));
    if (subfolder) {
      setOpenSubfolders((prev) => new Set([...prev, `${category}/${subfolder}`]));
    }

    setTimeout(() => openPDF(doc), 600);
  }, [selectedDoc, documents]);

  const openPDF = async (doc: KnowledgeDoc) => {
    const url = `${API_BASE_URL}/documents/${encodeURIComponent(doc.filename)}`;
    setOpeningDoc(doc.filename);
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: colors.primaryStrong,
        controlsColor: colors.onPrimary,
      });
    } finally {
      setOpeningDoc(null);
    }
  };

  const toggleFolder = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSubfolder = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSubfolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tree = buildTree(documents);
  const totalDocs = documents.length;

  // ─── Search mode ────────────────────────────────────────────────────────────
  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? documents.filter((d) => d.name.toLowerCase().includes(query) || d.filename.toLowerCase().includes(query))
    : [];

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderDocRow = (doc: KnowledgeDoc, catColor: string, showPath = false) => {
    const isOpening = openingDoc === doc.filename;
    const isSelected = selectedDoc === doc.filename;
    const pathParts = doc.filename.split("/").slice(1, -1);

    return (
      <TouchableOpacity
        key={doc.filename}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isSelected ? catColor + "1A" : colors.card,
          borderRadius: 12,
          padding: 12,
          marginBottom: 6,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? catColor : colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: isSelected ? 2 : 1,
        }}
        onPress={() => openPDF(doc)}
        activeOpacity={0.75}
        disabled={isOpening}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            backgroundColor: catColor + "1A",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
            flexShrink: 0,
          }}
        >
          <Ionicons name="document-text" size={18} color={catColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 12, lineHeight: 17 }} numberOfLines={2}>
            {doc.name}
          </Text>
          {showPath && pathParts.length > 0 && (
            <Text style={{ color: catColor, fontSize: 10, marginTop: 2, opacity: 0.8 }} numberOfLines={1}>
              {pathParts.join(" › ")}
            </Text>
          )}
          <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
            PDF · {doc.size_kb} KB
          </Text>
        </View>
        <View
          style={{
            backgroundColor: catColor + "1A",
            borderRadius: 16,
            paddingHorizontal: 10,
            paddingVertical: 6,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
          }}
        >
          {isOpening ? (
            <ActivityIndicator size="small" color={catColor} />
          ) : (
            <Ionicons name="eye-outline" size={15} color={catColor} />
          )}
        </View>
      </TouchableOpacity>
    );
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
            paddingBottom: 16,
            paddingHorizontal: 20,
          }}
        >
          <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: "bold" }}>
            {t("knowledge.title")}
          </Text>
          <Text style={{ color: colors.onPrimary + "AA", fontSize: 12, marginTop: 2 }}>
            {t("knowledge.subtitle")}
          </Text>

          {/* Search bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.onPrimary + "1A",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.onPrimary + "33",
            }}
          >
            <Ionicons name="search" size={16} color={colors.onPrimary + "AA"} />
            <TextInput
              style={{
                flex: 1,
                color: colors.onPrimary,
                fontSize: 14,
                paddingVertical: 9,
                paddingHorizontal: 8,
              }}
              placeholder={t("knowledge.searchPlaceholder")}
              placeholderTextColor={colors.onPrimary + "66"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.onPrimary + "AA"} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>
              {t("knowledge.loading")}
            </Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginTop: 12, textAlign: "center" }}>
              {t("knowledge.errorTitle")}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
                marginTop: 16,
              }}
              onPress={fetchDocuments}
            >
              <Text style={{ color: colors.buttonText, fontWeight: "600" }}>{t("knowledge.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={fetchDocuments} tintColor={colors.primary} />}
          >
            {/* SSA Brain info bar */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 16,
                marginBottom: 12,
                backgroundColor: colors.primary + "1A",
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.primary + "33",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: colors.primaryStrong + "33",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Ionicons name="library" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 13 }}>SSA Brain</Text>
                <Text style={{ color: colors.primary + "AA", fontSize: 11, marginTop: 1 }}>
                  {totalDocs} {t("knowledge.docsIndexed")}
                </Text>
              </View>
            </View>

            {/* Search results */}
            {query ? (
              <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
                {searchResults.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Ionicons name="search-outline" size={36} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 10, textAlign: "center" }}>
                      {t("knowledge.noResults")}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10, fontWeight: "600" }}>
                      {searchResults.length} {t("knowledge.resultsFor")} „{searchQuery}"
                    </Text>
                    {searchResults.map((doc) => {
                      const parts = doc.filename.split("/");
                      const category = parts[1] || "";
                      const meta = FOLDER_META[category] ?? { colorKey: "textSecondary" as keyof ThemeColors };
                      const catColor = colors[meta.colorKey] as string;
                      return renderDocRow(doc, catColor, true);
                    })}
                  </>
                )}
              </View>
            ) : documents.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 }}>
                <Ionicons name="library-outline" size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginTop: 12, textAlign: "center" }}>
                  {t("knowledge.noDocsTitle")}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
                  {t("knowledge.noDocsText")}
                </Text>
              </View>
            ) : (
              /* Accordion tree */
              <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
                {tree.map((folder) => {
                  const catColor = colors[folder.colorKey] as string;
                  const isOpen = openFolders.has(folder.name);
                  const totalInFolder =
                    folder.directDocs.length +
                    folder.subfolders.reduce((acc, sf) => acc + sf.docs.length, 0);

                  return (
                    <View
                      key={folder.name}
                      style={{
                        marginBottom: 10,
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isOpen ? catColor + "40" : colors.border,
                        overflow: "hidden",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: isOpen ? 3 : 1,
                      }}
                    >
                      {/* Top-level folder header */}
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 14,
                          backgroundColor: isOpen ? catColor + "0D" : "transparent",
                        }}
                        onPress={() => toggleFolder(folder.name)}
                        activeOpacity={0.75}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: catColor + "1A",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Ionicons name={folder.iconName} size={18} color={catColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14 }}>
                            {folder.name}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>
                            {totalInFolder} {t("knowledge.docs")}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: catColor + "1A",
                            borderRadius: 10,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            marginRight: 8,
                          }}
                        >
                          <Text style={{ color: catColor, fontSize: 11, fontWeight: "700" }}>
                            {totalInFolder}
                          </Text>
                        </View>
                        <Ionicons
                          name={isOpen ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>

                      {/* Folder contents */}
                      {isOpen && (
                        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                          {/* Direct docs (no subfolder) */}
                          {folder.directDocs.length > 0 && (
                            <View style={{ marginTop: 4 }}>
                              {folder.directDocs.map((doc) => renderDocRow(doc, catColor))}
                            </View>
                          )}

                          {/* Subfolders */}
                          {folder.subfolders.map((sf) => {
                            const sfKey = `${folder.name}/${sf.name}`;
                            const sfOpen = openSubfolders.has(sfKey);
                            return (
                              <View
                                key={sf.name}
                                style={{
                                  marginTop: 8,
                                  backgroundColor: colors.background,
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  borderColor: sfOpen ? catColor + "33" : colors.border,
                                  overflow: "hidden",
                                }}
                              >
                                {/* Subfolder header */}
                                <TouchableOpacity
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    backgroundColor: sfOpen ? catColor + "0A" : "transparent",
                                  }}
                                  onPress={() => toggleSubfolder(sfKey)}
                                  activeOpacity={0.75}
                                >
                                  <Ionicons
                                    name={sfOpen ? "folder-open" : "folder"}
                                    size={16}
                                    color={catColor}
                                    style={{ marginRight: 8 }}
                                  />
                                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13, flex: 1 }}>
                                    {sf.name}
                                  </Text>
                                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginRight: 6 }}>
                                    {sf.docs.length}
                                  </Text>
                                  <Ionicons
                                    name={sfOpen ? "chevron-up" : "chevron-down"}
                                    size={14}
                                    color={colors.textSecondary}
                                  />
                                </TouchableOpacity>

                                {/* Subfolder docs */}
                                {sfOpen && (
                                  <View style={{ paddingHorizontal: 10, paddingBottom: 10, paddingTop: 4 }}>
                                    {sf.docs.map((doc) => renderDocRow(doc, catColor))}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}
