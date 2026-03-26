import { API_BASE_URL } from "@/constants/api";

export async function sendChatMessage(
  message: string,
  history: { role: string; content: string }[]
): Promise<{ answer: string; sources: string[] }> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!response.ok) {
    throw new Error(`Chat-Anfrage fehlgeschlagen: ${response.status}`);
  }
  return response.json();
}

export async function analyzeReadiness(scanData: {
  company_name: string;
  sector: string;
  company_size: string;
  product_type: string;
  hs_code: string;
  target_country: string;
  export_experience: string;
  compliance_dpp: boolean;
  compliance_eudr: boolean;
  compliance_ce: boolean;
  compliance_esg: boolean;
  compliance_origin: boolean;
  compliance_food_safety: boolean;
}): Promise<{
  score: number;
  risk_level: string;
  missing_requirements: string[];
  completed_requirements: string[];
  action_plan: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/analyze-readiness`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scanData),
  });
  if (!response.ok) {
    throw new Error(`Analyse fehlgeschlagen: ${response.status}`);
  }
  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
