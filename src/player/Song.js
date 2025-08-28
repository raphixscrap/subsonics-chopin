const {LogType} = require('loguix')

const clog = new LogType("Song")
const MediaInformation = require('../media/MediaInformation')
const { getReadableDuration, getSecondsDuration } = require('../utils/TimeConverter');

class Song {
    title = "Aucun titre";
    id = "Aucun fichier";
    author = "Auteur inconnu"
    authorId;
    url;
    thumbnail = "https://radomisol.fr/wp-content/uploads/2016/08/cropped-note-radomisol-musique.png" ;
    duration;
    readduration;
    form = "SONG"; 
    type;
    userAddedId; 

    constructor(properties) {
        if(properties) {
            this.type = properties.type ?? this.type
            this.title = properties.title ?? this.title
            this.id = properties.id ?? this.id
            this.author = properties.author ?? this.author
            this.url = properties.url ?? this.url
            this.thumbnail = properties.thumbnail ?? this.thumbnail
            this.duration = properties.duration ?? this.duration
            this.readduration = properties.readduration ?? this.readduration
            this.type = properties.type ?? this.type
            this.authorId = properties.authorId ?? this.authorId
            
        }
    }

    async processMedia(media, provider) {
        if(provider) this.author = provider;
        if(provider) this.authorId = provider;
        // Check if media is a file or a link
        if(media.attachment) {
            this.url = media.attachment.url
            this.id = media.attachment.name
            this.type = "attachment"
        
            // In face, duration is null, get the metadata of the file to get the duration
            await MediaInformation.getMediaInformation(this, media)

        } else {
            clog.error("Impossible de traiter le média")
        }
        
    }

    async processYoutubeVideo(video) {
        this.title = video.title
        this.author = video.author.name
        this.authorId = video.author.url
        this.thumbnail = video.thumbnail
        this.url = "https://www.youtube.com/watch?v=" + video.videoId
        this.type = "youtube"
        this.id = video.videoId

        this.duration = video.duration.seconds
        this.readduration = getReadableDuration(this.duration)
        return this
    } 
    
}

module.exports = {Song}
