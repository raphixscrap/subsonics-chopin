const {LogType} = require("loguix")
const hlog = new LogType("PersonalHistory")
const {__glob} = require("../utils/GlobalVars")
const { Database } = require("../utils/Database/Database")
const historyDb = new Database("history", __glob.HISTORY_DB, {})
historyDb.load()

/**
 * @param {string} userId
 * @returns {Array<Object>}
 * @description Renvoie l'historique personnel de l'utilisateur
 */
function getPersonalHistory(userId) {
    if (historyDb.data[userId]) {
        return historyDb.data[userId];
    } else {
        hlog.log(`Création d'une clé pour l'utilisateur : ${userId}`);
        historyDb.data[userId] = [];
        historyDb.save();
        return historyDb.data[userId];
    }
}

/**
 * @param {string} userId
 * @param {Object} entry
 * @description Ajoute une entrée à l'historique personnel de l'utilisateur
 */
function addToPersonalHistory(userId, entry) {
    hlog.log(`Ajout d'une entrée à l'historique personnel de l'utilisateur : ${userId}`);
    const history = getPersonalHistory(userId);
    // Limit to 25 entries
    if (history.length >= 25) {
        history.shift();
    }
    history.push(entry)
    historyDb.save();
}

/**
 * @param {string} userId
 * @description Vide l'historique personnel de l'utilisateur
 */
function clearPersonalHistory(userId) {
    hlog.log(`Vidage de l'historique personnel de l'utilisateur : ${userId}`);
    historyDb.data[userId] = [];
    historyDb.save();
}

module.exports = {
    getPersonalHistory,
    addToPersonalHistory,
    clearPersonalHistory
};
