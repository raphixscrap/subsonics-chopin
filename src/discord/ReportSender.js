const config = require("../utils/Database/Configuration");
const { __glob } = require("../utils/GlobalVars");
const discord = require("./Bot")
const {Embed} = require("./Embed")
const log = require("loguix")
const packageJson = require(__glob.PACKAGEINFO)

class Report {
    client = discord.getClient();
    report_channel = config.getReportChannel();
    report_contact = config.getReportContact();
    embed;
    constructor(provider, level, desc) {
        const embed = new Embed()
        embed.setDescription('**Version : **' + packageJson.version)
        embed.setTitle("Rapport de : " + provider)

        var levelString = null
        if(level == "bug") {
            levelString = "Bug"
            embed.setColor(0xc20f02)
        } else {
            levelString = "Suggestion"
            embed.setColor(20, 50, 200) // 
              
        }

        embed.addField("Type", levelString)
        embed.addField("Description", desc)
        this.embed = embed

    }

    async send() {
        if(!this.report_channel || this.report_channel == "") {
            log.getInstance("Discord").error("Pas de channel de rapport configuré")
            return false
        } else {
            const channel = await this.client.channels.fetch(this.report_channel)
            channel.send({embeds: [this.embed.build()]})
            if(this.report_contact && this.report_contact != "") channel.send({content: "<@" + this.report_contact + ">"})
            return true
        }
        
       
       
    }


}

module.exports = {Report}