const { LogType } = require('loguix');
const alog = new LogType("GoogleOAuth2");
const { google } = require('googleapis');
const config = require("../../utils/Database/Configuration");
const Users = require('../../server/auth/User');

const clientId = config.getYoutubeApiClientId();
const clientSecret = config.getYoutubeApiClientSecret();
const redirectUri = config.getWebsiteLink() + "/oauth2callback";


const oAuth2Map = new Map();
 
function createAuthUrl(userId) {
    if(!checkCredientials()) return null;
    var oAuth2Client;
    const user = Users.getUserById(userId);
    if (!user) {
       alog.error(`User with ID ${userId} not found.`);
       return null;
    }
    if (!clientId || !clientSecret) {
        alog.error("YouTube API client ID or secret is not set in the configuration.");
    } else {
        oAuth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        alog.log("Google OAuth2 client initialized successfully.");
    }

    if (!oAuth2Client) {
        alog.error("OAuth2 client is not initialized. Please check your configuration.");
        return null;
    }
    oAuth2Map.set(userId, oAuth2Client);
    alog.log(`OAuth2 client created for user ${userId}.`);
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
}

async function getAuthorization(userId, code) {
      if(!checkCredientials()) return null;
    try {
        const user = Users.getUserById(userId);
        if (!user) {
        alog.error(`User with ID ${userId} not found.`);
        return null;
        }
        oAuth2Client = oAuth2Map.get(userId);
        if (!oAuth2Client) {
            alog.error(`OAuth2 client for user ${userId} not found. Please create an OAuth2 client first.`);
            return null;
        }
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        alog.log(`OAuth2 client credentials set for user ${userId}.`);
        return oAuth2Client;
    } catch (error) {
        alog.error(`Error during OAuth2 authorization for user ${userId}:`, error);
        return null;
    }
    

}

function checkCredientials() {
    if (!clientId || !clientSecret) {
        alog.error("YouTube API client ID or secret is not set in the configuration.");
        return false;
    }
    return true;
}   

module.exports = {
    createAuthUrl,
    getAuthorization,
    getOAuth2Client: (userId) => oAuth2Map.get(userId),
    oAuth2Map
};

const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

