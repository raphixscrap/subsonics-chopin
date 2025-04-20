const {Command } = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const {Button} = require("../Button")

const command = new Command("invite", "Invite moi sur d'autres serveurs", (client, interaction) => {
    const embed = new Embed()
    embed.setColor(0xFF007F)
    embed.setTitle('**Inviter le bot sur d\'autres serveurs**')
    embed.setDescription('Vous pouvez m\'inviter sur d\'autres serveurs en cliquant sur le bouton ci-dessous.')
    embed.addBotPicture(client)
    

    const linkButton = new Button("Invite", null, 5, "https://discord.com/oauth2/authorize?client_id=" + client.user.id + "&scope=bot+applications.commands&permissions=8")
    embed.addButton(linkButton)

    embed.send(interaction)

})

module.exports = {command}  