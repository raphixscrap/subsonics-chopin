const config = require('../utils/Database/Configuration');
const YOUTUBE_API_KEY = config.getYoutubeApiKey()

async function getDurationVideo(videoId) {
    const clog = require("loguix").getInstance("YoutubeInformation");
    // Check videoId if valid 
    if(videoId === null && typeof videoId !== 'string') {
        clog.error("Impossible de récupérer la durée de la vidéo YouTube, car l'identifiant est nul ou n'est pas une chaîne de caractères");
        return null;
    }

    // Fetch video information
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        const video = data.items[0];
        if(video) {
     
            if(video.contentDetails.duration == "P0D") return "LIVE";
            const duration = video.contentDetails.duration;
            //Convert ISO 8601 duration to seconds
            return parseDuration(duration);


        } else {
            clog.error("Impossible de récupérer la durée de la vidéo YouTube à partir de l'identifiant");
            return null;
        }
    } catch (error) {
        clog.error('Erreur lors de la recherche de la durée de la vidéo YouTube:', error);
        return null;
    }


}

function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

module.exports = {getDurationVideo}