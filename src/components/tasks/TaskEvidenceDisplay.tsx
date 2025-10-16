/**
 * Task Evidence Display Component
 * Shows submitted photo evidence with thumbnail grid and lightbox
 */
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import { useTaskEvidence } from "@/hooks/api/useTaskEvidence";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
} from "../../utils/iconImport";

interface TaskEvidenceDisplayProps {
  attachments: string[];
  onImageClick?: (url: string) => void;
}

// Lazy loading image component with blur-up effect
const LazyImage: React.FC<{
  src: string;
  alt: string;
  thumbnailSrc?: string;
  className?: string;
  onError?: () => void;
  onClick?: () => void;
}> = ({ src, alt, thumbnailSrc, className, onError, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" },
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="relative w-full h-full">
      {thumbnailSrc && !isLoaded && (
        <img
          src={thumbnailSrc}
          alt={alt}
          className={`${className} blur-sm`}
          style={{ position: "absolute", inset: 0 }}
        />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setIsLoaded(true)}
          onError={onError}
          onClick={onClick}
        />
      )}
    </div>
  );
};

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
      <div className="text-xs sm:text-sm font-semibold text-gray-300">
        Evidence ({attachments.length}):
      </div>

      {/* Thumbnail Grid - Mobile optimized: 1 column on mobile, 3+ on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {attachments.map((url, index) => (
          <Button
            key={index}
            type="button"
            onClick={() => handleImageClick(index)}
            className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors group touch-manipulation min-h-[120px] sm:min-h-0"
          >
            {imageErrors.has(index) ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <FaImage className="text-xl sm:text-2xl" />
              </div>
            ) : (
              <LazyImage
                src={getThumbnailUrl(url, 200, 200)}
                thumbnailSrc={getThumbnailUrl(url, 50, 50)}
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
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
        >
          {/* Close Button */}
          <Button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-3 sm:p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
            aria-label="Close lightbox"
          >
            <FaTimes className="text-xl sm:text-2xl" />
          </Button>

          {/* Previous Button */}
          {attachments.length > 1 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-2 sm:left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
              aria-label="Previous image"
            >
              <FaChevronLeft className="text-xl sm:text-2xl" />
            </Button>
          )}

          {/* Next Button */}
          {attachments.length > 1 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
              aria-label="Next image"
            >
              <FaChevronRight className="text-xl sm:text-2xl" />
            </Button>
          )}

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-7xl max-h-[80vh] sm:max-h-[90vh] w-full mx-2 sm:mx-4"
          >
            {imageErrors.has(currentIndex) ? (
              <div className="flex items-center justify-center h-64 sm:h-96 text-white">
                <div className="text-center">
                  <FaImage className="text-4xl sm:text-6xl mb-4 mx-auto" />
                  <p className="text-sm sm:text-base">Failed to load image</p>
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
              <div className="text-center text-white mt-2 sm:mt-4 text-sm sm:text-base">
                {currentIndex + 1} / {attachments.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
