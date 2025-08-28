const {Database} = require('../utils/Database/Database');
const {__glob} = require('../utils/GlobalVars');

const {Playlist} = require('./Playlist');
const {LogType} = require('loguix');
const clog = new LogType("PlaylistManager");
const Finder = require('../player/Finder');
const spotify = require('../media/SpotifyInformation');
const { getYoutubePlaylistSongs } = require('./Google/YoutubeList');
const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');
const { getReadableDuration } = require('../utils/TimeConverter');
const { getSecondsFromUrl } = require('../media/YoutubeInformation');

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
        playlistDB.data[id] = new Array();
        clog.log(`Création d'une clé pour l'utilisateur : ${id}`);
        playlistDB.save();
        return playlistDB.data[id];
    }
    
}

/**
 * @param {string} id 
 * @param {string} playlistId 
 * @returns {Playlist}
 */
function getPlaylistOfUser(id, playlistId) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.playlistId === playlistId);
    if (!playlist) {
        clog.warn(`La playlist ${playlistId} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    return playlist;
}

async function addPlaylist(id, name, url, authorName, authorId, authorAvatar) {
    const playlists = getPlaylistsOfUser(id);
    var playlist = new Playlist(name, url);
    let failed = false;
    playlist.thumbnail = null
    playlist.author = authorName;
    playlist.authorAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${authorAvatar}`;
    playlist.views = null;

    if(url) {
        await Finder.search(url, false, "PLAYLIST").then(async (playlistFounded) => {
            if(!playlistFounded) {
                failed = true;
            }
            if(playlistFounded instanceof Playlist) {
                playlist = playlistFounded;
            }   
            if(playlist.type === "spotify") {
                playlist.songs = await spotify.getTracks(playlist);
            }
        })
    }
    playlist.playlistId = new String(Date.now());
    if(failed) {
        clog.error(`Impossible de trouver la playlist ${name} pour l'utilisateur ${id}`);
        return null;
    }

    playlists.push(playlist);
    playlistDB.save();
    clog.log(`Ajout de la playlist ${name} pour l'utilisateur ${id}`);
    return playlist;
} 

function removePlaylist(id, playlistId) {
    const playlists = getPlaylistsOfUser(id);
    const index = playlists.findIndex(p => p.playlistId === playlistId);
    if (index === -1) {
        clog.warn(`La playlist ${playlistId} n'existe pas pour l'utilisateur ${id}`);
        return;
    }
    playlists.splice(index, 1);
    playlistDB.save();
    clog.log(`Suppression de la playlist ${playlistId} pour l'utilisateur ${id}`);
}
function getPlaylist(id, playlistId) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.playlistId === playlistId);
    if (!playlist) {
        clog.warn(`La playlist ${playlistId} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    return playlist;
}

function copyPlaylist(fromId, toId, playlistId) {
    const playlists = getPlaylistsOfUser(fromId);
    const playlist = playlists.find(p => p.playlistId === playlistId);
    if (!playlist) {
        clog.warn(`La playlist ${playlistId} n'existe pas pour l'utilisateur ${fromId}`);
        return null;
    }
    const toPlaylists = getPlaylistsOfUser(toId);
    // Check if the playlist already exists in the target user
    if (toPlaylists.find(p => p.title === playlist.title)) {
        clog.warn(`La playlist ${playlist.title} existe déjà pour l'utilisateur ${toId}`);
        return null;
    }
    toPlaylists.push(playlist);
    playlistDB.save();
    clog.log(`Copie de la playlist ${playlist.title} de l'utilisateur ${fromId} vers l'utilisateur ${toId}`);

    return false;
}

function renamePlaylist(id, playlistId, newName) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.playlistId === playlistId);
    if (!playlist) {
        clog.warn(`La playlist ${playlistId} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    playlist.title = newName;
    playlistDB.save();
    clog.log(`Renommage de la playlist ${playlistId} en ${newName} pour l'utilisateur ${id}`);
}

function addSong(id, playlistId, song) {
    if(typeof song === "string") {
        try {
            song = JSON.parse(song)
        } catch (e) {
            clog.error(`La chanson ${song} n'est pas valide`);
            return null;
        }
    }
    // Check if the song is a valid object
    if (typeof song !== 'object' || !song) {
        clog.error(`La chanson ${song} n'est pas valide`);
        return null;
    }
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.playlistId === playlistId);
    if (!playlist) {
        clog.warn(`La playlist ${playlistId} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    // Check the integrity of the song
    if (!song.id || !song.title || !song.url) {
        clog.error(`La chanson ${song.title} n'est pas valide`);
        return null;
    }
    playlist.songs.push(song);
    // Recalculate the songs duration and readduration
    playlist.duration += song.duration;
    playlist.readduration = getReadableDuration(playlist.duration);
    playlistDB.save();
    clog.log(`Ajout de la chanson ${song.title} à la playlist ${playlistId} pour l'utilisateur ${id}`);
}

function removeSong(id, playlistId, songId) {
    const playlists = getPlaylistsOfUser(id);
    const playlist = playlists.find(p => p.playlistId === playlistId);
    if (!playlist) {
        clog.warn(`La playlist ${playlistId} n'existe pas pour l'utilisateur ${id}`);
        return null;
    }
    const index = playlist.songs.findIndex(s => s.id === songId);
    if (index === -1) {
        clog.warn(`La chanson ${songId} n'existe pas dans la playlist ${playlistId} pour l'utilisateur ${id}`);
        return null;
    }

    playlist.duration -= playlist.songs[index].duration;
    playlist.songs.splice(index, 1);
    playlist.readduration = getReadableDuration(playlist.duration);
    playlistDB.save();
    clog.log(`Suppression de la chanson ${songId} de la playlist ${playlistId} pour l'utilisateur ${id}`);
}

async function processYoutubeData(userId, data) {
    if (!data || data.length === 0) {
        clog.warn(`Aucune donnée YouTube trouvée pour l'utilisateur ${userId}`);
        return [];
    }

    const playlists = [];
     for (const item of data) {
        if (item.snippet && item.contentDetails) {
            const playlist = new Playlist();
            playlist.id = item.id;
            playlist.title = item.snippet.title;
            playlist.url = `https://www.youtube.com/playlist?list=${item.id}`;
            playlist.description = item.snippet.description || "Aucune description disponible";
            playlist.author = item.snippet.channelTitle;
            playlist.thumbnail = item.snippet.thumbnails.default.url;
            playlist.authorId = `https://www.youtube.com/channel/${item.snippet.channelId}`;
            playlist.songs = []; // You can fetch songs later if needed
            await getYoutubePlaylistSongs(item.id, userId).then(songsData => {
                if (songsData && songsData.data && songsData.data.items) {
                    playlist.songs = songsData.data.items.map(song => ({
                        id: song.snippet.resourceId.videoId,
                        title: song.snippet.title,
                        author: song.snippet.videoOwnerChannelTitle,
                        authorId: `https://www.youtube.com/channel/${song.snippet.videoOwnerChannelId}`,
                        url: `https://www.youtube.com/watch?v=${song.snippet.resourceId.videoId}`,
                        thumbnail: song.snippet?.thumbnails?.default?.url || "https://radomisol.fr/wp-content/uploads/2016/08/cropped-note-radomisol-musique.png",
                    }));
                    // Add readduration for every items in songs

                } else {
                    clog.warn(`Aucune chanson trouvée pour la playlist ${item.id}`);
                }
            }).catch(err => {
                clog.error(`Erreur lors de la récupération des chansons pour la playlist ${item.id}:`, err);
            });
            for (const song of playlist.songs) {
                // If authorId is not defined, delete the song
                if (song.authorId == "https://www.youtube.com/channel/undefined") {
                    clog.warn(`L'auteur de la chanson ${song.title} (${song.id}) n'est pas défini. Suppression de la chanson.`);
                    playlist.songs.splice(playlist.songs.indexOf(song), 1);
                    continue; // Skip this song
                }
                song.duration = await getSecondsFromUrl(song.url);
                if (song.duration === null) {
                    clog.warn(`Impossible de récupérer la durée de la chanson ${song.title} (${song.id})`);
                    song.duration = 0; // Set to 0 if duration cannot be fetched
                } else {
                    song.readduration = getReadableDuration(song.duration);
                    playlist.duration += song.duration; // Initialize duration if not set
                }
                
            }
          
            playlist.readduration = getReadableDuration(playlist.duration);
            playlist.type = "youtube";
            playlists.push(playlist);
        } else {
            clog.warn(`Données YouTube manquantes pour l'élément ${item.id}`);
        }
    };

    clog.log(`Traitement des données YouTube pour l'utilisateur ${userId} terminé. Nombre de playlists trouvées : ${playlists.length}`);
    // Save the playlists to the user's playlist collection
    const userPlaylists = getPlaylistsOfUser(userId);
    // Remove existing playlists with the same IDs to avoid duplicates
    for (const playlist of playlists) {
        const existingIndex = userPlaylists.findIndex(p => p.id === playlist.id);
        if (existingIndex !== -1) {
            userPlaylists.splice(existingIndex, 1); // Remove existing playlist with the same ID
        }
    }
    userPlaylists.push(...playlists);
    playlistDB.save();
    clog.log(`Playlists ajoutées pour l'utilisateur ${userId}. Nombre total de playlists : ${userPlaylists.length}`);
    return playlists;
}

async function deleteUserPlaylists(userId) {
    // Delete all playlists of the user and the keys
    if (!playlistDB.data[userId]) {
        clog.warn(`Aucune playlist trouvée pour l'utilisateur ${userId}`);
        return;
    }
    delete playlistDB.data[userId];
    playlistDB.save();
}

async function refreshPlaylist(userId, playlistId) {
    var playlist = getPlaylistOfUser(userId, playlistId);
    if (!playlist) {
        clog.warn(`Aucune playlist trouvée pour l'utilisateur ${userId} avec l'ID ${playlistId}`);
        return null;
    }
    let failed = false;
    // If playlistHasUrl, refresh the playlist
    if (playlist.url) {
        await Finder.search(playlist.url, false, "PLAYLIST").then(async (playlistFounded) => {
            if(!playlistFounded) {
                failed = true;
            }
            if(playlistFounded instanceof Playlist) {
                playlist = playlistFounded;
            }   
            if(playlist.type === "spotify") {
                playlist.songs = await spotify.getTracks(playlist);
            }
        })
    }

    

    if(failed) {
        clog.warn(`Échec de la mise à jour de la playlist ${playlistId} pour l'utilisateur ${userId}`);
        return null;
    }

    playlist.playlistId = playlistId;
    const playlists = getPlaylistsOfUser(userId);
    // Remove the older one
    // Push at the same index
    const existingIndex = playlists.findIndex(p => p.playlistId === playlistId);
    playlists.splice(existingIndex, 1, playlist);
    playlistDB.save();
    return playlist;
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
    removeSong,
    processYoutubeData,
    deleteUserPlaylists,
    refreshPlaylist
}