import { createContext, useContext, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { authApi, getStoredUser } from "../services/api";
import type { AuthUser } from "../types";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isWorking: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: Readonly<AuthProviderProps>) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isWorking, setIsWorking] = useState(false);

  const login = async (email: string, password: string) => {
    setIsWorking(true);
    try {
      const response = await authApi.login(email, password);
      setUser(response.user ?? null);
    } finally {
      setIsWorking(false);
    }
  };

  const logout = async () => {
    setIsWorking(true);
    try {
      await authApi.logout();
      setUser(null);
    } finally {
      setIsWorking(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isWorking,
      login,
      logout
    }),
    [isWorking, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

export const useLoginForm = () => {
  const { login, isWorking } = useAuth();
  const [email, setEmail] = useState("admin@devoteam.com");
  const [password, setPassword] = useState("Demo@1234");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(email, password);
  };

  return { email, setEmail, password, setPassword, submit, isWorking };
};
