const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Soundcloud")
const plog = require("loguix").getInstance("Player")
const {Soundcloud} = require('soundcloud.ts')

const soundcloud = new Soundcloud();

async function play(instance, song) {
       try {
          
            instance.player = createAudioPlayer()
            instance.generatePlayerEvents()
            const player = instance.player

            const stream = await soundcloud.util.streamTrack(song.url)
            var resource = await createAudioResource(stream)

            player.play(resource);
            instance.connection.subscribe(player);
            clog.log(`GUILD : ${instance.guildId} - Lecture de la musique (Soundcloud): ${song.title} - id : ${song.id}`) 

       } catch(e) {
            clog.error("Erreur lors de la lecture de la musique : " + song.title)
            clog.error(e)
       }
    

}

module.exports = {play}