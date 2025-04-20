const { LogType } = require('loguix');  
const dlog = new LogType("DiscordAuth");
const { getPort, getToken, getWebsiteLink, getClientSecret } = require('../../utils/Database/Configuration');
const discordBot = require("../../discord/Bot")


async function getDiscordUser(sessionId, auth_code) {
    const discordBotClient = discordBot.getClient()
    dlog.step.init("discord_auth_" + sessionId, "Authentification Discord de la session :" + sessionId);

    dlog.log("Récupération de l'autorisation de récupération des informations de l'utilisateur Discord associé à la session : " + sessionId);

    const params = new URLSearchParams();
    params.append("client_id", discordBotClient.user.id);
    params.append("client_secret", getClientSecret());
    params.append("grant_type", "authorization_code");
    params.append("code", auth_code);
    params.append("redirect_uri", getWebsiteLink() + "/callback");
    params.append("scope", "identify guilds");

    fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    }).then(accessTokenResp => accessTokenResp.json()).then(accessToken => {
        dlog.log("Récupération réussi du token d'accès Discord associé à la session : " + sessionId);

        fetch("https://discord.com/api/users/@me", {
            headers: {
                authorization: `${accessToken.token_type} ${accessToken.access_token}`,
            },
        }).then(userResp => userResp.json()).then(user => {
            dlog.log("Récupération réussi des informations de l'utilisateur Discord associé à la session : " + sessionId + " avec le nom d'utilisateur : " + user.username + " (" + user.id + ")");
            // Get the guilds of the user
            fetch("https://discord.com/api/users/@me/guilds", {
                headers: {
                    authorization: `${accessToken.token_type} ${accessToken.access_token}`,
                },
            }).then(guildsResp => guildsResp.json()).then(guilds => {
                dlog.log("Récupération réussi des guildes de l'utilisateur Discord associé à la session : " + sessionId + " avec le nom d'utilisateur : " + user.username + " (" + user.id + ")");
                dlog.step.end("discord_auth_" + sessionId)
                const userData = {
                    auth: accessToken,
                    identity: user,
                    guilds: guilds,
                }
                return userData;
            }).catch(err => {
                dlog.step.error("discord_auth_" + sessionId, "Erreur lors de la récupération des guildes de l'utilisateur Discord" + " avec le nom d'utilisateur : " + user.username + " (" + user.id + ")" + " associé à la session : " + sessionId + " : " + err);
                return "GUILDS_ERROR";
            });

        }).catch(err => {
            dlog.step.error("discord_auth_" + sessionId, "Erreur lors de la récupération des informations de l'utilisateur Discord associé à la session : " + sessionId + " : " + err);
            return "USER_INFO_ERROR";
        })

    }).catch(err => {
        dlog.step.error("discord_auth_" + sessionId, "Erreur lors de la récupération du token d'accès Discord associé à la session : " + sessionId + " : " + err);
        return "ACCESS_TOKEN_ERROR";
    })

}

module.exports = {getDiscordUser}