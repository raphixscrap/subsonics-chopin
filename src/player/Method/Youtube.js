const { LogType } = require('loguix');
const clog = new LogType("Youtube-Stream");
const { spawn } = require('child_process');

async function getStream(song) {
    return new Promise((resolve, reject) => {
        clog.log(`[YT-DLP] Lancement du processus natif pour : ${song.url}`);

        // On lance yt-dlp directement.
        // ATTENTION : "yt-dlp" doit être reconnu dans ton terminal (installé dans le PATH)
        const yt = spawn('yt-dlp', [
            song.url,
            '-o', '-',              // Rediriger le son vers la sortie standard (stdout)
            '-f', 'bestaudio',      // Meilleure qualité audio
            '--no-warnings',        // Masquer les avertissements
            '--no-check-certificate', // Évite les erreurs SSL courantes
            '--prefer-free-formats' // Préférer Opus/WebM (meilleur pour Discord)
        ]);

        let errorLogs = "";

        // Capture des erreurs du processus (si yt-dlp râle)
        yt.stderr.on('data', (data) => {
            // On ignore les infos de progression [download]
            const msg = data.toString();
            if (!msg.includes('[download]')) {
                errorLogs += msg;
            }
        });

        // Gestion des erreurs de lancement (ex: yt-dlp n'est pas installé)
        yt.on('error', (err) => {
            clog.error("[YT-DLP] Impossible de lancer la commande. Vérifie que yt-dlp est bien installé sur le PC/Serveur !", err);
            reject(err);
        });

        // Fin du processus
        yt.on('close', (code) => {
            if (code !== 0) {
                clog.warn(`[YT-DLP] Arrêt avec code ${code}. Détails : ${errorLogs}`);
            }
        });

        // Si le flux est créé, on le renvoie immédiatement
        if (yt.stdout) {
            clog.log("[YT-DLP] Flux audio capturé avec succès.");
            resolve(yt.stdout);
        } else {
            reject(new Error("Le processus yt-dlp n'a généré aucun flux."));
        }
    });
}

module.exports = { getStream };