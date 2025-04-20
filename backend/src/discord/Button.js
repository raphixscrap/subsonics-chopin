const { ButtonBuilder, ButtonStyle } = require('discord.js');

class Button extends ButtonBuilder {
    constructor(label, customId, style = ButtonStyle.Primary, link = null) {
        super()
            .setLabel(label)
            if (link) {
                this.setURL(link);
                this.setStyle(ButtonStyle.Link);
            } else{
                this.setCustomId(customId)
            }
            this.setStyle(style);
        
    }

    setDisabled(disabled) {
        return this.setDisabled(disabled);
    }

    setEmoji(emoji) {
        return this.setEmoji(emoji);
    }
}

module.exports = { Button };
