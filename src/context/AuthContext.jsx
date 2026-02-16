import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../lib/axios";

const AuthContext = createContext(null);

/**
 * Auth Provider component to replace ClerkProvider
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axiosInstance.get("/admin/auth/me");
      if (data.user) {
        setUser(data.user);
        setIsSignedIn(true);
      }
    } catch (error) {
      // Not authenticated - this is fine
      setUser(null);
      setIsSignedIn(false);
    } finally {
      setIsLoaded(true);
    }
  };

  const signIn = useCallback(async (email, password) => {
    try {
      const { data } = await axiosInstance.post("/admin/auth/login", { email, password });
      setUser(data.user);
      setIsSignedIn(true);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      return { success: false, error: message };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await axiosInstance.post("/admin/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsSignedIn(false);
    }
  }, []);

  const value = {
    user,
    isLoaded,
    isSignedIn,
    signIn,
    signOut,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook to replace Clerk's useAuth
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * useUser hook to get current user data
 */
export function useUser() {
  const { user, isLoaded } = useAuth();
  return { user, isLoaded };
}

export default AuthContext;
