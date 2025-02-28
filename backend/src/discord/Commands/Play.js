const { Command } = require("../Command");
const { Embed, EmbedError } = require("../Embed");
const { Player } = require("../../player/Player");
const Finder = require("../../player/Finder");
const { Playlist } = require("../../player/Playlist");

const command = new Command("play", "Jouer une musique à partir d'un lien dans un salon vocal", async (client, interaction) => {

    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour jouer une musique !").send(interaction)

    const url = interaction.options.get("url")
    const channel = interaction.member.voice.channel
    const now = interaction.options.getBoolean("now") || false
    await Finder.search(url.value).then((song) => {
        if(!song) return new EmbedError("Impossible de trouver la musique à partir du lien donné ou des mots clés donnés").send(interaction)
    
        const player = new Player(channel.guildId)
        player.join(channel)
    
        const embed = new Embed()
        embed.setColor(0x15e6ed)
        
        // Check if song is playlist 
        if(song instanceof Playlist) {

            if(now) {
                player.readPlaylist(song, true)
                embed.setTitle('**Lecture immédiate**')
            } else {
                player.readPlaylist(song)
                embed.setTitle('**Ajout à la liste de lecture**')
            }
            embed.setDescription('**Playlist : **' + song.songs.length + ' musiques')
            embed.addField('**Titre : **' + song.title, "")  
            embed.addField('**Demandé par : **', interaction.member.user.username,)
            embed.addField('**Auteur : **', song.author)  
            embed.addField('**Durée : **', song.readduration)

            embed.setThumbnail(song.thumbnail)
            
        } else {

            if(now) { 
            
                player.play(song)
                embed.setTitle('**Lecture immédiate**')
          
            } else {
                player.add(song)
                embed.setTitle('**Ajout à liste de lecture**')
                
            }
                
            embed.setDescription('**Titre : **' + song.title)
            embed.addField('**Durée : **', song.readduration)
            embed.addField("**Artiste : **",song.author)
            embed.addField('**Demandé par **' + interaction.member.user.username, "")
            embed.setThumbnail(song.thumbnail)
            

        }

       
        
        embed.send(interaction)
    })
    
}, [{type: "STRING", name: "url", description: "Recherche / Lien audio (Youtube / Soundclound / Spotify)", required: true},
    {type:"BOOLEAN", name: "now", description: "Lire le média maintenant", required: false}]
)

module.exports = {command}