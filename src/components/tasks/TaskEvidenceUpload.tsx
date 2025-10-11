/**
 * Task Evidence Upload Component
 * Allows submissives to upload photo evidence when submitting tasks
 */
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui";
import { useTaskEvidence } from "@/hooks/api/useTaskEvidence";
import { useEvidenceUpload, type UploadedFile } from "./useEvidenceUpload";
import { FaUpload, FaTimes, FaImage, FaSpinner, FaExclamationTriangle } from "../../utils/iconImport";
import { TaskError } from "./TaskError";
import { logger } from "@/utils/logging";

interface TaskEvidenceUploadProps {
  taskId: string;
  userId: string;
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
}

// Upload zone sub-component
const UploadZone: React.FC<{
  isDragging: boolean;
  maxFiles: number;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowseClick: () => void;
}> = ({
  isDragging,
  maxFiles,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseClick,
}) => (
  <div
    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
      isDragging
        ? "border-blue-400 bg-blue-900/20"
        : "border-gray-600 hover:border-gray-500"
    }`}
    onDragEnter={onDragEnter}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    <FaUpload className="mx-auto text-4xl text-gray-400 mb-2" />
    <p className="text-gray-300 mb-2">
      Drag and drop photos here, or click to browse
    </p>
    <p className="text-sm text-gray-500 mb-4">
      JPG, PNG, HEIC, WebP (max {maxFiles} files, 5MB each)
    </p>
    <Button
      type="button"
      onClick={onBrowseClick}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
    >
      Choose Files
    </Button>
  </div>
);

// File preview item sub-component
const FilePreviewItem: React.FC<{
  file: UploadedFile;
  onRemove: () => void;
}> = ({ file, onRemove }) => (
  <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
    <img
      src={file.preview}
      alt="Preview"
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
      {file.uploading && (
        <>
          <FaSpinner className="text-white text-2xl animate-spin mb-2" />
          {file.progress > 0 && (
            <div className="text-white text-sm font-semibold">
              {file.progress}%
            </div>
          )}
        </>
      )}
      {file.url && <FaImage className="text-green-400 text-2xl" />}
      {file.error && (
        <div className="text-red-400 text-xs p-2 text-center">{file.error}</div>
      )}
    </div>
    {file.uploading && (
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${file.progress}%` }}
        />
      </div>
    )}
    {!file.uploading && (
      <Button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
        aria-label="Remove file"
      >
        <FaTimes />
      </Button>
    )}
  </div>
);

export const TaskEvidenceUpload: React.FC<TaskEvidenceUploadProps> = ({
  taskId,
  userId,
  onUploadComplete,
  maxFiles = 5,
}) => {
  const { isConfigured } = useTaskEvidence();
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const {
    files,
    isDragging,
    fileInputRef,
    handleFiles,
    removeFile,
    uploadAllFiles,
    setIsDragging,
  } = useEvidenceUpload(taskId, userId, maxFiles, onUploadComplete);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [setIsDragging],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [setIsDragging],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles, setIsDragging],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setUploadError(null);
        if (e.target.files && e.target.files.length > 0) {
          handleFiles(e.target.files);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Failed to handle files");
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
      logger.error("Error uploading files", { error: err.message, taskId, userId });
      setUploadError(err);
    }
  }, [uploadAllFiles, taskId, userId]);

  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  if (!isConfigured) {
    return (
      <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-300 text-sm">
        Photo uploads are not configured. Please contact your administrator.
      </div>
    );
  }

  // Show error state if upload failed
  if (uploadError) {
    return (
      <TaskError
        error={uploadError}
        errorType="upload"
        title="Upload Error"
        onRetry={() => {
          setUploadError(null);
          handleUploadWithRetry();
        }}
      />
    );
  }

  const canAddMore = files.length < maxFiles;
  const hasFiles = files.length > 0;
  const allUploaded = files.every((f) => f.url || f.error);
  const hasErrors = files.some((f) => f.error);

  return (
    <div className="space-y-4">
      {canAddMore && (
        <>
          <UploadZone
            isDragging={isDragging}
            maxFiles={maxFiles}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onBrowseClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </>
      )}

      {hasFiles && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {files.map((file) => (
            <FilePreviewItem
              key={file.id}
              file={file}
              onRemove={() => removeFile(file.id)}
            />
          ))}
        </div>
      )}

      {hasFiles && !allUploaded && (
        <Button
          type="button"
          onClick={handleUploadWithRetry}
          disabled={hasErrors}
          className={`w-full py-3 rounded font-semibold transition-colors ${
            hasErrors
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          Upload {files.filter((f) => !f.url && !f.error).length} Photo(s)
        </Button>
      )}

      {hasErrors && (
        <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/30 rounded">
          <FaExclamationTriangle />
          <span>Some files failed to upload. Please check file size and format.</span>
        </div>
      )}

      {hasFiles && (
        <div className="text-sm text-gray-400 text-center">
          {files.length} / {maxFiles} files selected
        </div>
      )}
    </div>
  );
};
