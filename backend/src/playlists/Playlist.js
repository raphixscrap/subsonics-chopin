const { getReadableDuration } = require("../utils/TimeConverter");

class Playlist {
    title = "Aucun titre";
    id;
    url;
    author = "Auteur inconnu";
    authorId;
    songs = new Array();
    thumbnail = "https://radomisol.fr/wp-content/uploads/2016/08/cropped-note-radomisol-musique.png" ;
    duration = 0;
    readduration;
    description;
    type;
    constructor(title, url, author, authorId, songs, thumbnail, duration, readduration, description) {
        this.title = title;
        this.url = url;
        this.author = author;
        this.authorId = authorId;
        this.songs = songs || new Array();
        this.thumbnail = thumbnail;
        // Make the some of durations of the songs
        if(this.songs.length > 0) {
            this.duration = this.songs.reduce((acc, song) => acc + song.duration, 0);
            this.readduration = getReadableDuration(this.duration);
        }
        this.description = description;
        if(!this.url) {
            this.type = "playlist";
        }
    }
}

module.exports = {Playlist};

