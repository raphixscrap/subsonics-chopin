const { google } = require('googleapis');
const { LogType } = require('loguix');
const alog = new LogType("YoutubeAPI");

const OAuth2 = require('./OAuth2');
const Users = require('../../server/auth/User');

async function getYoutubePlaylists(userId) {
    const user = Users.getUserById(userId);
    if (!user) {
        alog.error(`User with ID ${userId} not found.`);
        return null;
    }

    const oAuth2Client = OAuth2.getOAuth2Client(userId);
    if (!oAuth2Client) {
        alog.error(`OAuth2 client for user ${userId} not found. Please authenticate first.`);
        return null;
    }

    const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });

    try {
        const response = await youtube.playlists.list({
            part: 'snippet,contentDetails',
            mine: true,
            maxResults: 50
        });
        alog.log(`Retrieved playlists for user ${userId}.`);
        return response.data.items;
    } catch (error) {
        alog.error(`Error retrieving playlists for user ${userId}:`, error);
        return null;
    }
}

function getYoutubePlaylistSongs(playlistId, userId) {
    const user = Users.getUserById(userId);
    if (!user) {
        alog.error(`User with ID ${userId} not found.`);
        return null;
    }

    const oAuth2Client = OAuth2.getOAuth2Client(userId);
    if (!oAuth2Client) {
        alog.error(`OAuth2 client for user ${userId} not found. Please authenticate first.`);
        return null;
    }

    const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });

    return youtube.playlistItems.list({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: 50
    });
}

module.exports = {
    getYoutubePlaylists,
    getYoutubePlaylistSongs
};