const {LogType} = require('loguix');  
const clog = new LogType("SpotifyInformation");
const config = require('../utils/Database/Configuration');
const SPOTIFY_CLIENT_ID = config.getSpotifyClientId()
const SPOTIFY_CLIENT_SECRET = config.getSpotifyClientSecret()
const SpotifyWebApi = require('spotify-web-api-node');
const {Playlist} = require('../player/Playlist');
const {Song} = require('../player/Song');
const youtube = require("../media/YoutubeInformation");
const {getReadableDuration} = require('../utils/TimeConverter');

const spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
});

async function getSong(url) {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);

        const parts = url.split('/');
        const trackId = parts[parts.length - 1];

        if(!trackId) {
            clog.error("Impossible de récupérer l'identifiant de la piste Spotify à partir de l'URL");
            return null;
        }
        const trackInfo = await spotifyApi.getTrack(trackId);
        const trackName = trackInfo.body.name;
        const artistName = trackInfo.body.artists[0].name;

        return `${trackName} - ${artistName}`;
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);

    }
}

async function getAlbum(albumId) {
   
    
}

async function getPlaylist(url) {
    // Get the playlist and return a Playlist Object
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    const parts = url.split('/');
    const playlistId = parts[parts.indexOf('playlist') + 1].split('?')[0];

    spotifyApi.getPlaylist(playlistId)
    .then(function(data) {
        const info = data.body;

        const playlist = new Playlist() 
        playlist.title = info.name;
        playlist.author = info.owner.display_name;
        playlist.authorId = info.owner.id;
        playlist.thumbnail = info.images[0].url;
        playlist.url = info.external_urls.spotify;
        playlist.id = playlistId;
        playlist.type = "spotify";
        
        const tracks = info.tracks.items;
        tracks.forEach(async function(track) {
        
            var trackName = track.track.name;
            var artistName = track.track.artists[0].name;
            var queryForYoutube =  `${trackName} - ${artistName}`;

            var urlYoutubeFounded = await youtube.getQuery(queryForYoutube).then(function(songFind) {
                if(!songFind) return null;
                return songFind.url;
            });
            
            clog.log("URL de la vidéo YouTube trouvée : " + urlYoutubeFounded);

            if(!urlYoutubeFounded) {
                clog.error("Impossible de récupérer l'URL de la vidéo YouTube à partir de la requête  " + queryForYoutube);
               
            } else {
                const song = new Song();
                song.title = track.track.name;
                song.author = track.track.artists[0].name;
                song.url = urlYoutubeFounded;
                song.thumbnail = track.track.album.images[0].url;
                song.id = track.track.id;
                song.duration = track.track.duration_ms / 1000;
                song.readduration = getReadableDuration(track.track.duration_ms);
    
                playlist.duration += track.track.duration_ms;
    
    
                playlist.songs.push(song);
            }

            
        });

        playlist.readduration = getReadableDuration(playlist.duration);
        return playlist;
   
    }, function(err) {
        clog.error('Une erreur s\'est produite lors de la récupération de la playlist');
        clog.error(err);
    });
}


module.exports = {getSong, getAlbum, getPlaylist}