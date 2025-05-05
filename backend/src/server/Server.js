const {LogType} = require('loguix') 
const wlog = new LogType("Server")

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
const fs = require("fs")
const {__glob} = require("../utils/GlobalVars")
const playlists = require("../playlists/PlaylistManager")

const configuration = require("../utils/Database/Configuration")
const { List } = require('../player/List')
const { restart } = require('../utils/Maintenance')

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
    })
    

    process.on("PLAYERS_UPDATE", () => {
        if(io) {
            // Get all players and send them to client subscribed to the guild
            for(var guild of discordBot.getGuilds().keys()) {
                const player = players.getPlayer(guild)
                if(player) {
                    if(!player.isConnected()) continue;
                    io.to(player.guildId).emit("/PLAYER/UPDATE", player.getState())
                    wlog.log("Envoi de l'état du player de la guilde : " + player.guildId + " à tous les utilisateurs connectés")
                }
            }
        }
    })

    process.on("USERS_UPDATE", () => {
        if(io) {
            // Get all players and send them to client subscribed to the guild
            for(var guild of discordBot.getGuilds().keys()) {
               if(guildConnectedUsers.has(guild)) {
                    io.to(guild).emit("/USERS/UPDATE", {"id": guild, "members": guildConnectedUsers.get(guild)} )
                    io.to("ADMIN").emit("ALL_USERS_UPDATE", allConnectedUsers)  
                    wlog.log("Envoi de la liste des utilisateurs connectés (" + guildConnectedUsers.get(guild).length +") à la guilde : " + guild + " à tous les utilisateurs connectés")
                }
            }
        }
    })


    io.on("connection", async (socket) => {
        var socketUser;

        // Make sure Discord Bot is loaded and make an interruption until it is loaded
        while(!discordBot.getClient().isReady()) {
            wlog.warn("Attente de traitement : "+ socket.id + " : Le bot Discord n'est pas encore chargé, attente de 3 seconde... (Avoid Rate Limit)")
            await new Promise(resolve => setTimeout(resolve, 3000))
        }

        wlog.log(`Connexion d'un client : ${socket.id}`)

        socket.on("disconnect", () => {
            handleDisconnect()
            wlog.log("Déconnexion du client : " + socket.id)
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

        if(sessionId) {
            if(!session.checkSession(sessionId)) {
                wlog.warn("Session invalide pour le client : " + socket.id)
                sendSession()
                return;
            } else {
                if(auth_code) {
                    const discordUser = await discordAuth.getDiscordUser(sessionId, auth_code)
                    session.removeSession(sessionId)
                    if(discordUser == "GUILDS_ERROR" || discordUser == "USER_INFO_ERROR" || discordUser == "ACCESS_TOKEN_ERROR") {
                        wlog.warn("Erreur lors de la récupération des informations de l'utilisateur Discord associé à la session : " + sessionId)
                        socket.emit("AUTH_ERROR", discordUser)
                        socket.disconnect()
                        return
                    } else {
                        const loggedUser = await users.addUser(discordUser.auth, discordUser.identity, discordUser.guilds)
                        for(var guild of discordUser.guilds) {
                            if(guild.owner) {
                                users.setGuildOwner(loggedUser.identity.id, guild.id, true)
                            }
                        }
                        const newToken = await loggedUser.createToken()
                        socket.emit("NEW_TOKEN", newToken)
                        socket.disconnect()
                        wlog.log("Utilisateur Discord associé à la session : " + sessionId + " récupéré avec succès")
                        
                    }
                    
                   
                } else {
                    wlog.warn("Code d'authentification manquant pour le client :" + socket.id)
                    socket.disconnect()
                    return
                }
            }
        } 

        if(!token) {
            wlog.warn("Token manquant pour le client :" + socket.id)
            sendSession()
            return
        }

        socketUser = users.getUserByToken(token)

        if(!socketUser) {
            wlog.warn("Token invalide pour le client :" + socket.id)
            sendSession()
            return
        } else {
            if(!socketUser.auth) {
                wlog.warn("L'utilisateur '" + socketUser.identity.username + "' n'a pas d'authentification Discord Valide")
                socketUser.clearToken()
                socket.emit("AUTH_ERROR", "AUTH_ERROR")
                socket.disconnect()
                return
            }

            if (!(await users.updateGuilds(socketUser.identity.id)) || !(await users.updateIdentity(socketUser.identity.id))) {
                wlog.error("Erreur lors de la mise à jour des informations de l'utilisateur : " + socketUser.identity.id);
                socket.emit("UPDATE_ERROR", "Error updating user information");
                wlog.log("Déconnexion de l'utilisateur : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)    
                socket.disconnect();
                return;
            }
        }

        socketUser = users.getUserByToken(token)
            
        if(socketUser) {

            if(allConnectedUsers.includes(socketUser.identity.id)) {
                wlog.warn("L'utilisateur '" + socketUser.identity.username + "' est déjà connecté sur un autre appareil")
                return
            } else {
                allConnectedUsers.push(socketUser.identity)
                addGuildConnectedUser(socketUser.identity, socketUser.guilds)
                UsersBySocket.set(socketUser.identity.id, socket.id)
               
            }

            wlog.log("Utilisateur connecté : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)
            process.emit("USERS_UPDATE")

            if(socketUser.isFullBanned()) {
                wlog.warn("Utilisateur banni : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)
                socket.emit("BANNED")
                socket.disconnect()
            }
            if(socketUser.isAdmin()) {
                socket.join("ADMIN")
                wlog.log("Utilisateur admin identifié : " + socketUser.identity.username + " (" + socketUser.identity.id + ")")
            }

            // USERS

            // CHECKED : 24/04/2025
            IORequest("/USER/INFO", () => {
                var guildPresents = new Array();
                var guildsOfBot = discordBot.getGuilds()
                for(var guild of guildsOfBot) {
                    
                    if(guild[1].members.includes(socketUser.identity.id)) {
                        guildPresents.push(guild[1].id)
                    }
                }
                IOAnswer("/USER/INFO", {
                    identity: socketUser.identity,
                    guilds: guildPresents, 
                    labels: socketUser.labels,
                   
                })
                wlog.log("Envoi des informations Discord de '" + socketUser.identity.id + "' à '" + socket.id + "'" )
            })

            //CHECKED : 24/04/2025
            IORequest("/USER/SIGNOUT", () => {
                socketUser.removeToken(token)
                socket.disconnect()
            })


            // CHECKED : 24/04/2025 
            IORequest("/USERS/LIST", (guildId) => {
                if(!checkUserGuild(socketUser, guildId)) return
                if(!guildConnectedUsers.has(guildId)) return IOAnswer("/USERS/LIST", false)
                IOAnswer("/USERS/LIST", guildConnectedUsers.get(guildId))
            })

            // PLAYERS

            //CHECKED : 03/05/2025
            IORequest("/PLAYER/PREVIOUS/LIST", (guildId) => {   
                if(!checkUserGuild(socketUser, guildId)) return
                const list = new List(guildId)
                IOAnswer("/PLAYER/PREVIOUS/LIST", list.getPrevious())
            })

            // ChECKED : 03/05/2025
            IORequest("/PLAYER/JOIN", (guildId) => {
                if(!checkUserGuild(socketUser, guildId)) return
                wlog.log("L'utilisateur '" + socketUser.identity.username + "' rejoint la liste d'écoute du player de la guilde : " + guildId)
                // Make him to leave all the other rooms except the ADMIN room if he is admin
                socket.rooms.forEach((room) => {
                    if(room != "ADMIN") {
                        socket.leave(room)
                    }
                })
                socket.join(guildId)
                IOAnswer("/PLAYER/JOIN", true)
                process.emit("PLAYERS_UPDATE")
            })

            // CHECKED : 03/05/2025
            IORequest("/PLAYER/STATE", async (guildId) => {
                const player = await verifyPlayerAction(guildId)
                if(!player) return IOAnswer("/PLAYER/STATE", false)
                IOAnswer("/PLAYER/STATE", await player.getState())
            })
            

            // CHECKED : 03/05/2025
            IORequest("/PLAYER/PAUSE", (guildId) => {
                handlePlayerAction(guildId, (player) => player.pause(), "/PLAYER/PAUSE");
            });

            
            // CHECKED : 03/05/2025
            IORequest("/PLAYER/BACKWARD", (guildId) => {
                handlePlayerAction(guildId, (player) => player.previous(), "/PLAYER/BACKWARD");
            });

            
            // CHECKED : 03/05/2025
            IORequest("/PLAYER/FORWARD", (guildId) => {
                handlePlayerAction(guildId, (player) => player.skip(), "/PLAYER/FORWARD");
            });

              // CHECKED : 03/05/2025
            IORequest("/PLAYER/LOOP", (guildId) => {
                handlePlayerAction(guildId, (player) => player.setLoop(), "/PLAYER/LOOP");
            });

              // CHECKED : 03/05/2025
            IORequest("/PLAYER/SHUFFLE", (guildId) => {
                handlePlayerAction(guildId, (player) => player.setShuffle(), "/PLAYER/SHUFFLE");
            });
              // CHECKED : 03/05/2025
            IORequest("/PLAYER/DISCONNECT", (guildId) => {
                handlePlayerAction(guildId, (player) => player.leave(), "/PLAYER/DISCONNECT");
            });
              // CHECKED : 03/05/2025
            IORequest("/PLAYER/CHANNEL/CHANGE", (guildId) => {
                handlePlayerAction(guildId, (player) => {
                    const channel = getUserChannel()
                    if(!channel) {
                        IOAnswer("/PLAYER/CHANNEL/CHANGE", false)
                        return
                    }
                    player.changeChannel(channel)
                }, "/PLAYER/CHANNEL/CHANGE");
            });

            // CHECKED : 03/05/2025
            IORequest("/PLAYER/SEEK", (data) => {
                if(!data) return IOAnswer("/PLAYER/SEEK", false)
                const {guildId, time} = data
                if(!guildId) return IOAnswer("/PLAYER/SEEK", false)
                if(!time) return IOAnswer("/PLAYER/SEEK", false)
                handlePlayerAction(guildId, (player) => {
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
            IORequest("/QUEUE/PLAY/NOW", (data) => {
                if(!data) return IOAnswer("/QUEUE/PLAY/NOW", false)
                const {guildId, index, listType} = data
                if(!index) return IOAnswer("/QUEUE/PLAY/NOW", false)
                if(!guildId) return IOAnswer("/QUEUE/PLAY/NOW", false)
                if(!listType) return IOAnswer("/QUEUE/PLAY/NOW", false)
                if(!checkUserGuild(socketUser, guildId)) return
                const player = new Player(guildId)
                if(!connectToPlayer(guildId, player)) return IOAnswer("/QUEUE/PLAY", false)
                var song;
                if(listType == "previous") {
                    const previous = player.queue.getPrevious()
                    song = previous[index]
                } else if(listType == "next") {
                    const next = player.queue.getNext()
                    song = next[index]
                }
                if(!song) return IOAnswer("/QUEUE/PLAY/NOW", false)
                if(listType == "next") player.queue.removeNextByIndex(index)
                player.play(song)
                IOAnswer("/QUEUE/PLAY/NOW", true)
            })

            // CHECKED : 04/05/2025
            IORequest("/QUEUE/NEXT/DELETE", (data) => {
                if(!data) return IOAnswer("/QUEUE/NEXT/DELETE", false)
                const {guildId, index} = data
                if(!guildId) return IOAnswer("/QUEUE/NEXT/DELETE", false)
                if(!index) return IOAnswer("/QUEUE/NEXT/DELETE", false)
                handlePlayerAction(guildId, (player) => {
                    const next = player.queue.getNext()
                    if(!next[index]) return IOAnswer("/QUEUE/NEXT/DELETE", false);
                    player.queue.removeNextByIndex(index)
                }, "/QUEUE/NEXT/DELETE")
            })

             // CHECKED : 04/05/2025
            IORequest("/QUEUE/NEXT/DELETEALL", (guildId) => {
                handlePlayerAction(guildId, (player) => player.queue.clearNext(), "/QUEUE/NEXT/DELETEALL")
            })

             // CHECKED : 04/05/2025
            IORequest("/QUEUE/NEXT/MOVE", (data) => {
                if(!data) return IOAnswer("/QUEUE/NEXT/MOVE", false)
                const {guildId, index, newIndex} = data
                if(!guildId) return IOAnswer("/QUEUE/NEXT/MOVE", false)
                if(!index) return IOAnswer("/QUEUE/NEXT/MOVE", false)
                if(!newIndex) return IOAnswer("/QUEUE/NEXT/MOVE", false)
                handlePlayerAction(guildId, (player) => {
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
                var {guildId, song, now} = data
                if(!song) return IOAnswer("/SEARCH/PLAY", false)
                if(typeof song == "string") {
                    song = JSON.parse(song)
                }
                if(!guildId) return IOAnswer("/SEARCH/PLAY", false)
                if(!checkUserGuild(socketUser, guildId)) return
                const player = new Player(guildId)
                if(!connectToPlayer(guildId, player)) return IOAnswer("/SEARCH/PLAY", false)
                if(now) {
                    player.play(song)
                } else {
                    player.add(song)
                }
                IOAnswer("/SEARCH/PLAY", true)
            })

            // CHECKED : 05/05/2025
            IORequest("/SEARCH/PLAYLIST", async (data) => {
                if(!data) return IOAnswer("/SEARCH/PLAYLIST", false)
                const {url, now, guildId} = data
                if(!url) return IOAnswer("/SEARCH/PLAYLIST", false)
                if(!guildId) return IOAnswer("/SEARCH/PLAYLIST", false)
                const playlist = await Finder.search(url, true, "PLAYLIST")
                if(!playlist) return IOAnswer("/SEARCH/PLAYLIST", false)
                const player = new Player(guildId)
                if(!connectToPlayer(guildId, player)) return IOAnswer("/SEARCH/PLAYLIST", false)
                player.readPlaylist(playlist, now)
                IOAnswer("/SEARCH/PLAYLIST", true)
            })

            
            // PLAYLISTS

            // CHECKED : 30/04/2025
            IORequest("/PLAYLISTS/CREATE", async (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/CREATE", false)
                const {name, url} = data
                if(!name) return IOAnswer("/PLAYLISTS/CREATE", false)
                const playlist = await playlists.addPlaylist(socketUser.identity.id, name, url)
                if(!playlist) return IOAnswer("/PLAYLISTS/CREATE", false)
                IOAnswer("/PLAYLISTS/CREATE", true)
            })

             // CHECKED : 30/04/2025
            IORequest("/PLAYLISTS/DELETE", (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/DELETE", false)
                const {name} = data
                if(!name) return IOAnswer("/PLAYLISTS/DELETE", false)
                playlists.removePlaylist(socketUser.identity.id, name)
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
                const {name, newName} = data
                if(!name || !newName) return IOAnswer("/PLAYLISTS/RENAME", false)
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/RENAME", false)
                playlists.renamePlaylist(socketUser.identity.id, name, newName)
                IOAnswer("/PLAYLISTS/RENAME", true) 
            })

            // CHECKED : 30/04/2025 
            IORequest("/PLAYLISTS/ADD_SONG", (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/ADD_SONG", false)
                const {name, song} = data
                if(!name || !song) return IOAnswer("/PLAYLISTS/ADD_SONG", false)
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/ADD_SONG", false)
                playlists.addSong(socketUser.identity.id, name, song)
                IOAnswer("/PLAYLISTS/ADD_SONG", true)
            })

            // CHECKED : 30/04/2025
            IORequest("/PLAYLISTS/REMOVE_SONG", (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/REMOVE_SONG", false)
                const {name, songId} = data
                if(!name || !songId) return IOAnswer("/PLAYLISTS/REMOVE_SONG", false)
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/REMOVE_SONG", false)
                playlists.removeSong(socketUser.identity.id, name, songId)
                IOAnswer("/PLAYLISTS/REMOVE_SONG", true)
            })

            // CHECKED : 05/05/2025
            IORequest("/PLAYLISTS/PLAY", async (data) => {
                if(!data) return IOAnswer("/PLAYLISTS/PLAY", false)
                const {name, guildId, now} = data
                if(!name || !guildId) return IOAnswer("/PLAYLISTS/PLAY", false)
                if(!checkUserGuild(socketUser, guildId)) return IOAnswer("/PLAYLISTS/PLAY", false)
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/PLAY", false)
                const player = new Player(guildId)
                if(!await connectToPlayer(guildId, player)) return IOAnswer("/PLAYLISTS/PLAY", false)
                player.readPlaylist(playlist, now)
                IOAnswer("/PLAYLISTS/PLAY", true)
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
                    IOAnswer("/ADMIN/USERS/SWITCH_ADMIN", true)
                })

                // CHECKED : 24/04/2025
                IORequest("/ADMIN/USERS/FULL_BAN", (userId) => {
                    if(!socketUser.isAdmin()) return IOAnswer("/ADMIN/USERS/FULL_BAN", false)
                    if(socketUser.identity.id == userId) return IOAnswer("/ADMIN/USERS/FULL_BAN", false)
                    if(!users.getUserById(userId)) return IOAnswer("/ADMIN/USERS/FULL_BAN", false)
                    if(users.getUserById(userId).isAdmin()) return IOAnswer("/ADMIN/USERS/FULL_BAN", false)
                    users.setFullBan(userId)
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
                            socket.emit("DELETED")
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
            IORequest("/OWNER/USERS/SWITCH_MOD", (data) => {
                if(!data["userId"] || !data["guildId"]) return IOAnswer("/OWNER/USERS/SWITCH_MOD", false)
                const userId = data["userId"]
                const guildId = data["guildId"]
                if(socketUser.identity.id == userId) return IOAnswer("/OWNER/USERS/SWITCH_MOD", false)
                if(!socketUser.isOwner(guildId)) return IOAnswer("/OWNER/USERS/SWITCH_MOD", false)
                users.setGuildMod(userId, guildId)
                IOAnswer("/OWNER/USERS/SWITCH_MOD", true)
            })

            
            // CHECKED : 24/04/2025
            IORequest("/MOD/USERS/BAN", (data) => {
                if(!data["userId"] || !data["guildId"]) return IOAnswer("/MOD/USERS/BAN", false)
                const userId = data["userId"]
                const guildId = data["guildId"]
                if(socketUser.identity.id == userId) return IOAnswer("/MOD/USERS/BAN", false)
                if(!socketUser.isMod(guildId)) return IOAnswer("/MOD/USERS/BAN", false)
                users.setGuildBan(userId, guildId)
                IOAnswer("/MOD/USERS/BAN", true)
            })

            // UTILS

            // CHECKED : 24/04/2025
            IORequest("/REPORT", (data) => {
                if(data.length < 2) return IOAnswer("/REPORT", false)
                if(!data["level"] || !data["desc"]) return IOAnswer("/REPORT", false)
                const report = new Report(socketUser.identity.username, data["level"], data["desc"]).send()
                IOAnswer("/REPORT", true)
            })




            // Functions 

            function getUserChannel() {
                const membersVoices = discordBot.getMembersVoices()
                const member = membersVoices.get(socketUser.identity.id)
                if(member) {
                    const channelId = member.channelId
                    const guildId = member.guildId
                    const channel = discordBot.getChannel(guildId, channelId)
                    if(!channel) {
                        wlog.warn("Le channel vocal n'existe pas : " + channelId)
                        return null
                    }
                    return channel
                } else {
                    wlog.warn("L'utilisateur '" + socketUser.identity.username + "' n'est pas dans un channel vocal")
                    return null
                }
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
                // Check if the guildId is referenced in the bot guilds 
                if(!discordBot.getGuilds().has(guildId)) {
                    wlog.warn("La guilde : " + guildId + " n'est pas référencée dans le bot")
                    return false
                }
                if(socketUser.isBanned(guildId)) {
                    wlog.warn("L'utilisateur '" + socketUser.identity.username + "' est banni de la guilde : " + guildId)
                    return false
                }
                if(!socketUser.guilds.find(g => g.id == guildId)) {
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
                removeGuildConnectedUser(socketUser.identity)
                process.emit("USERS_UPDATE")
                if(socketUser.isAdmin()) {
                    socket.leave("ADMIN")
                }
                UsersBySocket.delete(socketUser.identity.id)
            }
        }

        function sendSession() {
            const newSession = session.addSession(socket.id)
            socket.emit("NEW_SESSION", newSession)
            wlog.log("Envoi d'une nouvelle session : '" + newSession + "' au client : " + socket.id)
            socket.disconnect()
        }

        
        function IORequest(RequestName, RequestCallback) {
            socket.on(RequestName, (value) => {
                wlog.log(socketUser.identity.username + " - Socket : " + socket.id  + " - " + RequestName + " - [RECIEVED]") 
                RequestCallback(value)
            })
        
        }
        function IOAnswer(AnswerName, AnswerValue) {
        
            wlog.log(socketUser.identity.username + " - Socket : " + socket.id  + " - " + AnswerName + " - [ANSWERED]") 
            socket.emit(AnswerName, AnswerValue)
        }

    })

    httpServer.listen(configuration.getPort(), () => {
        wlog.log(`Le serveur écoute sur le port ${configuration.getPort()}`)
        wlog.step.end("server_init")
    })

    function addGuildConnectedUser(user, guilds) {
        // Check if guilds is iterable
        if(!guilds || !guilds[Symbol.iterator]) {
            wlog.warn("Les guilds ne sont pas itérables")
            return
        }
       for(var guild of guilds) {
            if(!guildConnectedUsers.has(guild)) {
                guildConnectedUsers.set(guild.id, new Array())
            }
            guildConnectedUsers.get(guild.id).push(user)
        }
        
    }

    function removeGuildConnectedUser(user) {
        for(var guild of guildConnectedUsers.keys()) {
            const users = guildConnectedUsers.get(guild)
            if(users.includes(user)) {
                users.splice(users.indexOf(user), 1)
                if(users.length == 0) {
                    guildConnectedUsers.delete(guild)
                }
            }
        }
    }

}



module.exports = {init}