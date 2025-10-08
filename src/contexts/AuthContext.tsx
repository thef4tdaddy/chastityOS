/**
 * Authentication Context
 * Manages auth state using the AuthService
 * Context layer - React state management for authentication
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/auth/auth-service";
import { GoogleAuthService } from "@/services/auth/GoogleAuthService";
import { AccountMigrationService } from "@/services/auth/AccountMigrationService";
import { getFirebaseAuth } from "@/services/firebase";
import { User, LoginForm, RegisterForm, ApiResponse } from "@/types";
import { serviceLogger } from "@/utils/logging";
import { authKeys } from "@/utils/auth";

const logger = serviceLogger("AuthContext");

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  signIn: (credentials: LoginForm) => Promise<ApiResponse<User>>;
  register: (userData: RegisterForm) => Promise<ApiResponse<User>>;
  signOut: () => Promise<ApiResponse<void>>;
  resetPassword: (email: string) => Promise<ApiResponse<void>>;
  updatePassword: (newPassword: string) => Promise<ApiResponse<void>>;
  updateProfile: (updates: Partial<User>) => Promise<ApiResponse<User>>;
  signInWithGoogle: () => Promise<ApiResponse<User>>;
  linkWithGoogle: () => Promise<ApiResponse<void>>;
  clearError: () => void;
}

export interface AuthContextType {
  state: AuthState;
  actions: AuthActions;
  // Direct access properties for backwards compatibility
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function for auth initialization
const performAuthInitialization = async (
  setState: React.Dispatch<React.SetStateAction<AuthState>>,
): Promise<(() => void) | undefined> => {
  try {
    logger.debug("Initializing auth state");

    const auth = await getFirebaseAuth();
    const currentUser = await AuthService.getCurrentUser();

    if (currentUser) {
      setState({
        user: currentUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      logger.info("User already authenticated", { uid: currentUser.uid });
    } else {
      // No user found - sign in anonymously
      logger.debug("No authenticated user found, signing in anonymously");
      const anonResult = await AuthService.signInAnonymously();

      if (anonResult.success && anonResult.data) {
        setState({
          user: anonResult.data,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        logger.info("Anonymous user created", { uid: anonResult.data.uid });
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: anonResult.error || "Failed to create anonymous user",
        }));
        logger.error("Anonymous sign in failed", { error: anonResult.error });
      }
    }

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        logger.debug("Firebase auth state changed: user signed in", {
          uid: firebaseUser.uid,
        });

        const user = await AuthService.getCurrentUser();
        if (user) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      } else {
        logger.debug("Firebase auth state changed: user signed out");
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  } catch (error) {
    logger.error("Failed to initialize auth", { error: error as Error });
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: "Failed to initialize authentication",
    });
    return undefined;
  }
};

// Helper for secondary auth actions (password, profile)
const createSecondaryAuthActions = (
  state: AuthState,
  setState: React.Dispatch<React.SetStateAction<AuthState>>,
) => {
  const resetPassword = async (email: string) => {
    setState((prev) => ({ ...prev, error: null }));
    const result = await AuthService.resetPassword(email);

    if (!result.success) {
      setState((prev) => ({
        ...prev,
        error: result.error || "Password reset failed",
      }));
      logger.warn("Password reset failed via context", {
        error: result.error,
        email,
      });
    } else {
      logger.info("Password reset sent via context", { email });
    }
    return result;
  };

  const updatePassword = async (newPassword: string) => {
    setState((prev) => ({ ...prev, error: null }));
    const result = await AuthService.updatePassword(newPassword);

    if (!result.success) {
      setState((prev) => ({
        ...prev,
        error: result.error || "Password update failed",
      }));
      logger.warn("Password update failed via context", {
        error: result.error,
      });
    } else {
      logger.info("Password updated via context");
    }
    return result;
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!state.user) {
      const error = "No authenticated user found";
      setState((prev) => ({ ...prev, error }));
      return { success: false, error };
    }

    setState((prev) => ({ ...prev, error: null }));
    const result = await AuthService.updateUserProfile(state.user.uid, updates);

    if (result.success && result.data) {
      setState((prev) => ({
        ...prev,
        user: result.data!,
      }));
      logger.info("Profile updated via context", { uid: state.user.uid });
    } else {
      setState((prev) => ({
        ...prev,
        error: result.error || "Profile update failed",
      }));
      logger.warn("Profile update failed via context", {
        error: result.error,
      });
    }
    return result;
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return { resetPassword, updatePassword, updateProfile, clearError };
};

// Helper for linking anonymous account with Google
const performGoogleLinking = async (
  state: AuthState,
  setState: React.Dispatch<React.SetStateAction<AuthState>>,
) => {
  if (!state.user) {
    return { success: false, error: "No authenticated user found" };
  }

  const auth = await getFirebaseAuth();
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    return { success: false, error: "No Firebase user found" };
  }

  if (!firebaseUser.isAnonymous) {
    return { success: false, error: "User is not anonymous" };
  }

  // Link anonymous account with Google
  const linkResult =
    await GoogleAuthService.linkAnonymousAccountWithGoogle(firebaseUser);

  if (!linkResult.success) {
    logger.warn("Account linking failed via context", {
      error: linkResult.error,
    });
    return {
      success: false,
      error: linkResult.error || "Failed to link account",
    };
  }

  // Sync data to Firebase
  logger.debug("Account linked, starting data sync");
  const syncResult = await AccountMigrationService.syncAfterLinking(
    firebaseUser.uid,
  );

  if (!syncResult.success) {
    logger.warn("Data sync incomplete after linking", {
      error: syncResult.error,
    });
    // Don't fail the whole operation - linking succeeded
  }

  // Get updated user profile
  const updatedUser = await AuthService.getCurrentUser();

  if (updatedUser) {
    setState({
      user: updatedUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    logger.info("Account linked with Google successfully via context", {
      uid: updatedUser.uid,
    });
  }

  return {
    success: true,
    message: syncResult.message || "Account linked successfully",
  };
};

// Internal helper hook for auth actions (renamed to avoid conflict with exported hook)
const useAuthActionsInternal = (
  state: AuthState,
  setState: React.Dispatch<React.SetStateAction<AuthState>>,
): AuthActions => {
  const signIn = async (credentials: LoginForm) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await AuthService.signIn(credentials);

    if (result.success && result.data) {
      setState({
        user: result.data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      logger.info("User signed in via context", { uid: result.data.uid });
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || "Sign in failed",
      }));
      logger.warn("Sign in failed via context", { error: result.error });
    }
    return result;
  };

  const register = async (userData: RegisterForm) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await AuthService.register(userData);

    if (result.success && result.data) {
      setState({
        user: result.data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      logger.info("User registered via context", { uid: result.data.uid });
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || "Registration failed",
      }));
      logger.warn("Registration failed via context", { error: result.error });
    }
    return result;
  };

  const signOut = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await AuthService.signOut();

    if (result.success) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      logger.info("User signed out via context");
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || "Sign out failed",
      }));
      logger.warn("Sign out failed via context", { error: result.error });
    }
    return result;
  };

  const signInWithGoogle = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await GoogleAuthService.signInWithGoogle();

    if (result.success && result.data) {
      setState({
        user: result.data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      logger.info("User signed in with Google via context", {
        uid: result.data.uid,
      });
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || "Google sign in failed",
      }));
      logger.warn("Google sign in failed via context", { error: result.error });
    }
    return result;
  };

  const linkWithGoogle = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await performGoogleLinking(state, setState);

      if (!result.success) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Failed to link account",
        }));
      }

      return result;
    } catch (error) {
      logger.error("Failed to link account with Google", {
        error: error as Error,
      });
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to link account. Please try again.",
      }));
      return {
        success: false,
        error: "Failed to link account. Please try again.",
      };
    }
  };

  const secondaryActions = createSecondaryAuthActions(state, setState);

  return {
    signIn,
    register,
    signOut,
    signInWithGoogle,
    linkWithGoogle,
    ...secondaryActions,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const unsubscribePromise = performAuthInitialization(setState);

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, []);

  // Sync auth state with TanStack Query cache
  useEffect(() => {
    if (state.user) {
      // Update the TanStack Query cache when user changes
      queryClient.setQueryData(authKeys.currentUser, state.user);
    } else {
      // Clear the cache when user signs out
      queryClient.setQueryData(authKeys.currentUser, null);
    }
  }, [state.user, queryClient]);

  const actions = useAuthActionsInternal(state, setState);

  const contextValue: AuthContextType = {
    state,
    actions,
    // Direct access properties for backwards compatibility
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Convenience hooks for common use cases
export const useAuthState = () => {
  const { state } = useAuth();
  return state;
};

export const useAuthActions = () => {
  const { actions } = useAuth();
  return actions;
};
