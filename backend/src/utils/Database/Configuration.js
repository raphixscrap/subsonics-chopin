const {Database} = require("./Database")
const {__glob} = require("../GlobalVars")
const {LogType} = require("loguix")
const path = require("path")

const clog = new LogType("Configuration")

const config = new Database("config", __glob.DATA  + path.sep + "config.json", {
    token: "",
    report: {
        channel : "",
        contact : ""
    }
})

function getToken() {
    return config.data.token
}

function getReportChannel() {
    return config.data.report.channel
}

function getReportContact() {
    return config.data.report.contact
}   

if(getToken() == "") {
    clog.error("Impossible de démarrer sans token valide")
    process.exit(1)
}

module.exports = {getToken, getReportChannel, getReportContact}