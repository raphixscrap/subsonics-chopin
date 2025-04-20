const { LogType } = require('loguix');
const clog = new LogType("YoutubeInformation");
const { Song } = require('../player/Song');
const { Playlist } = require('../playlists/Playlist');
const { getReadableDuration } = require('../utils/TimeConverter');
const ytsr = require('@distube/ytsr');
const ytfps = require('ytfps');

async function getQuery(query, multiple) {
    if (!query || typeof query !== 'string') {
        clog.error("Impossible de rechercher une vidéo YouTube, car la requête est nulle");
        return null;
    }

    try {
        const limit = multiple ? 25 : 1;
        const searchResults = await ytsr(query, { limit });
        const videos = searchResults.items.filter(item => item.type === 'video');

        if (videos.length === 0) {
            clog.error("Impossible de récupérer le lien de la vidéo YouTube à partir de la requête");
            return null;
        }

        const songs = await Promise.all(videos.map(video => getVideo(video.url)));
        return multiple ? songs.filter(song => song !== null) : songs[0];
    } catch (error) {
        clog.error('Erreur lors de la recherche YouTube: ' + error);
        return null;
    }
}

async function getVideo(url) {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/|music\.youtube\.com\/)(?:watch\?v=)?([a-zA-Z0-9_-]{11})/);
    if (videoId === null) {
        clog.error("Impossible de récupérer l'identifiant de la vidéo YouTube à partir de l'URL");
        return null;
    }

    try {
        const searchResults = await ytsr(videoId[1], { limit: 1 });
        const video = searchResults.items.find(item => item.type === 'video');

        if (video) {
            const songReturn = new Song();
            await songReturn.processYoutubeVideo(video);
            return songReturn;
        } else {
            clog.error("Impossible de récupérer la vidéo YouTube à partir de l'identifiant");
            return null;
        }
    } catch (error) {
        clog.error('Erreur lors de la recherche de la vidéo YouTube:' + error);
        return null;
    }
}

async function getPlaylist(url) {
    if (url === null || typeof url !== 'string') {
        clog.error("Impossible de rechercher une playlist YouTube, car la requête est nulle");
        return null;
    }

    try {
        const playlistId = url.match(/(?:youtu\.be\/|youtube\.com\/|music\.youtube\.com\/)(?:playlist\?list=)?([a-zA-Z0-9_-]{34})/);
        if (playlistId === null) {
            clog.error("Impossible de récupérer l'identifiant de la playlist YouTube à partir de l'URL");
            return null;
        }

        const playlistInfo = await ytfps(playlistId[1]);

        if (!playlistInfo) {
            clog.error("Impossible de récupérer la playlist YouTube à partir de l'identifiant");
            return null;
        }

        const playlist = new Playlist();
        playlist.type = "youtube";
        playlist.author = playlistInfo.author.name;
        playlist.authorId = playlistInfo.author.url;
        playlist.title = playlistInfo.title;
        playlist.thumbnail = playlistInfo.thumbnail_url;
        playlist.description = playlistInfo.description;
        playlist.url = `https://www.youtube.com/playlist?list=${playlistId[1]}`;
        playlist.id = playlistId[1];

        for (const video of playlistInfo.videos) {
            const song = new Song();
            await song.processYoutubeVideo(video, true);
            playlist.duration += song.duration;
            playlist.songs.push(song);
        }
        playlist.readduration = getReadableDuration(playlist.duration);
        return playlist;
    } catch (error) {
        clog.error('Erreur lors de la recherche YouTube: ' + error);
        return null;
    }
}

module.exports = { getQuery, getVideo, getPlaylist };
