const { Command } = require('../Command');
const { Embed } = require('../Embed');
const { __glob } = require("../../utils/GlobalVars");
const packageJson = require(__glob.PACKAGEINFO);

const command = new Command("about", "Affiche des informations sur le bot", (client, interaction) => {

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const embed = new Embed()
    embed.setColor(237, 12, 91)
    embed.setThumbnail("https://cdn.discordapp.com/avatars/" + client.user.id + "/" + client.user.avatar + ".png")
    embed.setTitle('Subsonics - Chopin')
    embed.addField('Informations',"")
    embed.addField('Version', packageJson.version + "    ", true)
    embed.addField('Uptime', `${hours}h ${minutes}m ${seconds}s    `, true)
    embed.addField("Ping", `${client.ws.ping} ms    `, true)
    embed.addField("Réalisé par", "Raphix - 2025", true)
    embed.addColumn()
    embed.addField('Versions',"")
    embed.addField('Node.js', process.version,true)
    embed.addField('Discord.js', packageJson.dependencies["discord.js"].replace("^", ""),true)
    embed.addColumn()
    embed.addField('Webmetrik', packageJson.dependencies["webmetrik"].replace("^", ""),true)
    embed.addField('Loguix', packageJson.dependencies["loguix"].replace("^", ""),true)
    embed.addColumn()

    embed.send(interaction)


})

module.exports = {command}