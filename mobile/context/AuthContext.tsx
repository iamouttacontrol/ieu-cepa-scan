import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { storage, User } from "@/lib/storage";

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company: string;
  sector: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  /**
   * Local login: looks up stored user by email (prototype).
   * In a real app, this would POST to a backend auth endpoint.
   */
  const login = async (email: string, _password: string) => {
    const existingUser = await storage.getUser();

    if (existingUser && existingUser.email.toLowerCase() === email.toLowerCase()) {
      // Re-login with stored profile
      setUser(existingUser);
      return;
    }

    // Create a minimal profile for new login
    const newUser: User = {
      id: Date.now().toString(),
      email: email.trim().toLowerCase(),
      name: email.split("@")[0],
      company: "Mein Unternehmen",
      sector: "Herstellung",
    };
    await storage.setUser(newUser);
    setUser(newUser);
  };

  const register = async (data: RegisterData) => {
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      company: data.company.trim(),
      sector: data.sector,
    };
    await storage.setUser(newUser);
    setUser(newUser);
  };

  const logout = async () => {
    await storage.removeUser();
    await storage.clearScans();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb eines AuthProvider verwendet werden");
  return ctx;
}
