const {Command} = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const { Player } = require("../../player/Player")

const command = new Command("pause", "Mettre en pause la musique en cours", (client, interaction) => {


    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour mettre en pause la musique !").send(interaction)

    const channel = interaction.member.voice.channel
    const player = new Player(channel.guildId)
    player.pause()

    // Réponse en embed

    const embed = new Embed()
    embed.setColor(0x00ff66)
    embed.setTitle('Musique en pause')
    embed.setDescription("La musique a été mise en pause")
    embed.send(interaction)

})

module.exports = {command}