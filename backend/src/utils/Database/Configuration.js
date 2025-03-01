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
    },
    api: {
        youtube: "",
        spotify: {
            clientId: "",
            clientSecret: ""
        }
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

function getYoutubeApiKey() {
    return config.data.api.youtube
}

function getSpotifyClientId() {
    return config.data.api.spotify.clientId
}

function getSpotifyClientSecret() {

    return config.data.api.spotify.clientSecret
}

if(getToken() == "") {
    clog.error("Impossible de démarrer sans token valide")
    process.exit(1)
}

module.exports = {getToken, getReportChannel, getReportContact, getYoutubeApiKey, getSpotifyClientId, getSpotifyClientSecret}