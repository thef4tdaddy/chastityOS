/**
 * Google Authentication Service
 * Handles Google OAuth sign-in and anonymous account linking
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  type User as FirebaseUser,
  type UserCredential,
  type AuthError,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  type DocumentReference,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestore } from "@/services/firebase";
import { User, ApiResponse, UserRole } from "@/types";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("GoogleAuthService");

export class GoogleAuthService {
  /**
   * Sign in with Google (new user or existing Google user)
   */
  static async signInWithGoogle(): Promise<ApiResponse<User>> {
    try {
      logger.debug("Attempting Google sign in");

      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();

      // Add scopes for user info
      provider.addScope("profile");
      provider.addScope("email");

      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user profile exists
      const existingProfile = await this.getUserProfile(firebaseUser.uid);

      if (existingProfile) {
        // Existing user - update last login
        await this.updateLastLogin(firebaseUser.uid);

        logger.info("Existing Google user signed in", {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });

        return {
          success: true,
          data: existingProfile,
          message: "Sign in successful",
        };
      }

      // New user - create profile
      const user = await this.createGoogleUserProfile(firebaseUser);

      logger.info("New Google user signed in and profile created", {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      });

      return {
        success: true,
        data: user,
        message: "Sign in successful. Welcome!",
      };
    } catch (error) {
      logger.error("Google sign in failed", { error: error as Error });
      return {
        success: false,
        error: this.getGoogleAuthErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Link anonymous account with Google
   * Preserves anonymous user data by linking credentials
   */
  static async linkAnonymousAccountWithGoogle(
    anonymousUser: FirebaseUser,
  ): Promise<ApiResponse<UserCredential>> {
    try {
      if (!anonymousUser.isAnonymous) {
        logger.warn("Attempted to link non-anonymous account", {
          uid: anonymousUser.uid,
        });
        return {
          success: false,
          error: "Account is not anonymous",
        };
      }

      logger.debug("Attempting to link anonymous account with Google", {
        anonymousUid: anonymousUser.uid,
      });

      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");

      // Get Google credential via popup
      const auth = await getFirebaseAuth();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        logger.warn("Could not get credential from Google sign-in result");
        return {
          success: false,
          error: "Could not get credential from Google. Please try again.",
        };
      }

      // Link anonymous account to Google credential
      // This preserves the same UID but adds Google auth
      const linkedResult = await linkWithCredential(anonymousUser, credential);

      logger.info("Anonymous account linked with Google successfully", {
        uid: linkedResult.user.uid,
        email: linkedResult.user.email,
      });

      // Update user profile with Google info
      await this.updateProfileAfterLinking(linkedResult.user);

      return {
        success: true,
        data: linkedResult,
        message: "Account linked successfully. Your data has been preserved.",
      };
    } catch (error) {
      const authError = error as AuthError;

      // Handle specific error for existing Google account
      if (authError.code === "auth/credential-already-in-use") {
        logger.warn("Google account already exists", { error: authError });
        return {
          success: false,
          error:
            "This Google account is already linked to another ChastityOS account. Please sign in with Google directly.",
        };
      }

      if (authError.code === "auth/email-already-in-use") {
        logger.warn("Email already in use", { error: authError });
        return {
          success: false,
          error:
            "This email is already associated with another account. Please sign in with Google directly.",
        };
      }

      logger.error("Failed to link anonymous account with Google", {
        error: authError,
        anonymousUid: anonymousUser.uid,
      });

      return {
        success: false,
        error: this.getGoogleAuthErrorMessage(authError),
      };
    }
  }

  /**
   * Create user profile for new Google user
   */
  private static async createGoogleUserProfile(
    firebaseUser: FirebaseUser,
  ): Promise<User> {
    const userPayload = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      displayName:
        firebaseUser.displayName || `User_${firebaseUser.uid.substring(0, 8)}`,
      role: UserRole.SUBMISSIVE, // Default role
      profile: {
        isPublicProfileEnabled: false,
        profileToken: generateUUID(),
        photoURL: firebaseUser.photoURL || undefined,
      },
      verification: {
        emailVerified: firebaseUser.emailVerified,
        phoneVerified: false,
        twoFactorEnabled: false,
      },
      settings: {
        theme: "auto",
        notifications: true,
        vanillaMode: false,
        language: "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
      },
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isPremium: false,
      isAnonymous: false, // New Google users are not anonymous
    };

    const db = await getFirestore();
    const userRef: DocumentReference = doc(db, "users", firebaseUser.uid);
    await setDoc(userRef, userPayload);

    logger.debug("Google user profile created in Firestore", {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
    });

    const createdUser = await this.getUserProfile(firebaseUser.uid);
    if (!createdUser) {
      logger.error("Failed to fetch newly created user profile", {
        uid: firebaseUser.uid,
      });
      throw new Error("Could not retrieve user profile after creation.");
    }

    return createdUser;
  }

  /**
   * Update user profile after linking anonymous account with Google
   */
  private static async updateProfileAfterLinking(
    firebaseUser: FirebaseUser,
  ): Promise<void> {
    try {
      const db = await getFirestore();
      const userRef = doc(db, "users", firebaseUser.uid);

      // Update with Google info
      await setDoc(
        userRef,
        {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || undefined,
          "profile.photoURL": firebaseUser.photoURL || undefined,
          "verification.emailVerified": firebaseUser.emailVerified,
          isAnonymous: false, // No longer anonymous
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        },
        { merge: true },
      );

      logger.debug("User profile updated after Google linking", {
        uid: firebaseUser.uid,
      });
    } catch (error) {
      logger.error("Failed to update profile after linking", {
        error: error as Error,
        uid: firebaseUser.uid,
      });
      // Don't throw - linking succeeded even if profile update failed
    }
  }

  /**
   * Get user profile by ID
   */
  private static async getUserProfile(uid: string): Promise<User | null> {
    try {
      const db = await getFirestore();
      const userDoc = await (
        await import("firebase/firestore")
      ).getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      logger.error("Failed to get user profile", {
        error: error as Error,
        uid,
      });
      return null;
    }
  }

  /**
   * Update last login timestamp
   */
  private static async updateLastLogin(uid: string): Promise<void> {
    try {
      const db = await getFirestore();
      const { updateDoc } = await import("firebase/firestore");
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      logger.warn("Failed to update last login timestamp", {
        error: error as Error,
        uid,
      });
    }
  }

  /**
   * Convert Google Auth error to user-friendly message
   */
  private static getGoogleAuthErrorMessage(error: AuthError): string {
    switch (error.code) {
      case "auth/popup-closed-by-user":
        return "Sign in cancelled. Please try again.";
      case "auth/popup-blocked":
        return "Pop-up blocked by browser. Please allow pop-ups and try again.";
      case "auth/cancelled-popup-request":
        return "Sign in cancelled. Please try again.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";
      case "auth/credential-already-in-use":
        return "This Google account is already linked to another account.";
      case "auth/email-already-in-use":
        return "This email is already in use by another account.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      default:
        logger.warn("Unknown Google auth error", {
          code: error.code,
          message: error.message,
        });
        return "Failed to sign in with Google. Please try again.";
    }
  }
}

// Export singleton instance
export const googleAuthService = {
  signInWithGoogle: GoogleAuthService.signInWithGoogle.bind(GoogleAuthService),
  linkAnonymousAccountWithGoogle:
    GoogleAuthService.linkAnonymousAccountWithGoogle.bind(GoogleAuthService),
};
