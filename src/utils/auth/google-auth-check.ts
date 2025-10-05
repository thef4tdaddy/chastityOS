/**
 * Google authentication check utilities
 * Validates if user is signed in with Google OAuth provider
 */
import { getFirebaseAuth } from "@/services/firebase";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("GoogleAuthCheck");

export interface GoogleAuthStatus {
  isSignedInWithGoogle: boolean;
  provider: string | null;
}

/**
 * Check if the current user is signed in with Google
 */
export async function checkGoogleSignIn(): Promise<GoogleAuthStatus> {
  try {
    const auth = await getFirebaseAuth();
    const user = auth.currentUser;

    if (!user) {
      logger.debug("No authenticated user found");
      return { isSignedInWithGoogle: false, provider: null };
    }

    // Check provider data for Google sign-in
    const hasGoogleProvider = user.providerData.some(
      (provider) => provider.providerId === "google.com",
    );

    logger.debug("Google auth check completed", {
      uid: user.uid,
      hasGoogle: hasGoogleProvider,
      providers: user.providerData.map((p) => p.providerId),
    });

    return {
      isSignedInWithGoogle: hasGoogleProvider,
      provider: hasGoogleProvider ? "google.com" : null,
    };
  } catch (error) {
    logger.error("Failed to check Google authentication", {
      error: error as Error,
    });
    return { isSignedInWithGoogle: false, provider: null };
  }
}

/**
 * Check if user can link accounts (requires Google sign-in)
 */
export async function canLinkAccounts(): Promise<boolean> {
  const { isSignedInWithGoogle } = await checkGoogleSignIn();
  return isSignedInWithGoogle;
}

/**
 * Check if user can use cloud sync (requires Google sign-in)
 * Anonymous users are local-only for privacy and account recovery reasons
 */
export async function canUseCloudSync(): Promise<boolean> {
  const { isSignedInWithGoogle } = await checkGoogleSignIn();
  return isSignedInWithGoogle;
}
