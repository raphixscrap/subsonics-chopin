const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Youtube-Stream")
const ytdl = require('@distube/ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
const { getRandomIPv6 } = require("@distube/ytdl-core/lib/utils");

async function getStream(song) {
       try {
         
          let stream = ytdl(song.url, { 
               quality: 'highestaudio',
               highWaterMark: 1 << 30,
               liveBuffer: 20000,
               dlChunkSize: 0,
               bitrate: 128,

          });

        return stream
    
    } catch(e) {
        clog.error("Erreur lors de la récupération du stream : " + song.title)
        clog.error(e)
               
    }
}


module.exports = {getStream}
