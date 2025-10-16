# Task Evidence Upload System

## Overview

The Task Evidence Upload System allows submissives to upload photo evidence when submitting tasks for keyholder review. The system uses Cloudinary for cloud storage and provides a comprehensive user experience with drag-and-drop, previews, and validation.

## Features

### For Submissives

- **Photo Upload**: Upload 1-5 photos as evidence when submitting a task
- **Drag & Drop**: Drag files directly onto the upload zone
- **File Browser**: Click to browse and select files
- **Preview**: See thumbnail previews of selected photos before uploading
- **Validation**: Automatic validation of file type and size
- **Progress**: Visual feedback during upload
- **Error Handling**: Clear error messages for failed uploads

### For Keyholders

- **Evidence Display**: View submitted photos in a thumbnail grid
- **Lightbox**: Click to view photos full-size
- **Navigation**: Navigate through multiple photos with arrow keys or buttons

## Supported File Types

- JPG/JPEG
- PNG
- HEIC/HEIF (Apple photos)
- WebP

**Maximum file size**: 5MB per file  
**Maximum files**: 5 photos per task

## Configuration

### Environment Variables

The system requires Cloudinary credentials to be configured:

```env
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
VITE_CLOUDINARY_API_KEY=your-api-key (optional)
```

### Setting Up Cloudinary

1. Create a free Cloudinary account at https://cloudinary.com
2. Get your Cloud Name from the dashboard
3. Create an unsigned upload preset:
   - Go to Settings > Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Set Signing Mode to "Unsigned"
   - Configure folder as: `chastityos/tasks/{userId}/{taskId}`
   - Save the preset name

4. Add the credentials to your `.env` file

## Architecture

### Components

#### `TaskEvidenceUpload`

- Main upload component
- Handles file selection, validation, and upload
- Shows previews and upload progress
- Location: `src/components/tasks/TaskEvidenceUpload.tsx`

#### `TaskEvidenceDisplay`

- Display component for viewing submitted evidence
- Shows thumbnail grid and lightbox
- Location: `src/components/tasks/TaskEvidenceDisplay.tsx`

#### `useEvidenceUpload`

- Custom hook containing upload logic
- Separates business logic from UI
- Location: `src/components/tasks/useEvidenceUpload.ts`

### Services

#### `TaskStorageService`

- Core service for Cloudinary integration
- Handles file upload, validation, and URL transformations
- Location: `src/services/storage/TaskStorageService.ts`

Methods:

- `validateFile(file)` - Validates file type and size
- `uploadEvidence(taskId, userId, file)` - Uploads file to Cloudinary
- `getThumbnailUrl(url, width, height)` - Generates thumbnail URL
- `getOptimizedUrl(url, maxWidth)` - Generates optimized display URL

#### `cloudinaryConfig`

- Configuration management for Cloudinary
- Location: `src/services/storage/cloudinaryConfig.ts`

### Hooks

#### `useTaskEvidence`

- React hook wrapping TaskStorageService
- Provides component-friendly API
- Location: `src/hooks/api/useTaskEvidence.ts`

### Database

The `attachments` field is added to the `DBTask` interface:

```typescript
interface DBTask {
  // ... other fields
  attachments?: string[]; // Photo/file evidence URLs
}
```

## Usage

### Submitting a Task with Evidence

1. Navigate to the Tasks page
2. Find the task you want to submit
3. Add optional notes in the text area
4. Click "Choose Files" or drag photos into the upload zone
5. Preview your selected photos
6. Click "Upload X Photo(s)" to upload
7. Click "Submit for Review" to submit the task

### Viewing Evidence as Keyholder

1. Navigate to the Tasks page
2. View tasks in the "Submitted" or "Archived" sections
3. Submitted evidence appears as a thumbnail grid
4. Click any thumbnail to view full-size in lightbox
5. Use arrow keys or buttons to navigate through photos

## Image Optimization

The system uses Cloudinary's transformation features for optimal performance:

### Thumbnails

- Crop to 300x300px
- Fill mode maintains aspect ratio
- Auto quality and format optimization
- Used in: Grid views, previews

### Full-size Display

- Max width 1600px (preserves aspect ratio)
- Limit mode prevents upscaling
- Auto quality and format optimization
- Used in: Lightbox, full-screen view

## Error Handling

The system provides user-friendly error messages for:

- **Invalid file types**: "Unsupported file type: {type}. Please upload JPG, PNG, HEIC, or WebP images."
- **Files too large**: "File too large: {size}MB. Maximum size is 5MB."
- **Maximum files exceeded**: "Maximum 5 files allowed"
- **Upload failures**: Individual file error messages in preview
- **Missing configuration**: Warning banner if Cloudinary is not configured

## Testing

Tests are located in `src/services/storage/__tests__/TaskStorageService.test.ts`

Run tests:

```bash
npm run test:unit -- TaskStorageService.test.ts
```

Coverage includes:

- File validation (type, size)
- URL transformation (thumbnails, optimization)
- Cloudinary vs non-Cloudinary URL handling

## Future Enhancements

Possible improvements for future releases:

1. **Video Support**: Allow short video clips as evidence
2. **Image Compression**: Client-side compression before upload
3. **Batch Delete**: Allow removing multiple photos at once
4. **Evidence Requirements**: Mark specific tasks as requiring evidence
5. **Server-side Deletion**: Implement proper deletion via Cloudinary API
6. **Evidence Comments**: Allow keyholders to comment on specific photos
7. **Evidence History**: Track all evidence submissions for a task

## Troubleshooting

### Photos not uploading

1. Check Cloudinary credentials in `.env`
2. Verify upload preset is set to "Unsigned"
3. Check browser console for detailed errors
4. Ensure file meets size and type requirements

### Thumbnails not loading

1. Verify URLs contain `cloudinary.com`
2. Check Cloudinary dashboard for uploaded files
3. Try clearing browser cache
4. Check network tab for 404 errors

### Upload preset errors

1. Ensure preset is set to "Unsigned" signing mode
2. Check that preset name matches environment variable
3. Verify preset is not deleted in Cloudinary dashboard

## Security Considerations

- **Unsigned Uploads**: Uses unsigned upload preset for client-side uploads
- **Validation**: Client-side validation prevents most invalid files
- **Size Limits**: 5MB limit prevents excessive storage usage
- **File Count**: Maximum 5 files per task prevents abuse
- **Folder Structure**: Files organized by user and task for easy management
- **Public Access**: Uploaded files are publicly accessible via URL (no authentication required)

## Performance

- **Lazy Loading**: Images loaded on demand
- **Optimized Delivery**: Cloudinary CDN ensures fast loading
- **Format Selection**: Auto-format delivers best format for each browser
- **Quality Optimization**: Auto-quality balances file size and visual quality
- **Thumbnail Generation**: On-the-fly thumbnail generation reduces initial payload
