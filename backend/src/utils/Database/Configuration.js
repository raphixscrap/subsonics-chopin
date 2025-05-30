const {Database} = require("./Database")
const {__glob} = require("../GlobalVars")
const {LogType} = require("loguix")
const path = require("path")
const { get } = require("http")

const clog = new LogType("Configuration")

const config = new Database("config", __glob.DATA  + path.sep + "config.json", {
    token: "",
    client_secret: "",
    report: {
        channel : "",
        contact : ""
    },
    api: {
        youtube: {
            clientId : "" ,
            clientSecret: ""
        },
        spotify: {
            clientId: "",
            clientSecret: ""
        }
    },
    website: "",
    server_port: 5000,
    media: {
        guildId: "",
        channelId: "",
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

function getYoutubeApiClientId() {
    return config.data.api.youtube.clientId
}

function getYoutubeApiClientSecret() {
    return config.data.api.youtube.clientSecret
}

function getSpotifyClientId() {
    return config.data.api.spotify.clientId
}

function getSpotifyClientSecret() {

    return config.data.api.spotify.clientSecret
}

function getWebsiteLink() {
    return config.data.website
}

function getPort() {
    return config.data.server_port
}

function getClientSecret() {
    return config.data.client_secret
}

function getMediaGuildId() {
    return config.data.media.guildId
}

function getMediaChannelId() {
    return config.data.media.channelId
}

if(getToken() == "") {
    clog.error("Impossible de démarrer sans token valide")
    process.exit(1)
}

module.exports = {
    getToken,
    getClientSecret,
    getReportChannel,
    getReportContact,
    getYoutubeApiClientId,
    getYoutubeApiClientSecret,
    getSpotifyClientId,
    getSpotifyClientSecret,
    getWebsiteLink,
    getPort,
    getMediaGuildId,
    getMediaChannelId
    
}