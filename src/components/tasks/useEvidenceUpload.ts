/**
 * Evidence Upload Logic Hook
 * Contains the upload logic separated from UI
 */
import { useState, useCallback, useRef } from "react";
import { useTaskEvidence } from "@/hooks/api/useTaskEvidence";
import { useToast } from "@/contexts";
import { compressImage } from "@/utils/imageCompression";

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
  progress: number;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

export function useEvidenceUpload(
  taskId: string,
  userId: string,
  maxFiles: number,
  onUploadComplete: (urls: string[]) => void,
) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { validateFile, uploadEvidence } = useTaskEvidence();
  const { showError } = useToast();

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const availableSlots = maxFiles - files.length;

      if (availableSlots <= 0) {
        showError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const filesToAdd = fileArray.slice(0, availableSlots);

      // Compress images before adding to state
      const preparedFilesPromises = filesToAdd.map(async (file) => {
        const validation = validateFile(file);

        // Compress image if valid
        let processedFile = file;
        let originalSize = file.size;
        let compressedSize = file.size;

        if (validation.valid && file.type.startsWith("image/")) {
          try {
            const result = await compressImage(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              fileType: "image/webp",
              initialQuality: 0.85,
            });
            processedFile = result.file;
            originalSize = result.originalSize;
            compressedSize = result.compressedSize;
          } catch {
            // If compression fails, use original file
            // Error is logged in the compression utility
          }
        }

        return {
          id: `${Date.now()}-${Math.random()}`,
          file: processedFile,
          preview: URL.createObjectURL(processedFile),
          uploading: false,
          progress: 0,
          error: validation.valid ? undefined : validation.error,
          originalSize,
          compressedSize,
        };
      });

      const preparedFiles = await Promise.all(preparedFilesPromises);
      setFiles((prev) => [...prev, ...preparedFiles]);
    },
    [files.length, maxFiles, showError, validateFile],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const uploadAllFiles = useCallback(async () => {
    const filesToUpload = files.filter((f) => !f.url && !f.error);

    if (filesToUpload.length === 0) {
      const uploadedUrls = files.filter((f) => f.url).map((f) => f.url!);
      onUploadComplete(uploadedUrls);
      return;
    }

    setFiles((prev) =>
      prev.map((f) =>
        filesToUpload.find((fu) => fu.id === f.id)
          ? { ...f, uploading: true, progress: 0 }
          : f,
      ),
    );

    // Upload files in parallel (max 3 concurrent uploads)
    const MAX_CONCURRENT_UPLOADS = 3;
    const uploadQueue = [...filesToUpload];
    const activeUploads = new Map<string, Promise<void>>();

    const uploadFile = async (uploadFile: UploadedFile) => {
      try {
        const result = await uploadEvidence(taskId, userId, uploadFile.file);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, url: result.url, uploading: false, progress: 100 }
              : f,
          ),
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  uploading: false,
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        );
      }
    };

    // Process upload queue with concurrency limit
    while (uploadQueue.length > 0 || activeUploads.size > 0) {
      // Start new uploads if we're below the concurrency limit
      while (
        uploadQueue.length > 0 &&
        activeUploads.size < MAX_CONCURRENT_UPLOADS
      ) {
        const file = uploadQueue.shift()!;
        const uploadPromise = uploadFile(file);
        activeUploads.set(file.id, uploadPromise);

        // Clean up when upload completes
        uploadPromise.finally(() => {
          activeUploads.delete(file.id);
        });
      }

      // Wait for at least one upload to complete before continuing
      if (activeUploads.size > 0) {
        await Promise.race(Array.from(activeUploads.values()));
      }
    }

    // Get all uploaded URLs after all uploads complete
    const uploadedUrls = files
      .map((f) => f.url)
      .filter((url): url is string => !!url);
    onUploadComplete(uploadedUrls);
  }, [files, taskId, userId, onUploadComplete, uploadEvidence]);

  return {
    files,
    isDragging,
    fileInputRef,
    handleFiles,
    removeFile,
    uploadAllFiles,
    setIsDragging,
  };
}
