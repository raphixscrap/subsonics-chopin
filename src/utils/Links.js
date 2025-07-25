const YoutubeLinks = [
    "youtube.com",
    "youtu.be",
    "music.youtube.com",
    "gaming.youtube.com",
    "www.youtube.com",
    "m.youtube.com"
]


var youtubePlaylistRegex = new RegExp(/^https?:\/\/(www.)?youtube.com\/playlist\?list=((PL|FL|UU|LL|RD|OL)[a-zA-Z0-9-_]{16,41})$/)
var youtubeVideoURLRegex = new RegExp(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:watch\?v=))([\w-]{11})(\S+)?$/)
var youtubeVideoIdRegex = new RegExp(/^[a-zA-Z0-9-_]{11}$/)




const SpotifyLinks = [
    "open.spotify.com", 
    "embed.spotify.com"
]

var spotifySongRegex = new RegExp(/^https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(intl-([a-z]|[A-Z])+\/)?(?:track\/|\?uri=spotify:track:)((\w|-){22})(\?si=.+)?$/)
var spotifyPlaylistRegex = new RegExp(/^https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(intl-([a-z]|[A-Z])+\/)?(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})(\?si=.+)?$/)
var spotifyAlbumRegex = new RegExp(/^https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(intl-([a-z]|[A-Z])+\/)?(?:album\/|\?uri=spotify:album:)((\w|-){22})(\?si=.+)?$/)


const SoundcloudLinks = [
    "soundcloud.com"
]


var soundcloudTrackRegex = new RegExp(/^https?:\/\/(m.|www.)?soundcloud.com\/(\w|-)+\/(\w|-)+(.+)?$/)
var soundcloudPlaylistRegex = new RegExp(/^https?:\/\/(m.|www.)?soundcloud.com\/(\w|-)+\/sets\/(\w|-)+(.+)?$/)

/**
 * @typedef {Object} Links
 * @property {Object} regex
 * @property {Object} regex.youtube
 * @property {RegExp} regex.youtube.playlist
 * @property {RegExp} regex.youtube.videoURL
 * @property {RegExp} regex.youtube.videoId
 * @property {Object} regex.spotify
 * @property {RegExp} regex.spotify.song
 * @property {RegExp} regex.spotify.playlist
 * @property {RegExp} regex.spotify.album
 * @property {Object} regex.soundcloud
 * @property {RegExp} regex.soundcloud.track
 * @property {RegExp} regex.soundcloud.playlist
 * @property {Object} types
 * @property {Array<String>} types.youtube
 * @property {Array<String>} types.spotify
 * @property {Array<String>} types.soundcloud
 */
const Links = {
    regex: {
        youtube: {
            playlist: youtubePlaylistRegex,
            videoURL: youtubeVideoURLRegex,
            videoId: youtubeVideoIdRegex
        },
        spotify: {
            song: spotifySongRegex,
            playlist: spotifyPlaylistRegex,
            album: spotifyAlbumRegex
        },
        soundcloud: {
            track: soundcloudTrackRegex,
            playlist: soundcloudPlaylistRegex
        }
    },
    types: {
        youtube: YoutubeLinks,
        spotify: SpotifyLinks,
        soundcloud: SoundcloudLinks
    }
}

module.exports = {Links}