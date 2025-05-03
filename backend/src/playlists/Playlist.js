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
        this.duration = duration;
        this.readduration = readduration;
        this.description = description;
        if(!this.url) {
            this.type = "playlist";
        }
    }
}

module.exports = {Playlist};

