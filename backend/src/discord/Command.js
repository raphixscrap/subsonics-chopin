const { SlashCommandBuilder} = require("discord.js");

class Command {
    name;
    description;
    callback;
    data;
    constructor(name, description, callback, options) {
        this.name = name
        this.description = description
        this.callback = callback
        this.options = options
        const SlashCommand = new SlashCommandBuilder()
        .setName(name)
        .setDescription(description)
        // Options is an array with the following structure: [{name: "name", description: "description", type: "type", required: true/false, choices: [{name: "name", value: "value"}]}]
        if (options) {
            options.forEach(SelOption => {
                if(SelOption.type === "STRING") {
                    SlashCommand.addStringOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "INTEGER") {
                    SlashCommand.addIntegerOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "BOOLEAN") {
                    SlashCommand.addBooleanOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "USER") {
                    SlashCommand.addUserOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "CHANNEL") {
                    SlashCommand.addChannelOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "ROLE") {
                    SlashCommand.addRoleOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "NUMBER") {
                    SlashCommand.addNumberOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "SUB_COMMAND") {
                    SlashCommand.addSubcommand(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "SUB_COMMAND_GROUP") {
                    SlashCommand.addSubcommandGroup(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "MENTIONABLE") {
                    SlashCommand.addMentionableOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }
                if(SelOption.type === "CHOICES") {
                    let choices = []
                    SelOption.choices.forEach(SelChoice => {
                        choices.push({name: SelChoice.name, value: SelChoice.value})
                    })
                    SlashCommand.addStringOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required).addChoices(choices))
                }
                if(SelOption.type === "FILE") {
                    SlashCommand.addAttachmentOption(option => option.setName(SelOption.name).setDescription(SelOption.description).setRequired(SelOption.required))
                }

            })
        }

        /**
         * @type {SlashCommandBuilder}
         * @param {Client} client
         * @param {Interaction} interaction
         */
        this.data = {data: SlashCommand,  async execute(client, interaction) {callback(client, interaction)}}
            
    }

    getData() {
        return this.data
    }

    getName() {
        return this.name
    }
}

module.exports = {Command}