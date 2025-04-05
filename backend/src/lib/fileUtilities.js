import sharp from 'sharp';
import { Buffer } from 'buffer';
import { supabase } from './supabase.js';

export const ALLOWED_FILE_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
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

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';

    return 'unknown';
};

export const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
};

export const compressFile = async (file) => {
    // File is already in base64 format from the client
    const buffer = Buffer.from(file.data.split(',')[1], 'base64');

    // For non-image files, just return the buffer
    if (!file.type.startsWith('image/')) {
        return {
            buffer,
            type: file.type,
            name: file.name,
            size: file.size
        };
    }

    // Compress only images
    try {
        const compressedBuffer = await sharp(buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        return {
            buffer: compressedBuffer,
            type: 'image/jpeg',
            name: file.name.replace(/\.[^/.]+$/, '.jpg'),  // Change extension to jpg
            size: compressedBuffer.length
        };
    } catch (err) {
        console.error('Error compressing image:', err);
        // Fallback to original file if compression fails
        return {
            buffer,
            type: file.type,
            name: file.name,
            size: file.size
        };
    }
};

export const validateFile = (file) => {
    const maxSizes = {
        image: 10 * 1024 * 1024,    // 10MB
        audio: 20 * 1024 * 1024,    // 20MB for audio files
        video: 100 * 1024 * 1024,   // 100MB
        document: 50 * 1024 * 1024  // 50MB
    };

    const fileType = getFileType(file.type);

    if (fileType === 'unknown') {
        throw new Error('File type not supported');
    }

    if (file.size > maxSizes[fileType]) {
        throw new Error(`File size should be less than ${(maxSizes[fileType] / (1024 * 1024)).toFixed(0)} MB`);
    }

    return true;
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