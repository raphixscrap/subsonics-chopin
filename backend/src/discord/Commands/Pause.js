const {Command} = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const { Player } = require("../../player/Player")

const command = new Command("pause", "Mettre en pause / Reprendre la musique en cours", (client, interaction) => {


    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour mettre en pause la musique !").send(interaction)

    const channel = interaction.member.voice.channel
    const player = new Player(channel.guildId)
    const result = player.pause()


    var embed = new Embed()
    embed.setColor(0x03ff2d)

    result.then((pause) => {

        if(pause == "no_music") {
            embed = new EmbedError("Il n'y a pas de musique en cours de lecture")
       
        } else if(pause) {
            embed.setTitle('Musique en pause')
            embed.setDescription("La musique a été mise en pause")
            embed.setThumbnail("https://www.iconsdb.com/icons/download/white/pause-64.png")
           
        
        } else {
            embed.setTitle('Musique reprise')
            embed.setDescription("La musique a été reprise")
            embed.setThumbnail("https://www.iconsdb.com/icons/download/white/play-64.png")
        }   

        embed.send(interaction)
    })
    
    // Réponse en embed

    

})

module.exports = {command}