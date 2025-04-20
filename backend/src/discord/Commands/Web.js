const { Command } = require('../Command');
const { Button } = require('../Button');
const { Embed } = require('../Embed');
const config = require('../../utils/Database/Configuration')

const command = new Command("web", "Affiche le lien vers le site web pour contrôler le bot", (client, interaction) => {
    const embed = new Embed()
    embed.setColor(0xffffff)
    embed.setTitle('Subsonics - Chopin')
    embed.addBotPicture(client)
    
    embed.setDescription('Vous pouvez contrôler le bot depuis le site web ! \n Nécéssite une connexion avec votre compte Discord.')
    
    const linkButton = new Button("Site web", null, 5, config.getWebsiteLink())
    embed.addButton(linkButton)
    embed.send(interaction)

})

module.exports = {command}