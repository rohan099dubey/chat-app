import sharp from 'sharp';
import { Buffer } from 'buffer';
import { supabase } from './supabase.js';

export const ALLOWED_FILE_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'],
    VIDEO: ['video/mp4', 'video/webm'],
    DOCUMENT: [
        'text/plain',
        'application/pdf',
        'application/zip',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
};

export const getFileType = (mimeType) => {
    if (!mimeType) return 'unknown';
    for (const category in ALLOWED_FILE_TYPES) {
        if (ALLOWED_FILE_TYPES[category].includes(mimeType)) {
            return category.toLowerCase(); // Return 'image', 'audio', etc.
        }
    }
    // Fallback for broader categories if specific mime isn't listed but starts correctly
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';

    return 'unknown';
};
const ALL_ALLOWED_MIMETYPES_FLAT = Object.values(ALLOWED_FILE_TYPES).flat();

export const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
};

export const compressFile = async (file) => {
    // Input 'file' should have { buffer, mimetype, originalname, size }
    const { buffer, mimetype, originalname, size } = file;

    if (!buffer || !mimetype || !originalname) {
        throw new Error("Invalid file data provided for compression.");
    }

    console.log(`[CompressFile] Processing: ${originalname}, Type: ${mimetype}, Size: ${size}`);

    // Compress only images
    if (mimetype.startsWith('image/')) {
        try {
            console.log("[CompressFile] Attempting image compression...");
            const compressedBuffer = await sharp(buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80, progressive: true }) // Adjust quality as needed
                .toBuffer();

            const compressedSize = compressedBuffer.length;
            const newName = originalname.replace(/\.[^/.]+$/, '.jpg'); // Change extension
            console.log(`[CompressFile] Compression successful. New size: ${compressedSize}, New name: ${newName}`);

            return {
                buffer: compressedBuffer,
                type: 'image/jpeg', // Output is JPEG
                name: newName,
                size: compressedSize
            };
        } catch (err) {
            console.error('[CompressFile] Error compressing image:', err);
            // Fallback to original file if compression fails
            console.log("[CompressFile] Compression failed, falling back to original buffer.");
            return { buffer, type: mimetype, name: originalname, size };
        }
    } else {
        console.log("[CompressFile] File is not an image, returning original buffer.");
        // For non-image files, just return the original data
        return { buffer, type: mimetype, name: originalname, size };
    }
};

export const validateFile = (file) => {
    // Input 'file' should have { type (mimetype), size }
    const { type: mimeType, size } = file;

    if (!mimeType || size === undefined) {
        throw new Error("Invalid file data provided for validation.");
    }

    console.log(`[ValidateFile] Validating: Type: ${mimeType}, Size: ${size}`);

    // Check against the flat list of all allowed MIME types
    if (!ALL_ALLOWED_MIMETYPES_FLAT.includes(mimeType)) {
        console.log("[ValidateFile] Failed: MIME type not in allowed list.");
        throw new Error(`File type (${mimeType}) is not supported`);
    }

    // Define max sizes (consider making these configurable, e.g., via .env)
    const maxSizes = {
        image: 10 * 1024 * 1024,    // 10MB
        audio: 50 * 1024 * 1024,    // 50MB (increased)
        video: 100 * 1024 * 1024,   // 100MB
        document: 50 * 1024 * 1024  // 50MB
    };

    const fileTypeCategory = getFileType(mimeType); // Get category ('image', 'audio', etc.)

    // Check size based on category
    if (fileTypeCategory !== 'unknown' && maxSizes[fileTypeCategory] && size > maxSizes[fileTypeCategory]) {
        const limitMB = (maxSizes[fileTypeCategory] / (1024 * 1024)).toFixed(0);
        console.log(`[ValidateFile] Failed: Size (${size}) exceeds limit (${limitMB}MB) for category ${fileTypeCategory}.`);
        throw new Error(`File size exceeds the limit of ${limitMB} MB for ${fileTypeCategory}s`);
    } else if (fileTypeCategory === 'unknown') {
        // This case might be redundant if already checked by MIME type list, but keep as fallback
        console.log("[ValidateFile] Failed: Could not determine file category for size check.");
        throw new Error(`File type (${mimeType}) category unknown for size validation`);
    }

    console.log("[ValidateFile] Validation passed.");
    return true; // Indicate success
};

export const validateProfileImage = (base64String) => {
    // Check if it's a valid base64 image string
    if (!base64String.startsWith('data:image/')) {
        throw new Error('Invalid image format');
    }

    // Extract the base64 data
    const base64Data = base64String.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Check file size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
        throw new Error('Profile image should be less than 5MB');
    }

    return true;
};

export const getFileUrl = async (filePath, fileType) => {
    try {
        console.log("Getting URL for path:", filePath);

        // Always use public URL for simplicity and reliability
        const { data } = supabase.storage
            .from('chat-files')
            .getPublicUrl(filePath);

        if (!data || !data.publicUrl) {
            throw new Error('Failed to get public URL');
        }

        console.log("Generated URL:", data.publicUrl);
        return data.publicUrl;
    } catch (error) {
        console.error('Error getting file URL:', error);
        return null; // Return null instead of throwing to avoid breaking the UI
    }
};