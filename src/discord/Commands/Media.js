const {Command} = require('../Command');
const {Embed, EmbedError} = require('../Embed');
const { Player } = require('../../player/Player');
const { Song } = require('../../player/Song');
const history = require('../../playlists/History'); 

const command = new Command("media", "Lire un média MP3/WAV dans un salon vocal", async (client, interaction) => {

    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour jouer un média !", interaction, true)

    const media = interaction.options.get("media")
    const now = interaction.options.getBoolean("now") || false

    if(media.attachment.contentType != "audio/mpeg" && media.attachment.contentType != "audio/wav") return new EmbedError("Le média doit être un fichier audio MP3 ou WAV !", interaction)


    const embed = new Embed(interaction)
    embed.setColor(0x15e6ed)
    const channel = interaction.member.voice.channel
    const song = new Song()
    await song.processMedia(media, interaction.user.username)

    const player = new Player(channel.guildId)
    player.join(channel)

  
    

    if(now) { 
        player.play(song)
        embed.setTitle('**Lecture immédiate**')
  
    } else {
        player.add(song)
        embed.setTitle('**Ajout à liste de lecture**')
        
    }

    history.addToPersonalHistory(interaction.user.id, song)
        
    embed.setDescription('**Titre : **' + song.title)
    embed.addField('**Durée : **', song.readduration)
    embed.addField("**Artiste : **",song.author)
    embed.addField('**Demandé par **' + interaction.member.user.username, "")
    embed.setThumbnail(song.thumbnail)
    
    
    embed.send()
    

}, [{type: "FILE", name: "media", description: "Fichier audio à lire", required: true},
    {type:"BOOLEAN", name: "now", description: "Lire le média maintenant", required: false}]
)

module.exports = {command}