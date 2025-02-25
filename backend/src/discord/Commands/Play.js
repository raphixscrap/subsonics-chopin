const { Command } = require("../Command");
const { Embed, EmbedError } = require("../Embed");
const { Player } = require("../../player/Player");

const command = new Command("play", "Jouer une musique à partir d'un lien dans un salon vocal", (client, interaction) => {

    if(!interaction.member.voice.channel) return new EmbedError("Vous devez rejoindre un salon vocal pour jouer une musique !").send(interaction)

    const url = interaction.options.get("url")
    const channel = interaction.member.voice.channel
    
}, [{type: "STRING", name: "url", description: "Lien audio (Youtube / Soundclound / Spotify)", required: true}]
)

module.exports = {command}