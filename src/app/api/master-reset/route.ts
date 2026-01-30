import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export async function POST() {
    const targetHandles = ['akashpandher', 'gloverse', 'lovepreet_singh'];
    let successCount = 0;
    const errors: string[] = [];

    const promises = targetHandles.map(async (handle) => {
        try {
            const q = query(collection(db, "channels"), where("handle", "==", handle));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error(`Handle '${handle}' not found.`);
            }

            const channelData = querySnapshot.docs[0].data();
            const email = channelData.email;

            if (!email) {
                throw new Error(`No email found for handle '${handle}'.`);
            }

            await sendPasswordResetEmail(auth, email);
            successCount++;
        } catch (error: any) {
            errors.push(error.message || `Failed to process handle '${handle}'.`);
        }
    });

    await Promise.all(promises);

    if (errors.length > 0) {
        return NextResponse.json({ message: `Completed with errors: ${errors.join('; ')}` }, { status: 500 });
    }

    if (successCount > 0) {
        return NextResponse.json({ message: `SUCCESS: ${successCount} password reset emails sent.` });
    }

    return NextResponse.json({ message: 'No accounts were processed.' }, { status: 400 });
}
