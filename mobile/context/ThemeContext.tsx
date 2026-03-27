import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { ThemeColors, ThemeMode, getThemeColors } from "@/colors-indonesia";
import { storage } from "@/lib/storage";

interface ThemeContextType {
  colors: ThemeColors;
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: getThemeColors("light"),
  mode: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    storage.getTheme().then((saved) => {
      if (saved) {
        setMode(saved);
      } else if (systemScheme === "dark") {
        setMode("dark");
      }
    });
  }, []);

  const toggleTheme = async () => {
    const next: ThemeMode = mode === "light" ? "dark" : "light";
    setMode(next);
    await storage.setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ colors: getThemeColors(mode), mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
