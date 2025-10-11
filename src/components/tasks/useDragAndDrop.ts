/**
 * Hook for drag and drop file handling
 */
import { useCallback } from "react";
import type React from "react";

interface UseDragAndDropProps {
  setIsDragging: (dragging: boolean) => void;
  handleFiles: (files: FileList) => void;
}

export const useDragAndDrop = ({
  setIsDragging,
  handleFiles,
}: UseDragAndDropProps) => {
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

  return {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
};
