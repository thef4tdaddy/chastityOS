/**
 * Image Compression Utilities
 * Client-side image optimization before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeMB: 2,
};

/**
 * Compress an image file before upload
 * Uses canvas to resize and compress images
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Don't compress if already small enough
  if (file.size / (1024 * 1024) <= opts.maxSizeMB * 0.5) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read file"));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error("Failed to load image"));

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(
              opts.maxWidth / width,
              opts.maxHeight / height,
            );
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas and draw resized image
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }

              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            file.type,
            opts.quality,
          );
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generate a thumbnail for preview
 */
export async function generateThumbnail(
  file: File,
  maxSize: number = 200,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read file"));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error("Failed to load image"));

      img.onload = () => {
        try {
          // Calculate thumbnail dimensions
          let { width, height } = img;
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);

          // Create canvas
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Return data URL for immediate display
          resolve(canvas.toDataURL(file.type, 0.7));
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {},
): { valid: boolean; error?: string } {
  const maxSizeMB = options.maxSizeMB || 5;
  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  if (!isImageFile(file)) {
    return { valid: false, error: "File must be an image" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Image type not supported. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Image too large (${sizeMB.toFixed(1)}MB). Max: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}
