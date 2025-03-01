const {Command} = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const {Player, AllPlayers} = require("../../player/Player")

const command = new Command("leave", "Quitter le salon vocal", (client, interaction) => {

    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour arrêter le bot !").send(interaction)
    const channel = interaction.member.voice.channel
    var embed = new Embed()
    if(AllPlayers.has(channel.guildId)) {
        const player = AllPlayers.get(channel.guildId)
        player.leave()

       
        embed.setColor(200, 20, 20)
        embed.setTitle('**Déconnexion**')
        embed.setDescription('Déconnexion du salon vocal')
        embed.setThumbnail("https://www.iconsdb.com/icons/download/white/phone-51-64.png")
     
    } else {

        embed = new EmbedError("Le bot n'est pas connecté à ce salon vocal")
    }
    embed.send(interaction)
   
})

module.exports = {command}
