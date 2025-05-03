const { Command } = require("../Command");
const { Embed, EmbedError } = require("../Embed");
const { Player } = require("../../player/Player");
const Finder = require("../../player/Finder");
const { Playlist } = require("../../playlists/Playlist");
const spotify = require("../../media/SpotifyInformation");

const command = new Command("play", "Jouer une musique à partir d'un lien dans un salon vocal", async (client, interaction) => {

    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour jouer une musique !").send(interaction)

    const url = interaction.options.get("url")
    const channel = interaction.member.voice.channel
    const now = interaction.options.getBoolean("now") || false
    await Finder.search(url.value).then(async (song) => {
        if(!song) return new EmbedError("Impossible de trouver la musique à partir du lien donné ou des mots clés donnés").send(interaction)
    
        const player = new Player(channel.guildId)
        player.join(channel)
    
        const embed = new Embed()
        embed.setColor(0x15e6ed)
        
        // Check if song is playlist 
        if(song instanceof Playlist) {
            
            embed.setDescription('**Playlist : **' + song.songs.length + ' musiques')
            embed.addField('**Titre : **' + song.title, "")  
            embed.addField('**Demandé par : **', interaction.member.user.username,)
            embed.addField('**Auteur : **', song.author) 
            embed.addField('**Provient de : **', song.type.replace(/^\w/, (c) => c.toUpperCase()))
            if(!song.type == "spotify") {
                embed.addField('**Durée : **', song.readduration)
            }
            embed.addField('**Lien : **', song.url)
            embed.addField(":warning: La récupération des musiques peut prendre du temps", "Veuillez patienter ... et éviter de lancer d'autres commandes")
                  

            embed.setThumbnail(song.thumbnail)
            
        } else {
 
            embed.setDescription('**Titre : **' + song.title)
            embed.addField('**Durée : **', song.readduration)
            embed.addField("**Artiste : **",song.author)
            embed.addField('**Demandé par **' + interaction.member.user.username, "")
            embed.addField("**Lien :** ", song.url)
            embed.setThumbnail(song.thumbnail)
            

        }

        if(now) {
            embed.setTitle("Lecture immédiate")
        } else {
            embed.setTitle("Ajoutée à la file d'attente")
        }

        embed.send(interaction)

        if(song instanceof Playlist) {
            if(song.type == "spotify") {
                song = await spotify.getTracks(song)
            }
            player.readPlaylist(song, now)
        } else {


            if(now) { 
            
                player.play(song)
          
          
            } else {
                player.add(song)
            }
                
        }

       
        
      
    })
    
}, [{type: "STRING", name: "url", description: "Recherche / Lien audio (Youtube / Soundclound / Spotify)", required: true},
    {type:"BOOLEAN", name: "now", description: "Lire le média maintenant", required: false}]
)

module.exports = {command}