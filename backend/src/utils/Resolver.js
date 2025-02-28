const {Links} = require('./Links')
const {QueryType} = require('./QueryType')

function getQueryType(url) {
    // Check if it's string
 
    if(typeof url !== "string") return "NOT_STRING"
    // Check if it's a Youtube link
  
    if(Links.regex.youtube.playlist.test(url)) return QueryType.YOUTUBE_PLAYLIST
    if(Links.regex.youtube.videoURL.test(url)) return QueryType.YOUTUBE_VIDEO
    
    // Check if it's a Spotify link

    if(Links.regex.spotify.playlist.test(url)) return QueryType.SPOTIFY_PLAYLIST
    if(Links.regex.spotify.album.test(url)) return QueryType.SPOTIFY_ALBUM
    if(Links.regex.spotify.song.test(url)) return QueryType.SPOTIFY_SONG
    
    // Check if it's a Soundcloud link
 
    if(Links.regex.soundcloud.track.test(url)) return QueryType.SOUNDCLOUD_TRACK
    if(Links.regex.soundcloud.playlist.test(url)) return QueryType.SOUNDCLOUD_PLAYLIST
    


    return QueryType.YOUTUBE_SEARCH
    

    
}
    
module.exports = {getQueryType}