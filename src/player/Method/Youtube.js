const {createAudioResource, VoiceConnectionStatus, createAudioPlayer, StreamType} = require('@discordjs/voice');
const {LogType} = require('loguix')
const clog = new LogType("Youtube-Stream")
const ytdl = require('@distube/ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
const { getRandomIPv6 } = require("@distube/ytdl-core/lib/utils");

async function getStream(song) {

        //FIXME: Change youtube provider
       const cookies = [
            {
                "domain": ".youtube.com",
                "expirationDate": 1787997552.154245,
                "hostOnly": false,
                "httpOnly": true,
                "name": "__Secure-1PSIDTS",
                "path": "/",
                "sameSite": "unspecified",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "sidts-CjUB5H03P1eFzyOjf7iFS9S6yN4AqceShfkIkvPkpZwOW5LQeQV067Xii6ZWiTxoXL2dOIlB0xAA",
                "id": 1
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1791021552.154345,
                "hostOnly": false,
                "httpOnly": false,
                "name": "__Secure-3PAPISID",
                "path": "/",
                "sameSite": "no_restriction",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "fOTsHsOxnWoXhiUB/AqEIhO8nncInuR8rz",
                "id": 2
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1791021552.154362,
                "hostOnly": false,
                "httpOnly": true,
                "name": "__Secure-3PSID",
                "path": "/",
                "sameSite": "no_restriction",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "g.a0000whlgE5u02Gic-y3Xv79fKiY_rEYP3D1Epg_nHe_sq4rB3cPqYwTtWZ03wl6ezyiyQAU9gACgYKAWcSARQSFQHGX2MibBW35YRzvbQffZKHV9um3hoVAUF8yKqUL4kb3nKQdUHrCv97ORRV0076",
                "id": 3
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1787997603.866,
                "hostOnly": false,
                "httpOnly": true,
                "name": "__Secure-3PSIDCC",
                "path": "/",
                "sameSite": "no_restriction",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "AKEyXzVrFCvitebcHpnaI5cEG4zP7KuLMuUu0aGQFmNSbAjqCoY1_zeT545QE7hHdATGBpO7Pw",
                "id": 4
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1787997552.154322,
                "hostOnly": false,
                "httpOnly": true,
                "name": "__Secure-3PSIDTS",
                "path": "/",
                "sameSite": "no_restriction",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "sidts-CjUB5H03P1eFzyOjf7iFS9S6yN4AqceShfkIkvPkpZwOW5LQeQV067Xii6ZWiTxoXL2dOIlB0xAA",
                "id": 5
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1790589574.430833,
                "hostOnly": false,
                "httpOnly": true,
                "name": "__Secure-YEC",
                "path": "/",
                "sameSite": "lax",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "CgtVb1BOdEIxbDhqbyiH9MXFBjInCgJGUhIhEh0SGwsMDg8QERITFBUWFxgZGhscHR4fICEiIyQlJiAo",
                "id": 6
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1756462164,
                "hostOnly": false,
                "httpOnly": false,
                "name": "CONSISTENCY",
                "path": "/",
                "sameSite": "unspecified",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "AKreu9vapsE-D9riK0YUXwAAz5qE-UybsBcvUp7LAVHoItqgMjtsFcTEXhLW_lkTdGZDln9ND2iB9PxrkhJPH-MWxATGhPTky1fYgQmMnPxDaqiQkzJQ4rZ8FjpPMUxANloGziFufRcNzSHkCkVd6oBj",
                "id": 7
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1756463354.608961,
                "hostOnly": false,
                "httpOnly": true,
                "name": "GPS",
                "path": "/",
                "sameSite": "unspecified",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "1",
                "id": 8
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1791021554.511376,
                "hostOnly": false,
                "httpOnly": true,
                "name": "LOGIN_INFO",
                "path": "/",
                "sameSite": "no_restriction",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "AFmmF2swRAIgemYDi5tgUKdwVnd3jPFEQNKzUGVkWUn0K_Aevsp3CWYCIG01E_bNLSV8_vdOZ6S2rHO2vs8EQS2xm0eGU7Xr3ktp:QUQ3MjNmeUt0SG1kdWsyVVJWUmkzbU0tNFp4VEJRNnZEZWRJNmF3VUpvNVpzSGc0aWdUN3ZrVGt6eFFVMnF0UVNXZGlPSjdBY2d3ZDVhOHN0VmphU3J1VWk2WFRHWUVGZnE3RHZqNWdQdlE0QmltbW52aHlSUWJLYmdXOVNZazV5UEZpTmtSUkNwT0hCVFZVWHhIYUNMVktKQ1JpVmYxazZn",
                "id": 9
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1791021560.804764,
                "hostOnly": false,
                "httpOnly": false,
                "name": "PREF",
                "path": "/",
                "sameSite": "unspecified",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "f6=40000000&tz=Europe.Paris",
                "id": 10
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1790412568.984102,
                "hostOnly": false,
                "httpOnly": false,
                "name": "SOCS",
                "path": "/",
                "sameSite": "lax",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "CAAaBgiAlbnFBg",
                "id": 11
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1772013603.865942,
                "hostOnly": false,
                "httpOnly": true,
                "name": "VISITOR_PRIVACY_METADATA",
                "path": "/",
                "sameSite": "no_restriction",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "CgJGUhIhEh0SGwsMDg8QERITFBUWFxgZGhscHR4fICEiIyQlJiAo",
                "id": 12
            },
            {
                "domain": ".youtube.com",
                "expirationDate": 1756461674.511457,
                "hostOnly": false,
                "httpOnly": true,
                "name": "YTSESSION-js1wlf",
                "path": "/",
                "sameSite": "unspecified",
                "secure": true,
                "session": false,
                "storeId": "0",
                "value": "ANPz9Kig405ZS6xB8yYm7gwWVAJKCUOYanC3MQXUsI24o1blDFAG9/PHFjygZMcrF52DuumKq6oyePMMl4Tp/CGLCWGCiNcFDW5IU6S0g7mgJOl9",
                "id": 13
            }
            ]
       ytdl.createAgent(cookies)
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
