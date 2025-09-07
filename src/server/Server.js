const {LogType} = require('loguix') 
const wlog = new LogType("Server")
const metrics = require("webmetrik")

const fs = require("fs")
const path = require("path")
const {Server} = require('socket.io')
const {createServer} = require('http')
const session = require("../server/auth/Session")
const users = require("../server/auth/User")
const players = require("../player/Player")
const {Player} = require("../player/Player")
const discordBot = require("../discord/Bot")
const discordAuth = require("../server/auth/DiscordAuth")
const {Report} = require("../discord/ReportSender")
const Finder = require("../player/Finder")

const {__glob} = require("../utils/GlobalVars")
const playlists = require("../playlists/PlaylistManager")
const history = require("../playlists/History")
const lyrics = require("../lyrics/Lyrics")
const serverSettings = require("../discord/ServerSettings")
const mediaBase = require("../discord/MediaBase")
const googleApis = require("../playlists/Google/OAuth2")
const youtubeApi = require("../playlists/Google/YoutubeList")

const configuration = require("../utils/Database/Configuration")
const { List } = require('../player/List')
const { restart } = require('../utils/Maintenance')
const { isAudioFile } = require('../utils/AudioBufferCheck')
const { Song } = require('../player/Song')
const { getMediaInformationFromUrl } = require('../media/MediaInformation')

const allConnectedUsers = new Array()
const guildConnectedUsers = new Map()
const UsersBySocket = new Map()

function init() {
    
    wlog.step.init("server_init", "Initialisation du serveur Socket.IO")

    const httpServer = createServer()   
    const io = new Server(httpServer, {
        cors: {
            origin: "*"
        },
        maxHttpBufferSize: 300 * 1024 * 1024
    })
    

    process.on("PLAYERS_UPDATE", () => {
        if(io) {
            io.sockets.emit("/GUILD/UPDATE")
            // Get all players and send them to client subscribed to the guild
            for(var guild of discordBot.getGuilds().keys()) {
                const player = players.getPlayer(guild)
                if(player) {
                    io.to(player.guildId).emit("/PLAYER/UPDATE", player.getState())
                    wlog.log("Envoi de l'état du player de la guilde : " + player.guildId + " à tous les utilisateurs connectés")
                }
            }
        }
    })

    process.on("USERS_UPDATE", async () => {
        if(io) {
            // Get all players and send them to client subscribed to the guild
            for(var guild of discordBot.getGuilds().keys()) {
               if(guildConnectedUsers.has(guild)) {
                    io.to(guild).emit("/USERS/UPDATE", {"id": guild, "members": guildConnectedUsers.get(guild)} )
                    io.to("ADMIN").emit("ALL_USERS_UPDATE", allConnectedUsers)  
                    wlog.log("Envoi de la liste des utilisateurs connectés (" + guildConnectedUsers.get(guild).length +") à la guilde : " + guild + " à tous les utilisateurs connectés")
                }
            }
            io.sockets.emit("/USER/READY")
        }
    })

    process.on("VOCAL_UPDATE", async () => {
        if(io) {
            io.sockets.emit("/CHANNEL/UPDATE")
        }
    })

    io.on("connection", async (socket) => {
        var socketUser;

        // Make sure Discord Bot is loaded and make an interruption until it is loaded
        while(!await discordBot.isReady()) {
            wlog.warn("Attente de traitement : "+ socket.id + " : Le bot Discord n'est pas encore chargé, attente de 0.5 seconde... (Avoid Rate Limit)")
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        wlog.log(`Connexion d'un client : ${socket.id}`)

        socket.on("disconnect", (info) => {
            handleDisconnect()
            wlog.log("Déconnexion du client : " + socket.id + " - Raison : " + info)
        })

        socket.on("error", (error) => {
            handleDisconnect()
            wlog.error("Erreur sur le socket : " + socket.id + " - " + error)
        })
       
        if(socket.handshake.auth == undefined || socket.handshake.auth == {}) {
            wlog.warn("Authentification manquant pour le client :" + socket.id)
            sendSession()
            return
        }

        var token = socket.handshake.auth.token
        var sessionId = socket.handshake.auth.sessionId
        var auth_code = socket.handshake.auth.auth_code
        var inLogin = false

        if(sessionId) {
            if(!session.checkSession(sessionId)) {
                wlog.warn("Session invalide pour le client : " + socket.id)
                sendSession()
                return;
            } else {
                if(auth_code) {
                    const discordUser = await discordAuth.getDiscordUser(sessionId, auth_code)
                    session.removeSession(sessionId)
                    if(discordUser == "USER_INFO_ERROR" || discordUser == "ACCESS_TOKEN_ERROR") {
                        wlog.warn("Erreur lors de la récupération des informations de l'utilisateur Discord associé à la session : " + sessionId)
                        socket.emit("AUTH_ERROR", discordUser)
                        socket.disconnect()
                        return
                    } else {
                        const loggedUser = await users.addUser(discordUser.auth, discordUser.identity)
                        const newToken = await loggedUser.createToken()
                        socket.emit("NEW_TOKEN", newToken)
                        token = newToken
                        inLogin = true
                        wlog.log("Utilisateur Discord associé à la session : " + sessionId + " récupéré avec succès")
                        
                    }
                    
                   
                } else {
                    wlog.warn("Code d'authentification manquant pour le client :" + socket.id)
                    socket.emit("AUTH_ERROR", "Code manquant invalide")
                    socket.disconnect()
                    return
                }
            }
        } 

        if(!token) {
            wlog.warn("Token manquant pour le client :" + socket.id)
            socket.emit("AUTH_ERROR", "Token invalide")
            sendSession()
            return
        }

        socketUser = users.getUserByToken(token)

        if(!socketUser) {
            wlog.warn("Token invalide pour le client :" + socket.id)
            socket.emit("AUTH_ERROR", "Token invalide")
            sendSession()
            return
        } else {
            if(!socketUser.auth) {
                wlog.warn("L'utilisateur '" + socketUser.identity.username + "' n'a pas d'authentification Discord Valide")
                socketUser.clearToken()
                socket.emit("AUTH_ERROR", "L'authentification Discord de l'utilisateur n'est pas valide")
                socket.disconnect()
                return
            }

            if(!inLogin) {
                if(socketUser.needUpdate()) {
                    if (!(await users.updateIdentity(socketUser.identity.id))) {
                        wlog.error("Erreur lors de la mise à jour des informations de l'utilisateur : " + socketUser.identity.id);
                        socket.emit("AUTH_ERROR", "Mise à jour des informations de l'utilisateur impossible");
                        wlog.log("Déconnexion de l'utilisateur : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)    
                        socket.disconnect();
                        return;
                     }
                     socketUser.justUpdated()
                } else {
                    wlog.log("Pas de mise à jour des informations de l'utilisateur : " + socketUser.identity.id + " car l'utilisateur vient de se connecter")
                }
            
            } else {
                wlog.log("L'utilisateur '" + socketUser.identity.username + "' s'est connecté via la session : " + sessionId)
            }

        }

        socketUser = users.getUserByToken(token)
            
        if(socketUser) {
            var actualGuildId = null
            if(allConnectedUsers.includes(socketUser.identity)) {
                wlog.warn("L'utilisateur '" + socketUser.identity.username + "' est déjà connecté sur un autre appareil")
                return
            } else {
                allConnectedUsers.push(socketUser.identity)
                UsersBySocket.set(socketUser.identity.id, socket.id)
               
            }

            wlog.log("Utilisateur connecté : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)
           

            if(socketUser.isFullBanned()) {
                wlog.warn("Utilisateur banni : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)
                socket.emit("AUTH_ERROR", "Vous êtes banni du serveur")
                socket.disconnect()
            }
            if(socketUser.isAdmin()) {
                socket.join("ADMIN")
                wlog.log("Utilisateur admin identifié : " + socketUser.identity.username + " (" + socketUser.identity.id + ")")
            }

            process.emit("USERS_UPDATE")
            // USERS

            // CHECKED : 24/04/2025
            IORequest("/USER/INFO", () => {
                socketUser = users.getUserById(socketUser.identity.id)
                socketUser.identity['isAdmin'] = socketUser.isAdmin()
                var guildPresents = getUserGuilds();
                
                IOAnswer("/USER/INFO", {
                    identity: socketUser.identity,
                    guilds: guildPresents, 
                    labels: socketUser.labels,
                    history: history.getPersonalHistory(socketUser.identity.id),
                }, true)
                wlog.log("[USUAL] - Envoi des informations Discord de '" + socketUser.identity.id + "' à '" + socket.id + "'" )
            }, true)

            IORequest("/USER/HISTORY", () => {
                IOAnswer("/USER/HISTORY", history.getPersonalHistory(socketUser.identity.id), true)
            }, true)

            //CHECKED : 24/04/2025
            IORequest("/USER/SIGNOUT", () => {
                socketUser.removeToken(token)
                IOAnswer("/USER/SIGNOUT", true) 
                socket.disconnect()
            })

            IORequest("/USER/DELETE", async () => { 
                socketUser.removeToken(token)
                await users.deleteAccount(socketUser.identity.id)
                await playlists.deleteUserPlaylists(socketUser.identity.id)
                await history.clearPersonalHistory(socketUser.identity.id)
                await IOAnswer("/USER/DELETE", true)
                socket.disconnect()
            })

            // CHECKED : 24/04/2025 
            IORequest("/USERS/LIST", () => {
                if(!checkUserGuild(socketUser, actualGuildId)) return
                if(!guildConnectedUsers.has(actualGuildId)) return IOAnswer("/USERS/LIST", false)
                IOAnswer("/USERS/LIST", guildConnectedUsers.get(actualGuildId))
            })

            IORequest("/VERSION", () => {
                IOAnswer("/VERSION", __glob.VERSION)
            })

            IORequest("/CHANGELOG", () => {
                const changelogPath = __glob.CHANGELOG_PATH 
                if(!fs.existsSync(changelogPath)) {
                    wlog.warn("Aucun changelog trouvé à l'emplacement : " + changelogPath)
                    return IOAnswer("/CHANGELOG", false)
                }
                const changelogContent = fs.readFileSync(changelogPath, "utf-8")
                IOAnswer("/CHANGELOG", changelogContent, true)
            }, true)

            // PLAYERS

            IORequest("/PLAYER/LYRICS", async () => {
                if(!checkUserGuild(socketUser, actualGuildId)) return
                const player = await verifyPlayerAction(actualGuildId)
                if(!player) return IOAnswer("/PLAYER/LYRICS", false)
                if(!player.queue?.current) {
                    wlog.warn("Le player de la guilde : " + actualGuildId + " n'a pas de musique en cours")
                    IOAnswer("/PLAYER/LYRICS", false)
                    return
                }
                const song = player.queue.current
                const lyricsData = await lyrics.getLyrics(song.title + " " + song.author)
                if(!lyricsData) {
                    wlog.warn("Aucune lyrics trouvée pour la musique : " + song.title + " de l'artiste : " + song.author)
                    IOAnswer("/PLAYER/LYRICS", false)
                    return
                }
                IOAnswer("/PLAYER/LYRICS", lyricsData)
            })



            //CHECKED : 03/05/2025
            IORequest("/PLAYER/PREVIOUS/LIST", () => {   
                if(!checkUserGuild(socketUser, actualGuildId)) return
                const list = new List(actualGuildId)
                IOAnswer("/PLAYER/PREVIOUS/LIST", list.getPrevious())
            })

            // ChECKED : 03/05/2025
            IORequest("/GUILD/JOIN", async (guildId) => {
                if(!checkUserGuild(socketUser, guildId)) return IOAnswer("/GUILD/JOIN", false)  
                if(socket.rooms.has(guildId)) {
                    wlog.warn("[USUAL] - L'utilisateur '" + socketUser.identity.username + "' est déjà dans la room de la guilde : " + guildId)
                    IOAnswer("/GUILD/JOIN", true, true)
                } else {
                    // Make him to leave all the other rooms except the ADMIN room if he is admin
                    await socket.rooms.forEach((room) => {
                        if(room != "ADMIN" && room != guildId && room != socket.id) {
                            socket.leave(room)
                            wlog.log("L'utilisateur '" + socketUser.identity.username + "' quitte la room de la guilde: " + room)
                            removeGuildConnectedUser(socketUser.identity.id)
                        }
                    })
                    socket.join(guildId)
                    wlog.log("L'utilisateur '" + socketUser.identity.username + "' rejoint la room de la guilde : " + guildId)
                    addGuildConnectedUser(socketUser.identity, guildId)
                    actualGuildId = guildId
                    IOAnswer("/GUILD/JOIN", true, true)
                    process.emit("PLAYERS_UPDATE")
                    process.emit("USERS_UPDATE")
                }
 
            }, true)

            IORequest("/GUILD/INFO", () => {
                if(!checkUserGuild(socketUser, actualGuildId)) return IOAnswer("/GUILD/INFO", false)
                const guild = discordBot.getGuilds().get(actualGuildId)
                if(!guild) {
                    wlog.warn("Aucune guilde trouvée pour l'id : " + actualGuildId)
                    return IOAnswer("/GUILD/INFO", false)
                }
                const guildData = {
                    id: guild.id,
                    name: guild.name,
                    icon: guild.icon,
                    owner: guild.owner,
                    members: new Array(),
                    serverMember: guild.allMembers.length,
                    connected: players.getPlayer(actualGuildId) && players.getPlayer(actualGuildId).isConnected(),
                    labels: socketUser.labels,
                    isOwner: socketUser.identity.id === guild.owner,
                    isMod: socketUser.isMod(actualGuildId),
                    isAdmin: socketUser.isAdmin(),
                }
                for(var user of guildConnectedUsers.get(actualGuildId) || []) {
                    const userData = users.getUserById(user.id)
                    if(userData && userData.identity.id != socketUser.identity.id) {
                        let infos = {
                            id: userData.identity.id,
                            username: userData.identity.username,
                            global_name: userData.identity.global_name,
                            avatar: userData.identity.avatar,
                            isAdmin: userData.isAdmin(),
                            isOwner: userData.identity.id == guild.owner,
                            isMod: userData.isMod(actualGuildId),
                        }
                         if(guildData.members.find(m => m.id == infos.id)) continue
                        guildData.members.push(infos)
                    }
                }
                IOAnswer("/GUILD/INFO", guildData, true)
            }, true)
            

            IORequest("/GUILD/LIST", () => {
                const guildData = getUserGuilds()
                IOAnswer("/GUILD/LIST", guildData, true)
            }, true)

            // CHECKED : 03/05/2025
            IORequest("/PLAYER/STATE", async () => {
                const player = await verifyPlayerAction(actualGuildId)
                if(!player) return IOAnswer("/PLAYER/STATE", false)
                IOAnswer("/PLAYER/STATE", await player.getState(), true)
            }, true)
            

            // CHECKED : 03/05/2025
            IORequest("/PLAYER/PAUSE", () => {
                handlePlayerAction(actualGuildId, (player) => player.pause(), "/PLAYER/PAUSE");
            });

            
            // CHECKED : 03/05/2025
            IORequest("/PLAYER/BACKWARD", () => {
                handlePlayerAction(actualGuildId, (player) => player.previous(), "/PLAYER/BACKWARD");
            });

            
            // CHECKED : 03/05/2025
            IORequest("/PLAYER/FORWARD", () => {
                handlePlayerAction(actualGuildId, (player) => player.skip(), "/PLAYER/FORWARD");
            });

              // CHECKED : 03/05/2025
            IORequest("/PLAYER/LOOP", () => {
                handlePlayerAction(actualGuildId, (player) => player.setLoop(), "/PLAYER/LOOP");
            });

              // CHECKED : 03/05/2025
            IORequest("/PLAYER/SHUFFLE", () => {
                handlePlayerAction(actualGuildId, (player) => player.setShuffle(), "/PLAYER/SHUFFLE");
            });
              // CHECKED : 03/05/2025
            IORequest("/PLAYER/DISCONNECT", () => {
                handlePlayerAction(actualGuildId, (player) => player.leave(), "/PLAYER/DISCONNECT");
            });
              // CHECKED : 03/05/2025
            IORequest("/PLAYER/CHANNEL/CHANGE", () => {
                handlePlayerAction(actualGuildId, (player) => {
                    const channel = getUserChannel(false, true)
                    if(!channel) {
                        IOAnswer("/PLAYER/CHANNEL/CHANGE", false)
                        return
                    }
                    player.changeChannel(channel)
                }, "/PLAYER/CHANNEL/CHANGE");
            });

            // CHECKED : 03/05/2025
            IORequest("/PLAYER/SEEK", (time) => {
                if(!time) return IOAnswer("/PLAYER/SEEK", false)
                handlePlayerAction(actualGuildId, (player) => {
                    // Check if current is not null
                    if(player.queue.current == null) {
                        wlog.warn("Le player de la guilde : " + guildId + " n'a pas de musique en cours")
                        IOAnswer("/PLAYER/SEEK", false)
                        return
                    }
                    player.setDuration(time)
                }, "/PLAYER/SEEK");
            });

            // CHECKED : 04/05/2025            
            IORequest("/QUEUE/PLAY", (data) => {
                if(!data) return IOAnswer("/QUEUE/PLAY", false)
                const {index, listType, now} = data
                if(index == null) return IOAnswer("/QUEUE/PLAY", false)
                if(listType == null) return IOAnswer("/QUEUE/PLAY", false)
                if(!checkUserGuild(socketUser, actualGuildId)) return
                const player = new Player(actualGuildId)
                if(!connectToPlayer(actualGuildId, player)) return IOAnswer("/QUEUE/PLAY", false)
                var song;
                if(listType == "previous") {
                    const previous = player.queue.getPrevious()
                    song = previous[index]
                } else if(listType == "next") {
                    const next = player.queue.getNext()
                    song = next[index]
                }
                if(!song) return IOAnswer("/QUEUE/PLAY", false)
                if(listType == "next") player.queue.removeNextByIndex(index)
                if(now) {
                    player.play(song)
                } else {
                    player.add(song)
                }
                history.addToPersonalHistory(socketUser.identity.id, song)
                IOAnswer("/QUEUE/PLAY", true)
            })

            // CHECKED : 04/05/2025
            IORequest("/QUEUE/NEXT/DELETE", (index) => {
                if(index == null) return IOAnswer("/QUEUE/NEXT/DELETE", false)
                handlePlayerAction(actualGuildId, (player) => {
                    const next = player.queue.getNext()
                    if(!next[index]) return IOAnswer("/QUEUE/NEXT/DELETE", false);
                    player.queue.removeNextByIndex(index)
                }, "/QUEUE/NEXT/DELETE")
            })

             // CHECKED : 04/05/2025
            IORequest("/QUEUE/NEXT/DELETEALL", () => {
                handlePlayerAction(actualGuildId, (player) => player.queue.clearNext(), "/QUEUE/NEXT/DELETEALL")
            })

             // CHECKED : 04/05/2025
            IORequest("/QUEUE/NEXT/MOVE", (data) => {
                if(!data) return IOAnswer("/QUEUE/NEXT/MOVE", false)
                const {index, newIndex} = data
                if(index == null) return IOAnswer("/QUEUE/NEXT/MOVE", false)
                if(newIndex == null) return IOAnswer("/QUEUE/NEXT/MOVE", false)
                handlePlayerAction(actualGuildId, (player) => {
                    const next = player.queue.getNext()
                    if(!next[index]) return IOAnswer("/QUEUE/NEXT/MOVE", false);
                    player.queue.moveNext(index, newIndex)
                }, "/QUEUE/NEXT/MOVE")
            })

            // SEARCH

            // CHECKED : 24/04/2025 
            IORequest("/SEARCH", async (query) => {
                IOAnswer("/SEARCH", await Finder.search(query, true)) 
            })

            // CHECKED : 03/05/2025
            IORequest("/SEARCH/PLAY", async (data) => {
                if(!data) return IOAnswer("/SEARCH/PLAY", false)
                var {song, now} = data
                if(!song) return IOAnswer("/SEARCH/PLAY", false)
                if(typeof song == "string") {
                    song = JSON.parse(song)
                }
                song = new Song(song)
                if(!checkUserGuild(socketUser, actualGuildId)) return
                const player = new Player(actualGuildId)
                if(!connectToPlayer(actualGuildId, player)) return IOAnswer("/SEARCH/PLAY", false)
                if(now) {
                    player.play(song)
                } else {
                    player.add(song)
                }
                history.addToPersonalHistory(socketUser.identity.id, song)
                IOAnswer("/SEARCH/PLAY", true)
            })

            // CHECKED : 05/05/2025
            IORequest("/SEARCH/PLAYLIST", async (data) => {
                if(!data) return IOAnswer("/SEARCH/PLAYLIST", false)
                const {url, now} = data
                if(!url) return IOAnswer("/SEARCH/PLAYLIST", false)
                const playlist = await Finder.search(url, true, "PLAYLIST")
                if(!playlist) return IOAnswer("/SEARCH/PLAYLIST", false)
                const player = new Player(actualGuildId)
                if(!connectToPlayer(actualGuildId, player)) return IOAnswer("/SEARCH/PLAYLIST", false)
                player.readPlaylist(playlist, now)
                IOAnswer("/SEARCH/PLAYLIST", true)
            })

            IORequest("/SEARCH/LYRICS", async (name) => {
                if(!name) return IOAnswer("/SEARCH/LYRICS", false)
                const lyricsData = await lyrics.getLyrics(name)
                if(!lyricsData) return IOAnswer("/SEARCH/LYRICS", false)
                IOAnswer("/SEARCH/LYRICS", lyricsData)
            })

            // UPLOAD

            // CHECKED : 29/05/2025

            IORequest("/UPLOAD/FILE", async (data) => {
                if(!data) return IOAnswer("/UPLOAD/FILE", false)
                if(!data.name) return IOAnswer("/UPLOAD/FILE", false)
                const file = data.file
                // Check wav or mp3
                if(isAudioFile(file) == false) {
                    wlog.warn("Le fichier envoyé n'est pas un fichier audio valide (MP3/WAV)")
                    return IOAnswer("/UPLOAD/FILE", false)
                }
                const url = await mediaBase.postMedia(data, socketUser.identity.id)
                if(!url) return IOAnswer("/UPLOAD/FILE", "TOOHIGH")
                IOAnswer("/UPLOAD/FILE", {"url": url, "name": data.name})
            })

            IORequest("/UPLOAD/FILES", async () => {
                const files = await mediaBase.getAllMedia(socketUser.identity.id)
                IOAnswer("/UPLOAD/FILES", files)
            })

            IORequest("/UPLOAD/FILE/DELETE", (data) => {
                if(!data) return IOAnswer("/UPLOAD/FILE/DELETE", false)
                mediaBase.deleteMedia(data, socketUser.identity.id)
                IOAnswer("/UPLOAD/FILE/DELETE", true)
            })

            // GOOGLE API

            IORequest("/GOOGLE/AUTH", () => {
                IOAnswer("/GOOGLE/AUTH", googleApis.createAuthUrl(socketUser.identity.id))
            })

            IORequest("/GOOGLE/YOUTUBE/ADD_PLAYLIST", async (code) => {
                if(!code) {
                    IOAnswer("/GOOGLE/YOUTUBE/ADD_PLAYLIST", false)
                }
                const token = await googleApis.getAuthorization(socketUser.identity.id, code)
                if(!token) {
                    IOAnswer("/GOOGLE/YOUTUBE/ADD_PLAYLIST", false)
                    return
                }
                playlists.processYoutubeData(socketUser.identity.id, await youtubeApi.getYoutubePlaylists(socketUser.identity.id))
                IOAnswer("/GOOGLE/YOUTUBE/ADD_PLAYLIST", true)
            })


            // PLAYLISTS

            IORequest("/CHANNEL", () => {
                // Get the channel of the bot, in actualGuildId if he is connected
                const channel = getUserChannel(true)
                if(!channel) return IOAnswer("/CHANNEL", false, true)
                IOAnswer("/CHANNEL", channel, true)
            }, true)

            // CHECKED : 30/04/2025
            IORequest("/PLAYLISTS/CREATE", async (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/CREATE", false)
                const {name, url} = data
                if(!name) return IOAnswer("/PLAYLISTS/CREATE", false)
                const playlist = await playlists.addPlaylist(socketUser.identity.id, name, url, socketUser.identity.username, socketUser.identity.id, socketUser.identity.avatar)
                if(!playlist) return IOAnswer("/PLAYLISTS/CREATE", false)
                IOAnswer("/PLAYLISTS/CREATE", playlist)
            })

             // CHECKED : 30/04/2025
            IORequest("/PLAYLISTS/DELETE", (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/DELETE", false)
                playlists.removePlaylist(socketUser.identity.id, data)
                IOAnswer("/PLAYLISTS/DELETE", true)
            })

            // CHECKED : 24/04/2025
            IORequest("/PLAYLISTS/LIST", () => {
                const playlist = playlists.getPlaylistsOfUser(socketUser.identity.id)
                IOAnswer("/PLAYLISTS/LIST", playlist)
            })

            // CHECKED : 30/04/2025
            IORequest("/PLAYLISTS/SEND", (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/SEND", false)
                const {name, toId} = data   
                if(!name || !toId) return IOAnswer("/PLAYLISTS/SEND", false)
                // Check if toId is in the same guilds as the user
                // Check if the toId exists and have a playlist with the same name
                const toUser = users.getUserById(toId)
                if(!toUser) return IOAnswer("/PLAYLISTS/SEND", false)
                const toPlaylists = playlists.getPlaylistsOfUser(toUser.identity.id)
                const fromPlaylist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!fromPlaylist) return IOAnswer("/PLAYLISTS/SEND", false)
                if(toPlaylists.find(p => p.name == name)) return IOAnswer("/PLAYLISTS/SEND", false)
                playlists.copyPlaylist(socketUser.identity.id, toUser.identity.id, name)
                IOAnswer("/PLAYLISTS/SEND", true)
            })

            // CHECKED : 30/04/2025
            IORequest("/PLAYLISTS/RENAME", (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/RENAME", false)
                const {id, newName} = data
                if(!id || !newName) return IOAnswer("/PLAYLISTS/RENAME", false)
                var playlist = playlists.getPlaylist(socketUser.identity.id, id)
                if(!playlist) return IOAnswer("/PLAYLISTS/RENAME", false)
                playlists.renamePlaylist(socketUser.identity.id, id, newName)
                playlist = playlists.getPlaylist(socketUser.identity.id, id)
                IOAnswer("/PLAYLISTS/RENAME", playlist) 
            })

            // CHECKED : 30/04/2025 
            IORequest("/PLAYLISTS/ADD_SONG", (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/ADD_SONG", false)
                const {id, song} = data
                if(!id || !song) return IOAnswer("/PLAYLISTS/ADD_SONG", false)
                var playlist = playlists.getPlaylistOfUser(socketUser.identity.id, id)
                if(!playlist) return IOAnswer("/PLAYLISTS/ADD_SONG", false)
                playlists.addSong(socketUser.identity.id, id, song)
                playlist = playlists.getPlaylistOfUser(socketUser.identity.id, id)
                IOAnswer("/PLAYLISTS/ADD_SONG", playlist)
            })

            // CHECKED : 30/04/2025
            IORequest("/PLAYLISTS/REMOVE_SONG", (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/REMOVE_SONG", false)
                const {id, songId} = data
                if(!id || !songId) return IOAnswer("/PLAYLISTS/REMOVE_SONG", false)
                var playlist = playlists.getPlaylistOfUser(socketUser.identity.id, id)
                if(!playlist) return IOAnswer("/PLAYLISTS/REMOVE_SONG", false)
                  
                playlists.removeSong(socketUser.identity.id, id, songId)
                playlist = playlists.getPlaylistOfUser(socketUser.identity.id, id)
               
                IOAnswer("/PLAYLISTS/REMOVE_SONG", playlist)
            })

            // CHECKED : 05/05/2025
            IORequest("/PLAYLISTS/PLAY", async (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/PLAY", false)
                const {name, now} = data
                if(!name) return IOAnswer("/PLAYLISTS/PLAY", false)
                if(!checkUserGuild(socketUser, actualGuildId)) return IOAnswer("/PLAYLISTS/PLAY", false)
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/PLAY", false)
                const player = new Player(actualGuildId)
                if(!await connectToPlayer(actualGuildId, player)) return IOAnswer("/PLAYLISTS/PLAY", false)
                player.readPlaylist(playlist, now)
                IOAnswer("/PLAYLISTS/PLAY", true)
            })

            IORequest("/PLAYLISTS/REFRESH", async (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/REFRESH", false)
                const playlist = await playlists.refreshPlaylist(socketUser.identity.id, data)
                if(!playlist) return IOAnswer("/PLAYLISTS/REFRESH", false)
                IOAnswer("/PLAYLISTS/REFRESH", playlist)
            })


            // ADMIN

            if(socketUser.isAdmin()) {
                // CHECKED : 24/04/2025
                IORequest("/ADMIN/LOGS", () => {
                    if(!socketUser.isAdmin()) return IOAnswer("/ADMIN/LOGS", false)
                    const logs_data = new Array()
                    const logs_folder = fs.readdirSync(__glob.LOGS)
                    for(var log of logs_folder) {
                        logs_data.push({"name":log, "value": fs.readFileSync(__glob.LOGS + path.sep + log).toString()})
                    }
                    IOAnswer("/ADMIN/LOGS", logs_data)
                })

                // CHECKED : 24/04/2025
                IORequest("/ADMIN/MAINTENANCE/RESTART", (reason) => {
                    if(!socketUser.isAdmin()) return IOAnswer("/ADMIN/MAINTENANCE/RESTART", false)
                   if(!reason) return IOAnswer("/ADMIN/MAINTENANCE/RESTART", false)
                   restart(reason)
                })

                // CHECKED : 24/04/2025
                IORequest("/ADMIN/USERS/SWITCH_ADMIN", (userId) => {
                    if(!socketUser.isAdmin()) return IOAnswer("/ADMIN/USERS/SWITCH_ADMIN", false)
                    if(socketUser.identity.id == userId) return IOAnswer("/ADMIN/USERS/SWITCH_ADMIN", false)
                    if(!users.getUserById(userId)) return IOAnswer("/ADMIN/USERS/SWITCH_ADMIN", false)
                    users.setAdmin(userId)
                    process.emit("USERS_UPDATE")
                    IOAnswer("/ADMIN/USERS/SWITCH_ADMIN", true)
                })

                // CHECKED : 24/04/2025
                IORequest("/ADMIN/USERS/FULL_BAN", (userId) => {
                    if(!socketUser.isAdmin()) return IOAnswer("/ADMIN/USERS/FULL_BAN", false)
                    if(socketUser.identity.id == userId) return IOAnswer("/ADMIN/USERS/FULL_BAN", false)
                    if(!users.getUserById(userId)) return IOAnswer("/ADMIN/USERS/FULL_BAN", false)
                    if(users.getUserById(userId).isAdmin()) return IOAnswer("/ADMIN/USERS/FULL_BAN", false)
                    users.setFullBan(userId)
                    process.emit("USERS_UPDATE")
                    IOAnswer("/ADMIN/USERS/FULL_BAN", true)
                })


                // CHECKED : 24/04/2025
                IORequest("/ADMIN/USERS/DELETE", (userId) => {
                    if(!socketUser.isAdmin()) return IOAnswer("/ADMIN/USERS/DELETE", false)
                    if(socketUser.identity.id == userId) return IOAnswer("/ADMIN/USERS/DELETE", false)
                    if(!users.getUserById(userId)) return IOAnswer("/ADMIN/USERS/DELETE", false)
                    if(users.getUserById(userId).isAdmin()) return IOAnswer("/ADMIN/USERS/DELETE", false)
                        
                    users.removeUser(userId)
                    const userSocket = UsersBySocket.get(userId)
                    if(userSocket) {
                        const socket = io.sockets.sockets.get(userSocket)
                        if(socket) {
                            socket.emit("AUTH_ERROR", "Votre compte a été supprimé")
                            socket.disconnect()
                        }
                    }
                    IOAnswer("/ADMIN/USERS/DELETE", true)
                })

                // CHECKED : 24/04/2025
                IORequest("/ADMIN/PLAYER/GETALLSTATE", async () => {
                    if(!socketUser.isAdmin()) return IOAnswer("/ADMIN/PLAYER/GETTALLSTATE", false)
                    const allPlayers = players.getAllPlayers()
                    const states = new Array()
                    for(var player in allPlayers) {
                        await states.push(await player.getState())
                    }
                    IOAnswer("/ADMIN/PLAYER/GETALLSTATE", states)
                })

                
            }
            

            // CHECKED : 24/04/2025
            IORequest("/OWNER/USERS/SWITCH_MOD", async (userId) => {
                if(!userId || !actualGuildId) return IOAnswer("/OWNER/USERS/SWITCH_MOD", false)
                if(socketUser.identity.id == userId) return IOAnswer("/OWNER/USERS/SWITCH_MOD", false)
                const guild = discordBot.getGuilds().get(actualGuildId)
                if(!socketUser.identity.id === guild.owner) return IOAnswer("/OWNER/USERS/SWITCH_MOD", false)
                if(userId == guild.owner) return IOAnswer("/OWNER/USERS/SWITCH_MOD", false)
                await users.setGuildMod(userId, actualGuildId)
                await process.emit("USERS_UPDATE")
                IOAnswer("/OWNER/USERS/SWITCH_MOD", true)
            })

            IORequest("/OWNER/ROLES/GET", async () => {
                if(!actualGuildId) return IOAnswer("/OWNER/ROLES/GET", false)
                const guild = discordBot.getGuilds().get(actualGuildId)
                if(!socketUser.identity.id === guild.owner) return IOAnswer("/OWNER/ROLES/GET", false)
                const rolesSecure = discordBot.getGuildRoles(actualGuildId)
                const actualRole = await serverSettings.getSecureRole(actualGuildId)
                // Move the actual role at the start of the array
                if(actualRole) {
                    const index = rolesSecure.findIndex(r => r.id === actualRole.id)
                    if(index > -1) {
                        rolesSecure.unshift(rolesSecure.splice(index, 1)[0])
                    }
                } else {
                    // Find the @everyone role and put it at the start of the array
                    const index = rolesSecure.findIndex(r => r.name === "@everyone")
                    if(index > -1) {
                        rolesSecure.unshift(rolesSecure.splice(index, 1)[0])
                    }
                }
                IOAnswer("/OWNER/ROLES/GET", await rolesSecure)
            })

            IORequest("/OWNER/ROLES/SET", async (data) => {
                if(!actualGuildId) return IOAnswer("/OWNER/ROLES/SET", false)
                const guild = discordBot.getGuilds().get(actualGuildId)
                if(!socketUser.identity.id === guild.owner) return IOAnswer("/OWNER/ROLES/SET", false)
                await serverSettings.setSecureRole(actualGuildId, data)
                IOAnswer("/OWNER/ROLES/SET", true)
            })

            // CHECKED : 24/04/2025
            IORequest("/MOD/USERS/BAN", async (userId) => {
                if(!userId || !actualGuildId) return IOAnswer("/MOD/USERS/BAN", false)
                const guild = discordBot.getGuilds().get(actualGuildId)
                if(!guild) return IOAnswer("/MOD/USERS/BAN", false)
                if(!socketUser.isMod(actualGuildId) && socketUser.identity.id !== guild.owner) return IOAnswer("/MOD/USERS/BAN", false)
                if(socketUser.identity.id == userId) return IOAnswer("/MOD/USERS/BAN", false)
                const user = users.getUserById(userId)
                if(user.isMod(actualGuildId) || user.identity.id == guild.owner) return IOAnswer("/MOD/USERS/BAN", false)
                await users.setGuildBan(userId, actualGuildId)
                // If user is connected, disconnect him
                const userSocket = UsersBySocket.get(userId)
                if(userSocket) {
                    const socket = io.sockets.sockets.get(userSocket)
                    if(socket) {
                        removeGuildConnectedUser(userId)
                        if(socket.rooms.has(actualGuildId)) {
                            socket.leave(actualGuildId)
                        }
                    }
                }
                await process.emit("USERS_UPDATE")
                IOAnswer("/MOD/USERS/BAN", true)
            })


            IORequest("/MOD/USERS/LIST", () => {
                if(!actualGuildId) return IOAnswer("/MOD/USERS/LIST", false)
                const guild = discordBot.getGuilds().get(actualGuildId)
                if(!guild) return IOAnswer("/MOD/USERS/LIST", false)
                if(!socketUser.isMod(actualGuildId) && socketUser.identity.id !== guild.owner) return IOAnswer("/MOD/USERS/LIST", false)
                if(!checkUserGuild(socketUser, actualGuildId)) return IOAnswer("/MOD/USERS/LIST", false)
                const guildUserList = new Array()
                for(var user of guild.allMembers) {
                    const userData = users.getUserById(user)
                    if(!userData) continue
                    if(userData.labels.includes("DELETED")) continue
                    userData.identity['isAdmin'] = userData.isAdmin()
                    userData.identity['isMod'] = userData.isMod(actualGuildId)
                    userData.identity['isOwner'] = userData.identity.id == guild.owner
                    guildUserList.push({
                        identity: userData.identity,
                        isBanned: userData.isBanned(actualGuildId),
                    })
                }
                IOAnswer("/MOD/USERS/LIST", guildUserList, true)
            }, true)

            // UTILS

            // CHECKED : 24/04/2025
            IORequest("/REPORT", (data) => {
                if(!data) return IOAnswer("/REPORT", false)
                if(!data["level"] || !data["desc"]) return IOAnswer("/REPORT", false)
                const report = new Report(socketUser.identity.username, data["level"], data["desc"]).send()
                IOAnswer("/REPORT", true)
            })


            IORequest("/MOD/STATS", () => {
                if(!actualGuildId) return IOAnswer("/MOD/USERS/LIST", false)
                const guild = discordBot.getGuilds().get(actualGuildId)
                if(!guild) return IOAnswer("/MOD/USERS/LIST", false)
                if(!socketUser.isMod(actualGuildId) && socketUser.identity.id !== guild.owner) return IOAnswer("/MOD/USERS/LIST", false)
                if(!checkUserGuild(socketUser, actualGuildId)) return IOAnswer("/MOD/USERS/LIST", false)
                const metrics = JSON.parse(fs.readFileSync(__glob.METRIC_FILE))
                const metricsToSend = new Array()
                for(var metric of metrics) {
                    if(metric.name.includes(actualGuildId)) {
                        metricsToSend.push(metric)
                    } 
                }
                IOAnswer("/MOD/STATS", metricsToSend, true)
            }, true)



            // Functions 

            function getUserChannel(usual, force) {
                const botChannel = getBotChannel()
                if(botChannel && !force) {
                    return botChannel
                }
                const membersVoices = discordBot.getMembersVoices()
                const member = membersVoices.get(socketUser.identity.id)
                if(member) {
                    const channelId = member.channelId
                    const guildId = member.guildId
                    if(guildId != actualGuildId) {
                        if(!usual) wlog.warn("La guilde active : " + actualGuildId + " ne correspond pas à la guilde du channel vocal : " + guildId + " de l'utilisateur '" + socketUser.identity.username + "'")  
                        return null
                    }
                    const channel = discordBot.getChannel(guildId, channelId)
                    if(!channel) {
                        wlog.warn("Le channel vocal n'existe pas : " + channelId)
                        return null
                    }
                    return channel
                } else {
                    if(!usual) wlog.warn("L'utilisateur '" + socketUser.identity.username + "' n'est pas dans un channel vocal")
                    return null
                }
            }

            function getUserGuilds() {
                var guildPresents = new Array();
                var guildsOfBot = discordBot.getGuilds()
                for(var guild of guildsOfBot) {
                    if(guild[1].allMembers.includes(socketUser.identity.id)) {
                       const guildData = guild[1]
                       guildData['members'] = new Array()
                       guildData.serverMember = guild[1].allMembers.length
                       guildData.restricted = false
                       const secureRole = serverSettings.getSecureRole(guild[0])
                       if(secureRole && socketUser.identity.id !== discordBot.getGuilds().get(guild[0]).owner) {
                        const member = discordBot.getGuildMember(guild[0], socketUser.identity.id)
                        if(!member.roles.cache.has(secureRole.id) && socketUser.identity.id !== guild[1].owner && !socketUser.isAdmin()) {
                            guildData.restricted = true
                        } else {
                            guildData.restricted = false
                        }
                       }

                       guildData.allowed = true
                       for(var user of guildConnectedUsers.get(guild[0]) || []) {
                        const userData = users.getUserById(user.id)
                            if(userData && userData.identity.id != socketUser.identity.id) {
                                let infos = {
                                    id: userData.identity.id,
                                    global_name: userData.identity.global_name, 
                                    username: userData.identity.username,
                                    avatar: userData.identity.avatar,
                                    isAdmin: userData.isAdmin(),
                                    isOwner: userData.identity.id == guild[1].owner,
                                    isMod: userData.isMod(guild[0]),
                                }
                                // If it's already in guildData.members, skip
                                if(guildData.members.find(m => m.id == infos.id)) continue
                                guildData.members.push(infos)

                            }
                       }
                   
                       // Send if the bot is connected to the guild
                        if(players.getPlayer(guild[0]) && players.getPlayer(guild[0]).isConnected()) {
                            guildData.connected = true
                        } else {
                            guildData.connected = false
                        }
                        // Leave the room if the user is not in the guild
                        if(socket.rooms.has(guild[0]) && !checkUserGuild(socketUser, guild[0])) {
                            socket.leave(guild[0])
                            removeGuildConnectedUser(socketUser.identity.id)
                            wlog.warn("L'utilisateur '" + socketUser.identity.username + "' quitte la room de la guilde : " + guild[0] + " car il n'est pas dans la guilde) /!\\")
                        }
                        guildPresents.push(guildData)
                    }
                }
                return guildPresents
            }

            function getBotChannel() {
                const playersList = players.getAllPlayers()
                if(!playersList || playersList.length == 0) return null
                const player = playersList.find(p => p.isConnected() && p.guildId == actualGuildId)
                if(player) {
                    const channel = discordBot.getChannel(actualGuildId, player.channelId)
                    if(channel) {
                        return channel
                    }
                }
                return null
            }

            /**
             * @param {Player} player 
             */
            function connectToPlayer(guildId, player) {
                if(!checkUserGuild(socketUser, guildId)) return false
                if(player.isConnected()) true
                const channel = getUserChannel()
                if(!channel) return false
                player.join(channel)
                return true
            }

            async function verifyPlayerAction(guildId) {
                if (!checkUserGuild(socketUser, guildId)) return null;
                const player = players.getPlayer(guildId);
                if (player) {
                    return player;
                } else {
                    wlog.warn(`Le player de la guilde : ${guildId} n'existe pas`);
                    return null;
                }
            }


            function checkUserGuild(socketUser, guildId) {
                if(!guildId) {
                    wlog.warn("Aucun guildId n'est actif pour l'utilisateur : " + socketUser.identity.username)
                    return false
                }
                // Check role if secure role is set
                const secureRole = serverSettings.getSecureRole(guildId)
                if(secureRole && socketUser.identity.id !== discordBot.getGuilds().get(guildId).owner) {
                    const member = discordBot.getGuildMember(guildId, socketUser.identity.id)
                    if(member.roles.cache.has(secureRole.id) == false) {
                        wlog.warn("L'utilisateur '" + socketUser.identity.username + "' n'a pas le rôle requis pour accéder à la guilde : " + guildId)
                        return false
                    }
                }
                // Check if the guildId is referenced in the bot guilds 
                if(!discordBot.getGuilds().has(guildId)) {
                    wlog.warn("La guilde : " + guildId + " n'est pas référencée dans le bot")
                    return false
                }
                if(socketUser.isBanned(guildId)) {
                    wlog.warn("L'utilisateur '" + socketUser.identity.username + "' est banni de la guilde : " + guildId)
                    return false
                }
                const allGuilds = discordBot.getGuilds()
                
                if(!allGuilds.get(guildId).allMembers.includes(socketUser.identity.id)) {
                    wlog.warn("L'utilisateur '" + socketUser.identity.username + "' n'est pas membre de la guilde : " + guildId)
                    // Si user admin, override
                    if(!socketUser.isAdmin()) {
                        return false
                    }
                    wlog.log("L'utilisateur '" + socketUser.identity.username + "' est admin donc à le droit d'accéder à la guilde : " + guildId)
                }

                return true
            }

                    /**
                 * @param {function(Player)} action - The action to perform on the player.
                 */
            async function handlePlayerAction(guildId, action, actionName) {
                if (!checkUserGuild(socketUser, guildId)) return;
                    const player = players.getPlayer(guildId);
                if (player) {
                        await action(player);
                        wlog.log(`L'utilisateur '${socketUser.identity.username}' effectue l'action '${actionName}' sur le player de la guilde : ${guildId}`);
                        IOAnswer(actionName, true);
                } else {
                        wlog.warn(`Le player de la guilde : ${guildId} n'existe pas`);
                        IOAnswer(actionName, false);
                }

               
            }
            
        }
        


        function handleDisconnect() {
            if(socketUser) {
                wlog.log("Déconnexion de l'utilisateur : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)
                allConnectedUsers.splice(allConnectedUsers.indexOf(socketUser.identity), 1)
                removeGuildConnectedUser(socketUser.identity.id)
                process.emit("USERS_UPDATE")
                // Remove every rooms include admin
                socket.rooms.forEach((room) => {
                    socket.leave(room)
                })
                UsersBySocket.delete(socketUser.identity.id)
            }
        }

        function sendSession() {
            const newSession = session.addSession(socket.id)
            socket.emit("NEW_SESSION", newSession)
            wlog.log("Envoi d'une nouvelle session : '" + newSession + "' au client : " + socket.id)
            socket.disconnect()
        }

        
        function IORequest(RequestName, RequestCallback, usual) {
            socket.on(RequestName, (value) => {
                if(!usual) {
                    wlog.log(socketUser.identity.username + " - Socket : " + socket.id  + " - " + RequestName + " - [RECIEVED]") 
                }
                RequestCallback(value)
            })
        
        }
        function IOAnswer(AnswerName, AnswerValue, usual) {
            if(!usual) {
                wlog.log(socketUser.identity.username + " - Socket : " + socket.id  + " - " + AnswerName + " - [ANSWERED]") 
            }
            socket.emit(AnswerName, AnswerValue)
        }

    })

    httpServer.listen(configuration.getPort(), () => {
        wlog.log(`Le serveur écoute sur le port ${configuration.getPort()}`)
        wlog.step.end("server_init")
    })

    function addGuildConnectedUser(user, guildId) {
        // Check if the user is already connected to the guild
        if(!guildConnectedUsers.has(guildId)) {
            guildConnectedUsers.set(guildId, new Array())
        }
        
            if(guildConnectedUsers.get(guildId).includes(user)) {
                wlog.warn("L'utilisateur '" + user.username + "' est déjà connecté à la guilde : " + guildId)
                return
            } else {
                guildConnectedUsers.get(guildId).push(user)
            }
           
    }


    function removeGuildConnectedUser(userId) {
        for(var guild of guildConnectedUsers.keys()) {
            const users = guildConnectedUsers.get(guild)
            const userIndex = users.findIndex(u => u.id == userId)
            if(userIndex != -1) {
                users.splice(userIndex, 1)
            }
        }
    }

  
        
}

    
    





module.exports = {init}