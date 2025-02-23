const { EmbedBuilder } = require("discord.js");

class Embed {
    fields;
    constructor() {
        this.embed = new EmbedBuilder().setTimestamp()
        this.fields = []
    }

    setTitle(title) {
        this.embed.setTitle(title)
        return this
    }

    setDescription(description) {
        this.embed.setDescription(description)
        return this
    }

    setAuthor(author) {
        this.embed.setAuthor(author)
        return this
    }

    setColor(r, g, b) {
        // if only R is provided, set color with R as hex else set color with RGB
        if (g === undefined && b === undefined) {
            this.embed.setColor(r)
            return this
        } else {
            // Transforme r, g, b in one 0xRRGGBB value
            
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));

            // Shift the values to their respective positions in a 24-bit number
            const hexNumber = (r << 16) + (g << 8) + b;
            
            this.embed.setColor(hexNumber)
         
            
        }
        
         
    }

    setFooter(footer) {
        this.embed.setFooter(footer)
        return this
    }

    setImage(imageUrl) {
        this.embed.setImage(imageUrl)
        return this
    }

    setThumbnail(thumbnailUrl) {
        this.embed.setThumbnail(thumbnailUrl)
        return this
    }

    addBotPicture(client) {
        this.embed.setThumbnail("https://cdn.discordapp.com/avatars/" + client.user.id + "/" + client.user.avatar + ".png")
    }

    addField(name, value, inline) {
        if(!inline) inline = false;
        this.fields.push({name: name, value: value, inline: inline})
        return this
    }
    
    addColumn() {
        this.fields.push({name: '\u200B', value: '\u200B', inline: true})
        return this
    }

    build() {
        //Add Fields to an object 
        this.embed.addFields(this.fields)
        return this.embed
    }

    send(interaction) {
        interaction.reply({embeds: [this.build()]})
    }
}

module.exports = {Embed}