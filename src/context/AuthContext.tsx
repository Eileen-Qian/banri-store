"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/utils/api";

const TOKEN_KEY = "banri-customer-token";

export interface Customer {
  id: string;
  email: string | null;
  name: string;
  phone: string;
  avatarUrl: string | null;
  lineUserId?: string | null;
}

interface AuthContextValue {
  customer: Customer | null;
  token: string | null;
  loading: boolean;
  login: (token: string, customer: Customer) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  customer: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore token and verify with /auth/me
  useEffect(() => {
    const verify = async () => {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (!saved) return;

      try {
        const data = await api
          .get("api/v1/auth/me", {
            headers: { Authorization: `Bearer ${saved}` },
          })
          .json<Customer>();
        setToken(saved);
        setCustomer(data);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    };

    verify().finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (newToken: string, newCustomer: Customer) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setCustomer(newCustomer);

    // Cart merge: send anonymous cart token with customer JWT
    const cartToken = localStorage.getItem("banri-cart-token");
    if (cartToken) {
      try {
        const res = await api
          .post("api/v1/cart/merge", {
            headers: {
              Authorization: `Bearer ${newToken}`,
              "X-Cart-Token": cartToken,
            },
          })
          .json<{ merged: boolean; cartToken?: string }>();
        if (res.merged && res.cartToken) {
          // Switch to customer's cart token
          localStorage.setItem("banri-cart-token", res.cartToken);
        }
      } catch {
        // Non-critical — anonymous cart will remain separate
      }
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCustomer(null);
  }, []);

  return (
    <AuthContext.Provider value={{ customer, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
