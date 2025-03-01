const {Command} = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const {Player} = require("../../player/Player")

const command = new Command("state", "Affiche la musique en cours", (client, interaction) => {
    
        const channel = interaction.member.voice.channel
        const player = new Player(channel.guildId)
        const song = player.queue.getCurrent()
    
            var embed = new Embed()
            embed.setColor(0x15e6ed)
    
            if(!song) {
                embed = new EmbedError("Il n'y a pas de musique en cours de lecture")
        
            } else if(song) {
                
                // Result is a song
                embed.setColor(0x15e6ed)
                
                embed.setTitle('**Musique en cours :**')
                embed.setDescription('**Titre : **' + song.title)
                embed.addField('**Durée : **', song.readduration)
                embed.addField("**Artiste : **", song.author)
                embed.setThumbnail(song.thumbnail)
            
                
            }  
    
            embed.send(interaction)
})
 
module.exports = {command}
