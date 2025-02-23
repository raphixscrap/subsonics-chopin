const { Command } = require('../Command');
const { Embed } = require('../Embed');

const command = new Command("web", "Affiche le lien vers le site web pour contrôler le bot", (client, interaction) => {
    const embed = new Embed()
    embed.setColor(0xffffff)
    embed.setTitle('Subsonics - Chopin')
    embed.addBotPicture(client)
    embed.addField('Lien',"https://subsonics.raphix.fr/")
    embed.send(interaction)

})

module.exports = {command}