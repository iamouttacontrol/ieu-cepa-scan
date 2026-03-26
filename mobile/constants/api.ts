// Für Emulator: "http://localhost:8000"
// Für echtes Handy: "http://DEINE-PC-IP:8000" (z.B. "http://192.168.1.42:8000")
export const API_BASE_URL = "http://192.168.178.180:8000";

export const endpoints = {
  health: `${API_BASE_URL}/health`,
  chat: `${API_BASE_URL}/chat`,
  analyzeReadiness: `${API_BASE_URL}/analyze-readiness`,
};
