const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Youtube-Stream")
const ytdl = require('@distube/ytdl-core')
const { __glob } = require('../../utils/GlobalVars');
const fs = require('fs');

async function getStream(song) {

    //  FIXME: Change youtube provider
    
       try {

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                          'Chrome/116.0.5845.97 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        };

         var cookies = await JSON.parse(await fs.readFileSync(__glob.COOKIES, 'utf-8'));
         const proxy = await JSON.parse(await fs.readFileSync(__glob.PROXY, 'utf-8'));
          const agent = ytdl.createProxyAgent(proxy, cookies)
          let stream = ytdl(song.url, {
               quality: 'highestaudio',
               highWaterMark: 1 << 30,
               liveBuffer: 20000,
               dlChunkSize: 0,
               bitrate: 128,
               requestOptions: {
                headers: headers,
               },
               agent: agent,
          });

        return stream
    
    } catch(e) {
        clog.error("Erreur lors de la récupération du stream : " + song.title)
        clog.error(e)
               
    }
}


module.exports = {getStream}
