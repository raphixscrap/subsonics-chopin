const { LogType } = require('loguix');
const clog = new LogType("Youtube-Stream");
const { __glob } = require('../../utils/GlobalVars');
const { Innertube, UniversalCache, ClientType } = require('youtubei.js');
const fs = require('fs');
const { ProxyAgent } = require('undici');

async function getStream(song) {
    try {
        // Lire et formater les cookies comme chaîne
        const cookiesArr = JSON.parse(fs.readFileSync(__glob.COOKIES, 'utf-8'));
        const cookieStr = cookiesArr.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

        // Lire et préparer le proxy
        const proxy = JSON.parse(fs.readFileSync(__glob.PROXY, 'utf-8'));
        const proxyAgent = new ProxyAgent(proxy.uri);


        console.log(`Tentative de récupération pour: ${song.title || song.url}`);

        // Création de l'instance Innertube avec les bons paramètres
        const youtube = await Innertube.create({
            cookie: cookieStr,
            player_id: '0004de42',
            user_agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15`,
            client_type: ClientType.WEB,
            retrieve_player: true,
            device_category: 'desktop',
            enable_session_cache: true,
            generate_session_locally: true,
            // fetch: (url, options) => fetch(url, { ...options, agent: proxyAgent })
        });

        // Récupérer les infos vidéo
        const videoInfo = await youtube.getInfo(song.id);


        if (!videoInfo) {
            throw new Error('Impossible de récupérer les informations de la vidéo');
        }
        console.log('Informations vidéo récupérées:', videoInfo.basic_info?.title);

        // Vérifier la disponibilité de la lecture
        if (videoInfo.playability_status?.status !== 'OK') {
            console.log('Statut de lecture:', videoInfo.playability_status?.status);
            console.log('Raison:', videoInfo.playability_status?.reason);
        }

        // Recherche des formats audio adaptatifs
        let audioFormats = videoInfo.streaming_data?.adaptive_formats?.filter(
            format => format.mime_type?.includes('audio')
        ) || [];

        if (audioFormats.length === 0) {
            // Si pas de formats adaptatifs, chercher dans les formats classiques
            const basicFormats = videoInfo.streaming_data?.formats?.filter(
                format => format.mime_type?.includes('audio')
            ) || [];
            if (basicFormats.length === 0) {
                throw new Error('Aucun format audio trouvé');
            }
            audioFormats.push(...basicFormats);
        }

        // Sélection du format audio de meilleure qualité
        const bestAudio = audioFormats.reduce((prev, current) =>
            (prev.bitrate || 0) > (current.bitrate || 0) ? prev : current
        );

        console.log('Format sélectionné:', bestAudio.mime_type, bestAudio.bitrate);

        // Télécharger le stream audio
        const stream = await videoInfo.download(bestAudio.itag, {
            // fetch via ton proxy si nécessaire
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
                'Cookie': cookieStr
            }
          
        });

        console.log(stream)

        return stream; // c’est un ReadableStream prêt à être pipé
    } catch (e) {
        clog.error("Erreur lors de la récupération du stream : " + (song.title || song.url));
        clog.error('Détails:', e.message);
    }
}

module.exports = { getStream };
