const {Command} = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const { Player, AllPlayers } = require("../../player/Player")

const command = new Command("skip", "Passe à la musique suivante", (client, interaction) => {   
    
    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour passer à la musique suivante !").send(interaction)

    const channel = interaction.member.voice.channel

    if(AllPlayers.has(channel.guildId)) {

        const player = new Player(channel.guildId)
        const result = player.skip()


        var embed = new Embed()
        embed.setColor(0x15e6ed)
        result.then((song) => {

            if(song == "no_music") {
                embed = new EmbedError("Il n'y a pas de musique en file d'attente")
        
            } else if(song) {
                
                // Result is a song
                embed.setColor(0x15e6ed)
                
                embed.setTitle('**Musique suivante !**')
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