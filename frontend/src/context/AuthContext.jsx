import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import api from "../api/axios";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function restoreUser() {
      const token = sessionStorage.getItem("access_token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await api.get("/api/auth/me");
        setUser(response.data);
      } catch (error) {
        console.error("Session restoration error:", error);
        sessionStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreUser();
  }, []);

  async function login(email, password) {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });

    const token = response.data.access_token;

    if (!token) {
      throw new Error("Login response did not contain an access token.");
    }

    sessionStorage.setItem("access_token", token);

    try {
      const profileResponse = await api.get("/api/auth/me");
      setUser(profileResponse.data);
      return profileResponse.data;
    } catch (error) {
      sessionStorage.removeItem("access_token");
      setUser(null);
      throw error;
    }
  }

  async function register(name, email, password) {
    const response = await api.post("/api/auth/register", {
      name,
      email,
      password,
    });

    return response.data;
  }

  function logout() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("stylehub_pending_stripe_order_id");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}