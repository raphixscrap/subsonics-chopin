const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Youtube")
const plog = require("loguix").getInstance("Player")
const ytdl = require('@distube/ytdl-core')

async function play(instance, song) {
       try {
              
          instance.player = createAudioPlayer()
          instance.generatePlayerEvents()
          const player = instance.player
          const stream = ytdl(song.url, { 
               quality: 'highestaudio',
               highWaterMark: 1 << 30,
               liveBuffer: 20000,
               dlChunkSize: 0,
               bitrate: 128,
          
          });

                    // Add compressor to the audio resource
          song.resource = createAudioResource(stream);



          player.play(song.resource);
          instance.connection.subscribe(player);
          clog.log(`GUILD : ${instance.guildId} - Lecture de la musique (Media): ${song.title} - id : ${song.id}`) 
    
           } catch(e) {
                clog.error("Erreur lors de la lecture de la musique : " + song.title)
                clog.error(e)
           }
}

module.exports = {play}
