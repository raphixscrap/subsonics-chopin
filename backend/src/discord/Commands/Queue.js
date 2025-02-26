const {Command} = require("../Command")
const {Embed, EmbedError} = require("../Embed")
const { Player, AllPlayers } = require("../../player/Player")

const command = new Command("liste", "Affiche la file d'attente", (client, interaction) => {
    
        const channel = interaction.member.voice.channel

        if(AllPlayers.has(channel.guildId)) {

        const player = new Player(channel.guildId)
        const queue = player.queue.getNext()
    
        var embed = new Embed()
        embed.setColor(0x15e6ed)
    
        if(queue.length == 0) {
            embed = new EmbedError("Il n'y a pas de musique en file d'attente")
        
        } else if(queue.length > 0) {
            
            // Result is a song
            embed.setColor(0x15e6ed)
            embed.setThumbnail("https://www.iconsdb.com/icons/download/white/list-2-64.png")
            embed.setTitle('**File d\'attente :**')
            queue.forEach((song, index) => {
                embed.addField(`**${index+1} - ${song.title}**`, `**Durée : **${song.readduration}\n**Artiste : **${song.author}`)
            })
            
        }  
    
        embed.send(interaction)

        } else {
            return new EmbedError("Le bot n'est pas connecté").send(interaction)
        }
    })

module.exports = {command}