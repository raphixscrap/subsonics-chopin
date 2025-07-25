const {Command} = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const {Player, AllPlayers} = require("../../player/Player")

const command = new Command("leave", "Quitter le salon vocal", (client, interaction) => {

    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour arrêter le bot !", interaction)
    const channel = interaction.member.voice.channel
    var embed = new Embed(interaction)
    
    if(AllPlayers.has(channel.guildId)) {
        const player = AllPlayers.get(channel.guildId)
        if(!player?.connected) {
            return embed.returnError("Le bot n'est pas connecté à ce salon vocal")
        }
        player.leave()

       
        embed.setColor(200, 20, 20)
        embed.setTitle('**Déconnexion**')
        embed.setDescription('Déconnexion du salon vocal')
        embed.setThumbnail("https://www.iconsdb.com/icons/download/white/phone-51-64.png")

        embed.send()
     
    } else {

        embed.returnError("Le bot n'est pas connecté à ce salon vocal")
    }
  
   
})

module.exports = {command}
