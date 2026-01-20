"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AuthUser, Channel } from "@/lib/types";

interface AuthContextType {
  user: AuthUser | null | undefined;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Failsafe timer to prevent infinite loading state on startup
    const startupTimer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 500); // User requested 500ms

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      clearTimeout(startupTimer); // Clear the failsafe timer as we have a response
      if (firebaseUser) {
        const channelDocRef = doc(db, "channels", firebaseUser.uid);
        const channelDoc = await getDoc(channelDocRef);
        
        let authUser: AuthUser = { ...firebaseUser };

        if (channelDoc.exists()) {
          const channelData = channelDoc.data() as Omit<Channel, 'id'>;
          authUser.channel = { id: channelDoc.id, ...channelData };
        }
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(startupTimer);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
