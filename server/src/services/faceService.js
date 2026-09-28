const db = require('../config/database');

/**
 * Calculate Euclidean distance between two 128-dimensional arrays
 */
function euclideanDistance(desc1, desc2) {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        const diff = desc1[i] - desc2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Find the matching face against all users in the database
 * 
 * @param {number[]} targetDescriptor - The 128D descriptor array from the frontend
 * @returns {Object|null} - The matched user ID and confidence, or null if no match
 */
async function findMatchingFace(targetDescriptor) {
    const { rows: users } = await db.query('SELECT id, name, descriptor FROM users WHERE is_active = 1');

    let bestMatch = { userId: null, distance: Infinity, name: null };

    for (const user of users) {
        if (!user.descriptor) continue;

        let storedDescriptors = [];
        try {
            const parsed = typeof user.descriptor === 'string' ? JSON.parse(user.descriptor) : user.descriptor;
            // Support both [] and [[]] formats
            storedDescriptors = Array.isArray(parsed[0]) ? parsed : [parsed];
        } catch (e) {
            continue;
        }

        for (const desc of storedDescriptors) {
            const distance = euclideanDistance(targetDescriptor, desc);
            if (distance < bestMatch.distance) {
                bestMatch = { userId: user.id, distance, name: user.name };
            }
        }
    }

    console.log(`Best match: ${bestMatch.name || 'Unknown'} (Distance: ${bestMatch.distance.toFixed(4)})`);

    // Stricter face-api.js threshold of 0.45 to prevent false positives
    if (bestMatch.distance < 0.45) {
        // Convert distance to confidence percentage (e.g. 100 - (distance * 100))
        const confidence = Math.max(0, 100 - (bestMatch.distance * 100));
        return {
            userId: bestMatch.userId,
            confidence: confidence.toFixed(2),
            name: bestMatch.name
        };
    }

    return null; // No match found within threshold
}

module.exports = { euclideanDistance, findMatchingFace };
