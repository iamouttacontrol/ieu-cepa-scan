// Lokale Entwicklung: EXPO_PUBLIC_API_BASE_URL in mobile/.env setzen, z.B.
//   "http://localhost:8000" (Emulator) oder "http://DEINE-PC-IP:8000" (echtes Handy im selben WLAN)
// Produktion (Vercel): EXPO_PUBLIC_API_BASE_URL als Vercel-Umgebungsvariable auf die Render-URL setzen.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.178.180:8000";

export const endpoints = {
  health: `${API_BASE_URL}/health`,
  chat: `${API_BASE_URL}/chat`,
  analyzeReadiness: `${API_BASE_URL}/analyze-readiness`,
};
