import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER: "@ieu_cepa:user",
  SCANS: "@ieu_cepa:scans",
  ACTION_COMPLETED: "@ieu_cepa:action_completed", // { [scanId]: boolean[] }
};

export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  sector: string;
}

export interface ScanResult {
  id: string;
  company_name: string;
  product_type: string;
  score: number;
  risk_level: string;
  missing_requirements: string[];
  completed_requirements: string[];
  action_plan: string[];
  created_at: string;
}

export const storage = {
  // --- User ---
  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      return data ? (JSON.parse(data) as User) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  // --- Scans ---
  async getScans(): Promise<ScanResult[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SCANS);
      return data ? (JSON.parse(data) as ScanResult[]) : [];
    } catch {
      return [];
    }
  },

  async addScan(scan: ScanResult): Promise<void> {
    const scans = await storage.getScans();
    scans.unshift(scan); // newest first
    await AsyncStorage.setItem(KEYS.SCANS, JSON.stringify(scans));
  },

  async getLastScan(): Promise<ScanResult | null> {
    const scans = await storage.getScans();
    return scans.length > 0 ? scans[0] : null;
  },

  async clearScans(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.SCANS);
  },

  // --- Action Plan completed state ---
  async getActionCompleted(scanId: string): Promise<boolean[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACTION_COMPLETED);
      const all = data ? JSON.parse(data) : {};
      return all[scanId] ?? [];
    } catch {
      return [];
    }
  },

  async setActionCompleted(scanId: string, completed: boolean[]): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACTION_COMPLETED);
      const all = data ? JSON.parse(data) : {};
      all[scanId] = completed;
      await AsyncStorage.setItem(KEYS.ACTION_COMPLETED, JSON.stringify(all));
    } catch {}
  },
};
