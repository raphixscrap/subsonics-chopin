const { LogType } = require('loguix');  
const dlog = new LogType("DiscordAuth");
const { getWebsiteLink, getClientSecret } = require('../../utils/Database/Configuration');


async function getDiscordUser(sessionId, auth_code) {
    
    return new Promise((resolve, reject) => {
    const discordBot = require("../../discord/Bot")
    const discordBotClient = discordBot.getClient()
    dlog.step.init("discord_auth_" + sessionId, "Authentification Discord de la session :" + sessionId);

    dlog.log("Récupération de l'autorisation de récupération des informations de l'utilisateur Discord associé à la session : " + sessionId);

    const params = new URLSearchParams();
    params.append("client_id", discordBotClient.user.id);
    params.append("client_secret", getClientSecret());
    params.append("grant_type", "authorization_code");
    params.append("code", auth_code);
    params.append("redirect_uri", getWebsiteLink() + "/redirect");
    params.append("scope", "identify guilds");

    fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    }).then(accessTokenResp => accessTokenResp.json()).then(accessToken => {
        if (accessToken.error) {
            dlog.step.error("discord_auth_" + sessionId, "Erreur lors de la récupération du token d'accès Discord associé à la session : " + sessionId + " : " + accessToken.error + " : " + accessToken.error_description);
            resolve("ACCESS_TOKEN_ERROR");
            return;
        }


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
               resolve(userData);
            }).catch(err => {
                dlog.step.error("discord_auth_" + sessionId, "Erreur lors de la récupération des guildes de l'utilisateur Discord" + " avec le nom d'utilisateur : " + user.username + " (" + user.id + ")" + " associé à la session : " + sessionId + " : " + err);
                resolve("GUILDS_ERROR");
            });

        }).catch(err => {
            dlog.step.error("discord_auth_" + sessionId, "Erreur lors de la récupération des informations de l'utilisateur Discord associé à la session : " + sessionId + " : " + err);
            resolve( "USER_INFO_ERROR");
        })

    }).catch(err => {
        dlog.step.error("discord_auth_" + sessionId, "Erreur lors de la récupération du token d'accès Discord associé à la session : " + sessionId + " : " + err);
        resolve("ACCESS_TOKEN_ERROR");
    })
    })
}

function refreshToken(refresh_token) {
    return new Promise((resolve, reject) => {
        const discordBot = require("../../discord/Bot")
        const params = new URLSearchParams();
        params.append("client_id", discordBot.getClient().user.id);
        params.append("client_secret", getClientSecret());
        params.append("grant_type", "refresh_token");
        params.append("refresh_token", refresh_token);
        params.append("scope", "identify guilds");

        fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        }).then(accessTokenResp => accessTokenResp.json()).then(accessToken => {
            if (accessToken.error) {
                dlog.error("Erreur lors de la récupération du token d'accès Discord : " + accessToken.error + " : " + accessToken.error_description);
                resolve(null);
                return;
            }
            resolve(accessToken);
        }).catch(err => {
            dlog.error("Erreur lors de la récupération du token d'accès Discord : " + err);
            resolve(null);
        })
    })
}


function getUserIdentity(accessToken) {
    return new Promise((resolve, reject) => {
        fetch("https://discord.com/api/users/@me", {
            headers: {
                authorization: `${accessToken.token_type} ${accessToken.access_token}`,
            },
        }).then(userResp => userResp.json()).then(user => {
            if (user.error) {
                dlog.error("Erreur lors de la récupération des informations de l'utilisateur Discord : " + user.error + " : " + user.error_description);
                resolve(null);
                return;
            }
            resolve(user);
        }).catch(err => {
            dlog.error("Erreur lors de la récupération des informations de l'utilisateur Discord : " + err);
            resolve(null);
        })
    })
}
module.exports = {getDiscordUser, refreshToken, getUserIdentity}