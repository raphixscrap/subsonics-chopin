const {Database} = require('../utils/Database/Database');
const {__glob} = require('../utils/GlobalVars');

const {Playlist} = require('./Playlist');
const {LogType} = require('loguix');
const clog = new LogType("PlaylistManager");
const Finder = require('../player/Finder');
const spotify = require('../media/SpotifyInformation');

const playlistDB = new Database("Playlists", __glob.PLAYLISTFILE, {});

/** 
* @param {string} id 
* @param {string} name 
* @returns {Array<Playlist>}
* @description Renvoie la liste des playlists de l'utilisateur
*/
function getPlaylistsOfUser(id) {
    if (playlistDB.data[id]) {
        return playlistDB.data[id];
    } else {
        // Creaete a key with the user id and an empty array
        playlistDB.data;[id] = new Array();
        clog.log(`Création d'une clé pour l'utilisateur : ${id}`);
        playlistDB.save();
        return playlistDB.data[id];
    }
    
}

/**
 * @param {string} id 
 * @param {string} name 
 * @returns {Playlist}
 */
function getPlaylistOfUser(id, name) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) {
        clog.warn(`La playlist ${name} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    return playlist;
}

async function addPlaylist(id, name, url) {
    const playlists = getPlaylistsOfUser(id);
    var playlist = new Playlist(name, url);
    if (playlists.find(p => p.name === name)) {
        clog.warn(`La playlist ${name} existe déjà pour l'utilisateur ${id}`);
        return;
    }
    if(url) {
        await Finder.search(url).then(async (playlistFounded) => {
            if(playlistFounded instanceof Playlist) {
                playlist = playlistFounded;
            }   
            if(playlist.type === "spotify") {
                playlist.songs = await spotify.getTracks(playlist);
            }
        })
    }

    playlists.push(playlist);
    playlistDB.save();
    clog.log(`Ajout de la playlist ${name} pour l'utilisateur ${id}`);
    return playlist;
} 

function removePlaylist(id, name) {
    const playlists = getPlaylistsOfUser(id);
    const index = playlists.findIndex(p => p.name === name);
    if (index === -1) {
        clog.warn(`La playlist ${name} n'existe pas pour l'utilisateur ${id}`);
        return;
    }
    playlists.splice(index, 1);
    playlistDB.save();
    clog.log(`Suppression de la playlist ${name} pour l'utilisateur ${id}`);
}
function getPlaylist(id, name) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) {
        clog.warn(`La playlist ${name} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    return playlist;
}

function copyPlaylist(fromId, toId, name) {
    const playlists = getPlaylistsOfUser(fromId);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) {
        clog.warn(`La playlist ${name} n'existe pas pour l'utilisateur ${fromId}`);
        return null;
    }
    const toPlaylists = getPlaylistsOfUser(toId);
    toPlaylists.push(playlist);
    playlistDB.save();
    clog.log(`Copie de la playlist ${name} de l'utilisateur ${fromId} vers l'utilisateur ${toId}`);

    return newPlaylist;
}

function renamePlaylist(id, oldName, newName) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.name === oldName);
    if (!playlist) {
        clog.warn(`La playlist ${oldName} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    playlist.name = newName;
    playlistDB.save();
    clog.log(`Renommage de la playlist ${oldName} en ${newName} pour l'utilisateur ${id}`);
}

function addSong(id, playlistName, song) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.name === playlistName);
    if (!playlist) {
        clog.warn(`La playlist ${playlistName} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    playlist.songs.push(song);
    playlistDB.save();
    clog.log(`Ajout de la chanson ${song.title} à la playlist ${playlistName} pour l'utilisateur ${id}`);
}

function removeSong(id, playlistName, songId) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.name === playlistName);
    if (!playlist) {
        clog.warn(`La playlist ${playlistName} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    const index = playlist.songs.findIndex(s => s.id === songId);
    if (index === -1) {
        clog.warn(`La chanson ${songId} n'existe pas dans la playlist ${playlistName} pour l'utilisateur ${id}`);
        return null;
    }
    playlist.songs.splice(index, 1);
    playlistDB.save();
    clog.log(`Suppression de la chanson ${songId} de la playlist ${playlistName} pour l'utilisateur ${id}`);
}

module.exports = {
    getPlaylistsOfUser,
    getPlaylistOfUser,
    addPlaylist,
    removePlaylist,
    getPlaylist,
    copyPlaylist,
    renamePlaylist,
    addSong,
    removeSong
}