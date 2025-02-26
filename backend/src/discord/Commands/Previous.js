const {Command} = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const { Player, AllPlayers } = require("../../player/Player")

const command = new Command("previous", "Passe à la musique précédente", (client, interaction) => {


    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour passer à la musique suivante !").send(interaction)

    const channel = interaction.member.voice.channel

    if(AllPlayers.has(channel.guildId)) {

        const player = new Player(channel.guildId)
        const result = player.previous()


        var embed = new Embed()
        embed.setColor(0x15e6ed)

        result.then((song) => {

            if(song == "no_music") {
                embed = new EmbedError("Il n'y a pas de musique précédemment jouée")
        
            } else if(song) {
                
                // Result is a song

            
                
                embed.setTitle('**Musique précédente !**')
                embed.setDescription('**Titre : **' + song.title)
                embed.addField('**Durée : **'+ song.readduration, "")
                embed.addField("**Artiste : **" + song.author, "")
                embed.setThumbnail(song.thumbnail)
            
                
            }  

            embed.send(interaction)
        })

    } else {
        return new EmbedError("Le bot n'est pas connecté").send(interaction)
    }

    

})

module.exports = {command}