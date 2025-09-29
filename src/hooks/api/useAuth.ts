import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User as FirebaseUser } from "firebase/auth";
import { User, UserRole } from "../../types/core";
import { AuthService, authService } from "../../services/auth/auth-service";
import { logger } from "../../utils/logging";

/**
 * Authentication Hooks - TanStack Query Integration
 *
 * Integrates with:
 * - src/services/auth/auth-service.ts (Firebase Auth service)
 * - src/contexts/AuthContext.tsx (Auth context)
 *
 * Fixes missing authentication hook integration throughout app
 */

// Query Keys
export const authKeys = {
  currentUser: ["auth", "currentUser"] as const,
  profile: (uid: string) => ["auth", "profile", uid] as const,
} as const;

/**
 * Get current authenticated user
 * Uses Firebase Auth currentUser with real-time updates
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: async (): Promise<User | null> => {
      return AuthService.getCurrentUser();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - auth state is fairly stable
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 1, // Only retry once for auth failures
  });
}

/**
 * Login with email and password
 * Fixes: AuthContext.tsx missing login hook integration
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      logger.info("Login attempt", { email });
      return await AuthService.signIn({ email, password, rememberMe: false });
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        logger.info("Login successful", { uid: response.data.uid });

        // Update current user cache
        queryClient.setQueryData(authKeys.currentUser, response.data);

        // Invalidate user profile to refresh data
        queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });

        // Invalidate all user-specific data
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    },
    onError: (error) => {
      logger.error("Login failed", error);
    },
  });
}

/**
 * Logout current user
 * Fixes: AuthContext.tsx missing logout hook integration
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logger.info("Logout initiated");
      await AuthService.signOut();
    },
    onSuccess: () => {
      logger.info("Logout successful");

      // Clear all user data from cache
      queryClient.clear();

      // Set current user to null
      queryClient.setQueryData(authKeys.currentUser, null);
    },
    onError: (error) => {
      logger.error("Logout failed", error);
    },
  });
}

/**
 * Register new user account
 * Fixes: AuthContext.tsx missing signup hook integration
 */
export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName?: string;
    }) => {
      logger.info("Sign up attempt", { email, displayName });
      const response = await AuthService.register({
        email,
        password,
        confirmPassword: password,
        displayName: displayName || "",
        role: UserRole.SUBMISSIVE, // Default role
        agreeToTerms: true,
      });

      return response;
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        logger.info("Sign up successful", { uid: response.data.uid });

        // Update current user cache
        queryClient.setQueryData(authKeys.currentUser, response.data);

        // Prefetch user profile
        queryClient.prefetchQuery({
          queryKey: authKeys.profile(response.data.uid),
          queryFn: () => AuthService.getCurrentUser(),
        });
      }
    },
    onError: (error) => {
      logger.error("Sign up failed", error);
    },
  });
}

/**
 * Send password reset email
 * Fixes: AuthContext.tsx missing password reset hook integration
 */
export function usePasswordReset() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      logger.info("Password reset requested", { email });
      return await AuthService.resetPassword(email);
    },
    onSuccess: (_, { email }) => {
      logger.info("Password reset email sent", { email });
    },
    onError: (error) => {
      logger.error("Password reset failed", error);
    },
  });
}

/**
 * Update user profile information
 * Fixes: AuthContext.tsx missing profile update hook integration
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      displayName,
      photoURL,
    }: {
      displayName?: string;
      photoURL?: string;
    }) => {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error("No authenticated user");
      }

      logger.info("Profile update attempt", {
        uid: user.uid,
        displayName,
        photoURL,
      });

      const response = await AuthService.updateUserProfile(user.uid, {
        displayName,
      });

      return response;
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        logger.info("Profile updated successfully", { uid: response.data.uid });

        // Update current user cache with fresh data
        queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
        queryClient.invalidateQueries({
          queryKey: authKeys.profile(response.data.uid),
        });
      }
    },
    onError: (error) => {
      logger.error("Profile update failed", error);
    },
  });
}

/**
 * Check if user email is verified
 * Useful for conditional UI rendering
 */
export function useEmailVerification() {
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("No authenticated user");
      }

      logger.info("Email verification requested", { uid: user.uid });
      await authService.sendEmailVerification({
        uid: user.uid,
      } as FirebaseUser);
    },
    onSuccess: () => {
      logger.info("Verification email sent");
    },
    onError: (error) => {
      logger.error("Email verification failed", error);
    },
  });
}

/**
 * Re-authenticate user (for sensitive operations)
 * Required before profile changes, password updates, etc.
 */
export function useReauthenticate() {
  return useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const user = await AuthService.getCurrentUser();
      if (!user || !user.email) {
        throw new Error("No authenticated user with email");
      }

      logger.info("Re-authentication attempt", { uid: user.uid });
      await authService.reauthenticateWithCredential(user.email, password);
    },
    onSuccess: () => {
      logger.info("Re-authentication successful");
    },
    onError: (error) => {
      logger.error("Re-authentication failed", error);
    },
  });
}

/**
 * Main authentication hook that combines all auth functionality
 * This is the primary export that other components should use
 */
export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const signUpMutation = useSignUp();
  const passwordResetMutation = usePasswordReset();
  const updateProfileMutation = useUpdateProfile();
  const emailVerificationMutation = useEmailVerification();
  const reauthenticateMutation = useReauthenticate();

  return {
    // User state
    user,
    userId: user?.uid,
    isAuthenticated: !!user,
    isLoading,
    error,

    // Auth methods
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    sendPasswordReset: passwordResetMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    sendEmailVerification: emailVerificationMutation.mutateAsync,
    reauthenticate: reauthenticateMutation.mutateAsync,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}
