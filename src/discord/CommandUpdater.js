function init() {

const bot = require("./Bot")
const client = bot.getClient()
const { Collection, REST, Routes } = require("discord.js")
const fs = require("node:fs")
const path = require("path")
const {__glob} = require("../utils/GlobalVars")
const dlog = require("loguix").getInstance("Discord")
const config = require("../utils/Database/Configuration")

client.commands = new Collection()
    dlog.step.init("d_init", "Initialisation du Bot Discord")
    dlog.step.init("d_get_commands", "Récupération des commandes en local depuis : " + __glob.COMMANDS)

    const commands = [];
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = __glob.COMMANDS
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const cmd = require(commandsPath + path.sep + file);
        client.commands.set(cmd.command.getName(), cmd.command.getData())

        commands.push(cmd.command.getData().data.toJSON());
    }

    
    dlog.step.end("d_get_commands")

    const rest = new REST().setToken(config.getToken());
    
    if(commands.length != 0) {

    (async () => {
        try {
           
        
            const guilds = client.guilds.cache.map(guild => guild.id);

            dlog.step.init("d_commands_refresh", `Refreshing ${guilds.length} guilds (/) commands.`);
            for (const guildId of guilds) {
                const data = await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guildId),
                    { body: commands },
                );

                // Log the guilds where the commands have been refreshed with number of commands
                dlog.log(`Refreshed "${data.length}" commands in guild "${guildId} - ${client.guilds.cache.get(guildId).name}"`);

            }

            dlog.step.end("d_commands_refresh")
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            dlog.error(error)
        }

        
       
    })();

    } else {
        dlog.warn("Aucune commande à envoyer à Discord !")
    }


    rest.on("rateLimited", (datawarn) => {
        dlog.warn("REST - Limite de requête atteinte ! TimeToReset : " + datawarn.timeToReset);
    })

}

module.exports = {init}