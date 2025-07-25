const pm2 = require("pm2")
const { LogType } = require("loguix")
const clog = new LogType("Maintenance")

function restart(reason) {
    clog.warn("Redémarrage du serveur Subsonics")
    clog.warn(`Reason: ${reason}`)
    pm2.restart("Subsonics")
}

module.exports = {restart}