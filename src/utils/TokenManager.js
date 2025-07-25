function generateToken(userId) {
    // Generate a token using the user ID with 32 random bytes
    const crypto = require('crypto');
    const token = userId + "_" + crypto.randomBytes(32).toString('hex');
    
    return token;

}

function generateSessionId() {
    // Generate a session ID using 32 random bytes
    const crypto = require('crypto');
    const sessionId = "SESSION" + "_" + crypto.randomBytes(32).toString('hex');
    
    return sessionId;
}

module.exports = {generateToken, generateSessionId}