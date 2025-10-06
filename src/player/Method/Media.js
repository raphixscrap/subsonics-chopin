const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Media")
const plog = require("loguix").getInstance("Player")
const ffmpeg = require('fluent-ffmpeg') 

async function getStream(song) {
       try {
           const stream = await fetch(song.url).then(res => res.body);
           return stream;
       } catch(e) {
            clog.error("Erreur lors de la lecture de la musique : " + song.title)
            clog.error(e)
       }
    

}

module.exports = {getStream}