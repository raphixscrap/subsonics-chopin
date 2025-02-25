const {createAudioResource, VoiceConnectionStatus} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Media")
const plog = require("loguix").getInstance("Player")

async function play(instance, song) {
    //const resource = await song.getResource()
    const resource = createAudioResource(song.url)
    console.log(resource)
    // Wait until connection is ready
    instance.connection.once(VoiceConnectionStatus.Ready, async () => {
        instance.player.play(resource)
    })

    plog.log(`GUILD : ${instance.guildId} - Lecture de la musique : ${song.title}`)
}

module.exports = {play}