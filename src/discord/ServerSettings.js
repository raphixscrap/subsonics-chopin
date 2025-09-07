const { LogType } = require('loguix');
const clog = new LogType('ServerSettings');
const { __glob } = require('../utils/GlobalVars');
const { Database } = require('../utils/Database/Database');
const ServerDB = new Database("server_settings", __glob.SERVER_DB, {});

function getSecureRole(guildId) {
    checkKey(guildId);
    var role = ServerDB.getData()[guildId].secureRole || null;
    if(role) {
        if(role.name === "@everyone") {
            return null;
        }
    }
    return role;
}

function setSecureRole(guildId, roleId) {
    checkKey(guildId);
    ServerDB.getData()[guildId].secureRole = roleId;
    ServerDB.save();
    process.emit("USERS_UPDATE")
    return true;
}

async function checkKey(guildId) {
    const data = ServerDB.getData();
    if (!data[guildId]) {
        data[guildId] = { secureRole: null };
        ServerDB.save();
    }
   
}

module.exports = {
    getSecureRole,
    setSecureRole
};
