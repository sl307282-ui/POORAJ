import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Configure Google Sign-In once at app startup
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    // ⚠️  Replace this with your actual Web Client ID from Firebase Console
    // Firebase Console → Project Settings → General → Your apps → Web API Key
    // Or: Firebase Console → Authentication → Sign-in method → Google → Web client ID
    webClientId: '923022624431-arhckos1a26vf826b63eebcffnou4lo6.apps.googleusercontent.com',
  });
}

export type GoogleSignInResult =
  | { status: 'existing_user'; role: 'admin' | 'team'; uid: string }
  | { status: 'new_user'; uid: string; name: string; email: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/**
 * Attempts Google Sign-In.
 * - If user already exists in Firestore → returns their role.
 * - If brand-new → returns their Google name/email so the UI can show role selection.
 */
export async function performGoogleSignIn(): Promise<GoogleSignInResult> {
  try {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    const credential = GoogleAuthProvider.credential(tokens.idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;

    // Check if this Google account already has a Firestore profile
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Blocked users
      if (data.isActive === false) {
        await auth.signOut();
        return { status: 'error', message: 'Your account has been deactivated. Please contact your Admin.' };
      }
      return { status: 'existing_user', role: data.role, uid: firebaseUser.uid };
    }

    // New user — caller decides what to do (show role picker)
    return {
      status: 'new_user',
      uid: firebaseUser.uid,
      name: firebaseUser.displayName ?? '',
      email: firebaseUser.email ?? '',
    };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { status: 'cancelled' };
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return { status: 'error', message: 'Sign-in already in progress.' };
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { status: 'error', message: 'Google Play Services not available on this device.' };
    }
    return { status: 'error', message: error.message ?? 'Google Sign-In failed.' };
  }
}

/**
 * Creates an Admin Firestore profile for a Google-authenticated user.
 */
export async function createAdminProfileGoogle(uid: string, name: string, email: string, teamName: string) {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const teamId = `team_${uid}`;

  await setDoc(doc(db, 'teams', teamId), {
    name: teamName,
    adminUid: uid,
    inviteCode,
    createdAt: new Date().toISOString(),
  });

  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    role: 'admin',
    teamId,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Creates a Team Member Firestore profile for a Google-authenticated user.
 */
export async function createTeamMemberProfileGoogle(uid: string, name: string, email: string, teamId: string) {
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    role: 'team',
    teamId,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
}
