const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Soundcloud-Stream")
const {Soundcloud} = require('soundcloud.ts')
const ffmpeg = require('fluent-ffmpeg')

const soundcloud = new Soundcloud();

async function getStream(song) {
       try {
          
          var stream = await soundcloud.util.streamTrack(song.url)
           return stream
            
               

       } catch(e) {
            clog.error("Erreur lors de la récupération du stream : " + song.title)
            clog.error(e)
       }
    

}

module.exports = {getStream}