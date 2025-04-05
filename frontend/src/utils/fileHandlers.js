export const validateFile = (file, maxSize = 50 * 1024 * 1024) => {
    if (!file) return false;

    if (file.size > maxSize) {
        toast.error(`File size should be less than ${Math.floor(maxSize / (1024 * 1024))}MB`);
        return false;
    }
    return true;
};

export const createFilePreview = (file) => {
    return {
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        preview: URL.createObjectURL(file)
    };
};
