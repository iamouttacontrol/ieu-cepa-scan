import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { light } from "@/colors-indonesia";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: light.background }}>
        <ActivityIndicator size="large" color={light.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/auth" />;
}
