"use server";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function checkHandleUniqueness(handle: string) {
  // Always check in lowercase for case-insensitivity
  const lowerCaseHandle = handle.toLowerCase();
  try {
    const q = query(collection(db, "channels"), where("handle", "==", lowerCaseHandle));
    const querySnapshot = await getDocs(q);
    return { isUnique: querySnapshot.empty };
  } catch (error) {
    console.error("Error checking handle uniqueness:", error);
    // Return an explicit error object for the frontend to handle
    return { isUnique: false, error: "Failed to check handle. Please try again." };
  }
}

export async function registerUser({ handle, password, fullName, bio }: { handle: string; password: string; fullName: string; bio: string; }) {
  // Always work with lowercase handles for consistency
  const lowerCaseHandle = handle.toLowerCase();
  const email = `${lowerCaseHandle}@gloverse.com`;

  try {
    // Step 1: Check handle uniqueness again on the server
    const uniquenessCheck = await checkHandleUniqueness(lowerCaseHandle);
    if (uniquenessCheck.error) {
        throw new Error(uniquenessCheck.error);
    }
    if (!uniquenessCheck.isUnique) {
      throw new Error("Handle is already taken.");
    }

    // Step 2: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Step 3: Create channel document in Firestore with lowercase handle
    await setDoc(doc(db, "channels", user.uid), {
      handle: lowerCaseHandle,
      fullName: fullName,
      bio: bio,
      photoURL: `https://avatar.vercel.sh/${lowerCaseHandle}.png`, // Default avatar
      subscribers: 0,
      user_id: user.uid,
      createdAt: new Date().toISOString(),
    });

    return { success: true, userId: user.uid };
  } catch (error: any) {
    console.error("Registration error:", error);
    // It's good practice to return a generic error message to the client
    // and log the specific error on the server.
    return { success: false, error: error.message || "An unexpected error occurred during registration." };
  }
}
