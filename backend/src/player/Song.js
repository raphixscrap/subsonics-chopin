const {LogType} = require('loguix')
const { createAudioResource, StreamType } = require('@discordjs/voice');


const clog = new LogType("Song")
const MediaInformation = require('../media/MediaInformation')

class Song {
    title = "Aucun titre";
    filename = "Aucun fichier";
    author = "Auteur inconnu"
    url;
    thumbnail = "https://radomisol.fr/wp-content/uploads/2016/08/cropped-note-radomisol-musique.png" ;
    duration;
    readduration;
    type;

    constructor(properties) {
        if(properties) {
            this.title = properties.title ?? this.title
            this.filename = properties.filename ?? this.filename
            this.author = properties.author ?? this.author
            this.url = properties.url ?? this.url
            this.thumbnail = properties.thumbnail ?? this.thumbnail
            this.duration = properties.duration ?? this.duration
            this.readduration = properties.readduration ?? this.readduration
            this.type = properties.type ?? this.type
        }
    }

    async processMedia(media, provider) {
        if(provider) this.author = provider
        // Check if media is a file or a link
        if(media.attachment) {
            this.url = media.attachment.url
            this.filename = media.attachment.name
            this.type = "attachment"
        
            // In face, duration is null, get the metadata of the file to get the duration
            await MediaInformation.getMediaInformation(this, media)

        } else {
            clog.error("Impossible de traiter le média")
        }
        
    }

    async getResource() {
        
        const resource = createAudioResource(this.url, {
            inputType: StreamType.Arbitrary
        })
        return resource

     
    }



    
}

module.exports = {Song}
