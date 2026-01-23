"use server";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { User } from 'firebase/auth';

export async function checkHandleUniqueness(handle: string) {
  const lowerCaseHandle = handle.toLowerCase();
  try {
    const q = query(collection(db, "channels"), where("handle", "==", lowerCaseHandle));
    const querySnapshot = await getDocs(q);
    return { isUnique: querySnapshot.empty };
  } catch (error) {
    console.error("Error checking handle uniqueness:", error);
    return { isUnique: false, error: "Failed to check handle. Please try again." };
  }
}

export async function getDeviceAccountCount(deviceId: string) {
    try {
        const deviceQuery = query(collection(db, "channels"), where("deviceId", "==", deviceId));
        const deviceDocs = await getDocs(deviceQuery);
        return { count: deviceDocs.size };
    } catch (error) {
        console.error("Error getting device account count:", error);
        return { count: 0, error: "Failed to query device count." };
    }
}

export async function registerUser({ handle, password, fullName, bio, deviceId }: { handle: string; password: string; fullName: string; bio: string; deviceId: string; }) {
  const lowerCaseHandle = handle.toLowerCase();
  
  try {
    // Step 1: Check device limit
    const deviceQuery = query(collection(db, "channels"), where("deviceId", "==", deviceId));
    const deviceDocs = await getDocs(deviceQuery);
    if (deviceDocs.size >= 3) {
      return { success: false, error: "Account limit reached. You can only create up to 3 accounts per device on GloVerse." };
    }
    
    // Step 2: Check handle uniqueness
    const uniquenessCheck = await checkHandleUniqueness(lowerCaseHandle);
    if (uniquenessCheck.error) {
        throw new Error(uniquenessCheck.error);
    }
    if (!uniquenessCheck.isUnique) {
      return { success: false, error: "Handle is already taken." };
    }

    // Step 3: Create user in Firebase Auth
    // NOTE: This uses the client SDK and should ideally be refactored to use the Admin SDK.
    // For this context, we assume it's being called in an environment where client auth is available.
    const email = `${lowerCaseHandle}@gloverse.com`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 4: Create channel document in Firestore
    await setDoc(doc(db, "channels", user.uid), {
      handle: lowerCaseHandle,
      fullName: fullName,
      bio: bio,
      photoURL: `https://avatar.vercel.sh/${lowerCaseHandle}.png`,
      subscribers: 0,
      user_id: user.uid,
      createdAt: new Date().toISOString(),
      deviceId: deviceId,
    });

    return { success: true, userId: user.uid };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during registration." };
  }
}

export async function createChannelForGoogleUser({ user, deviceId }: { user: any; deviceId: string | null }) {
    try {
        const channelRef = doc(db, "channels", user.uid);
        const channelSnap = await getDoc(channelRef);
        if (channelSnap.exists()) {
            return { success: true, message: "Channel already exists." };
        }

        // Generate a handle and check for uniqueness
        let handle = (user.email?.split('@')[0] || user.displayName?.replace(/\s/g, '') || 'user').replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase();
        let isUnique = false;
        let handleSuffix = 0;
        
        while (!isUnique) {
            const tempHandle = handle + (handleSuffix > 0 ? handleSuffix : '');
            const uniquenessCheck = await checkHandleUniqueness(tempHandle);
            if (uniquenessCheck.isUnique) {
                handle = tempHandle;
                isUnique = true;
            } else {
                handleSuffix++;
            }
        }

        await setDoc(channelRef, {
            handle: handle,
            fullName: user.displayName || "New Gloverse User",
            bio: "",
            photoURL: user.photoURL || `https://avatar.vercel.sh/${handle}.png`,
            subscribers: 0,
            user_id: user.uid,
            createdAt: new Date().toISOString(),
            ...(deviceId && { deviceId: deviceId }), // Only add deviceId if it's provided
        });

        return { success: true, userId: user.uid };
    } catch (error: any) {
        console.error("Google Channel Creation Error:", error);
        return { success: false, error: "Failed to create your channel." };
    }
}
