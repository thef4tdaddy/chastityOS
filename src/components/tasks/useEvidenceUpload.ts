/**
 * Evidence Upload Logic Hook
 * Contains the upload logic separated from UI
 */
import { useState, useCallback, useRef } from "react";
import { useTaskEvidence } from "@/hooks/api/useTaskEvidence";
import { useToast } from "@/contexts";

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
  progress: number;
  error?: string;
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
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const availableSlots = maxFiles - files.length;

      if (availableSlots <= 0) {
        showError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const filesToAdd = fileArray.slice(0, availableSlots);
      const preparedFiles: UploadedFile[] = filesToAdd.map((file) => {
        const validation = validateFile(file);
        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          uploading: false,
          progress: 0,
          error: validation.valid ? undefined : validation.error,
        };
      });

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

    for (const uploadFile of filesToUpload) {
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
    }

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
