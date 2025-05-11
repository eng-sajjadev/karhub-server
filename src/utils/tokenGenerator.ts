/**
 * Generates a random 5-character hexadecimal token.
 * @returns {string} - A 5-character hex string (0-9, a-f).
 */
export function generateShortHexToken(): string {
    // Generate a random number, convert to hex, then take first 5 chars
    return Math.floor(Math.random() * 0xFFFFF).toString(16).padStart(5, '0');
}

