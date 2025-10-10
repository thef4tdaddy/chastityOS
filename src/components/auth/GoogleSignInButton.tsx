/**
 * Google Sign-In Button Component
 * Reusable button for Google OAuth authentication
 */
import React, { useState } from "react";
import { FaGoogle, FaSpinner } from "react-icons/fa";
import { useAuthActions } from "@/contexts/AuthContext";
import { logger } from "@/utils/logging";
import { Button } from "@/components/ui";

interface GoogleSignInButtonProps {
  mode?: "signin" | "link";
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = "signin",
  onSuccess,
  onError,
  className = "",
}) => {
  const { signInWithGoogle, linkWithGoogle } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);

    try {
      const result =
        mode === "signin" ? await signInWithGoogle() : await linkWithGoogle();

      if (result.success) {
        logger.info(`Google ${mode} successful`);
        onSuccess?.();
      } else {
        logger.warn(`Google ${mode} failed`, { error: result.error });
        onError?.(
          result.error ||
            `Failed to ${mode === "signin" ? "sign in" : "link account"} with Google`,
        );
      }
    } catch (error) {
      logger.error(`Google ${mode} error`, { error: error as Error });
      onError?.("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText =
    mode === "signin" ? "Sign in with Google" : "Link with Google";

  return (
    <Button
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`
        w-full flex items-center justify-center gap-3
        bg-white text-gray-700 border border-gray-300 rounded-lg px-6 py-3
        hover:bg-gray-50 active:bg-gray-100
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        font-medium
        ${className}
      `}
      aria-label={buttonText}
    >
      {isLoading ? (
        <FaSpinner className="animate-spin text-gray-600" />
      ) : (
        <FaGoogle className="text-red-500" />
      )}
      <span>
        {isLoading
          ? mode === "signin"
            ? "Signing in..."
            : "Linking..."
          : buttonText}
      </span>
    </Button>
  );
};
