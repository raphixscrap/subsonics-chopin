const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const { getReadableDuration } = require('../utils/TimeConverter');
const clog = require("loguix").getInstance("Song")


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
        clog.error("Impossible de récupérer les informations de la musique : " + media.attachment.name)
        clog.error(err)
        return null;
    }
}

async function getMediaInformationFromUrl(instance, url) {
    try {
        const info = await ffprobe(url, { path: ffprobeStatic.path });
        if (info.streams?.[0]?.duration_ts) {
            instance.duration = info.streams[0].duration;
            instance.readduration = getReadableDuration(instance.duration);
        } 
        
        // Vérification pour éviter une erreur si `streams[0]` ou `tags` n'existe pas
        instance.thumbnail = info.streams?.[0]?.tags?.thumbnail ?? 
            "https://radomisol.fr/wp-content/uploads/2016/08/cropped-note-radomisol-musique.png";
        
        // Obtenir le titre (sinon utiliser le nom du fichier)
        instance.title = info.streams?.[0]?.tags?.title ?? "Titre inconnu";
        
        // Obtenir l'auteur (s'il existe)
        instance.author = info.streams?.[0]?.tags?.artist ?? "Auteur inconnu";

    } catch (err) {
        clog.error("Impossible de récupérer les informations de la musique depuis l'URL : " + url);
        console.log(err)
        clog.error(err);
        return null;
    }
}

module.exports = {getMediaInformation, getMediaInformationFromUrl};