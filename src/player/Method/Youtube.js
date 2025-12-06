const { LogType } = require('loguix');
const clog = new LogType("Youtube-Stream");
const { spawn } = require('child_process');

// Variable globale pour stocker le processus actif
let currentYtProcess = null;

/**
 * Tue le processus yt-dlp en cours proprement et attend sa fin réelle.
 * Cela garantit qu'aucun flux ne se chevauche.
 */
function killCurrentProcess() {
    return new Promise((resolve) => {
        if (!currentYtProcess || currentYtProcess.exitCode !== null) {
            currentYtProcess = null;
            return resolve();
        }

        const pid = currentYtProcess.pid;
        clog.log(`[YT-DLP] Nettoyage violent du processus PID: ${pid}`);

        // Détection de l'OS pour utiliser la bonne commande de kill
        const isWindows = process.platform === 'win32';

        if (isWindows) {
            // Sur Windows, taskkill /T (Tree) /F (Force) est nécessaire pour tuer les enfants (ffmpeg)
            try {
                exec(`taskkill /pid ${pid} /T /F`, (err) => {
                    // Peu importe l'erreur (ex: processus déjà mort), on considère que c'est fini
                    currentYtProcess = null;
                    resolve();
                });
            } catch (e) {
                // Fallback si taskkill échoue
                try { currentYtProcess.kill('SIGKILL'); } catch (e2) {}
                currentYtProcess = null;
                resolve();
            }
        } else {
            // Sur Linux/Mac, on tente de tuer le groupe de processus
            try {
                process.kill(-pid, 'SIGKILL'); 
            } catch (e) {
                // Fallback si le group kill échoue
                try { currentYtProcess.kill('SIGKILL'); } catch (e2) {}
            }
            currentYtProcess = null;
            resolve();
        }
    });
}

/**
 * @param {Object} song - L'objet contenant l'URL
 * @param {number} seekTime - Le temps de démarrage en secondes (par défaut 0)
 */
async function getStream(song, seekTime = 0) {
    // ÉTAPE 1 : On s'assure que l'ancien processus est BIEN mort avant de faire quoi que ce soit.
    await killCurrentProcess();

    return new Promise((resolve, reject) => {
        clog.log(`[YT-DLP] Lancement pour : ${song.url} (Début: ${seekTime}s)`);

        const ytArgs = [
            song.url,
            '-o', '-',
            '-f', 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio',
            // NETWORKS
            '--force-ipv4',  // INDISPENSABLE : Force la connexion via IPv4 (plus stable pour le streaming)
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // Masque yt-dlp
            '--no-warnings',
            // --- GESTION DE LA RAM & FICHIERS ---
            '--no-part',           // Ne pas créer de fichiers .part
            '--no-keep-fragments', // Supprimer les fragments immédiatement (s'ils sont créés)
            '--buffer-size', '16K', // Petit buffer pour forcer le flux continu (évite les pics d'écriture)
            // --- OPTIONS DIVERS ---
            '--no-check-certificate',
            '--prefer-free-formats',
            '--ignore-config'
        ];

        // --- GESTION DU TIMECODE (SEEK) ---
        if (seekTime && seekTime > 0) {
            // --begin accepte un format "10s", "1m30s" ou juste des secondes.
            // C'est la méthode la plus fiable pour yt-dlp en streaming.
            clog.log(`[YT-DLP] Positionnement à ${Math.round(seekTime)} secondes.`);
            ytArgs.push('--download-sections', `*${Math.round(seekTime)}-inf`);
        }

        // --- GESTION DES COOKIES ---
        if (typeof __glob !== 'undefined' && __glob.COOKIES) {
            // clog.log(`[YT-DLP] Cookies chargés.`);
            ytArgs.push('--cookies', __glob.COOKIES);
            ytArgs.push('--no-cache-dir');
        }

        // Lancement du nouveau processus
        const yt = spawn('yt-dlp', ytArgs);
        
        // On met à jour la variable globale tout de suite
        currentYtProcess = yt;

        let errorLogs = "";

        yt.stderr.on('data', (data) => {
            const msg = data.toString();
            console.log(msg);
            if (!msg.includes('[download]') && !msg.includes('[youtube]')) {
                errorLogs += msg;
            }
        });

        yt.on('error', (err) => {
            clog.error("[YT-DLP] Erreur au lancement.", err);
            // Si c'est ce processus qui est en cours, on le clean
            if (currentYtProcess === yt) currentYtProcess = null;
            reject(err);
        });

        yt.on('close', (code) => {
            // Nettoyage de la référence globale si c'est bien nous
            if (currentYtProcess === yt) currentYtProcess = null;

            if (code !== 0 && code !== null && code !== 143 && code !== 137) { // 137 = SIGKILL
                clog.warn(`[YT-DLP] Arrêt code ${code}. Logs : ${errorLogs}`);
            }
        });

        if (yt.stdout) {
            // --- SÉCURITÉ ANTI-OVERRIDE SUR LE FLUX ---
            // Si le stream se ferme (le bot quitte le vocal ou skip), on tue yt-dlp
            yt.stdout.on('close', () => {
                if (!yt.killed && currentYtProcess === yt) {
                    yt.kill();
                }
            });
            
            yt.stdout.on('error', () => {
                if (!yt.killed && currentYtProcess === yt) yt.kill();
            });

            resolve(yt.stdout);
        } else {
            reject(new Error("Aucun flux stdout généré."));
        }
    });
}

module.exports = { getStream };