/**
 * Task Evidence Upload Component
 * Allows submissives to upload photo evidence when submitting tasks
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { useTaskEvidence } from "@/hooks/api/useTaskEvidence";
import { useEvidenceUpload, type UploadedFile } from "./useEvidenceUpload";
import { useDragAndDrop } from "./useDragAndDrop";
import { useFileHandling } from "./useFileHandling";
import {
  FaUpload,
  FaTimes,
  FaImage,
  FaSpinner,
  FaExclamationTriangle,
} from "../../utils/iconImport";
import { TaskError } from "./TaskError";
import { scaleInVariants, getAccessibleVariants } from "../../utils/animations";

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
  <motion.div
    className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors touch-manipulation ${
      isDragging
        ? "border-blue-400 bg-blue-900/20 drop-zone-active"
        : "border-gray-600 hover:border-gray-500"
    }`}
    onDragEnter={onDragEnter}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <FaUpload className="mx-auto text-3xl sm:text-4xl text-gray-400 mb-2" />
    <p className="text-sm sm:text-base text-gray-300 mb-2">
      Drag and drop photos here, or click to browse
    </p>
    <p className="text-xs sm:text-sm text-gray-500 mb-4">
      JPG, PNG, HEIC, WebP (max {maxFiles} files, 5MB each)
    </p>
    <Button
      type="button"
      onClick={onBrowseClick}
      className="px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors min-h-[44px] text-base sm:text-sm font-medium touch-manipulation"
    >
      Choose Files
    </Button>
  </motion.div>
);

// File preview item sub-component
const FilePreviewItem: React.FC<{
  file: UploadedFile;
  onRemove: () => void;
}> = ({ file, onRemove }) => (
  <motion.div
    className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700 touch-manipulation"
    variants={getAccessibleVariants(scaleInVariants)}
    initial="initial"
    animate="animate"
    exit="exit"
    layout
  >
    <motion.img
      src={file.preview}
      alt="Preview"
      className="w-full h-full object-cover image-fade-in"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
      {file.uploading && (
        <>
          <FaSpinner className="text-white text-xl sm:text-2xl animate-spin mb-2" />
          {file.progress > 0 && (
            <div className="text-white text-xs sm:text-sm font-semibold">
              {file.progress}%
            </div>
          )}
        </>
      )}
      {file.url && <FaImage className="text-green-400 text-xl sm:text-2xl" />}
      {file.error && (
        <div className="text-red-400 text-xs p-2 text-center">{file.error}</div>
      )}
    </div>
    {file.uploading && (
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${file.progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    )}
    {!file.uploading && (
      <Button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-2 sm:p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
        aria-label="Remove file"
      >
        <FaTimes className="text-base sm:text-sm" />
      </Button>
    )}
  </motion.div>
);

export const TaskEvidenceUpload: React.FC<TaskEvidenceUploadProps> = ({
  taskId,
  userId,
  onUploadComplete,
  maxFiles = 5,
}) => {
  const { isConfigured } = useTaskEvidence();
  const {
    files,
    isDragging,
    fileInputRef,
    handleFiles,
    removeFile,
    uploadAllFiles,
    setIsDragging,
  } = useEvidenceUpload(taskId, userId, maxFiles, onUploadComplete);

  // Drag and drop handlers
  const { handleDragEnter, handleDragLeave, handleDragOver, handleDrop } =
    useDragAndDrop({ setIsDragging, handleFiles });

  // File handling with error management
  const {
    uploadError,
    setUploadError,
    handleFileInputChange,
    handleUploadWithRetry,
  } = useFileHandling({ handleFiles, uploadAllFiles, taskId, userId });

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
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <FilePreviewItem
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {hasFiles && !allUploaded && (
        <Button
          type="button"
          onClick={handleUploadWithRetry}
          disabled={hasErrors}
          className={`w-full py-3 rounded font-semibold transition-colors min-h-[44px] text-base sm:text-sm touch-manipulation ${
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
          <span>
            Some files failed to upload. Please check file size and format.
          </span>
        </div>
      )}

      {hasFiles && (
        <div className="text-xs sm:text-sm text-gray-400 text-center">
          {files.length} / {maxFiles} files selected
        </div>
      )}
    </div>
  );
};
