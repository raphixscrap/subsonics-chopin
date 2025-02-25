const {LogType} = require('loguix')
const { createAudioResource, StreamType } = require('@discordjs/voice');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const { getReadableDuration } = require('../utils/TimeConverter');

const clog = new LogType("Song")

class Song {
    title = "Aucun titre";
    author = "Auteur inconnu"
    url;
    thumbnail;
    duration;
    readduration;
    type;

    async processMedia(media, provider) {
        if(provider) this.author = provider
        // Check if media is a file or a link
        if(media.attachment) {
            this.url = media.attachment.url
            this.type = "attachment"
        
            // In face, duration is null, get the metadata of the file to get the duration
            await getMediaInformation(this, media)

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

async function getMediaInformation(instance, media, provider) {
    try {
        const info = await ffprobe(media.attachment.url, { path: ffprobeStatic.path });
        if (info.streams?.[0]?.duration_ts) {
            instance.duration = info.streams[0].duration;
            instance.readduration = getReadableDuration(instance.duration)
        } 
        
        // Vérification pour éviter une erreur si `streams[0]` ou `tags` n'existe pas
        instance.thumbnail = info.streams?.[0]?.tags?.thumbnail ?? 
            "https://radomisol.fr/wp-content/uploads/2016/08/cropped-note-radomisol-musique.png";
        
        // Obtenir le titre (sinon utiliser le nom du fichier)
        instance.title = info.streams?.[0]?.tags?.title ?? media.attachment.name;
        
        // Obtenir l'auteur (s'il existe)
        instance.author = info.streams?.[0]?.tags?.artist ?? instance.author;
        

      
        
    } catch (err) {
        clog.error("Impossible de récupérer les informations de la musique : " + this.name)
        clog.error(err)
        return null;
    }
}