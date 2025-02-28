const {LogType} = require('loguix');
const clog = new LogType("YoutubeInformation");
const config = require('../utils/Database/Configuration');
const YOUTUBE_API_KEY = config.getYoutubeApiKey()
const { Song } = require('../player/Song');
const { Playlist } = require('../player/Playlist');
const { getReadableDuration } = require('../utils/TimeConverter');


async function 
getQuery(query) {
    // Check Query not null and a string
    if(query === null && typeof query !== 'string') {
        clog.error("Impossible de rechercher une vidéo YouTube, car la requête est nulle");
        return null;
    }
    // * Fetch
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        
        var videoLink = null
        const videoId = data.items[0]?.id.videoId;
        if(videoId) videoLink = `https://www.youtube.com/watch?v=${videoId}`;
        if(videoLink === null) {
            clog.error("Impossible de récupérer le lien de la vidéo YouTube à partir de la requête");
            return null;
        }
        const song = await getVideo(videoLink);
     
        return song;
       
    } catch (error) {
        clog.error('Erreur lors de la recherche YouTube: ' + error);
        return null;
    }
}

async function getVideo(url) {
    // Extract video ID from URL if it exists and is valid (11 characters) and if not return "NOT_VALID"
    // Extract id from youtu.be youtube.com and music.youtube.com
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/|music\.youtube\.com\/)(?:watch\?v=)?([a-zA-Z0-9_-]{11})/);
    if(videoId === null) {
        clog.error("Impossible de récupérer l'identifiant de la vidéo YouTube à partir de l'URL");
        return null;
    }
    // Fetch video information
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId[1]}&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        
        const video = data.items[0];
        if(video) {

            const songReturn = new Song()
            await songReturn.processYoutubeVideo(video);
           
            return songReturn;
        } else {
            clog.error("Impossible de récupérer la vidéo YouTube à partir de l'identifiant");
            return null;
        }
    } catch (error) {
        clog.error('Erreur lors de la recherche de la vidéo YouTube:' +  error);
        return null;
    }


    
    
}

async function getPlaylist(url) {
    // Check Query not null and a string
    if(url === null && typeof url !== 'string') {
        clog.error("Impossible de rechercher une playlist YouTube, car la requête est nulle");
        return null;
    }
    // * Fetch
    try {
        // For Playlist
        const playlistId = url.match(/(?:youtu\.be\/|youtube\.com\/|music\.youtube.com\/)(?:playlist\?list=)?([a-zA-Z0-9_-]{34})/);
        if(playlistId === null) {
            clog.error("Impossible de récupérer l'identifiant de la vidéo YouTube à partir de l'URL");
            return null;
        }
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&q=${encodeURIComponent(playlistId[1])}&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();

        if(data.items.length === 0) {
            clog.error("Impossible de récupérer la playlist YouTube à partir de l'identifiant");
            return null;
        }

        const playlist = new Playlist()
        playlist.type = "youtube"
        playlist.author = data.items[0].snippet.channelTitle
        playlist.authorId = data.items[0].snippet.channelId
        playlist.title = data.items[0].snippet.title
        playlist.thumbnail = data.items[0].snippet.thumbnails.high.url
        playlist.description = data.items[0].snippet.description    
        playlist.url = `https://www.youtube.com/playlist?list=${playlistId[1]}`
        playlist.id = playlistId[1]

    


        // Get all songs from playlist

        const responsePlaylist = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId[1]}&key=${YOUTUBE_API_KEY}&maxResults=100`);
        const dataPlaylist = await responsePlaylist.json();

        if(dataPlaylist.items.length === 0) {
            clog.error("Impossible de récupérer les vidéos de la playlist YouTube à partir de l'identifiant ou la playlist est vide");
            return null;    
        }

        for (const video of dataPlaylist.items) {
            const song = new Song()
            video.id = video.snippet.resourceId.videoId
            await song.processYoutubeVideo(video)
            //? Add seconds to playlist duration
            playlist.duration += song.duration
            playlist.songs.push(song)
        }
        playlist.readduration = getReadableDuration(playlist.duration)
        return playlist;
     
     
       
       
    } catch (error) {
        clog.error('Erreur lors de la recherche YouTube: ' + error);
        return null;
    }

}

module.exports = {getQuery, getVideo, getPlaylist}