const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Media")
const plog = require("loguix").getInstance("Player")

async function play(instance, song) {
       try {
          
            instance.player = createAudioPlayer()
            instance.generatePlayerEvents()
            const player = instance.player
            var resource = await createAudioResource(song.url, {
                    inputType: StreamType.Arbitrary
               }) // Remplace par ton fichier audio

            player.play(resource);
            instance.connection.subscribe(player);
            clog.log(`GUILD : ${instance.guildId} - Lecture de la musique (Media): ${song.title} - id : ${song.id}`) 

       } catch(e) {
            clog.error("Erreur lors de la lecture de la musique : " + song.title)
            clog.error(e)
       }
    

}

module.exports = {play}