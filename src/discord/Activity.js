const bot = require('./Bot')
const dlog = require('loguix').getInstance('Discord')
const {ActivityType} = require('discord.js')

function getActivity() {
    const client = bot.getClient()
    return client.user.presence.activities[0]
}

// Set All type of activities

function setMusicActivity(songName, artistName, imageUrl) {
    const client = bot.getClient()
    client.user.setActivity(`${songName} - ${artistName}`,{
            type: ActivityType.Listening,
            url: imageUrl
    });
    dlog.log(`Activité mise à jour : ${songName} - ${artistName}`)
}

function idleActivity() {
    const client = bot.getClient()
    client.user.setActivity("le silence absolu", {
        type: ActivityType.Listening
       
    });
    dlog.log(`Activité mise à jour : rien`)
}


module.exports = {getActivity, setMusicActivity, idleActivity}
