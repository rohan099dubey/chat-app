// Simple profanity check without external dependencies
const invalidWords = ['ass', 'fuck', 'shit', 'bitch', 'dick', 'pussy', 'cock', 'cunt', 'nigga', 'nigger', 'faggot'];

const containsProfanity = (text) => {
    const lowercase = text.toLowerCase();
    return invalidWords.some(word => lowercase.includes(word));
};

export const validateUsername = async (username) => {
    // Check if username is empty
    if (!username || username.trim().length === 0) {
        return {
            isValid: false,
            message: 'Username is required'
        };
    }

    // Check username length (3-20 characters)
    if (username.length < 3 || username.length > 20) {
        return {
            isValid: false,
            message: 'Username must be between 3 and 20 characters'
        };
    }

    // Check if username contains only letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
            isValid: false,
            message: 'Username can only contain letters, numbers, and underscores'
        };
    }

    // Check for profanity using our simple check
    if (containsProfanity(username)) {
        return {
            isValid: false,
            message: 'Username contains inappropriate content'
        };
    }

    return {
        isValid: true,
        message: 'Username is valid'
    };
}; 