const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require("discord.js")
const fs = require("node:fs")
const path = require("path")
const { __glob } = require("../utils/GlobalVars")
const { LogType } = require("loguix")
const config = require("../utils/Database/Configuration")
const metric = require("webmetrik") 
const { Player } = require("../player/Player")
const {refreshAllUserInformation} = require("../server/auth/User")
const serverSettings = require("./ServerSettings")
const { Embed, EmbedError } = require("./Embed")

const dlog = new LogType("Discord")
const glog = new LogType("GuildUpdater")
dlog.log("Initialisation du Bot Discord")   

const membersVoices = new Map()
const timers = new Map()
const guilds = new Map()

var operational = false

const client = new Client({
    intents:[GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers],
})


//Getter for the client
function getClient() {
    return client
}

function getGuilds() {
    return guilds
}

function getMembersVoices() {
    return membersVoices
}

function isReady() {
    return operational
}

function getGuildMembers(guildId) {
    const guild = client.guilds.cache.get(guildId)
    if(!guild) {
        dlog.error("Guild not found: " + guildId)
        return []
    }
    return guild.members.cache.map(member => member.user.id)
}

function getGuildMember(guildId, memberId) {
    const guild = client.guilds.cache.get(guildId)
    if(!guild) {
        dlog.error("Guild not found: " + guildId)
        return null
    }
    return guild.members.cache.get(memberId) || null
}

function getGuildRoles(guildId) {
    const guild = client.guilds.cache.get(guildId)
    if(!guild) {
        dlog.error("Guild not found: " + guildId)
        return []
    }
    return guild.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position
    }))
}

function getChannel(guildId, channelId) {
    return client.guilds.cache.get(guildId).channels.cache.get(channelId)
}

function init() {
        
    client.once('ready', async () => {
    dlog.log("Connexion au Bot Discord réussi ! Connecté en tant que : " + client.user.tag)
    await refreshGuilds()
    await refreshAllUserInformation()

    const Activity = require("./Activity")
    Activity.idleActivity()

    const CommandUpdater = require("./CommandUpdater")
    CommandUpdater.init()

    const commandManager = client.application.commands
    if (!commandManager) {
        dlog.error('Command manager not available.')
    } else {
        commandManager.set([])
    }

    dlog.step.end("d_init")
    operational = true
})

    client.on("interactionCreate", async (interaction) => {
        
        if(!interaction.isCommand()) return;

        var numberOfCommands = new metric.Metric("numberOfCommands", "Nombre de commandes éxécutées")
        numberOfCommands.setValue(numberOfCommands.getValue() + 1)
        var numberOfCommandsServer = new metric.Metric("numberOfCommands_" + interaction.guild.id, "Nombre de commandes éxécutées sur le serveur : " + interaction.guild.name)
        numberOfCommandsServer.setValue(numberOfCommandsServer.getValue() + 1)

        const command = client.commands.get(interaction.commandName)
        const roleProtected = await serverSettings.getSecureRole(interaction.guild.id) || false
        var havePermission = true;
        if(roleProtected) {
            await interaction.member.fetch()
            if(!interaction.member.roles.cache.has(roleProtected.id)) {
                havePermission = false;
            }
        }

        try {
            // Create a metric to count the number of commands executed by each user
            const userCommand = new metric.Metric("userCommand_" + interaction.member.user.username, "Nombre de commandes éxécutées par l'utilisateur : " + interaction.member.user.username)
            userCommand.setValue(userCommand.getValue() + 1)
            dlog.log(interaction.member.user.username + "-> /" + interaction.commandName)
            if(havePermission) {
                 command.execute(client, interaction)
            } else {
                const embed = new EmbedError(`L'utilisation du Bot est réservée aux membres ayant le rôle "${roleProtected.name}"`, interaction, true)
                embed.setTitle("Accès refusé")
                embed.send()
            }
        } catch(error) {

            dlog.error(interaction.member.user.username + "-> /" + interaction.commandName + " : ERREUR RENCONTRE")
            dlog.error(error)
            interaction.reply({content:"Erreur lors de l'éxécution de la commande !", ephemeral: true})
        }
    })

    client.on("guildMemberAdd", async (member) => {
        dlog.log("Nouveau membre dans la guilde : " + member.guild.name + " (" + member.guild.id + ") - Membre : " + member.user.username + " (" + member.user.id + ")")
        await refreshGuilds()
        process.emit("USERS_UPDATE")
    })

    client.on("guildMemberRemove", async (member) => {
        dlog.log("Membre quitté la guilde : " + member.guild.name + " (" + member.guild.id + ") - Membre : " + member.user.username + " (" + member.user.id + ")")
        await refreshGuilds()   
        membersVoices.delete(member.user.id)
        process.emit("USERS_UPDATE")
    })

   // If a new guild is added, we will add it to the guilds map
    client.on("guildCreate", async (guild) => {
        
        await refreshGuilds()
        glog.log("Guilde ajoutée : " + guild.name + " (" + guild.id + ")")
        process.emit("USERS_UPDATE")
        
    })

    client.on("guildDelete", (guild) => {
        dlog.log("Guilde supprimée : " + guild.name)
        guilds.delete(guild.id)
        glog.log("Guilde supprimée : " + guild.name + " (" + guild.id + ")")
        process.emit("USERS_UPDATE")
    })

    client.on('guildUpdate', async () => {
        await refreshGuilds()
        process.emit("USERS_UPDATE")
    })

    client.on("voiceStateUpdate", (oldMember, newMember) => {
        membersVoices.set(newMember.id, {
            guildId: newMember.guild.id,
            channelId: newMember.channelId,
        })

        const player = new Player(newMember.guild.id)

        if(player.connection && player.channelId) {
            client.channels.fetch(player.channelId).then(channel => {

                if(channel.members.size <= 1) {
                    
                    // If the player is alone in the channel, we will destroy it in 10 minutes
                    // 10 minutes = 600000 ms
                    // 10 second = 10000 ms
                    timers.set(newMember.guild.id, setTimeout(() => {
                        const getPlayer = new Player(newMember.guild.id)
                        if(getPlayer.connection && player.channelId) {
                            getPlayer.leave()
                            dlog.log("[Automatic Task] Guild Id :" + newMember.guild.id + " - Player supprimé : " + channel.name)
                        }
                 
                    }, 600000))
                    dlog.log("[Automatic Task] Guild Id :" + newMember.guild.id + " -  Player supprimé dans 10 minutess : " + channel.name)
                } else {
                    dlog.log("[Automatic Task] Guild Id :" + newMember.guild.id + " -  Player n'est pas seul dans le channel : " + channel.name)
                    clearTimeout(timers.get(newMember.guild.id))
                    timers.delete(newMember.guild.id)
                }
            })
 
        }

        process.emit("VOCAL_UPDATE")
    })


    

    client.login(config.getToken())
}

async function refreshGuilds() {
    glog.step.init("d_refresh_guilds", "Rafraichissement des guildes")
    await client.guilds.fetch()
    for(const guild of client.guilds.cache.values()) {
        await guild.members.fetch()
        var allMembersOfGuild = guild.members.cache.map(member => member.user.id)
        const missingPermissions = checkRequiredPermission(guild.members.me)
        if(missingPermissions.length > 0) {
            dlog.error("Le bot n'a pas les permissions nécessaires pour rejoindre la guilde : " + guild.name)
            guild.leave()
            return
        }
        guilds.set(guild.id, {
            id: guild.id,
            name: guild.name,
            allMembers: allMembersOfGuild,
            icon: guild.iconURL(),
            banner: guild.bannerURL(),
            description: guild.description,
            features: guild.features,
            owner: guild.ownerId,
            joinedAt: guild.joinedAt,
            createdAt: guild.createdAt,
        })
        glog.log("Guilde rafraichie : " + guild.name + " (" + guild.id + ")")
    }
    glog.step.end("d_refresh_guilds")
}

function checkRequiredPermission(guildMember) {
    const requiredPermissions = [
    'ViewChannel',           // Voir les salons
    'SendMessages',          // Envoyer des messages texte
    'ReadMessageHistory',    // Lire l’historique des messages
    'Connect',               // Se connecter aux salons vocaux
    'Speak'                  // Parler dans les salons vocaux
    ]
    return requiredPermissions.filter(permission => !guildMember.permissions.has(permission));
}

module.exports = {init, getClient, getGuilds, getMembersVoices, getChannel, getGuildMembers, getGuildMember, isReady, getGuildRoles}


