const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require("discord.js")
const fs = require("node:fs")
const path = require("path")
const { __glob } = require("../utils/GlobalVars")
const { LogType } = require("loguix")
const config = require("../utils/Database/Configuration")
const metric = require("webmetrik") 

const dlog = new LogType("Discord")

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

    // TODO: Implement the disconnect event for the bot


    

    client.login(config.getToken())
}

module.exports = {init, getClient}


