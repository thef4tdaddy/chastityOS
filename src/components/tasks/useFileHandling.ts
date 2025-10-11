/**
 * Hook for file input handling with error handling
 */
import { useCallback, useState } from "react";
import type React from "react";
import { logger } from "@/utils/logging";

interface UseFileHandlingProps {
  handleFiles: (files: FileList) => void;
  uploadAllFiles: () => Promise<void>;
  taskId: string;
  userId: string;
}

export const useFileHandling = ({
  handleFiles,
  uploadAllFiles,
  taskId,
  userId,
}: UseFileHandlingProps) => {
  const [uploadError, setUploadError] = useState<Error | null>(null);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setUploadError(null);
        if (e.target.files && e.target.files.length > 0) {
          handleFiles(e.target.files);
        }
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("Failed to handle files");
        logger.error("Error handling file input", { error: err.message });
        setUploadError(err);
      }
    },
    [handleFiles],
  );

  const handleUploadWithRetry = useCallback(async () => {
    try {
      setUploadError(null);
      await uploadAllFiles();
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Upload failed");
      logger.error("Error uploading files", {
        error: err.message,
        taskId,
        userId,
      });
      setUploadError(err);
    }
  }, [uploadAllFiles, taskId, userId]);

  return {
    uploadError,
    setUploadError,
    handleFileInputChange,
    handleUploadWithRetry,
  };
};
