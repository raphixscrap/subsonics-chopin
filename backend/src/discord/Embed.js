const { EmbedBuilder, ActionRowBuilder } = require("discord.js");

class Embed {
    fields;
    buttons;
    constructor (interaction, ephemeral) {
        this.embed = new EmbedBuilder().setTimestamp()
        this.fields = []
        this.buttons = []
        this.isSended = false
        if(interaction) {
            interaction.deferReply({ ephemeral: ephemeral }).then(() => {
                this.isSended = true
            })
            this.interaction = interaction
            this.ephemeral = ephemeral
        }
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

    addButton(button) {
        this.buttons.push(button)
        return this
    }   

    build() {
        //Add Fields to an object 
        this.embed.addFields(this.fields)
        if(this.buttons.length > 0) {
            this.actionRow = new ActionRowBuilder()
			.addComponents(this.buttons);
        }
        return this.embed
    }

    async send() {
        // Add a secutiry check to avoid sending an embed if the interaction is not defined and retry one again
        while(!this.isSended) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if(this.ephemeral === undefined) this.ephemeral = false;
        this.interaction.editReply({ embeds: [this.build()], components: this.buttons.length > 0 ? [this.actionRow] : [] })
    }

    async returnError(message) {
        this.setColor(150, 20, 20)
        this.setTitle('Erreur')
        this.setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Dialog-error-round.svg/2048px-Dialog-error-round.svg.png")
        this.setDescription(message)
        await this.send()
    }
}

class EmbedError extends Embed {
    constructor(message, interaction, ephemeral) {
        super(interaction, ephemeral)
        this.setColor(150, 20, 20)
        this.setTitle('Erreur')
        this.setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Dialog-error-round.svg/2048px-Dialog-error-round.svg.png")
        this.setDescription(message)
        this.send()
    }
}

module.exports = {Embed, EmbedError}