const { Command } = require('../Command');
const { Embed } = require('../Embed');

const command = new Command("help", "Affiche la liste des commandes", (client, interaction) => {
    
    const embed = new Embed()
    embed.setColor(0x03ff2d)
    embed.setTitle('Comment assister au concert ?')
    embed.setDescription("**Eh ! Tu as eu ton ticket ? Tant mieux ! Voici la liste des commandes à utiliser dans le salon prévu à cet effet !**")
    embed.addField('**Liste des commandes :**',"")
    client.commands.forEach(command => {
        let CommandName = command.data.name

        if (command.data.options) {
            command.data.options.forEach(option => {
                if (option.choices) {
                    let choices = []
                    option.choices.forEach(choice => {
                        choices.push(choice.name)
                    })
                    CommandName += " <" + choices.join(" | ") +">"
                }
            })
        } 

        embed.addField("/" + CommandName, command.data.description)
        
    })
    embed.addField("La queue et la gestion du redémarrage se fait par le site https://subsonics.raphix.fr/", ":star:" )
    embed.setThumbnail("https://static.wikia.nocookie.net/codelyoko/images/9/95/Subdigitals.jpg/revision/latest/scale-to-width-down/180?cb=20120105180510&path-prefix=fr");
    embed.send(interaction)
})

module.exports = {command}