const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const { getReadableDuration } = require('../utils/TimeConverter');
const clog = require("loguix").getInstance("Song")
const path = require('path');
const fs = require('fs');

async function getMediaInformation(instance, media, provider) {
    let tmpFile = null;

    try {
        // 1. Vérifier si ./tmp existe, sinon le créer
        const tmpDir = path.resolve("./tmp");
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // 2. Télécharger le fichier depuis l'URL
        const url = media.attachment.url;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

        const buffer = Buffer.from(await res.arrayBuffer());
        tmpFile = path.join(tmpDir, `${Date.now()}-${media.attachment.name}`);
        fs.writeFileSync(tmpFile, buffer);

        // 3. Lancer ffprobe sur le fichier local
        const info = await ffprobe(tmpFile, { path: ffprobeStatic.path });

        // 4. Récupérer les informations
        if (info.streams?.[0]?.duration_ts) {
            instance.duration = info.streams[0].duration;
            instance.readduration = getReadableDuration(instance.duration);
        }

        instance.thumbnail = info.streams?.[0]?.tags?.thumbnail ??
            "https://radomisol.fr/wp-content/uploads/2016/08/cropped-note-radomisol-musique.png";
        instance.title = info.streams?.[0]?.tags?.title ?? media.attachment.name;
        instance.author = info.streams?.[0]?.tags?.artist ?? instance.author;

        return true;
    } catch (err) {
        clog.error("Impossible de récupérer les informations de la musique : " + media.attachment.name);
        console.error(err);
        return null;
    } finally {
        // 5. Nettoyage : supprimer le fichier temporaire
        if (tmpFile && fs.existsSync(tmpFile)) {
            try {
                fs.unlinkSync(tmpFile);
            } catch (e) {
                console.error("Erreur lors du unlink:", e);
            }
        }
    }
}

async function getMediaInformationFromUrl(instance, url) {
    let tmpFile = null;

    try {
        // 1. Vérifier si ./tmp existe, sinon le créer
        const tmpDir = path.resolve("./tmp");
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // 2. Télécharger le fichier en mémoire et l’écrire en sync
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

        const buffer = Buffer.from(await res.arrayBuffer());
        tmpFile = path.join(tmpDir, `${Date.now()}.mp3`);
        fs.writeFileSync(tmpFile, buffer);

        // 3. Lancer ffprobe sur le fichier local
        const info = await ffprobe(tmpFile, { path: ffprobeStatic.path });

        if (info.streams?.[0]?.duration_ts) {
            instance.duration = info.streams[0].duration;
            instance.readduration = getReadableDuration(instance.duration);
        }

        instance.thumbnail = info.streams?.[0]?.tags?.thumbnail ??
            "https://radomisol.fr/wp-content/uploads/2016/08/cropped-note-radomisol-musique.png";

        instance.title = info.streams?.[0]?.tags?.title ?? "Titre inconnu";
        instance.author = info.streams?.[0]?.tags?.artist ?? "Auteur inconnu";

        return true;
    } catch (err) {
        clog.error("Impossible de récupérer les informations de la musique depuis l'URL : " + url);
        console.error(err);
        return null;
    } finally {
        // 4. Nettoyage : supprimer le fichier temporaire
        if (tmpFile && fs.existsSync(tmpFile)) {
            try {
                fs.unlinkSync(tmpFile);
            } catch (e) {
                console.error("Erreur lors du unlink:", e);
            }
        }
    }
}

module.exports = {getMediaInformation, getMediaInformationFromUrl};