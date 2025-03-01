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
       
        clog.error("Impossible de récupérer les informations de la piste Spotify à partir de l'URL");
        clog.error(error);
        return null;
    }
}

async function getAlbum(url) {

    try {
        

    const creditdata = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(creditdata.body['access_token']);

    const parts = url.split('/');
    const albumId = parts[parts.indexOf('album') + 1].split('?')[0];

    const data = await spotifyApi.getAlbum(albumId);
    const info = data.body;

    if(!info) {
        clog.error("Impossible de récupérer les informations de l'album Spotify à partir de l'URL");
        return null;
    }

    clog.log("Informations de l'album récupérées : " + info.name);  

    const playlist = new Playlist() 
    playlist.title = info.name;
    playlist.author = info.artists[0].name;
    playlist.authorId = info.artists[0].id;
    playlist.thumbnail = info.images[0].url;
    playlist.url = info.external_urls.spotify;
    playlist.id = albumId;
    playlist.type = "spotify";
    playlist.songs = info.tracks.items;

    return playlist;

    } catch (error) {
       
        clog.error("Impossible de récupérer les informations de l'album Spotify à partir de l'URL");
        clog.error(error);
        return null;
    }
   
    
}

async function getPlaylist(url) {
    // Get the playlist and return a Playlist Object

    try {
    const creditdata = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(creditdata.body['access_token']);

    const parts = url.split('/');
    const playlistId = parts[parts.indexOf('playlist') + 1].split('?')[0];

        const data = await spotifyApi.getPlaylist(playlistId)
  
        const info = data.body;

        if(!info) {
            clog.error("Impossible de récupérer les informations de la playlist Spotify à partir de l'URL");
            return null;
        }

        clog.log("Informations de la playlist récupérées : " + info.name);  

        const playlist = new Playlist() 
        playlist.title = info.name;
        playlist.author = info.owner.display_name;
        playlist.authorId = info.owner.id;
        playlist.thumbnail = info.images[0].url;
        playlist.url = info.external_urls.spotify;
        playlist.id = playlistId;
        playlist.type = "spotify";
       
        for(const track of info.tracks.items) {
            playlist.songs.push(track.track);
        }

        return playlist;
        
    } catch (error) {
       
        clog.error("Impossible de récupérer les informations de l'album Spotify à partir de l'URL");
        clog.error(error);
        return null;
    }
          
}

async function getTracks(playlist) {

    const tracks = playlist.songs
    playlistSongs = [];
    for(const track of tracks) {
    
        var trackName = track.name;
        var artistName = track.artists[0].name;
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

            song.title = track.name;
            song.author = track.artists[0].name;
            song.url = urlYoutubeFounded;
            song.thumbnail = playlist.thumbnail;
            song.id = track.id;
            song.duration = track.duration_ms / 1000;
            song.readduration = getReadableDuration(track.duration_ms / 1000);
            song.type = "youtube";

            playlist.duration += track.duration_ms / 1000;
            playlistSongs.push(song);
        }

        // When finish do this

    }

        playlist.readduration = getReadableDuration(playlist.duration);
        playlist.songs = playlistSongs;


        return playlist;
}


module.exports = {getSong, getAlbum, getPlaylist, getTracks}