const {LogType} = require("loguix")
const {Song} = require("./Song")
const slog = new LogType("SongCheck")

function checkSong(song) {
    if(!(song instanceof Song)) {
        slog.error("La musique n'est pas une instance de la classe Song")
        // Check if the song is valid and if it has all the required properties
        if(song.title && song.id && song.author && song.url && song.duration && song.readduration && song.type) {
            slog.log("Acceptation de la musique : " + song.title)
            return true
        } else {
            slog.error("La musique n'est pas valide")
            return false
        }
    }
    if(!song.url) {
        slog.error("La musique n'a pas d'url")
        return false
    }
    if(!song.title) {
        slog.error("La musique n'a pas de titre")
        return false
    }
    if(!song.author) {
        slog.error("La musique n'a pas d'auteur")
        return false
    }
    if(song.duration == null) {
        slog.error("La musique n'a pas de durée")
        return false
    }
    if(song.readduration == null) {
        slog.error("La musique n'a pas de durée lisible")
        return false
    }
    if(!song.type) {
        slog.error("La musique n'a pas de type")
        return false
    }
    return true
}

module.exports = {checkSong}