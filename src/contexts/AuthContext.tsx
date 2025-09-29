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
import { AuthService } from "@/services/auth/auth-service";
import { getFirebaseAuth } from "@/services/firebase";
import { User, LoginForm, RegisterForm, ApiResponse } from "@/types";
import { serviceLogger } from "@/utils/logging";

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        logger.debug("Initializing auth state");

        const auth = await getFirebaseAuth();

        // Check if user is already authenticated
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
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
          logger.debug("No authenticated user found");
        }

        // Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            logger.debug("Firebase auth state changed: user signed in", {
              uid: firebaseUser.uid,
            });

            // Get full user profile from our service
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

    const unsubscribePromise = initializeAuth();

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, []);

  const actions: AuthActions = {
    signIn: async (credentials: LoginForm) => {
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
    },

    register: async (userData: RegisterForm) => {
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
    },

    signOut: async () => {
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
    },

    resetPassword: async (email: string) => {
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
    },

    updatePassword: async (newPassword: string) => {
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
    },

    updateProfile: async (updates: Partial<User>) => {
      if (!state.user) {
        const error = "No authenticated user found";
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setState((prev) => ({ ...prev, error: null }));

      const result = await AuthService.updateUserProfile(
        state.user.uid,
        updates,
      );

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
          uid: state.user.uid,
        });
      }

      return result;
    },

    clearError: () => {
      setState((prev) => ({ ...prev, error: null }));
    },
  };

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
