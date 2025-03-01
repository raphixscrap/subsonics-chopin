const {LogType} = require('loguix');
const clog = new LogType("SoundcloudInformation");
const {Song} = require('../player/Song');
const {Playlist} = require('../player/Playlist');
const {Soundcloud} = require('soundcloud.ts')
const {getReadableDuration} = require('../utils/TimeConverter');

const soundcloud = new Soundcloud();

async function getTrack(url) {
    try {
    const info = await soundcloud.tracks.get(url)

    if(!info) {
        clog.error("Impossible de récupérer les informations de la piste Soundcloud à partir de l'URL");
        return null;
    }

    const song = new Song();
    song.title = info.title;
    song.author = info.user.username;
    song.url = info.permalink_url;
    song.thumbnail = info.artwork_url;
    song.id = info.id;
    song.duration = info.duration / 1000;
    song.readduration = getReadableDuration(info.duration / 1000);
    song.type = "soundcloud";

    return song;

    } catch (error) {
        clog.error('Erreur lors de la recherche Soundcloud (Track): ' + error);
        return null;
    }
}

async function getPlaylist(url) {

    try {

    const info = await soundcloud.playlists.get(url)

    if(!info) {
        clog.error("Impossible de récupérer les informations de la playlist Soundcloud à partir de l'URL");
        return null;
    }

    const playlist = new Playlist();

    playlist.title = info.title;
    playlist.author = info.user.username;
    playlist.url = info.permalink_url;
    playlist.thumbnail = info.artwork_url;
    playlist.id = info.id;
    playlist.duration = 0;
    playlist.songs = [];
    playlist.type = "soundcloud";

    for(const track of info.tracks) {
        const song = new Song();
        song.title = track.title;
        song.author = track.user.username;
        song.url = track.permalink_url;
        song.thumbnail = track.artwork_url;
        song.id = track.id;
        song.duration = track.duration / 1000;
        song.readduration = getReadableDuration(track.duration / 1000);
        song.type = "soundcloud";

        playlist.duration += track.duration / 1000;
        playlist.songs.push(song);
    }

    playlist.readduration = getReadableDuration(playlist.duration);

    return playlist;

    } catch (error) {
        clog.error('Erreur lors de la recherche Soundcloud (Playlist): ' + error);
        return null;
    }
 
}

module.exports = {getTrack, getPlaylist}