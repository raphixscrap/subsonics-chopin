const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Youtube-Stream")
const ytdl = require('@distube/ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
const { getRandomIPv6 } = require("@distube/ytdl-core/lib/utils");
const { __glob } = require('../../utils/GlobalVars');

async function getStream(song) {
       try {

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                          'Chrome/116.0.5845.97 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        };
        // let cookies = null;
        // try {
        //     cookies = JSON.parse(fs.readFileSync(__glob.COOKIES, 'utf-8'));
        // } catch (error) {
        //     clog.error("Erreur lors de la lecture des cookies : " + error);
        // }

        // ytdl.createAgent({
        //     cookies
        // });
          let stream = ytdl(song.url, { 
               quality: 'highestaudio',
               highWaterMark: 1 << 30,
               liveBuffer: 20000,
               dlChunkSize: 0,
               bitrate: 128,
               requestOptions: {
                   headers: headers,
               }
          });

        return stream
    
    } catch(e) {
        clog.error("Erreur lors de la récupération du stream : " + song.title)
        clog.error(e)
               
    }
}


module.exports = {getStream}
