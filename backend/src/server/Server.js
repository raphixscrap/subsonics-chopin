const {LogType} = require('loguix') 
const wlog = new LogType("Server")

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
            for(var guild of discordBot.getGuilds()) {
                const player = players.getPlayer(guild.id)
                if(player) {
                    io.to(guild.id).emit("PLAYER_UPDATE", player.getState())
                    wlog.log("Envoi de l'état du player de la guilde : " + guild.id + " à tous les utilisateurs connectés")
                }
            }
        }
    })

    process.on("USERS_UPDATE", () => {
        if(io) {
            // Get all players and send them to client subscribed to the guild
            for(var guild of discordBot.getGuilds()) {
               if(guildConnectedUsers.has(guild.id)) {
                    io.sockets.emit("USERS_UPDATE", guildConnectedUsers.get(guild.id))
                    io.to("admin").emit("ALL_USERS_UPDATE", allConnectedUsers)  
                    wlog.log("Envoi de la liste des utilisateurs connectés à la guilde : " + guild.id + " à tous les utilisateurs connectés")
                }
            }
        }
    })




    io.on("connection", async (socket) => {

        wlog.log(`Connexion d'un client : ${socket.id}`)
       
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
                wlog.warn("Session invalide pour le client :" + socket.id)
                sendSession()
                return;
            } else {
                if(auth_code) {
                    const discordUser = await discordAuth.getDiscordUser(sessionId, auth_code)
                    session.removeSession(sessionId)
                    if(discordUser == "GUILDS_ERROR" || discordUser == "USER_INFO_ERROR" || discordUser == "ACCESS_TOKEN_ERROR") {
                     
                        wlog.warn("Erreur lors de la récupération des informations de l'utilisateur Discord associé à la session : " + sessionId)
                        socket.emit("AUTH_ERROR")
                        socket.disconnect()
                        return
                    } else {
                        const loggedUser = users.addUser(discordUser.auth, discordUser.identity, discordUser.guilds)
                        for(var guild of discordUser.guilds) {
                            if(guild.owner) {
                                users.setGuildOwner(loggedUser.identity.id, guild.id)
                            }
                        }
                        const newToken = loggedUser.createToken()
                        socket.emit("NEW_TOKEN", newToken)
                        socket.disconnect()
                        wlog.log("Utilisateur Discord associé à la session : " + sessionId + " récupéré avec succès")
                        
                    }
                    
                   
                } else {
                    wlog.warn("Code d'authentification manquant pour le client :" + socket.id)
                }
            }
        } 

        if(!token) {
            wlog.warn("Token manquant pour le client :" + socket.id)
            sendSession()
            return
        }

        const socketUser = users.getUserByToken(token)

        if(!socketUser) {
            wlog.warn("Token invalide pour le client :" + socket.id)
            sendSession()
            return
        }
            
        if(socketUser) {
            if(allConnectedUsers.includes(socketUser.identity.id)) {
                wlog.warn("L'utilisateur '" + socketUser.identity.username + "' est déjà connecté sur un autre appareil")
                return
            } else {
                allConnectedUsers.push(socketUser.identity)
                addGuildConnectedUser(socketUser.identity, socketUser.guilds)
                process.emit("USERS_UPDATE")
            }

            wlog.log("Utilisateur connecté : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)

            if(socketUser.isFullBanned()) {
                wlog.warn("Utilisateur banni : " + socketUser.identity.username + " (" + socketUser.identity.id + ") - Socket : " + socket.id)
                socket.emit("BANNED")
                socket.disconnect()
            }
            if(socketUser.labels.includes("admin")) {
                socket.join("admin")
                wlog.log("Utilisateur admin identifié : " + socketUser.identity.username + " (" + socketUser.identity.id + ")")
            }

            // USERS

            IORequest("/USER/INFO", () => {
                IOAnswer("/USER/INFO", {
                    identity: socketUser.identity,
                    guilds: socketUser.guilds, 
                    labels: socketUser.labels
                })
                wlog.log("Envoi des informations Discord de '" + socketUser.identity.id + "' à '" + socket.id + "'" )
            })

            IORequest("/USERS/LIST", (guildId) => {
                if(!checkUserGuild(socketUser, guildId)) return
                if(!guildConnectedUsers.has(guildId)) return IOAnswer("/USERS/LIST", false)
                IOAnswer("/USERS/LIST", guildConnectedUsers.get(guildId))
            })

            // PLAYERS

            IORequest("/PLAYER/PREVIOUS/LIST", (guildId) => {   
                if(!checkUserGuild(socketUser, guildId)) return
                const list = new List(guildId)
                return list.getPrevious()
            })

            IORequest("/PLAYER/JOIN", (guildId) => {
                if(!checkUserGuild(socketUser, guildId)) return
                wlog.log("L'utilisateur '" + socketUser.identity.username + "' rejoint la liste d'écoute du player de la guilde : " + guildId)
                socket.join(guildId)
                IOAnswer("PLAYER_STATE", true)
            })

            IORequest("/PLAYER/LEAVE", (guildId) => {
                if(!checkUserGuild(socketUser, guildId)) return
                wlog.log("L'utilisateur '" + socketUser.identity.username + "' quitte la liste d'écoute du player de la guilde : " + guildId)
                socket.leave(guildId)
                IOAnswer("PLAYER_STATE", false)
            })

            IORequest("/PLAYER/STATE", (guildId) => {
                handlePlayerAction(guildId, (player) => player.getState(), "/PLAYER/STATE");
            })

            IORequest("/PLAYER/PAUSE", (guildId) => {
                handlePlayerAction(guildId, (player) => player.pause(), "/PLAYER/PAUSE");
            });

            IORequest("/PLAYER/BACKWARD", (guildId) => {
                handlePlayerAction(guildId, (player) => player.previous(), "/PLAYER/BACKWARD");
            });

            IORequest("/PLAYER/FORWARD", (guildId) => {
                handlePlayerAction(guildId, (player) => player.skip(), "/PLAYER/FORWARD");
            });

            IORequest("/PLAYER/LOOP", (guildId) => {
                handlePlayerAction(guildId, (player) => player.setLoop(), "/PLAYER/LOOP");
            });

            IORequest("/PLAYER/SHUFFLE", (guildId) => {
                handlePlayerAction(guildId, (player) => player.setShuffle(), "/PLAYER/SHUFFLE");
            });

            IORequest("/PLAYER/DISCONNECT", (guildId) => {
                handlePlayerAction(guildId, (player) => player.leave(), "/PLAYER/DISCONNECT");
            });

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

            IORequest("/PLAYER/SEEK", (guildId, time) => {
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

            IORequest("/QUEUE/PLAY/NOW", (guildId, listType, index) => {
                if(!checkUserGuild(socketUser, guildId)) return
                const player = new Player(guildId)
                if(!connectToPlayer(guildId, player)) return IOAnswer("/QUEUE/PLAY", false)
                if(listType == "previous") {
                    const previous = player.queue.getPrevious()
                    song = previous[index]
                } else if(listType == "next") {
                    const next = player.queue.getNext()
                    song = next[index]
                }
                if(!song) return IOAnswer("/QUEUE/PLAY", false)
                player.add(song)
                IOAnswer("/QUEUE/PLAY/NOW", true)
            })

            IORequest("/QUEUE/NEXT/DELETE", (guildId, index) => {
                handlePlayerAction(guildId, (player) => {
                    const next = player.queue.getNext()
                    if(!next[index]) return IOAnswer("/QUEUE/NEXT/DELETE", false);
                    player.queue.removeNextByIndex(index)
                })
            })

            IORequest("/QUEUE/NEXT/DELETEALL", (guildId) => {
                handlePlayerAction(guildId, (player) => player.queue.clearNext())
            })

            IORequest("/QUEUE/NEXT/MOVE", (guildId, index, newIndex) => {
                handlePlayerAction(guildId, (player) => {
                    const next = player.queue.getNext()
                    if(!next[index]) return IOAnswer("/QUEUE/NEXT/MOVE", false);
                    player.queue.moveNext(index, newIndex)
                })
            })

            // SEARCH

            IORequest("/SEARCH", async (query) => {
                IOAnswer("/SEARCH", await Finder.search(query)) 
            })

            IORequest("/SEARCH/PLAY", async (guildId, song, now) => {
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

            
            // PLAYLISTS

            IORequest("/PLAYLISTS/CREATE", (name, url) => {
                if(!name) return IOAnswer("/PLAYLISTS/CREATE", false)
                const playlist = playlists.addPlaylist(socketUser.identity.id, name, url)
                if(!playlist) return IOAnswer("/PLAYLISTS/CREATE", false)
                IOAnswer("/PLAYLISTS/CREATE", true)
            })

            IORequest("/PLAYLISTS/DELETE", (name) => {
                if(!name) return IOAnswer("/PLAYLISTS/DELETE", false)
                playlists.removePlaylist(socketUser.identity.id, name)
                IOAnswer("/PLAYLISTS/DELETE", true)
            })

            IORequest("/PLAYLISTS/LIST", () => {
                const playlist = playlists.getPlaylistsOfUser(socketUser.identity.id)
                IOAnswer("/PLAYLISTS/LIST", playlist)
            })

            IORequest("/PLAYLISTS/SEND", (name, toId) => {
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

            IORequest("/PLAYLISTS/RENAME", (name, newName) => {
                if(!name || !newName) return IOAnswer("/PLAYLISTS/RENAME", false)
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/RENAME", false)
                playlists.renamePlaylist(socketUser.identity.id, name, newName)
                IOAnswer("/PLAYLISTS/RENAME", true) 
            })

            IORequest("/PLAYLISTS/ADD_SONG", (name, song) => {
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/ADD_SONG", false)
                playlists.addSong(socketUser.identity.id, name, song)
                IOAnswer("/PLAYLISTS/ADD_SONG", true)
            })

            IORequest("/PLAYLISTS/REMOVE_SONG", (name, songId) => {
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/REMOVE_SONG", false)
                playlists.removeSong(socketUser.identity.id, name, songId)
                IOAnswer("/PLAYLISTS/REMOVE_SONG", true)
            })

            IORequest("/PLAYLISTS/PLAY", (guildId, name, now) => {
                const playlist = playlists.getPlaylistOfUser(socketUser.identity.id, name)
                if(!playlist) return IOAnswer("/PLAYLISTS/PLAY", false)
                const player = new Player(guildId)
                if(!connectToPlayer(guildId, player)) return IOAnswer("/PLAYLISTS/PLAY", false)
                player.readPlaylist(playlist, now)
                IOAnswer("/PLAYLISTS/PLAY", true)
            })


            // ADMIN

            if(socketUser.labels.includes("admin")) {
                IORequest("/ADMIN/LOGS", () => {
                    const logs_data = new Array()
                    const logs_folder = fs.readdirSync(__glob.LOGS)
                    for(var log of logs_folder) {
                        logs_data.push({"name":log, "value": fs.readFileSync(__glob.LOGS + path.sep + log).toString()})
                    }
                    IOAnswer("/ADMIN/LOGS", logs_data)
                })

                IORequest("/ADMIN/MAINTENANCE/RESTART", (reason) => {
                   if(!reason) return IOAnswer("/ADMIN/MAINTENANCE/RESTART", false)
                   restart(reason)
                })

                IORequest("/ADMIN/USERS/SWITCH_ADMIN", (userId) => {
                    users.setAdmin(userId)
                    IOAnswer("/ADMIN/USERS/PROMOTE_ADMIN", true)
                })

                IORequest("/ADMIN/USERS/FULL_BAN", (userId) => {
                    users.setFullBan(userId)
                    IOAnswer("/ADMIN/USERS/FULL_BAN", true)
                })

                IORequest("/ADMIN/USERS/DELETE", (userId) => {
                    users.removeUser(userId)
                    IOAnswer("/ADMIN/USERS/DELETE", true)
                })

                IORequest("/ADMIN/PLAYER/GETALLSTATE", () => {
                    
                    const allPlayers = players.getAllPlayers()
                    const states = new Array()
                    for(var player of allPlayers) {
                        states.push(player.getState())
                    }
                    IOAnswer("/ADMIN/PLAYER/GETALLSTATE", states)
                })
            }

            IORequest("/OWNER/USERS/SWITCH_MOD", (userId, guildId) => {
                if(!socketUser.isOwner(guildId)) return IOAnswer("/OWNER/USERS/SWITCH_MOD", false)
                users.setGuildMod(userId, guildId)
                IOAnswer("/OWNER/USERS/SWITCH_MOD", true)
            })

            IORequest("/MOD/USERS/BAN", (userId, guildId) => {
                if(!socketUser.isMod(guildId)) return IOAnswer("/MOD/USERS/BAN", false)
                users.setGuildBan(userId, guildId)
                IOAnswer("/OWNER/USERS/BAN", true)
            })

            // UTILS

            IORequest("/REPORT", (level, desc) => {
                const report = new Report(socketUser.identity.username, level, desc).send()
                IOAnswer("/REPORT", true)
            })




            // Functions 

            function getUserChannel() {
                const membersVoices = discordBot.getMembersVoices()
                const member = membersVoices.get(socketUser.identity.id)
                if(member) {
                    const channelId = member.channelId
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


            function checkUserGuild(socketUser, guildId) {
                // Vérifie si l'utilisateur n'est pas banni de la guilde
                if(socketUser.isBanned(guildId)) {
                    wlog.warn("L'utilisateur '" + socketUser.identity.username + "' est banni de la guilde : " + guildId)
                    return false
                }
                if(!socketUser.guilds.includes(guildId)) {
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
        
    
        socket.on("disconnect", () => {
            allConnectedUsers.splice(allConnectedUsers.indexOf(socketUser.identity), 1)
            socket.leave("admin")
            removeGuildConnectedUser(socketUser.identity)
            process.emit("USERS_UPDATE")
            clog.log(`Déconnexion du client : ${socket.id}`)
        })

        function sendSession() {
            const newSession = session.addSession(socket.id)
            socket.emit("NEW_SESSION", newSession)
            wlog.log("Envoi d'une nouvelle session : '" + newSession + "' au client : " + socket.id)
            socket.disconnect()
        }

        
        function IORequest(RequestName, RequestCallback) {
            socket.on(GQname, (value) => {
                wlog.log(socketUser.identity.username + " - Socket : " + socket.id  + " - POST/" + GQname + " - [RECIEVED]") 
                GQcallback(value)
            })
        
        }
        function IOAnswer(AnswerName, AnswerValue) {
        
            wlog.log(socketUser.identity.username + " - Socket : " + socket.id  + " - POST/" + GRname + " - [ANSWERED]") 
            socket.emit("ANSWER/" + GRname, GRvalue)
            process.emit("PLAYERS_UPDATE")
        }

    })

    httpServer.listen(configuration.getPort(), () => {
        wlog.log(`Le serveur écoute sur le port ${configuration.getPort()}`)
        wlog.step.end("server_init")
    })

    function AdminRequest(GRname, GRvalue) {

        io.to("admin").emit("ALWAYS/" + GRname, GRvalue)
    
    }

    function addGuildConnectedUser(user, guilds) {
       for(var guild of guilds) {
            if(!guildConnectedUsers.has(guild)) {
                guildConnectedUsers.set(guild, new Array())
            }
            guildConnectedUsers.get(guild).push(user)
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