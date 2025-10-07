/**
 * Task Evidence Upload Hook
 * Wraps TaskStorageService for use in components
 */
import { TaskStorageService } from "@/services/storage/TaskStorageService";
import { isCloudinaryConfigured } from "@/services/storage/cloudinaryConfig";
import type { UploadResult } from "@/services/storage/TaskStorageService";

export function useTaskEvidence() {
  // Validation is exposed from service, not a new validation function
  const validateFile = TaskStorageService.validateFile.bind(TaskStorageService);

  const uploadEvidence = async (
    taskId: string,
    userId: string,
    file: File,
  ): Promise<UploadResult> => {
    return TaskStorageService.uploadEvidence(taskId, userId, file);
  };

  const uploadMultipleEvidence = async (
    taskId: string,
    userId: string,
    files: File[],
  ): Promise<UploadResult[]> => {
    return TaskStorageService.uploadMultipleEvidence(taskId, userId, files);
  };

  const getThumbnailUrl = (
    url: string,
    width?: number,
    height?: number,
  ): string => {
    return TaskStorageService.getThumbnailUrl(url, width, height);
  };

  const getOptimizedUrl = (url: string, maxWidth?: number): string => {
    return TaskStorageService.getOptimizedUrl(url, maxWidth);
  };

  const isConfigured = isCloudinaryConfigured();

  return {
    validateFile,
    uploadEvidence,
    uploadMultipleEvidence,
    getThumbnailUrl,
    getOptimizedUrl,
    isConfigured,
  };
}
