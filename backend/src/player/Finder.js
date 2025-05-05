const Resolver = require('../utils/Resolver');
const { QueryType } = require('../utils/QueryType');
const { Links } = require('../utils/Links');
const youtube = require("../media/YoutubeInformation")
const spotify = require("../media/SpotifyInformation")
const soundcloud = require("../media/SoundcloudInformation")


async function search(query, multiple, forceType) {
    if(!query) return null
    if(!multiple) multiple = false
    if(!forceType) forceType = null
    if(forceType == "PLAYLIST") {
        if(query.includes("spotify")) {
            return await spotify.getPlaylist(query)
        } else if(query.includes("soundcloud")) {
            return await soundcloud.getPlaylist(query)
        } else if(query.includes("youtube")) {
            return await youtube.getPlaylist(query)
        } else {
            return null
        }
    } 

    if(forceType == "SONG") {
        if(query.includes("spotify")) {
            return await spotify.getSong(query)
        } else if(query.includes("soundcloud")) {
            return await soundcloud.getTrack(query)
        } else if(query.includes("youtube")) {
            return await youtube.getQuery(query, multiple)
        } else {
            return null
        }
    }

    if(forceType == "ALBUM") {
        if(query.includes("spotify")) {
            return await spotify.getAlbum(query)
        } else if(query.includes("youtube")) {
            return await youtube.getQuery(query, multiple)
        } else {
            return null
        }
    }

    const type = Resolver.getQueryType(query)
    if(type == QueryType.YOUTUBE_SEARCH) {
        return await youtube.getQuery(query, multiple)
       
    }
    if(type == QueryType.YOUTUBE_VIDEO) {
    
        return await youtube.getVideo(query)
    }
    if(type == QueryType.YOUTUBE_PLAYLIST) {
    
        return await youtube.getPlaylist(query)
    }
    if(type == QueryType.SPOTIFY_SONG) {
        return await youtube.getQuery(await spotify.getSong(query))
        
    }
    if(type == QueryType.SPOTIFY_ALBUM) {
        return await spotify.getAlbum(query)
    }
    if(type == QueryType.SPOTIFY_PLAYLIST) {
        return await spotify.getPlaylist(query)

    }
    if(type == QueryType.SOUNDCLOUD_TRACK) {
        return await soundcloud.getTrack(query)

    }
    if(type == QueryType.SOUNDCLOUD_PLAYLIST) {
        return await soundcloud.getPlaylist(query)
        
    }
    //MORELATER: Add more providers
}

module.exports = {search}