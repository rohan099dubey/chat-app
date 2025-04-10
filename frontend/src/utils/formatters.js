// image.png

export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
};

export function formatMessageTime(dateInput) {
    // 1. Check if the input is potentially valid
    if (!dateInput) {
        // console.warn("formatMessageTime received invalid input:", dateInput);
        return "Invalid Date"; // Return explicit error string
    }

    // 2. Attempt to create a Date object
    const date = new Date(dateInput);

    // 3. Check if the created Date object is valid
    if (isNaN(date.getTime())) { // Check if the date is invalid
        // console.warn("formatMessageTime failed to parse input:", dateInput);
        return "Invalid Date"; // Return explicit error string
    }

    // 4. Format the valid date
    try {
        return date.toLocaleTimeString([], {
            hour: 'numeric', // Use 'numeric' or '2-digit'
            minute: '2-digit',
            hour12: true // Or false based on preference
        }); // Example: 1:30 PM
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Invalid Date"; // Fallback on formatting error
    }
}

export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}