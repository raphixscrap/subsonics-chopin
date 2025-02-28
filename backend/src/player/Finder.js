const Resolver = require('../utils/Resolver');
const { QueryType } = require('../utils/QueryType');
const { Links } = require('../utils/Links');
const youtube = require("../media/YoutubeInformation")
const spotify = require("../media/SpotifyInformation")


async function search(query) {
    const type = Resolver.getQueryType(query)
    if(type == QueryType.YOUTUBE_SEARCH) {

        return await youtube.getQuery(query)
      
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

    }
    if(type == QueryType.SPOTIFY_PLAYLIST) {
        return await spotify.getPlaylist(query)

    }
    if(type == QueryType.SOUNDCLOUD_TRACK) {

    }
    if(type == QueryType.SOUNDCLOUD_PLAYLIST) {
        
    }
    // TODO: Add more providers
}

module.exports = {search}