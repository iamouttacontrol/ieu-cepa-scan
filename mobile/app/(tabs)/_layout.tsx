import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconOutline: IoniconsName;
}

const tabs: TabConfig[] = [
  {
    name: "dashboard",
    title: "Dashboard",
    icon: "home",
    iconOutline: "home-outline",
  },
  {
    name: "scan",
    title: "Scan",
    icon: "search-circle",
    iconOutline: "search-circle-outline",
  },
  {
    name: "action-plan",
    title: "Aktionsplan",
    icon: "list-circle",
    iconOutline: "list-circle-outline",
  },
  {
    name: "learning",
    title: "Lernen",
    icon: "school",
    iconOutline: "school-outline",
  },
  {
    name: "knowledge",
    title: "Knowledge",
    icon: "bookmarks",
    iconOutline: "bookmarks-outline",
  },
  {
    name: "profile",
    title: "Profil",
    icon: "person-circle",
    iconOutline: "person-circle-outline",
  },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
            title: tab.title,
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
