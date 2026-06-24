import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface TabConfig {
  name: string;
  titleKey: string;
  icon: IoniconsName;
  iconOutline: IoniconsName;
}

const tabs: TabConfig[] = [
  {
    name: "dashboard",
    titleKey: "tabs.dashboard",
    icon: "home",
    iconOutline: "home-outline",
  },
  {
    name: "scan",
    titleKey: "tabs.scan",
    icon: "search-circle",
    iconOutline: "search-circle-outline",
  },
  {
    name: "action-plan",
    titleKey: "tabs.actionPlan",
    icon: "list-circle",
    iconOutline: "list-circle-outline",
  },
  {
    name: "learning",
    titleKey: "tabs.learning",
    icon: "school",
    iconOutline: "school-outline",
  },
  {
    name: "knowledge",
    titleKey: "tabs.knowledge",
    icon: "bookmarks",
    iconOutline: "bookmarks-outline",
  },
  {
    name: "profile",
    titleKey: "tabs.profile",
    icon: "person-circle",
    iconOutline: "person-circle-outline",
  },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 2 : 8,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
