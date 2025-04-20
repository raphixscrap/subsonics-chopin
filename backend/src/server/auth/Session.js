const { LogType } = require('loguix');
const { generateSessionId } = require('../../utils/TokenManager');  
const clog = new LogType("Session");

const sessions = new Array();


function checkSession(sessionId) {
    return sessions.includes(sessionId);
}

function addSession() {
    const sessionId = generateSessionId();
    if (checkSession(sessionId)) {
        clog.warn(`Session ${sessionId} non trouvée dans la liste des sessions.`);
        return addSession(); // Recursively generate a new session ID if it already exists
    }
    sessions.push(sessionId);
    clog.log(`Nouvelle session ${sessionId} ajoutée.`);
    return sessionId;
}

function removeSession(sessionId) {
    const index = sessions.indexOf(sessionId);
    if (index > -1) {
        sessions.splice(index, 1);
        clog.log(`Suppression de la session ${sessionId}.`);
    } else {
        clog.warn(`Session ${sessionId} non trouvée dans la liste des sessions.`);
    }
}

module.exports = {checkSession, addSession, removeSession};