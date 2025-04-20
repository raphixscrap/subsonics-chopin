const {Embed} = require("../Embed")
const {Command} = require("../Command")
const {restart} = require("../../utils/Maintenance")
const users = require("../../server/auth/User")  

// Nécéssite une raison pour redémarrer le bot

const command = new Command("restart", "Redémarre le bot", (client, interaction) => {
    // Check if user is admin from users list 
    const user = users.getUserById(interaction.user.id)
    if(!user || !user.isAdmin()) {
        interaction.reply({content: "Vous n'êtes pas admin", ephemeral: true})
        return
    }
    const reason = interaction.options.getString("reason")
    restart(reason)
    const embed = new Embed()
    embed.setColor(150, 20, 20)
    embed.setTitle('Redémarrage')
    embed.setDescription("Veuillez patientez, le bot va redémarrer dans un instant ! :arrows_counterclockwise:")
    embed.addField('Raison', reason)
    embed.send(interaction)
},
[{type: "STRING", name: "reason", description: "Raison du redémarrage", required: true}]
)

module.exports = {command}