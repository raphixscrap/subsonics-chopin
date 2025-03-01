const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require("discord.js")
const fs = require("node:fs")
const path = require("path")
const { __glob } = require("../utils/GlobalVars")
const { LogType } = require("loguix")
const config = require("../utils/Database/Configuration")
const metric = require("webmetrik") 
const { Player } = require("../player/Player")

const dlog = new LogType("Discord")

const membersVoices = new Map()
const timers = new Map()

const client = new Client({
    intents:[GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers],
})


//Getter for the client
function getClient() {
    return client
}


function init() {
        
    client.once('ready', () => {
        dlog.log("Connexion au Bot Discord réussi ! Connecté en tant que : " + client.user.tag)

        const Activity = require("./Activity")
        Activity.idleActivity()

        const CommandUpdater = require("./CommandUpdater")
        CommandUpdater.init()

        const commandManager = client.application.commands;

        if (!commandManager) {
            dlog.error('Command manager not available.');
                
        } else {

            commandManager.set([]);
        }

        dlog.step.end("d_init")
   
    });

    client.on("interactionCreate", (interaction) => {
        
        if(!interaction.isCommand()) return;

        var numberOfCommands = new metric.Metric("numberOfCommands", "Nombre de commandes éxécutées")
        numberOfCommands.setValue(numberOfCommands.getValue() + 1)

        const command = client.commands.get(interaction.commandName)

        try {
            
            // Create a metric to count the number of commands executed by each user
            const userCommand = new metric.Metric("userCommand_" + interaction.member.user.username, "Nombre de commandes éxécutées par l'utilisateur : " + interaction.member.user.username)
            userCommand.setValue(userCommand.getValue() + 1)
            dlog.log(interaction.member.user.username + "-> /" + interaction.commandName)
            command.execute(client, interaction)
        } catch(error) {

            dlog.error(interaction.member.user.username + "-> /" + interaction.commandName + " : ERREUR RENCONTRE")
            dlog.error(error)
            interaction.reply({content:"Erreur lors de l'éxécution de la commande !", ephemeral: true})
        }
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
                 
                    }, 10000))
                    dlog.log("[Automatic Task] Guild Id :" + newMember.guild.id + " -  Player supprimé dans 10 minutess : " + channel.name)
                } else {
                    dlog.log("[Automatic Task] Guild Id :" + newMember.guild.id + " -  Player n'est pas seul dans le channel : " + channel.name)
                    clearTimeout(timers.get(newMember.guild.id))
                    timers.delete(newMember.guild.id)
                }
            })
 
        }

        
    })


    

    client.login(config.getToken())
}

module.exports = {init, getClient}


