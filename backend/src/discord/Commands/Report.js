const { Command } = require('../Command');
const { Embed } = require('../Embed');
const { Report } = require('../ReportSender');

const command = new Command("report", "Signaler un problème avec le bot", (client, interaction) => {
    const report = new Report(interaction.user.username, interaction.options.getString("type"), interaction.options.getString("description"))
    const result = report.send()
    const embed = new Embed(interaction)
    

    result.then((res) => {
        if(!res) {
            embed.setColor(0xc20f02)
            embed.setTitle('Erreur')
            embed.setDescription("Une erreur est survenue lors de l'envoi du rapport")
            
        } else {
            embed.setColor(0x00ff66)
            embed.setTitle('Rapport envoyé')
            embed.setDescription("Votre rapport a bien été envoyé !")
           
        }
        embed.send()
    })
    
        
}, 
[{type: "CHOICES", name: "type", description: "Type", required: true, choices: 
    [{name: "Bug", value: "bug"}, 
     {name: "Suggestion", value: "sugguestion"}],
 }, 
 {type: "STRING", name: "description", description: "Description du problème", required: true}]

)

module.exports = {command}