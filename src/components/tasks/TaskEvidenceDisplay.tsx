/**
 * Task Evidence Display Component
 * Shows submitted photo evidence with thumbnail grid and lightbox
 */
import React, { useState } from "react";
import { useTaskEvidence } from "@/hooks/api/useTaskEvidence";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
} from "react-icons/fa";
import { Button } from "@/components/ui";

interface TaskEvidenceDisplayProps {
  attachments: string[];
  onImageClick?: (url: string) => void;
}

export const TaskEvidenceDisplay: React.FC<TaskEvidenceDisplayProps> = ({
  attachments,
  onImageClick,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const { getThumbnailUrl, getOptimizedUrl } = useTaskEvidence();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    const url = attachments[index];
    if (onImageClick && url) {
      onImageClick(url);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setLightboxOpen(false);
    } else if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-gray-300">
        Evidence ({attachments.length}):
      </div>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {attachments.map((url, index) => (
          <Button
            key={index}
            type="button"
            onClick={() => handleImageClick(index)}
            className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors group"
          >
            {imageErrors.has(index) ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <FaImage className="text-2xl" />
              </div>
            ) : (
              <img
                src={getThumbnailUrl(url, 200, 200)}
                alt={`Evidence ${index + 1}`}
                onError={() => handleImageError(index)}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </Button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
        >
          {/* Close Button */}
          <Button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            aria-label="Close lightbox"
          >
            <FaTimes className="text-2xl" />
          </Button>

          {/* Previous Button */}
          {attachments.length > 1 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
              aria-label="Previous image"
            >
              <FaChevronLeft className="text-2xl" />
            </Button>
          )}

          {/* Next Button */}
          {attachments.length > 1 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
              aria-label="Next image"
            >
              <FaChevronRight className="text-2xl" />
            </Button>
          )}

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-7xl max-h-[90vh] w-full mx-4"
          >
            {imageErrors.has(currentIndex) ? (
              <div className="flex items-center justify-center h-96 text-white">
                <div className="text-center">
                  <FaImage className="text-6xl mb-4 mx-auto" />
                  <p>Failed to load image</p>
                </div>
              </div>
            ) : (
              <img
                src={getOptimizedUrl(attachments[currentIndex] || "", 1600)}
                alt={`Evidence ${currentIndex + 1}`}
                onError={() => handleImageError(currentIndex)}
                className="w-full h-full object-contain"
              />
            )}

            {/* Counter */}
            {attachments.length > 1 && (
              <div className="text-center text-white mt-4">
                {currentIndex + 1} / {attachments.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
