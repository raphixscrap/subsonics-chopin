const { LogType } = require('loguix');
const clog = new LogType("YoutubeInformation");
const { Song } = require('../player/Song');
const { Playlist } = require('../playlists/Playlist');
const { getReadableDuration, getSecondsDuration } = require('../utils/TimeConverter');
const yts = require("yt-search")
const ytfps = require('ytfps');

async function getQuery(query, multiple) {
    if (!query || typeof query !== 'string') {
        clog.error("Impossible de rechercher une vidéo YouTube, car la requête est nulle");
        return null;
    }

    try {
        const limit = multiple ? 25 : 1;
        const searchResults = await yts({ query: query, limit: limit });
        const videos = searchResults.videos;

        if (videos.length === 0) {
            clog.error("Impossible de récupérer le lien de la vidéo YouTube à partir de la requête");
            return null;
        }

        const songs = await Promise.all(videos.map(video => new Song().processYoutubeVideo(video)));
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
        const video = await yts({videoId: videoId[1]});
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

        // If watch?v= is present in the url with list?=, remove it and the code behind and transform it to playlist?list=
        var playlistId;

        // Get  &list= in the url until the first & or ? 

        if (url.includes("list=")) {
            playlistId = url.match(/(list=)([a-zA-Z0-9_-]+)/);
        }
        


        if (playlistId === null) {
            clog.error("Impossible de récupérer l'identifiant de la playlist YouTube à partir de l'URL");
            return null;
        }

        const playlistInfo = await yts({ listId: playlistId[2] });

        if (!playlistInfo) {
            clog.error("Impossible de récupérer la playlist YouTube à partir de l'identifiant");
            return null;
        }

        const playlist = new Playlist();
        playlist.type = "youtube";
        playlist.author = playlistInfo.author.name;
        playlist.authorId = playlistInfo.author.url;
        playlist.authorAvatar = await getYouTubeProfilePicture(playlistInfo.author.url);
        playlist.title = playlistInfo.title;
        playlist.thumbnail = playlistInfo.thumbnail;
        playlist.url = `https://www.youtube.com/playlist?list=${playlistId[2]}`;
        playlist.id = playlistInfo.listId;
        playlist.views = playlistInfo.views;

        for (const video of playlistInfo.videos) {
            const song = new Song();
            await song.processYoutubeVideo(video);
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

async function getSecondsFromUrl(url) {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/|music\.youtube\.com\/)(?:watch\?v=)?([a-zA-Z0-9_-]{11})/);
    if (videoId === null) {
        clog.error("Impossible de récupérer l'identifiant de la vidéo YouTube à partir de l'URL");
        return null;
    }
    try {
        const video = await yts({ videoId: videoId[1] });
        if (video) {
            return video.duration.seconds;
        } else {
            clog.error("Impossible de récupérer la vidéo YouTube à partir de l'identifiant");
            return null;
        }
    } catch (error) {
        clog.error('Erreur lors de la recherche de la vidéo YouTube:' + error);
        return null;
    }
}

async function getYouTubeProfilePicture(channelUrl) {
    try {
        const res = await fetch(channelUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        const html = await res.text();

        // Match img with yt-spec-avatar-shape__image in class list
        const imgRegex = /<img[^>]*(?:class="[^"]*\byt-spec-avatar-shape__image\b[^"]*"[^>]*|[^>]*class="[^"]*\byt-spec-avatar-shape__image\b[^"]*")[^>]*src="([^"]+)"/i;
        const imgMatch = html.match(imgRegex);

        if (imgMatch && imgMatch[1]) {
            return imgMatch[1];
        }

        // Fallback: look for avatar in embedded JSON
        const jsonRegex = /"avatar":\{"thumbnails":\[\{"url":"(.*?)"/;
        const match = html.match(jsonRegex);
        if (match && match[1]) {
            return match[1].replace(/\\u0026/g, "&"); // Decode \u0026 to &
        }

        console.warn("Photo non trouvée pour :", channelUrl);
        return null;
    } catch (err) {
        console.error("Erreur :", err);
        return null;
    }
}

module.exports = { getQuery, getVideo, getPlaylist, getSecondsFromUrl };
