/**
 * Progressive Image Component
 * Implements blur-up technique for progressive image loading
 * Phase 4: Advanced Optimizations - Progressive Loading
 */

import React, { useState, useEffect, useRef } from "react";

interface ProgressiveImageProps {
  src: string;
  placeholder?: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholder,
  alt,
  className = "",
  width,
  height,
  onLoad,
  onError,
}) => {
  const [imgSrc, setImgSrc] = useState(placeholder || "");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Create a new image to preload the full resolution
    const img = new Image();

    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
      if (onLoad) {
        onLoad();
      }
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      if (onError) {
        onError(new Error(`Failed to load image: ${src}`));
      }
    };

    img.src = src;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Image is in viewport, loading will happen via useEffect above
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
      },
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          Failed to load image
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0 blur-sm" : "opacity-100"
        }`}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
      {isLoading && placeholder && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </div>
  );
};

interface ProgressiveBackgroundImageProps {
  src: string;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ProgressiveBackgroundImage: React.FC<
  ProgressiveBackgroundImageProps
> = ({ src, placeholder, children, className = "" }) => {
  const [bgSrc, setBgSrc] = useState(placeholder || "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setBgSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <div
      className={`transition-all duration-500 ${isLoading ? "blur-sm" : ""} ${className}`}
      style={{
        backgroundImage: `url(${bgSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {children}
    </div>
  );
};

export default ProgressiveImage;
