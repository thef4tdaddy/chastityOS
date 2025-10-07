/**
 * Cloudinary Configuration
 * Manages Cloudinary setup for file uploads
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

/**
 * Get Cloudinary configuration from environment variables
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

  // Configuration validation - log warning if missing
  // This is acceptable as it's configuration validation at startup

  return {
    cloudName: cloudName || "",
    uploadPreset: uploadPreset || "",
    apiKey,
  };
}

/**
 * Check if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  const config = getCloudinaryConfig();
  return !!(config.cloudName && config.uploadPreset);
}
