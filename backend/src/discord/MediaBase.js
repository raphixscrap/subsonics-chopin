const {LogType} = require("loguix")
const config = require("../utils/Database/Configuration")   
const wlog = new LogType("MediaBase")
const { Database } = require("../utils/Database/Database")
const {__glob} = require("../utils/GlobalVars")
const { AttachmentBuilder } = require("discord.js")
const discordBot = require("./Bot")


var connected = false
var mediaDB = new Database("media", __glob.MEDIA_DB, [])

wlog.step.init("init_db", "Initialisation de la base de données multimédia")

if(!config.getMediaGuildId() || !config.getMediaChannelId()) {
    wlog.warn("La configuration de la base de données multimédia n'est pas définie, vérifiez le fichier de configuration.")
    wlog.step.error("init_db","Impossible d'initialiser la base de données multimédia, vérifiez le fichier de configuration.")
}



var channel = null

discordBot.getClient().on("ready", () => {
    channel = discordBot.getChannel(config.getMediaGuildId(), config.getMediaChannelId())
    if(!channel) {
    wlog.warn("Le canal multimédia n'existe pas, vérifiez le fichier de configuration.")
    wlog.step.error("init_db","Impossible d'initialiser la base de données multimédia, vérifiez le fichier de configuration.")
    }

    
    try {
        const dateTime = new Date()
        const date = dateTime.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
        const time = dateTime.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' })
        const message = `[LOGS] La base de données multimédia a été initialisée le ${date} à ${time}`
        channel.send(message)
        wlog.log("La base de données multimédia a été initialisée avec succès.")
        wlog.step.end("init_db")
        connected = true    
    } catch (e) {   
        wlog.error("Impossible d'envoyer un message au canal multimédia, vérifiez le fichier de configuration.")
        wlog.step.error("init_db","Impossible d'envoyer un message au canal multimédia, vérifiez le fichier de configuration.")
        connected = false
    }

})


// SEND FILE TO DISCORD AND GET THE URL ID

async function postMedia(file) {
    if(!connected) {
        wlog.error("La base de données multimédia n'est pas connectée, impossible d'envoyer le fichier.")
        return null
    }
    
    try {
        const attachment = new AttachmentBuilder(file.file)
        attachment.setName(file.name) // Set the name of the file
        attachment.setDescription("Fichier envoyé par Subsonics Chopin - Raphix")
        const message = await channel.send({ files: [attachment] })
        const url = message.attachments.first().url
        wlog.log(`Fichier envoyé avec succès : ${url}`)
        // add the file to the database
        mediaDB.data.push({
            id: message.id,
            url: url,
            name: file.name,
            size: file.size,
            createdAt: new Date().toISOString()
        })
        mediaDB.save()
        return url
    } catch (error) {
        wlog.error(`Erreur lors de l'envoi du fichier : ${error.message}`)
        return null
    }
}

async function getMedia(id) {
    if(!connected) {
        wlog.error("La base de données multimédia n'est pas connectée, impossible de récupérer le fichier.")
        return null
    }
    
    const media = mediaDB.data.find(m => m.id === id)
    if(!media) {
        wlog.error(`Aucun média trouvé avec l'ID : ${id}`)
        return null
    }
    
    try {
        return media.url
    } catch (error) {
        wlog.error(`Erreur lors de la récupération du média : ${error.message}`)
        return null
    }
}

module.exports = {
    postMedia,
    getMedia,
}