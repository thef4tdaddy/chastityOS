/**
 * Authentication service layer
 * Handles all Firebase Auth operations with proper error handling and logging
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  sendEmailVerification,
  type User as FirebaseUser,
  type AuthError,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type DocumentReference,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestore } from "../firebase";
import { User, ApiResponse, LoginForm, RegisterForm } from "@/types";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("AuthService");

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(credentials: LoginForm): Promise<ApiResponse<User>> {
    try {
      logger.debug("Attempting user sign in", { email: credentials.email });

      const auth = await getFirebaseAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      const firebaseUser = userCredential.user;

      // Update last login timestamp
      await this.updateLastLogin(firebaseUser.uid);

      // Get full user profile
      const user = await this.getUserProfile(firebaseUser.uid);

      if (!user) {
        logger.error("User profile not found after successful login", {
          uid: firebaseUser.uid,
        });
        return {
          success: false,
          error: "User profile not found. Please contact support.",
        };
      }

      logger.info("User signed in successfully", {
        uid: firebaseUser.uid,
        email: user.email,
      });

      return {
        success: true,
        data: user,
        message: "Sign in successful",
      };
    } catch (error) {
      logger.error("Sign in failed", {
        error: error as Error,
        email: credentials.email,
      });
      return {
        success: false,
        error: this.getAuthErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Sign in anonymously
   * Creates an anonymous user that can later be linked to a permanent account
   */
  static async signInAnonymously(): Promise<ApiResponse<User>> {
    try {
      logger.debug("Attempting anonymous sign in");

      const auth = await getFirebaseAuth();
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;

      // Create minimal user profile for anonymous user
      const user = await this.createAnonymousUserProfile(firebaseUser);

      logger.info("Anonymous user signed in successfully", {
        uid: firebaseUser.uid,
      });

      return {
        success: true,
        data: user,
        message: "Anonymous sign in successful",
      };
    } catch (error) {
      logger.error("Anonymous sign in failed", { error: error as Error });
      return {
        success: false,
        error: this.getAuthErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Register new user with email and password
   */
  static async register(userData: RegisterForm): Promise<ApiResponse<User>> {
    try {
      logger.debug("Attempting user registration", { email: userData.email });

      const auth = await getFirebaseAuth();
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password,
      );

      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: userData.displayName,
      });

      // Create user profile in Firestore
      const user = await this.createUserProfile(firebaseUser, userData);

      // Send email verification
      await sendEmailVerification(firebaseUser);

      logger.info("User registered successfully", {
        uid: firebaseUser.uid,
        email: user.email,
      });

      return {
        success: true,
        data: user,
        message:
          "Registration successful. Please check your email to verify your account.",
      };
    } catch (error) {
      logger.error("Registration failed", {
        error: error as Error,
        email: userData.email,
      });
      return {
        success: false,
        error: this.getAuthErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<ApiResponse<void>> {
    try {
      const auth = await getFirebaseAuth();
      const currentUser = auth.currentUser;
      logger.debug("Attempting user sign out", { uid: currentUser?.uid });

      await signOut(auth);

      logger.info("User signed out successfully", { uid: currentUser?.uid });

      return {
        success: true,
        message: "Sign out successful",
      };
    } catch (error) {
      logger.error("Sign out failed", { error: error as Error });
      return {
        success: false,
        error: "Failed to sign out. Please try again.",
      };
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      logger.debug("Sending password reset email", { email });

      const auth = await getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);

      logger.info("Password reset email sent", { email });

      return {
        success: true,
        message: "Password reset email sent. Please check your inbox.",
      };
    } catch (error) {
      logger.error("Password reset failed", { error: error as Error, email });
      return {
        success: false,
        error: this.getAuthErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string): Promise<ApiResponse<void>> {
    try {
      const auth = await getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: "No authenticated user found",
        };
      }

      logger.debug("Updating user password", { uid: user.uid });

      await updatePassword(user, newPassword);

      logger.info("Password updated successfully", { uid: user.uid });

      return {
        success: true,
        message: "Password updated successfully",
      };
    } catch (error) {
      logger.error("Password update failed", { error: error as Error });
      return {
        success: false,
        error: this.getAuthErrorMessage(error as AuthError),
      };
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User | null> {
    const auth = await getFirebaseAuth();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    return this.getUserProfile(firebaseUser.uid);
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(uid: string): Promise<User | null> {
    try {
      const db = await getFirestore();
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        logger.warn("User profile not found", { uid });
        return null;
      }

      const userData = userDoc.data() as User;
      logger.debug("User profile retrieved", { uid });

      return userData;
    } catch (error) {
      logger.error("Failed to get user profile", {
        error: error as Error,
        uid,
      });
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    uid: string,
    updates: Partial<User>,
  ): Promise<ApiResponse<User>> {
    try {
      logger.debug("Updating user profile", { uid, updates });

      const db = await getFirestore();
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      const updatedUser = await this.getUserProfile(uid);

      if (!updatedUser) {
        return {
          success: false,
          error: "Failed to retrieve updated user profile",
        };
      }

      logger.info("User profile updated successfully", { uid });

      return {
        success: true,
        data: updatedUser,
        message: "Profile updated successfully",
      };
    } catch (error) {
      logger.error("Failed to update user profile", {
        error: error as Error,
        uid,
      });
      return {
        success: false,
        error: "Failed to update profile. Please try again.",
      };
    }
  }

  /**
   * Create user profile in Firestore
   */
  private static async createUserProfile(
    firebaseUser: FirebaseUser,
    userData: RegisterForm,
  ): Promise<User> {
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      displayName: userData.displayName,
      role: userData.role,
      profile: {
        isPublicProfileEnabled: false,
        profileToken: generateUUID(),
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
    };

    const db = await getFirestore();
    const userRef: DocumentReference = doc(db, "users", firebaseUser.uid);
    await setDoc(userRef, user);

    logger.debug("User profile created in Firestore", {
      uid: firebaseUser.uid,
    });
    return user;
  }

  /**
   * Create anonymous user profile
   */
  private static async createAnonymousUserProfile(
    firebaseUser: FirebaseUser,
  ): Promise<User> {
    // For anonymous users, create user data without email field
    // Firestore doesn't allow undefined values, so we omit it from the document
    const userData = {
      uid: firebaseUser.uid,
      displayName: `Guest_${firebaseUser.uid.substring(0, 8)}`,
      role: "submissive", // Default role for anonymous users
      profile: {
        isPublicProfileEnabled: false,
        profileToken: generateUUID(),
      },
      verification: {
        emailVerified: false,
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
      isAnonymous: true, // Flag to identify anonymous users
    };

    const db = await getFirestore();
    const userRef: DocumentReference = doc(db, "users", firebaseUser.uid);
    await setDoc(userRef, userData);

    // Return as User type (email will be undefined)
    const user: User = { ...userData, email: undefined } as User;

    logger.debug("Anonymous user profile created in Firestore", {
      uid: firebaseUser.uid,
    });
    return user;
  }

  /**
   * Update last login timestamp
   */
  private static async updateLastLogin(uid: string): Promise<void> {
    try {
      const db = await getFirestore();
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      // Log but don't fail authentication for this
      logger.warn("Failed to update last login timestamp", {
        error: error as Error,
        uid,
      });
    }
  }

  /**
   * Convert Firebase Auth error to user-friendly message
   */
  private static getAuthErrorMessage(error: AuthError): string {
    switch (error.code) {
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again.";
      default:
        logger.warn("Unknown auth error", {
          code: error.code,
          message: error.message,
        });
        return "Authentication failed. Please try again.";
    }
  }
}

// Export singleton instance for compatibility with existing code
export const authService = {
  signIn: AuthService.signIn.bind(AuthService),
  register: AuthService.register.bind(AuthService),
  signOut: AuthService.signOut.bind(AuthService),
  resetPassword: AuthService.resetPassword.bind(AuthService),
  updatePassword: AuthService.updatePassword.bind(AuthService),
  getCurrentUser: AuthService.getCurrentUser.bind(AuthService),
  getUserProfile: AuthService.getUserProfile.bind(AuthService),
  updateUserProfile: AuthService.updateUserProfile.bind(AuthService),
  sendPasswordResetEmail: AuthService.resetPassword.bind(AuthService),
  updateProfile: async (
    user: FirebaseUser,
    profile: { displayName?: string | null; photoURL?: string | null },
  ) => {
    // This is a Firebase Auth method, not our service method
    const { updateProfile } = await import("firebase/auth");
    return updateProfile(user, profile);
  },
  reauthenticateWithCredential: async (email: string, password: string) => {
    // This needs Firebase Auth implementation
    const { reauthenticateWithCredential, EmailAuthProvider } = await import(
      "firebase/auth"
    );
    const { getFirebaseAuth } = await import("../firebase");
    const auth = await getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    const credential = EmailAuthProvider.credential(email, password);
    return reauthenticateWithCredential(user, credential);
  },
  sendEmailVerification: async (user: FirebaseUser) => {
    const { sendEmailVerification } = await import("firebase/auth");
    return sendEmailVerification(user);
  },
};
