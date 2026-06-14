"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

export interface DbUser {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  reportsUsed: number;
  planStartDate: string | null;
  planExpiryDate: string | null;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserContextType {
  dbUser: DbUser | null;
  loadingDbUser: boolean;
  syncUser: () => Promise<void>;
  incrementReportsUsed: () => Promise<void>;
  updatePlan: (plan: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function UserProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loadingDbUser, setLoadingDbUser] = useState<boolean>(true);

  const syncUser = useCallback(async () => {
    if (!isSignedIn || !user) {
      setDbUser(null);
      setLoadingDbUser(false);
      return;
    }

    try {
      setLoadingDbUser(true);
      const email = user.primaryEmailAddress?.emailAddress;
      if (!email) {
        console.error("[UserContext] No primary email address found for Clerk user");
        setLoadingDbUser(false);
        return;
      }

      const token = await getToken();
      
      const res = await fetch(`${API_BASE}/api/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email,
          name: user.fullName || "",
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setDbUser(result.data);
        }
      } else {
        console.error("[UserContext] Failed to sync user with database", await res.text());
      }
    } catch (err) {
      console.error("[UserContext] Error syncing user:", err);
    } finally {
      setLoadingDbUser(false);
    }
  }, [isSignedIn, user, getToken]);

  const incrementReportsUsed = useCallback(async () => {
    if (!isSignedIn || !user || !dbUser) return;

    try {
      const token = await getToken();
      
      const res = await fetch(`${API_BASE}/api/users/increment-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setDbUser(result.data);
        }
      }
    } catch (err) {
      console.error("[UserContext] Error incrementing reports count:", err);
    }
  }, [isSignedIn, user, dbUser, getToken]);

  const updatePlan = useCallback(async (plan: string) => {
    if (!isSignedIn || !user || !dbUser) return;

    try {
      const token = await getToken();
      
      const res = await fetch(`${API_BASE}/api/users/update-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: plan,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setDbUser(result.data);
        }
      }
    } catch (err) {
      console.error("[UserContext] Error updating plan:", err);
    }
  }, [isSignedIn, user, dbUser, getToken]);

  // Sync when Clerk user loads or changes
  useEffect(() => {
    if (isLoaded) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, user?.id, syncUser]);

  return (
    <UserContext.Provider
      value={{
        dbUser,
        loadingDbUser,
        syncUser,
        incrementReportsUsed,
        updatePlan,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserDb() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserDb must be used within a UserProvider");
  }
  return context;
}
